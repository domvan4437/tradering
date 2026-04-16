import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.plan !== 'trader') return Response.json({ error: 'Trader plan required' }, { status: 403 })

  // Get all groups owned by this creator
  const groups = await prisma.group.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { memberships: true, messages: true } },
      memberships: { where: { status: 'active' }, select: { monthlyFee: true, joinedAt: true } }
    }
  })

  // Revenue calculations
  const totalMembers = groups.reduce((sum, g) => sum + g._count.memberships, 0)
  const monthlyRevenue = groups.reduce((sum, g) =>
    sum + g.memberships.reduce((s, m) => s + (m.monthlyFee * 0.95), 0), 0)

  // Tournament hosting revenue
  const tournaments = await prisma.tournament.findMany({
    where: { group: { ownerId: session.user.id } },
    include: { _count: { select: { entries: true } }, entries: { select: { paid: true } } }
  })

  // Payouts
  const payouts = await prisma.creatorPayout.findMany({
    where: { group: { ownerId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  const totalEarned = await prisma.creatorPayout.aggregate({
    where: { group: { ownerId: session.user.id } },
    _sum: { amount: true }
  })

  // Member growth — last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const recentMemberships = await prisma.groupMembership.findMany({
    where: { group: { ownerId: session.user.id }, joinedAt: { gte: sixMonthsAgo } },
    select: { joinedAt: true }
  })

  const growthByMonth = {}
  recentMemberships.forEach(m => {
    const key = `${m.joinedAt.getFullYear()}-${String(m.joinedAt.getMonth()+1).padStart(2,'0')}`
    growthByMonth[key] = (growthByMonth[key] || 0) + 1
  })

  // Courses
  const courses = await prisma.groupCourse.findMany({
    where: { group: { ownerId: session.user.id } },
    include: { _count: { select: { lessons: true } } }
  })

  return Response.json({
    stats: { totalMembers, monthlyRevenue, totalEarned: totalEarned._sum.amount || 0, groupCount: groups.length },
    groups: groups.map(g => ({
      id: g.id, name: g.name, memberCount: g._count.memberships,
      monthlyRevenue: g.memberships.reduce((s,m)=>s+(m.monthlyFee*0.95),0),
      monthlyPrice: g.monthlyPrice, isPrivate: g.isPrivate,
    })),
    tournaments: tournaments.map(t => ({
      id: t.id, name: t.name, status: t.status,
      entries: t._count.entries, prizePool: t.prizePool
    })),
    courses: courses.map(c => ({
      id: c.id, title: c.title, price: 0,
      enrollments: c._count.lessons, published: true
    })),
    growth: growthByMonth,
    recentPayouts: payouts
  })
}
