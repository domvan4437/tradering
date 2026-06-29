import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { calcPnl, fetchBatchQuotes } from '../../../../lib/competitionPrices'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const competitionId = searchParams.get('competitionId')
    const competitionType = searchParams.get('competitionType') || 'h2h'
    if (!competitionId) return Response.json({ error: 'competitionId required' }, { status: 400 })

    let portfolio = await prisma.competitionPortfolio.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
      include: { positions: true },
    })

    if (!portfolio) {
      // Auto-create: use endDate from query param if provided
      const endDateParam = searchParams.get('endDate')
      portfolio = await prisma.competitionPortfolio.create({
        data: {
          competitionId,
          competitionType,
          userId,
          startingCash: 10000,
          cash: 10000,
          endDate: endDateParam ? new Date(endDateParam) : null,
          status: 'active',
        },
        include: { positions: true },
      })
    }

    // Calculate live equity from open positions
    let unrealizedPnl = 0
    if (portfolio.positions.length > 0) {
      const symbols = [...new Set(portfolio.positions.map(p => p.symbol))]
      const prices = await fetchBatchQuotes(symbols)

      for (const pos of portfolio.positions) {
        const currentPrice = prices[pos.symbol]?.price || pos.currentPrice || pos.entryPrice
        const { pnl } = calcPnl(pos.direction, pos.entryPrice, currentPrice, pos.quantity, pos.leverage)
        unrealizedPnl += pnl
      }
    }

    const equity = portfolio.cash + unrealizedPnl
    const returnPct = ((equity - portfolio.startingCash) / portfolio.startingCash) * 100

    return Response.json({
      portfolio: {
        id: portfolio.id,
        competitionId: portfolio.competitionId,
        competitionType: portfolio.competitionType,
        startingCash: portfolio.startingCash,
        cash: portfolio.cash,
        unrealizedPnl,
        equity,
        returnPct,
        isLiquidated: portfolio.isLiquidated,
        status: portfolio.status,
        openPositions: portfolio.positions.length,
        endDate: portfolio.endDate,
      },
    })
  } catch (e) {
    console.error('[GET /api/compete/portfolio]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
