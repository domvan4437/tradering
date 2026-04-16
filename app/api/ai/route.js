import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, conversationId, includeContext } = await request.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 })

  // Build rich context from user's actual data
  let contextBlock = ''
  if (includeContext) {
    try {
      const [screenings, positions, ideas, watchlist, analytics] = await Promise.all([
        prisma.screening.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: 'desc' }, take: 20, select: { commodity: true, direction: true, passed: true, stageFailed: true, outcome: true, price: true, notes: true, createdAt: true } }),
        prisma.position.findMany({ where: { userId: session.user.id, status: 'open' }, select: { symbol: true, name: true, direction: true, entryPrice: true, stopPrice: true, targetPrice: true, contracts: true, notes: true } }),
        prisma.idea.findMany({ where: { userId: session.user.id, status: { in: ['watching', 'active'] } }, take: 10, select: { title: true, symbol: true, direction: true, status: true, thesis: true, confidence: true } }),
        prisma.watchlistItem.findMany({ where: { userId: session.user.id }, select: { commodity: true } }),
        // Compute basic stats
        prisma.screening.findMany({ where: { userId: session.user.id, outcome: { not: null } }, select: { outcome: true, commodity: true, direction: true } }),
      ])

      const wins = analytics.filter(s => s.outcome === 'WIN').length
      const losses = analytics.filter(s => s.outcome === 'LOSS').length
      const winRate = analytics.length ? Math.round(wins / analytics.length * 100) : 0

      contextBlock = `=== YOUR TRADING DATA (as of ${new Date().toLocaleDateString()}) ===

PERFORMANCE SUMMARY:
  Win rate: ${winRate}% (${wins}W / ${losses}L from ${analytics.length} logged trades)
  Watchlist: ${watchlist.map(w => w.commodity).join(', ') || 'Empty'}

OPEN POSITIONS (${positions.length}):
${positions.map(p => `  ${p.direction} ${p.name}: Entry ${p.entryPrice}, Stop ${p.stopPrice || 'none'}, Target ${p.targetPrice || 'none'}, ${p.contracts} contracts`).join('\n') || '  None'}

ACTIVE IDEAS (${ideas.filter(i => i.status === 'active').length}) / WATCHING (${ideas.filter(i => i.status === 'watching').length}):
${ideas.map(i => `  [${i.status.toUpperCase()}] ${i.symbol || ''} ${i.direction || ''}: ${i.title}${i.confidence ? ` (confidence: ${i.confidence}/10)` : ''}`).join('\n') || '  None'}

RECENT SCREENINGS (last 20):
${screenings.map(s => `  ${new Date(s.createdAt).toLocaleDateString()} | ${s.commodity} | ${s.direction || '?'} | ${s.passed ? 'PASS' : `FAIL at ${s.stageFailed}`} | ${s.outcome || 'not logged'}`).join('\n') || '  None'}

=== END TRADING DATA — Now answer the user's question using this context ===\n\n`
    } catch (err) {
      console.error('Context fetch error:', err)
    }
  }

  // Prepend context to first user message
  const enrichedMessages = messages.map((m, i) => {
    if (i === 0 && m.role === 'user' && contextBlock) {
      return { ...m, content: contextBlock + m.content }
    }
    return m
  })

  const systemPrompt = `You are a professional trading coach and analyst embedded in a commodity and financial futures trading platform called the Commodity Intelligence System (CIS).

You have access to the user's actual trading data — their journal entries, open positions, watchlist, ideas, and win/loss record. Use this data to give personalized, specific advice rather than generic trading wisdom.

Your role:
- Analyze their actual journal data to identify patterns, mistakes, and strengths
- Give specific feedback on their open positions and risk exposure
- Help them prepare for trades using the 9-stage commodity screening framework
- Answer questions about market structure, COT data, seasonals, and macro conditions
- Act as a supportive but honest coach — praise what's working, challenge what isn't
- Never give specific financial advice or tell them to buy/sell a specific instrument

Tone: Direct, knowledgeable, like a senior trader mentoring a junior. Not a generic chatbot. Reference their specific data when possible.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages: enrichedMessages,
      }),
    })

    const data = await res.json()
    const text = data.content?.map(b => b.text || '').join('') || ''

    // Save conversation to DB if conversationId provided
    if (conversationId && text) {
      try {
        const lastUserMessage = messages[messages.length - 1]
        await prisma.aIMessage.createMany({
          data: [
            { conversationId, role: 'user', content: lastUserMessage.content },
            { conversationId, role: 'assistant', content: text },
          ],
        })
        await prisma.aIConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        })
      } catch {}
    }

    if (data.error) {
      console.error('Anthropic API error:', data.error)
      return Response.json({ error: data.error.message || 'API error' }, { status: 500 })
    }
    return Response.json({ text })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
