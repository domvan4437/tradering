import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { calcPnl, fetchBatchQuotes } from '../../../../lib/competitionPrices'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const myUserId = session.user.id

    const { searchParams } = new URL(req.url)
    const competitionId = searchParams.get('competitionId')
    if (!competitionId) return Response.json({ error: 'competitionId required' }, { status: 400 })

    const portfolios = await prisma.competitionPortfolio.findMany({
      where: { competitionId },
      include: {
        user: { select: { id: true, displayName: true, name: true, username: true, image: true, profileSlug: true } },
        positions: true,
        trades: true,
      },
    })

    if (portfolios.length === 0) return Response.json({ entries: [] })

    // Collect all unique symbols across all portfolios
    const allSymbols = [...new Set(portfolios.flatMap(p => p.positions.map(pos => pos.symbol)))]
    const prices = allSymbols.length > 0 ? await fetchBatchQuotes(allSymbols) : {}

    const entries = portfolios.map(p => {
      const unrealizedPnl = p.positions.reduce((sum, pos) => {
        const currentPrice = prices[pos.symbol]?.price || pos.currentPrice || pos.entryPrice
        const { pnl } = calcPnl(pos.direction, pos.entryPrice, currentPrice, pos.quantity, pos.leverage)
        return sum + pnl
      }, 0)

      const equity = p.cash + unrealizedPnl
      const returnPct = ((equity - p.startingCash) / p.startingCash) * 100

      const wins = p.trades.filter(t => t.pnl > 0).length
      const totalTrades = p.trades.length
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0
      const realizedPnl = p.trades.reduce((sum, t) => sum + t.pnl, 0)

      return {
        userId: p.userId,
        isMe: p.userId === myUserId,
        displayName: p.user.displayName || p.user.name || p.user.username || 'Trader',
        image: p.user.image || null,
        profileSlug: p.user.profileSlug || p.user.username || null,
        startingCash: p.startingCash,
        cash: p.cash,
        equity,
        unrealizedPnl,
        realizedPnl,
        returnPct,
        openPositions: p.positions.length,
        totalTrades,
        winRate,
        isLiquidated: p.isLiquidated,
      }
    })

    // Sort by equity (highest first)
    entries.sort((a, b) => b.equity - a.equity)
    entries.forEach((e, i) => { e.rank = i + 1 })

    return Response.json({ entries })
  } catch (e) {
    console.error('[GET /api/compete/leaderboard]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
