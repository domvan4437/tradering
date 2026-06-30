import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

function calcPnl(portfolio) {
  if (!portfolio) return 0
  const realized = portfolio.trades.reduce((s, t) => s + (t.pnl || 0), 0)
  const unrealized = portfolio.positions.reduce((s, p) => {
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
    const contestId = searchParams.get('contestId')
    if (!contestId) return Response.json({ error: 'contestId required' }, { status: 400 })

    const [teams, entries, portfolios] = await Promise.all([
      prisma.contestTeam.findMany({
        where: { contestId },
        include: { captain: { select: { id: true, name: true, username: true, displayName: true } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.tournamentEntry.findMany({
        where: { tournamentId: contestId, groupId: { not: null } },
        include: { user: { select: { id: true, name: true, username: true, displayName: true } } },
      }),
      prisma.competitionPortfolio.findMany({
        where: { competitionId: contestId },
        include: { trades: true, positions: true },
      }),
    ])

    const portfolioMap = {}
    for (const p of portfolios) portfolioMap[p.userId] = calcPnl(p)

    const result = teams.map(t => {
      const members = entries
        .filter(e => e.groupId === t.id)
        .map(e => ({
          id: e.user.id,
          name: e.user.displayName || e.user.name || e.user.username || 'Trader',
          pnl: +(portfolioMap[e.user.id] || 0).toFixed(2),
          isCaptain: e.user.id === t.captainId,
        }))
      const teamPnl = members.reduce((s, m) => s + m.pnl, 0)
      return {
        id: t.id,
        name: t.name,
        emoji: t.emoji,
        color: t.color,
        description: t.description,
        captainId: t.captainId,
        captainName: t.captain?.displayName || t.captain?.name || t.captain?.username || 'Trader',
        members,
        teamPnl: +teamPnl.toFixed(2),
        memberCount: members.length,
        createdAt: t.createdAt,
        isMyTeam: members.some(m => m.id === uid),
        isCaptain: t.captainId === uid,
      }
    })

    result.sort((a, b) => b.teamPnl - a.teamPnl)
    return Response.json({ teams: result })
  } catch (e) {
    console.error('[GET /api/group-contests/teams]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { action, contestId, teamId, name, emoji, color, description } = await request.json()

    if (action === 'create') {
      if (!contestId || !name?.trim()) return Response.json({ error: 'contestId and name required' }, { status: 400 })
      const contest = await prisma.tournament.findUnique({ where: { id: contestId } })
      if (!contest) return Response.json({ error: 'Contest not found' }, { status: 404 })

      const team = await prisma.contestTeam.create({
        data: { contestId, captainId: uid, name: name.trim(), emoji: emoji || '⚡', color: color || '#534AB7', description: description || null },
      })

      // Join contest (or update existing entry) and link to team
      const existing = await prisma.tournamentEntry.findFirst({ where: { tournamentId: contestId, userId: uid } })
      if (existing) {
        await prisma.tournamentEntry.update({ where: { id: existing.id }, data: { groupId: team.id, teamName: name.trim() } })
      } else {
        await prisma.tournamentEntry.create({ data: { tournamentId: contestId, userId: uid, score: 0, groupId: team.id, teamName: name.trim() } })
      }
      return Response.json({ success: true, teamId: team.id })
    }

    if (action === 'join') {
      if (!contestId || !teamId) return Response.json({ error: 'contestId and teamId required' }, { status: 400 })
      const [team, contest] = await Promise.all([
        prisma.contestTeam.findUnique({ where: { id: teamId } }),
        prisma.tournament.findUnique({ where: { id: contestId }, select: { teamSize: true } }),
      ])
      if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })

      // Enforce slot limit
      if (contest?.teamSize) {
        const slotsFilled = await prisma.tournamentEntry.count({ where: { tournamentId: contestId, groupId: teamId } })
        if (slotsFilled >= contest.teamSize) return Response.json({ error: 'Team is full' }, { status: 400 })
      }

      const existing = await prisma.tournamentEntry.findFirst({ where: { tournamentId: contestId, userId: uid } })
      if (existing) {
        await prisma.tournamentEntry.update({ where: { id: existing.id }, data: { groupId: teamId, teamName: team.name } })
      } else {
        await prisma.tournamentEntry.create({ data: { tournamentId: contestId, userId: uid, score: 0, groupId: teamId, teamName: team.name } })
      }
      return Response.json({ success: true })
    }

    if (action === 'leave') {
      if (!contestId) return Response.json({ error: 'contestId required' }, { status: 400 })
      await prisma.tournamentEntry.updateMany({
        where: { tournamentId: contestId, userId: uid },
        data: { groupId: null, teamName: null },
      })
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('[POST /api/group-contests/teams]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { teamId, name, emoji, color, description } = await request.json()
    if (!teamId) return Response.json({ error: 'teamId required' }, { status: 400 })

    const team = await prisma.contestTeam.findUnique({ where: { id: teamId } })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })
    if (team.captainId !== uid) return Response.json({ error: 'Only the captain can edit this team' }, { status: 403 })

    await prisma.contestTeam.update({
      where: { id: teamId },
      data: {
        ...(name && { name: name.trim() }),
        ...(emoji && { emoji }),
        ...(color && { color }),
        ...(description !== undefined && { description: description || null }),
      },
    })

    if (name) {
      await prisma.tournamentEntry.updateMany({ where: { groupId: teamId }, data: { teamName: name.trim() } })
    }
    return Response.json({ success: true })
  } catch (e) {
    console.error('[PATCH /api/group-contests/teams]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { teamId } = await request.json()
    if (!teamId) return Response.json({ error: 'teamId required' }, { status: 400 })

    const team = await prisma.contestTeam.findUnique({ where: { id: teamId } })
    if (!team) return Response.json({ error: 'Team not found' }, { status: 404 })
    if (team.captainId !== uid) return Response.json({ error: 'Only the captain can delete this team' }, { status: 403 })

    await prisma.tournamentEntry.updateMany({ where: { groupId: teamId }, data: { groupId: null, teamName: null } })
    await prisma.contestTeam.delete({ where: { id: teamId } })
    return Response.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/group-contests/teams]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
