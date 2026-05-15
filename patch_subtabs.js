const fs = require('fs')
const path = require('path')
const FILE = path.join('C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components', 'CommodityScreener.js')
let s = fs.readFileSync(FILE, 'utf8')

const fixed = s.replace(
  /subTabs\.length > 0 && \(/,
  `subTabs.length > 0 && section !== 'stocks' && (`
)

if (fixed !== s) {
  fs.writeFileSync(FILE, fixed, 'utf8')
  console.log('✓ Stocks subtab bar hidden')
} else {
  console.warn('⚠ Still not matched')
}
console.log('Done. Run: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
