import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

const geoCache = new Map()

async function geocode(city, country) {
  const key = [city, country].filter(Boolean).join(', ').toLowerCase()
  if (!key) return null
  if (geoCache.has(key)) return geoCache.get(key)

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(key)}&format=json&limit=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Tradering/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    const data = await res.json()
    if (data?.[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geoCache.set(key, coords)
      return coords
    }
  } catch {}
  geoCache.set(key, null)
  return null
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Use Prisma - city/country are now in the schema
    const rows = await prisma.user.findMany({
      where: {
        OR: [
          { city: { not: null } },
          { country: { not: null } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        name: true,
        bio: true,
        city: true,
        country: true,
        tradingStyle: true,
        primaryAssets: true,
        openToMeetups: true,
        image: true,
        groupMembers: {
          select: {
            group: {
              select: { id: true, name: true, memberCount: true, isPublic: true },
            },
          },
          take: 5,
        },
      },
    })

    // Geocode unique locations, staggered to respect Nominatim rate limit
    const seen = new Set()
    for (const r of rows) {
      const key = [r.city, r.country].filter(Boolean).join(', ').toLowerCase()
      if (key && !seen.has(key) && !geoCache.has(key)) {
        seen.add(key)
        await geocode(r.city, r.country)
        await new Promise(res => setTimeout(res, 260))
      }
    }

    const traders = rows.map(r => {
      const key = [r.city, r.country].filter(Boolean).join(', ').toLowerCase()
      const coords = geoCache.get(key)
      if (!coords) return null

      // Small jitter so stacked pins are visible
      const jitter = () => (Math.random() - 0.5) * 0.06
      return {
        id: r.id,
        displayName: r.displayName || r.name || r.username || 'Trader',
        username: r.username || null,
        bio: r.bio || null,
        city: r.city || null,
        country: r.country || null,
        tradingStyle: r.tradingStyle || null,
        assets: r.primaryAssets ? r.primaryAssets.split(',').map(s => s.trim()).filter(Boolean) : [],
        openToMeetups: !!r.openToMeetups,
        groups: (r.groupMembers || [])
          .map(m => m.group)
          .filter(g => g.isPublic),
        isMe: r.id === session.user.id,
        image: r.image || null,
        lat: coords.lat + jitter(),
        lng: coords.lng + jitter(),
      }
    }).filter(Boolean)

    return Response.json({ traders })
  } catch (e) {
    console.error('[GET /api/social/map]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
