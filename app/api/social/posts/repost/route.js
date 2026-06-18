import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId, action } = await request.json()
    if (!postId) return Response.json({ error: 'postId required' }, { status: 400 })
    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: { reposts: { increment: action === 'undo' ? -1 : 1 } },
    })
    return Response.json({ reposts: post.reposts })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
