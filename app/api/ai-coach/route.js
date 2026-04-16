import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })

  // Pull all user data for personalized analysis
  const [screenings, positions, ideas, weeklyReviews, watchlist] = await Promise.all([
    prisma.screening.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.position.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.idea.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.weeklyReview.findMany({ where: { userId: session.user.id }, orderBy: { weekOf: 'desc' }, take: 12 }),
    prisma.watchlistItem.findMany({ where: { userId: session.user.id } }),
  ])

  // Build stats
  const withOutcome = screenings.filter(s => s.outcome)
  const wins = withOutcome.filter(s => s.outcome === 'WIN')
  const losses = withOutcome.filter(s => s.outcome === 'LOSS')
  const winRate = withOutcome.length ? Math.round((wins.length / withOutcome.length) * 100) : 0
  const passedScreenings = screenings.filter(s => s.passed)
  const passRate = screenings.length ? Math.round((passedScreenings.length / screenings.length) * 100) : 0

  // Commodity breakdown
  const byCommodity = {}
  withOutcome.forEach(s => {
    const k = s.commodity
    if (!byCommodity[k]) byCommodity[k] = { wins: 0, losses: 0 }
    if (s.outcome === 'WIN') byCommodity[k].wins++
    else byCommodity[k].losses++
  })
  const commodityPerf = Object.entries(byCommodity).map(([c, d]) => ({
    commodity: c, wins: d.wins, losses: d.losses, winRate: Math.round((d.wins / (d.wins + d.losses)) * 100)
  })).sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))

  // Direction breakdown
  const longWins = wins.filter(s => s.direction === 'LONG').length
  const longLosses = losses.filter(s => s.direction === 'LONG').length
  const shortWins = wins.filter(s => s.direction === 'SHORT').length
  const shortLosses = losses.filter(s => s.direction === 'SHORT').length

  // Closed positions with PnL
  const closedPositions = positions.filter(p => p.status === 'closed' && p.pnl !== null)
  const totalPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0)
  const avgPnl = closedPositions.length ? totalPnl / closedPositions.length : 0

  // Recent journal themes
  const recentReviews = weeklyReviews.slice(0, 4).map(r => r.whatDidnt || '').filter(Boolean).join(' ')

  const prompt = `You are an expert trading coach conducting a personalized performance analysis. Analyze this trader's actual data and provide specific, actionable insights.

TRADER DATA:
- Total Screenings: ${screenings.length} | Pass Rate: ${passRate}%
- Screened with Outcomes: ${withOutcome.length} | Win Rate: ${winRate}%
- Long trades: ${longWins}W / ${longLosses}L | Short trades: ${shortWins}W / ${shortLosses}L
- Closed Positions: ${closedPositions.length} | Total PnL: $${totalPnl.toFixed(2)} | Avg PnL: $${avgPnl.toFixed(2)}
- Watchlist: ${watchlist.map(w => w.commodity).join(', ') || 'empty'}
- Active Ideas: ${ideas.filter(i => i.status === 'active').length} | Watching: ${ideas.filter(i => i.status === 'watching').length}

PERFORMANCE BY COMMODITY (top 5):
${commodityPerf.slice(0, 5).map(c => `${c.commodity}: ${c.wins}W/${c.losses}L (${c.winRate}%)`).join('\n')}

STAGE FAILURES (what stopped most screenings):
${screenings.filter(s => !s.passed && s.stageFailed).slice(0, 10).map(s => s.stageFailed).join(', ')}

RECENT JOURNAL THEMES (what hasn't worked):
${recentReviews || 'No journal entries yet'}

Write a personalized coaching analysis with these sections:

**Overall Assessment**
2-3 sentences on their overall performance and what the data reveals about their trading style.

**Your Strengths**
Specific strengths based on the data. Be concrete — name specific commodities or patterns where they excel.

**Critical Weaknesses**
The 2-3 most important things holding them back. Be direct and specific. Reference actual numbers.

**Pattern I Notice**
One specific behavioral or strategic pattern in their data that they may not have noticed themselves.

**This Week's Focus**
One specific, actionable thing to work on this week. Not generic advice — something directly tied to their data.

**3 Month Goal**
A concrete, measurable target they should aim for based on their current trajectory.

Be direct, data-driven, and specific. Avoid generic trading advice. Every sentence should reference their actual numbers.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    return Response.json({ analysis: text, stats: { screenings: screenings.length, winRate, passRate, closedPositions: closedPositions.length, totalPnl } })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
