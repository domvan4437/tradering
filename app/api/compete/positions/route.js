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
    if (!competitionId) return Response.json({ error: 'competitionId required' }, { status: 400 })

    const portfolio = await prisma.competitionPortfolio.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
      include: {
        positions: { orderBy: { openedAt: 'desc' } },
        orders: {
          where: { status: 'pending' },
          orderBy: { submittedAt: 'desc' },
        },
      },
    })

    if (!portfolio) {
      return Response.json({ positions: [], orders: [], portfolio: null })
    }

    // Fetch live prices for all open positions
    let priceMap = {}
    if (portfolio.positions.length > 0) {
      const symbols = [...new Set(portfolio.positions.map(p => p.symbol))]
      priceMap = await fetchBatchQuotes(symbols)
    }

    const positions = portfolio.positions.map(pos => {
      const currentPrice = priceMap[pos.symbol]?.price || pos.currentPrice || pos.entryPrice
      const { pnl, pnlPct } = calcPnl(pos.direction, pos.entryPrice, currentPrice, pos.quantity, pos.leverage)
      return {
        id: pos.id,
        symbol: pos.symbol,
        symbolName: pos.symbolName,
        assetType: pos.assetType,
        direction: pos.direction,
        quantity: pos.quantity,
        leverage: pos.leverage,
        entryPrice: pos.entryPrice,
        currentPrice,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        openedAt: pos.openedAt,
        pnl,
        pnlPct,
        cashLocked: pos.quantity / pos.leverage, // margin reserved
      }
    })

    const orders = portfolio.orders.map(o => ({
      id: o.id,
      symbol: o.symbol,
      symbolName: o.symbolName,
      assetType: o.assetType,
      direction: o.direction,
      quantity: o.quantity,
      leverage: o.leverage,
      orderType: o.orderType,
      limitPrice: o.limitPrice,
      stopLoss: o.stopLoss,
      takeProfit: o.takeProfit,
      status: o.status,
      submittedAt: o.submittedAt,
      canFillAfter: o.canFillAfter,
    }))

    const unrealizedPnl = positions.reduce((sum, p) => sum + p.pnl, 0)
    const equity = portfolio.cash + unrealizedPnl
    const returnPct = ((equity - portfolio.startingCash) / portfolio.startingCash) * 100

    return Response.json({
      positions,
      orders,
      portfolio: {
        id: portfolio.id,
        cash: portfolio.cash,
        startingCash: portfolio.startingCash,
        equity,
        unrealizedPnl,
        returnPct,
        isLiquidated: portfolio.isLiquidated,
        status: portfolio.status,
      },
    })
  } catch (e) {
    console.error('[GET /api/compete/positions]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
