import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const ideas = await prisma.idea.findMany({
    where: { userId: session.user.id, ...(status ? { status } : {}) },
    orderBy: { updatedAt: 'desc' },
  })
  return Response.json(ideas)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const idea = await prisma.idea.create({
    data: {
      userId: session.user.id,
      title: body.title,
      symbol: body.symbol || '',
      direction: body.direction || 'WATCHING',
      timeframe: body.timeframe || '',
      status: body.status || 'watching',
      thesis: body.thesis || '',
      entry: body.entry || '',
      stop: body.stop || '',
      target: body.target || '',
      confidence: body.confidence ? parseInt(body.confidence) : null,
      tags: body.tags || [],
      isPublic: body.isPublic || false,
    },
  })
  return Response.json(idea)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await request.json()
  if (updates.confidence) updates.confidence = parseInt(updates.confidence)
  const idea = await prisma.idea.update({
    where: { id, userId: session.user.id },
    data: updates,
  })
  return Response.json(idea)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.idea.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
