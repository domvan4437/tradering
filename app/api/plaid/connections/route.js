import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { brokerTrades: true } } }
    })

    const trades = await prisma.brokerTrade.findMany({
      where: { userId: session.user.id },
      orderBy: { openedAt: 'desc' },
      take: 200,
    })

    const total = trades.length
    const closed = trades.filter(t => t.status === 'closed' && t.realizedPnL != null)
    const wins = closed.filter(t => t.realizedPnL > 0)
    const totalPnL = closed.reduce((s,t) => s + (t.realizedPnL || 0), 0)
    const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : null

    return Response.json({ connections, trades, stats: { total, totalPnL, winRate, wins: wins.length, losses: closed.length - wins.length } })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { connectionId } = await request.json()
    await prisma.brokerConnection.delete({ where: { id: connectionId, userId: session.user.id } })
    return Response.json({ success: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
