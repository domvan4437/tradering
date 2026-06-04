const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// Remove tradingview from form state
s = s.replace(
  `tradingview: profile.tradingview || '',\n    twitter: profile.twitter || '',`,
  `twitter: profile.twitter || '',`
)

// Remove tradingview from links array
s = s.replace(
  `{ key:'tradingview', label:'TradingView', placeholder:'tradingview.com/u/yourhandle' },\n            `,
  ``
)

console.log('✓ TradingView link removed')
fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
