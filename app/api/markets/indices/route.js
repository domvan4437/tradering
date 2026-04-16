// Fetches live index futures and VIX data from Yahoo Finance (free, no key)
export async function GET() {
  const symbols = {
    'ES=F':  { name: 'S&P 500 Futures',    short: 'ES',  type: 'index' },
    'NQ=F':  { name: 'Nasdaq 100 Futures', short: 'NQ',  type: 'index' },
    'YM=F':  { name: 'Dow Futures',        short: 'YM',  type: 'index' },
    'RTY=F': { name: 'Russell 2000 Futures',short: 'RTY', type: 'index' },
    '^VIX':  { name: 'VIX',                short: 'VIX', type: 'vix'   },
    '^TNX':  { name: '10Y Treasury Yield', short: '10Y', type: 'rate'  },
    'DX-Y.NYB': { name: 'US Dollar Index', short: 'DXY', type: 'dollar'},
  }

  const now = Math.floor(Date.now() / 1000)
  const yearAgo = now - 60 * 60 * 24 * 365
  const sixMonthsAgo = now - 60 * 60 * 24 * 180

  async function fetchQuote(symbol) {
    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${sixMonthsAgo}&period2=${now}&interval=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } }
      )
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      const closes = result?.indicators?.quote?.[0]?.close?.filter(Boolean) || []
      const timestamps = result?.timestamp || []
      if (!closes.length) return null

      const latest = closes[closes.length - 1]
      const prev1d = closes[closes.length - 2] || latest
      const prev5d = closes[Math.max(0, closes.length - 6)] || latest
      const prev20d = closes[Math.max(0, closes.length - 21)] || latest
      const prev60d = closes[Math.max(0, closes.length - 61)] || latest

      const high52 = Math.max(...closes)
      const low52 = Math.min(...closes)

      // Simple trend: price vs 20-day and 50-day MA
      const ma20 = closes.slice(-20).reduce((a,b)=>a+b,0)/Math.min(20,closes.length)
      const ma50 = closes.slice(-50).reduce((a,b)=>a+b,0)/Math.min(50,closes.length)

      return {
        symbol,
        ...symbols[symbol],
        price: latest.toFixed(symbol==='^TNX'?3:2),
        change1d: ((latest-prev1d)/prev1d*100).toFixed(2),
        change5d: ((latest-prev5d)/prev5d*100).toFixed(2),
        change20d: ((latest-prev20d)/prev20d*100).toFixed(2),
        change60d: ((latest-prev60d)/prev60d*100).toFixed(2),
        high52: high52.toFixed(2),
        low52: low52.toFixed(2),
        pctFrom52High: ((latest-high52)/high52*100).toFixed(1),
        pctFrom52Low: ((latest-low52)/low52*100).toFixed(1),
        aboveMa20: latest > ma20,
        aboveMa50: latest > ma50,
        ma20: ma20.toFixed(2),
        ma50: ma50.toFixed(2),
        trend: latest > ma20 && latest > ma50 ? 'UPTREND' : latest < ma20 && latest < ma50 ? 'DOWNTREND' : 'MIXED',
        // Last 20 closes for sparkline
        sparkline: closes.slice(-20).map(c=>parseFloat(c.toFixed(2))),
      }
    } catch { return null }
  }

  const results = await Promise.allSettled(
    Object.keys(symbols).map(sym => fetchQuote(sym))
  )

  const quotes = {}
  Object.keys(symbols).forEach((sym, i) => {
    if (results[i].status === 'fulfilled' && results[i].value) {
      quotes[sym] = results[i].value
    }
  })

  // Market regime: are most indices in uptrend?
  const indices = ['ES=F','NQ=F','YM=F','RTY=F'].map(s=>quotes[s]).filter(Boolean)
  const uptrending = indices.filter(i=>i.trend==='UPTREND').length
  const regime = uptrending >= 3 ? 'RISK ON' : uptrending <= 1 ? 'RISK OFF' : 'NEUTRAL'
  const regimeColor = regime === 'RISK ON' ? 'green' : regime === 'RISK OFF' ? 'red' : 'neutral'

  return Response.json({ quotes, regime, regimeColor, updatedAt: new Date().toISOString() })
}
