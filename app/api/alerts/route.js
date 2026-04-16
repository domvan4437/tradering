// app/api/alerts/route.js
import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import { PLAN_LIMITS } from '../../../lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const alerts = await prisma.alert.findMany({ where: { userId: session.user.id } })
  return Response.json(alerts)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  const limits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free
  if (!limits.alerts) return Response.json({ error: 'Alerts require Pro plan.', code: 'UPGRADE_REQUIRED' }, { status: 403 })

  const { type, enabled } = await request.json()

  const alert = await prisma.alert.upsert({
    where: { userId: session.user.id, type } ,
    update: { enabled },
    create: { userId: session.user.id, type, enabled },
  })

  return Response.json(alert)
}
