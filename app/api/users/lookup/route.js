import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// GET /api/users/lookup?ids=id1,id2,id3
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const idsParam = (searchParams.get('ids') || '').trim()
    if (!idsParam) return Response.json({ users: {} })

    const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 100)
    if (!ids.length) return Response.json({ users: {} })

    const rows = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, username: true, displayName: true, name: true, verifiedBadge: true },
    })

    const users = {}
    for (const u of rows) {
      users[u.id] = {
        id: u.id,
        username: u.username || null,
        displayName: u.displayName || u.name || u.username || 'Unknown user',
        verifiedBadge: !!u.verifiedBadge,
      }
    }
    return Response.json({ users })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
