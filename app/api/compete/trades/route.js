import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const competitionId = searchParams.get('competitionId')
    if (!competitionId) return Response.json({ error: 'competitionId required' }, { status: 400 })

    const trades = await prisma.competitionTrade.findMany({
      where: { competitionId, userId },
      orderBy: { closedAt: 'desc' },
      take: 50,
    })

    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0)
    const wins = trades.filter(t => t.pnl > 0).length
    const losses = trades.filter(t => t.pnl < 0).length
    const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0

    return Response.json({
      trades: trades.map(t => ({
        id: t.id,
        symbol: t.symbol,
        symbolName: t.symbolName,
        assetType: t.assetType,
        direction: t.direction,
        quantity: t.quantity,
        leverage: t.leverage,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        openedAt: t.openedAt,
        closedAt: t.closedAt,
        closeReason: t.closeReason,
        pnl: t.pnl,
        pnlPct: t.pnlPct,
      })),
      stats: { totalPnl, wins, losses, winRate, totalTrades: trades.length },
    })
  } catch (e) {
    console.error('[GET /api/compete/trades]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
