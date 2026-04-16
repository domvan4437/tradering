import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { groupId } = await request.json()
  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group) return Response.json({ error: 'Group not found' }, { status: 404 })
  if (group.price > 0) return Response.json({ error: 'Payment required', requiresPayment: true, price: group.price }, { status: 402 })
  try {
    await prisma.groupMember.create({ data: { groupId, userId: session.user.id } })
    await prisma.group.update({ where: { id: groupId }, data: { memberCount: { increment: 1 } } })
    return Response.json({ joined: true })
  } catch { return Response.json({ error: 'Already a member' }, { status: 400 }) }
}
