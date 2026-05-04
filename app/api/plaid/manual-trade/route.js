import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()

    // Find or create a manual connection for this user
    let conn = await prisma.brokerConnection.findFirst({
      where: { userId: session.user.id, broker: 'manual' }
    })
    if (!conn) {
      conn = await prisma.brokerConnection.create({
        data: { userId: session.user.id, broker: 'manual', label: 'Manual Entries', status: 'connected' }
      })
    }

    const trade = await prisma.brokerTrade.create({
      data: {
        connectionId: conn.id,
        userId: session.user.id,
        brokerTradeId: 'manual_' + Date.now(),
        asset: body.asset,
        symbol: body.asset,
        direction: body.direction || 'LONG',
        entryPrice: parseFloat(body.entry) || 0,
        exitPrice: body.exit ? parseFloat(body.exit) : null,
        quantity: 1,
        contractSize: 1,
        realizedPnL: body.pnl ? parseFloat(body.pnl) : null,
        status: body.exit ? 'closed' : 'open',
        openedAt: new Date(body.date || Date.now()),
        closedAt: body.exit ? new Date(body.date || Date.now()) : null,
      }
    })

    return Response.json({ trade })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    await prisma.brokerTrade.delete({ where: { id, userId: session.user.id } })
    return Response.json({ success: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
