const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Fix outer container - remove height:100% and use minHeight instead
s = s.replace(
  `<div style={{ display:'flex', height:'100%', fontFamily:'var(--font,system-ui)' }}>`,
  `<div style={{ display:'flex', minHeight:'100%', fontFamily:'var(--font,system-ui)' }}>`
)

// Fix sidebar - should stretch full height
s = s.replace(
  `<div style={{ width:52, background:'var(--surface,#fff)', borderRight:'0.5px solid var(--border,#e5e7eb)', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, gap:4, flexShrink:0 }}>`,
  `<div style={{ width:52, background:'var(--surface,#fff)', borderRight:'0.5px solid var(--border,#e5e7eb)', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:12, gap:4, flexShrink:0, minHeight:'calc(100vh - 82px)', position:'sticky', top:82, alignSelf:'flex-start' }}>`
)

// Fix content area - remove overflowY auto so page scrolls naturally
s = s.replace(
  `<div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>`,
  `<div style={{ flex:1, padding:'16px 20px', minHeight:0 }}>`
)

console.log('✓ Fixed compete tab height/scroll')
fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
