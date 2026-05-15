const fs = require('fs')
const PATH = 'components/StocksSection.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix top cutoff — bump to 220px
s = s.replace(
  /height: 'calc\(100vh - \d+px\)', overflow: 'hidden'/,
  `height: 'calc(100vh - 220px)', overflow: 'hidden'`
)
console.log('✓ Height offset bumped to 220px')

// 2. Move watchlist items to top of column
// Instead of showing watchlist info inline in each stock's own row,
// we show ALL watchlist items stacked at the top of the watchlist column,
// and then show "—" for non-watchlisted items.
// We do this by replacing the watchlist TD content with a conditional:
// - if this stock is the FIRST watchlist item → render all watchlist items stacked
// - if this stock is IN watchlist but not first → render nothing (already shown above)
// - if not in watchlist → show "—"

// Find the watchlist TD and replace its content
const OLD_WL_TD = `<td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 12px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{stock.symbol}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stock.name}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <span style={{ fontSize: 9, color: isOpen ? '#4B44C8' : 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>`

const NEW_WL_TD = `<td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 12px', verticalAlign: 'top' }}>
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

if (s.includes(OLD_WL_TD)) {
  s = s.replace(OLD_WL_TD, NEW_WL_TD)
  console.log('✓ Watchlist column floated to top')
} else {
  console.warn('⚠ Could not find watchlist TD — trying CRLF version')
  // Try with regex for any whitespace variation
  const fixed = s.replace(
    /\{inWl \? \(\s*<div style=\{\{ display: 'flex', alignItems: 'center', gap: 8 \}\}>/,
    `{inWl && watchlist.indexOf(stock.symbol) === 0 ? (\n                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>`
  )
  if (fixed !== s) {
    s = fixed
    console.log('✓ Watchlist floated via regex')
  } else {
    console.warn('⚠ Watchlist TD not matched — check manually')
  }
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
