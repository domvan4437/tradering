import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const convos = await prisma.aIConversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: { messages: { take: 1, orderBy: { createdAt: 'asc' } } },
  })
  return Response.json(convos)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { title } = await request.json()
  const convo = await prisma.aIConversation.create({
    data: { userId: session.user.id, title: title || 'New Conversation' },
    include: { messages: true },
  })
  return Response.json(convo)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, title } = await request.json()
  const convo = await prisma.aIConversation.update({
    where: { id, userId: session.user.id },
    data: { title },
  })
  return Response.json(convo)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.aIConversation.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
