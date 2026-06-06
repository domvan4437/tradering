import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${_URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.status),
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')
    if (!withUserId) {
      const convos = await db.get('DirectMessage', `?or=(senderId.eq.${session.user.id},receiverId.eq.${session.user.id})&order=createdAt.desc&limit=100`)
      return Response.json({ messages: convos || [] })
    }
    const messages = await db.get('DirectMessage', `?or=(and(senderId.eq.${session.user.id},receiverId.eq.${withUserId}),and(senderId.eq.${withUserId},receiverId.eq.${session.user.id}))&order=createdAt.asc&limit=100`)
    return Response.json({ messages: messages || [] })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { receiverId, content } = await request.json()
    if (!content?.trim() || !receiverId) return Response.json({ error: 'Missing fields' }, { status: 400 })
    const msg = await db.post('DirectMessage', {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    })
    return Response.json({ message: Array.isArray(msg) ? msg[0] : msg })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
