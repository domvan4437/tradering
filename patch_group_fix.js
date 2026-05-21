const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// 1. Replace the + button with a properly wrapped version that includes the menu
const OLD_BTN = `        <button onClick={() => setShowGroupMenu(m=>!m)} title="Add group" style={{ position:'relative', width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>`

const NEW_BTN = `        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={() => setShowGroupMenu(m=>!m)} title="Add group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>
          {showGroupMenu && (
            <div style={{ position:'fixed', top:'auto', bottom:0, left:0, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', transform:'translateY(-100px) translateX(60px)' }}>
              <button onClick={() => { setShowCreate(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <i className="ti ti-plus" style={{fontSize:15,color:'#4B44C8'}} aria-hidden="true"/> Create group
              </button>
              <button onClick={() => { setShowBrowse(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <i className="ti ti-search" style={{fontSize:15,color:'#059669'}} aria-hidden="true"/> Browse groups
              </button>
            </div>
          )}
        </div>`

if (s.includes(OLD_BTN)) {
  s = s.replace(OLD_BTN, NEW_BTN)
  console.log('✓ + button fixed with menu')
} else {
  console.log('⚠ + button not matched')
  const i = s.indexOf('setShowGroupMenu(m=>!m)')
  console.log(JSON.stringify(s.slice(i-20, i+100)))
}

// 2. Fix ROOMS header - make it flex row so settings icon aligns right
// Find the rooms header and fix it
const OLD_ROOMS_HDR = `ransform:'uppercase' }}>Rooms</div>\r\n            <button title="Manage rooms" style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.color='#4B44C8'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-settings" style={{fontSize:14}} aria-hidden="true"/></button>`

// Replace with a proper flex container
if (s.includes(OLD_ROOMS_HDR)) {
  s = s.replace(OLD_ROOMS_HDR, `ransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>Rooms<button title="Manage rooms" onClick={()=>alert('Manage rooms coming soon')} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', borderRadius:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.color='#4B44C8'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-settings" style={{fontSize:14}} aria-hidden="true"/></button></div>`)
  console.log('✓ Rooms header fixed')
} else {
  // Check what's there now
  const i = s.indexOf('Rooms</div>')
  if (i > -1) {
    console.log('Found Rooms header at:', i)
    console.log(JSON.stringify(s.slice(i-100, i+200)))
  } else {
    console.log('⚠ Rooms header not found')
  }
}

// 3. Fix MEMBERS header similarly
const membersIdx = s.indexOf('>Members<button')
if (membersIdx > -1) {
  console.log('✓ Members header already has button')
} else {
  console.log('ℹ Members button not present - may need separate fix')
}

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
