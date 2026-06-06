import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${_URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.status),
}

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const allowed = ['name','username','bio','country','city','tradingStyle','experience','assets','openToMeetups','openToMentoring','twitter','instagram','youtube','website','publicWinRate','publicPnl','publicTrades','publicLocation','tagline']
    const update = {}
    allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k] })
    update.updatedAt = new Date().toISOString()
    const user = await db.patch('User', `?id=eq.${session.user.id}`, update)
    return Response.json({ user: Array.isArray(user) ? user[0] : user })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.get('User', `?id=eq.${session.user.id}&select=id,name,email,username,bio,country,city,tradingStyle,experience,assets,openToMeetups,openToMentoring,twitter,instagram,youtube,website,publicWinRate,publicPnl,publicTrades,publicLocation,tagline,plan`)
    return Response.json({ user: user?.[0] || null })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
