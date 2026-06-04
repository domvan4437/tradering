const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// 1. Add import
s = s.replace(
  `import DMTab from './DMTab';`,
  `import DMTab from './DMTab';\nimport LocalTradersTab from './LocalTradersTab';`
)
console.log('✓ Import added')

// 2. Add tab to TABS array
s = s.replace(
  `{ key:'dms',    label:'Messages', icon:'ti-message' },\n  ]`,
  `{ key:'dms',    label:'Messages', icon:'ti-message' },\n    { key:'local',  label:'Local Traders', icon:'ti-map-pin' },\n  ]`
)
console.log('✓ Local Traders tab added to sidebar')

// 3. Add content render
s = s.replace(
  `{tab === 'dms' && (\r\n          <div style={{ flex:1, overflow:'hidden' }}>\r\n            <DMTab />\r\n          </div>\r\n        )}`,
  `{tab === 'dms' && (\r\n          <div style={{ flex:1, overflow:'hidden' }}>\r\n            <DMTab />\r\n          </div>\r\n        )}\r\n        {tab === 'local' && (\r\n          <div style={{ flex:1, overflow:'hidden' }}>\r\n            <LocalTradersTab />\r\n          </div>\r\n        )}`
)
// LF version
s = s.replace(
  `{tab === 'dms' && (\n          <div style={{ flex:1, overflow:'hidden' }}>\n            <DMTab />\n          </div>\n        )}`,
  `{tab === 'dms' && (\n          <div style={{ flex:1, overflow:'hidden' }}>\n            <DMTab />\n          </div>\n        )}\n        {tab === 'local' && (\n          <div style={{ flex:1, overflow:'hidden' }}>\n            <LocalTradersTab />\n          </div>\n        )}`
)
console.log('✓ Local Traders content render added')

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ CommunityLayout saved')
console.log('\nAll done. Run: rd /s /q .next & npm run dev')
