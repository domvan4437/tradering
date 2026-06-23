import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const BASE = 'https://api-testnet.bybit.com'

async function bybitGet(path, apiKey, secret, query = '') {
  const ts = Date.now()
  const recv = 5000
  const payload = `${ts}${apiKey}${recv}${query}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const url = `${BASE}${path}${query ? '?' + query : ''}`
  const res = await fetch(url, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sig,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': String(ts),
      'X-BAPI-RECV-WINDOW': String(recv),
    },
  })
  return res.json()
}

function classifyBybit(symbol, category) {
  if (category === 'linear' || category === 'inverse') return 'Crypto Futures'
  if (category === 'option') return 'Crypto Options'
  return 'Crypto'
}

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: uid, broker: 'bybit_testnet', status: 'connected' }
    })
    if (!connections.length) return Response.json({ error: 'No Bybit connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      const { apiKey, apiSecret: secret } = conn
      try {
        // Pull closed orders for spot + linear (perpetual futures) + inverse
        for (const category of ['spot', 'linear', 'inverse']) {
          const data = await bybitGet('/v5/order/history', apiKey, secret, `category=${category}&limit=50`)
          if (data.retCode !== 0) continue

          const orders = data.result?.list || []
          // Build open-trade tracker to match buy→sell pairs
          const openBySymbol = {}

          // Load existing open trades
          const existingOpen = await prisma.brokerTrade.findMany({
            where: { connectionId: conn.id, status: 'open' },
            select: { id: true, symbol: true, entryPrice: true, quantity: true, direction: true }
          })
          for (const t of existingOpen) openBySymbol[t.symbol] = t

          // Orders come newest-first; reverse for chronological processing
          for (const order of [...orders].reverse()) {
            if (order.orderStatus !== 'Filled') continue

            const exists = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, brokerTradeId: order.orderId }
            })

            const symbol    = order.symbol
            const side      = order.side     // 'Buy' or 'Sell'
            const qty       = parseFloat(order.qty || order.cumExecQty || 1)
            const price     = parseFloat(order.avgPrice || order.price || 0)
            const ts        = new Date(parseInt(order.updatedTime || order.createdTime))

            if (!price || !qty) continue

            if (side === 'Buy') {
              if (!exists) {
                const trade = await prisma.brokerTrade.create({
                  data: {
                    connectionId: conn.id, userId: uid,
                    brokerTradeId: order.orderId,
                    asset: classifyBybit(symbol, category),
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
            } else if (side === 'Sell') {
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
                    brokerTradeId: order.orderId,
                    asset: classifyBybit(symbol, category),
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

        // Pull open positions
        for (const category of ['linear', 'inverse', 'spot']) {
          const posData = await bybitGet('/v5/position/list', apiKey, secret, `category=${category}&limit=200`)
          if (posData.retCode !== 0) continue
          for (const pos of posData.result?.list || []) {
            if (parseFloat(pos.size) === 0) continue
            const exists = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, symbol: pos.symbol, status: 'open' }
            })
            if (!exists) {
              await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id, userId: uid,
                  brokerTradeId: `pos-${pos.symbol}-${Date.now()}`,
                  asset: classifyBybit(pos.symbol, category),
                  symbol: pos.symbol,
                  direction: pos.side === 'Sell' ? 'short' : 'long',
                  entryPrice: parseFloat(pos.avgPrice || pos.entryPrice || 0),
                  quantity: parseFloat(pos.size),
                  status: 'open', openedAt: new Date(),
                }
              })
              totalNew++
            }
          }
        }

        await prisma.brokerConnection.update({ where: { id: conn.id }, data: { lastSynced: new Date() } })
      } catch (e) {
        console.error(`[bybit/sync] ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
