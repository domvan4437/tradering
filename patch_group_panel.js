const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// 1. Change + button from direct setShowCreate to show a mini menu
const OLD_PLUS = `<button onClick={() => setShowCreate(true)} title="Create group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'p`

const NEW_PLUS = `<button onClick={() => setShowGroupMenu(m=>!m)} title="Add group" style={{ position:'relative', width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'p`

if (s.includes(OLD_PLUS)) {
  s = s.replace(OLD_PLUS, NEW_PLUS)
  console.log('✓ + button updated')
} else {
  console.log('⚠ + button not matched')
}

// Add showGroupMenu state — find existing useState declarations for this component
s = s.replace(
  `const [showCreate, setShowCreate] = useState(false);`,
  `const [showCreate, setShowCreate] = useState(false);\r\n  const [showGroupMenu, setShowGroupMenu] = useState(false);\r\n  const [showBrowse, setShowBrowse] = useState(false);`
)
console.log('✓ showGroupMenu state added')

// Add the group menu popup after the + button closing tag
// Find the end of the + button
const plusEnd = s.indexOf("justifyContent:'center', cursor:'pointer' }}>")
if (plusEnd > -1) {
  const tagClose = s.indexOf('</button>', plusEnd) + 9
  const menuHTML = `\r\n        {showGroupMenu && (\r\n          <div style={{ position:'absolute', top:48, left:0, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>\r\n            <button onClick={() => { setShowCreate(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer', textAlign:'left' }}\r\n              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>\r\n              <i className="ti ti-plus" style={{fontSize:15,color:'#4B44C8'}} aria-hidden="true"/> Create group\r\n            </button>\r\n            <button onClick={() => { setShowBrowse(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer', textAlign:'left' }}\r\n              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>\r\n              <i className="ti ti-search" style={{fontSize:15,color:'#059669'}} aria-hidden="true"/> Browse groups\r\n            </button>\r\n          </div>\r\n        )}`
  
  // Find the nearest parent with position:relative to anchor the menu
  // Instead wrap the + button in a position:relative div
  const buttonStart = s.lastIndexOf('<button onClick={() => setShowGroupMenu', tagClose)
  const wrapStart = s.lastIndexOf('\n        ', buttonStart) + 1
  s = s.slice(0, wrapStart) + 
    `        <div style={{position:'relative'}}>\r\n` +
    s.slice(wrapStart, tagClose) +
    menuHTML + 
    `\r\n        </div>` +
    s.slice(tagClose)
  console.log('✓ Group menu popup added')
}

// 2. Add manage rooms button next to ROOMS header
s = s.replace(
  `ransform:'uppercase' }}>Rooms</div>`,
  `ransform:'uppercase' }}>Rooms</div>\r\n            <button title="Manage rooms" style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.color='#4B44C8'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-settings" style={{fontSize:14}} aria-hidden="true"/></button>`
)
console.log('✓ Manage rooms button added')

// Fix the ROOMS section header to be flex so button aligns right
s = s.replace(
  `fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase' }}>Rooms</div>`,
  `fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', display:'flex', alignItems:'center', width:'100%' }}>Rooms`
)

// 3. Add edit members button next to MEMBERS header
s = s.replace(
  `fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginTop:14 }}>Members</`,
  `fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginTop:14, display:'flex', alignItems:'center', width:'100%' }}>Members<button title="Edit members" style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.color='#4B44C8'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-user-plus" style={{fontSize:14}} aria-hidden="true"/></button></`
)
console.log('✓ Edit members button added')

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
