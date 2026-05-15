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

const FUTURES_GROUPS = [
  { name: 'Index', pill: { bg: '#eeedfe', color: '#3C3489' }, contracts: [
    { sym: 'ES=F',  label: 'E-mini S&P 500',  exchange: 'CME',   oi: '2.4M', cot: 72, cotNote: 'Managed money near 12-mo high. Commercials covering shorts.' },
    { sym: 'NQ=F',  label: 'E-mini Nasdaq',   exchange: 'CME',   oi: '1.1M', cot: 68, cotNote: 'Tech earnings driving positioning. AI capex bullish.' },
    { sym: 'YM=F',  label: 'Dow Jones Mini',  exchange: 'CME',   oi: '488K', cot: 51, cotNote: 'Neutral positioning. Financials sector key.' },
    { sym: 'RTY=F', label: 'Russell 2000',    exchange: 'CME',   oi: '412K', cot: 44, cotNote: 'Rate-sensitive. Watch Fed signals for direction.' },
  ]},
  { name: 'Rates', pill: { bg: '#fcebeb', color: '#791F1F' }, contracts: [
    { sym: 'ZB=F',  label: '30Y T-Bond',    exchange: 'CBOT', oi: '1.2M', cot: 28, cotNote: 'Specs near extreme short. Watch for short-covering rally if yields peak.' },
    { sym: 'ZN=F',  label: '10Y T-Note',   exchange: 'CBOT', oi: '3.8M', cot: 31, cotNote: 'Bearish positioning consistent with rate hike fears.' },
    { sym: 'ZF=F',  label: '5Y T-Note',    exchange: 'CBOT', oi: '2.1M', cot: 35, cotNote: 'Bearish but less extreme than 10Y.' },
  ]},
  { name: 'FX Futures', pill: { bg: '#e1f5ee', color: '#085041' }, contracts: [
    { sym: '6E=F',  label: 'Euro FX',        exchange: 'CME', oi: '688K', cot: 34, cotNote: 'Specs near 12-mo EUR short extreme. Squeeze risk above 1.0950.' },
    { sym: '6B=F',  label: 'British Pound',  exchange: 'CME', oi: '212K', cot: 38, cotNote: 'Bearish but not at extreme. BOE hold expected.' },
    { sym: '6J=F',  label: 'Japanese Yen',   exchange: 'CME', oi: '188K', cot: 22, cotNote: 'Extreme spec short. BOJ intervention risk above 155.' },
  ]},
  { name: 'Metals', pill: { bg: '#faeeda', color: '#633806' }, contracts: [
    { sym: 'GC=F',  label: 'Gold',    exchange: 'COMEX', oi: '412K', cot: 72, cotNote: 'Commercial longs near 12-mo high. Seasonal tailwind.' },
    { sym: 'SI=F',  label: 'Silver',  exchange: 'COMEX', oi: '144K', cot: 65, cotNote: 'Bullish COT. Industrial + monetary demand.' },
    { sym: 'HG=F',  label: 'Copper',  exchange: 'COMEX', oi: '188K', cot: 54, cotNote: 'China infrastructure demand supporting price.' },
  ]},
  { name: 'Energy', pill: { bg: '#eaf3de', color: '#27500A' }, contracts: [
    { sym: 'CL=F',  label: 'Crude Oil WTI', exchange: 'NYMEX', oi: '1.8M', cot: 28, cotNote: 'Commercials near extreme short. OPEC output risk.' },
    { sym: 'NG=F',  label: 'Natural Gas',   exchange: 'NYMEX', oi: '888K', cot: 50, cotNote: 'Neutral positioning. Storage builds through spring.' },
    { sym: 'RB=F',  label: 'RBOB Gasoline', exchange: 'NYMEX', oi: '212K', cot: 44, cotNote: 'Summer driving season demand building.' },
  ]},
]

const ALL_SYMS = FUTURES_GROUPS.flatMap(g => g.contracts.map(c => c.sym))

const YIELD_CURVE = [
  { tenor: '3M', yield: '5.28', color: '#dc2626' },
  { tenor: '2Y', yield: '5.02', color: '#dc2626' },
  { tenor: '5Y', yield: '4.68', color: 'var(--text)' },
  { tenor: '10Y',yield: '4.47', color: 'var(--text)' },
  { tenor: '30Y',yield: '4.58', color: 'var(--text)' },
]

const ECON_EVENTS = [
  { name: 'FOMC Meeting',     date: 'Jun 12', impact: 'HIGH' },
  { name: 'NFP Report',       date: 'May 3',  impact: 'HIGH' },
  { name: 'CPI Release',      date: 'May 15', impact: 'HIGH' },
  { name: 'Jobless Claims',   date: 'May 2',  impact: 'MED'  },
  { name: 'ISM Manufacturing',date: 'May 1',  impact: 'MED'  },
]

function cotColor(score) {
  if (score >= 60) return { bg: 'rgba(22,163,74,0.1)', color: '#15803d' }
  if (score <= 40) return { bg: 'rgba(220,38,38,0.09)', color: '#991b1b' }
  return { bg: 'rgba(180,83,9,0.1)', color: '#92400e' }
}
function cotLabel(score) { return score >= 60 ? 'Bull' : score <= 40 ? 'Bear' : 'Neut' }

export default function FuturesOverviewTab() {
  const { prices, loading } = usePrices(ALL_SYMS)
  const [watchlist, setWatchlist] = useState(['ES=F', 'ZB=F', 'GC=F'])
  const [selected, setSelected] = useState(null)

  function toggle(sym) { setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym]) }

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Futures</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Index · Rates · FX · Metals · Energy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'E-mini S&P', sym: 'ES=F', fallback: '7,538', fallbackChg: +0.93 },
          { label: 'E-mini NQ',  sym: 'NQ=F', fallback: '29,771',fallbackChg: +0.64 },
          { label: '30Y T-Bond', sym: 'ZB=F', fallback: '118.14',fallbackChg: -0.12 },
          { label: '10Y Yield',  sym: null,   fallback: '4.47%', fallbackChg: null, note: '▲ +3bps', noteColor: '#dc2626' },
        ].map(idx => {
          const d = idx.sym ? prices[idx.sym] : null
          const chg = d?.changePct ?? idx.fallbackChg
          const up = chg !== null ? chg >= 0 : null
          return (
            <div key={idx.label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{d?.price ? d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : idx.fallback}</div>
              {up !== null && <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{chg.toFixed(2)}%</div>}
              {idx.note && <div style={{ fontSize: 11, color: idx.noteColor }}>{idx.note}</div>}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', height: '100%' }}>
          {watchlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '5px 0 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Watching</span>
              {watchlist.map(sym => {
                const d = prices[sym]; const up = (d?.changePct || 0) >= 0
                const contract = FUTURES_GROUPS.flatMap(g => g.contracts).find(c => c.sym === sym)
                return (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid rgba(75,68,200,0.3)', background: 'rgba(75,68,200,0.06)', fontSize: 11 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{sym.replace('=F','').replace('=','')}</span>
                    {d && <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                  </div>
                )
              })}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 44, ...TH }}>Sym</th>
                <th style={TH}>Contract</th>
                <th style={{ width: 70, ...TH, textAlign: 'center' }}>Price</th>
                <th style={{ width: 55, ...TH, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 48, ...TH, textAlign: 'center' }}>OI</th>
                <th style={{ width: 32, ...TH }}></th>
                <th style={{ width: 190, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 10 }}>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {FUTURES_GROUPS.map(group => (
                <React.Fragment key={group.name}>
                  <tr>
                    <td colSpan={7} style={{ padding: '4px 6px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: group.pill.bg, color: group.pill.color, marginRight: 6 }}>{group.name}</span>
                    </td>
                  </tr>
                  {group.contracts.map(contract => {
                    const d = prices[contract.sym]
                    const up = (d?.changePct || 0) >= 0
                    const inWl = watchlist.includes(contract.sym)
                    const isOpen = selected === contract.sym
                    const st = cotColor(contract.cot)
                    return (
                      <React.Fragment key={contract.sym}>
                        <tr style={{ cursor: 'pointer', background: isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                          onClick={() => setSelected(isOpen ? null : contract.sym)}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}>
                          <td style={TD}><span style={{ fontWeight: 500 }}>{contract.sym.replace('=F','')}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)' }}>{contract.label}</td>
                          <td style={{ ...TD, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{loading ? '—' : d?.price ? d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}</td>
                          <td style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>{contract.oi}</td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggle(contract.sym) }}
                              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${inWl ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: inWl ? 'rgba(75,68,200,0.1)' : 'transparent', color: inWl ? '#3C3489' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1.6 }}>
                              {inWl ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 10px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 5, background: isOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)', cursor: 'pointer' }}
                                onClick={e => { e.stopPropagation(); setSelected(isOpen ? null : contract.sym) }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{contract.sym.replace('=F','')}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{contract.label}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <button onClick={e => { e.stopPropagation(); toggle(contract.sym) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ) : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7} style={{ padding: '10px 14px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{contract.label} · COT signal</div>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 5 }}>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COT score</div><div style={{ fontSize: 12, fontWeight: 500, color: st.color }}>{contract.cot} / 100</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signal</div><div><span style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: st.bg, color: st.color }}>{cotLabel(contract.cot)}</span></div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Open interest</div><div style={{ fontSize: 12, fontWeight: 500 }}>{contract.oi}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exchange</div><div style={{ fontSize: 12, fontWeight: 500 }}>{contract.exchange}</div></div>
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{contract.cotNote}</div>
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

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>Yield curve + macro signals</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>2s10s spread: <span style={{ color: '#dc2626', fontWeight: 500 }}>-18bps · Inverted</span> · Fed: 5.25%</div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#791F1F' }}>Yield curve</span>
            </div>
            <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
              {YIELD_CURVE.map(y => (
                <div key={y.tenor} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>{y.tenor}</span>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, parseFloat(y.yield) * 15)}%`, height: '100%', background: y.color }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: y.color, width: 44, textAlign: 'right' }}>{y.yield}%</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: '#dc2626', marginTop: 6, lineHeight: 1.4 }}>Inverted 2s10s — historically precedes recession. Watch for steepening as a reversal signal.</div>
            </div>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3C3489' }}>COT extremes — futures</span>
            </div>
            {[{ sym: 'ES=F', label: 'S&P 500', cot: 72, net: '+142K', note: 'Managed money near 12-mo high. Commercials covering shorts.' },
              { sym: 'ZB=F', label: 'T-Bond',  cot: 28, net: '-88K',  note: 'Specs near extreme short. Watch for short-covering rally if yields peak.' },
              { sym: 'GC=F', label: 'Gold',    cot: 72, net: '+188K', note: 'Commercial longs near 12-mo high. Seasonal tailwind through Jun.' },
            ].map(item => {
              const st = cotColor(item.cot)
              return (
                <div key={item.sym} style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.label}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: st.bg, color: st.color }}>{cotLabel(item.cot)} {item.cot}/100</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net position</div><div style={{ fontSize: 11, fontWeight: 500, color: item.cot >= 50 ? 'var(--green)' : 'var(--red)' }}>{item.net}</div></div>
                    <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
                    <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>COT bar</div>
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
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Upcoming events</span>
            </div>
            <div style={{ padding: '9px 12px' }}>
              {ECON_EVENTS.map(ev => {
                const bg = ev.impact === 'HIGH' ? 'rgba(220,38,38,0.09)' : 'rgba(186,117,23,0.1)'
                const col = ev.impact === 'HIGH' ? '#791F1F' : '#633806'
                return (
                  <div key={ev.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                    <span>{ev.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: bg, color: col }}>{ev.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
