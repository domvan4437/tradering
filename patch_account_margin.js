const fs = require('fs')
let s = fs.readFileSync('components/CommodityScreener.js', 'utf8')

s = s.replace(
  `<div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>`,
  `<div><AccountTab user={userInfo} /></div>`
)

console.log('✓ marginTop removed from AccountTab wrapper')
fs.writeFileSync('components/CommodityScreener.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
