const fs = require('fs')
let s = fs.readFileSync('components/CommodityScreener.js', 'utf8')

s = s.replace(
  `community:   ['Feed','Groups','Messages'],`,
  `community:   ['Feed','Groups','Messages','Local Traders'],`
)

console.log('✓ Local Traders added to community dropdown')
fs.writeFileSync('components/CommodityScreener.js', s, 'utf8')
console.log('\nRun: rd /s /q .next & npm run dev')
