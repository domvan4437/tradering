const fs = require('fs')
let s = fs.readFileSync('components/AccountTab.js', 'utf8')

// 1. Default publicLocation to true
s = s.replace(
  `publicLocation: profile.publicLocation || false,`,
  `publicLocation: profile.publicLocation !== false,`
)
console.log('✓ publicLocation defaults to true')

// 2. Add instagram to form state
s = s.replace(
  `website: profile.website || '',`,
  `website: profile.website || '',\n    instagram: profile.instagram || '',`
)
console.log('✓ Instagram added to form state')

// 3. Add instagram to links section
s = s.replace(
  `{ key:'tradingview', label:'TradingView', placeholder:'tradingview.com/u/yourhandle' },\n            { key:'twitter', label:'Twitter / X', placeholder:'@yourhandle' },\n            { key:'youtube', label:'YouTube', placeholder:'youtube.com/@yourchannel' },\n            { key:'website', label:'Website', placeholder:'yourwebsite.com' },`,
  `{ key:'tradingview', label:'TradingView', placeholder:'tradingview.com/u/yourhandle' },\n            { key:'twitter', label:'Twitter / X', placeholder:'@yourhandle' },\n            { key:'instagram', label:'Instagram', placeholder:'@yourhandle' },\n            { key:'youtube', label:'YouTube', placeholder:'youtube.com/@yourchannel' },\n            { key:'website', label:'Website', placeholder:'yourwebsite.com' },`
)
console.log('✓ Instagram added to links section')

fs.writeFileSync('components/AccountTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
