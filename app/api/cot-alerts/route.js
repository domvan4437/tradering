import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const alerts = await prisma.cOTAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  })
  return Response.json({ alerts })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { commodity, condition, threshold, label } = await request.json()
  const alert = await prisma.cOTAlert.create({
    data: { userId: session.user.id, commodity, condition, threshold: parseInt(threshold), label }
  })
  return Response.json({ alert })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.cOTAlert.delete({ where: { id, userId: session.user.id } })
  return Response.json({ deleted: true })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, enabled } = await request.json()
  const alert = await prisma.cOTAlert.update({ where: { id }, data: { enabled } })
  return Response.json({ alert })
}
