/**
 * TradeZar Market Data Service
 * ─────────────────────────────
 * Single source of truth for all price data.
 * Providers: Polygon.io (stocks/forex/crypto), Alpha Vantage (futures/fallback)
 * Yahoo Finance used only as last-resort fallback during development.
 *
 * TO UPGRADE AT LAUNCH:
 *   1. Set POLYGON_API_KEY in .env  → unlocks real-time stocks, forex, crypto
 *   2. Set ALPHA_VANTAGE_KEY in .env → unlocks full futures coverage
 *   3. Set TRADERMADE_KEY in .env   → unlocks professional forex rates
 * No code changes needed — just add the keys.
 */

const POLYGON_KEY       = process.env.POLYGON_API_KEY       || null
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY     || null
const TRADERMADE_KEY    = process.env.TRADERMADE_API_KEY     || null

// ── Asset classification ──────────────────────────────────────────
function classifySymbol(symbol) {
  if (!symbol) return 'unknown'
  const s = symbol.toUpperCase()
  if (s.endsWith('=X') || s.endsWith('=F') && ['EUR','GBP','JPY','AUD','CAD','CHF','NZD'].some(c => s.startsWith(c))) return 'forex'
  if (s.endsWith('=F') || ['ES','NQ','YM','RTY','ZN','ZB','ZF','GC','SI','CL','NG','ZC','ZW','ZS','KC','SB','CT','HG','PL','PA','RB','HO'].some(f => s.startsWith(f))) return 'futures'
  if (s.includes('-USD') || s.includes('-USDT') || ['BTC','ETH','SOL','ADA','DOGE','XRP'].some(c => s.startsWith(c))) return 'crypto'
  if (s.match(/^[A-Z]{1,5}$/) || s.includes('EURUSD') || s.includes('GBPUSD')) return 'stock'
  return 'stock'
}

// ── Polygon.io ────────────────────────────────────────────────────
async function fetchPolygon(symbol) {
  if (!POLYGON_KEY) return null
  try {
    const type = classifySymbol(symbol)
    let url, ticker = symbol

    if (type === 'forex') {
      // Convert EURUSD=X → C:EURUSD
      ticker = 'C:' + symbol.replace('=X','').replace('JPY=','USDJPY')
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1)
      const dateStr = yesterday.toISOString().slice(0,10)
      url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    } else if (type === 'crypto') {
      ticker = 'X:' + symbol.replace('-USD','USD').replace('-USDT','USDT')
      url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    } else {
      // Stocks and ETFs
      url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${POLYGON_KEY}`
    }

    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()
    if (data.status === 'ERROR' || !data.results?.[0]) return null
    const r = data.results[0]
    const change = r.c - r.o
    const changePct = (change / r.o) * 100
    return { price: r.c, open: r.o, high: r.h, low: r.l, prev: r.o, change, changePct, volume: r.v, source: 'polygon', realtime: !!POLYGON_KEY }
  } catch { return null }
}

// ── Alpha Vantage ─────────────────────────────────────────────────
async function fetchAlphaVantage(symbol) {
  if (!ALPHA_VANTAGE_KEY) return null
  try {
    const type = classifySymbol(symbol)
    let url, field = 'Global Quote'

    if (type === 'forex') {
      const from = symbol.slice(0,3)
      const to = symbol.slice(3,6) || 'USD'
      url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${ALPHA_VANTAGE_KEY}`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      const rate = data?.['Realtime Currency Exchange Rate']
      if (!rate) return null
      const price = parseFloat(rate['5. Exchange Rate'])
      const prev = parseFloat(rate['8. Bid Price']) || price * 0.999
      return { price, prev, change: price-prev, changePct: ((price-prev)/prev)*100, high: parseFloat(rate['7. Ask Price']), low: parseFloat(rate['8. Bid Price']), source: 'alphavantage', realtime: true }
    }

    // Stocks, ETFs, Futures
    const avSymbol = type === 'futures' ? symbol.replace('=F','') : symbol
    url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${ALPHA_VANTAGE_KEY}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    const data = await res.json()
    const q = data?.['Global Quote']
    if (!q || !q['05. price']) return null
    const price = parseFloat(q['05. price'])
    const prev = parseFloat(q['08. previous close'])
    const change = parseFloat(q['09. change'])
    const changePct = parseFloat(q['10. change percent']?.replace('%',''))
    return { price, prev, change, changePct, high: parseFloat(q['03. high']), low: parseFloat(q['04. low']), open: parseFloat(q['02. open']), volume: parseInt(q['06. volume']), source: 'alphavantage', realtime: true }
  } catch { return null }
}

// ── Tradermade (forex specialist) ─────────────────────────────────
async function fetchTradermade(symbol) {
  if (!TRADERMADE_KEY) return null
  try {
    const pair = symbol.replace('=X','').replace('JPY=','USDJPY').slice(0,6)
    const url = `https://marketdata.tradermade.com/api/v1/live?currency=${pair}&api_key=${TRADERMADE_KEY}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    const data = await res.json()
    const q = data?.quotes?.[0]
    if (!q) return null
    const price = (q.ask + q.bid) / 2
    return { price, high: q.ask, low: q.bid, prev: q.mid || price, change: 0, changePct: 0, source: 'tradermade', realtime: true }
  } catch { return null }
}

// ── Yahoo Finance fallback (development only) ─────────────────────
async function fetchYahoo(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 300 } })
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return null
    const meta = result.meta
    const price = meta.regularMarketPrice
    const prev = meta.chartPreviousClose || meta.previousClose || price
    const change = price - prev
    const changePct = (change / prev) * 100
    return { price, prev, change, changePct, high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow, open: meta.regularMarketOpen, source: 'yahoo_fallback', realtime: false }
  } catch { return null }
}

// ── Main fetch function — tries providers in priority order ───────
export async function fetchPrice(symbol) {
  if (!symbol) return null
  const type = classifySymbol(symbol)

  // Priority order per asset type
  let result = null

  if (type === 'forex') {
    result = await fetchTradermade(symbol)
      || await fetchPolygon(symbol)
      || await fetchAlphaVantage(symbol)
      || await fetchYahoo(symbol)
  } else if (type === 'futures') {
    // Alpha Vantage best for futures, Polygon needs paid tier
    result = await fetchAlphaVantage(symbol)
      || await fetchPolygon(symbol)
      || await fetchYahoo(symbol)
  } else if (type === 'crypto') {
    result = await fetchPolygon(symbol)
      || await fetchAlphaVantage(symbol)
      || await fetchYahoo(symbol)
  } else {
    // Stocks / ETFs
    result = await fetchPolygon(symbol)
      || await fetchAlphaVantage(symbol)
      || await fetchYahoo(symbol)
  }

  if (!result) return null

  return {
    symbol,
    price:      typeof result.price === 'number'     ? parseFloat(result.price.toFixed(4))     : null,
    prev:       typeof result.prev === 'number'      ? parseFloat(result.prev.toFixed(4))      : null,
    change:     typeof result.change === 'number'    ? parseFloat(result.change.toFixed(4))    : null,
    changePct:  typeof result.changePct === 'number' ? parseFloat(result.changePct.toFixed(3)) : null,
    high:       typeof result.high === 'number'      ? parseFloat(result.high.toFixed(4))      : null,
    low:        typeof result.low === 'number'       ? parseFloat(result.low.toFixed(4))       : null,
    open:       typeof result.open === 'number'      ? parseFloat(result.open.toFixed(4))      : null,
    volume:     result.volume || null,
    source:     result.source,
    realtime:   result.realtime || false,
    assetType:  type,
    fetchedAt:  new Date().toISOString(),
  }
}

// ── Batch fetch — up to 20 symbols in parallel ────────────────────
export async function fetchPrices(symbols) {
  if (!symbols?.length) return {}
  // Deduplicate
  const unique = [...new Set(symbols.filter(Boolean))]
  // Fetch in parallel with concurrency limit of 10
  const results = {}
  const chunks = []
  for (let i = 0; i < unique.length; i += 10) chunks.push(unique.slice(i, i+10))
  for (const chunk of chunks) {
    const fetched = await Promise.all(chunk.map(s => fetchPrice(s).then(r => [s, r]).catch(() => [s, null])))
    fetched.forEach(([s, r]) => { if (r) results[s] = r })
  }
  return results
}

// ── Historical OHLC for backtesting ──────────────────────────────
export async function fetchHistory(symbol, years = 3) {
  // Polygon for stocks (paid), Alpha Vantage for all (free daily)
  if (POLYGON_KEY) {
    try {
      const end = new Date().toISOString().slice(0,10)
      const start = new Date(Date.now() - years*365*24*3600*1000).toISOString().slice(0,10)
      const type = classifySymbol(symbol)
      let ticker = symbol
      if (type === 'forex') ticker = 'C:' + symbol.replace('=X','')
      else if (type === 'crypto') ticker = 'X:' + symbol.replace('-USD','USD')
      const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${start}/${end}?adjusted=true&sort=asc&limit=50000&apiKey=${POLYGON_KEY}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.results?.length > 50) {
        return data.results.map(r => ({
          date: new Date(r.t).toISOString().slice(0,10),
          open: r.o, high: r.h, low: r.l, close: r.c, volume: r.v,
          month: new Date(r.t).getMonth(),
          dayOfWeek: new Date(r.t).getDay(),
          year: new Date(r.t).getFullYear(),
        }))
      }
    } catch {}
  }

  // Fallback: Yahoo Finance for history (more reliable than AV for historical)
  try {
    const endTs = Math.floor(Date.now()/1000)
    const startTs = endTs - years*365*24*3600
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${startTs}&period2=${endTs}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return []
    const timestamps = result.timestamp || []
    const q = result.indicators?.quote?.[0] || {}
    return timestamps.map((t,i) => ({
      date: new Date(t*1000).toISOString().slice(0,10),
      open: q.open?.[i], high: q.high?.[i], low: q.low?.[i], close: q.close?.[i],
      month: new Date(t*1000).getMonth(),
      dayOfWeek: new Date(t*1000).getDay(),
      year: new Date(t*1000).getFullYear(),
    })).filter(d => d.close != null)
  } catch { return [] }
}

// ── Backwards compatibility wrapper ───────────────────────────────
// Used by the screener and cron jobs — maps commodity name to symbol
const COMMODITY_SYMBOLS = {
  'gold': 'GC=F', 'silver': 'SI=F', 'copper': 'HG=F', 'platinum': 'PL=F', 'palladium': 'PA=F',
  'crude oil': 'CL=F', 'oil': 'CL=F', 'natural gas': 'NG=F', 'gasoline': 'RB=F', 'heating oil': 'HO=F',
  'corn': 'ZC=F', 'wheat': 'ZW=F', 'soybeans': 'ZS=F', 'soybean': 'ZS=F',
  'coffee': 'KC=F', 'sugar': 'SB=F', 'cotton': 'CT=F', 'cocoa': 'CC=F',
  'live cattle': 'LE=F', 'cattle': 'LE=F', 'lean hogs': 'HE=F', 'hogs': 'HE=F',
  'rice': 'ZR=F', 'oats': 'ZO=F', 'lumber': 'LBS=F',
  's&p 500': 'ES=F', 'sp500': 'ES=F', 'nasdaq': 'NQ=F', 'dow': 'YM=F',
  'euro': 'EURUSD=X', 'eurusd': 'EURUSD=X', 'gbpusd': 'GBPUSD=X',
  'bitcoin': 'BTC-USD', 'ethereum': 'ETH-USD',
}

export async function fetchAllMarketData(commodityOrSymbol) {
  if (!commodityOrSymbol) return null
  const key = commodityOrSymbol.toLowerCase().trim()
  const symbol = COMMODITY_SYMBOLS[key] || commodityOrSymbol
  const data = await fetchPrice(symbol)
  if (!data) return null
  // Return in the format the screener expects
  return {
    price: data.price,
    change: data.change,
    changePercent: data.changePct,
    high: data.high,
    low: data.low,
    open: data.open,
    previousClose: data.prev,
    volume: data.volume,
    symbol: data.symbol,
    source: data.source,
    realtime: data.realtime,
  }
}
