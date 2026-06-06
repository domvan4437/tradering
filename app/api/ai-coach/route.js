import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

// ── Rate limits by plan ───────────────────────────────────────
const LIMITS = {
  free:   10,   // 10 messages per day
  pro:    100,  // 100 messages per day
  trader: null, // unlimited
};

async function checkRateLimit(userId, plan) {
  const limit = LIMITS[plan] ?? LIMITS.free;
  if (limit === null) return { allowed: true, used: 0, limit: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count AI calls today using customFields JSON column
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { customFields: true },
  });

  const fields = (user?.customFields || {});
  const todayKey = today.toISOString().slice(0, 10);
  const aiUsage = fields.aiUsage || {};

  // Reset if it's a new day
  const used = aiUsage.date === todayKey ? (aiUsage.count || 0) : 0;

  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  // Increment counter
  await prisma.user.update({
    where: { id: userId },
    data: {
      customFields: {
        ...fields,
        aiUsage: { date: todayKey, count: used + 1 },
      },
    },
  });

  return { allowed: true, used: used + 1, limit };
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })

  // ── Rate limiting ─────────────────────────────────────────
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true },
    });

    const plan = user?.plan || 'free';
    const { allowed, used, limit } = await checkRateLimit(session.user.id, plan);

    if (!allowed) {
      return Response.json({
        error: 'rate_limit',
        message: plan === 'free'
          ? `You've used all ${limit} free AI messages for today. Upgrade to Pro for 100 messages/day, or Trader for unlimited.`
          : `You've reached your daily limit of ${limit} AI messages. Resets at midnight.`,
        used,
        limit,
        plan,
        upgradeRequired: plan === 'free',
      }, { status: 429 });
    }
  } catch(e) {
    // If rate limit check fails, allow the request (don't block users due to our DB errors)
    console.error('Rate limit check failed:', e.message);
  }

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
    userData = { note: 'Trading data unavailable — providing general coaching.' }
  }

  const systemPrompt = `You are an expert AI trading coach for TradeZar, a professional trading platform. You have deep knowledge of:
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

  const apiMessages = (chatHistory || [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

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
