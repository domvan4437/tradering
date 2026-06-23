import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
const BASE = 'https://testnet.binance.vision'

// Top pairs to scan for trades (Binance requires symbol per request)
const TOP_PAIRS = [
  'BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT',
  'ADAUSDT','DOGEUSDT','AVAXUSDT','DOTUSDT','MATICUSDT',
  'LINKUSDT','UNIUSDT','LTCUSDT','ATOMUSDT','NEARUSDT',
  'FTMUSDT','AAVEUSDT','SHIBUSDT','TRXUSDT','OPUSDT',
]

async function binanceGet(path, apiKey, secret, query = '') {
  const ts = Date.now()
  const qs = query ? `${query}&timestamp=${ts}` : `timestamp=${ts}`
  const sig = crypto.createHmac('sha256', secret).update(qs).digest('hex')
  const res = await fetch(`${BASE}${path}?${qs}&signature=${sig}`, {
    headers: { 'X-MBX-APIKEY': apiKey }
  })
  return res.json()
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: uid, broker: 'binance_testnet', status: 'connected' }
    })
    if (!connections.length) return Response.json({ error: 'No Binance connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      const { apiKey, apiSecret: secret } = conn
      try {
        // Get account to find non-zero balances (tells us which pairs were traded)
        const account = await binanceGet('/api/v3/account', apiKey, secret)
        const nonZero = (account.balances || [])
          .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .map(b => b.asset)
          .filter(a => a !== 'USDT' && a !== 'BNB')

        // Build pairs to scan: non-zero assets + top pairs
        const pairsToScan = new Set([
          ...nonZero.map(a => `${a}USDT`),
          ...TOP_PAIRS,
        ])

        const openBySymbol = {}
        const existingOpen = await prisma.brokerTrade.findMany({
          where: { connectionId: conn.id, status: 'open' },
          select: { id: true, symbol: true, entryPrice: true, quantity: true }
        })
        for (const t of existingOpen) openBySymbol[t.symbol] = t

        for (const symbol of pairsToScan) {
          try {
            const trades = await binanceGet('/api/v3/myTrades', apiKey, secret, `symbol=${symbol}&limit=50`)
            if (!Array.isArray(trades) || !trades.length) continue

            for (const trade of trades) {
              const exists = await prisma.brokerTrade.findFirst({
                where: { connectionId: conn.id, brokerTradeId: String(trade.id) }
              })
              if (exists) {
                if (exists.status === 'open') openBySymbol[symbol] = exists
                continue
              }

              const qty   = parseFloat(trade.qty)
              const price = parseFloat(trade.price)
              const ts    = new Date(trade.time)
              const isBuy = trade.isBuyer

              if (!price || !qty) continue

              if (isBuy) {
                const t = await prisma.brokerTrade.create({
                  data: {
                    connectionId: conn.id, userId: uid,
                    brokerTradeId: String(trade.id),
                    asset: 'Crypto', symbol,
                    direction: 'long', entryPrice: price, quantity: qty,
                    status: 'open', openedAt: ts,
                  }
                })
                openBySymbol[symbol] = t
                totalNew++
              } else {
                const open = openBySymbol[symbol]
                if (open) {
                  const pnl = +((price - open.entryPrice) * open.quantity).toFixed(4)
                  await prisma.brokerTrade.update({
                    where: { id: open.id },
                    data: { exitPrice: price, status: 'closed', closedAt: ts, realizedPnL: pnl }
                  })
                  delete openBySymbol[symbol]
                  totalNew++
                }
              }
            }
          } catch {}
        }

        await prisma.brokerConnection.update({ where: { id: conn.id }, data: { lastSynced: new Date() } })
      } catch (e) {
        console.error(`[binance/sync] ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
