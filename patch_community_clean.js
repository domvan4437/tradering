const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Step 1: Add React import if needed
if (!c.includes('import React') && !c.includes("import { useState")) {
  c = c.replace("'use client'", "'use client'\nimport React from 'react'")
} else if (!c.includes('import React')) {
  c = c.replace("import { useState", "import React, { useState")
}

// Step 2: Add CommSidebar component before export default
const SIDEBAR_COMP = `function CommSidebar({ tab, setTab }) {
  const [open, setOpen] = React.useState(false)
  const [pinned, setPinned] = React.useState(false)
  const isOpen = open || pinned
  const timer = React.useRef(null)
  const TABS = [
    { key:'feed',   label:'Feed',     icon:'ti-home' },
    { key:'groups', label:'Groups',   icon:'ti-users' },
    { key:'dms',    label:'Messages', icon:'ti-message' },
  ]
  return (
    <div
      onMouseEnter={() => { clearTimeout(timer.current); setOpen(true) }}
      onMouseLeave={() => { timer.current = setTimeout(() => { if(!pinned) setOpen(false) }, 180) }}
      style={{ width:isOpen?188:54, minWidth:isOpen?188:54, background:'var(--surface2)', borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', paddingTop:92, transition:'width 0.18s ease, min-width 0.18s ease', overflow:'hidden', flexShrink:0, zIndex:20, position:'sticky', top:82, height:'calc(100vh - 82px)' }}>
      <div onClick={() => setPinned(p=>!p)} style={{ width:42, height:38, background:'#4B44C8', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, marginBottom:8 }}>
        <i className="ti ti-menu-2" style={{ fontSize:20, color:'#fff' }} aria-hidden="true" />
      </div>
      {TABS.map(t => {
        const isActive = tab === t.key
        return (
          <button key={t.key} onClick={(e)=>{e.stopPropagation();setTab(t.key);}}
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

c = c.replace('export default function CommunityLayout', SIDEBAR_COMP + 'export default function CommunityLayout')
console.log('✓ CommSidebar component added')

// Step 3: Change outer div from column to row
c = c.replace(
  "display:'flex', flexDirection:'column', fontFamily:'var(--font)'",
  "display:'flex', flexDirection:'row', fontFamily:'var(--font)'"
)
console.log('✓ Outer div changed to row')

// Step 4: Replace the purple nav bar (lines 495-505) with sidebar + content wrapper
// The nav starts with: <div style={{ background:PURPLE, padding:'0 20px'...
// and ends with:       </div>  (line 505)
// Then we need to inject: <CommSidebar /> + <div flex:1 column>

const OLD_NAV = `      <div style={{ background:PURPLE, padding:'0 20px', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0, position:'sticky', top:82, zIndex:299, pointerEvents:'all' }}>\r\n        <div style={{ display:'flex', gap:0 }}>\r\n          {[['feed','Feed'],['groups','Groups'],['dms','Messages']].map(([t,l]) => (\r\n            <button key={t} onClick={(e) => { e.stopPropagation(); setTab(t); }} style={{ padding:'11px 20px', background:'none', border:'none', borderBottom:tab===t?'2px solid #fff':'2px solid transparent', color:tab===t?'#fff':'rgba(255,255,255,0.6)', fontFamily:'var(--font)', fontSize:13, fontWeight:tab===t?600:400, cursor:'pointer', transition:'all 0.15s', marginBottom:-1 }}>{l}</button>\r\n          ))}\r\n        </div>\r\n        <div style={{ display:'flex', alignItems:'center', gap:14, color:'rgba(255,255,255,0.7)' }}>\r\n          {tab === 'feed' && <UserSearch />}\r\n          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor:'pointer', flexShrink:0 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>\r\n        </div>\r\n      </div>`

const NEW_NAV = `      <CommSidebar tab={tab} setTab={(t)=>setTab(t)} />\r\n      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>`

if (c.includes(OLD_NAV)) {
  c = c.replace(OLD_NAV, NEW_NAV)
  console.log('✓ Old nav replaced with sidebar (exact match)')
} else {
  // Try finding by unique substring
  const navIdx = c.indexOf("background:PURPLE, padding:'0 20px'")
  if (navIdx > -1) {
    const divStart = c.lastIndexOf('<div', navIdx)
    let depth = 0, p = divStart
    while (p < c.length) {
      if (c.slice(p,p+4) === '<div') depth++
      else if (c.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
      p++
    }
    // Also remove trailing \r\n
    if (c.slice(p, p+2) === '\r\n') p+=2
    c = c.slice(0, divStart) + NEW_NAV + '\r\n' + c.slice(p)
    console.log('✓ Old nav replaced (depth match)')
  } else {
    console.log('⚠ Nav not found')
  }
}

// Step 5: Close the inner content div before the outer closing div
// The outer return closing is:    </div>\r\n  );\r\n}
// We need:  </div>\r\n    </div>\r\n  );\r\n}  (extra close for inner content div)
const OLD_CLOSE = "      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\nfunction RightSidebar"
const NEW_CLOSE = "      </div>\r\n      </div>\r\n    </div>\r\n  );\r\n}\r\n\r\nfunction RightSidebar"

if (c.includes(OLD_CLOSE)) {
  c = c.replace(OLD_CLOSE, NEW_CLOSE)
  console.log('✓ Inner content div closed (CRLF)')
} else {
  const OLD_CLOSE2 = "      </div>\n    </div>\n  );\n}\n\nfunction RightSidebar"
  const NEW_CLOSE2 = "      </div>\n      </div>\n    </div>\n  );\n}\n\nfunction RightSidebar"
  if (c.includes(OLD_CLOSE2)) {
    c = c.replace(OLD_CLOSE2, NEW_CLOSE2)
    console.log('✓ Inner content div closed (LF)')
  } else {
    console.log('⚠ Close pattern not found')
    const i = c.indexOf('function RightSidebar')
    console.log('Before RightSidebar:', JSON.stringify(c.slice(i-100, i)))
  }
}

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
