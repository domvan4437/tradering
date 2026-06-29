import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { fetchQuote, applySlippage, calcPnl } from '../../../../lib/competitionPrices'

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await req.json()
    const { positionId, reason = 'manual' } = body
    if (!positionId) return Response.json({ error: 'positionId required' }, { status: 400 })

    // Verify position belongs to this user
    const position = await prisma.competitionPosition.findFirst({
      where: { id: positionId, userId },
      include: { portfolio: true },
    })
    if (!position) return Response.json({ error: 'Position not found' }, { status: 404 })
    if (position.portfolio.isLiquidated && reason === 'manual') {
      return Response.json({ error: 'Account is liquidated' }, { status: 400 })
    }

    // Fetch server-side exit price (anti-cheat — client cannot supply price)
    const quote = await fetchQuote(position.symbol)
    const exitPrice = applySlippage(quote.price, position.direction === 'long' ? 'short' : 'long', position.assetType)

    const { pnl, pnlPct } = calcPnl(
      position.direction,
      position.entryPrice,
      exitPrice,
      position.quantity,
      position.leverage,
    )

    // Cash to return = original margin (quantity / leverage) + realized P&L
    const marginReturned = position.quantity / position.leverage
    const cashReturn = marginReturned + pnl

    await prisma.$transaction([
      // Create trade record
      prisma.competitionTrade.create({
        data: {
          portfolioId: position.portfolioId,
          competitionId: position.competitionId,
          userId,
          positionId: position.id,
          symbol: position.symbol,
          symbolName: position.symbolName,
          assetType: position.assetType,
          direction: position.direction,
          quantity: position.quantity,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
          exitPrice,
          openedAt: position.openedAt,
          closedAt: new Date(),
          closeReason: reason,
          pnl,
          pnlPct,
        },
      }),
      // Delete open position
      prisma.competitionPosition.delete({ where: { id: positionId } }),
      // Return cash to portfolio
      prisma.competitionPortfolio.update({
        where: { id: position.portfolioId },
        data: { cash: { increment: cashReturn }, updatedAt: new Date() },
      }),
    ])

    return Response.json({
      success: true,
      exitPrice,
      pnl,
      pnlPct,
      cashReturned: cashReturn,
    })
  } catch (e) {
    console.error('[POST /api/compete/close]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
