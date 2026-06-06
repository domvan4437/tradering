import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${_URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.status),
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { targetUserId, action } = await request.json()
    if (action === 'unfollow') {
      await db.del('Follow', `?followerId=eq.${session.user.id}&followingId=eq.${targetUserId}`)
    } else {
      const existing = await db.get('Follow', `?followerId=eq.${session.user.id}&followingId=eq.${targetUserId}`)
      if (!existing?.length) {
        await db.post('Follow', { followerId: session.user.id, followingId: targetUserId, createdAt: new Date().toISOString() })
      }
    }
    return Response.json({ success: true })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const [followers, following] = await Promise.all([
      db.get('Follow', `?followingId=eq.${userId}&select=followerId`),
      db.get('Follow', `?followerId=eq.${userId}&select=followingId`),
    ])
    return Response.json({ followers: followers?.length || 0, following: following?.length || 0 })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
