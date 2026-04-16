import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')
  const limit = parseInt(searchParams.get('limit') || '50')

  const posts = await prisma.communityPost.findMany({
    where: symbol ? { symbol } : {},
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { name: true, username: true } },
    },
  })

  return Response.json(posts.map(p => ({
    ...p,
    authorName: p.isAnonymous ? 'Anonymous' : (p.user?.username || p.user?.name || 'Trader'),
  })))
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const post = await prisma.communityPost.create({
    data: {
      userId: session.user.id,
      symbol: body.symbol,
      direction: body.direction,
      title: body.title,
      body: body.body || '',
      passed: body.passed ?? null,
      cotIndex: body.cotIndex ? parseInt(body.cotIndex) : null,
      seasonal: body.seasonal ? parseFloat(body.seasonal) : null,
      isAnonymous: body.isAnonymous || false,
    },
  })
  return Response.json(post)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, action } = await request.json()
  if (action === 'like') {
    const post = await prisma.communityPost.update({
      where: { id },
      data: { likes: { increment: 1 } },
    })
    return Response.json(post)
  }
  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.communityPost.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
