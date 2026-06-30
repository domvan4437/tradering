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
    const isPaid = (match.tournament?.buyIn || 0) > 0
    const opponentId = match.challengerId === uid ? match.opponentId : match.challengerId
    const me = match.challengerId === uid ? match.challenger : match.opponent
    const opponent = match.challengerId === uid ? match.opponent : match.challenger

    let myAnalytics, opponentAnalytics, myTrades = [], theirTrades = [], myConnections = []

    if (!isPaid) {
      // ── FREE MATCH: scores from paper trading engine ──────────────────────────
      const portfolios = await prisma.competitionPortfolio.findMany({
        where: { competitionId: matchId, userId: { in: participants } },
        include: {
          positions: true,
          trades: { orderBy: { closedAt: 'desc' } },
        }
      })

      const calcPaperAnalytics = (portfolio) => {
        if (!portfolio) return { totalPnL: 0, realizedPnL: 0, unrealizedPnL: 0, totalTrades: 0, openTrades: 0, closedTrades: 0, wins: 0, losses: 0, winRate: 0, bestTrade: 0, worstTrade: 0, avgPnL: 0 }
        const trades = portfolio.trades || []
        const positions = portfolio.positions || []
        const realizedPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0)
        const unrealizedPnL = positions.reduce((s, p) => {
          const mult = p.direction === 'short' ? -1 : 1
          return s + (p.currentPrice - p.entryPrice) * p.quantity * mult
        }, 0)
        const wins = trades.filter(t => t.pnl > 0).length
        const losses = trades.filter(t => t.pnl <= 0).length
        return {
          totalPnL: +(realizedPnL + unrealizedPnL).toFixed(2),
          realizedPnL: +realizedPnL.toFixed(2),
          unrealizedPnL: +unrealizedPnL.toFixed(2),
          totalTrades: trades.length + positions.length,
          openTrades: positions.length,
          closedTrades: trades.length,
          wins,
          losses,
          winRate: trades.length ? Math.round(wins / trades.length * 100) : 0,
          bestTrade: trades.length ? +Math.max(...trades.map(t => t.pnl || 0)).toFixed(2) : 0,
          worstTrade: trades.length ? +Math.min(...trades.map(t => t.pnl || 0)).toFixed(2) : 0,
          avgPnL: trades.length ? +(realizedPnL / trades.length).toFixed(2) : 0,
        }
      }

      const myPortfolio = portfolios.find(p => p.userId === uid)
      const theirPortfolio = opponentId ? portfolios.find(p => p.userId === opponentId) : null

      myAnalytics = calcPaperAnalytics(myPortfolio)
      opponentAnalytics = theirPortfolio ? calcPaperAnalytics(theirPortfolio) : null

    } else {
      // ── PAID MATCH: scores from real broker trades ────────────────────────────
      const trades = await prisma.brokerTrade.findMany({
        where: {
          userId: { in: participants },
          openedAt: { gte: challengeStart },
          ...(challengeEnd ? { openedAt: { lte: challengeEnd } } : {}),
        },
        include: { connection: { select: { broker: true, label: true } } },
        orderBy: { openedAt: 'desc' }
      })

      const openTrades = trades.filter(t => t.status === 'open')
      let priceMap = {}
      if (openTrades.length > 0) {
        const symbols = [...new Set(openTrades.map(t => t.symbol))]
        try { priceMap = await fetchPrices(symbols) || {} } catch {}
      }

      const enriched = trades.map(t => {
        if (t.status !== 'open') return t
        const currentPrice = priceMap[t.symbol]?.price || null
        if (!currentPrice) return { ...t, currentPrice: null, unrealizedPnL: null }
        const mult = t.direction === 'short' ? -1 : 1
        return { ...t, currentPrice, unrealizedPnL: +((currentPrice - t.entryPrice) * t.quantity * mult).toFixed(2) }
      })

      myTrades = enriched.filter(t => t.userId === uid)
      theirTrades = opponentId ? enriched.filter(t => t.userId === opponentId) : []

      const myUnrealized = myTrades.filter(t => t.status === 'open').reduce((s, t) => s + (t.unrealizedPnL || 0), 0)
      const theirUnrealized = theirTrades.filter(t => t.status === 'open').reduce((s, t) => s + (t.unrealizedPnL || 0), 0)

      myAnalytics = calcAnalytics(myTrades, myUnrealized)
      opponentAnalytics = opponent ? calcAnalytics(theirTrades, theirUnrealized) : null

      // hide opponent open trades during active match
      if (match.status !== 'completed') theirTrades = theirTrades.filter(t => t.status === 'closed')

      myConnections = await prisma.brokerConnection.findMany({
        where: { userId: uid, status: 'connected' },
        select: { id: true, broker: true, label: true, lastSynced: true }
      })
    }

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
      me: { ...me, analytics: myAnalytics },
      opponent: opponent ? { ...opponent, analytics: opponentAnalytics } : null,
      myTrades,
      theirTrades,
      myConnections,
    })
  } catch (e) {
    console.error('[GET /api/challenges/[matchId]]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
