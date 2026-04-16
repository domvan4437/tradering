import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { connectionId } = await request.json()

  const connection = await prisma.brokerConnection.findUnique({
    where: { id: connectionId, userId: session.user.id }
  })
  if (!connection) return Response.json({ error: 'Connection not found' }, { status: 404 })

  let newTrades = [], errors = []

  try {
    if (connection.broker === 'alpaca') {
      newTrades = await syncAlpaca(connection)
    } else if (connection.broker === 'tradovate') {
      newTrades = await syncTradovate(connection)
    } else if (connection.broker === 'ibkr') {
      return Response.json({ message: 'IBKR sync requires TWS Gateway setup. Use manual trade entry for now.', newTrades: 0 })
    } else if (connection.broker === 'schwab') {
      return Response.json({ message: 'Schwab sync coming soon — OAuth setup required.', newTrades: 0 })
    }

    // Save new trades to DB
    let saved = 0
    for (const trade of newTrades) {
      try {
        await prisma.brokerTrade.upsert({
          where: { connectionId_brokerTradeId: { connectionId: connection.id, brokerTradeId: trade.brokerTradeId } },
          update: { exitPrice: trade.exitPrice, realizedPnL: trade.realizedPnL, status: trade.status, closedAt: trade.closedAt },
          create: { connectionId: connection.id, userId: session.user.id, ...trade }
        })
        saved++
      } catch {}
    }

    // Auto-enter closed trades into active competitions
    // Always attempt auto-enter; the function checks per-competition settings
    await autoEnterCompetitions(session.user.id, connection, newTrades.filter(t => t.status === 'open'))

    await prisma.brokerConnection.update({ where: { id: connection.id }, data: { lastSynced: new Date(), status: 'connected' } })
    return Response.json({ synced: saved, newTrades: newTrades.length })
  } catch (e) {
    await prisma.brokerConnection.update({ where: { id: connection.id }, data: { status: 'error' } })
    return Response.json({ error: e.message }, { status: 500 })
  }
}

async function syncAlpaca(connection) {
  const base = connection.apiKey?.startsWith('PK') ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets'
  const headers = { 'APCA-API-KEY-ID': connection.apiKey, 'APCA-API-SECRET-KEY': connection.apiSecret }

  // Get recent orders
  const res = await fetch(`${base}/v2/orders?status=all&limit=50&direction=desc`, { headers })
  if (!res.ok) throw new Error('Alpaca API error')
  const orders = await res.json()

  return orders
    .filter(o => o.status === 'filled' || o.status === 'partially_filled')
    .map(o => ({
      brokerTradeId: o.id,
      asset: o.symbol,
      symbol: o.symbol,
      direction: o.side === 'buy' ? 'LONG' : 'SHORT',
      entryPrice: parseFloat(o.filled_avg_price || o.limit_price || 0),
      exitPrice: null,
      quantity: parseFloat(o.filled_qty || o.qty || 1),
      contractSize: 1,
      realizedPnL: null,
      status: 'open',
      openedAt: new Date(o.filled_at || o.submitted_at),
      closedAt: null,
    }))
}

async function syncTradovate(connection) {
  const headers = { 'Authorization': `Bearer ${connection.apiKey}`, 'Content-Type': 'application/json' }
  const res = await fetch('https://live.tradovateapi.com/v1/position/list', { headers })
  if (!res.ok) throw new Error('Tradovate API error')
  const positions = await res.json()

  // Also get fills
  const fillsRes = await fetch('https://live.tradovateapi.com/v1/fill/list', { headers })
  const fills = fillsRes.ok ? await fillsRes.json() : []

  const trades = []
  for (const pos of positions) {
    if (pos.netPos === 0) continue
    trades.push({
      brokerTradeId: `pos_${pos.id}`,
      asset: pos.contractId?.toString() || 'Unknown',
      symbol: pos.contractId?.toString() || 'UNK',
      direction: pos.netPos > 0 ? 'LONG' : 'SHORT',
      entryPrice: pos.netPrice || 0,
      exitPrice: null,
      quantity: Math.abs(pos.netPos),
      contractSize: 1,
      realizedPnL: pos.realizedPnl || null,
      status: 'open',
      openedAt: new Date(),
      closedAt: null,
    })
  }
  return trades
}

async function autoEnterCompetitions(userId, connection, trades) {
  // Find active competitions the user is in
  const entries = await prisma.tournamentEntry.findMany({
    where: { userId },
    include: { tournament: true, _count: false }
  })

  const active = entries.filter(e => {
    const t = e.tournament
    const isActive = t.status === 'active' || (t.status === 'open' && new Date(t.startDate) <= new Date())
    return isActive && e.autoBrokerSync === true  // only if user enabled per-competition
  })

  for (const trade of trades) {
    for (const entry of active) {
      const t = entry.tournament
      // Check if asset matches tournament rules
      const allowed = t.assetClasses.includes('any') || t.assetClasses.some(a =>
        trade.asset.toLowerCase().includes(a.toLowerCase())
      )
      if (!allowed) continue

      // Check daily call limit
      const today = new Date(); today.setHours(0,0,0,0)
      const todayCount = await prisma.tradeCall.count({ where: { entryId: entry.id, submittedAt: { gte: today } } })
      if (todayCount >= t.maxCallsPerDay) continue

      // Create TradeCall from broker trade
      const risk = trade.entryPrice > 0 ? trade.entryPrice * 0.02 : 1 // 2% default stop if not set
      await prisma.tradeCall.create({
        data: {
          entryId: entry.id, tournamentId: t.id, userId,
          asset: trade.asset, symbol: trade.symbol, direction: trade.direction,
          entryPrice: trade.entryPrice,
          stopPrice: trade.direction === 'LONG' ? trade.entryPrice - risk : trade.entryPrice + risk,
          targetPrice: trade.direction === 'LONG' ? trade.entryPrice + (risk*2) : trade.entryPrice - (risk*2),
          currentPrice: trade.entryPrice,
          contracts: trade.quantity, contractSize: trade.contractSize,
          dollarRisk: risk * trade.quantity * trade.contractSize,
          isRealMoney: true,
          expiresAt: new Date(t.endDate),
        }
      }).catch(() => {}) // skip if already exists
    }
  }
}
