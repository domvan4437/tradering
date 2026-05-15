const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// Add import if not already there
if (!s.includes("from './FuturesOverviewTab'")) {
  s = s.replace(
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'`,
    `import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'\nimport FuturesOverviewTabNew from './FuturesOverviewTab'`
  )
  console.log('✓ Import added')
} else {
  console.log('✓ Import already present')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
