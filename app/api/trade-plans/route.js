import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const plans = await prisma.tradePlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ plans })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const plan = await prisma.tradePlan.create({
    data: { userId: session.user.id, ...body }
  })
  return Response.json({ plan })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...data } = await request.json()
  const plan = await prisma.tradePlan.update({ where: { id }, data })
  return Response.json({ plan })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.tradePlan.delete({ where: { id } })
  return Response.json({ deleted: true })
}
