import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// GET /api/users/search?q=term
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    if (!q) return Response.json({ users: [] })

    const rows = await prisma.user.findMany({
      where: {
        id: { not: session.user.id },
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { displayName: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, username: true, displayName: true, name: true, verifiedBadge: true },
      take: 10,
    })

    const users = rows.map(u => ({
      id: u.id,
      username: u.username || null,
      displayName: u.displayName || u.name || u.username || 'Unknown',
      verifiedBadge: !!u.verifiedBadge,
    }))

    return Response.json({ users })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
