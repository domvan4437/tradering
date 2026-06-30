import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

function calcPnl(portfolio) {
  if (!portfolio) return 0
  const realized = (portfolio.trades || []).reduce((s, t) => s + (t.pnl || 0), 0)
  const unrealized = (portfolio.positions || []).reduce((s, p) => {
    const mult = p.direction === 'short' ? -1 : 1
    return s + (p.currentPrice - p.entryPrice) * p.quantity * mult
  }, 0)
  return realized + unrealized
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    const [contest, portfolios, contestTeams] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, username: true, displayName: true } },
          entries: {
            orderBy: { joinedAt: 'asc' },
            include: { user: { select: { id: true, name: true, username: true, displayName: true } } },
          },
        },
      }),
      prisma.competitionPortfolio.findMany({
        where: { competitionId: id },
        include: { trades: true, positions: true },
      }),
      prisma.contestTeam.findMany({
        where: { contestId: id },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    if (!contest) return Response.json({ error: 'Not found' }, { status: 404 })

    // Build portfolio map for live P&L
    const portfolioMap = {}
    for (const p of portfolios) portfolioMap[p.userId] = calcPnl(p)

    // Build flat members list sorted by live P&L
    const members = contest.entries.map(e => ({
      id: e.user.id,
      name: e.user.displayName || e.user.name || e.user.username || 'Trader',
      pnl: +(portfolioMap[e.user.id] || 0).toFixed(2),
      teamName: e.teamName || null,
      groupId: e.groupId || null,
      joinedAt: e.joinedAt,
    }))
    members.sort((a, b) => b.pnl - a.pnl)

    // Build per-team breakdown if this is a team contest
    let teams = null
    if (contest.teamFormat && contestTeams.length > 0) {
      teams = contestTeams.map(team => {
        const teamMembers = contest.entries
          .filter(e => e.groupId === team.id)
          .map(e => ({
            id: e.user.id,
            name: e.user.displayName || e.user.name || e.user.username || 'Trader',
            pnl: +(portfolioMap[e.user.id] || 0).toFixed(2),
          }))
        teamMembers.sort((a, b) => b.pnl - a.pnl)
        const teamPnl = teamMembers.reduce((s, m) => s + m.pnl, 0)
        return {
          id: team.id,
          name: team.name,
          emoji: team.emoji,
          color: team.color,
          members: teamMembers,
          memberCount: teamMembers.length,
          teamPnl: +teamPnl.toFixed(2),
        }
      })
    }

    return Response.json({
      id: contest.id,
      name: contest.name,
      description: contest.description,
      asset: contest.assetClasses?.[0] || 'Any',
      buyIn: contest.buyIn,
      status: contest.status,
      endDate: contest.endDate,
      maxParticipants: contest.maxParticipants,
      prizeStructure: contest.prizeStructure,
      creatorName: contest.creator?.displayName || contest.creator?.name || contest.creator?.username || 'Trader',
      memberCount: contest.entries.length,
      members,
      teams,
      teamFormat: contest.teamFormat || null,
      teamSize: contest.teamSize || null,
      joined: contest.entries.some(e => e.userId === uid),
    })
  } catch (e) {
    console.error('[GET /api/group-contests/preview]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
