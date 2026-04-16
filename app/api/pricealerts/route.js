import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(alerts)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const alert = await prisma.priceAlert.create({
    data: {
      userId: session.user.id,
      symbol: body.symbol,
      name: body.name || body.symbol,
      condition: body.condition,
      value: body.value ? parseFloat(body.value) : null,
      message: body.message || '',
      enabled: true,
    },
  })
  return Response.json(alert)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await request.json()
  const alert = await prisma.priceAlert.update({
    where: { id, userId: session.user.id },
    data: updates,
  })
  return Response.json(alert)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.priceAlert.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
