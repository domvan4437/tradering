import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// POST { userId } → toggle follow, returns { following: boolean }
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { userId } = await request.json()
    if (!userId || userId === session.user.id) return Response.json({ error: 'Invalid' }, { status: 400 })

    const existing = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
    })

    if (existing) {
      await prisma.userFollow.delete({
        where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
      })
      return Response.json({ following: false })
    } else {
      await prisma.userFollow.create({
        data: { followerId: session.user.id, followingId: userId },
      })
      return Response.json({ following: true })
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// GET ?list=true → list of users the current user follows
// GET ?userId=id → follower/following counts + isFollowing for current user
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)

    // Return the list of users the current user follows
    if (searchParams.get('list')) {
      const rows = await prisma.userFollow.findMany({
        where: { followerId: session.user.id },
        include: { following: { select: { id: true, name: true, username: true, displayName: true } } },
        orderBy: { createdAt: 'desc' },
      })
      return Response.json({
        following: rows.map(r => ({
          id: r.following.id,
          name: r.following.displayName || r.following.name || 'Trader',
          username: r.following.username || '',
        }))
      })
    }

    const userId = searchParams.get('userId') || session.user.id
    const [followers, following, isFollowingRow] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: userId } }),
      prisma.userFollow.count({ where: { followerId: userId } }),
      session.user.id !== userId
        ? prisma.userFollow.findUnique({
            where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
          })
        : null,
    ])

    return Response.json({ followers, following, isFollowing: !!isFollowingRow })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
