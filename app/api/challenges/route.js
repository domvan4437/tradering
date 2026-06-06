import { getSession } from '../../../lib/auth'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${URL}/rest/v1/${t}${q}`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }).then(r => r.status),
}

// GET /api/challenges — list open H2H challenges + user's active matches
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    // Open challenges (waiting for opponent)
    const open = await db.get('Tournament', `?type=eq.h2h&status=eq.open&select=*&order=createdAt.desc&limit=20`)
    
    // My active matches
    const myMatches = await db.get('H2HMatch', `?or=(challengerId.eq.${uid},opponentId.eq.${uid})&status=in.(active,waiting)&select=*&order=createdAt.desc`)
    
    // My invites (waiting, I'm opponent)
    const invites = await db.get('H2HMatch', `?opponentId=eq.${uid}&status=eq.waiting&select=*&order=createdAt.desc`)

    // Get user names for matches
    const userIds = [...new Set([
      ...myMatches.map(m => [m.challengerId, m.opponentId]).flat(),
      ...invites.map(m => m.challengerId),
      ...open.map(m => m.creatorId),
    ].filter(Boolean))]

    let users = []
    if (userIds.length > 0) {
      users = await db.get('User', `?id=in.(${userIds.join(',')})&select=id,name,email`)
    }
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name || u.email?.split('@')[0] || 'Trader']))

    // Get journal trades for P&L calculation
    const journalTrades = await db.get('Trade', `?userId=eq.${uid}&select=*&order=createdAt.desc&limit=500`)

    // Calculate P&L for each active match
    const matchesWithPnl = myMatches.map(m => {
      const start = m.startDate ? new Date(m.startDate) : null
      const end = m.endDate ? new Date(m.endDate) : null
      const myTrades = start ? journalTrades.filter(t => {
        const d = new Date(t.createdAt)
        return d >= start && (!end || d <= end)
      }) : []
      const myPnl = myTrades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)
      const isChallenger = m.challengerId === uid
      return {
        ...m,
        challengerName: userMap[m.challengerId] || 'Trader',
        opponentName: m.opponentId ? (userMap[m.opponentId] || 'Trader') : 'Waiting...',
        myPnl: myPnl.toFixed(2),
        myRole: isChallenger ? 'challenger' : 'opponent',
        timeLeft: end ? getTimeLeft(end) : null,
      }
    })

    return Response.json({
      open: open.map(c => ({ ...c, creatorName: userMap[c.creatorId] || 'Trader' })),
      myMatches: matchesWithPnl,
      invites: invites.map(i => ({ ...i, challengerName: userMap[i.challengerId] || 'Trader' })),
    })
  } catch(e) {
    console.error('Challenges GET error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/challenges — create a new challenge
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { type, asset, duration, stake, stakeType, description, inviteUserId } = await request.json()

    const now = new Date()
    const endDate = new Date(now.getTime() + parseDuration(duration))

    // Create tournament record
    const tourney = await db.post('Tournament', {
      creatorId: session.user.id,
      name: `${session.user.name || 'Trader'} vs ${inviteUserId ? 'Invited' : 'Open'}`,
      description: description || '',
      type: 'h2h',
      status: inviteUserId ? 'waiting' : 'open',
      assetClasses: [asset],
      maxCallsPerDay: 99,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      buyIn: stakeType === 'real' ? parseFloat(stake) || 0 : 0,
      prizePool: stakeType === 'real' ? (parseFloat(stake) || 0) * 2 : 0,
      createdAt: now.toISOString(),
    })

    if (!tourney || tourney.error) throw new Error('Failed to create tournament')
    const t = Array.isArray(tourney) ? tourney[0] : tourney

    // Create H2H match
    const match = await db.post('H2HMatch', {
      tournamentId: t.id,
      challengerId: session.user.id,
      opponentId: inviteUserId || null,
      status: inviteUserId ? 'waiting' : 'open',
      challengerScore: 0,
      opponentScore: 0,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: now.toISOString(),
    })

    return Response.json({ success: true, matchId: Array.isArray(match) ? match[0]?.id : match?.id })
  } catch(e) {
    console.error('Challenges POST error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/challenges — accept/decline/resolve
export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { matchId, action } = await request.json()

    if (action === 'accept') {
      await db.patch('H2HMatch', `?id=eq.${matchId}`, {
        opponentId: session.user.id,
        status: 'active',
        startDate: new Date().toISOString(),
      })
      return Response.json({ success: true })
    }

    if (action === 'decline') {
      await db.patch('H2HMatch', `?id=eq.${matchId}`, { status: 'cancelled' })
      return Response.json({ success: true })
    }

    if (action === 'resolve') {
      // Get match
      const matches = await db.get('H2HMatch', `?id=eq.${matchId}&select=*`)
      const m = matches[0]
      if (!m) return Response.json({ error: 'Match not found' }, { status: 404 })

      // Get journal trades for both players during match window
      const start = new Date(m.startDate)
      const end = new Date(m.endDate)

      const [cTrades, oTrades] = await Promise.all([
        db.get('Trade', `?userId=eq.${m.challengerId}&select=pnl,createdAt`),
        m.opponentId ? db.get('Trade', `?userId=eq.${m.opponentId}&select=pnl,createdAt`) : Promise.resolve([]),
      ])

      const calcPnl = trades => trades.filter(t => {
        const d = new Date(t.createdAt); return d >= start && d <= end
      }).reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

      const cPnl = calcPnl(cTrades)
      const oPnl = calcPnl(oTrades)
      const winnerId = cPnl > oPnl ? m.challengerId : cPnl < oPnl ? m.opponentId : null // null = tie

      await db.patch('H2HMatch', `?id=eq.${matchId}`, {
        status: 'completed',
        winnerId,
        challengerScore: cPnl,
        opponentScore: oPnl,
      })
      return Response.json({ success: true, winnerId, challengerPnl: cPnl, opponentPnl: oPnl })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch(e) {
    console.error('Challenges PATCH error:', e.message)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

function parseDuration(d) {
  const map = { '1 Day': 86400000, '3 Days': 259200000, '1 Week': 604800000, '2 Weeks': 1209600000, '1 Month': 2592000000 }
  return map[d] || 604800000
}

function getTimeLeft(end) {
  const diff = new Date(end) - new Date()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  return d > 0 ? `${d}d ${h}h` : `${h}h`
}
