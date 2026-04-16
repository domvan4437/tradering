import { fetchHistory } from '../../../lib/marketData'
import { TICKER_MAP, COT_MAP } from '../../../lib/design'

// Builds the rich market data object the screener needs
async function buildScreenerData(commodity) {
  const key = commodity.toLowerCase().trim()
  const symbol = TICKER_MAP[key]
  if (!symbol) return { error: `Unknown commodity: ${commodity}. Try Gold, Corn, Crude Oil...` }

  const cotKeyword = COT_MAP[key] || commodity.toUpperCase()

  // Fetch 2 years of daily history to calculate % changes
  const history = await fetchHistory(symbol, 2)
  if (!history || history.length < 30) {
    return { error: `No price data found for ${commodity}` }
  }

  const closes = history.map(h => h.close).filter(Boolean)
  const latest = closes[closes.length - 1]
  const w4  = closes[closes.length - 21]  // ~4 weeks = 21 trading days
  const w13 = closes[closes.length - 65]  // ~13 weeks
  const w26 = closes[closes.length - 130] // ~26 weeks
  const high52w = Math.max(...closes.slice(-252))
  const low52w  = Math.min(...closes.slice(-252))

  const pct = (curr, prev) => prev ? parseFloat(((curr - prev) / prev * 100).toFixed(2)) : null

  const pct4w  = pct(latest, w4)
  const pct13w = pct(latest, w13)
  const pct26w = pct(latest, w26)
  const pctFrom52wHigh = pct(latest, high52w)
  const pctFrom52wLow  = pct(latest, low52w)

  // Trend: price above 13-week average
  const avg13w = closes.slice(-65).reduce((a,b)=>a+b,0) / Math.min(65, closes.slice(-65).length)
  const trending = latest > avg13w
  const trendDirection = pct13w > 5 ? 'Strong uptrend' : pct13w > 0 ? 'Mild uptrend' : pct13w > -5 ? 'Mild downtrend' : 'Strong downtrend'

  // USDX and rates (fetch separately)
  let usdx = null, rates = null
  try {
    const [usdxHistory, ratesHistory] = await Promise.all([
      fetchHistory('DX-Y.NYB', 1),
      fetchHistory('ZN=F', 1),
    ])
    if (usdxHistory?.length > 70) {
      const uc = usdxHistory.map(h=>h.close).filter(Boolean)
      const ul = uc[uc.length-1]
      usdx = {
        latest: parseFloat(ul.toFixed(2)),
        pct4w:  pct(ul, uc[uc.length-21]),
        pct13w: pct(ul, uc[uc.length-65]),
        direction: ul > uc[uc.length-21] ? 'Rising (bearish for commodities)' : 'Falling (bullish for commodities)',
        bearishForCommodities: ul < uc[uc.length-21],
      }
    }
    if (ratesHistory?.length > 70) {
      const rc = ratesHistory.map(h=>h.close).filter(Boolean)
      const rl = rc[rc.length-1]
      rates = {
        latest: parseFloat(rl.toFixed(3)),
        pct13w: pct(rl, rc[rc.length-65]),
        direction: rl > rc[rc.length-13] ? 'Rising' : 'Falling',
      }
    }
  } catch {}

  return {
    ticker: symbol,
    priceSymbol: symbol,
    cotKeyword,
    price: {
      latest: parseFloat(latest.toFixed(4)),
      pct4w, pct13w, pct26w,
      high52w: parseFloat(high52w.toFixed(4)),
      low52w:  parseFloat(low52w.toFixed(4)),
      pctFrom52wHigh,
      pctFrom52wLow,
      trending,
      trendDirection,
    },
    usdx,
    rates,
  }
}

export async function POST(request) {
  try {
    const { commodity } = await request.json()
    if (!commodity) return Response.json({ error: 'No commodity provided' }, { status: 400 })
    const data = await buildScreenerData(commodity)
    return Response.json(data)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    if (!symbol) return Response.json({ error: 'No symbol' }, { status: 400 })
    const { fetchPrice } = await import('../../../lib/marketData')
    const data = await fetchPrice(symbol)
    return Response.json(data || { error: 'No data' })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
