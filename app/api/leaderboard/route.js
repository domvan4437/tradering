import { getSession } from '../../../lib/auth'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${URL}/rest/v1/${t}${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()),
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Get all users
    const users = await db.get('User', `?select=id,name,email&limit=100`)
    
    // Get trades for each user in time period
    const now = new Date()
    const periodStart = period === 'week' ? new Date(now - 7*86400000) :
                        period === 'month' ? new Date(now - 30*86400000) :
                        new Date(now - 365*86400000)

    const leaderboard = await Promise.all(users.map(async u => {
      const trades = await db.get('Trade', `?userId=eq.${u.id}&select=pnl,createdAt`)
      const periodTrades = trades.filter(t => new Date(t.createdAt) >= periodStart)
      const totalPnl = periodTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
      const wins = periodTrades.filter(t => parseFloat(t.pnl) > 0).length
      const winRate = periodTrades.length ? Math.round(wins / periodTrades.length * 100) : 0
      
      // H2H record
      const wins_h2h = await db.get('H2HMatch', `?winnerId=eq.${u.id}&status=eq.completed&select=id`)
      const matches = await db.get('H2HMatch', `?or=(challengerId.eq.${u.id},opponentId.eq.${u.id})&status=eq.completed&select=id`)
      
      return {
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'Trader',
        pnl: totalPnl,
        trades: periodTrades.length,
        winRate,
        h2wWins: wins_h2h.length || 0,
        h2hMatches: matches.length || 0,
        isMe: u.id === session.user.id,
      }
    }))

    leaderboard.sort((a, b) => b.pnl - a.pnl)
    leaderboard.forEach((e, i) => { e.rank = i + 1 })

    return Response.json({ leaderboard: leaderboard.filter(e => e.trades > 0 || e.isMe) })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
