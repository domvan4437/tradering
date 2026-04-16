import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// Key levels stored as a special Idea type for simplicity
export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const levels = await prisma.idea.findMany({
    where: { userId: session.user.id, tags: { has: '__keylevel__' } },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(levels.map(l => ({
    id: l.id,
    symbol: l.symbol,
    name: l.title,
    type: l.direction,      // SUPPORT or RESISTANCE or PIVOT
    price: parseFloat(l.entry || '0'),
    notes: l.thesis,
    createdAt: l.createdAt,
  })))
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { symbol, name, type, price, notes } = await request.json()

  const level = await prisma.idea.create({
    data: {
      userId: session.user.id,
      title: name || `${symbol} ${type} at ${price}`,
      symbol,
      direction: type || 'SUPPORT',
      entry: String(price),
      thesis: notes || '',
      status: 'watching',
      tags: ['__keylevel__'],
    },
  })

  return Response.json({ id: level.id, symbol: level.symbol, name: level.title, type: level.direction, price, notes: level.thesis, createdAt: level.createdAt })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await prisma.idea.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
