const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const PATH = path.join(BASE, 'StocksSection.js')
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix top cutoff — the height calc needs to account for nav(46) + ticker(36) + indices row(~70) = ~152px
// Currently set to calc(100vh - 180px), bump to account for actual offset
s = s.replace(
  `height: 'calc(100vh - 180px)', overflow: 'hidden'`,
  `height: 'calc(100vh - 160px)', overflow: 'hidden'`
)
console.log('✓ Fixed height calc for top cutoff')

// 2. Add watchlist chip row above the table — insert after the opening left column div
s = s.replace(
  `{/* LEFT: Sector-grouped table */}\n        <div style={{ overflowY: 'auto', height: '100%' }}>`,
  `{/* LEFT: Sector-grouped table */}\n        <div style={{ overflowY: 'auto', height: '100%' }}>
          {/* Watchlist chips */}
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
          )}`
)
console.log('✓ Watchlist chips row added above table')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ StocksSection.js saved')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
