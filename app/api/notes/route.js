import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  })
  return Response.json(notes)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const note = await prisma.note.create({
    data: {
      userId: session.user.id,
      title: body.title || 'Untitled',
      content: body.content || '',
      tags: body.tags || [],
      isPinned: body.isPinned || false,
      color: body.color || null,
    },
  })
  return Response.json(note)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, ...updates } = await request.json()
  const note = await prisma.note.update({
    where: { id, userId: session.user.id },
    data: updates,
  })
  return Response.json(note)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.note.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
