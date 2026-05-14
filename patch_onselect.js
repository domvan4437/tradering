const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let o = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Fix 1: Add onSelect to LeftPanel props
o = o.replace(
  'function LeftPanel({ selectedAsset, onSelectAsset })',
  'function LeftPanel({ selectedAsset, onSelectAsset, onSelect })'
)

// Fix 2: Pass onSelect to LeftPanel in the root return
o = o.replace(
  '<LeftPanel selectedAsset={selectedAsset} onSelectAsset={handleSelectAsset} />',
  '<LeftPanel selectedAsset={selectedAsset} onSelectAsset={handleSelectAsset} onSelect={onSelect} />'
)

fs.writeFileSync(OVERVIEW_PATH, o, 'utf8')
console.log('✓ onSelect passed into LeftPanel as prop')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
