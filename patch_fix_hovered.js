const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// Replace setHovered(null) with setHoveredNav(null) or just remove it
// The nav uses setHovered or similar — let's just remove the call entirely
s = s.replace(/; setHovered\(null\);/g, ';')
s = s.replace(/setHovered\(null\)/g, '')

// Also try the variant with space
s = s.replace(/; setHovered\(null\) /g, ' ')

if (!s.includes('setHovered(null)')) {
  console.log('✓ setHovered(null) removed from nav dropdown')
} else {
  console.log('⚠ Still present — checking what remains')
  const i = s.indexOf('setHovered(null)')
  console.log(JSON.stringify(s.slice(i - 30, i + 50)))
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
