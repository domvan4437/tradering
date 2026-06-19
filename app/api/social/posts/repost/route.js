import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId } = await request.json()
    if (!postId) return Response.json({ error: 'postId required' }, { status: 400 })

    // Check if already reposted
    const existing = await prisma.postRepost.findUnique({
      where: { postId_userId: { postId, userId: session.user.id } },
    })

    if (existing) {
      // Undo repost
      await prisma.postRepost.delete({ where: { id: existing.id } })
      const post = await prisma.socialPost.update({
        where: { id: postId },
        data: { reposts: { decrement: 1 } },
      })
      return Response.json({ reposts: Math.max(0, post.reposts), reposted: false })
    } else {
      // Add repost
      await prisma.postRepost.create({ data: { postId, userId: session.user.id } })
      const post = await prisma.socialPost.update({
        where: { id: postId },
        data: { reposts: { increment: 1 } },
      })
      return Response.json({ reposts: post.reposts, reposted: true })
    }
  } catch (e) {
    console.error('[POST /api/social/posts/repost]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
