import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const mine = searchParams.get('mine')

  if (mine) {
    const groups = await prisma.group.findMany({
      where: { OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }] },
      include: { _count: { select: { members: true } }, owner: { select: { name: true, username: true } } }
    })
    return Response.json({ groups })
  }

  const groups = await prisma.group.findMany({
    where: { isPublic: true },
    include: { _count: { select: { members: true } }, owner: { select: { name: true, username: true, displayName: true } } },
    orderBy: { memberCount: 'desc' }
  })
  return Response.json({ groups })
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Group ID required' }, { status: 400 })
  const group = await prisma.group.findUnique({ where: { id } })
  if (!group) return Response.json({ error: 'Not found' }, { status: 404 })
  if (group.ownerId !== session.user.id) return Response.json({ error: 'Only the owner can delete this group' }, { status: 403 })
  await prisma.group.delete({ where: { id } })
  return Response.json({ ok: true })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, description, price, category, isPublic } = await request.json()
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const group = await prisma.group.create({
    data: { ownerId: session.user.id, name, slug, description, price: parseFloat(price)||0, category, isPublic: isPublic !== false }
  })
  // Create default channels
  await prisma.groupChannel.createMany({ data: [
    { groupId: group.id, name: 'announcements', type: 'announcements', order: 0 },
    { groupId: group.id, name: 'general', type: 'chat', order: 1 },
    { groupId: group.id, name: 'trade-ideas', type: 'chat', order: 2 },
  ]})
  // Auto-join owner
  await prisma.groupMember.create({ data: { groupId: group.id, userId: session.user.id, role: 'owner' } })
  return Response.json({ group })
}
