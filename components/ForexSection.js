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

const MAJOR_PAIRS = [
  { pair: 'EUR/USD', symbol: 'EURUSD=X', base: 'EUR', quote: 'USD', desc: 'Euro / US Dollar' },
  { pair: 'GBP/USD', symbol: 'GBPUSD=X', base: 'GBP', quote: 'USD', desc: 'British Pound / US Dollar' },
  { pair: 'USD/JPY', symbol: 'JPY=X',    base: 'USD', quote: 'JPY', desc: 'US Dollar / Japanese Yen' },
  { pair: 'USD/CHF', symbol: 'CHF=X',    base: 'USD', quote: 'CHF', desc: 'US Dollar / Swiss Franc' },
  { pair: 'AUD/USD', symbol: 'AUDUSD=X', base: 'AUD', quote: 'USD', desc: 'Australian Dollar / US Dollar' },
  { pair: 'USD/CAD', symbol: 'CAD=X',    base: 'USD', quote: 'CAD', desc: 'US Dollar / Canadian Dollar' },
  { pair: 'NZD/USD', symbol: 'NZDUSD=X', base: 'NZD', quote: 'USD', desc: 'New Zealand Dollar / US Dollar' },
  { pair: 'EUR/GBP', symbol: 'EURGBP=X', base: 'EUR', quote: 'GBP', desc: 'Euro / British Pound' },
]

const MINOR_PAIRS = [
  { pair: 'EUR/JPY', symbol: 'EURJPY=X', base: 'EUR', quote: 'JPY', desc: 'Euro / Japanese Yen' },
  { pair: 'GBP/JPY', symbol: 'GBPJPY=X', base: 'GBP', quote: 'JPY', desc: 'British Pound / Japanese Yen' },
  { pair: 'EUR/CHF', symbol: 'EURCHF=X', base: 'EUR', quote: 'CHF', desc: 'Euro / Swiss Franc' },
  { pair: 'EUR/AUD', symbol: 'EURAUD=X', base: 'EUR', quote: 'AUD', desc: 'Euro / Australian Dollar' },
  { pair: 'GBP/CAD', symbol: 'GBPCAD=X', base: 'GBP', quote: 'CAD', desc: 'British Pound / Canadian Dollar' },
  { pair: 'AUD/JPY', symbol: 'AUDJPY=X', base: 'AUD', quote: 'JPY', desc: 'Australian Dollar / Japanese Yen' },
  { pair: 'CAD/JPY', symbol: 'CADJPY=X', base: 'CAD', quote: 'JPY', desc: 'Canadian Dollar / Japanese Yen' },
  { pair: 'NZD/JPY', symbol: 'NZDJPY=X', base: 'NZD', quote: 'JPY', desc: 'New Zealand Dollar / Japanese Yen' },
]

const DXY_DATA = { symbol: 'DX-Y.NYB', label: 'US Dollar Index (DXY)' }

const COT_PAIRS = [
  { pair: 'EUR/USD', keyword: 'EURO FX',         desc: 'Speculator positioning — net long = bullish EUR' },
  { pair: 'GBP/USD', keyword: 'BRITISH POUND',    desc: 'Speculator positioning — net long = bullish GBP' },
  { pair: 'USD/JPY', keyword: 'JAPANESE YEN',     desc: 'Speculator positioning — net short YEN = bullish USD/JPY' },
  { pair: 'AUD/USD', keyword: 'AUSTRALIAN DOLLAR',desc: 'Speculator positioning — net long = bullish AUD' },
]

const KEY_LEVELS_INFO = [
  { pair: 'EUR/USD', support: '1.0800', resistance: '1.1000', note: 'Watch 1.0850 as near-term pivot' },
  { pair: 'GBP/USD', support: '1.2500', resistance: '1.2900', note: '1.2750 is key mid-range level' },
  { pair: 'USD/JPY', support: '148.00', resistance: '152.00', note: 'BoJ intervention risk above 152' },
  { pair: 'EUR/GBP', support: '0.8400', resistance: '0.8600', note: 'Range-bound market, watch breakout' },
  { pair: 'AUD/USD', support: '0.6300', resistance: '0.6600', note: 'Commodity-linked, watch China data' },
  { pair: 'USD/CAD', support: '1.3400', resistance: '1.3800', note: 'Oil correlation — watch crude prices' },
]

function PriceTable({ pairs, prices, loading }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', padding: '10px 16px', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
        {['Pair', 'Price', 'Change', '% Change', 'Range'].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
        ))}
      </div>
      {pairs.map((p, i) => {
        const d = prices[p.symbol]
        const isPos = (d?.changePct || 0) >= 0
        return (
          <div key={p.pair} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', padding: '12px 16px', borderBottom: i < pairs.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.pair}</div>
              <div style={{ fontSize: 11, color: C.dim }}>{p.desc}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: C.mono }}>
              {loading ? '—' : d?.price?.toFixed(4) || '—'}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: isPos ? C.green : C.red, fontFamily: C.mono }}>
              {d ? `${isPos ? '+' : ''}${d.change?.toFixed(4)}` : '—'}
            </div>
            <div style={{ background: d ? (isPos ? 'var(--green-bg)' : 'var(--red-bg)') : 'transparent', color: isPos ? C.green : C.red, padding: '3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 700, fontFamily: C.mono, display: 'inline-flex', alignItems: 'center', width: 'fit-content' }}>
              {d ? `${isPos ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}
            </div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.mono }}>
              {d ? `${d.low?.toFixed(4)} – ${d.high?.toFixed(4)}` : '—'}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ForexOverviewTab() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [dxy, setDxy] = useState(null)

  useEffect(() => {
    const allSymbols = [...MAJOR_PAIRS, ...MINOR_PAIRS].map(p => p.symbol)
    allSymbols.push(DXY_DATA.symbol)
    fetch(`/api/prices?symbols=${allSymbols.join(',')}`)
      .then(r => r.json()).then(d => { setPrices(d); setDxy(d[DXY_DATA.symbol]); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* DXY Banner */}
      {dxy && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 500, marginBottom: 4 }}>US Dollar Index (DXY) — Dollar strength benchmark</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.text, fontFamily: C.mono }}>{dxy.price?.toFixed(2)}</div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Change', value: `${dxy.change >= 0 ? '+' : ''}${dxy.change?.toFixed(2)}`, color: dxy.change >= 0 ? C.green : C.red },
              { label: '% Change', value: `${dxy.changePct >= 0 ? '+' : ''}${dxy.changePct?.toFixed(2)}%`, color: dxy.changePct >= 0 ? C.green : C.red },
              { label: 'Day High', value: dxy.high?.toFixed(2), color: C.text },
              { label: 'Day Low', value: dxy.low?.toFixed(2), color: C.text },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: item.color, fontFamily: C.mono }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', padding: '8px 16px', background: dxy.changePct >= 0 ? 'var(--green-bg)' : 'var(--red-bg)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, color: dxy.changePct >= 0 ? C.green : C.red }}>
            {dxy.changePct >= 0 ? '↑ Dollar Strengthening' : '↓ Dollar Weakening'}
          </div>
        </div>
      )}

      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>Major Pairs</h3>
      <div style={{ marginBottom: 24 }}>
        <PriceTable pairs={MAJOR_PAIRS} prices={prices} loading={loading} />
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 12px' }}>Minor & Cross Pairs</h3>
      <PriceTable pairs={MINOR_PAIRS} prices={prices} loading={loading} />

      <p style={{ fontSize: 11, color: C.dim, marginTop: 12, textAlign: 'right' }}>Prices delayed ~15min · Updates on page load</p>
    </div>
  )
}

export function ForexCOTTab() {
  const [cotData, setCotData] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all(COT_PAIRS.map(async p => {
      try {
        const res = await fetch('/api/cotindex', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cotKeyword: p.keyword }) })
        const data = await res.json()
        return { pair: p.pair, ...data }
      } catch { return { pair: p.pair, error: true } }
    })).then(results => {
      const map = {}
      results.forEach(r => { map[r.pair] = r })
      setCotData(map)
      setLoading(false)
    })
  }, [])

  const getColor = (idx) => idx >= 65 ? C.green : idx <= 35 ? C.red : C.accent

  return (
    <div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: C.text }}>How to read Forex COT:</strong> The CFTC tracks speculator (non-commercial) positioning in currency futures. When speculators are extremely net long a currency, it often signals the trend is crowded and due for a reversal. COT Index of 0–35 = speculators historically bearish. 65–100 = historically bullish.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>Loading COT data...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {COT_PAIRS.map(p => {
            const d = cotData[p.pair]
            if (!d || d.error) return (
              <div key={p.pair} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 4 }}>{p.pair}</div>
                <div style={{ fontSize: 12, color: C.dim }}>Data unavailable</div>
              </div>
            )
            const color = getColor(d.cotIndex)
            return (
              <div key={p.pair} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{p.pair}</div>
                    <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{p.desc}</div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: C.mono }}>{d.cotIndex}</div>
                </div>
                <div style={{ height: 6, background: C.surface2, borderRadius: 3, marginBottom: 6, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: `${d.cotIndex}%`, top: -3, width: 12, height: 12, borderRadius: '50%', background: color, transform: 'translateX(-50%)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim, marginBottom: 12 }}>
                  <span>0 Bearish</span><span>100 Bullish</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: C.surface2, borderRadius: 4, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Net Position</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: d.currentNet > 0 ? C.green : C.red, fontFamily: C.mono }}>{d.currentNet?.toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, background: C.surface2, borderRadius: 4, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>Signal</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color }}>{d.interpretation}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ForexKeyLevelsTab() {
  return (
    <div>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
          Key support and resistance levels based on major historical price areas, round numbers, and institutional order flow zones. These are reference levels — always confirm with your own analysis.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {KEY_LEVELS_INFO.map(item => (
          <div key={item.pair} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>{item.pair}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.green, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Support</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: C.mono }}>{item.support}</div>
              </div>
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Resistance</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: C.red, fontFamily: C.mono }}>{item.resistance}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, padding: '8px 12px', background: C.surface2, borderRadius: 4 }}>
              💡 {item.note}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
