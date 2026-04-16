import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const checklists = await prisma.checklist.findMany({
    where: { userId: session.user.id },
    include: { items: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(checklists)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, items } = await request.json()
  const checklist = await prisma.checklist.create({
    data: {
      userId: session.user.id,
      name,
      items: { create: (items || []).map((label, i) => ({ label, order: i })) },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return Response.json(checklist)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, name, items } = await request.json()
  // Delete old items and recreate
  await prisma.checklistItem.deleteMany({ where: { checklistId: id } })
  const checklist = await prisma.checklist.update({
    where: { id, userId: session.user.id },
    data: {
      name,
      items: { create: (items || []).map((label, i) => ({ label, order: i })) },
    },
    include: { items: { orderBy: { order: 'asc' } } },
  })
  return Response.json(checklist)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.checklist.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
