// app/api/watchlist/route.js
import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { PLAN_LIMITS } from '../../../lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const items = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(items.map(i => i.commodity))
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free
  if (!limits.watchlist) return Response.json({ error: 'Watchlist requires Pro plan. Upgrade to unlock.', code: 'UPGRADE_REQUIRED' }, { status: 403 })

  const { commodity } = await request.json()
  await prisma.watchlistItem.upsert({
    where: { userId_commodity: { userId: session.user.id, commodity } },
    update: {},
    create: { userId: session.user.id, commodity },
  })
  return Response.json({ success: true })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { commodity } = await request.json()
  await prisma.watchlistItem.deleteMany({ where: { userId: session.user.id, commodity } })
  return Response.json({ success: true })
}
