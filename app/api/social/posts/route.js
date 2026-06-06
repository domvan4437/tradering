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
    const userId = searchParams.get('userId')
    const q = userId ? `?userId=eq.${userId}&order=createdAt.desc&limit=50` : `?order=createdAt.desc&limit=50`
    const posts = await db.get('CommunityPost', q)
    return Response.json({ posts: posts || [] })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { content, type, asset, tags } = await request.json()
    if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })
    const post = await db.post('CommunityPost', {
      userId: session.user.id,
      content: content.trim(),
      type: type || 'general',
      asset: asset || null,
      tags: tags || [],
      likes: 0,
      reposts: 0,
      createdAt: new Date().toISOString(),
    })
    return Response.json({ post: Array.isArray(post) ? post[0] : post })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId } = await request.json()
    await db.del('CommunityPost', `?id=eq.${postId}&userId=eq.${session.user.id}`)
    return Response.json({ success: true })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
