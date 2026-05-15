const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Add import
if (!s.includes('CommoditiesOverviewTab')) {
  s = s.replace(
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'`,
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'\nimport CommoditiesOverviewTab from './CommoditiesOverviewTab'`
  )
  console.log('✓ CommoditiesOverviewTab import added')
} else {
  console.log('✓ Already imported')
}

// 2. Replace MarketOverview in commodities section with CommoditiesOverviewTab
// The current code: {subTab==='Overview' && <MarketOverview onSelect={...} />}
const OLD = `{subTab==='Overview'          && <MarketOverview onSelect={(key, sym) => {\n              if (key === 'charts') { setSection('charts'); setTab(''); return; }\n              setSubTab(key === 'commodities' ? 'Screener' : key.charAt(0).toUpperCase() + key.slice(1));\n            }} />}`

const NEW = `{subTab==='Overview'          && <div style={{ marginTop: 82 }}><CommoditiesOverviewTab /></div>}`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ MarketOverview replaced with CommoditiesOverviewTab')
} else {
  // Try regex for whitespace/CRLF variations
  s = s.replace(
    /\{subTab==='Overview'\s+&&\s+<MarketOverview onSelect=\{[\s\S]*?\}\s*\/>\}/,
    `{subTab==='Overview'          && <div style={{ marginTop: 82 }}><CommoditiesOverviewTab /></div>}`
  )
  console.log('✓ Replaced via regex')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
