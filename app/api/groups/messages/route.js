import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const channelId = searchParams.get('channelId')
  const messages = await prisma.groupMessage.findMany({
    where: { channelId },
    include: { user: { select: { id: true, name: true, username: true, displayName: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100
  })
  return Response.json({
    messages: messages.map(m => ({
      id: m.id,
      userId: m.userId,
      channelId: m.channelId,
      content: m.content,
      createdAt: m.createdAt,
      authorName: m.user?.displayName || m.user?.username || m.user?.name || 'Trader',
      authorImage: `/api/avatar/${m.userId}`,
    }))
  })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { channelId, content } = await request.json()
  const channel = await prisma.groupChannel.findUnique({ where: { id: channelId }, select: { groupId: true } })
  if (!channel) return Response.json({ error: 'Channel not found' }, { status: 404 })
  const [isMember, isOwner] = await Promise.all([
    prisma.groupMember.findFirst({ where: { groupId: channel.groupId, userId: session.user.id } }),
    prisma.group.findFirst({ where: { id: channel.groupId, ownerId: session.user.id } }),
  ])
  if (!isMember && !isOwner) return Response.json({ error: 'Not a member' }, { status: 403 })
  const message = await prisma.groupMessage.create({
    data: { channelId, userId: session.user.id, content },
    include: { user: { select: { id: true, name: true, username: true, displayName: true } } }
  })
  return Response.json({
    message: {
      id: message.id,
      userId: message.userId,
      channelId: message.channelId,
      content: message.content,
      createdAt: message.createdAt,
      authorName: message.user?.displayName || message.user?.username || message.user?.name || 'Trader',
      authorImage: `/api/avatar/${message.userId}`,
    }
  })
}
