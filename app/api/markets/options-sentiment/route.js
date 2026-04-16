export async function GET() {
  const now = Math.floor(Date.now() / 1000)
  const sixMonths = now - 60 * 60 * 24 * 180

  async function fetchClose(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${sixMonths}&period2=${now}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 900 } }
      )
      const data = await res.json()
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) || []
      return closes
    } catch { return [] }
  }

  const [vix, vix3m, vix6m, vxn, putcallTotal, putcallEquity] = await Promise.all([
    fetchClose('^VIX'),
    fetchClose('^VIX3M'),
    fetchClose('^VIX6M'),
    fetchClose('^VXN'),
    fetchClose('^CPC'),
    fetchClose('^CPCE'),
  ])

  const latest = arr => arr.length ? arr[arr.length-1] : null
  const avg = (arr, n) => arr.length ? arr.slice(-n).reduce((a,b)=>a+b,0)/Math.min(n,arr.length) : null

  const vixNow = latest(vix)
  const vix3mNow = latest(vix3m)
  const vix6mNow = latest(vix6m)
  const vxnNow = latest(vxn)
  const pcNow = latest(putcallTotal)
  const eqPcNow = latest(putcallEquity)

  // VIX term structure
  const termStructure = []
  if (vixNow) termStructure.push({ label: 'VIX (1M)', value: parseFloat(vixNow.toFixed(2)) })
  if (vix3mNow) termStructure.push({ label: 'VIX3M (3M)', value: parseFloat(vix3mNow.toFixed(2)) })
  if (vix6mNow) termStructure.push({ label: 'VIX6M (6M)', value: parseFloat(vix6mNow.toFixed(2)) })

  // Contango = vix < vix3m < vix6m (normal, complacent)
  // Backwardation = vix > vix3m (fear, near-term stress)
  const termStructureSignal = vixNow && vix3mNow
    ? vixNow > vix3mNow
      ? 'BACKWARDATION — Near-term fear elevated. Often near short-term lows.'
      : vixNow < vix3mNow * 0.85
        ? 'STEEP CONTANGO — Extreme complacency. Market vulnerable to spikes.'
        : 'NORMAL CONTANGO — Typical structure. No extreme signals.'
    : 'Data unavailable'

  // Historical percentile for VIX (approximate based on 6mo data)
  const vixPctile = vix.length > 10
    ? Math.round((vix.filter(v => v < vixNow).length / vix.length) * 100)
    : null

  // Put/call interpretation
  const pcAvg20 = avg(putcallTotal, 20)
  const pcSignal = pcNow > 1.3 ? 'EXTREME FEAR — Contrarian bullish signal. Puts overwhelm calls.'
    : pcNow > 1.0 ? 'FEARFUL — Above average put buying. Supportive of near-term bounce.'
    : pcNow < 0.6 ? 'EXTREME GREED — Dangerous complacency. Very low put protection.'
    : pcNow < 0.8 ? 'GREEDY — Below average hedging. Mild caution.'
    : 'NEUTRAL'

  return Response.json({
    vix: {
      current: vixNow?.toFixed(2),
      avg20: avg(vix, 20)?.toFixed(2),
      avg50: avg(vix, 50)?.toFixed(2),
      percentile6m: vixPctile,
      sparkline: vix.slice(-40).map(v => parseFloat(v.toFixed(2))),
      signal: vixNow < 13 ? 'EXTREME COMPLACENCY' : vixNow < 18 ? 'CALM' : vixNow < 25 ? 'ELEVATED' : vixNow < 35 ? 'FEAR' : 'PANIC',
    },
    vxn: { current: vxnNow?.toFixed(2) },
    termStructure,
    termStructureSignal,
    putCall: {
      total: pcNow?.toFixed(2),
      equity: eqPcNow?.toFixed(2),
      avg20: pcAvg20?.toFixed(2),
      signal: pcSignal,
      sparkline: putcallTotal.slice(-40).map(v => parseFloat(v.toFixed(2))),
    },
    updatedAt: new Date().toISOString(),
  })
}
