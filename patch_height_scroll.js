const fs = require('fs')
const PATH = 'components/StocksSection.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Fix top cutoff — increase offset from 168 to 210 to account for nav+ticker+indices+padding
s = s.replace(
  `height: 'calc(100vh - 168px)', overflow: 'hidden'`,
  `height: 'calc(100vh - 210px)', overflow: 'hidden'`
)
console.log('✓ Height offset increased to 210px')

// 2. Fix earnings panel — wrap in scrollable div
s = s.replace(
  `<div style={{ height: '100%' }}>\n          <EarningsPanel watchlist={watchlist} onAddWatchlist={sym => setWatchlist(w => [...new Set([...w, sym])])} />\n        </div>`,
  `<div style={{ height: '100%', overflowY: 'auto' }}>\n          <EarningsPanel watchlist={watchlist} onAddWatchlist={sym => setWatchlist(w => [...new Set([...w, sym])])} />\n        </div>`
)
console.log('✓ Earnings panel wrapper made scrollable')

// 3. Also fix the EarningsPanel inner div — remove height:100% from inner since outer handles scroll
s = s.replace(
  `display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', height: '100%'`,
  `display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden'`
)
console.log('✓ EarningsPanel inner height:100% removed')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
