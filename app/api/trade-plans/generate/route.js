import { getSession } from '../../../../lib/auth'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { commodity, cotData, seasonalData, currentPrice } = await request.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key' }, { status: 500 })
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const cotContext = cotData ? `COT Index: ${cotData.cotIndex}/100 (${cotData.interpretation}), Net Commercial: ${cotData.currentNet?.toLocaleString()}` : 'COT data not available'
  const seasonalContext = seasonalData ? `Current month avg return: ${seasonalData.currentBias?.avgReturn}%, win rate: ${seasonalData.currentBias?.winRate}%` : 'Seasonal data not available'
  const prompt = `You are a professional futures trading analyst. Generate a structured trade plan for ${commodity}. Today: ${today}. Current Price: ${currentPrice || 'unknown'}. ${cotContext}. ${seasonalContext}. Generate ONLY valid JSON, no other text: {"direction":"LONG or SHORT","thesis":"2-3 sentences on why","entry":"specific price level","stop":"stop loss level","target":"profit target","riskReward":"e.g. 1:2.5","cotContext":"1 sentence on COT","seasonalContext":"1 sentence on seasonal","keyRisks":"main risks","timing":"when to enter"}`
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return Response.json({ error: 'Parse failed' }, { status: 500 })
    return Response.json({ plan: JSON.parse(jsonMatch[0]), commodity })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
