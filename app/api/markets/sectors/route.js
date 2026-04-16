export async function GET() {
  const sectors = {
    'XLK': 'Technology',
    'XLF': 'Financials',
    'XLV': 'Healthcare',
    'XLC': 'Communication',
    'XLY': 'Consumer Discret.',
    'XLP': 'Consumer Staples',
    'XLE': 'Energy',
    'XLI': 'Industrials',
    'XLB': 'Materials',
    'XLRE': 'Real Estate',
    'XLU': 'Utilities',
    'QQQ': 'Nasdaq 100',
    'SPY': 'S&P 500',
    'IWM': 'Russell 2000',
    'GLD': 'Gold ETF',
    'TLT': '20Y Treasury ETF',
  }

  const now = Math.floor(Date.now() / 1000)
  const threeMonths = now - 60 * 60 * 24 * 90

  async function fetchSector(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${threeMonths}&period2=${now}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 1800 } }
      )
      const data = await res.json()
      const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close?.filter(Boolean) || []
      if (closes.length < 2) return null
      const latest = closes[closes.length - 1]
      const prev1d = closes[closes.length - 2] || latest
      const prev5d = closes[Math.max(0, closes.length - 6)] || closes[0]
      const prev20d = closes[Math.max(0, closes.length - 21)] || closes[0]
      const prev60d = closes[0]

      return {
        symbol,
        name: sectors[symbol],
        price: latest.toFixed(2),
        change1d: parseFloat(((latest - prev1d) / prev1d * 100).toFixed(2)),
        change5d: parseFloat(((latest - prev5d) / prev5d * 100).toFixed(2)),
        change20d: parseFloat(((latest - prev20d) / prev20d * 100).toFixed(2)),
        change60d: parseFloat(((latest - prev60d) / prev60d * 100).toFixed(2)),
        sparkline: closes.slice(-20).map(c => parseFloat(c.toFixed(2))),
      }
    } catch { return null }
  }

  const results = await Promise.allSettled(
    Object.keys(sectors).map(sym => fetchSector(sym))
  )

  const sectorData = results
    .filter(r => r.status === 'fulfilled' && r.value)
    .map(r => r.value)
    .sort((a, b) => b.change20d - a.change20d) // rank by 20-day performance

  // Rotation signal: what's leading vs lagging
  const sectorOnly = sectorData.filter(s => !['QQQ','SPY','IWM','GLD','TLT'].includes(s.symbol))
  const leaders = sectorOnly.slice(0, 3).map(s => s.name)
  const laggards = sectorOnly.slice(-3).map(s => s.name)

  // Risk-on/off signal based on what's leading
  const riskOnSectors = ['Technology', 'Consumer Discret.', 'Communication', 'Financials']
  const riskOffSectors = ['Utilities', 'Consumer Staples', 'Healthcare', 'Real Estate']
  const leadingRiskOn = leaders.filter(l => riskOnSectors.includes(l)).length
  const leadingRiskOff = leaders.filter(l => riskOffSectors.includes(l)).length
  const rotationSignal = leadingRiskOn >= 2 ? 'RISK ON' : leadingRiskOff >= 2 ? 'RISK OFF' : 'MIXED'

  return Response.json({
    sectors: sectorData,
    leaders,
    laggards,
    rotationSignal,
    updatedAt: new Date().toISOString(),
  })
}
