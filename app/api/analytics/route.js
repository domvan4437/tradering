import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const [screenings, positions] = await Promise.all([
    prisma.screening.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.position.findMany({ where: { userId: session.user.id }, orderBy: { openedAt: 'asc' } }),
  ])

  // ── Screening analytics ──────────────────────────────────────────────────
  const completed = screenings.filter(s => s.outcome && s.outcome !== 'PENDING')
  const wins = completed.filter(s => s.outcome === 'WIN')
  const losses = completed.filter(s => s.outcome === 'LOSS')
  const winRate = completed.length ? Math.round((wins.length / completed.length) * 100) : 0

  // Win rate by commodity
  const byCommodity = {}
  completed.forEach(s => {
    if (!byCommodity[s.commodity]) byCommodity[s.commodity] = { wins: 0, losses: 0 }
    if (s.outcome === 'WIN') byCommodity[s.commodity].wins++
    else byCommodity[s.commodity].losses++
  })
  const commodityStats = Object.entries(byCommodity).map(([name, d]) => ({
    name, wins: d.wins, losses: d.losses,
    total: d.wins + d.losses,
    winRate: Math.round((d.wins / (d.wins + d.losses)) * 100),
  })).sort((a, b) => b.total - a.total)

  // Win rate by direction
  const buyWins = wins.filter(s => s.direction === 'BUY').length
  const buyTotal = completed.filter(s => s.direction === 'BUY').length
  const sellWins = wins.filter(s => s.direction === 'SELL').length
  const sellTotal = completed.filter(s => s.direction === 'SELL').length

  // Win rate by month
  const byMonth = Array(12).fill(null).map(() => ({ wins: 0, total: 0 }))
  completed.forEach(s => {
    const m = new Date(s.createdAt).getMonth()
    byMonth[m].total++
    if (s.outcome === 'WIN') byMonth[m].wins++
  })
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const monthStats = byMonth.map((d, i) => ({
    month: monthNames[i],
    winRate: d.total ? Math.round((d.wins / d.total) * 100) : null,
    total: d.total,
  }))

  // Streak
  let currentStreak = 0, maxWinStreak = 0, maxLossStreak = 0, streak = 0
  let streakType = null
  completed.forEach(s => {
    const isWin = s.outcome === 'WIN'
    if (streakType === null) { streakType = isWin; streak = 1 }
    else if (isWin === streakType) { streak++ }
    else { streakType = isWin; streak = 1 }
    if (isWin && streak > maxWinStreak) maxWinStreak = streak
    if (!isWin && streak > maxLossStreak) maxLossStreak = streak
  })
  if (completed.length) {
    const lastOutcome = completed[completed.length - 1].outcome === 'WIN'
    currentStreak = streak * (lastOutcome ? 1 : -1)
  }

  // Stage fail patterns
  const failStages = {}
  screenings.filter(s => s.stageFailed).forEach(s => {
    failStages[s.stageFailed] = (failStages[s.stageFailed] || 0) + 1
  })
  const failPatterns = Object.entries(failStages).sort((a, b) => b[1] - a[1]).map(([stage, count]) => ({ stage, count }))

  // Pass rate
  const passRate = screenings.length ? Math.round((screenings.filter(s => s.passed).length / screenings.length) * 100) : 0

  // ── Position analytics ────────────────────────────────────────────────────
  const closedPositions = positions.filter(p => p.status === 'closed' && p.pnl != null)
  const openPositions = positions.filter(p => p.status === 'open')

  const totalPnL = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0)
  const bestTrade = closedPositions.reduce((best, p) => (!best || p.pnl > best.pnl) ? p : best, null)
  const worstTrade = closedPositions.reduce((worst, p) => (!worst || p.pnl < worst.pnl) ? p : worst, null)
  const avgWin = wins.length ? wins.reduce((s, p) => s + (p.pnl || 0), 0) / wins.length : 0
  const avgLoss = losses.length ? losses.reduce((s, p) => s + (p.pnl || 0), 0) / losses.length : 0
  const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : null

  // Open risk
  const openRisk = openPositions.reduce((sum, p) => {
    if (!p.stopPrice) return sum
    const riskPerContract = Math.abs(p.entryPrice - p.stopPrice) * p.contractSize
    return sum + riskPerContract * p.contracts
  }, 0)

  return Response.json({
    screenings: {
      total: screenings.length,
      passed: screenings.filter(s => s.passed).length,
      passRate,
      completed: completed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      currentStreak,
      maxWinStreak,
      maxLossStreak,
      commodityStats,
      monthStats,
      failPatterns,
      byDirection: {
        buy: { wins: buyWins, total: buyTotal, winRate: buyTotal ? Math.round(buyWins/buyTotal*100) : 0 },
        sell: { wins: sellWins, total: sellTotal, winRate: sellTotal ? Math.round(sellWins/sellTotal*100) : 0 },
      },
    },
    positions: {
      open: openPositions.length,
      closed: closedPositions.length,
      totalPnL,
      openRisk,
      bestTrade,
      worstTrade,
      profitFactor,
    },
  })
}
