const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// Replace the entire account section render with just AccountTab
s = s.replace(
  `section==='account' ? (\r\n          <div style={{padding:'20px 24px'}}>\r\n            {!tab && <AccountLanding onSelect={t=>setTab(t)} onViewProfile={()=>{ const slug = userInfo?.profileSlug || userInfo?.id; if(slug) setViewingProfile(slug); }} />}\r\n            <div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>\r\n          </div>\r\n        )`,
  `section==='account' ? (\r\n          <div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>\r\n        )`
)

if (s.includes(`<div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>`)) {
  console.log('✓ AccountLanding removed, AccountTab renders cleanly')
} else {
  // try without \r
  s = s.replace(
    /section==='account' \? \(\s*<div style=\{\{padding:'20px 24px'\}\}>\s*\{!tab &&[\s\S]*?<\/div>\s*\)/,
    `section==='account' ? (\n          <div style={{ marginTop: 82 }}><AccountTab user={userInfo} /></div>\n        )`
  )
  console.log('✓ Fixed via regex')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
