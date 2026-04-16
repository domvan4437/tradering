// app/api/user/route.js
import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { PLAN_LIMITS } from '../../../lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, email: true, name: true, plan: true,
      subscriptionStatus: true, trialEndsAt: true,
      screeningsToday: true, screeningsReset: true,
      _count: { select: { screenings: true, watchlist: true } },
    },
  })

  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free

  return Response.json({ ...user, limits })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name },
  })

  return Response.json({ success: true })
}
