import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const PAPER_BASE = 'https://paper-api.alpaca.markets'
const LIVE_BASE  = 'https://api.alpaca.markets'

function alpacaFetch(base, path, keyId, secretKey) {
  return fetch(`${base}${path}`, {
    headers: {
      'APCA-API-KEY-ID': keyId,
      'APCA-API-SECRET-KEY': secretKey,
    },
  }).then(r => r.json())
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    // Support syncing a specific connection or all Alpaca connections
    let connectionId = null
    try { const body = await request.json(); connectionId = body?.connectionId } catch {}

    const where = {
      userId: uid,
      broker: { in: ['alpaca_paper', 'alpaca_live'] },
      status: 'connected',
      ...(connectionId ? { id: connectionId } : {}),
    }

    const connections = await prisma.brokerConnection.findMany({ where })
    if (connections.length === 0) return Response.json({ error: 'No Alpaca connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      const base = conn.broker === 'alpaca_paper' ? PAPER_BASE : LIVE_BASE
      const { apiKey: keyId, apiSecret: secretKey } = conn

      try {
        // ── 1. Pull all filled orders (last 90 days) ──────────────────
        const after = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString()
        const orders = await alpacaFetch(
          base,
          `/v2/orders?status=filled&limit=500&direction=asc&after=${after}`,
          keyId, secretKey
        )

        if (!Array.isArray(orders)) continue

        // ── 2. Replay orders to open/close trades ─────────────────────
        // We process in chronological order: buy → opens trade, sell → closes it.
        const openBySymbol = {} // symbol → BrokerTrade id

        // First pass: load any already-open trades for this connection from DB
        const existingOpen = await prisma.brokerTrade.findMany({
          where: { connectionId: conn.id, status: 'open' },
          select: { id: true, symbol: true, entryPrice: true, quantity: true, direction: true, openedAt: true }
        })
        for (const t of existingOpen) {
          openBySymbol[t.symbol] = t
        }

        for (const order of orders) {
          // Skip if we already have this order recorded
          const alreadyExists = await prisma.brokerTrade.findFirst({
            where: { connectionId: conn.id, brokerTradeId: order.id }
          })
          if (alreadyExists) {
            // If it was the open leg, track it
            if (alreadyExists.status === 'open') {
              openBySymbol[alreadyExists.symbol] = alreadyExists
            }
            continue
          }

          const symbol   = order.symbol
          const qty      = Math.abs(parseFloat(order.filled_qty || order.qty || 1))
          const price    = parseFloat(order.filled_avg_price || order.limit_price || 0)
          const side     = order.side // 'buy' or 'sell'
          const filledAt = order.filled_at || order.updated_at || order.created_at

          if (!price || !qty) continue

          if (side === 'buy') {
            // Open a new long trade
            const trade = await prisma.brokerTrade.create({
              data: {
                connectionId: conn.id,
                userId: uid,
                brokerTradeId: order.id,
                asset: classifyAsset(symbol),
                symbol,
                direction: 'long',
                entryPrice: price,
                quantity: qty,
                status: 'open',
                openedAt: new Date(filledAt),
              }
            })
            openBySymbol[symbol] = trade
            totalNew++

          } else if (side === 'sell') {
            // Close the matching open trade
            const openTrade = openBySymbol[symbol]
            if (openTrade) {
              const pnl = +((price - openTrade.entryPrice) * openTrade.quantity).toFixed(4)
              await prisma.brokerTrade.update({
                where: { id: openTrade.id },
                data: {
                  exitPrice: price,
                  status: 'closed',
                  closedAt: new Date(filledAt),
                  realizedPnL: pnl,
                }
              })
              delete openBySymbol[symbol]
              totalNew++
            } else {
              // Sell with no matching open — record as standalone closed trade
              await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id,
                  userId: uid,
                  brokerTradeId: order.id,
                  asset: classifyAsset(symbol),
                  symbol,
                  direction: 'short',
                  entryPrice: price,
                  exitPrice: price,
                  quantity: qty,
                  status: 'closed',
                  openedAt: new Date(filledAt),
                  closedAt: new Date(filledAt),
                  realizedPnL: 0,
                }
              })
              totalNew++
            }
          }
        }

        // ── 3. Pull current open positions (catches anything we missed) ──
        const positions = await alpacaFetch(base, '/v2/positions', keyId, secretKey)

        if (Array.isArray(positions)) {
          for (const pos of positions) {
            const symbol = pos.symbol
            const qty    = Math.abs(parseFloat(pos.qty))
            const entry  = parseFloat(pos.avg_entry_price)
            const side   = pos.side // 'long' or 'short'

            // Check if we already have an open trade for this symbol
            const existing = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, symbol, status: 'open' }
            })
            if (!existing) {
              await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id,
                  userId: uid,
                  brokerTradeId: `pos-${symbol}-${Date.now()}`,
                  asset: classifyAsset(symbol),
                  symbol,
                  direction: side === 'short' ? 'short' : 'long',
                  entryPrice: entry,
                  quantity: qty,
                  status: 'open',
                  openedAt: new Date(),
                }
              })
              totalNew++
            }
          }
        }

        // Update lastSynced
        await prisma.brokerConnection.update({
          where: { id: conn.id },
          data: { lastSynced: new Date() }
        })

      } catch (e) {
        console.error(`[alpaca/sync] conn ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    console.error('[alpaca/sync]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

function classifyAsset(symbol) {
  const s = symbol.toUpperCase()
  if (s.includes('/')) return 'Crypto'
  if (['BTC','ETH','SOL','ADA','XRP','DOGE'].some(c => s.startsWith(c))) return 'Crypto'
  if (s.endsWith('=F') || ['ES','NQ','YM','CL','GC'].some(f => s.startsWith(f))) return 'Futures'
  return 'Stocks'
}
