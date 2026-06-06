const fs = require('fs')
let s = fs.readFileSync('components/CommodityScreener.js', 'utf8')

s = s.replace(
  `section==='compete' ? (\r\n          <CompeteLayout currentUserId={session?.user?.id} externalTab={tab} />`,
  `section==='compete' ? (\r\n          <div style={{height:'calc(100vh - 82px)', overflow:'hidden', display:'flex', flexDirection:'column'}}><CompeteLayout currentUserId={session?.user?.id} externalTab={tab} /></div>`
)

// try LF version
s = s.replace(
  `section==='compete' ? (\n          <CompeteLayout currentUserId={session?.user?.id} externalTab={tab} />`,
  `section==='compete' ? (\n          <div style={{height:'calc(100vh - 82px)', overflow:'hidden', display:'flex', flexDirection:'column'}}><CompeteLayout currentUserId={session?.user?.id} externalTab={tab} /></div>`
)

// Fix CompeteLayout to fill its container
let cl = fs.readFileSync('components/CompeteLayout.js', 'utf8')
cl = cl.replace(
  `<div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>`,
  `<div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>`
)
// if not matched try original
cl = cl.replace(
  `<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>`,
  `<div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>`
)
fs.writeFileSync('components/CompeteLayout.js', cl, 'utf8')
console.log('✓ CompeteLayout fixed')

// Fix CompeteTab outer wrapper and content scroll
let ct = fs.readFileSync('components/CompeteTab.js', 'utf8')
ct = ct.replace(
  `<div style={{ display:'flex', fontFamily:'var(--font,system-ui)', flex:1 }}>`,
  `<div style={{ display:'flex', fontFamily:'var(--font,system-ui)', flex:1, height:'100%', overflow:'hidden' }}>`
)
ct = ct.replace(
  `<div style={{ display:'flex', minHeight:'100%', fontFamily:'var(--font,system-ui)' }}>`,
  `<div style={{ display:'flex', fontFamily:'var(--font,system-ui)', flex:1, height:'100%', overflow:'hidden' }}>`
)
// Make sidebar full height
ct = ct.replace(
  `alignSelf:'stretch'`,
  `alignSelf:'stretch', overflowY:'auto'`
)
ct = ct.replace(
  `position:'sticky', top:82, alignSelf:'flex-start'`,
  `alignSelf:'stretch', overflowY:'auto'`
)
// Make content area scrollable
ct = ct.replace(
  `<div style={{ flex:1, padding:'16px 20px', overflowY:'auto' }}>`,
  `<div style={{ flex:1, padding:'16px 20px', overflowY:'auto', height:'100%' }}>`
)
ct = ct.replace(
  `<div style={{ flex:1, padding:'16px 20px', minHeight:0 }}>`,
  `<div style={{ flex:1, padding:'16px 20px', overflowY:'auto', height:'100%' }}>`
)
fs.writeFileSync('components/CompeteTab.js', ct, 'utf8')
console.log('✓ CompeteTab fixed')

fs.writeFileSync('components/CommodityScreener.js', s, 'utf8')
console.log('✓ CommodityScreener fixed')
console.log('\nRun: rd /s /q .next & npm run dev')
