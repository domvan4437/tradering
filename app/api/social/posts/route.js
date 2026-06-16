import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const posts = await prisma.communityPost.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true, username: true } } },
    })
    return Response.json({
      posts: posts.map(p => ({
        ...p,
        content: p.body,
        authorName: p.isAnonymous ? 'Anonymous' : (p.user?.username || p.user?.name || 'Trader'),
      })),
    })
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { content, assetTag, direction } = await request.json()
    if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })
    const post = await prisma.communityPost.create({
      data: {
        userId: session.user.id,
        symbol: assetTag || '',
        direction: direction || null,
        title: content.trim().slice(0, 80),
        body: content.trim(),
        likes: 0,
        isAnonymous: false,
      },
    })
    return Response.json({ post: { ...post, content: post.body } })
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, postId } = await request.json()
    await prisma.communityPost.delete({ where: { id: id || postId, userId: session.user.id } })
    return Response.json({ success: true })
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }) }
}
