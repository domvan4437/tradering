import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()

    const allowed = ['name','username','bio','country','city','tradingStyle','experience','primaryAssets','openToMeetups','openToMentoring','twitter','instagram','youtube','website','publicWinRate','publicPnl','publicTrades','publicLocation','tagline','displayName','image']
    const update = {}
    allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k] })
    // handle legacy 'assets' key
    if (body.assets !== undefined && update.primaryAssets === undefined) update.primaryAssets = body.assets
    // primaryAssets is stored as a JSON string in the DB
    if (Array.isArray(update.primaryAssets)) update.primaryAssets = JSON.stringify(update.primaryAssets)

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: update,
    })
    return Response.json({ user })
  } catch(e) {
    console.error('[PATCH /api/profile/update]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, username: true, displayName: true,
        bio: true, country: true, city: true, tradingStyle: true, experience: true,
        primaryAssets: true, openToMeetups: true, openToMentoring: true,
        twitter: true, instagram: true, youtube: true, website: true,
        publicWinRate: true, publicPnl: true, publicTrades: true,
        publicLocation: true, tagline: true, plan: true, image: true,
        _count: { select: { followers: true, following: true } },
      },
    })
    if (user && typeof user.primaryAssets === 'string') {
      try { user.primaryAssets = JSON.parse(user.primaryAssets) } catch { user.primaryAssets = [] }
    }
    if (user) {
      user.followerCount  = user._count?.following ?? 0
      user.followingCount = user._count?.followers ?? 0
    }
    return Response.json({ user })
  } catch(e) {
    console.error('[GET /api/profile/update]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
