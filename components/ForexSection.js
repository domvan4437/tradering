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

const FOREX_GROUPS = [
  { name: 'Majors', pill: { bg: '#eeedfe', color: '#3C3489' }, pairs: [
    { sym: 'EURUSD=X', label: 'EUR/USD', spread: '0.8', cot: 34, support: '1.0800', resist: '1.0950' },
    { sym: 'GBPUSD=X', label: 'GBP/USD', spread: '1.0', cot: 38, support: '1.2450', resist: '1.2600' },
    { sym: 'USDJPY=X', label: 'USD/JPY', spread: '1.2', cot: 22, support: '152.00', resist: '158.00' },
    { sym: 'AUDUSD=X', label: 'AUD/USD', spread: '1.4', cot: 29, support: '0.6400', resist: '0.6600' },
    { sym: 'USDCAD=X', label: 'USD/CAD', spread: '1.6', cot: 48, support: '1.3500', resist: '1.3800' },
    { sym: 'NZDUSD=X', label: 'NZD/USD', spread: '1.8', cot: 31, support: '0.5900', resist: '0.6100' },
    { sym: 'USDCHF=X', label: 'USD/CHF', spread: '1.1', cot: 44, support: '0.8900', resist: '0.9200' },
  ]},
  { name: 'Crosses', pill: { bg: '#e1f5ee', color: '#085041' }, pairs: [
    { sym: 'EURGBP=X', label: 'EUR/GBP', spread: '1.1', cot: null, support: '0.8550', resist: '0.8800' },
    { sym: 'EURJPY=X', label: 'EUR/JPY', spread: '1.8', cot: null, support: '163.00', resist: '170.00' },
    { sym: 'GBPJPY=X', label: 'GBP/JPY', spread: '2.2', cot: null, support: '190.00', resist: '198.00' },
    { sym: 'AUDJPY=X', label: 'AUD/JPY', spread: '2.0', cot: null, support: '98.00',  resist: '103.00' },
  ]},
]

const ALL_FOREX_SYMS = FOREX_GROUPS.flatMap(g => g.pairs.map(p => p.sym))

const COT_DATA = {
  'EURUSD=X': { score: 34, net: '-44K', expMove: '±0.8%/wk', note: 'Specs near 12-mo short extreme. Watch for squeeze above 1.0950.' },
  'USDJPY=X': { score: 22, net: '-188K', expMove: '±0.9%/wk', note: 'Extreme short positioning. BOJ intervention risk above 155. Watch closely.' },
  'GBPUSD=X': { score: 38, net: '-28K', expMove: '±0.7%/wk', note: 'Bearish but not at extreme. BOE hold expected — watch inflation data.' },
  'AUDUSD=X': { score: 29, net: '-32K', expMove: '±0.6%/wk', note: 'RBA on hold. China demand key driver. COT near 6-month bearish extreme.' },
}

const CENTRAL_BANKS = [
  { name: 'Fed (USD)',  rate: '5.25%', next: 'Jun 12', outlook: 'Hold', outColor: '#b45309' },
  { name: 'ECB (EUR)',  rate: '4.50%', next: 'Jun 6',  outlook: 'Cut expected', outColor: '#16a34a' },
  { name: 'BOE (GBP)',  rate: '5.25%', next: 'Jun 20', outlook: 'Hold', outColor: '#b45309' },
  { name: 'BOJ (JPY)',  rate: '0.10%', next: 'Jun 14', outlook: 'Intervention watch', outColor: '#dc2626' },
  { name: 'RBA (AUD)',  rate: '4.35%', next: 'Jun 18', outlook: 'Hold', outColor: '#b45309' },
  { name: 'BOC (CAD)',  rate: '5.00%', next: 'Jun 5',  outlook: 'Cut possible', outColor: '#16a34a' },
]

function cotColor(score) {
  if (score >= 60) return { bg: 'rgba(22,163,74,0.1)', color: '#15803d' }
  if (score <= 40) return { bg: 'rgba(220,38,38,0.09)', color: '#991b1b' }
  return { bg: 'rgba(180,83,9,0.1)', color: '#92400e' }
}
function cotLabel(score) { return score >= 60 ? 'Bull' : score <= 40 ? 'Bear' : 'Neut' }

export function ForexOverviewTab() {
  const { prices, loading } = usePrices(ALL_FOREX_SYMS)
  const [watchlist, setWatchlist] = useState(['EURUSD=X', 'USDJPY=X', 'GBPUSD=X'])
  const [selected, setSelected] = useState(null)

  function toggle(sym) { setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym]) }

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Forex</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Majors · Crosses · Exotics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'DXY Index', sym: 'DX-Y.NYB', fallback: '104.82', fallbackChg: +0.34 },
          { label: 'EUR/USD',   sym: 'EURUSD=X', fallback: '1.0844', fallbackChg: -0.50 },
          { label: 'USD/JPY',   sym: 'USDJPY=X', fallback: '155.22', fallbackChg: +0.34 },
          { label: 'GBP/USD',   sym: 'GBPUSD=X', fallback: '1.2488', fallbackChg: -0.26 },
        ].map(idx => {
          const d = prices[idx.sym]
          const chg = d?.changePct ?? idx.fallbackChg
          const up = chg >= 0
          return (
            <div key={idx.label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>{d?.price?.toFixed(4) || idx.fallback}</div>
              <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{chg.toFixed(2)}%</div>
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
                const pair = FOREX_GROUPS.flatMap(g => g.pairs).find(p => p.sym === sym)
                return (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid rgba(75,68,200,0.3)', background: 'rgba(75,68,200,0.06)', fontSize: 11 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{pair?.label || sym}</span>
                    {d && <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                  </div>
                )
              })}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 68, ...TH }}>Pair</th>
                <th style={{ width: 65, ...TH, textAlign: 'center' }}>Price</th>
                <th style={{ width: 55, ...TH, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 50, ...TH, textAlign: 'center' }}>Spread</th>
                <th style={{ width: 32, ...TH }}></th>
                <th style={{ ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 10, width: 190 }}>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {FOREX_GROUPS.map(group => (
                <React.Fragment key={group.name}>
                  <tr>
                    <td colSpan={6} style={{ padding: '4px 6px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: group.pill.bg, color: group.pill.color, marginRight: 6 }}>{group.name}</span>
                    </td>
                  </tr>
                  {group.pairs.map(pair => {
                    const d = prices[pair.sym]
                    const up = (d?.changePct || 0) >= 0
                    const inWl = watchlist.includes(pair.sym)
                    const isOpen = selected === pair.sym
                    const cotSt = pair.cot ? cotColor(pair.cot) : null
                    return (
                      <React.Fragment key={pair.sym}>
                        <tr style={{ cursor: 'pointer', background: isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                          onClick={() => setSelected(isOpen ? null : pair.sym)}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}>
                          <td style={TD}><span style={{ fontWeight: 500 }}>{pair.label}</span></td>
                          <td style={{ ...TD, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{loading ? '—' : d?.price?.toFixed(4) || '—'}</td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}</td>
                          <td style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>{pair.spread}</td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggle(pair.sym) }}
                              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${inWl ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: inWl ? 'rgba(75,68,200,0.1)' : 'transparent', color: inWl ? '#3C3489' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1.6 }}>
                              {inWl ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 10px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 5, background: isOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)', cursor: 'pointer' }}
                                onClick={e => { e.stopPropagation(); setSelected(isOpen ? null : pair.sym) }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{pair.label}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>S: {pair.support} R: {pair.resist}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <button onClick={e => { e.stopPropagation(); toggle(pair.sym) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ) : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={6} style={{ padding: '10px 14px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 5 }}>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Support</div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--red)' }}>{pair.support}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resistance</div><div style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>{pair.resist}</div></div>
                                {pair.cot && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COT score</div><div style={{ fontSize: 12, fontWeight: 500, color: cotColor(pair.cot).color }}>{pair.cot} / 100</div></div>}
                                {COT_DATA[pair.sym] && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net positioning</div><div style={{ fontSize: 12, fontWeight: 500 }}>{COT_DATA[pair.sym].net}</div></div>}
                                {COT_DATA[pair.sym] && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exp weekly move</div><div style={{ fontSize: 12, fontWeight: 500, color: '#4B44C8' }}>{COT_DATA[pair.sym].expMove}</div></div>}
                              </div>
                              {COT_DATA[pair.sym] && <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{COT_DATA[pair.sym].note}</div>}
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
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>COT + central bank tracker</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>DXY: <span style={{ color: 'var(--green)', fontWeight: 500 }}>Bullish 66</span> · Next FOMC: Jun 12</div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#791F1F' }}>COT extremes — currencies</span>
            </div>
            {Object.entries(COT_DATA).map(([sym, data]) => {
              const pair = FOREX_GROUPS.flatMap(g => g.pairs).find(p => p.sym === sym)
              const st = cotColor(data.score)
              return (
                <div key={sym} style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{pair?.label || sym}</span>
                    <span style={{ flex: 1 }} />
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: st.bg, color: st.color }}>{cotLabel(data.score)} {data.score}/100</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Net positioning</div><div style={{ fontSize: 11, fontWeight: 500 }}>{data.net}</div></div>
                    <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Exp weekly move</div><div style={{ fontSize: 11, fontWeight: 500, color: '#4B44C8' }}>{data.expMove}</div></div>
                    <div style={{ width: '0.5px', height: 22, background: 'var(--border)' }} />
                    <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COT bar</div>
                      <div style={{ display: 'flex', height: 4, width: 60, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                        <div style={{ width: `${data.score}%`, background: st.color, height: '100%' }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{data.note}</div>
                </div>
              )
            })}
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3C3489' }}>Central bank rates</span>
            </div>
            <div style={{ padding: '9px 12px' }}>
              {CENTRAL_BANKS.map(cb => (
                <div key={cb.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text)', width: 80, flexShrink: 0 }}>{cb.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', width: 44 }}>{cb.rate}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1 }}>{cb.next}</span>
                  <span style={{ fontSize: 10, fontWeight: 500, color: cb.outColor }}>{cb.outlook}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ForexCOTTab() {
  return (
    <div style={{ padding: '20px 0', fontFamily: 'var(--font)' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Forex COT Data</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Detailed COT positioning for currency futures. Coming soon with full historical charts.</p>
    </div>
  )
}

export function ForexKeyLevelsTab() {
  const levels = [
    { pair: 'EUR/USD', support: '1.0800', pivot: '1.0870', resistance: '1.0950', note: 'ECB policy divergence key driver. Watch 1.0800 as major floor.' },
    { pair: 'GBP/USD', support: '1.2450', pivot: '1.2530', resistance: '1.2600', note: 'BOE hold expected. UK inflation data key for next leg.' },
    { pair: 'USD/JPY', support: '152.00', pivot: '155.00', resistance: '158.00', note: 'BOJ intervention watch above 155. Extreme COT short positioning.' },
    { pair: 'AUD/USD', support: '0.6400', pivot: '0.6490', resistance: '0.6600', note: 'China demand and RBA policy key. COT near bearish extreme.' },
  ]
  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: 16 }}>
        {levels.map(item => (
          <div key={item.pair} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>{item.pair}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Support</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>{item.support}</div></div>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pivot</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{item.pivot}</div></div>
              <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 12px', textAlign: 'center' }}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Resistance</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{item.resistance}</div></div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 4 }}>{item.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
