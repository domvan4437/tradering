import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
const BASE = 'https://www.okx.com'

function okxSign(secret, ts, method, path, body = '') {
  return crypto.createHmac('sha256', secret).update(`${ts}${method}${path}${body}`).digest('base64')
}

async function okxGet(path, apiKey, secret, passphrase) {
  const ts = new Date().toISOString()
  const sig = okxSign(secret, ts, 'GET', path)
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey, 'OK-ACCESS-SIGN': sig,
      'OK-ACCESS-TIMESTAMP': ts, 'OK-ACCESS-PASSPHRASE': passphrase,
      'x-simulated-trading': '1', 'Content-Type': 'application/json',
    },
  })
  return res.json()
}

function classifyOkx(instType) {
  if (instType === 'SPOT')   return 'Crypto'
  if (instType === 'FUTURES' || instType === 'SWAP') return 'Crypto Futures'
  if (instType === 'OPTION') return 'Crypto Options'
  return 'Crypto'
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: uid, broker: 'okx_demo', status: 'connected' }
    })
    if (!connections.length) return Response.json({ error: 'No OKX connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      const { apiKey, apiSecret: secret, accountId: passphrase } = conn
      try {
        const openBySymbol = {}
        const existingOpen = await prisma.brokerTrade.findMany({
          where: { connectionId: conn.id, status: 'open' },
          select: { id: true, symbol: true, entryPrice: true, quantity: true }
        })
        for (const t of existingOpen) openBySymbol[t.symbol] = t

        // Closed orders across all instrument types
        for (const instType of ['SPOT', 'SWAP', 'FUTURES', 'OPTION']) {
          const data = await okxGet(`/api/v5/trade/orders-history?instType=${instType}&limit=100`, apiKey, secret, passphrase)
          if (data.code !== '0') continue

          const orders = [...(data.data || [])].reverse() // oldest first

          for (const order of orders) {
            if (order.state !== 'filled') continue

            const exists = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, brokerTradeId: order.ordId }
            })

            const symbol = order.instId
            const side   = order.side  // 'buy' or 'sell'
            const qty    = parseFloat(order.accFillSz || order.sz || 1)
            const price  = parseFloat(order.avgPx || order.px || 0)
            const ts     = new Date(parseInt(order.uTime || order.cTime))

            if (!price || !qty) continue

            if (side === 'buy') {
              if (!exists) {
                const trade = await prisma.brokerTrade.create({
                  data: {
                    connectionId: conn.id, userId: uid,
                    brokerTradeId: order.ordId,
                    asset: classifyOkx(instType),
                    symbol, direction: 'long',
                    entryPrice: price, quantity: qty,
                    status: 'open', openedAt: ts,
                  }
                })
                openBySymbol[symbol] = trade
                totalNew++
              } else if (exists.status === 'open') {
                openBySymbol[symbol] = exists
              }
            } else if (side === 'sell') {
              const open = openBySymbol[symbol]
              if (open) {
                const pnl = +((price - open.entryPrice) * open.quantity).toFixed(4)
                await prisma.brokerTrade.update({
                  where: { id: open.id },
                  data: { exitPrice: price, status: 'closed', closedAt: ts, realizedPnL: pnl }
                })
                delete openBySymbol[symbol]
                if (!exists) totalNew++
              } else if (!exists) {
                const trade = await prisma.brokerTrade.create({
                  data: {
                    connectionId: conn.id, userId: uid,
                    brokerTradeId: order.ordId,
                    asset: classifyOkx(instType),
                    symbol, direction: 'short',
                    entryPrice: price, quantity: qty,
                    status: 'open', openedAt: ts,
                  }
                })
                openBySymbol[symbol] = trade
                totalNew++
              }
            }
          }
        }

        // Open positions
        const posData = await okxGet('/api/v5/account/positions', apiKey, secret, passphrase)
        if (posData.code === '0') {
          for (const pos of posData.data || []) {
            if (parseFloat(pos.pos) === 0) continue
            const exists = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, symbol: pos.instId, status: 'open' }
            })
            if (!exists) {
              await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id, userId: uid,
                  brokerTradeId: `pos-${pos.instId}-${Date.now()}`,
                  asset: classifyOkx(pos.instType),
                  symbol: pos.instId,
                  direction: parseFloat(pos.pos) > 0 ? 'long' : 'short',
                  entryPrice: parseFloat(pos.avgPx || 0),
                  quantity: Math.abs(parseFloat(pos.pos)),
                  status: 'open', openedAt: new Date(),
                }
              })
              totalNew++
            }
          }
        }

        await prisma.brokerConnection.update({ where: { id: conn.id }, data: { lastSynced: new Date() } })
      } catch (e) {
        console.error(`[okx/sync] ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
