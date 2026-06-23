import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { fetchPrices } from '../../../../lib/marketData'

export const dynamic = 'force-dynamic'

function calcAnalytics(trades, openUnrealizedPnL = 0) {
  const closed = trades.filter(t => t.status === 'closed')
  const open = trades.filter(t => t.status === 'open')
  const realizedPnL = closed.reduce((s, t) => s + (t.realizedPnL || 0), 0)
  const wins = closed.filter(t => (t.realizedPnL || 0) > 0).length
  const losses = closed.filter(t => (t.realizedPnL || 0) <= 0).length

  return {
    totalTrades: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    wins,
    losses,
    winRate: closed.length ? Math.round(wins / closed.length * 100) : 0,
    realizedPnL: +realizedPnL.toFixed(2),
    unrealizedPnL: +openUnrealizedPnL.toFixed(2),
    totalPnL: +(realizedPnL + openUnrealizedPnL).toFixed(2),
    bestTrade: closed.length ? +Math.max(...closed.map(t => t.realizedPnL || 0)).toFixed(2) : 0,
    worstTrade: closed.length ? +Math.min(...closed.map(t => t.realizedPnL || 0)).toFixed(2) : 0,
    avgPnL: closed.length ? +(realizedPnL / closed.length).toFixed(2) : 0,
  }
}

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { matchId } = params

    const match = await prisma.h2HMatch.findUnique({
      where: { id: matchId },
      include: {
        challenger: { select: { id: true, name: true, username: true, displayName: true } },
        opponent: { select: { id: true, name: true, username: true, displayName: true } },
        tournament: true,
      }
    })

    if (!match) return Response.json({ error: 'Not found' }, { status: 404 })
    const participants = [match.challengerId, match.opponentId].filter(Boolean)
    if (!participants.includes(uid)) return Response.json({ error: 'Access denied' }, { status: 403 })

    const challengeStart = match.startDate || match.tournament?.startDate || match.createdAt
    const challengeEnd = match.endDate || match.tournament?.endDate

    // Pull BrokerTrade records for all participants during the challenge window
    const trades = await prisma.brokerTrade.findMany({
      where: {
        userId: { in: participants },
        openedAt: { gte: challengeStart },
        ...(challengeEnd ? { openedAt: { lte: challengeEnd } } : {}),
      },
      include: {
        connection: { select: { broker: true, label: true } }
      },
      orderBy: { openedAt: 'desc' }
    })

    // Fetch current prices for open trades to get unrealized P&L
    const openTrades = trades.filter(t => t.status === 'open')
    let priceMap = {}
    if (openTrades.length > 0) {
      const symbols = [...new Set(openTrades.map(t => t.symbol))]
      try {
        priceMap = await fetchPrices(symbols) || {}
      } catch { /* price fetch failed */ }
    }

    // Enrich open trades with current price + unrealized PnL
    const enrichedTrades = trades.map(t => {
      if (t.status !== 'open') return t
      const currentPrice = priceMap[t.symbol]?.price || null
      if (!currentPrice) return { ...t, currentPrice: null, unrealizedPnL: null }
      const mult = t.direction === 'short' ? -1 : 1
      const unrealizedPnL = +((currentPrice - t.entryPrice) * t.quantity * mult).toFixed(2)
      return { ...t, currentPrice, unrealizedPnL }
    })

    const myTrades = enrichedTrades.filter(t => t.userId === uid)
    const opponentId = match.challengerId === uid ? match.opponentId : match.challengerId
    const theirTrades = opponentId ? enrichedTrades.filter(t => t.userId === opponentId) : []

    // Unrealized PnL totals
    const myUnrealized = myTrades.filter(t => t.status === 'open').reduce((s, t) => s + (t.unrealizedPnL || 0), 0)
    const theirUnrealized = theirTrades.filter(t => t.status === 'open').reduce((s, t) => s + (t.unrealizedPnL || 0), 0)

    const me = match.challengerId === uid ? match.challenger : match.opponent
    const opponent = match.challengerId === uid ? match.opponent : match.challenger

    // Fetch user's broker connections so UI knows what's connected
    const myConnections = await prisma.brokerConnection.findMany({
      where: { userId: uid, status: 'connected' },
      select: { id: true, broker: true, label: true, lastSynced: true }
    })

    return Response.json({
      match: {
        id: match.id,
        status: match.status,
        tournamentId: match.tournamentId,
        startDate: challengeStart,
        endDate: challengeEnd,
        buyIn: match.tournament?.buyIn || 0,
        asset: match.tournament?.assetClasses?.[0] || 'Any',
        description: match.tournament?.description || '',
        isChallenger: match.challengerId === uid,
      },
      me: { ...me, analytics: calcAnalytics(myTrades, myUnrealized) },
      opponent: opponent ? { ...opponent, analytics: calcAnalytics(theirTrades, theirUnrealized) } : null,
      myTrades,
      // Opponent trades: show all if match ended, otherwise hide open trades for fairness
      theirTrades: match.status === 'completed' ? theirTrades : theirTrades.filter(t => t.status === 'closed'),
      myConnections,
    })
  } catch (e) {
    console.error('[GET /api/challenges/[matchId]]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
