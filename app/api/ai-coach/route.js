import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })

  const body = await request.json()
  const { messages: chatHistory, mode } = body

  // Pull user data for context
  let userData = {}
  try {
    const [screenings, positions, ideas, weeklyReviews, watchlist] = await Promise.all([
      prisma.screening.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.position.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.idea.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.weeklyReview.findMany({ where: { userId: session.user.id }, orderBy: { weekOf: 'desc' }, take: 12 }),
      prisma.watchlistItem.findMany({ where: { userId: session.user.id } }),
    ])

    const withOutcome = screenings.filter(s => s.outcome)
    const wins = withOutcome.filter(s => s.outcome === 'WIN')
    const winRate = withOutcome.length ? Math.round((wins.length / withOutcome.length) * 100) : 0
    const passRate = screenings.length ? Math.round((screenings.filter(s => s.passed).length / screenings.length) * 100) : 0
    const closedPositions = positions.filter(p => p.status === 'closed' && p.pnl !== null)
    const totalPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0)

    const byCommodity = {}
    withOutcome.forEach(s => {
      if (!byCommodity[s.commodity]) byCommodity[s.commodity] = { wins: 0, losses: 0 }
      if (s.outcome === 'WIN') byCommodity[s.commodity].wins++
      else byCommodity[s.commodity].losses++
    })
    const commodityPerf = Object.entries(byCommodity)
      .map(([c, d]) => ({ commodity: c, wins: d.wins, losses: d.losses, winRate: Math.round((d.wins / (d.wins + d.losses)) * 100) }))
      .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses))
      .slice(0, 5)

    userData = {
      screenings: screenings.length, winRate, passRate,
      closedPositions: closedPositions.length, totalPnl: totalPnl.toFixed(2),
      watchlist: watchlist.map(w => w.commodity).join(', ') || 'none',
      activeIdeas: ideas.filter(i => i.status === 'active').length,
      commodityPerf: commodityPerf.map(c => `${c.commodity}: ${c.wins}W/${c.losses}L (${c.winRate}%)`).join(', '),
      recentJournal: weeklyReviews.slice(0, 3).map(r => r.whatDidnt || '').filter(Boolean).join(' ').slice(0, 300),
      longRecord: `${wins.filter(s => s.direction === 'LONG').length}W/${withOutcome.filter(s => s.direction === 'LONG' && s.outcome === 'LOSS').length}L`,
      shortRecord: `${wins.filter(s => s.direction === 'SHORT').length}W/${withOutcome.filter(s => s.direction === 'SHORT' && s.outcome === 'LOSS').length}L`,
    }
  } catch(e) {
    // Continue without DB data if unavailable
    userData = { note: 'Trading data unavailable — providing general coaching.' }
  }

  const systemPrompt = `You are an expert AI trading coach for TradeRing, a professional trading platform. You have deep knowledge of:
- Futures, forex, commodities, stocks, and crypto markets
- COT (Commitment of Traders) reports and how to interpret them
- Technical analysis, position sizing, risk management
- Trading psychology and performance improvement
- Seasonal patterns and market structure

TRADER'S DATA:
${JSON.stringify(userData, null, 2)}

COACHING GUIDELINES:
- Be direct, specific, and data-driven. Reference their actual numbers when available.
- Avoid generic advice — everything should be personalized to their situation.
- For trade reviews, ask clarifying questions if needed before giving feedback.
- For strategy building, ask about their style, timeframe, and markets before building.
- For risk calculations, always show your math clearly.
- For COT interpretation, explain in plain English with practical trading implications.
- Keep responses focused and actionable. Use formatting (bold, bullet points) to make responses scannable.
- If asked about specific current market prices or live data, note that you don't have real-time data but can analyze based on what they share.`

  // Build messages array — filter out system messages, keep user/assistant only
  const apiMessages = (chatHistory || [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  // Ensure we have at least one user message
  if (!apiMessages.length || apiMessages[apiMessages.length - 1].role !== 'user') {
    return Response.json({ error: 'No user message found' }, { status: 400 })
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: apiMessages,
      })
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error.message || 'API error')
    const text = data.content?.[0]?.text || ''
    return Response.json({ analysis: text, stats: userData })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
