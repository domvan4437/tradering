const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

s = s.replace(
  `TAB_MAP = { 'Feed':'feed', 'Groups':'groups', 'Messages':'dms', 'feed':'feed', 'groups':'groups', 'dms':'dms' };`,
  `TAB_MAP = { 'Feed':'feed', 'Groups':'groups', 'Messages':'dms', 'Local Traders':'local', 'feed':'feed', 'groups':'groups', 'dms':'dms', 'local':'local' };`
)

console.log('✓ Local Traders added to TAB_MAP')
fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
