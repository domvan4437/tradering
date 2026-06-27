import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

const POST_INCLUDE = (userId) => ({
  user: { select: { name: true, username: true, image: true, profileSlug: true } },
  postLikes: { where: { userId }, select: { id: true } },
  postReposts: { where: { userId }, select: { id: true } },
  _count: { select: { comments: true } },
})

const mapPost = (p, session, repostedBy = null) => ({
  id: p.id,
  userId: p.userId,
  content: p.content,
  assetTag: p.assetTag,
  direction: p.direction,
  likes: p.likes,
  reposts: p.reposts,
  imageUrl: p.imageUrl,
  poll: Array.isArray(p.poll) ? p.poll.map(o => ({ label: o.label, votes: o.votes || 0 })) : null,
  myVote: Array.isArray(p.poll) ? p.poll.findIndex(o => Array.isArray(o.voters) && o.voters.includes(session.user.id)) : -1,
  groupId: p.groupId,
  createdAt: p.createdAt,
  authorName: p.user?.username || p.user?.name || 'Trader',
  authorImage: p.user?.image || null,
  authorSlug: p.user?.profileSlug || p.user?.username || null,
  user: p.user,
  liked: p.postLikes.length > 0,
  reposted: p.postReposts.length > 0,
  commentsCount: p._count.comments,
  repostedBy,
})

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const tab = searchParams.get('tab') || 'discover'

    if (tab === 'threads') {
      const posts = await prisma.socialPost.findMany({
        where: { groupId: 'thread' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: POST_INCLUDE(session.user.id),
      })
      return Response.json({ posts: posts.map(p => mapPost(p, session)) })
    }

    if (tab === 'following') {
      const follows = await prisma.userFollow.findMany({
        where: { followerId: session.user.id },
        select: { followingId: true },
      })
      const followingIds = follows.map(f => f.followingId)
      const myAndFollowingIds = [...followingIds, session.user.id]

      // Original posts from followed users + self
      const posts = await prisma.socialPost.findMany({
        where: { userId: { in: myAndFollowingIds }, groupId: null },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: POST_INCLUDE(session.user.id),
      })

      // Reposts by followed users + self
      const reposts = await prisma.postRepost.findMany({
        where: { userId: { in: myAndFollowingIds } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { name: true, username: true } },
          post: { include: POST_INCLUDE(session.user.id) },
        },
      })

      // Merge, dedupe by post id (original wins over repost if both present)
      const seen = new Set()
      const feed = []

      // Interleave by date
      const all = [
        ...posts.map(p => ({ sortKey: new Date(p.createdAt).getTime(), type: 'post', data: p, repostedBy: null })),
        ...reposts
          .filter(r => !posts.find(p => p.id === r.postId)) // skip if original already in feed
          .map(r => ({
            sortKey: new Date(r.createdAt).getTime(),
            type: 'repost',
            data: r.post,
            repostedBy: r.user?.username || r.user?.name || 'Someone',
          })),
      ].sort((a, b) => b.sortKey - a.sortKey)

      for (const item of all) {
        if (seen.has(item.data.id)) continue
        seen.add(item.data.id)
        feed.push(mapPost(item.data, session, item.repostedBy))
      }

      return Response.json({ posts: feed })
    }

    // Discover: all regular posts + recent reposts from anyone
    const posts = await prisma.socialPost.findMany({
      where: { groupId: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: POST_INCLUDE(session.user.id),
    })

    return Response.json({ posts: posts.map(p => mapPost(p, session)) })
  } catch (e) {
    console.error('[GET /api/social/posts]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { content, assetTag, direction, postType, imageUrl, poll } = await request.json()
    const hasPoll = poll && Array.isArray(poll) && poll.length >= 2
    if (!content?.trim() && !imageUrl && !hasPoll) return Response.json({ error: 'Content, image, or poll required' }, { status: 400 })

    const post = await prisma.socialPost.create({
      data: {
        userId: session.user.id,
        content: content?.trim() || '',
        assetTag: assetTag?.trim() || null,
        direction: direction || null,
        isPublic: true,
        groupId: postType === 'thread' ? 'thread' : null,
        imageUrl: imageUrl || null,
        ...(poll && Array.isArray(poll) && poll.length >= 2 ? { poll } : {}),
      },
      include: { user: { select: { name: true, username: true } } },
    })

    return Response.json({
      post: {
        id: post.id,
        userId: post.userId,
        content: post.content,
        assetTag: post.assetTag,
        direction: post.direction,
        likes: post.likes,
        reposts: post.reposts,
        imageUrl: post.imageUrl,
        poll: post.poll,
        groupId: post.groupId,
        createdAt: post.createdAt,
        authorName: post.user?.username || post.user?.name || 'Trader',
        user: post.user,
        liked: false,
        reposted: false,
        commentsCount: 0,
      },
    })
  } catch (e) {
    console.error('[POST /api/social/posts]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await request.json()
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })
    await prisma.socialPost.delete({ where: { id, userId: session.user.id } })
    return Response.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/social/posts]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
