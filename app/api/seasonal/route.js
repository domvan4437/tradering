const TICKER_MAP = {
  'gold':'GC=F','silver':'SI=F','copper':'HG=F','platinum':'PL=F','palladium':'PA=F',
  'crude oil':'CL=F','oil':'CL=F','natural gas':'NG=F','nat gas':'NG=F',
  'gasoline':'RB=F','heating oil':'HO=F',
  'corn':'ZC=F','wheat':'ZW=F','soybeans':'ZS=F','soybean':'ZS=F',
  'coffee':'KC=F','sugar':'SB=F','cotton':'CT=F','cocoa':'CC=F',
  'live cattle':'LE=F','cattle':'LE=F','lean hogs':'HE=F','hogs':'HE=F',
  'rice':'ZR=F','oats':'ZO=F','lumber':'LBR=F',
}

async function getSeasonal(commodity) {
  if (!commodity) return Response.json({ error: 'No commodity specified' }, { status: 400 })

  const key = commodity.toLowerCase().trim()
  const symbol = TICKER_MAP[key] || commodity.toUpperCase()

  try {
    const now = Math.floor(Date.now() / 1000)
    const fifteenYearsAgo = now - 60 * 60 * 24 * 365 * 15

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${fifteenYearsAgo}&period2=${now}&interval=1mo&events=history`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()

    const result = data?.chart?.result?.[0]
    const timestamps = result?.timestamp || []
    const closes = result?.indicators?.quote?.[0]?.close || []

    if (!timestamps.length) {
      return Response.json({ error: `No data found for "${commodity}". Try: Gold, Silver, Crude Oil, Corn, Wheat, Soybeans, Coffee, Sugar, Cotton, Cocoa, Live Cattle, Lean Hogs.` }, { status: 404 })
    }

    const monthlyReturns = Array.from({ length: 12 }, () => [])

    for (let i = 1; i < timestamps.length; i++) {
      if (closes[i] == null || closes[i - 1] == null) continue
      const date = new Date(timestamps[i] * 1000)
      const month = date.getMonth()
      const ret = ((closes[i] - closes[i - 1]) / closes[i - 1]) * 100
      monthlyReturns[month].push(ret)
    }

    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    const seasonal = monthlyReturns.map((returns, i) => {
      if (!returns.length) return { month: MONTHS[i], avgReturn: 0, winRate: 0, count: 0 }
      const avg = returns.reduce((a, b) => a + b, 0) / returns.length
      const wins = returns.filter((r) => r > 0).length
      return {
        month: MONTHS[i],
        avgReturn: parseFloat(avg.toFixed(2)),
        winRate: parseFloat(((wins / returns.length) * 100).toFixed(1)),
        count: returns.length,
      }
    })

    const sorted = [...seasonal].sort((a, b) => b.avgReturn - a.avgReturn)
    const bestMonths = sorted.slice(0, 3).map((m) => m.month)
    const worstMonths = sorted.slice(-3).map((m) => m.month)
    const currentMonth = new Date().getMonth()
    const currentBias = seasonal[currentMonth]

    return Response.json({
      seasonal, bestMonths, worstMonths, currentBias,
      currentMonthName: MONTHS[currentMonth],
      symbol, commodity,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const commodity = searchParams.get('commodity') || searchParams.get('symbol') || ''
  return getSeasonal(commodity)
}

export async function POST(request) {
  const body = await request.json()
  const commodity = body.commodity || body.symbol || ''
  return getSeasonal(commodity)
}
