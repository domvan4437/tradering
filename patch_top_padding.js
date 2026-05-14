const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let o = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// The root MarketOverview div height needs to account for nav (46px) + white ticker (36px) = 82px
// But paddingTop was removed from CommodityScreener so MarketOverview starts at top of content area
// We just need a little padding inside each column top

// Add paddingTop to left panel
o = o.replace(
  /width: (260|195), flexShrink: 0,(\r?\n)\s+borderRight: '0\.5px solid var\(--border\)',(\r?\n)\s+padding: 11,/,
  `width: 260, flexShrink: 0,$2      borderRight: '0.5px solid var(--border)',$3      padding: 11, paddingTop: 14,`
)

// Add paddingTop to main panel
o = o.replace(
  `flex: 1, minWidth: 0, padding: 11,`,
  `flex: 1, minWidth: 0, padding: 11, paddingTop: 14,`
)

// Add paddingTop to news sidebar
o = o.replace(
  `width: 440, flexShrink: 0, padding: 11,`,
  `width: 440, flexShrink: 0, padding: 11, paddingTop: 14,`
)

fs.writeFileSync(OVERVIEW_PATH, o, 'utf8')
console.log('✓ Added paddingTop:14 to all three columns')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
