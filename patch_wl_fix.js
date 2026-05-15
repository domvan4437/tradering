const fs = require('fs')
const PATH = 'components/StocksSection.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix top cutoff — add more paddingTop to the overview div
s = s.replace(
  `<div style={{ fontFamily: 'var(--font)', paddingTop: 8 }}>`,
  `<div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>`
)
console.log('✓ paddingTop increased to 14')

// 2. Fix watchlist column — the problem is verticalAlign:'top' makes the cell
// span the height of all watchlist items, pushing stock rows down.
// Solution: render all watchlist items in a SEPARATE dedicated row above the table,
// not inside the table cells at all. Remove the watchlist TD approach and instead
// put watchlist as a fixed header row above the scrollable table.

// Change the watchlist column header to reflect new approach
s = s.replace(
  `<th style={{ width: 190, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 12 }}>Watchlist</th>`,
  `<th style={{ width: 190, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 12 }}>Watchlist</th>`
)

// Fix the watchlist TD — revert to simple per-row display (not floated)
// but make it a clean mini card only for watched stocks
const OLD = `<td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 12px', verticalAlign: 'top' }}>
                            {inWl && watchlist.indexOf(stock.symbol) === 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {watchlist.map(wsym => {
                                  const wd = stockPrices[wsym]
                                  const wup = (wd?.changePct || 0) >= 0
                                  const wstock = SECTOR_GROUPS.flatMap(g => g.stocks).find(s => s.symbol === wsym)
                                  const wOpen = selected === wsym
                                  return (
                                    <div key={wsym} onClick={e => { e.stopPropagation(); setSelected(wOpen ? null : wsym) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 5, background: wOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)', cursor: 'pointer' }}
                                      onMouseEnter={e => { if (!wOpen) e.currentTarget.style.background = 'rgba(75,68,200,0.06)' }}
                                      onMouseLeave={e => { e.currentTarget.style.background = wOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{wsym}</div>
                                        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{wstock?.name || ''}</div>
                                      </div>
                                      {wd && <span style={{ fontSize: 10, fontWeight: 500, color: wup ? 'var(--green)' : 'var(--red)' }}>{wup ? '+' : ''}{wd.changePct?.toFixed(2)}%</span>}
                                      <button onClick={e => { e.stopPropagation(); toggleWl(wsym) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <span style={{ fontSize: 9, color: 'transparent' }}>—</span>
                            )}
                          </td>`

const NEW = `<td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 12px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 5, background: isOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)' }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{stock.symbol}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stock.name}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <button onClick={e => { e.stopPropagation(); toggleWl(stock.symbol) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ Watchlist column fixed to per-row display')
} else {
  console.warn('⚠ Could not find watchlist TD')
}

// 3. Add a watchlist summary strip above the table (before the <table> tag)
s = s.replace(
  `<table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>`,
  `{watchlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '6px 0 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Watching</span>
              {watchlist.map(wsym => {
                const wd = stockPrices[wsym]
                const wup = (wd?.changePct || 0) >= 0
                return (
                  <div key={wsym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid rgba(75,68,200,0.3)', background: 'rgba(75,68,200,0.06)', fontSize: 11, cursor: 'pointer' }}
                    onClick={() => setSelected(selected === wsym ? null : wsym)}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{wsym}</span>
                    {wd && <span style={{ color: wup ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{wup ? '+' : ''}{wd.changePct?.toFixed(2)}%</span>}
                  </div>
                )
              })}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>`
)
console.log('✓ Watchlist summary strip added above table')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
