import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
}

// GET /api/users/search?q=someName
// Resolves a typed name to real User rows. Matches username, displayName, or name
// (case-insensitive, partial match) since not every account has username/displayName set.
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    if (!q) return Response.json({ users: [] })
    if (q.length > 100) return Response.json({ error: 'Query too long' }, { status: 400 })

    // PostgREST or= filter across three columns, case-insensitive partial match.
    // Encode the search term once, reuse across all three ilike clauses.
    const term = encodeURIComponent(`*${q}*`)
    const filter = `?or=(username.ilike.${term},displayName.ilike.${term},name.ilike.${term})&select=id,username,displayName,name,verifiedBadge&limit=10`

    const rows = await db.get('User', filter)
    if (!Array.isArray(rows)) return Response.json({ users: [] })

    // Never expose this user's own row as a search result for messaging themselves,
    // and never leak email/password/etc — select above already limits columns.
    const users = rows
      .filter(u => u.id !== session.user.id)
      .map(u => ({
        id: u.id,
        username: u.username || null,
        displayName: u.displayName || u.name || u.username || 'Unknown',
        verifiedBadge: !!u.verifiedBadge,
      }))

    return Response.json({ users })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
