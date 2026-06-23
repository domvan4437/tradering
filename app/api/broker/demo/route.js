import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const SAMPLE_TRADES = [
  { symbol: 'AAPL',   direction: 'long',  entryPrice: 182.50, exitPrice: 191.20, quantity: 10,  asset: 'Stocks',       daysAgo: 5 },
  { symbol: 'TSLA',   direction: 'long',  entryPrice: 245.00, exitPrice: 231.80, quantity: 5,   asset: 'Stocks',       daysAgo: 4 },
  { symbol: 'EURUSD', direction: 'long',  entryPrice: 1.0820, exitPrice: 1.0891, quantity: 1000, asset: 'Forex',       daysAgo: 3 },
  { symbol: 'BTCUSDT',direction: 'long',  entryPrice: 67200,  exitPrice: 69800,  quantity: 0.05, asset: 'Crypto',      daysAgo: 2 },
  { symbol: 'XAUUSD', direction: 'short', entryPrice: 2345.0, exitPrice: 2318.0, quantity: 1,   asset: 'Commodities',  daysAgo: 2 },
  { symbol: 'NVDA',   direction: 'long',  entryPrice: 875.00, exitPrice: null,   quantity: 3,   asset: 'Stocks',       daysAgo: 1 },
  { symbol: 'GBPUSD', direction: 'short', entryPrice: 1.2720, exitPrice: null,   quantity: 2000, asset: 'Forex',       daysAgo: 0 },
]

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    // Find or create a demo connection
    let conn = await prisma.brokerConnection.findFirst({
      where: { userId: uid, broker: 'demo' }
    })
    if (!conn) {
      conn = await prisma.brokerConnection.create({
        data: { userId: uid, broker: 'demo', label: 'Demo Account', apiKey: 'demo', apiSecret: 'demo', status: 'connected' }
      })
    }

    // Clear existing demo trades
    await prisma.brokerTrade.deleteMany({ where: { connectionId: conn.id } })

    // Seed sample trades
    const now = Date.now()
    for (const t of SAMPLE_TRADES) {
      const openedAt  = new Date(now - t.daysAgo * 86400000 - 3600000)
      const closedAt  = t.exitPrice ? new Date(now - t.daysAgo * 86400000) : null
      const realizedPnL = t.exitPrice
        ? +((t.exitPrice - t.entryPrice) * t.quantity * (t.direction === 'short' ? -1 : 1)).toFixed(2)
        : null

      await prisma.brokerTrade.create({
        data: {
          connectionId: conn.id,
          userId: uid,
          brokerTradeId: `demo-${t.symbol}-${Date.now()}-${Math.random()}`,
          asset: t.asset,
          symbol: t.symbol,
          direction: t.direction,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          quantity: t.quantity,
          status: t.exitPrice ? 'closed' : 'open',
          realizedPnL,
          openedAt,
          closedAt,
        }
      })
    }

    await prisma.brokerConnection.update({ where: { id: conn.id }, data: { lastSynced: new Date() } })

    return Response.json({ success: true, seeded: SAMPLE_TRADES.length })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const conn = await prisma.brokerConnection.findFirst({ where: { userId: uid, broker: 'demo' } })
    if (conn) {
      await prisma.brokerTrade.deleteMany({ where: { connectionId: conn.id } })
      await prisma.brokerConnection.delete({ where: { id: conn.id } })
    }
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
