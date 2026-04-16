export async function GET() {
  const tenors = {
    '^IRX': { label: '3M', months: 3 },
    '^FVX': { label: '5Y', months: 60 },
    '^TNX': { label: '10Y', months: 120 },
    '^TYX': { label: '30Y', months: 360 },
  }
  // 2Y not directly on Yahoo — use ^IRX as proxy for short end
  const twoYear = '^UST2Y'

  const now = Math.floor(Date.now() / 1000)
  const oneYear = now - 60 * 60 * 24 * 365

  async function fetchYield(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${oneYear}&period2=${now}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 1800 } }
      )
      const data = await res.json()
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) || []
      if (!closes.length) return null
      const latest = closes[closes.length - 1]
      const prev30 = closes[Math.max(0,closes.length-31)] || latest
      const prev90 = closes[Math.max(0,closes.length-91)] || latest
      return {
        current: parseFloat(latest.toFixed(3)),
        change30d: parseFloat((latest-prev30).toFixed(3)),
        change90d: parseFloat((latest-prev90).toFixed(3)),
        history: closes.slice(-52).map(c=>parseFloat(c.toFixed(3))),
      }
    } catch { return null }
  }

  const [t3m, t5y, t10y, t30y] = await Promise.all([
    fetchYield('^IRX'),
    fetchYield('^FVX'),
    fetchYield('^TNX'),
    fetchYield('^TYX'),
  ])

  // Key spreads
  const spread_2s10s = t10y && t3m ? parseFloat((t10y.current - t3m.current).toFixed(3)) : null
  const spread_5s30s = t30y && t5y ? parseFloat((t30y.current - t5y.current).toFixed(3)) : null

  const isInverted = spread_2s10s !== null && spread_2s10s < 0

  return Response.json({
    yields: {
      '3M': t3m,
      '5Y': t5y,
      '10Y': t10y,
      '30Y': t30y,
    },
    spreads: {
      '2s10s': spread_2s10s,
      '5s30s': spread_5s30s,
    },
    isInverted,
    signal: isInverted
      ? 'INVERTED — Historically precedes recession by 12-24 months. Risk-off conditions favor defensive assets.'
      : spread_2s10s !== null && spread_2s10s < 0.5
        ? 'FLAT — Curve flattening. Monitor for inversion. Equity markets may be near a top.'
        : 'NORMAL — Healthy curve slope. Broadly supportive of risk assets.',
    updatedAt: new Date().toISOString(),
  })
}
