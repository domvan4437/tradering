const fs = require('fs')

// ── COMPETE ───────────────────────────────────────────────────────────────────
let comp = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Add React import
if (!comp.includes('import React')) {
  comp = comp.replace(
    "'use client';\r\nimport { useState",
    "'use client';\r\nimport React, { useState"
  )
  comp = comp.replace(
    "'use client';\nimport { useState",
    "'use client';\nimport React, { useState"
  )
}

// Add useRef to import if not there
if (!comp.includes('useRef')) {
  comp = comp.replace('useState, useEffect }', 'useState, useEffect, useRef }')
  comp = comp.replace('useState }', 'useState, useRef }')
}

// Add CompeteSidebar component before export default
const COMPETE_SIDEBAR = `
function CompeteSidebar({ tab, setTab }) {
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const isOpen = open || pinned
  const timer = useRef(null)
  const TABS = [
    { key:'compete',     label:'Home',           icon:'ti-home' },
    { key:'h2h',         label:'H2H',            icon:'ti-sword' },
    { key:'groups',      label:'Group Contests',  icon:'ti-users' },
    { key:'leaderboard', label:'Leaderboard',     icon:'ti-trophy' },
    { key:'history',     label:'History',         icon:'ti-history' },
  ]
  return (
    <div
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true) }}
      onMouseLeave={() => { timer.current = setTimeout(() => { if(!pinned) setOpen(false) }, 180) }}
      style={{ width:isOpen?200:54, minWidth:isOpen?200:54, background:'var(--surface2)', borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', paddingTop:92, transition:'width 0.18s ease, min-width 0.18s ease', overflow:'hidden', flexShrink:0, zIndex:20, position:'sticky', top:82, height:'calc(100vh - 82px)' }}>
      <div onClick={() => setPinned(p=>!p)} style={{ width:42, height:38, background:'#4B44C8', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginBottom:8 }}>
        <i className="ti ti-menu-2" style={{ fontSize:20, color:'#fff' }} aria-hidden="true" />
      </div>
      {TABS.map(t => {
        const isActive = tab === t.key
        return (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:isOpen?8:0, padding:'8px', borderRadius:8, background:isActive?'rgba(75,68,200,0.1)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:isOpen?'100%':42, justifyContent:isOpen?'flex-start':'center', position:'relative', flexShrink:0 }}>
            {isActive && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:22, background:'#4B44C8', borderRadius:'0 3px 3px 0' }} />}
            <i className={\`ti \${t.icon}\`} style={{ fontSize:19, color:isActive?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
            {isOpen && <span style={{ fontSize:12, color:isActive?'#3C3489':'var(--text-muted)', fontWeight:isActive?500:400, whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
        )
      })}
    </div>
  )
}

`

comp = comp.replace('export default function CompeteTab', COMPETE_SIDEBAR + 'export default function CompeteTab')
console.log('✓ CompeteSidebar added')

// Replace the return structure - change column to row, remove old nav, add sidebar
const OLD_COMPETE_RETURN = `  return (\r\n    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)' }}>\r\n      <div style={{ background: PURPLE, padding: '0 20px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 82, zIndex: 299 }}>\r\n        <div style={{ display: 'flex', gap: 0 }}>\r\n          {navTabs.map(({ key, label }) => (\r\n            <button key={key} onClick={() => setTab(key)}\r\n              style={{ padding: '11px 18px', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #fff' : '2px solid transparent', color: '#fff', opacity: tab === key ? 1 : 0.75, fontFamily: 'var(--font)', fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1 }}>\r\n              {label}\r\n            </button>\r\n          ))}\r\n        </div>\r\n        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>\r\n          <button onClick={() => setTab('groups')} style={{ padding: '5px 12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>Browse challenges</button>\r\n          <button onClick={() => setTab('h2h')} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>+ Challenge trader</button>\r\n        </div>\r\n      </div>\r\n\r\n      <div style={{ padding: '16px 20px', paddingTop: 60 }}>`

const NEW_COMPETE_RETURN = `  return (\r\n    <div style={{ display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)' }}>\r\n      <CompeteSidebar tab={tab} setTab={setTab} />\r\n      <div style={{ flex:1, padding: '16px 20px', paddingTop: 92, overflowY:'auto' }}>`

if (comp.includes(OLD_COMPETE_RETURN)) {
  comp = comp.replace(OLD_COMPETE_RETURN, NEW_COMPETE_RETURN)
  console.log('✓ Compete return replaced (exact)')
} else {
  console.log('⚠ Exact match failed, trying partial...')
  // Find and replace just the outer div + nav
  comp = comp.replace(
    "display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)'",
    "display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)'"
  )
  const navStart = comp.indexOf("background: PURPLE, padding: '0 20px'")
  if (navStart > -1) {
    const divStart = comp.lastIndexOf('<div', navStart)
    let depth = 0, p = divStart
    while (p < comp.length) {
      if (comp.slice(p,p+4) === '<div') depth++
      else if (comp.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
      p++
    }
    // Also skip blank line after nav
    if (comp.slice(p,p+2)==='\r\n') p+=2
    comp = comp.slice(0, divStart) +
      `<CompeteSidebar tab={tab} setTab={setTab} />\r\n      <div style={{ flex:1, padding: '16px 20px', paddingTop: 16, overflowY:'auto' }}>` +
      comp.slice(p)
    console.log('✓ Compete nav replaced (depth match)')
  }
}

// Close the inner content div before outer close
const OLD_COMP_CLOSE = "      </div>\r\n    </div>\r\n  );\r\n}"
const NEW_COMP_CLOSE = "      </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}"
if (comp.includes(OLD_COMP_CLOSE)) {
  comp = comp.replace(OLD_COMP_CLOSE, NEW_COMP_CLOSE)
  console.log('✓ Compete inner div closed')
} else {
  console.log('⚠ Compete close not found')
}

fs.writeFileSync('components/CompeteTab.js', comp, 'utf8')
console.log('✓ CompeteTab saved')

// ── COMMUNITY — fix the icon visibility ──────────────────────────────────────
let comm = fs.readFileSync('components/CommunityLayout.js', 'utf8')
console.log('\nCommunity has CommSidebar:', comm.includes('CommSidebar'))
console.log('Community has old nav:', comm.includes("background:PURPLE, padding:'0 20px'"))

fs.writeFileSync('components/CommunityLayout.js', comm, 'utf8')

console.log('\n✅ Done. Run: rd /s /q .next & npm run dev')
