import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const withUserId = searchParams.get('userId')

  if (withUserId) {
    const messages = await prisma.directMessage.findMany({
      where: { OR: [
        { fromUserId: session.user.id, toUserId: withUserId },
        { fromUserId: withUserId, toUserId: session.user.id }
      ]},
      orderBy: { createdAt: 'asc' },
      include: { fromUser: { select: { id: true, name: true, username: true } } }
    })
    // Mark as read
    await prisma.directMessage.updateMany({
      where: { fromUserId: withUserId, toUserId: session.user.id, read: false },
      data: { read: true }
    })
    return Response.json({ messages })
  }

  // Conversations list
  const [sent, received] = await Promise.all([
    prisma.directMessage.findMany({
      where: { fromUserId: session.user.id },
      distinct: ['toUserId'], orderBy: { createdAt: 'desc' },
      include: { toUser: { select: { id: true, name: true, username: true } } }
    }),
    prisma.directMessage.findMany({
      where: { toUserId: session.user.id },
      distinct: ['fromUserId'], orderBy: { createdAt: 'desc' },
      include: { fromUser: { select: { id: true, name: true, username: true } } }
    })
  ])

  const convMap = {}
  sent.forEach(m => { convMap[m.toUserId] = { user: m.toUser, lastMessage: m, unread: 0 } })
  received.forEach(m => { if (!convMap[m.fromUserId]) convMap[m.fromUserId] = { user: m.fromUser, lastMessage: m, unread: 0 } })

  const unreadByUser = await prisma.directMessage.groupBy({
    by: ['fromUserId'],
    where: { toUserId: session.user.id, read: false },
    _count: true
  })
  unreadByUser.forEach(u => { if (convMap[u.fromUserId]) convMap[u.fromUserId].unread = u._count })

  const unreadTotal = await prisma.directMessage.count({ where: { toUserId: session.user.id, read: false } })
  return Response.json({ conversations: Object.values(convMap), unreadTotal })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { toUserId, content, imageData } = await request.json()
  if (!content?.trim() && !imageData) return Response.json({ error: 'Message or image required' }, { status: 400 })
  if (!toUserId) return Response.json({ error: 'Recipient required' }, { status: 400 })

  // Store base64 image inline (for MVP — in production use S3/Cloudinary)
  // We store the raw data URL in imageUrl field
  const imageUrl = imageData || null

  const message = await prisma.directMessage.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      content: content || '',
      imageUrl,
    },
    include: { fromUser: { select: { id: true, name: true, username: true } } }
  })
  return Response.json({ message })
}
