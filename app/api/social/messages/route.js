import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

function fmt(u) {
  return {
    id: u.id,
    username: u.username || null,
    displayName: u.displayName || u.name || u.username || 'Unknown',
    image: u.image || null,
    verifiedBadge: !!u.verifiedBadge,
  }
}

// GET /api/social/messages          → all conversations for current user
// GET /api/social/messages?with=id  → single thread with that user
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const myId = session.user.id
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')

    if (withUserId) {
      const messages = await prisma.directMessage.findMany({
        where: {
          OR: [
            { fromUserId: myId, toUserId: withUserId },
            { fromUserId: withUserId, toUserId: myId },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
      })
      return Response.json({ messages })
    }

    // All messages involving this user
    const rows = await prisma.directMessage.findMany({
      where: { OR: [{ fromUserId: myId }, { toUserId: myId }] },
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        fromUser: { select: { id: true, username: true, displayName: true, name: true, image: true, verifiedBadge: true } },
        toUser:   { select: { id: true, username: true, displayName: true, name: true, image: true, verifiedBadge: true } },
      },
    })
    return Response.json({ messages: rows })
  } catch (e) {
    console.error('[GET /api/social/messages]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/social/messages  { receiverId, content }
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { receiverId, content } = await request.json()
    if (!content?.trim() || !receiverId) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (receiverId === session.user.id) return Response.json({ error: 'Cannot message yourself' }, { status: 400 })

    const recipient = await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } })
    if (!recipient) return Response.json({ error: 'Recipient not found' }, { status: 404 })

    const message = await prisma.directMessage.create({
      data: { fromUserId: session.user.id, toUserId: receiverId, content: content.trim() },
    })
    return Response.json({ message })
  } catch (e) {
    console.error('[POST /api/social/messages]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/social/messages?with=<otherUserId>
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')
    if (!withUserId) return Response.json({ error: 'Missing "with" param' }, { status: 400 })
    const myId = session.user.id

    await prisma.directMessage.deleteMany({
      where: {
        OR: [
          { fromUserId: myId, toUserId: withUserId },
          { fromUserId: withUserId, toUserId: myId },
        ],
      },
    })
    return Response.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/social/messages]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
