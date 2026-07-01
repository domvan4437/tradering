import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const type = searchParams.get('type') || 'free' // 'free' | 'paid'
    const metric = searchParams.get('metric') || 'pnl' // 'pnl' | 'winrate'

    const now = new Date()
    const since = period === 'week' ? new Date(now - 7*86400000) :
                  period === 'month' ? new Date(now - 30*86400000) :
                  new Date(0)

    // H2H matches in period, filtered by paid/free
    const matches = await prisma.h2HMatch.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: since },
        tournament: type === 'paid' ? { buyIn: { gt: 0 } } : { buyIn: 0 },
      },
      include: {
        challenger: { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
        opponent:   { select: { id: true, name: true, username: true, displayName: true, profileSlug: true } },
      },
    })

    const userMap = {}
    const upsert = (u) => {
      if (!u) return
      if (!userMap[u.id]) {
        userMap[u.id] = {
          id: u.id,
          name: u.displayName || u.name || u.username || 'Trader',
          username: u.username || '',
          profileSlug: u.profileSlug || u.username || u.id,
          wins: 0, losses: 0, matches: 0, totalPnl: 0,
          isMe: u.id === session.user.id,
        }
      }
    }

    for (const m of matches) {
      upsert(m.challenger)
      upsert(m.opponent)
      if (m.challengerId && userMap[m.challengerId]) {
        userMap[m.challengerId].matches++
        userMap[m.challengerId].totalPnl += m.challengerScore || 0
        if (m.winnerId === m.challengerId) userMap[m.challengerId].wins++
        else userMap[m.challengerId].losses++
      }
      if (m.opponentId && userMap[m.opponentId]) {
        userMap[m.opponentId].matches++
        userMap[m.opponentId].totalPnl += m.opponentScore || 0
        if (m.winnerId === m.opponentId) userMap[m.opponentId].wins++
        else userMap[m.opponentId].losses++
      }
    }

    // Always include self
    if (!userMap[session.user.id]) {
      const me = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, username: true, displayName: true, profileSlug: true },
      })
      if (me) upsert(me)
    }

    const sorted = Object.values(userMap).map(e => ({
      ...e,
      winRate: e.matches ? Math.round(e.wins / e.matches * 100) : 0,
    }))

    if (metric === 'winrate') {
      sorted.sort((a, b) => b.winRate - a.winRate || b.matches - a.matches)
    } else {
      sorted.sort((a, b) => b.totalPnl - a.totalPnl)
    }

    const leaderboard = sorted.map((e, i) => ({ ...e, rank: i + 1 }))

    return Response.json({ leaderboard })
  } catch (e) {
    console.error('[GET /api/leaderboard]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
