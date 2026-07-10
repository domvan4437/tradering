import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    if (!postId) return Response.json({ error: 'postId required' }, { status: 400 })
    const comments = await prisma.socialComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true, username: true, image: true } } },
    })
    return Response.json({
      comments: comments.map(c => ({
        id: c.id,
        postId: c.postId,
        userId: c.userId,
        content: c.content,
        createdAt: c.createdAt,
        authorName: c.user?.username || c.user?.name || 'Trader',
        authorImage: `/api/avatar/${c.userId}`,
      })),
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId, content } = await request.json()
    if (!postId || !content?.trim()) return Response.json({ error: 'postId and content required' }, { status: 400 })
    const comment = await prisma.socialComment.create({
      data: { postId, userId: session.user.id, content: content.trim() },
      include: { user: { select: { name: true, username: true, image: true } } },
    })
    return Response.json({
      comment: {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        createdAt: comment.createdAt,
        authorName: comment.user?.username || comment.user?.name || 'Trader',
        authorImage: `/api/avatar/${comment.userId}`,
        userId: comment.userId,
      },
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
