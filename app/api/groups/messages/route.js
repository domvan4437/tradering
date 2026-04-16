import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const messages = await prisma.groupMessage.findMany({
    where: { channelId },
    include: { user: { select: { id: true, name: true, username: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50
  })
  return Response.json({ messages })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { channelId, content } = await request.json()
  const channel = await prisma.groupChannel.findUnique({ where: { id: channelId }, select: { groupId: true } })
  if (!channel) return Response.json({ error: 'Channel not found' }, { status: 404 })
  const isMember = await prisma.groupMember.findFirst({ where: { groupId: channel.groupId, userId: session.user.id } })
  if (!isMember) return Response.json({ error: 'Not a member' }, { status: 403 })
  const message = await prisma.groupMessage.create({
    data: { channelId, userId: session.user.id, content },
    include: { user: { select: { id: true, name: true, username: true } } }
  })
  return Response.json({ message })
}
