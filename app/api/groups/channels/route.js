import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  const isMember = await prisma.groupMember.findFirst({ where: { groupId, userId: session.user.id } })
  if (!isMember) return Response.json({ error: 'Not a member' }, { status: 403 })
  const channels = await prisma.groupChannel.findMany({ where: { groupId }, orderBy: { order: 'asc' } })
  return Response.json({ channels })
}
