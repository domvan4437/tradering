import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  const results = {}

  // 1. Check auth
  results.session = session ? { ok: true, userId: session.user.id } : { ok: false, error: 'No session' }

  // 2. Try counting UserFollow rows
  try {
    const count = await prisma.userFollow.count()
    results.userFollowTable = { ok: true, rowCount: count }
  } catch (e) {
    results.userFollowTable = { ok: false, error: e.message }
  }

  // 3. Try reading follower count for self
  if (session?.user?.id) {
    try {
      const followers = await prisma.userFollow.count({ where: { followingId: session.user.id } })
      const following = await prisma.userFollow.count({ where: { followerId: session.user.id } })
      results.selfCounts = { ok: true, followers, following }
    } catch (e) {
      results.selfCounts = { ok: false, error: e.message }
    }
  }

  // 4. Try reading User._count
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, _count: { select: { followers: true, following: true } } }
      })
      results.userCount = { ok: true, followers: user?._count?.followers, following: user?._count?.following }
    } catch (e) {
      results.userCount = { ok: false, error: e.message }
    }
  }

  return Response.json(results, {
    headers: { 'Cache-Control': 'no-store' }
  })
}
