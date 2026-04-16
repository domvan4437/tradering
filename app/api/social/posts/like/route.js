import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { postId } = await request.json()
  try {
    await prisma.postLike.create({ data: { postId, userId: session.user.id } })
    await prisma.socialPost.update({ where: { id: postId }, data: { likes: { increment: 1 } } })
    return Response.json({ liked: true })
  } catch {
    await prisma.postLike.delete({ where: { postId_userId: { postId, userId: session.user.id } } })
    await prisma.socialPost.update({ where: { id: postId }, data: { likes: { decrement: 1 } } })
    return Response.json({ liked: false })
  }
}
