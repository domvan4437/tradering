import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const commodity = searchParams.get('commodity')

  // Get all screenings for this commodity
  const where = { userId: session.user.id }
  if (commodity) where.commodity = { contains: commodity, mode: 'insensitive' }

  const screenings = await prisma.screening.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  // Aggregate stats
  const total = screenings.length
  const passed = screenings.filter(s => s.passed).length
  const withOutcome = screenings.filter(s => s.outcome)
  const wins = withOutcome.filter(s => s.outcome === 'WIN').length
  const losses = withOutcome.filter(s => s.outcome === 'LOSS').length
  const winRate = withOutcome.length ? Math.round((wins / withOutcome.length) * 100) : null

  // By commodity
  const byCommodity = {}
  screenings.forEach(s => {
    const key = s.commodity.toLowerCase()
    if (!byCommodity[key]) byCommodity[key] = { commodity: s.commodity, total: 0, passed: 0, wins: 0, losses: 0 }
    byCommodity[key].total++
    if (s.passed) byCommodity[key].passed++
    if (s.outcome === 'WIN') byCommodity[key].wins++
    if (s.outcome === 'LOSS') byCommodity[key].losses++
  })

  const commodityStats = Object.values(byCommodity)
    .map(c => ({ ...c, passRate: Math.round((c.passed / c.total) * 100), winRate: c.wins + c.losses > 0 ? Math.round((c.wins / (c.wins + c.losses)) * 100) : null }))
    .sort((a, b) => b.total - a.total)

  // Stage failure analysis
  const stageFails = {}
  screenings.filter(s => !s.passed && s.stageFailed).forEach(s => {
    stageFails[s.stageFailed] = (stageFails[s.stageFailed] || 0) + 1
  })

  // Monthly pass rate
  const byMonth = {}
  screenings.forEach(s => {
    const month = new Date(s.createdAt).toLocaleString('en-US', { month: 'short', year: '2-digit' })
    if (!byMonth[month]) byMonth[month] = { month, total: 0, passed: 0 }
    byMonth[month].total++
    if (s.passed) byMonth[month].passed++
  })

  const recentScreenings = screenings.slice(0, 20).map(s => ({
    id: s.id,
    commodity: s.commodity,
    direction: s.direction,
    passed: s.passed,
    stageFailed: s.stageFailed,
    outcome: s.outcome,
    pnl: s.pnl,
    createdAt: s.createdAt,
  }))

  return Response.json({
    summary: { total, passed, passRate: total ? Math.round((passed / total) * 100) : 0, withOutcome: withOutcome.length, wins, losses, winRate },
    commodityStats,
    stageFails,
    monthlyTrend: Object.values(byMonth).slice(-12),
    recentScreenings
  })
}
