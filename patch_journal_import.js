const fs = require('fs')

// The actual file is still TradeRingJournal.js - just fix the import reference
let s = fs.readFileSync('components/CommodityScreener.js', 'utf8')
s = s.replace(`import TradeZarJournal from './TradeZarJournal'`, `import TradeZarJournal from './TradeRingJournal'`)
fs.writeFileSync('components/CommodityScreener.js', s, 'utf8')
console.log('✓ Fixed import reference')

// Also check other files that may reference TradeZarJournal
const files = fs.readdirSync('components')
files.forEach(f => {
  if (!f.endsWith('.js')) return
  try {
    let s = fs.readFileSync('components/'+f, 'utf8')
    if (s.includes('TradeZarJournal') && !f.includes('TradeRing')) {
      s = s.replace(/TradeZarJournal/g, 'TradeRingJournal')
      fs.writeFileSync('components/'+f, s, 'utf8')
      console.log('✓ Fixed in', f)
    }
  } catch {}
})

console.log('\nRun: rd /s /q .next & npm run dev')
