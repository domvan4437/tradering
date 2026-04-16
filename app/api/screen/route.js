// app/api/screen/route.js
import { getSession, checkScreeningLimit, incrementScreeningCount } from '../../../lib/auth'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Please log in to run screenings', code: 'UNAUTHORIZED' }, { status: 401 })

  const { prompt, marketContext, isFirstStage } = await request.json()

  if (isFirstStage) {
    const limit = await checkScreeningLimit(session.user.id)
    if (!limit.allowed) return Response.json({ error: limit.reason, code: 'LIMIT_REACHED' }, { status: 429 })
    await incrementScreeningCount(session.user.id)
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 })

  const dataBlock = marketContext ? buildDataBlock(marketContext) : ''

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a professional commodity trading analyst applying a strict multi-stage screening framework.
You have been given REAL, LIVE market data. Use it as your primary source of truth.
Be concise. Always start with YES or NO (or BUYING/SELLING for direction stages), then 2-4 sentences referencing the actual numbers.
Today's date is ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`,
      messages: [{ role: 'user', content: dataBlock + prompt }],
    }),
  })

  const data = await res.json()
  const text = data.content?.map((b) => b.text || '').join('') || ''
  return Response.json({ text })
}

function buildDataBlock(d) {
  const lines = ['=== LIVE MARKET DATA ===\n']
  if (d.price) {
    lines.push(`PRICE DATA (${d.ticker}):`)
    lines.push(`  Current price: ${d.price.latest}`)
    lines.push(`  4-week change: ${d.price.pct4w}%`)
    lines.push(`  13-week change: ${d.price.pct13w}%`)
    lines.push(`  26-week change: ${d.price.pct26w}%`)
    lines.push(`  52-week high: ${d.price.high52w} (${d.price.pctFrom52wHigh}% from high)`)
    lines.push(`  52-week low: ${d.price.low52w} (${d.price.pctFrom52wLow}% from low)`)
    lines.push(`  Trending: ${d.price.trending ? 'YES' : 'NO'} — direction: ${d.price.trendDirection}`)
    lines.push('')
  }
  if (d.usdx) {
    lines.push('US DOLLAR INDEX (USDX):')
    lines.push(`  Current level: ${d.usdx.latest}`)
    lines.push(`  4-week change: ${d.usdx.pct4w}%`)
    lines.push(`  13-week change: ${d.usdx.pct13w}%`)
    lines.push(`  Trend: ${d.usdx.direction}`)
    lines.push(`  Bearish for USD: ${d.usdx.bearishForCommodities ? 'YES' : 'NO'}`)
    lines.push('')
  }
  if (d.rates) {
    lines.push('10-YEAR TREASURY YIELD:')
    lines.push(`  Current yield: ${d.rates.latest}%`)
    lines.push(`  13-week change: ${d.rates.pct13w}%`)
    lines.push(`  Direction: ${d.rates.direction}`)
    lines.push('')
  }
  if (d.cot) {
    lines.push(`COT DATA (CFTC — as of ${d.cot.reportDate}):`)
    lines.push(`  Commercial longs: ${d.cot.commLong.toLocaleString()}`)
    lines.push(`  Commercial shorts: ${d.cot.commShort.toLocaleString()}`)
    lines.push(`  Net: ${d.cot.netCommercial.toLocaleString()} → ${d.cot.commercialBias}`)
    lines.push(`  Open interest: ${d.cot.openInterest.toLocaleString()} (${d.cot.openInterestChange}% wk change)`)
    lines.push(`  OI dropped 10-15%+: ${d.cot.oiDropped15 ? 'YES' : 'NO'}`)
    lines.push('')
  }
  if (d.cotIndexData && !d.cotIndexData.error) {
    const ci = d.cotIndexData
    lines.push('COT INDEX (3-YEAR RANGE):')
    lines.push(`  COT Index: ${ci.cotIndex} / 100 — ${ci.interpretation}`)
    lines.push(`  Net commercial: ${ci.currentNet?.toLocaleString()} (range: ${ci.minNet?.toLocaleString()} to ${ci.maxNet?.toLocaleString()})`)
    lines.push('')
  }
  if (d.seasonalInfo && !d.seasonalInfo.error) {
    const s = d.seasonalInfo
    lines.push(`SEASONAL DATA (${s.currentMonthName} — 15 year average):`)
    lines.push(`  Avg return: ${s.currentBias?.avgReturn}% · Win rate: ${s.currentBias?.winRate}%`)
    lines.push(`  Best months: ${s.bestMonths?.join(', ')}`)
    lines.push('')
  }
  lines.push('=== END LIVE DATA — NOW ANSWER THE FOLLOWING ===\n')
  return lines.join('\n')
}
