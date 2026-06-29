'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Style tokens ──────────────────────────────────────────────────────────────
const F = 'var(--font)'
const styles = {
  input: {
    width: '100%', padding: '8px 10px', borderRadius: 7,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    fontFamily: F, fontSize: 13, color: 'var(--text)', outline: 'none',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block', fontFamily: F, fontSize: 10, fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4,
  },
  btn: (active) => ({
    flex: 1, padding: '8px', border: 'none', borderRadius: 7,
    fontFamily: F, fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: active ? '#534AB7' : 'var(--surface2)',
    color: active ? '#fff' : 'var(--text-muted)',
    transition: 'all .15s',
  }),
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '11px 14px', marginBottom: 8,
  },
}

function pnlColor(v) { return v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : 'var(--text-muted)' }
function fmt(n, decimals = 2) { return n == null ? '—' : Number(n).toFixed(decimals) }
function fmtPct(n) { return n == null ? '—' : `${n > 0 ? '+' : ''}${Number(n).toFixed(2)}%` }
function fmtDollar(n) { return n == null ? '—' : `${n >= 0 ? '+' : ''}$${Math.abs(n).toFixed(2)}` }
function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function timeLeft(d) {
  if (!d) return ''
  const diff = new Date(d) - Date.now()
  if (diff <= 0) return 'Ended'
  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hrs}h left`
  if (hrs > 0) return `${hrs}h ${mins}m left`
  return `${mins}m left`
}

const POPULAR = {
  Stocks:  ['AAPL','TSLA','NVDA','MSFT','AMZN','GOOGL','META','AMD','NFLX','SPY','QQQ'],
  Futures: ['NQ=F','ES=F','YM=F','RTY=F','GC=F','SI=F','CL=F','NG=F','HG=F','ZB=F','ZC=F','ZS=F'],
  Forex:   ['EURUSD=X','GBPUSD=X','USDJPY=X','AUDUSD=X','USDCAD=X','USDCHF=X','NZDUSD=X','EURJPY=X','GBPJPY=X','EURGBP=X'],
  Crypto:  ['BTC-USD','ETH-USD','SOL-USD','BNB-USD','XRP-USD','ADA-USD','DOGE-USD','AVAX-USD','DOT-USD','LINK-USD','LTC-USD','MATIC-USD'],
}

// ─── Portfolio Summary Bar ─────────────────────────────────────────────────────
function PortfolioBar({ portfolio }) {
  if (!portfolio) return null
  const eq = portfolio.equity ?? portfolio.cash ?? 0
  const ret = portfolio.returnPct ?? 0
  const unreal = portfolio.unrealizedPnl ?? 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
      {[
        { label: 'Equity', value: `$${fmt(eq)}`, sub: null, color: 'var(--text)' },
        { label: 'Return', value: fmtPct(ret), sub: null, color: pnlColor(ret) },
        { label: 'Cash', value: `$${fmt(portfolio.cash)}`, sub: null, color: 'var(--text)' },
        { label: 'Unrealized', value: fmtDollar(unreal), sub: null, color: pnlColor(unreal) },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
          <div style={{ fontFamily: F, fontSize: 15, fontWeight: 700, color }}>{value}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Asset Search + Quote ──────────────────────────────────────────────────────
function AssetSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPopular, setShowPopular] = useState(true)
  const debounceRef = useRef(null)

  const lookupSymbol = useCallback(async (sym) => {
    if (!sym) return
    setLoading(true); setError(''); setQuote(null)
    try {
      const res = await fetch(`/api/compete/quote?symbol=${encodeURIComponent(sym.trim().toUpperCase())}`)
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setQuote(d)
      setShowPopular(false)
    } catch { setError('Failed to fetch quote') }
    setLoading(false)
  }, [])

  const handleChange = (v) => {
    setQuery(v)
    clearTimeout(debounceRef.current)
    if (v.trim().length >= 1) {
      debounceRef.current = setTimeout(() => lookupSymbol(v), 800)
    } else {
      setQuote(null); setShowPopular(true)
    }
  }

  const handleSelect = (sym) => {
    setQuery(sym)
    lookupSymbol(sym)
  }

  const confirmSelect = () => {
    if (quote) onSelect(quote)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.label}>Symbol — search any stock, future, forex, crypto</label>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={e => handleChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') lookupSymbol(query) }}
          placeholder="e.g. TSLA, NQ=F, EURUSD=X, BTC-USD"
          style={{ ...styles.input, flex: 1 }}
        />
        <button
          onClick={() => lookupSymbol(query)}
          disabled={loading || !query.trim()}
          style={{ padding: '8px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: F, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
        >
          {loading ? '…' : 'Look up'}
        </button>
      </div>

      {/* Popular asset chips */}
      {showPopular && !quote && (
        <div style={{ marginTop: 10 }}>
          {Object.entries(POPULAR).map(([cat, syms]) => (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>{cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {syms.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSelect(s)}
                    style={{
                      padding: '3px 9px', borderRadius: 20, border: '1px solid var(--border)',
                      background: 'var(--surface2)', color: 'var(--text)', fontFamily: F,
                      fontSize: 11, cursor: 'pointer', transition: 'all .1s',
                    }}
                    onMouseEnter={e => { e.target.style.background = '#534AB7'; e.target.style.color = '#fff'; e.target.style.borderColor = '#534AB7' }}
                    onMouseLeave={e => { e.target.style.background = 'var(--surface2)'; e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--border)' }}
                  >{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ marginTop: 6, fontFamily: F, fontSize: 12, color: '#ef4444' }}>{error}</div>}

      {quote && (
        <div style={{ marginTop: 10, background: 'var(--surface2)', borderRadius: 9, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{quote.symbol}</div>
            <div style={{ fontFamily: F, fontSize: 12, color: 'var(--text-muted)' }}>{quote.name}</div>
            <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {quote.assetType?.toUpperCase()} · Max {quote.maxLeverage}x leverage · {quote.marketState}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: F, fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>
              {quote.currency === 'USD' ? '$' : ''}{fmt(quote.price, quote.price > 100 ? 2 : 4)}
            </div>
            <button
              onClick={confirmSelect}
              style={{ marginTop: 6, padding: '5px 14px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: F, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Trade this →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Order Form ────────────────────────────────────────────────────────────────
function OrderForm({ competitionId, competitionType, endDate, portfolio, quote, onSuccess }) {
  const [direction, setDirection] = useState('long')
  const [notional, setNotional] = useState('') // dollar amount
  const [leverage, setLeverage] = useState(1)
  const [orderType, setOrderType] = useState('market')
  const [limitPrice, setLimitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [slMode, setSlMode] = useState('price') // 'price' | 'pct'
  const [tpMode, setTpMode] = useState('price')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const maxLev = quote?.maxLeverage || 5
  const price = quote?.price || 0

  const dollarAmt = parseFloat(notional) || 0
  const marginRequired = leverage > 0 ? dollarAmt / leverage : dollarAmt
  const totalExposure = dollarAmt
  const cashAvail = portfolio?.cash ?? 0
  const canAfford = marginRequired <= cashAvail && dollarAmt > 0

  // Compute SL/TP price from % if in pct mode
  const slPrice = slMode === 'price'
    ? (parseFloat(stopLoss) || null)
    : (parseFloat(stopLoss) && price)
      ? direction === 'long'
        ? price * (1 - parseFloat(stopLoss) / 100)
        : price * (1 + parseFloat(stopLoss) / 100)
      : null

  const tpPrice = tpMode === 'price'
    ? (parseFloat(takeProfit) || null)
    : (parseFloat(takeProfit) && price)
      ? direction === 'long'
        ? price * (1 + parseFloat(takeProfit) / 100)
        : price * (1 - parseFloat(takeProfit) / 100)
      : null

  const handleSubmit = async () => {
    if (!dollarAmt || !quote) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/compete/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          competitionId,
          competitionType,
          endDate,
          symbol: quote.symbol,
          direction,
          quantity: dollarAmt,
          leverage,
          orderType,
          limitPrice: orderType !== 'market' ? limitPrice : undefined,
          stopLoss: slPrice,
          takeProfit: tpPrice,
        }),
      })
      const d = await res.json()
      if (d.error) { setError(d.error); setLoading(false); return }
      setSuccess(
        orderType === 'market'
          ? `✓ ${direction.toUpperCase()} ${quote.symbol} filled at $${fmt(d.fillPrice, price > 100 ? 2 : 4)}`
          : `✓ ${orderType} order queued — fills in ~60s if conditions met`
      )
      setNotional('')
      onSuccess?.()
    } catch { setError('Network error') }
    setLoading(false)
  }

  if (!quote) return null

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{quote.symbol}</div>
        <div style={{ fontFamily: F, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
          ${fmt(price, price > 100 ? 2 : 4)}
        </div>
      </div>

      {/* Long / Short */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => setDirection('long')}
          style={{ ...styles.btn(direction === 'long'), background: direction === 'long' ? '#16a34a' : 'var(--surface2)', color: direction === 'long' ? '#fff' : '#16a34a', border: '1px solid ' + (direction === 'long' ? '#16a34a' : 'var(--border)') }}
        >▲ Long</button>
        <button
          onClick={() => setDirection('short')}
          style={{ ...styles.btn(direction === 'short'), background: direction === 'short' ? '#dc2626' : 'var(--surface2)', color: direction === 'short' ? '#fff' : '#dc2626', border: '1px solid ' + (direction === 'short' ? '#dc2626' : 'var(--border)') }}
        >▼ Short</button>
      </div>

      {/* Dollar amount */}
      <div style={{ marginBottom: 10 }}>
        <label style={styles.label}>Dollar amount ($)</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>$</span>
          <input
            type="number"
            min="1"
            step="any"
            value={notional}
            onChange={e => setNotional(e.target.value)}
            placeholder="e.g. 1000"
            style={{ ...styles.input, paddingLeft: 24 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
          {[100, 250, 500, 1000, 2000].map(v => (
            <button key={v} onClick={() => setNotional(String(v))} style={{ padding: '2px 8px', border: '1px solid var(--border)', borderRadius: 20, background: 'var(--surface2)', fontFamily: F, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>${v}</button>
          ))}
        </div>
      </div>

      {/* Leverage */}
      <div style={{ marginBottom: 10 }}>
        <label style={styles.label}>Leverage — max {maxLev}x ({quote.assetType})</label>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[1, 2, 3, 5, 10, 20, 30].filter(l => l <= maxLev).map(l => (
            <button
              key={l}
              onClick={() => setLeverage(l)}
              style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid ' + (leverage === l ? '#534AB7' : 'var(--border)'), background: leverage === l ? '#534AB7' : 'var(--surface2)', color: leverage === l ? '#fff' : 'var(--text-muted)', fontFamily: F, fontSize: 12, cursor: 'pointer' }}
            >{l}x</button>
          ))}
        </div>
      </div>

      {/* Order type */}
      <div style={{ marginBottom: 10 }}>
        <label style={styles.label}>Order type</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['market', 'Market'], ['limit', 'Limit'], ['stop_entry', 'Stop Entry']].map(([v, label]) => (
            <button key={v} onClick={() => setOrderType(v)} style={{ ...styles.btn(orderType === v), flex: 'none', padding: '5px 12px', fontSize: 12, border: '1px solid ' + (orderType === v ? '#534AB7' : 'var(--border)') }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Limit price (if not market) */}
      {orderType !== 'market' && (
        <div style={{ marginBottom: 10 }}>
          <label style={styles.label}>{orderType === 'limit' ? 'Limit price' : 'Stop entry price'}</label>
          <input
            type="number"
            step="any"
            value={limitPrice}
            onChange={e => setLimitPrice(e.target.value)}
            placeholder={`Current: $${fmt(price, price > 100 ? 2 : 4)}`}
            style={styles.input}
          />
          <div style={{ fontFamily: F, fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {orderType === 'limit'
              ? `${direction === 'long' ? 'Buy' : 'Sell'} when price ${direction === 'long' ? '≤' : '≥'} limit. Fills in ~60s after conditions are met.`
              : `${direction === 'long' ? 'Buy' : 'Sell'} when price ${direction === 'long' ? '≥' : '≤'} stop. Fills in ~60s.`}
          </div>
        </div>
      )}

      {/* Stop Loss */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ ...styles.label, margin: 0 }}>Stop Loss (optional)</label>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {['price', 'pct'].map(m => (
              <button key={m} onClick={() => setSlMode(m)} style={{ padding: '2px 8px', background: slMode === m ? '#534AB7' : 'transparent', color: slMode === m ? '#fff' : 'var(--text-muted)', border: 'none', fontFamily: F, fontSize: 10, cursor: 'pointer' }}>{m === 'price' ? '$' : '%'}</button>
            ))}
          </div>
        </div>
        <input
          type="number" step="any"
          value={stopLoss}
          onChange={e => setStopLoss(e.target.value)}
          placeholder={slMode === 'price' ? (direction === 'long' ? `< $${fmt(price, 2)} (below entry)` : `> $${fmt(price, 2)} (above entry)`) : '2 (= 2% loss)'}
          style={styles.input}
        />
        {slPrice && <div style={{ fontFamily: F, fontSize: 11, color: '#ef4444', marginTop: 2 }}>Triggers at ${fmt(slPrice, price > 100 ? 2 : 4)}</div>}
      </div>

      {/* Take Profit */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ ...styles.label, margin: 0 }}>Take Profit (optional)</label>
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            {['price', 'pct'].map(m => (
              <button key={m} onClick={() => setTpMode(m)} style={{ padding: '2px 8px', background: tpMode === m ? '#534AB7' : 'transparent', color: tpMode === m ? '#fff' : 'var(--text-muted)', border: 'none', fontFamily: F, fontSize: 10, cursor: 'pointer' }}>{m === 'price' ? '$' : '%'}</button>
            ))}
          </div>
        </div>
        <input
          type="number" step="any"
          value={takeProfit}
          onChange={e => setTakeProfit(e.target.value)}
          placeholder={tpMode === 'price' ? (direction === 'long' ? `> $${fmt(price, 2)} (above entry)` : `< $${fmt(price, 2)} (below entry)`) : '5 (= 5% gain)'}
          style={styles.input}
        />
        {tpPrice && <div style={{ fontFamily: F, fontSize: 11, color: '#22c55e', marginTop: 2 }}>Triggers at ${fmt(tpPrice, price > 100 ? 2 : 4)}</div>}
      </div>

      {/* Order summary */}
      {dollarAmt > 0 && (
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[
            { l: 'Notional', v: `$${fmt(totalExposure)}` },
            { l: 'Margin req.', v: `$${fmt(marginRequired)}`, warn: marginRequired > cashAvail },
            { l: 'Max loss (no SL)', v: `-$${fmt(totalExposure)}` },
          ].map(({ l, v, warn }) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{l}</div>
              <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: warn ? '#ef4444' : 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fee2e2', borderRadius: 7, fontFamily: F, fontSize: 12, color: '#dc2626' }}>{error}</div>}
      {success && <div style={{ marginBottom: 10, padding: '8px 12px', background: '#dcfce7', borderRadius: 7, fontFamily: F, fontSize: 12, color: '#16a34a' }}>{success}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading || !canAfford || !dollarAmt}
        style={{
          width: '100%', padding: '10px', border: 'none', borderRadius: 8, fontFamily: F, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          background: !canAfford || !dollarAmt ? 'var(--surface2)' : direction === 'long' ? '#16a34a' : '#dc2626',
          color: !canAfford || !dollarAmt ? 'var(--text-muted)' : '#fff',
        }}
      >
        {loading ? 'Placing…' : !dollarAmt ? 'Enter an amount' : !canAfford ? `Insufficient cash ($${fmt(cashAvail)} avail.)` : `Place ${direction.toUpperCase()} order · ${orderType}`}
      </button>

      {orderType !== 'market' && (
        <div style={{ marginTop: 8, fontFamily: F, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
          ⚠ Limit/stop orders reserve margin now and fill ~60s after conditions are met (anti-lag protection)
        </div>
      )}
    </div>
  )
}

// ─── Open Positions ────────────────────────────────────────────────────────────
function PositionRow({ pos, onClose, onModify }) {
  const [modifying, setModifying] = useState(false)
  const [sl, setSl] = useState(pos.stopLoss || '')
  const [tp, setTp] = useState(pos.takeProfit || '')
  const [closing, setClosing] = useState(false)

  const saveModify = async () => {
    await onModify(pos.id, sl || null, tp || null)
    setModifying(false)
  }

  const handleClose = async () => {
    if (!confirm(`Close ${pos.direction.toUpperCase()} ${pos.symbol}? P&L: ${fmtDollar(pos.pnl)}`)) return
    setClosing(true)
    await onClose(pos.id)
    setClosing(false)
  }

  const leverageLabel = pos.leverage > 1 ? ` @${pos.leverage}x` : ''

  return (
    <div style={{ ...styles.card, borderLeft: `3px solid ${pos.direction === 'long' ? '#22c55e' : '#ef4444'}`, borderRadius: '0 10px 10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ padding: '1px 7px', borderRadius: 20, fontFamily: F, fontSize: 10, fontWeight: 700, background: pos.direction === 'long' ? '#dcfce7' : '#fee2e2', color: pos.direction === 'long' ? '#16a34a' : '#dc2626' }}>
              {pos.direction.toUpperCase()}
            </span>
            <span style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{pos.symbol}</span>
            {pos.leverage > 1 && <span style={{ fontFamily: F, fontSize: 10, color: '#534AB7', background: '#EEEDFE', padding: '1px 6px', borderRadius: 10 }}>{pos.leverage}x</span>}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: 'var(--text-muted)' }}>
            ${fmt(pos.quantity)} · Entry ${fmt(pos.entryPrice, pos.entryPrice > 100 ? 2 : 4)} · Now ${fmt(pos.currentPrice, pos.currentPrice > 100 ? 2 : 4)}
          </div>
          {(pos.stopLoss || pos.takeProfit) && !modifying && (
            <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
              {pos.stopLoss && <span style={{ color: '#ef4444' }}>SL ${fmt(pos.stopLoss, 2)}</span>}
              {pos.stopLoss && pos.takeProfit && ' · '}
              {pos.takeProfit && <span style={{ color: '#22c55e' }}>TP ${fmt(pos.takeProfit, 2)}</span>}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: pnlColor(pos.pnl) }}>
            {fmtDollar(pos.pnl)}
          </div>
          <div style={{ fontFamily: F, fontSize: 11, color: pnlColor(pos.pnlPct) }}>{fmtPct(pos.pnlPct)}</div>
        </div>
      </div>

      {modifying && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8, padding: '8px', background: 'var(--surface2)', borderRadius: 7 }}>
          <div>
            <label style={styles.label}>Stop Loss</label>
            <input type="number" step="any" value={sl} onChange={e => setSl(e.target.value)} placeholder="0 to remove" style={styles.input} />
          </div>
          <div>
            <label style={styles.label}>Take Profit</label>
            <input type="number" step="any" value={tp} onChange={e => setTp(e.target.value)} placeholder="0 to remove" style={styles.input} />
          </div>
          <button onClick={saveModify} style={{ padding: '6px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: F, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
          <button onClick={() => setModifying(false)} style={{ padding: '6px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: F, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setModifying(!modifying)} style={{ flex: 1, padding: '5px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontFamily: F, fontSize: 11, cursor: 'pointer' }}>
          <i className="ti ti-adjustments-horizontal" style={{ marginRight: 3 }} />Modify SL/TP
        </button>
        <button onClick={handleClose} disabled={closing} style={{ flex: 1, padding: '5px', border: `1px solid ${pos.pnl >= 0 ? '#22c55e' : '#ef4444'}`, borderRadius: 7, background: 'transparent', color: pos.pnl >= 0 ? '#22c55e' : '#ef4444', fontFamily: F, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          {closing ? '…' : `Close @ ${fmtDollar(pos.pnl)}`}
        </button>
      </div>
    </div>
  )
}

// ─── Pending Orders ────────────────────────────────────────────────────────────
function PendingOrderRow({ order, onCancel }) {
  const [cancelling, setCancelling] = useState(false)
  const secsLeft = Math.max(0, Math.floor((new Date(order.canFillAfter) - Date.now()) / 1000))

  const handleCancel = async () => {
    setCancelling(true)
    await onCancel(order.id)
    setCancelling(false)
  }

  return (
    <div style={{ ...styles.card, borderLeft: '3px solid #f59e0b', borderRadius: '0 10px 10px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ padding: '1px 7px', borderRadius: 20, fontFamily: F, fontSize: 10, fontWeight: 700, background: '#fef9c3', color: '#ca8a04' }}>
            {order.orderType?.replace('_', ' ').toUpperCase()}
          </span>
          <span style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{order.symbol}</span>
          <span style={{ fontFamily: F, fontSize: 10, color: order.direction === 'long' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{order.direction.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily: F, fontSize: 11, color: 'var(--text-muted)' }}>
          ${fmt(order.quantity)} @ ${fmt(order.limitPrice, order.limitPrice > 100 ? 2 : 4)} · {order.leverage}x
          {secsLeft > 0 && <span style={{ color: '#f59e0b', marginLeft: 6 }}>fills in {secsLeft}s</span>}
        </div>
      </div>
      <button onClick={handleCancel} disabled={cancelling} style={{ padding: '4px 10px', border: '1px solid #ef4444', borderRadius: 7, background: 'transparent', color: '#ef4444', fontFamily: F, fontSize: 11, cursor: 'pointer' }}>
        {cancelling ? '…' : 'Cancel'}
      </button>
    </div>
  )
}

// ─── Trade History Row ─────────────────────────────────────────────────────────
function TradeRow({ trade }) {
  const won = trade.pnl > 0
  const reasonIcons = { manual: '✋', stop_loss: '⛔', take_profit: '✅', liquidation: '💀', competition_end: '🏁' }
  return (
    <div style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', background: won ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
        {reasonIcons[trade.closeReason] || '✋'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: F, fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{trade.symbol}</span>
          <span style={{ fontFamily: F, fontSize: 10, color: trade.direction === 'long' ? '#22c55e' : '#ef4444' }}>{trade.direction.toUpperCase()}</span>
          {trade.leverage > 1 && <span style={{ fontFamily: F, fontSize: 10, color: '#534AB7' }}>{trade.leverage}x</span>}
        </div>
        <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)' }}>
          In ${fmt(trade.entryPrice, trade.entryPrice > 100 ? 2 : 4)} → Out ${fmt(trade.exitPrice, trade.exitPrice > 100 ? 2 : 4)} · {timeAgo(trade.closedAt)}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: pnlColor(trade.pnl) }}>{fmtDollar(trade.pnl)}</div>
        <div style={{ fontFamily: F, fontSize: 10, color: pnlColor(trade.pnlPct) }}>{fmtPct(trade.pnlPct)}</div>
      </div>
    </div>
  )
}

// ─── Leaderboard Panel ─────────────────────────────────────────────────────────
function LeaderboardPanel({ competitionId }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!competitionId) return
    fetch(`/api/compete/leaderboard?competitionId=${competitionId}`)
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [competitionId])

  if (loading) return <div style={{ textAlign: 'center', padding: 20, fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
  if (!entries.length) return <div style={{ textAlign: 'center', padding: 20, fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>No participants yet</div>

  return (
    <div>
      {entries.map(e => (
        <div key={e.userId} style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: 10, background: e.isMe ? '#EEEDFE' : 'var(--surface)' }}>
          <div style={{ width: 24, textAlign: 'center', fontFamily: F, fontSize: 12, fontWeight: 700, color: e.rank <= 3 ? '#534AB7' : 'var(--text-muted)' }}>#{e.rank}</div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EEEDFE', overflow: 'hidden', flexShrink: 0 }}>
            {e.image
              ? <img src={e.image} alt={e.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: 12, fontWeight: 700, color: '#534AB7' }}>{e.displayName[0]}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F, fontSize: 13, fontWeight: e.isMe ? 700 : 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.displayName}{e.isMe && <span style={{ marginLeft: 4, fontSize: 10, color: '#534AB7' }}>you</span>}
            </div>
            <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)' }}>
              {e.totalTrades}t · {e.winRate}% WR{e.isLiquidated ? ' · LIQUIDATED' : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: pnlColor(e.returnPct) }}>{fmtPct(e.returnPct)}</div>
            <div style={{ fontFamily: F, fontSize: 11, color: 'var(--text-muted)' }}>${fmt(e.equity)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompetitionTradingView({ competitionId, competitionType = 'h2h', endDate, title }) {
  const [tab, setTab] = useState('trade')
  const [portfolio, setPortfolio] = useState(null)
  const [positions, setPositions] = useState([])
  const [pendingOrders, setPendingOrders] = useState([])
  const [trades, setTrades] = useState([])
  const [tradeStats, setTradeStats] = useState(null)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)

  const fetchAll = useCallback(async () => {
    try {
      const [posRes, tradeRes] = await Promise.all([
        fetch(`/api/compete/positions?competitionId=${competitionId}`).then(r => r.json()),
        fetch(`/api/compete/trades?competitionId=${competitionId}`).then(r => r.json()),
      ])
      if (posRes.portfolio) setPortfolio(posRes.portfolio)
      setPositions(posRes.positions || [])
      setPendingOrders(posRes.orders || [])
      setTrades(tradeRes.trades || [])
      setTradeStats(tradeRes.stats || null)
    } catch {}
    setLoading(false)
  }, [competitionId])

  // Initial load + init portfolio
  useEffect(() => {
    if (!competitionId) return
    // Touch the portfolio endpoint to auto-create if needed
    fetch(`/api/compete/portfolio?competitionId=${competitionId}&competitionType=${competitionType}&endDate=${endDate || ''}`)
      .then(r => r.json())
      .then(d => { if (d.portfolio) setPortfolio(d.portfolio) })
      .catch(() => {})
    fetchAll()
  }, [competitionId, competitionType, endDate, fetchAll])

  // Auto-refresh positions every 30 seconds
  useEffect(() => {
    refreshTimerRef.current = setInterval(fetchAll, 30000)
    return () => clearInterval(refreshTimerRef.current)
  }, [fetchAll])

  const handleClose = async (positionId) => {
    await fetch('/api/compete/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId }),
    })
    fetchAll()
  }

  const handleModify = async (positionId, stopLoss, takeProfit) => {
    await fetch('/api/compete/order', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ positionId, stopLoss, takeProfit }),
    })
    fetchAll()
  }

  const handleCancelOrder = async (orderId) => {
    await fetch('/api/compete/order', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    })
    fetchAll()
  }

  const TABS = [
    ['trade', 'Trade'],
    ['positions', `Positions${positions.length ? ` (${positions.length})` : ''}`],
    ['orders', `Orders${pendingOrders.length ? ` (${pendingOrders.length})` : ''}`],
    ['history', `History${tradeStats?.totalTrades ? ` (${tradeStats.totalTrades})` : ''}`],
    ['leaderboard', 'Leaderboard'],
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>Loading trading panel…</div>
      </div>
    )
  }

  if (portfolio?.isLiquidated) {
    return (
      <div style={{ padding: 18 }}>
        <PortfolioBar portfolio={portfolio} />
        <div style={{ textAlign: 'center', padding: '32px 20px', background: '#fee2e2', borderRadius: 12, border: '1px solid #fca5a5' }}>
          <div style={{ fontSize: 36 }}>💀</div>
          <div style={{ fontFamily: F, fontSize: 16, fontWeight: 700, color: '#dc2626', marginTop: 8 }}>Account Liquidated</div>
          <div style={{ fontFamily: F, fontSize: 13, color: '#dc2626', marginTop: 4 }}>Your equity dropped below 20% of starting value.</div>
        </div>
        {/* Still show history */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Trade History</div>
          {trades.map(t => <TradeRow key={t.id} trade={t} />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header info */}
      {title && (
        <div style={{ padding: '10px 18px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>📊 {title}</div>
          {endDate && <div style={{ fontFamily: F, fontSize: 11, color: 'var(--text-muted)' }}>{timeLeft(endDate)}</div>}
        </div>
      )}

      <div style={{ padding: '12px 18px 0' }}>
        <PortfolioBar portfolio={portfolio} />

        {/* Inner tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 14, gap: 0, overflowX: 'auto' }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '7px 13px', fontFamily: F, fontSize: 12,
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#534AB7' : 'var(--text-muted)',
              background: 'none', border: 'none',
              borderBottom: tab === key ? '2px solid #534AB7' : '2px solid transparent',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
          <button onClick={fetchAll} style={{ marginLeft: 'auto', padding: '7px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }} title="Refresh">
            <i className="ti ti-refresh" />
          </button>
        </div>

        {/* Trade tab */}
        {tab === 'trade' && (
          <div>
            <AssetSearch onSelect={q => { setSelectedQuote(q); }} />
            {selectedQuote && (
              <OrderForm
                competitionId={competitionId}
                competitionType={competitionType}
                endDate={endDate}
                portfolio={portfolio}
                quote={selectedQuote}
                onSuccess={fetchAll}
              />
            )}
            {!selectedQuote && (
              <div style={{ textAlign: 'center', padding: '24px 0', fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>
                Search for a symbol above to start trading
              </div>
            )}
          </div>
        )}

        {/* Positions tab */}
        {tab === 'positions' && (
          positions.length === 0
            ? <div style={{ textAlign: 'center', padding: '36px 0' }}>
                <i className="ti ti-chart-candle" style={{ fontSize: 32, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }} />
                <div style={{ fontFamily: F, fontSize: 14, color: 'var(--text-muted)' }}>No open positions</div>
                <button onClick={() => setTab('trade')} style={{ marginTop: 12, padding: '7px 18px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontFamily: F, fontSize: 13, cursor: 'pointer' }}>Start trading</button>
              </div>
            : positions.map(pos => (
                <PositionRow key={pos.id} pos={pos} onClose={handleClose} onModify={handleModify} />
              ))
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          pendingOrders.length === 0
            ? <div style={{ textAlign: 'center', padding: '36px 0', fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>No pending orders</div>
            : pendingOrders.map(o => <PendingOrderRow key={o.id} order={o} onCancel={handleCancelOrder} />)
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div>
            {tradeStats && tradeStats.totalTrades > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { l: 'Total P&L', v: fmtDollar(tradeStats.totalPnl), c: pnlColor(tradeStats.totalPnl) },
                  { l: 'Trades', v: tradeStats.totalTrades },
                  { l: 'Win Rate', v: `${tradeStats.winRate}%`, c: tradeStats.winRate >= 50 ? '#22c55e' : '#ef4444' },
                  { l: 'W / L', v: `${tradeStats.wins}/${tradeStats.losses}` },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{ background: 'var(--surface2)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: F, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontFamily: F, fontSize: 14, fontWeight: 700, color: c || 'var(--text)' }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {trades.length === 0
              ? <div style={{ textAlign: 'center', padding: '36px 0', fontFamily: F, fontSize: 13, color: 'var(--text-muted)' }}>No closed trades yet</div>
              : trades.map(t => <TradeRow key={t.id} trade={t} />)
            }
          </div>
        )}

        {/* Leaderboard tab */}
        {tab === 'leaderboard' && <LeaderboardPanel competitionId={competitionId} />}
      </div>
    </div>
  )
}
