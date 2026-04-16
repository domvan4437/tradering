import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const authorId = searchParams.get('authorId')

  const where = {}
  if (groupId) where.groupId = groupId
  if (authorId) where.authorId = authorId

  const ideas = await prisma.tradeIdea.findMany({
    where, orderBy: { createdAt: 'desc' }, take: 50,
    include: { author: { select: { id: true, name: true, username: true, plan: true } } }
  })
  return Response.json({ ideas })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { groupId, asset, symbol, direction, entryPrice, stopPrice, targetPrice, thesis } = await request.json()

  // Fetch live market data to attach to idea
  let currentPrice = null, cotIndex = null, seasonalBias = null
  try {
    const priceRes = await fetch(`${process.env.NEXTAUTH_URL}/api/prices?symbols=${symbol}`)
    const priceData = await priceRes.json()
    currentPrice = priceData[symbol]?.price || null
  } catch {}

  const idea = await prisma.tradeIdea.create({
    data: {
      authorId: session.user.id, groupId: groupId || null,
      asset, symbol, direction,
      entryPrice: entryPrice ? parseFloat(entryPrice) : null,
      stopPrice: stopPrice ? parseFloat(stopPrice) : null,
      targetPrice: targetPrice ? parseFloat(targetPrice) : null,
      currentPrice, cotIndex, seasonalBias, thesis
    },
    include: { author: { select: { id: true, name: true, username: true, plan: true } } }
  })
  return Response.json({ idea })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, status } = await request.json()
  const idea = await prisma.tradeIdea.update({
    where: { id, authorId: session.user.id },
    data: { status }
  })
  return Response.json({ idea })
}
