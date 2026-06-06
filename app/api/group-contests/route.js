import { getSession } from '../../../lib/auth'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${URL}/rest/v1/${t}${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
}

// GET — list active group contests + leaderboard
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const contests = await db.get('Tournament', `?type=eq.group&status=in.(open,active)&select=*&order=createdAt.desc&limit=20`)
    
    // For each contest get entries
    const contestsWithEntries = await Promise.all((contests || []).map(async c => {
      const entries = await db.get('TournamentEntry', `?tournamentId=eq.${c.id}&select=*`)
      const userIds = entries.map(e => e.userId).filter(Boolean)
      let users = []
      if (userIds.length > 0) {
        users = await db.get('User', `?id=in.(${userIds.join(',')})&select=id,name,email`)
      }
      const userMap = Object.fromEntries(users.map(u => [u.id, u.name || u.email?.split('@')[0] || 'Trader']))
      
      // Get journal P&L for each entrant
      const entriesWithPnl = await Promise.all(entries.map(async e => {
        const trades = await db.get('Trade', `?userId=eq.${e.userId}&select=pnl,createdAt`)
        const start = new Date(c.startDate)
        const end = new Date(c.endDate)
        const pnl = trades.filter(t => { const d = new Date(t.createdAt); return d >= start && d <= end })
          .reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
        return { ...e, name: userMap[e.userId] || 'Trader', pnl }
      }))
      
      entriesWithPnl.sort((a, b) => b.pnl - a.pnl)
      return { ...c, entries: entriesWithPnl, entryCount: entries.length }
    }))

    // My entries
    const myEntries = await db.get('TournamentEntry', `?userId=eq.${session.user.id}&select=tournamentId`)
    const myContestIds = myEntries.map(e => e.tournamentId)

    return Response.json({ contests: contestsWithEntries, myContestIds })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST — create contest or join contest
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { action, contestId, name, description, asset, duration, buyIn, maxEntrants } = await request.json()

    if (action === 'join') {
      // Check not already joined
      const existing = await db.get('TournamentEntry', `?tournamentId=eq.${contestId}&userId=eq.${session.user.id}&select=id`)
      if (existing && existing.length > 0) return Response.json({ error: 'Already joined' }, { status: 400 })
      
      await db.post('TournamentEntry', {
        tournamentId: contestId,
        userId: session.user.id,
        score: 0,
        rank: 0,
        createdAt: new Date().toISOString(),
      })
      return Response.json({ success: true })
    }

    if (action === 'create') {
      const now = new Date()
      const endDate = new Date(now.getTime() + parseDuration(duration))
      
      const tourney = await db.post('Tournament', {
        creatorId: session.user.id,
        name: name || 'Group Contest',
        description: description || '',
        type: 'group',
        status: 'open',
        assetClasses: [asset || 'Any'],
        maxCallsPerDay: 99,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        buyIn: parseFloat(buyIn) || 0,
        prizePool: 0,
        createdAt: now.toISOString(),
      })
      
      const t = Array.isArray(tourney) ? tourney[0] : tourney
      
      // Creator auto-joins
      await db.post('TournamentEntry', {
        tournamentId: t.id,
        userId: session.user.id,
        score: 0, rank: 0,
        createdAt: new Date().toISOString(),
      })
      
      return Response.json({ success: true, contestId: t.id })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

function parseDuration(d) {
  const map = { '1 Day': 86400000, '3 Days': 259200000, '1 Week': 604800000, '2 Weeks': 1209600000, '1 Month': 2592000000 }
  return map[d] || 604800000
}
