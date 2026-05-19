const fs = require('fs')

// ── 1. TOOLS AUTO-REDIRECT ────────────────────────────────────────────────────
let cs = fs.readFileSync('components/CommodityScreener.js', 'utf8')
if (cs.includes('{!tab && <ToolsLanding2 onSelect={t=>setTab(t)} />}')) {
  cs = cs.replace(
    '{!tab && <ToolsLanding2 onSelect={t=>setTab(t)} />}',
    `{!tab && (() => { setTimeout(() => setTab('Journal'), 0); return null; })()}`
  )
  console.log('✓ Tools auto-redirects to Journal')
} else {
  console.log('⚠ Tools redirect not matched')
}
fs.writeFileSync('components/CommodityScreener.js', cs, 'utf8')

// ── 2. COMMUNITY sidebar ──────────────────────────────────────────────────────
let comm = fs.readFileSync('components/CommunityLayout.js', 'utf8')

const COMM_SIDEBAR = `
      {/* ── SIDEBAR ── */}
      <CommSidebar tab={tab} setTab={(t)=>{e=>e.stopPropagation();setTab(t);}} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>`

// The sidebar component to prepend before the export
const COMM_SIDEBAR_COMPONENT = `
function CommSidebar({ tab, setTab }) {
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
      style={{ width:isOpen?188:54, minWidth:isOpen?188:54, background:'var(--surface2)', borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', paddingTop:92, transition:'width 0.18s ease, min-width 0.18s ease', overflow:'hidden', flexShrink:0, zIndex:20 }}>
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

// Add React import if needed
if (!comm.includes("import React") && !comm.includes("import { useState")) {
  comm = comm.replace("'use client'", "'use client'\nimport React from 'react'")
}
if (!comm.includes('import React')) {
  comm = comm.replace("import { useState", "import React, { useState")
}

// Inject CommSidebar component before the export default
const exportIdx = comm.indexOf('export default function')
if (exportIdx > -1) {
  comm = comm.slice(0, exportIdx) + COMM_SIDEBAR_COMPONENT + comm.slice(exportIdx)
  console.log('✓ CommSidebar component added')
}

// Find the outer return div and change it to flex row, then inject sidebar
// Replace the old purple horizontal nav
const OLD_COMM_NAV_START = '{/*  nav */}'
const oldNavIdx = comm.indexOf(OLD_COMM_NAV_START)
if (oldNavIdx > -1) {
  // Find the closing </div> of the nav container
  let depth = 0, p = comm.indexOf('<div', oldNavIdx)
  while (p < comm.length) {
    if (comm.slice(p,p+4) === '<div') depth++
    else if (comm.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  comm = comm.slice(0, oldNavIdx) + comm.slice(p)
  console.log('✓ Old community horizontal nav removed')
} else {
  console.log('⚠ Community nav comment not found')
}

// Change outer div to flex row and inject sidebar
comm = comm.replace(
  "display:'flex', flexDirection:'column', fontFamily:'var(--font)'",
  "display:'flex', flexDirection:'row', fontFamily:'var(--font)'"
)

// After the opening div tag, inject the sidebar
const outerOpenEnd = comm.indexOf("display:'flex', flexDirection:'row', fontFamily:'var(--font)'")
const tagEnd = comm.indexOf('>', outerOpenEnd) + 1
comm = comm.slice(0, tagEnd) + `\n      <CommSidebar tab={tab} setTab={(t)=>setTab(t)} />\n      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>` + comm.slice(tagEnd)

// Close the inner div before the last outer close
const lastClose = comm.lastIndexOf('</div>')
comm = comm.slice(0, lastClose) + '      </div>\n    </div>\n  )\n}\n'

fs.writeFileSync('components/CommunityLayout.js', comm, 'utf8')
console.log('✓ CommunityLayout saved')

// ── 3. COMPETE sidebar ────────────────────────────────────────────────────────
let comp = fs.readFileSync('components/CompeteTab.js', 'utf8')

const COMPETE_SIDEBAR_COMPONENT = `
function CompeteSidebar({ tab, setTab }) {
  const [open, setOpen] = React.useState(false)
  const [pinned, setPinned] = React.useState(false)
  const isOpen = open || pinned
  const timer = React.useRef(null)
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
      style={{ width:isOpen?188:54, minWidth:isOpen?188:54, background:'var(--surface2)', borderRight:'0.5px solid var(--border)', display:'flex', flexDirection:'column', alignItems:'center', gap:4, padding:'10px 6px', paddingTop:92, transition:'width 0.18s ease, min-width 0.18s ease', overflow:'hidden', flexShrink:0, zIndex:20 }}>
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

// Add React if needed
if (!comp.includes('import React') && !comp.includes("import { useState")) {
  comp = comp.replace("'use client';", "'use client';\nimport React from 'react';")
}

// Inject CompeteSidebar before export default
const compExportIdx = comp.indexOf('export default function')
if (compExportIdx > -1) {
  comp = comp.slice(0, compExportIdx) + COMPETE_SIDEBAR_COMPONENT + comp.slice(compExportIdx)
  console.log('✓ CompeteSidebar component added')
}

// Find the old horizontal nav and remove it
// It starts with: <div style={{ background: PURPLE, padding: '0 20px'...
const OLD_COMPETE_NAV = `style={{ background: PURPLE, padding: '0 20px', position: 'sticky', top: 82, zIndex: 299 }}`
const compNavIdx = comp.indexOf(OLD_COMPETE_NAV)
if (compNavIdx > -1) {
  const divStart = comp.lastIndexOf('<div', compNavIdx)
  let depth = 0, p = divStart
  while (p < comp.length) {
    if (comp.slice(p,p+4) === '<div') depth++
    else if (comp.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  comp = comp.slice(0, divStart) + comp.slice(p)
  console.log('✓ Old compete horizontal nav removed')
} else {
  console.log('⚠ Compete nav not found by exact match')
  const alt = comp.indexOf("background: PURPLE, padding: '0 20px'")
  console.log('Alt:', alt)
}

// Change outer div to flex row
comp = comp.replace(
  "display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)'",
  "display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)'"
)

// Inject CompeteSidebar after opening div
const compOuterEnd = comp.indexOf("display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)'")
const compTagEnd = comp.indexOf('>', compOuterEnd) + 1
comp = comp.slice(0, compTagEnd) + `\n      <CompeteSidebar tab={tab} setTab={setTab} />\n      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>` + comp.slice(compTagEnd)

// Close the inner div
const compLastClose = comp.lastIndexOf('</div>')
comp = comp.slice(0, compLastClose) + '      </div>\n    </div>\n  )\n}\n'

fs.writeFileSync('components/CompeteTab.js', comp, 'utf8')
console.log('✓ CompeteTab saved')

console.log('\n✅ All done!')
console.log('Run: rd /s /q .next & npm run dev')
