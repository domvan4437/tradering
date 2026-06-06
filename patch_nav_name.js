const fs = require('fs')
let s = fs.readFileSync('components/CommodityScreener.js', 'utf8')

// Fix the avatar initial - use name first letter, fallback to email
s = s.replace(
  `{(session?.user?.email?.charAt(0)||'U').toUpperCase()}`,
  `{(userInfo?.name?.charAt(0)||session?.user?.name?.charAt(0)||session?.user?.email?.charAt(0)||'U').toUpperCase()}`
)

// Fix the displayed name - use actual name, fallback to email prefix
s = s.replace(
  `{session?.user?.email?.split('@')[0]||'Account'} ▾`,
  `{userInfo?.name||session?.user?.name||session?.user?.email?.split('@')[0]||'Account'} ▾`
)

console.log('✓ Nav now shows real name')
fs.writeFileSync('components/CommodityScreener.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
