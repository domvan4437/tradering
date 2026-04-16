// app/api/screenings/route.js
import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const screenings = await prisma.screening.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return Response.json(screenings)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const screening = await prisma.screening.create({
    data: {
      userId: session.user.id,
      commodity: body.commodity,
      direction: body.direction,
      passed: body.passed,
      stageFailed: body.stagesFailed,
      stagesCompleted: body.stagesCompleted,
      price: body.price,
      marketData: body.marketData || {},
      results: body.results || [],
    },
  })
  return Response.json(screening)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, notes, outcome } = await request.json()
  const screening = await prisma.screening.update({
    where: { id, userId: session.user.id },
    data: { notes, outcome },
  })
  return Response.json(screening)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  await prisma.screening.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
