import { getSession } from '../../../../lib/auth'

import { fetchHistory } from '../../../../lib/marketData'

// ── Simple Moving Average ─────────────────────────────────────────
function calcSMA(closes, period) {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

// ── Check if a single bar meets all entry conditions ─────────────
function meetsConditions(bar, idx, prices, sma50, sma200, conditions, cotMap, seasonalMap) {
  for (const cond of conditions) {
    const { type, operator, value } = cond
    let pass = true

    if (type === 'price_vs_sma50') {
      const sma = sma50[idx]
      if (!sma) return false
      pass = operator === 'above' ? bar.close > sma : bar.close < sma
    }
    else if (type === 'price_vs_sma200') {
      const sma = sma200[idx]
      if (!sma) return false
      pass = operator === 'above' ? bar.close > sma : bar.close < sma
    }
    else if (type === 'price_change_pct') {
      const lookback = parseInt(cond.period) || 5
      if (idx < lookback) return false
      const prev = prices[idx - lookback]
      const chg = ((bar.close - prev) / prev) * 100
      pass = operator === 'above' ? chg > parseFloat(value) : chg < parseFloat(value)
    }
    else if (type === 'cot_index') {
      const cotVal = cotMap[bar.date]
      if (cotVal == null) continue // skip if no COT for that date
      pass = operator === 'below' ? cotVal <= parseFloat(value) : cotVal >= parseFloat(value)
    }
    else if (type === 'seasonal_winrate') {
      const monthWR = seasonalMap?.[bar.month]
      if (monthWR == null) continue
      pass = operator === 'above' ? monthWR >= parseFloat(value) : monthWR <= parseFloat(value)
    }
    else if (type === 'month_is') {
      pass = bar.month === parseInt(value)
    }
    else if (type === 'day_of_week') {
      pass = bar.dayOfWeek === parseInt(value)
    }

    if (!pass) return false
  }
  return true
}

// ── Run the backtest engine ───────────────────────────────────────
function runBacktest(prices, conditions, direction, stopPct, targetPct, holdingDays) {
  if (!prices.length) return { trades: [], error: 'No price data' }

  const closes = prices.map(p => p.close)
  const sma50  = calcSMA(closes, 50)
  const sma200 = calcSMA(closes, 200)

  // Build mock COT map (date → COT index) — in real implementation this comes from DB
  const cotMap = {}
  const seasonalMap = {}

  const trades = []
  let inTrade = false
  let entry = null

  for (let i = 200; i < prices.length - 1; i++) {
    const bar = prices[i]

    if (!inTrade) {
      const qualifies = meetsConditions(bar, i, closes, sma50, sma200, conditions, cotMap, seasonalMap)
      if (qualifies) {
        inTrade = true
        entry = {
          entryDate: bar.date,
          entryPrice: prices[i + 1]?.open || bar.close,
          entryIdx: i + 1,
          direction,
          stopPrice: direction === 'LONG'
            ? (prices[i+1]?.open || bar.close) * (1 - stopPct / 100)
            : (prices[i+1]?.open || bar.close) * (1 + stopPct / 100),
          targetPrice: direction === 'LONG'
            ? (prices[i+1]?.open || bar.close) * (1 + targetPct / 100)
            : (prices[i+1]?.open || bar.close) * (1 - targetPct / 100),
        }
      }
    } else {
      // Check exit conditions
      const maxHold = entry.entryIdx + holdingDays
      const exitByTime = i >= maxHold
      const hitStop = direction === 'LONG' ? bar.low <= entry.stopPrice : bar.high >= entry.stopPrice
      const hitTarget = direction === 'LONG' ? bar.high >= entry.targetPrice : bar.low <= entry.targetPrice

      if (hitTarget || hitStop || exitByTime) {
        let exitPrice, exitReason
        if (hitTarget) { exitPrice = entry.targetPrice; exitReason = 'Target Hit' }
        else if (hitStop) { exitPrice = entry.stopPrice; exitReason = 'Stop Hit' }
        else { exitPrice = bar.close; exitReason = 'Time Exit' }

        const pnlPct = direction === 'LONG'
          ? ((exitPrice - entry.entryPrice) / entry.entryPrice) * 100
          : ((entry.entryPrice - exitPrice) / entry.entryPrice) * 100

        const holdDays = i - entry.entryIdx

        trades.push({
          entryDate: entry.entryDate,
          exitDate: bar.date,
          entryPrice: entry.entryPrice,
          exitPrice,
          direction,
          pnlPct: parseFloat(pnlPct.toFixed(2)),
          exitReason,
          holdDays,
          month: new Date(entry.entryDate).getMonth(),
          year: new Date(entry.entryDate).getFullYear(),
          win: pnlPct > 0,
        })
        inTrade = false
        entry = null
      }
    }
  }

  return { trades }
}

// ── Calculate stats from trades ───────────────────────────────────
function calcStats(trades) {
  if (!trades.length) return null

  const wins   = trades.filter(t => t.win)
  const losses = trades.filter(t => !t.win)
  const pnls   = trades.map(t => t.pnlPct)

  const winRate     = (wins.length / trades.length) * 100
  const avgWin      = wins.length  ? wins.reduce((s,t)  => s + t.pnlPct, 0) / wins.length  : 0
  const avgLoss     = losses.length ? losses.reduce((s,t) => s + t.pnlPct, 0) / losses.length : 0
  const profitFactor = losses.length && avgLoss !== 0 ? Math.abs((wins.length * avgWin) / (losses.length * avgLoss)) : null
  const totalReturn = pnls.reduce((a, b) => a + b, 0)
  const avgHold     = trades.reduce((s,t) => s + t.holdDays, 0) / trades.length
  const maxWin      = Math.max(...pnls)
  const maxLoss     = Math.min(...pnls)

  // Max drawdown
  let peak = 0, equity = 0, maxDD = 0
  pnls.forEach(p => { equity += p; if (equity > peak) peak = equity; const dd = peak - equity; if (dd > maxDD) maxDD = dd })

  // Consecutive wins/losses
  let maxConsecWins = 0, maxConsecLosses = 0, curW = 0, curL = 0
  trades.forEach(t => {
    if (t.win) { curW++; curL = 0; if (curW > maxConsecWins) maxConsecWins = curW }
    else { curL++; curW = 0; if (curL > maxConsecLosses) maxConsecLosses = curL }
  })

  // By month
  const byMonth = {}
  trades.forEach(t => {
    const k = t.month
    if (!byMonth[k]) byMonth[k] = { wins: 0, losses: 0, pnl: 0 }
    byMonth[k].pnl += t.pnlPct
    t.win ? byMonth[k].wins++ : byMonth[k].losses++
  })

  // By year
  const byYear = {}
  trades.forEach(t => {
    const k = t.year
    if (!byYear[k]) byYear[k] = { trades: 0, wins: 0, pnl: 0 }
    byYear[k].trades++; byYear[k].pnl += t.pnlPct; if (t.win) byYear[k].wins++
  })

  // By exit reason
  const byExit = {}
  trades.forEach(t => { if (!byExit[t.exitReason]) byExit[t.exitReason] = 0; byExit[t.exitReason]++ })

  // Equity curve
  let eq = 0
  const equityCurve = trades.map(t => { eq += t.pnlPct; return { date: t.exitDate, equity: parseFloat(eq.toFixed(2)) } })

  return {
    totalTrades: trades.length, wins: wins.length, losses: losses.length,
    winRate: parseFloat(winRate.toFixed(1)),
    avgWin: parseFloat(avgWin.toFixed(2)),
    avgLoss: parseFloat(avgLoss.toFixed(2)),
    profitFactor: profitFactor ? parseFloat(profitFactor.toFixed(2)) : null,
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    avgHoldDays: parseFloat(avgHold.toFixed(1)),
    maxWin: parseFloat(maxWin.toFixed(2)),
    maxLoss: parseFloat(maxLoss.toFixed(2)),
    maxDrawdown: parseFloat(maxDD.toFixed(2)),
    maxConsecWins, maxConsecLosses,
    byMonth, byYear, byExit, equityCurve,
  }
}

// ── AI qualitative analysis ───────────────────────────────────────
async function generateAIAnalysis(strategy, stats, trades, apiKey) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const bestMonth = Object.entries(stats.byMonth).sort((a,b) => b[1].pnl - a[1].pnl)[0]
  const worstMonth = Object.entries(stats.byMonth).sort((a,b) => a[1].pnl - b[1].pnl)[0]

  const prompt = `You are a professional quantitative trading analyst reviewing a strategy backtest. Analyze these results and provide expert commentary.

STRATEGY: ${strategy.name} on ${strategy.asset}
Direction: ${strategy.direction} | Lookback: ${strategy.years} years
Conditions: ${strategy.conditions.map(c => `${c.type} ${c.operator} ${c.value}`).join(', ')}
Stop: ${strategy.stopPct}% | Target: ${strategy.targetPct}% | Max Hold: ${strategy.holdingDays} days

BACKTEST RESULTS:
Total Trades: ${stats.totalTrades}
Win Rate: ${stats.winRate}%
Avg Win: +${stats.avgWin}% | Avg Loss: ${stats.avgLoss}%
Profit Factor: ${stats.profitFactor}
Total Return: ${stats.totalReturn}%
Max Drawdown: -${stats.maxDrawdown}%
Avg Hold: ${stats.avgHoldDays} days
Max Consec Wins: ${stats.maxConsecWins} | Max Consec Losses: ${stats.maxConsecLosses}
Best Month: ${bestMonth ? monthNames[bestMonth[0]] + ' (' + bestMonth[1].pnl.toFixed(1) + '%)' : 'N/A'}
Worst Month: ${worstMonth ? monthNames[worstMonth[0]] + ' (' + worstMonth[1].pnl.toFixed(1) + '%)' : 'N/A'}
Exit Reasons: ${JSON.stringify(stats.byExit)}

Write a professional analysis with EXACTLY these sections using **Section Title** format:

**Overall Assessment**
2-3 sentences on whether this strategy has a genuine edge. Be honest — if it looks curve-fitted or weak, say so.

**What's Working**
Specific conditions or patterns driving the wins. Reference actual numbers.

**What's Not Working**
The biggest drag on performance. What's causing the losses. Be specific.

**Risk Profile**
Assessment of the drawdown, profit factor, and whether the risk/reward is sustainable for live trading.

**Optimization Suggestions**
3 specific, actionable changes to improve this strategy. Not generic advice.

**Live Trading Readiness**
Is this strategy ready to trade live? What else needs to be validated before risking real capital?`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

// ── Main route handler ────────────────────────────────────────────
export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  const body = await request.json()
  const { asset, symbol, direction, conditions, stopPct, targetPct, holdingDays, years, name } = body

  if (!symbol) return Response.json({ error: 'No symbol provided' }, { status: 400 })

  try {
    // 1. Fetch price history
    const prices = await fetchHistory(symbol, years || 3)
    if (prices.length < 50) return Response.json({ error: `Not enough price data for ${symbol}` }, { status: 400 })

    // 2. Run backtest
    const { trades, error: btError } = runBacktest(prices, conditions || [], direction, parseFloat(stopPct), parseFloat(targetPct), parseInt(holdingDays))
    if (btError) return Response.json({ error: btError }, { status: 400 })
    if (trades.length === 0) return Response.json({ error: 'No trades generated — conditions may be too restrictive or never triggered in the selected period.' }, { status: 400 })

    // 3. Calculate stats
    const stats = calcStats(trades)

    // 4. AI analysis
    let aiAnalysis = ''
    if (apiKey) {
      try { aiAnalysis = await generateAIAnalysis({ name, asset, symbol, direction, conditions, stopPct, targetPct, holdingDays, years }, stats, trades, apiKey) }
      catch {}
    }

    return Response.json({ stats, trades: trades.slice(0, 100), totalTrades: trades.length, aiAnalysis, priceDataPoints: prices.length, dateRange: { from: prices[0]?.date, to: prices[prices.length - 1]?.date } })
  } catch (err) {
    console.error('Backtest error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
