import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
}

// GET /api/users/lookup?ids=id1,id2,id3
// Batch-resolves user ids to display info. Used by DMTab to label conversation threads
// without exposing email/password/etc for users who aren't the current session user.
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const idsParam = (searchParams.get('ids') || '').trim()
    if (!idsParam) return Response.json({ users: {} })

    const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(Boolean))].slice(0, 100)
    if (ids.length === 0) return Response.json({ users: {} })

    const inList = ids.join(',')
    const rows = await db.get('User', `?id=in.(${inList})&select=id,username,displayName,name,verifiedBadge`)
    if (!Array.isArray(rows)) return Response.json({ users: {} })

    const users = {}
    for (const u of rows) {
      users[u.id] = {
        id: u.id,
        username: u.username || null,
        displayName: u.displayName || u.name || u.username || 'Unknown user',
        verifiedBadge: !!u.verifiedBadge,
      }
    }
    return Response.json({ users })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
