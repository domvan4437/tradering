'use client'
import React, { useState, useEffect } from 'react'

const TH = { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '4px 6px', borderBottom: '0.5px solid var(--border)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }
const TD = { fontSize: 11, padding: '4px 6px', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' }

function usePrices(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/prices?symbols=${symbols.join(',')}`)
      .then(r => r.json()).then(d => { setPrices(d || {}); setLoading(false) }).catch(() => setLoading(false))
  }, [symbols.join(',')])
  return { prices, loading }
}

const COMMODITY_GROUPS = [
  { name: 'Metals', etf: 'XME', etfPct: +1.2, pill: { bg: '#faeeda', color: '#633806' }, commodities: [
    { sym: 'GC=F',  label: 'Gold',       ticker: 'GC', cot: 72, seas: +2.1, cotNet: '+188K', cotNote: 'Commercial longs near 12-mo high. Seasonal tailwind through Jun. Watch $2,400 resistance.' },
    { sym: 'SI=F',  label: 'Silver',     ticker: 'SI', cot: 65, seas: +1.8, cotNet: '+44K',  cotNote: 'Industrial + monetary demand. Gold/silver ratio elevated — watch for catch-up move.' },
    { sym: 'HG=F',  label: 'Copper',     ticker: 'HG', cot: 54, seas: +0.9, cotNet: '+12K',  cotNote: 'China infrastructure demand supporting price. Neutral COT positioning.' },
    { sym: 'PL=F',  label: 'Platinum',   ticker: 'PL', cot: 48, seas: +0.4, cotNet: '+4K',   cotNote: 'Auto demand + green energy transition. Neutral positioning.' },
    { sym: 'PA=F',  label: 'Palladium',  ticker: 'PA', cot: 38, seas: -0.8, cotNet: '-8K',   cotNote: 'EV transition headwind. Spec shorts building.' },
  ]},
  { name: 'Energy', etf: 'XLE', etfPct: +1.4, pill: { bg: '#eaf3de', color: '#27500A' }, commodities: [
    { sym: 'CL=F',  label: 'Crude Oil WTI',  ticker: 'CL', cot: 28, seas: -0.8, cotNet: '-44K', cotNote: 'Commercials near extreme short. OPEC output risk + seasonal weakness. Watch $78 support.' },
    { sym: 'BZ=F',  label: 'Brent Crude',    ticker: 'BZ', cot: 30, seas: -0.6, cotNet: '-38K', cotNote: 'Similar to WTI. Geopolitical premium fading. Watch $82 support.' },
    { sym: 'NG=F',  label: 'Natural Gas',    ticker: 'NG', cot: 50, seas:  0.0, cotNet: '-2K',  cotNote: 'Neutral positioning. Storage builds through spring. Watch summer demand.' },
    { sym: 'RB=F',  label: 'RBOB Gasoline',  ticker: 'RB', cot: 44, seas: +1.2, cotNet: '+8K',  cotNote: 'Summer driving season demand building. Crack spread widening.' },
    { sym: 'HO=F',  label: 'Heating Oil',    ticker: 'HO', cot: 41, seas: -1.4, cotNet: '-6K',  cotNote: 'Seasonal weakness into spring/summer. Watch winter positioning later.' },
  ]},
  { name: 'Grains', etf: 'WEAT', etfPct: +1.5, pill: { bg: '#e1f5ee', color: '#085041' }, commodities: [
    { sym: 'ZW=F',  label: 'Wheat',      ticker: 'ZW', cot: 58, seas: +2.2, cotNet: '+22K', cotNote: 'Ukraine/Russia supply risk premium. Seasonal tailwind. Watch USDA WASDE.' },
    { sym: 'ZC=F',  label: 'Corn',       ticker: 'ZC', cot: 38, seas: -1.1, cotNet: '-18K', cotNote: 'Seasonal weakness. Large US crop expected. Watch planting progress.' },
    { sym: 'ZS=F',  label: 'Soybeans',   ticker: 'ZS', cot: 42, seas: -0.6, cotNet: '-12K', cotNote: 'Brazil harvest pressure. China demand key. Neutral-bearish COT.' },
    { sym: 'ZM=F',  label: 'Soybean Meal',ticker:'ZM', cot: 44, seas: -0.4, cotNet: '-8K',  cotNote: 'Follows soybeans. Feed demand steady.' },
    { sym: 'ZO=F',  label: 'Oats',       ticker: 'ZO', cot: 45, seas: +0.3, cotNet: '+2K',  cotNote: 'Neutral. Weather-dependent crop. Low liquidity.' },
  ]},
  { name: 'Softs', pill: { bg: '#eeedfe', color: '#3C3489' }, commodities: [
    { sym: 'KC=F',  label: 'Coffee',     ticker: 'KC', cot: 34, seas: -1.4, cotNet: '-14K', cotNote: 'Brazil crop concerns fading. Specs short. Watch weather in Vietnam.' },
    { sym: 'SB=F',  label: 'Sugar #11',  ticker: 'SB', cot: 52, seas: +0.8, cotNet: '+8K',  cotNote: 'India export restrictions supportive. Neutral-bullish COT.' },
    { sym: 'CC=F',  label: 'Cocoa',      ticker: 'CC', cot: 66, seas: +1.2, cotNet: '+18K', cotNote: 'West Africa supply disruption. Bullish COT. Record prices in 2024.' },
    { sym: 'CT=F',  label: 'Cotton',     ticker: 'CT', cot: 40, seas: +0.4, cotNet: '-4K',  cotNote: 'Neutral. China demand and US planting area key variables.' },
    { sym: 'OJ=F',  label: 'Orange Juice',ticker:'OJ', cot: 60, seas: +0.6, cotNet: '+6K',  cotNote: 'Florida citrus greening disease supportive. Bullish bias.' },
  ]},
  { name: 'Livestock', pill: { bg: '#fcebeb', color: '#791F1F' }, commodities: [
    { sym: 'LE=F',  label: 'Live Cattle',  ticker: 'LE', cot: 62, seas: +1.6, cotNet: '+12K', cotNote: 'Tight US cattle supply. Bullish COT. Grilling season demand ahead.' },
    { sym: 'GF=F',  label: 'Feeder Cattle',ticker: 'GF', cot: 58, seas: +1.2, cotNet: '+8K',  cotNote: 'Follows live cattle. Pasture conditions and feed costs key.' },
    { sym: 'HE=F',  label: 'Lean Hogs',    ticker: 'HE', cot: 44, seas:  0.0, cotNet: '-2K',  cotNote: 'Neutral seasonal. China pork demand and domestic supply in balance.' },
  ]},
]

const ALL_SYMS = COMMODITY_GROUPS.flatMap(g => g.commodities.map(c => c.sym))

const SEASONAL_THIS_MONTH = [
  { name: 'Wheat',      avg: +2.2, winRate: 68, up: true  },
  { name: 'Gold',       avg: +2.1, winRate: 72, up: true  },
  { name: 'Live Cattle',avg: +1.6, winRate: 65, up: true  },
  { name: 'Gasoline',   avg: +1.2, winRate: 61, up: true  },
  { name: 'Silver',     avg: +1.8, winRate: 64, up: true  },
  { name: 'Sugar',      avg: +0.8, winRate: 55, up: true  },
  { name: 'Corn',       avg: -1.1, winRate: 38, up: false },
  { name: 'Coffee',     avg: -1.4, winRate: 34, up: false },
  { name: 'Crude Oil',  avg: -0.8, winRate: 42, up: false },
  { name: 'Soybeans',   avg: -0.6, winRate: 40, up: false },
]

const KEY_REPORTS = [
  { name: 'EIA Crude Inventories', day: 'Wed', time: '10:30am', impact: 'high'   },
  { name: 'EIA NatGas Storage',    day: 'Thu', time: '10:30am', impact: 'medium' },
  { name: 'USDA WASDE Report',     day: 'Fri', time: '12:00pm', impact: 'high'   },
  { name: 'CFTC COT Release',      day: 'Fri', time: '3:30pm',  impact: 'medium' },
  { name: 'OPEC+ Meeting',         day: 'Jun 1', time: '',       impact: 'high'   },
]

const COT_EXTREMES = [
  { ticker: 'GC', label: 'Gold',       cot: 72, net: '+188K', seas: +2.1, note: 'Commercial longs near 12-mo high. Seasonal tailwind through Jun. Watch $2,400 resistance.' },
  { ticker: 'CL', label: 'Crude Oil',  cot: 28, net: '-44K',  seas: -0.8, note: 'Commercials near extreme short. OPEC output risk + seasonal weakness. Watch $78 support.' },
  { ticker: 'SI', label: 'Silver',     cot: 65, net: '+44K',  seas: +1.8, note: 'Gold/silver ratio elevated — watch for catch-up move. Industrial + monetary demand.' },
  { ticker: 'CC', label: 'Cocoa',      cot: 66, net: '+18K',  seas: +1.2, note: 'West Africa supply disruption. Bullish COT. Watch for supply normalization.' },
  { ticker: 'ZW', label: 'Wheat',      cot: 58, net: '+22K',  seas: +2.2, note: 'Ukraine/Russia supply risk premium. USDA WASDE key this week.' },
  { ticker: 'KC', label: 'Coffee',     cot: 34, net: '-14K',  seas: -1.4, note: 'Brazil crop concerns fading. Specs remain short. Bearish seasonal.' },
]

function cotColor(score) {
  if (score >= 60) return { bg: 'rgba(22,163,74,0.1)', color: '#15803d' }
  if (score <= 40) return { bg: 'rgba(220,38,38,0.09)', color: '#991b1b' }
  return { bg: 'rgba(180,83,9,0.1)', color: '#92400e' }
}
function cotLabel(score) { return score >= 60 ? 'Bull' : score <= 40 ? 'Bear' : 'Neut' }
function seasColor(val) { return val > 0 ? 'var(--green)' : val < 0 ? 'var(--red)' : 'var(--text-muted)' }

export default function CommoditiesOverviewTab() {
  const { prices, loading } = usePrices(ALL_SYMS)
  const [watchlist, setWatchlist] = useState(['GC=F', 'CL=F', 'ZW=F', 'SI=F'])
  const [selected, setSelected] = useState(null)

  function toggle(sym) { setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym]) }

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Commodities</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Metals · Energy · Grains · Softs · Livestock</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Gold',     sym: 'GC=F', fallback: '$2,341', fallbackChg: +0.42 },
          { label: 'Crude Oil',sym: 'CL=F', fallback: '$81.06', fallbackChg: -1.07 },
          { label: 'Nat Gas',  sym: 'NG=F', fallback: '$2.88',  fallbackChg: +0.88 },
          { label: 'DXY (USD)',sym: 'DX-Y.NYB', fallback: '104.82', fallbackChg: +0.34, note: '▲ headwind' },
        ].map(idx => {
          const d = prices[idx.sym]
          const chg = d?.changePct ?? idx.fallbackChg
          const up = chg !== null ? chg >= 0 : null
          return (
            <div key={idx.label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>
                {d?.price ? `$${d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : idx.fallback}
              </div>
              {up !== null && <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{chg.toFixed(2)}%</div>}
              {idx.note && !d && <div style={{ fontSize: 10, color: '#dc2626' }}>{idx.note}</div>}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 220px)', overflow: 'hidden' }}>

        {/* LEFT: table */}
        <div style={{ overflowY: 'auto', height: '100%' }}>
          {watchlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '5px 0 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Watching</span>
              {watchlist.map(sym => {
                const d = prices[sym]; const up = (d?.changePct || 0) >= 0
                const c = COMMODITY_GROUPS.flatMap(g => g.commodities).find(c => c.sym === sym)
                return (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid rgba(75,68,200,0.3)', background: 'rgba(75,68,200,0.06)', fontSize: 11 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{c?.ticker || sym}</span>
                    {d && <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                  </div>
                )
              })}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 36, ...TH }}>Sym</th>
                <th style={TH}>Commodity</th>
                <th style={{ width: 68, ...TH, textAlign: 'center' }}>Price</th>
                <th style={{ width: 55, ...TH, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 48, ...TH, textAlign: 'center' }}>Seas.</th>
                <th style={{ width: 32, ...TH }}></th>
                <th style={{ width: 185, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 10 }}>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {COMMODITY_GROUPS.map(group => (
                <React.Fragment key={group.name}>
                  <tr>
                    <td colSpan={7} style={{ padding: '4px 6px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: group.pill.bg, color: group.pill.color, marginRight: 6 }}>{group.name}</span>
                      {group.etf && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>{group.etf}</span>}
                      {group.etfPct != null && <span style={{ fontSize: 10, fontWeight: 500, color: group.etfPct >= 0 ? 'var(--green)' : 'var(--red)' }}>{group.etfPct >= 0 ? '+' : ''}{group.etfPct.toFixed(1)}%</span>}
                    </td>
                  </tr>
                  {group.commodities.map(c => {
                    const d = prices[c.sym]
                    const up = (d?.changePct || 0) >= 0
                    const inWl = watchlist.includes(c.sym)
                    const isOpen = selected === c.sym
                    const st = cotColor(c.cot)
                    return (
                      <React.Fragment key={c.sym}>
                        <tr style={{ cursor: 'pointer', background: isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                          onClick={() => setSelected(isOpen ? null : c.sym)}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}>
                          <td style={TD}><span style={{ fontWeight: 500 }}>{c.ticker}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)' }}>{c.label}</td>
                          <td style={{ ...TD, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {loading ? '—' : d?.price ? `$${d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>
                            {d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 500, color: seasColor(c.seas) }}>
                            {c.seas === 0 ? 'flat' : `${c.seas > 0 ? '+' : ''}${c.seas.toFixed(1)}%`}
                          </td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggle(c.sym) }}
                              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${inWl ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: inWl ? 'rgba(75,68,200,0.1)' : 'transparent', color: inWl ? '#3C3489' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1.6 }}>
                              {inWl ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 10px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 5, background: isOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)', cursor: 'pointer' }}
                                onClick={e => { e.stopPropagation(); setSelected(isOpen ? null : c.sym) }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{c.ticker}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{c.label}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <button onClick={e => { e.stopPropagation(); toggle(c.sym) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ) : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7} style={{ padding: '10px 14px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{c.label} · COT + Seasonal</div>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COT score</div><div style={{ fontSize: 12, fontWeight: 500, color: st.color }}>{c.cot} / 100</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signal</div><span style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: st.bg, color: st.color }}>{cotLabel(c.cot)}</span></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net position</div><div style={{ fontSize: 12, fontWeight: 500, color: c.cot >= 50 ? 'var(--green)' : 'var(--red)' }}>{c.cotNet}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seasonal avg</div><div style={{ fontSize: 12, fontWeight: 500, color: seasColor(c.seas) }}>{c.seas > 0 ? '+' : ''}{c.seas.toFixed(1)}%</div></div>
                              </div>
                              <div style={{ display: 'flex', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                                <div style={{ width: `${c.cot}%`, background: st.color, height: '100%' }} />
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{c.cotNote}</div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* RIGHT: intelligence panel */}
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>COT + seasonal intelligence</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>DXY: <span style={{ color: '#dc2626', fontWeight: 500 }}>104.82 ▲ headwind</span> · OPEC: Jun 1</div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>

            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#791F1F' }}>COT extremes</span>
            </div>
            {COT_EXTREMES.map(item => {
              const st = cotColor(item.cot)
              return (
                <div key={item.ticker} style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.ticker}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: st.bg, color: st.color }}>{cotLabel(item.cot)} {item.cot}/100</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 4, alignItems: 'center' }}>
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net pos.</div><div style={{ fontSize: 11, fontWeight: 500, color: item.cot >= 50 ? 'var(--green)' : 'var(--red)' }}>{item.net}</div></div>
                    <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Seasonal</div><div style={{ fontSize: 11, fontWeight: 500, color: seasColor(item.seas) }}>{item.seas > 0 ? '+' : ''}{item.seas.toFixed(1)}%</div></div>
                    <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>COT bar</div>
                      <div style={{ display: 'flex', height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${item.cot}%`, background: st.color, height: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.note}</div>
                </div>
              )
            })}

            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3C3489' }}>Seasonal highlights this month</span>
            </div>
            <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
              {SEASONAL_THIS_MONTH.map(s => (
                <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text)' }}>{s.name}</span>
                  <span style={{ fontWeight: 500, color: s.up ? 'var(--green)' : 'var(--red)' }}>{s.avg > 0 ? '+' : ''}{s.avg.toFixed(1)}% avg · {s.winRate}% win</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Key reports this week</span>
            </div>
            <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
              {KEY_REPORTS.map(r => {
                const bg = r.impact === 'high' ? 'rgba(220,38,38,0.09)' : 'rgba(186,117,23,0.1)'
                const col = r.impact === 'high' ? '#791F1F' : '#633806'
                return (
                  <div key={r.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                    <span>{r.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: bg, color: col }}>{r.day} {r.time}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>DXY impact on commodities</span>
            </div>
            <div style={{ padding: '9px 12px' }}>
              <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 4 }}>DXY <span style={{ fontWeight: 500 }}>104.82</span> <span style={{ color: '#dc2626' }}>▲ +0.34%</span> — dollar strength is a <span style={{ color: '#dc2626', fontWeight: 500 }}>headwind</span></div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>Commodities priced in USD tend to fall when the dollar rises. A 1% DXY rise typically pressures Gold ~0.5–1%, Crude ~0.3–0.7%. Watch for a DXY reversal as a catalyst for commodity longs.</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
