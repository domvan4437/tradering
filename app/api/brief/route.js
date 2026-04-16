import { getSession } from '../../../lib/auth'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { asset } = await request.json()
  if (!asset) return Response.json({ error: 'No asset specified' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 })

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const prompt = `You are a senior market analyst writing a professional daily brief for ${asset} traders. Today is ${today}.

Write a clear, structured brief with exactly these 4 sections:

**Market Overview**
2-3 sentences on the current trend, momentum, and overall market context for ${asset}.

**Key Levels to Watch**
List 2-3 specific price levels (support, resistance, or pivot points) that traders should monitor today.

**Catalysts & Risks**
2-3 sentences covering upcoming economic events, news drivers, or risk factors that could move ${asset} today or this week.

**Trader's Focus**
One clear, actionable sentence — the single most important thing a ${asset} trader should be watching right now.

Keep the tone professional, direct, and actionable. Write as if briefing experienced traders.`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    if (data.error) return Response.json({ error: data.error.message }, { status: 500 })
    const text = data.content?.[0]?.text || ''
    return Response.json({ brief: text, asset, generatedAt: new Date().toISOString() })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
