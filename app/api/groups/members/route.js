import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')
  if (!groupId) return Response.json({ error: 'groupId required' }, { status: 400 })

  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true, username: true, displayName: true, image: true } } },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  })

  return Response.json({
    members: members.map(m => ({
      id: m.user.id,
      name: m.user.displayName || m.user.name || m.user.username || 'Trader',
      username: m.user.username,
      image: `/api/avatar/${m.user.id}`,
      role: m.role,
    }))
  })
}
