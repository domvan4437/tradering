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

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [allContestsRaw, myContests] = await Promise.all([
      prisma.tournament.findMany({
        where: {
          type: 'group',
          status: { in: ['open', 'active'] },
          OR: [{ endDate: null }, { endDate: { gt: cutoff } }],
        },
        include: {
          creator: { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
          _count: { select: { entries: true } },
          entries: { where: { userId: uid }, select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.tournament.findMany({
        where: {
          AND: [
            { type: 'group' },
            { OR: [{ endDate: null }, { endDate: { gt: cutoff } }] },
            { OR: [
              { entries: { some: { userId: uid } } },
              { creatorId: uid },
            ]},
          ],
        },
        include: {
          creator: { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
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

    const allContests = allContestsRaw.filter(c => {
      const count = c._count?.entries ?? 0
      if (c.teamSize) return count < c.teamSize * 2
      if (c.maxTeams) return count < c.maxTeams
      return true
    })

    const CATEGORY_NAMES = new Set(['Any', 'Forex', 'Crypto', 'Stocks', 'Futures', 'Commodities'])
    const fmtContest = (c, overrideJoined) => {
      const assetClasses = c.assetClasses || ['Any']
      const category = assetClasses[0] || 'Any'
      const specificSymbols = assetClasses.slice(1).filter(s => !CATEGORY_NAMES.has(s))
      const joined = overrideJoined !== undefined ? overrideJoined : (c.entries?.length ?? 0) > 0
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        asset: category,
        allowedSymbols: specificSymbols.length > 0 ? specificSymbols : null,
        buyIn: c.buyIn,
        status: c.status,
        endDate: c.endDate,
        memberCount: c._count?.entries ?? 0,
        joined,
        creatorName: c.creator?.displayName || c.creator?.name || c.creator?.username || 'Trader',
        creatorImage: c.creator?.id ? `/api/avatar/${c.creator.id}` : null,
        creatorSlug: c.creator?.profileSlug || c.creator?.id,
        isCreator: c.creatorId === uid,
        teamFormat: c.teamFormat || null,
        teamSize: c.teamSize || null,
      }
    }

    const myContestsFmt = myContests.map(c => {
      const iJoined = c.entries?.some(e => e.userId === uid)
      return fmtContest(c, iJoined)
    })

    return Response.json({ contests: allContests.map(c => fmtContest(c)), myContests: myContestsFmt })
  } catch (e) {
    console.error('[GET /api/group-contests]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { action, contestId, name, description, asset, allowedSymbols, duration, buyIn, teamFormat, teamSize, teamNameA, teamNameB } = await request.json()

    if (action === 'join') {
      const existing = await prisma.tournamentEntry.findFirst({ where: { tournamentId: contestId, userId: session.user.id } })
      if (existing) return Response.json({ success: true })
      await prisma.tournamentEntry.create({ data: { tournamentId: contestId, userId: session.user.id, score: 0 } })
      return Response.json({ success: true })
    }

    if (action === 'create') {
      const now = new Date()
      const endDate = new Date(now.getTime() + parseDuration(duration))
      const parsedTeamSize = teamSize ? parseInt(teamSize) : null

      const tournament = await prisma.tournament.create({
        data: {
          creatorId: session.user.id,
          name: name || 'Group Contest',
          description: description || '',
          type: 'group',
          status: 'open',
          assetClasses: allowedSymbols?.length > 0 ? [asset || 'Any', ...allowedSymbols] : [asset || 'Any'],
          maxCallsPerDay: 99,
          startDate: now,
          endDate,
          buyIn: parseFloat(buyIn) || 0,
          prizePool: 0,
          teamFormat: teamFormat || null,
          teamSize: parsedTeamSize,
          maxTeams: null,
        },
      })

      if (teamFormat && parsedTeamSize) {
        await prisma.contestTeam.createMany({
          data: [
            { contestId: tournament.id, captainId: session.user.id, name: teamNameA?.trim() || 'Team Alpha', emoji: '🔵', color: '#3B82F6' },
            { contestId: tournament.id, captainId: session.user.id, name: teamNameB?.trim() || 'Team Beta', emoji: '🔴', color: '#EF4444' },
          ],
        })
      } else {
        await prisma.tournamentEntry.create({ data: { tournamentId: tournament.id, userId: session.user.id, score: 0 } })
      }

      return Response.json({ success: true, contestId: tournament.id })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('[POST /api/group-contests]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { contestId } = await request.json()
    if (!contestId) return Response.json({ error: 'contestId required' }, { status: 400 })

    const contest = await prisma.tournament.findUnique({ where: { id: contestId } })
    if (!contest) return Response.json({ error: 'Not found' }, { status: 404 })
    if (contest.creatorId !== uid) return Response.json({ error: 'Only the creator can delete this contest' }, { status: 403 })

    await prisma.tradeCall.deleteMany({ where: { tournamentId: contestId } })
    await prisma.competitionPosition.deleteMany({ where: { competitionId: contestId } })
    await prisma.competitionOrder.deleteMany({ where: { competitionId: contestId } })
    await prisma.competitionPortfolio.deleteMany({ where: { competitionId: contestId } })
    await prisma.tournamentEntry.deleteMany({ where: { tournamentId: contestId } })
    await prisma.contestTeam.deleteMany({ where: { contestId } })
    await prisma.tournament.delete({ where: { id: contestId } })

    return Response.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/group-contests]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
