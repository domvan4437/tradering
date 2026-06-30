import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

function parseDuration(d) {
  if (!d) return 604800000
  const map = { '1 Day': 86400000, '3 Days': 259200000, '1 Week': 604800000, '2 Weeks': 1209600000, '1 Month': 2592000000 }
  if (map[d]) return map[d]
  const m = d.match(/^(\d+)\s+(day|days|week|weeks|month|months)$/)
  if (m) {
    const n = parseInt(m[1])
    if (m[2].startsWith('day')) return n * 86400000
    if (m[2].startsWith('week')) return n * 604800000
    if (m[2].startsWith('month')) return n * 2592000000
  }
  return 604800000
}

function getTimeLeft(end) {
  if (!end) return null
  const diff = new Date(end) - new Date()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `${d}d ${h}h` : `${h}h`
}

const MATCH_INCLUDE = {
  challenger: { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
  opponent:   { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
  tournament: { select: { name: true, type: true, buyIn: true, endDate: true, assetClasses: true, description: true } },
}

const userName = (u) => u?.displayName || u?.name || u?.username || 'Trader'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const [open, myMatches, invites, history] = await Promise.all([
      prisma.h2HMatch.findMany({
        where: { status: 'waiting', opponentId: null, challengerId: { not: uid } },
        include: MATCH_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.h2HMatch.findMany({
        where: { status: { in: ['waiting', 'active'] }, OR: [{ challengerId: uid }, { opponentId: uid }] },
        include: MATCH_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.h2HMatch.findMany({
        where: { status: 'waiting', opponentId: uid },
        include: MATCH_INCLUDE,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.h2HMatch.findMany({
        where: { status: 'completed', OR: [{ challengerId: uid }, { opponentId: uid }] },
        include: MATCH_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    const fmt = (m, portfolioMap = {}) => {
      const isPaid = (m.tournament?.buyIn || 0) > 0
      let challengerScore = m.challengerScore
      let opponentScore = m.opponentScore
      // For active free matches, use live paper trading P&L instead of stale DB score
      if (!isPaid && m.status === 'active' && portfolioMap[m.id]) {
        const portfs = portfolioMap[m.id]
        const cp = portfs.find(p => p.userId === m.challengerId)
        const op = portfs.find(p => p.userId === m.opponentId)
        const equity = (p) => p ? p.trades.reduce((s, t) => s + (t.pnl || 0), 0) + p.positions.reduce((s, pos) => {
          const mult = pos.direction === 'short' ? -1 : 1
          return s + (pos.currentPrice - pos.entryPrice) * pos.quantity * mult
        }, 0) : 0
        challengerScore = +equity(cp).toFixed(2)
        opponentScore = +equity(op).toFixed(2)
      }
      return {
        id: m.id,
        tournamentId: m.tournamentId,
        status: m.status,
        challengerName: userName(m.challenger),
        challengerSlug: m.challenger?.profileSlug || m.challenger?.id,
        opponentName: m.opponent ? userName(m.opponent) : 'Waiting…',
        opponentSlug: m.opponent ? (m.opponent?.profileSlug || m.opponent?.id) : null,
        challengerId: m.challengerId,
        opponentId: m.opponentId,
        winnerId: m.winnerId,
        challengerScore,
        opponentScore,
        timeLeft: getTimeLeft(m.endDate || m.tournament?.endDate),
        buyIn: m.tournament?.buyIn || 0,
        asset: m.tournament?.assetClasses?.[0] || 'Any',
        description: m.tournament?.description || '',
        myRole: m.challengerId === uid ? 'challenger' : 'opponent',
        won: m.winnerId === uid,
        createdAt: m.createdAt,
      }
    }

    // For active free matches in myMatches, fetch live paper trading portfolios
    const activeFreeIds = myMatches
      .filter(m => m.status === 'active' && (m.tournament?.buyIn || 0) === 0)
      .map(m => m.id)

    let portfolioMap = {}
    if (activeFreeIds.length > 0) {
      const portfolios = await prisma.competitionPortfolio.findMany({
        where: { competitionId: { in: activeFreeIds } },
        include: { trades: true, positions: true },
      })
      for (const p of portfolios) {
        if (!portfolioMap[p.competitionId]) portfolioMap[p.competitionId] = []
        portfolioMap[p.competitionId].push(p)
      }
    }

    return Response.json({
      open: open.map(m => fmt(m)),
      myMatches: myMatches.map(m => fmt(m, portfolioMap)),
      invites: invites.map(m => fmt(m)),
      history: history.map(m => fmt(m)),
    })
  } catch (e) {
    console.error('[GET /api/challenges]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { type, asset, duration, stake, description, inviteUserId } = await request.json()

    const now = new Date()
    const endDate = new Date(now.getTime() + parseDuration(duration))

    const tournament = await prisma.tournament.create({
      data: {
        creatorId: session.user.id,
        name: 'H2H Challenge',
        description: description || '',
        type: 'h2h',
        status: 'open',
        assetClasses: [asset || 'Any'],
        maxCallsPerDay: 99,
        startDate: now,
        endDate,
        buyIn: type === 'paid' ? parseFloat(stake) || 0 : 0,
        prizePool: type === 'paid' ? (parseFloat(stake) || 0) * 2 : 0,
      },
    })

    const match = await prisma.h2HMatch.create({
      data: {
        tournamentId: tournament.id,
        challengerId: session.user.id,
        opponentId: inviteUserId || null,
        status: 'waiting',
        startDate: now,
        endDate,
      },
    })

    // Create TournamentEntry for challenger
    await prisma.tournamentEntry.create({
      data: { tournamentId: tournament.id, userId: session.user.id, score: 0 }
    })

    return Response.json({ success: true, matchId: match.id })
  } catch (e) {
    console.error('[POST /api/challenges]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { matchId, action } = await request.json()

    if (action === 'accept') {
      const accepting = await prisma.h2HMatch.update({
        where: { id: matchId },
        data: { opponentId: session.user.id, status: 'active', startDate: new Date() },
      })
      // Create TournamentEntry for opponent (upsert to be safe)
      await prisma.tournamentEntry.upsert({
        where: { tournamentId_userId: { tournamentId: accepting.tournamentId, userId: session.user.id } },
        create: { tournamentId: accepting.tournamentId, userId: session.user.id, score: 0 },
        update: {},
      })
      return Response.json({ success: true })
    }

    if (action === 'decline') {
      await prisma.h2HMatch.update({ where: { id: matchId }, data: { status: 'cancelled' } })
      return Response.json({ success: true })
    }

    if (action === 'resolve') {
      const match = await prisma.h2HMatch.findUnique({ where: { id: matchId } })
      if (!match) return Response.json({ error: 'Not found' }, { status: 404 })
      const ended = match.endDate && new Date() > new Date(match.endDate)
      const winnerId = ended ? (match.challengerScore >= match.opponentScore ? match.challengerId : match.opponentId) : null
      await prisma.h2HMatch.update({ where: { id: matchId }, data: { status: ended ? 'completed' : 'active', winnerId } })
      return Response.json({ success: true })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('[PATCH /api/challenges]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { matchId } = await request.json()
    if (!matchId) return Response.json({ error: 'matchId required' }, { status: 400 })

    const match = await prisma.h2HMatch.findUnique({ where: { id: matchId } })
    if (!match) return Response.json({ error: 'Not found' }, { status: 404 })
    if (match.challengerId !== uid) return Response.json({ error: 'Only the challenger can delete this match' }, { status: 403 })
    if (match.status === 'active') return Response.json({ error: 'Cannot delete an active match' }, { status: 400 })

    // Delete related trade calls then the match
    if (match.tournamentId) {
      await prisma.tradeCall.deleteMany({ where: { tournamentId: match.tournamentId } })
      await prisma.tournamentEntry.deleteMany({ where: { tournamentId: match.tournamentId } })
    }
    await prisma.h2HMatch.delete({ where: { id: matchId } })

    return Response.json({ success: true })
  } catch (e) {
    console.error('[DELETE /api/challenges]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
