import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { userId } = await request.json()
  if (userId === session.user.id) return Response.json({ error: 'Cannot follow yourself' }, { status: 400 })
  try {
    await prisma.userFollow.create({ data: { followerId: session.user.id, followingId: userId } })
    return Response.json({ following: true })
  } catch {
    await prisma.userFollow.delete({ where: { followerId_followingId: { followerId: session.user.id, followingId: userId } } })
    return Response.json({ following: false })
  }
}
