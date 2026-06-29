// lib/competitionPrices.js
// Price engine utilities for paper trading competitions
// quantity = dollar notional (e.g. $1,000 allocated to position)
// P&L = (price change %) × quantity × leverage × direction

const LEVERAGE_CAPS = {
  stock: 5,
  futures: 20,
  forex: 30,
  crypto: 10,
  commodity: 20,
  index: 20,
}

// Slippage applied to market orders (per asset type)
const SLIPPAGE_PCT = {
  stock: 0.0005,
  futures: 0.0005,
  forex: 0.0003,
  crypto: 0.001,
  commodity: 0.0005,
  index: 0.0003,
}

// Classify any Yahoo Finance symbol into an asset type
export function classifySymbol(symbol) {
  const s = (symbol || '').toUpperCase().trim()
  if (s.endsWith('=F')) return 'futures'
  if (s.endsWith('=X')) return 'forex'
  if (
    s.endsWith('-USD') || s.endsWith('-BTC') || s.endsWith('-ETH') ||
    s.endsWith('-USDT') || s.endsWith('-BUSD')
  ) return 'crypto'
  // Known index ETFs
  if (['SPY', 'QQQ', 'IWM', 'DIA', 'VTI', 'VOO', 'TQQQ', 'SQQQ', 'UPRO'].includes(s)) return 'stock'
  return 'stock'
}

export function getMaxLeverage(assetType) {
  return LEVERAGE_CAPS[assetType] ?? 5
}

// Apply market-order slippage (buy at slightly higher, sell at slightly lower)
export function applySlippage(price, direction, assetType) {
  const slip = SLIPPAGE_PCT[assetType] ?? 0.0005
  return direction === 'long' ? price * (1 + slip) : price * (1 - slip)
}

// Calculate P&L for a position
// quantity = dollar notional, leverage = leverage multiplier
// pnl in dollars, pnlPct as a percentage return
export function calcPnl(direction, entryPrice, exitPrice, quantity, leverage) {
  if (!entryPrice || !exitPrice) return { pnl: 0, pnlPct: 0 }
  const pricePct = (exitPrice - entryPrice) / entryPrice // e.g. 0.02 = +2%
  const dirFactor = direction === 'long' ? 1 : -1
  const pnl = pricePct * quantity * leverage * dirFactor
  const pnlPct = pricePct * leverage * dirFactor * 100
  return { pnl, pnlPct }
}

// Check if a position's SL/TP has been triggered at current price
// Returns: 'stop_loss' | 'take_profit' | null
export function checkSlTp(direction, entryPrice, currentPrice, stopLoss, takeProfit) {
  if (!currentPrice) return null

  if (direction === 'long') {
    if (stopLoss && currentPrice <= stopLoss) return 'stop_loss'
    if (takeProfit && currentPrice >= takeProfit) return 'take_profit'
  } else {
    if (stopLoss && currentPrice >= stopLoss) return 'stop_loss'
    if (takeProfit && currentPrice <= takeProfit) return 'take_profit'
  }
  return null
}

// Check if a pending limit/stop_entry order should fill at current price
// Returns true if the order should be filled
export function shouldFillOrder(order, currentPrice) {
  if (!currentPrice || order.status !== 'pending') return false
  if (new Date(order.canFillAfter) > new Date()) return false // still in delay window

  const { orderType, limitPrice, direction } = order
  if (!limitPrice) return false

  if (orderType === 'limit') {
    // Limit buy: fill when price drops to or below the limit
    // Limit sell (short): fill when price rises to or above the limit
    if (direction === 'long') return currentPrice <= limitPrice
    if (direction === 'short') return currentPrice >= limitPrice
  }

  if (orderType === 'stop_entry') {
    // Buy stop: fill when price rises to or above stop
    // Sell stop: fill when price drops to or below stop
    if (direction === 'long') return currentPrice >= limitPrice
    if (direction === 'short') return currentPrice <= limitPrice
  }

  return false
}

// Determine if market is in regular hours (used for stocks only)
// Everything else (crypto, forex, futures) trades 24/7 in our paper system
export function isMarketOpen(assetType) {
  if (assetType !== 'stock') return true
  try {
    const now = new Date()
    const etStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' })
    const et = new Date(etStr)
    const day = et.getDay() // 0=Sun, 6=Sat
    if (day === 0 || day === 6) return false
    const minutes = et.getHours() * 60 + et.getMinutes()
    return minutes >= 570 && minutes < 960 // 9:30–16:00 ET
  } catch {
    return true // Default open on error
  }
}

// ─── Yahoo Finance Price Fetching ─────────────────────────────────────────────

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

// Fetch a single symbol's quote
export async function fetchQuote(symbol) {
  const encoded = encodeURIComponent(symbol)

  // Try v7 quote endpoint first (fastest)
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`,
      { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      const q = data?.quoteResponse?.result?.[0]
      if (q?.regularMarketPrice) {
        return {
          symbol: q.symbol || symbol,
          name: q.shortName || q.longName || q.symbol || symbol,
          price: q.regularMarketPrice,
          previousClose: q.regularMarketPreviousClose || q.regularMarketPrice,
          currency: q.currency || 'USD',
          marketState: q.marketState || 'REGULAR',
          exchange: q.fullExchangeName || q.exchangeName || '',
          assetType: classifySymbol(symbol),
        }
      }
    }
  } catch (_) {}

  // Fallback: v8 chart endpoint (query2)
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?interval=1m&range=1d`,
      { headers: YF_HEADERS, signal: AbortSignal.timeout(8000) }
    )
    if (res.ok) {
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      if (result) {
        const meta = result.meta
        const price = meta.regularMarketPrice ?? meta.previousClose
        if (price) {
          return {
            symbol: meta.symbol || symbol,
            name: meta.shortName || meta.longName || symbol,
            price,
            previousClose: meta.previousClose || price,
            currency: meta.currency || 'USD',
            marketState: meta.marketState || 'REGULAR',
            exchange: meta.exchangeName || '',
            assetType: classifySymbol(symbol),
          }
        }
      }
    }
  } catch (_) {}

  throw new Error(`Could not fetch price for ${symbol}. Check that the ticker is valid on Yahoo Finance.`)
}

// Batch-fetch prices for many symbols (uses v7 which supports comma-separated)
// Returns a map: { TSLA: { symbol, price, name, ... }, GC=F: { ... }, ... }
export async function fetchBatchQuotes(symbols) {
  if (!symbols || !symbols.length) return {}

  const results = {}
  const CHUNK = 20

  for (let i = 0; i < symbols.length; i += CHUNK) {
    const chunk = symbols.slice(i, i + CHUNK)
    const joined = chunk.map(s => encodeURIComponent(s)).join(',')

    try {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${joined}`,
        { headers: YF_HEADERS, signal: AbortSignal.timeout(12000) }
      )
      if (res.ok) {
        const data = await res.json()
        const quotes = data?.quoteResponse?.result || []
        for (const q of quotes) {
          if (q.regularMarketPrice) {
            results[q.symbol] = {
              symbol: q.symbol,
              name: q.shortName || q.longName || q.symbol,
              price: q.regularMarketPrice,
              previousClose: q.regularMarketPreviousClose || q.regularMarketPrice,
              currency: q.currency || 'USD',
              marketState: q.marketState || 'REGULAR',
            }
          }
        }
      }
    } catch (e) {
      console.error('[competitionPrices] batch chunk error:', e.message)
    }
  }

  return results
}

// Popular asset suggestions shown in the trading UI
export const POPULAR_ASSETS = {
  'Stocks': [
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'MSFT', name: 'Microsoft' },
    { symbol: 'AMZN', name: 'Amazon' },
    { symbol: 'GOOGL', name: 'Google' },
    { symbol: 'META', name: 'Meta' },
    { symbol: 'AMD', name: 'AMD' },
    { symbol: 'NFLX', name: 'Netflix' },
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Nasdaq ETF' },
  ],
  'Futures': [
    { symbol: 'NQ=F', name: 'Nasdaq 100' },
    { symbol: 'ES=F', name: 'S&P 500' },
    { symbol: 'YM=F', name: 'Dow Jones' },
    { symbol: 'RTY=F', name: 'Russell 2000' },
    { symbol: 'GC=F', name: 'Gold' },
    { symbol: 'SI=F', name: 'Silver' },
    { symbol: 'CL=F', name: 'Crude Oil' },
    { symbol: 'NG=F', name: 'Natural Gas' },
    { symbol: 'HG=F', name: 'Copper' },
    { symbol: 'ZB=F', name: 'T-Bond' },
    { symbol: 'ZC=F', name: 'Corn' },
    { symbol: 'ZS=F', name: 'Soybeans' },
    { symbol: 'ZW=F', name: 'Wheat' },
  ],
  'Forex': [
    { symbol: 'EURUSD=X', name: 'EUR/USD' },
    { symbol: 'GBPUSD=X', name: 'GBP/USD' },
    { symbol: 'USDJPY=X', name: 'USD/JPY' },
    { symbol: 'AUDUSD=X', name: 'AUD/USD' },
    { symbol: 'USDCAD=X', name: 'USD/CAD' },
    { symbol: 'USDCHF=X', name: 'USD/CHF' },
    { symbol: 'NZDUSD=X', name: 'NZD/USD' },
    { symbol: 'EURJPY=X', name: 'EUR/JPY' },
    { symbol: 'GBPJPY=X', name: 'GBP/JPY' },
    { symbol: 'EURGBP=X', name: 'EUR/GBP' },
    { symbol: 'USDMXN=X', name: 'USD/MXN' },
    { symbol: 'USDZAR=X', name: 'USD/ZAR' },
  ],
  'Crypto': [
    { symbol: 'BTC-USD', name: 'Bitcoin' },
    { symbol: 'ETH-USD', name: 'Ethereum' },
    { symbol: 'SOL-USD', name: 'Solana' },
    { symbol: 'BNB-USD', name: 'BNB' },
    { symbol: 'XRP-USD', name: 'XRP' },
    { symbol: 'ADA-USD', name: 'Cardano' },
    { symbol: 'DOGE-USD', name: 'Dogecoin' },
    { symbol: 'AVAX-USD', name: 'Avalanche' },
    { symbol: 'DOT-USD', name: 'Polkadot' },
    { symbol: 'LINK-USD', name: 'Chainlink' },
    { symbol: 'LTC-USD', name: 'Litecoin' },
    { symbol: 'MATIC-USD', name: 'Polygon' },
    { symbol: 'UNI-USD', name: 'Uniswap' },
    { symbol: 'ATOM-USD', name: 'Cosmos' },
  ],
}
