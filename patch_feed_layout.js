const fs = require('fs')
let s = fs.readFileSync('components/FeedTab.js', 'utf8')

// 1. Add market pulse bar before the compose box
const OLD_COMPOSE = `      {/* Compose box */}\r\n        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>`

const NEW_COMPOSE = `      {/* Market pulse bar */}
      <div style={{ background:'var(--surface2)', borderBottom:'0.5px solid var(--border)', padding:'8px 18px', display:'flex', gap:16, alignItems:'center', overflowX:'auto', flexShrink:0 }}>
        <span style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>Live pulse</span>
        {[{l:'Gold',v:'2,340',up:true},{l:'ES',v:'5,234',up:false},{l:'EUR/USD',v:'1.084',up:false},{l:'BTC',v:'67,420',up:true},{l:'Crude',v:'78.4',up:true}].map(t=>(
          <span key={t.l} style={{ fontSize:11, flexShrink:0 }}>
            <span style={{ color:'var(--text-muted)' }}>{t.l} </span>
            <span style={{ fontWeight:500, color:t.up?'#16a34a':'#dc2626' }}>{t.v} {t.up?'▲':'▼'}</span>
          </span>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <span style={{ fontSize:10, color:'var(--text-muted)' }}>24 online</span>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a' }} />
        </div>
      </div>

      {/* Compose box */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>`

if (s.includes(OLD_COMPOSE)) {
  s = s.replace(OLD_COMPOSE, NEW_COMPOSE)
  console.log('✓ Market pulse bar added')
} else {
  // Try LF
  const OLD2 = `      {/* Compose box */}\n        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>`
  if (s.includes(OLD2)) {
    s = s.replace(OLD2, NEW_COMPOSE.replace(/\r\n/g, '\n'))
    console.log('✓ Market pulse bar added (LF)')
  } else {
    console.log('⚠ Compose box not matched')
    const i = s.indexOf('Compose box')
    console.log(JSON.stringify(s.slice(i-10, i+80)))
  }
}

// 2. Find the outer return div and change to relative so we can add floating button
s = s.replace(
  `<div style={{ display:'flex', flexDirection:'column', fontFamily:'var(--font)' }}>`,
  `<div style={{ display:'flex', flexDirection:'column', fontFamily:'var(--font)', position:'relative' }}>`
)
console.log('✓ Outer div set to relative')

// 3. Add floating "New post" button at the end, before the closing div
// Find the last </div> of the component
const lastDiv = s.lastIndexOf('  );\r\n}')
if (lastDiv === -1) {
  const lastDiv2 = s.lastIndexOf('  );\n}')
  if (lastDiv2 > -1) {
    const FLOAT_BTN = `\n      {/* Floating post button */}
      <div style={{ position:'sticky', bottom:16, display:'flex', justifyContent:'flex-end', padding:'0 18px', pointerEvents:'none' }}>
        <button onClick={() => document.querySelector('textarea')?.focus()} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#4B44C8', color:'#fff', border:'none', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)', pointerEvents:'all', boxShadow:'0 2px 12px rgba(75,68,200,0.35)' }}>
          <span style={{ fontSize:18, lineHeight:1 }}>+</span> New post
        </button>
      </div>\n`
    s = s.slice(0, lastDiv2) + FLOAT_BTN + s.slice(lastDiv2)
    console.log('✓ Floating post button added (LF)')
  } else {
    console.log('⚠ Could not find closing of component')
  }
} else {
  const FLOAT_BTN = `\r\n      {/* Floating post button */}\r\n      <div style={{ position:'sticky', bottom:16, display:'flex', justifyContent:'flex-end', padding:'0 18px', pointerEvents:'none' }}>\r\n        <button onClick={() => document.querySelector('textarea')?.focus()} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 20px', background:'#4B44C8', color:'#fff', border:'none', borderRadius:20, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)', pointerEvents:'all', boxShadow:'0 2px 12px rgba(75,68,200,0.35)' }}>\r\n          <span style={{ fontSize:18, lineHeight:1 }}>+</span> New post\r\n        </button>\r\n      </div>\r\n`
  s = s.slice(0, lastDiv) + FLOAT_BTN + s.slice(lastDiv)
  console.log('✓ Floating post button added (CRLF)')
}

fs.writeFileSync('components/FeedTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
