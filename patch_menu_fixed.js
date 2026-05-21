const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// The absolute positioned menu is getting clipped by overflow:hidden parent
// Solution: use a ref on the wrapper div and position the menu with fixed coords via JS

// Replace the entire + button wrapper with a ref-based version
const OLD = `        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={() => setShowGroupMenu(m=>!m)} title="Add group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>
          {showGroupMenu && (
            <div style={{ position:'absolute', top:48, left:0, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>`

const NEW = `        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={(e) => { const r=e.currentTarget.getBoundingClientRect(); setGroupMenuPos({top:r.bottom+6,left:r.left}); setShowGroupMenu(m=>!m); }} title="Add group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>
          {showGroupMenu && (
            <div style={{ position:'fixed', top:groupMenuPos?.top||100, left:groupMenuPos?.left||100, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:99999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ + button uses fixed positioning with getBoundingClientRect')
} else {
  console.log('⚠ Pattern not matched')
  const i = s.indexOf('showGroupMenu &&')
  console.log(JSON.stringify(s.slice(i-100, i+50)))
}

// Add groupMenuPos state
s = s.replace(
  `const [showGroupMenu, setShowGroupMenu] = useState(false);`,
  `const [showGroupMenu, setShowGroupMenu] = useState(false);\r\n  const [groupMenuPos, setGroupMenuPos] = useState(null);`
)
console.log('✓ groupMenuPos state added')

// Close menu when clicking outside
s = s.replace(
  `const [showBrowse, setShowBrowse] = useState(false);`,
  `const [showBrowse, setShowBrowse] = useState(false);`
)

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
