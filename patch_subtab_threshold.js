const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// Change subTabs.length > 0 to subTabs.length > 1
s = s.replace(
  /subTabs\.length > 0 && section !== 'stocks'/,
  `subTabs.length > 1 && section !== 'stocks'`
)

if (s.includes('subTabs.length > 1')) {
  console.log('✓ Subtab bar now only shows when 2+ tabs exist')
} else {
  console.warn('⚠ Not matched')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
