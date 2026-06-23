import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

function parseDuration(d) {
  if (!d) return 2592000000
  const map = { '1 Day': 86400000, '3 Days': 259200000, '1 Week': 604800000, '2 Weeks': 1209600000, '1 Month': 2592000000, '3 Months': 7776000000 }
  if (map[d]) return map[d]
  const m = d.match(/^(\d+)\s+(day|days|week|weeks|month|months)$/)
  if (m) {
    const n = parseInt(m[1])
    if (m[2].startsWith('day')) return n * 86400000
    if (m[2].startsWith('week')) return n * 604800000
    if (m[2].startsWith('month')) return n * 2592000000
  }
  return 2592000000
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const [allContests, myContests] = await Promise.all([
      prisma.tournament.findMany({
        where: { type: 'group', status: { in: ['open', 'active'] } },
        include: {
          creator: { select: { id: true, name: true, username: true, displayName: true } },
          _count: { select: { entries: true } },
          entries: { where: { userId: uid }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.tournament.findMany({
        where: { type: 'group', entries: { some: { userId: uid } } },
        include: {
          creator: { select: { id: true, name: true, username: true, displayName: true } },
          _count: { select: { entries: true } },
          entries: {
            orderBy: { score: 'desc' },
            take: 10,
            include: { user: { select: { id: true, name: true, username: true, displayName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const fmtContest = (c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      asset: c.assetClasses?.[0] || 'Any',
      buyIn: c.buyIn,
      status: c.status,
      endDate: c.endDate,
      memberCount: c._count?.entries ?? 0,
      joined: (c.entries?.length ?? 0) > 0,
      creatorName: c.creator?.displayName || c.creator?.name || c.creator?.username || 'Trader',
      creatorUsername: c.creator?.username,
    })

    return Response.json({ contests: allContests.map(fmtContest), myContests: myContests.map(fmtContest) })
  } catch (e) {
    console.error('[GET /api/group-contests]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { action, contestId, name, description, asset, duration, buyIn } = await request.json()

    if (action === 'join') {
      const existing = await prisma.tournamentEntry.findFirst({ where: { tournamentId: contestId, userId: session.user.id } })
      if (existing) return Response.json({ error: 'Already joined' }, { status: 400 })
      await prisma.tournamentEntry.create({ data: { tournamentId: contestId, userId: session.user.id, score: 0 } })
      return Response.json({ success: true })
    }

    if (action === 'create') {
      const now = new Date()
      const endDate = new Date(now.getTime() + parseDuration(duration))

      const tournament = await prisma.tournament.create({
        data: {
          creatorId: session.user.id,
          name: name || 'Group Contest',
          description: description || '',
          type: 'group',
          status: 'open',
          assetClasses: [asset || 'Any'],
          maxCallsPerDay: 99,
          startDate: now,
          endDate,
          buyIn: parseFloat(buyIn) || 0,
          prizePool: 0,
        },
      })

      await prisma.tournamentEntry.create({ data: { tournamentId: tournament.id, userId: session.user.id, score: 0 } })
      return Response.json({ success: true, contestId: tournament.id })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('[POST /api/group-contests]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
