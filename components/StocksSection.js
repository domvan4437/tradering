'use client'
import { useState, useEffect } from 'react'

const C = {
  bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface2)',
  surface3: 'var(--surface3)', border: 'var(--border)', border2: 'var(--border2)',
  accent: 'var(--accent)', text: 'var(--text)', muted: 'var(--text-muted)',
  dim: 'var(--text-dim)', green: 'var(--green)', red: 'var(--red)',
  greenBg: 'var(--green-bg)', redBg: 'var(--red-bg)',
  font: 'var(--font)', mono: 'var(--font-mono)',
}

const INDICES = [
  { label: 'S&P 500',    symbol: 'ES=F',  desc: 'Large cap US equities' },
  { label: 'Nasdaq 100', symbol: 'NQ=F',  desc: 'Tech-heavy US index' },
  { label: 'Dow Jones',  symbol: 'YM=F',  desc: '30 large US companies' },
  { label: 'Russell 2000',symbol: 'RTY=F',desc: 'US small cap stocks' },
  { label: 'VIX',        symbol: '^VIX',  desc: 'Market fear gauge' },
]

const TOP_STOCKS = [
  { symbol: 'NVDA',  name: 'NVIDIA',         sector: 'Technology' },
  { symbol: 'AAPL',  name: 'Apple',           sector: 'Technology' },
  { symbol: 'MSFT',  name: 'Microsoft',       sector: 'Technology' },
  { symbol: 'AMZN',  name: 'Amazon',          sector: 'Consumer' },
  { symbol: 'GOOGL', name: 'Alphabet',        sector: 'Technology' },
  { symbol: 'META',  name: 'Meta Platforms',  sector: 'Technology' },
  { symbol: 'TSLA',  name: 'Tesla',           sector: 'Automotive' },
  { symbol: 'JPM',   name: 'JPMorgan Chase',  sector: 'Finance' },
  { symbol: 'V',     name: 'Visa',            sector: 'Finance' },
  { symbol: 'XOM',   name: 'ExxonMobil',      sector: 'Energy' },
  { symbol: 'JNJ',   name: 'Johnson & Johnson',sector: 'Healthcare' },
  { symbol: 'WMT',   name: 'Walmart',         sector: 'Retail' },
]

const SECTORS = [
  { name: 'Technology',    symbol: 'XLK',  color: '#2563eb', emoji: '💻' },
  { name: 'Energy',        symbol: 'XLE',  color: '#059669', emoji: '⚡' },
  { name: 'Financials',    symbol: 'XLF',  color: '#7c3aed', emoji: '🏦' },
  { name: 'Healthcare',    symbol: 'XLV',  color: '#dc2626', emoji: '🏥' },
  { name: 'Consumer Disc', symbol: 'XLY',  color: '#d97706', emoji: '🛒' },
  { name: 'Industrials',   symbol: 'XLI',  color: '#0891b2', emoji: '🏭' },
  { name: 'Materials',     symbol: 'XLB',  color: '#65a30d', emoji: '⛏' },
  { name: 'Utilities',     symbol: 'XLU',  color: '#6366f1', emoji: '💡' },
  { name: 'Real Estate',   symbol: 'XLRE', color: '#f59e0b', emoji: '🏠' },
  { name: 'Comm Services', symbol: 'XLC',  color: '#ec4899', emoji: '📡' },
  { name: 'Cons Staples',  symbol: 'XLP',  color: '#14b8a6', emoji: '🛍' },
]

const EARNINGS_UPCOMING = [
  { company: 'JPMorgan Chase', symbol: 'JPM',  date: 'Apr 11', time: 'Before Open', est: '$4.61 EPS' },
  { company: 'Wells Fargo',    symbol: 'WFC',  date: 'Apr 11', time: 'Before Open', est: '$1.23 EPS' },
  { company: 'Goldman Sachs',  symbol: 'GS',   date: 'Apr 14', time: 'Before Open', est: '$11.24 EPS' },
  { company: 'Bank of America',symbol: 'BAC',  date: 'Apr 15', time: 'Before Open', est: '$0.82 EPS' },
  { company: 'NVIDIA',         symbol: 'NVDA', date: 'May 28', time: 'After Close',  est: '$0.89 EPS' },
  { company: 'Apple',          symbol: 'AAPL', date: 'May 1',  time: 'After Close',  est: '$1.61 EPS' },
  { company: 'Microsoft',      symbol: 'MSFT', date: 'Apr 30', time: 'After Close',  est: '$3.22 EPS' },
  { company: 'Amazon',         symbol: 'AMZN', date: 'May 1',  time: 'After Close',  est: '$1.36 EPS' },
]

const KEY_LEVELS = [
  { name: 'S&P 500 (ES)',    support: '5,100', resistance: '5,500', pivot: '5,300', note: 'Watch 200-day MA near 5,200' },
  { name: 'Nasdaq 100 (NQ)', support: '17,500', resistance: '19,500', pivot: '18,500', note: 'Tech earnings driving volatility' },
  { name: 'Dow Jones (YM)',  support: '38,500', resistance: '41,000', pivot: '39,750', note: 'Financials sector key driver' },
  { name: 'Russell 2000',    support: '1,900', resistance: '2,100', pivot: '2,000', note: 'Rate-sensitive — watch Fed signals' },
]

function usePrices(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/prices?symbols=${symbols.join(',')}`)
      .then(r => r.json()).then(d => { setPrices(d); setLoading(false) }).catch(() => setLoading(false))
  }, [symbols.join(',')])
  return { prices, loading }
}

export function StocksOverviewTab() {
  const { prices: idxPrices, loading: idxLoading } = usePrices(INDICES.map(i => i.symbol))
  const { prices: stockPrices, loading: stockLoading } = usePrices(TOP_STOCKS.map(s => s.symbol))

  return (
    <div>
      {/* Indices */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Major Indices</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {INDICES.map(idx => {
          const d = idxPrices[idx.symbol]
          const isPos = (d?.changePct || 0) >= 0
          return (
            <div key={idx.symbol} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '16px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 10 }}>{idx.desc}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text, fontFamily: C.mono, marginBottom: 4 }}>
                {idxLoading ? '—' : d?.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '—'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: isPos ? C.green : C.red, background: isPos ? 'var(--green-bg)' : 'var(--red-bg)', padding: '3px 10px', borderRadius: 99, display: 'inline-block' }}>
                {d ? `${isPos ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Top Stocks */}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 14px' }}>Most Watched Stocks</h3>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '10px 16px', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
          {['Company', 'Price', 'Change', '% Change', 'Sector'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {TOP_STOCKS.map((s, i) => {
          const d = stockPrices[s.symbol]
          const isPos = (d?.changePct || 0) >= 0
          return (
            <div key={s.symbol} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: i < TOP_STOCKS.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.symbol}</div>
                <div style={{ fontSize: 11, color: C.dim }}>{s.name}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: C.mono }}>
                {stockLoading ? '—' : d?.price?.toFixed(2) || '—'}
              </div>
              <div style={{ fontSize: 12, color: isPos ? C.green : C.red, fontFamily: C.mono }}>
                {d ? `${isPos ? '+' : ''}${d.change?.toFixed(2)}` : '—'}
              </div>
              <div style={{ background: d ? (isPos ? 'var(--green-bg)' : 'var(--red-bg)') : 'transparent', color: isPos ? C.green : C.red, padding: '3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700, width: 'fit-content' }}>
                {d ? `${isPos ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.sector}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StocksSectorsTab() {
  const { prices, loading } = usePrices(SECTORS.map(s => s.symbol))
  const sorted = [...SECTORS].map(s => ({ ...s, pct: prices[s.symbol]?.changePct || 0 })).sort((a, b) => b.pct - a.pct)
  const max = Math.max(...sorted.map(s => Math.abs(s.pct)), 0.1)

  return (
    <div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Sector ETF performance today. Strong sectors attract institutional money — watch for rotation out of laggards into leaders as a sign of market health or risk-off sentiment.</p>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {sorted.map(s => {
          const isPos = s.pct >= 0
          const barPct = (Math.abs(s.pct) / max) * 100
          const d = prices[s.symbol]
          return (
            <div key={s.symbol} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 20 }}>{s.emoji}</div>
              <div style={{ width: 140, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.name}</div>
                <div style={{ fontSize: 11, color: C.dim }}>{s.symbol}</div>
              </div>
              <div style={{ flex: 1, height: 8, background: C.surface2, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barPct}%`, background: isPos ? C.green : C.red, borderRadius: 4, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ width: 80, textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: isPos ? C.green : C.red, fontFamily: C.mono }}>
                  {loading ? '—' : d ? `${isPos ? '+' : ''}${s.pct.toFixed(2)}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: C.dim, fontFamily: C.mono }}>{d?.price?.toFixed(2) || '—'}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StocksEarningsTab() {
  return (
    <div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Upcoming earnings reports for major companies. Earnings releases often cause significant volatility — plan your positions and risk accordingly. EPS estimates from analyst consensus.</p>
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 18px', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
          {['Company', 'Report Date', 'Time', 'Est. EPS'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        {EARNINGS_UPCOMING.map((e, i) => (
          <div key={e.symbol} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '13px 18px', borderBottom: i < EARNINGS_UPCOMING.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{e.company}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{e.symbol}</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.date}</div>
            <div style={{ fontSize: 12, color: e.time === 'Before Open' ? C.green : C.accent, background: e.time === 'Before Open' ? 'var(--green-bg)' : 'var(--accent-light)', padding: '3px 8px', borderRadius: 99, width: 'fit-content', fontWeight: 500 }}>
              {e.time}
            </div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: C.mono }}>{e.est}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function StocksKeyLevelsTab() {
  return (
    <div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Key technical levels for major indices. Support levels are where buyers have historically stepped in. Resistance levels are where sellers have previously overwhelmed buyers. These are reference points — not guarantees.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {KEY_LEVELS.map(item => (
          <div key={item.name} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>{item.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Support</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.green, fontFamily: C.mono }}>{item.support}</div>
              </div>
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pivot</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.mono }}>{item.pivot}</div>
              </div>
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Resistance</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.red, fontFamily: C.mono }}>{item.resistance}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, padding: '8px 12px', background: C.surface2, borderRadius: 4 }}>
              💡 {item.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
