const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Add FuturesOverviewTab import
if (!s.includes('FuturesOverviewTab')) {
  s = s.replace(
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'`,
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'\nimport FuturesOverviewTabNew from './FuturesOverviewTab'`
  )
  console.log('✓ FuturesOverviewTab import added')
} else {
  console.log('✓ FuturesOverviewTab already imported')
}

// 2. Replace inline FuturesOverviewTab usage with the new component
// Find where futures Overview is rendered in MarketsLayout
s = s.replace(
  `{subTab==='Overview'      && <FuturesOverviewTab />}`,
  `{subTab==='Overview'      && <div style={{ marginTop: 82 }}><FuturesOverviewTabNew /></div>}`
)
console.log('✓ FuturesOverviewTab wired to new component')

// 3. Add marginTop to crypto section
s = s.replace(
  `{section === 'crypto' && <CryptoTab />}`,
  `{section === 'crypto' && <div style={{ marginTop: 82 }}><CryptoTab /></div>}`
)
console.log('✓ CryptoTab marginTop added')

// 4. Add marginTop to forex Overview
s = s.replace(
  `{subTab==='Overview'          && <ForexOverviewTab />}`,
  `{subTab==='Overview'          && <div style={{ marginTop: 82 }}><ForexOverviewTab /></div>}`
)
console.log('✓ ForexOverviewTab marginTop added')

// 5. Also add marginTop to charts and other sections that use padding wrapper
// These already have padding:'20px 24px' wrappers so just fix those
const OLD_CHARTS = `section==='charts' ? (\n          <div style={{padding:'20px 24px'}}><ChartWorkspace /></div>`
const NEW_CHARTS = `section==='charts' ? (\n          <div style={{padding:'20px 24px', paddingTop: 102}}><ChartWorkspace /></div>`
if (s.includes(OLD_CHARTS)) {
  s = s.replace(OLD_CHARTS, NEW_CHARTS)
  console.log('✓ Charts paddingTop added')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
