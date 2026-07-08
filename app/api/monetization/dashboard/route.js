import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const now = new Date()
    const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLast   = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLast     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // ── User's connect status (stored in customFields) ───────────────
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { customFields: true, plan: true },
    })
    const cf = (user?.customFields && typeof user.customFields === 'object') ? user.customFields : {}
    const stripeConnectId = cf.stripeConnectId || null
    const stripeConnectStatus = cf.stripeConnectStatus || null // 'pending' | 'active'

    // ── Groups owned by user (with paid members) ─────────────────────
    const myGroups = await prisma.group.findMany({
      where: { ownerId: uid },
      select: {
        id: true, name: true, monthlyPrice: true, price: true, isPublic: true, isPrivate: true,
        _count: { select: { members: true } },
        memberships: {
          where: { status: 'active' },
          select: { monthlyFee: true, joinedAt: true, status: true },
        },
      },
    })

    const paidGroups = myGroups.filter(g => (g.monthlyPrice > 0 || g.price > 0))

    // ── Revenue calculations ──────────────────────────────────────────
    const PLATFORM_FEE = 0.05 // 5% platform fee

    // From CreatorPayout table (actual paid out amounts)
    const [allTimePayouts, thisMonthPayouts, lastMonthPayouts] = await Promise.all([
      prisma.creatorPayout.aggregate({
        where: { creatorId: uid },
        _sum: { amount: true },
      }),
      prisma.creatorPayout.aggregate({
        where: { creatorId: uid, createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.creatorPayout.aggregate({
        where: { creatorId: uid, createdAt: { gte: startOfLast, lte: endOfLast } },
        _sum: { amount: true },
      }),
    ])

    // Monthly recurring revenue from active memberships (what they should earn)
    const mrr = myGroups.reduce((sum, g) =>
      sum + g.memberships.reduce((s, m) => s + (m.monthlyFee * (1 - PLATFORM_FEE)), 0), 0)

    // Pending payout = MRR not yet paid out
    const paidOutThisMonth = thisMonthPayouts._sum.amount || 0
    const pendingPayout = Math.max(0, mrr - paidOutThisMonth)

    // ── Subscribers ───────────────────────────────────────────────────
    const totalActiveSubscribers = myGroups.reduce((s, g) => s + g.memberships.length, 0)

    // Cancelled this month: memberships that were active but have no joinedAt this month
    // (approximate: count members who joined then left — hard without a cancellation table)
    // Use GroupMembership cancelled status if present
    const cancelledThisMonth = await prisma.groupMembership.count({
      where: {
        group: { ownerId: uid },
        status: 'cancelled',
        joinedAt: { gte: startOfMonth },
      },
    }).catch(() => 0)

    // ── Recent payouts ────────────────────────────────────────────────
    const recentPayouts = await prisma.creatorPayout.findMany({
      where: { creatorId: uid },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, amount: true, type: true, description: true, paidOut: true, createdAt: true },
    })

    // ── Paid products list ────────────────────────────────────────────
    const products = paidGroups.map(g => ({
      id: g.id,
      name: g.name,
      type: 'group',
      monthlyPrice: g.monthlyPrice || g.price || 0,
      activeSubscribers: g.memberships.length,
      mrr: g.memberships.reduce((s, m) => s + (m.monthlyFee * (1 - PLATFORM_FEE)), 0),
    }))

    return Response.json({
      stripeConnectId,
      stripeConnectStatus,
      plan: user?.plan || 'free',
      earnings: {
        thisMonth:  thisMonthPayouts._sum.amount || 0,
        lastMonth:  lastMonthPayouts._sum.amount || 0,
        allTime:    allTimePayouts._sum.amount || 0,
        mrr,
        pendingPayout,
      },
      subscribers: {
        active:           totalActiveSubscribers,
        cancelledMonth:   cancelledThisMonth,
      },
      products,
      recentPayouts,
    })
  } catch (e) {
    console.error('[GET /api/monetization/dashboard]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
