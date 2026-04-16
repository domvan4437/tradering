export async function GET() {
  const now = Math.floor(Date.now() / 1000)
  const sixMonths = now - 60 * 60 * 24 * 180

  // Breadth proxies available on Yahoo Finance
  const breadthSymbols = {
    '^NYAD':  'NYSE Advance-Decline',
    '^NAHL':  'NYSE New Highs-Lows',
    '^NAHGH': 'NYSE New Highs',
    '^NAHLO': 'NYSE New Lows',
    // McClellan oscillator proxy using equal weight vs cap weight
    'RSP':    'S&P Equal Weight',
    'SPY':    'S&P 500 (cap weight)',
    'IWM':    'Russell 2000',
    // Volatility
    '^VIX':   'VIX',
    '^VXN':   'VXN (Nasdaq Vol)',
    // Put/Call from CBOE
    '^CPC':   'CBOE Total Put/Call',
    '^CPCE':  'CBOE Equity Put/Call',
  }

  async function fetchData(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${sixMonths}&period2=${now}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 900 } }
      )
      const data = await res.json()
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) || []
      if (!closes.length) return null
      return closes
    } catch { return null }
  }

  const [vix, vxn, putcall, eqputcall, rsp, spy, iwm] = await Promise.all([
    fetchData('^VIX'),
    fetchData('^VXN'),
    fetchData('^CPC'),
    fetchData('^CPCE'),
    fetchData('RSP'),
    fetchData('SPY'),
    fetchData('IWM'),
  ])

  const latest = arr => arr ? arr[arr.length - 1] : null
  const avg = (arr, n) => arr ? arr.slice(-n).reduce((a,b)=>a+b,0)/Math.min(n,arr.length) : null

  const vixNow = latest(vix)
  const pcNow = latest(putcall)
  const eqPcNow = latest(eqputcall)

  // RSP/SPY ratio — equal weight vs cap weight: rising = broad participation
  const rspSpyRatio = rsp && spy ? (latest(rsp)/latest(spy)) : null
  const rspSpyPrev = rsp && spy ? (rsp[rsp.length-21]/spy[spy.length-21]) : null
  const breadthExpanding = rspSpyRatio && rspSpyPrev ? rspSpyRatio > rspSpyPrev : null

  // VIX signals
  const vixAvg20 = avg(vix, 20)
  const vixSignal = vixNow < 15 ? 'COMPLACENT' : vixNow < 20 ? 'CALM' : vixNow < 30 ? 'ELEVATED' : 'FEAR'

  // Put/call signals
  const pcSignal = pcNow > 1.2 ? 'EXTREME FEAR' : pcNow > 1.0 ? 'BEARISH' : pcNow < 0.7 ? 'EXTREME GREED' : pcNow < 0.85 ? 'BULLISH' : 'NEUTRAL'

  // Fear & Greed composite (simplified)
  let fgScore = 50
  if (vixNow) fgScore += vixNow < 15 ? 15 : vixNow < 20 ? 5 : vixNow < 30 ? -10 : -25
  if (pcNow) fgScore += pcNow > 1.2 ? 15 : pcNow > 1.0 ? 5 : pcNow < 0.7 ? -15 : pcNow < 0.85 ? -5 : 0
  if (breadthExpanding !== null) fgScore += breadthExpanding ? 10 : -10
  fgScore = Math.max(0, Math.min(100, fgScore))

  const fgLabel = fgScore >= 75 ? 'EXTREME GREED' : fgScore >= 55 ? 'GREED' : fgScore >= 45 ? 'NEUTRAL' : fgScore >= 25 ? 'FEAR' : 'EXTREME FEAR'
  const fgColor = fgScore >= 65 ? 'red' : fgScore >= 45 ? 'gold' : 'green' // inverted — greed = warning

  return Response.json({
    vix: {
      current: vixNow?.toFixed(2),
      avg20: vixAvg20?.toFixed(2),
      signal: vixSignal,
      sparkline: vix?.slice(-20).map(v=>parseFloat(v.toFixed(2))),
    },
    vxn: {
      current: latest(vxn)?.toFixed(2),
    },
    putCall: {
      total: pcNow?.toFixed(2),
      equity: eqPcNow?.toFixed(2),
      signal: pcSignal,
      sparkline: putcall?.slice(-20).map(v=>parseFloat(v.toFixed(2))),
    },
    breadth: {
      rspSpyRatio: rspSpyRatio?.toFixed(4),
      expanding: breadthExpanding,
      signal: breadthExpanding === null ? 'N/A' : breadthExpanding ? 'EXPANDING — Broad participation, healthy rally' : 'NARROWING — Large caps leading, caution',
    },
    fearGreed: {
      score: Math.round(fgScore),
      label: fgLabel,
      color: fgColor,
    },
    updatedAt: new Date().toISOString(),
  })
}
