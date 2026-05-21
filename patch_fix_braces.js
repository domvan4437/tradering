const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Fix the double {{ before showBrowse
s = s.replace(
  `      {{showBrowse && (`,
  `      {showBrowse && (`
)

// Fix missing { before showManageRooms
s = s.replace(
  `      )}\n      showManageRooms && (`,
  `      )}\n      {showManageRooms && (`
)
s = s.replace(
  `      )}\r\n      showManageRooms && (`,
  `      )}\r\n      {showManageRooms && (`
)

console.log('Fixed showBrowse:', s.includes('{showBrowse && ('))
console.log('Fixed showManageRooms:', s.includes('{showManageRooms && ('))

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
