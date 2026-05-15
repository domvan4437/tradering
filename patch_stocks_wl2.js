const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const PATH = path.join(BASE, 'StocksSection.js')
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix top cutoff — use marginTop on the overview div instead of height calc
s = s.replace(
  `gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 160px)', overflow: 'hidden'`,
  `gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 168px)', overflow: 'hidden', marginTop: 8`
)
console.log('✓ Fixed top cutoff')

// 2. Remove watchlist chips row (we're replacing with column)
s = s.replace(
  `          {/* Watchlist chips */}
          {watchlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '6px 0 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2, flexShrink: 0 }}>Watchlist</span>
              {watchlist.map(sym => {
                const d = stockPrices[sym]
                const isPos = (d?.changePct || 0) >= 0
                return (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid var(--border2)', background: 'var(--surface2)', fontSize: 11 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{sym}</span>
                    {d && <span style={{ color: isPos ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{isPos ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                    <button onClick={() => toggleWatchlist(sym)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, padding: 0, lineHeight: 1, marginLeft: 1 }}>×</button>
                  </div>
                )
              })}
            </div>
          )}`,
  ``
)
console.log('✓ Removed chips row')

// 3. Replace table header — add spacer + Watchlist column, center number columns
s = s.replace(
  `<th style={{ width: 46, ...thStyle }}>Sym</th>\n                <th style={thStyle}>Company</th>\n                <th style={{ width: 72, ...thStyle, textAlign: 'right' }}>Price</th>\n                <th style={{ width: 58, ...thStyle, textAlign: 'right' }}>% Chg</th>\n                <th style={{ width: 48, ...thStyle, textAlign: 'right' }}>Cap</th>\n                <th style={{ width: 28, ...thStyle }}></th>`,
  `<th style={{ width: 46, ...thStyle }}>Sym</th>
                <th style={thStyle}>Company</th>
                <th style={{ width: 72, ...thStyle, textAlign: 'center' }}>Price</th>
                <th style={{ width: 58, ...thStyle, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 48, ...thStyle, textAlign: 'center' }}>Cap</th>
                <th style={{ width: 40, ...thStyle }}></th>
                <th style={{ width: 180, ...thStyle, borderLeft: '0.5px solid var(--border2)' }}>Watchlist</th>`
)
console.log('✓ Table header updated')

// 4. Replace sector header colspan from 6 to 7
s = s.replace(
  `<td colSpan={6} style={{ padding: '5px 8px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>`,
  `<td colSpan={7} style={{ padding: '5px 8px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>`
)
console.log('✓ Sector header colspan updated to 7')

// 5. Replace number cells to be center-aligned and add selectedStock state
// First add selectedStock state — insert after watchlist state
s = s.replace(
  `  const [watchlist, setWatchlist] = useState(['NVDA', 'AAPL', 'META', 'AMZN', 'TSLA', 'JPM'])`,
  `  const [watchlist, setWatchlist] = useState(['NVDA', 'AAPL', 'META', 'AMZN', 'TSLA', 'JPM'])
  const [selectedStock, setSelectedStock] = useState(null)`
)
console.log('✓ selectedStock state added')

// 6. Center price cell
s = s.replace(
  `<td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>\n                          {stockLoading ? '—' : d?.price ? \`$\${d.price.toFixed(2)}\` : '—'}\n                        </td>`,
  `<td style={{ ...tdStyle, fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'center' }}>\n                          {stockLoading ? '—' : d?.price ? \`$\${d.price.toFixed(2)}\` : '—'}\n                        </td>`
)

// 7. Center % chg cell
s = s.replace(
  `<td style={{ ...tdStyle, fontSize: 11, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)', textAlign: 'right' }}>\n                          {d ? \`\${isPos ? '+' : ''}\${d.changePct?.toFixed(2)}%\` : '—'}\n                        </td>`,
  `<td style={{ ...tdStyle, fontSize: 11, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)', textAlign: 'center' }}>\n                          {d ? \`\${isPos ? '+' : ''}\${d.changePct?.toFixed(2)}%\` : '—'}\n                        </td>`
)

// 8. Center cap cell
s = s.replace(
  `<td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>{stock.cap}</td>`,
  `<td style={{ ...tdStyle, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{stock.cap}</td>`
)
console.log('✓ Number cells centered')

// 9. Replace the old watchlist button cell with spacer + watchlist column cell
s = s.replace(
  `<td style={{ ...tdStyle, padding: '4px 4px' }}>\n                          <button\n                            onClick={e => { e.stopPropagation(); toggleWatchlist(stock.symbol) }}\n                            style={{\n                              fontSize: 9, padding: '1px 4px', borderRadius: 3,\n                              border: \`0.5px solid \${inWl ? 'rg`,
  `<td style={{ ...tdStyle, padding: '4px 6px', textAlign: 'center' }}>\n                          <button\n                            onClick={e => { e.stopPropagation(); toggleWatchlist(stock.symbol) }}\n                            style={{\n                              fontSize: 9, padding: '1px 4px', borderRadius: 3,\n                              border: \`0.5px solid \${inWl ? 'rg`
)

// 10. Find and replace the closing of the watchlist button cell to add the new watchlist column
// We need to add a new TD after the existing button TD
// Find the pattern after the watchlist button closes
s = s.replace(
  /(<\/button>\n\s+<\/td>\n\s+<\/tr>)/,
  `</button>
                        </td>
                        <td style={{ ...tdStyle, borderLeft: '0.5px solid var(--border2)', padding: '4px 8px', cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol) }}>
                          {inWl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{stock.symbol}</div>
                                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{stock.name}</div>
                              </div>
                              {d && <span style={{ fontSize: 10, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)' }}>{isPos?'+':''}{d.changePct?.toFixed(2)}%</span>}
                              {selectedStock === stock.symbol && <span style={{ fontSize: 9, color: '#4B44C8' }}>▼</span>}
                            </div>
                          ) : (
                            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                      {selectedStock === stock.symbol && (
                        <tr>
                          <td colSpan={7} style={{ padding: '10px 12px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                            {EARNINGS_DATA[stock.symbol] ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                                  {stock.name} · {EARNINGS_DATA[stock.symbol].urgency === 'reported' ? 'Last reported ' : 'Reports '}{EARNINGS_DATA[stock.symbol].date} · {EARNINGS_DATA[stock.symbol].time}
                                </div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                  {EARNINGS_DATA[stock.symbol].urgency !== 'reported' ? (
                                    <>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</div><div style={{ fontSize: 12, fontWeight: 500 }}>{EARNINGS_DATA[stock.symbol].estEps}</div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est Revenue</div><div style={{ fontSize: 12, fontWeight: 500 }}>{EARNINGS_DATA[stock.symbol].estRev}</div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expected move</div><div style={{ fontSize: 12, fontWeight: 500, color: '#4B44C8' }}>{EARNINGS_DATA[stock.symbol].expMove}</div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Last quarter</div><div style={{ fontSize: 11 }}><span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: EARNINGS_DATA[stock.symbol].lastQtr.type === 'beat' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.09)', color: EARNINGS_DATA[stock.symbol].lastQtr.type === 'beat' ? '#15803d' : '#991b1b' }}>{EARNINGS_DATA[stock.symbol].lastQtr.label}</span></div></div>
                                    </>
                                  ) : (
                                    <>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Est EPS</div><div style={{ fontSize: 12, fontWeight: 500 }}>{EARNINGS_DATA[stock.symbol].estEps}</div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actual EPS</div><div style={{ fontSize: 12, fontWeight: 500, color: EARNINGS_DATA[stock.symbol].reactionUp ? 'var(--green)' : 'var(--red)' }}>{EARNINGS_DATA[stock.symbol].actEps}</div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Surprise</div><div style={{ fontSize: 11 }}><span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: EARNINGS_DATA[stock.symbol].surprise.type === 'beat' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.09)', color: EARNINGS_DATA[stock.symbol].surprise.type === 'beat' ? '#15803d' : '#991b1b' }}>{EARNINGS_DATA[stock.symbol].surprise.label}</span></div></div>
                                      <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Stock reaction</div><div style={{ fontSize: 12, fontWeight: 500, color: EARNINGS_DATA[stock.symbol].reactionUp ? 'var(--green)' : 'var(--red)' }}>{EARNINGS_DATA[stock.symbol].reactionUp ? '▲' : '▼'} {EARNINGS_DATA[stock.symbol].reaction}</div></div>
                                    </>
                                  )}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{EARNINGS_DATA[stock.symbol].note}</div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: 24 }}>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Price</div><div style={{ fontSize: 13, fontWeight: 500 }}>{d?.price ? \`$\${d.price.toFixed(2)}\` : '—'}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Day change</div><div style={{ fontSize: 13, fontWeight: 500, color: isPos ? 'var(--green)' : 'var(--red)' }}>{d ? \`\${isPos?'+':''}\${d.changePct?.toFixed(2)}%\` : '—'}</div></div>
                                <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mkt Cap</div><div style={{ fontSize: 13, fontWeight: 500 }}>{stock.cap}</div></div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center' }}>No earnings data available for this stock</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}`
)
console.log('✓ Watchlist column + expandable earnings drawer added')

// 11. Make stock rows clickable
s = s.replace(
  `onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}\n                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}`,
  `onClick={() => setSelectedStock(selectedStock === stock.symbol ? null : stock.symbol)}\n                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}\n                        onMouseLeave={e => e.currentTarget.style.background = selectedStock === stock.symbol ? 'rgba(75,68,200,0.04)' : 'transparent'}`
)
console.log('✓ Stock rows made clickable')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ StocksSection.js saved')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
