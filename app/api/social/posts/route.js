import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const filter = searchParams.get('filter') || 'all'
  const asset = searchParams.get('asset')
  const cursor = searchParams.get('cursor')

  const where = { isPublic: true, groupId: null }
  if (asset) where.assetTag = asset
  if (filter === 'following') {
    const follows = await prisma.userFollow.findMany({ where: { followerId: session.user.id }, select: { followingId: true } })
    where.userId = { in: follows.map(f => f.followingId) }
  }

  const posts = await prisma.socialPost.findMany({
    where, take: 20,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, username: true } },
      _count: { select: { comments: true, postLikes: true } },
      postLikes: { where: { userId: session.user.id }, select: { id: true } }
    }
  })

  const formatted = posts.map(p => ({
    ...p, likedByMe: p.postLikes.length > 0,
    likesCount: p._count.postLikes, commentsCount: p._count.comments,
    postLikes: undefined, _count: undefined
  }))

  return Response.json({ posts: formatted, nextCursor: posts.length === 20 ? posts[posts.length-1].id : null })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { content, assetTag, direction, imageUrl } = await request.json()
  if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })
  const post = await prisma.socialPost.create({
    data: { userId: session.user.id, content, assetTag, direction, imageUrl },
    include: { user: { select: { id: true, name: true, username: true } } }
  })
  return Response.json({ post })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.socialPost.delete({ where: { id, userId: session.user.id } })
  return Response.json({ deleted: true })
}
