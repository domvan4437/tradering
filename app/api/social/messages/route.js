import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${_URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.status),
}

// Real DirectMessage columns (confirmed via PostgREST OpenAPI schema):
// id, fromUserId, toUserId, content, read, createdAt, fileName, fileUrl, imageUrl

// Throws a readable error if Supabase/PostgREST returned an error object instead of
// the expected array, instead of letting a malformed shape silently reach the client
// and crash with something opaque like "rows.forEach is not a function".
function expectArray(result, context) {
  if (Array.isArray(result)) return result
  const detail = result && typeof result === 'object' ? (result.message || JSON.stringify(result)) : String(result)
  throw new Error(`${context}: ${detail}`)
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')
    const myId = session.user.id

    if (!withUserId) {
      const result = await db.get('DirectMessage', `?or=(fromUserId.eq.${myId},toUserId.eq.${myId})&order=createdAt.desc&limit=100`)
      const convos = expectArray(result, 'Failed to load conversations')
      return Response.json({ messages: convos })
    }

    const result = await db.get('DirectMessage', `?or=(and(fromUserId.eq.${myId},toUserId.eq.${withUserId}),and(fromUserId.eq.${withUserId},toUserId.eq.${myId}))&order=createdAt.asc&limit=100`)
    const messages = expectArray(result, 'Failed to load thread')
    return Response.json({ messages })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { receiverId, content } = await request.json()
    if (!content?.trim() || !receiverId) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (receiverId === session.user.id) return Response.json({ error: 'Cannot message yourself' }, { status: 400 })

    // Verify the recipient actually exists before writing a message to them.
    const recipientResult = await db.get('User', `?id=eq.${receiverId}&select=id`)
    const recipientRows = expectArray(recipientResult, 'Failed to verify recipient')
    if (recipientRows.length === 0) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const msg = await db.post('DirectMessage', {
      fromUserId: session.user.id,
      toUserId: receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    })
    if (msg && msg.message && msg.code) {
      // PostgREST error object shape, not a successful insert result
      return Response.json({ error: msg.message }, { status: 500 })
    }
    return Response.json({ message: Array.isArray(msg) ? msg[0] : msg })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

// DELETE /api/social/messages?with=<otherUserId>
// Deletes the entire conversation thread between the current user and the given user.
// Only deletes rows where the current session user is the sender or receiver, so a
// user can never delete the other half of someone else's conversation.
export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')
    if (!withUserId) return Response.json({ error: 'Missing "with" param' }, { status: 400 })
    const myId = session.user.id

    const filter = `?or=(and(fromUserId.eq.${myId},toUserId.eq.${withUserId}),and(fromUserId.eq.${withUserId},toUserId.eq.${myId}))`
    const status = await db.del('DirectMessage', filter)
    if (status >= 400) return Response.json({ error: 'Delete failed' }, { status: 500 })
    return Response.json({ success: true })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
