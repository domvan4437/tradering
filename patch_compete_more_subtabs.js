const fs = require('fs')

// ── GROUPCONTEST ──────────────────────────────────────────────────────────────
let g = fs.readFileSync('components/GroupContest.js', 'utf8')

// Find and remove horizontal nav bar
const gNavIdx = g.indexOf("display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', overflowX:'auto'")
if (gNavIdx > -1) {
  const divStart = g.lastIndexOf('<div', gNavIdx)
  let depth = 0, p = divStart
  while (p < g.length) {
    if (g.slice(p,p+4) === '<div') depth++
    else if (g.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  if (g.slice(p,p+2)==='\r\n') p+=2
  else if (g.slice(p,p+1)==='\n') p+=1
  g = g.slice(0, divStart) + g.slice(p)
  console.log('✓ GroupContest horizontal nav removed')
} else {
  console.log('⚠ GroupContest nav not found')
}

// Make subTab a prop instead of internal state
g = g.replace(
  `const [subTab, setSubTab] = useState('my contests');`,
  `// subTab controlled by parent`
)
g = g.replace(
  `export default function GroupContest({ currentUserId }) {`,
  `export default function GroupContest({ currentUserId, subTab = 'my contests', setSubTab }) {`
)
console.log('✓ GroupContest accepts subTab props')

fs.writeFileSync('components/GroupContest.js', g, 'utf8')
console.log('✓ GroupContest saved')

// ── MATCHHISTORY ──────────────────────────────────────────────────────────────
let m = fs.readFileSync('components/MatchHistory.js', 'utf8')

// Find and remove horizontal nav
const mNavIdx = m.indexOf("display:'flex', borderBottom:'1px solid var(--border)', marginBottom:16")
if (mNavIdx === -1) {
  // try different format
  const alt = m.indexOf("display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16")
  console.log('MatchHistory nav alt idx:', alt)
}
if (mNavIdx > -1) {
  const divStart = m.lastIndexOf('<div', mNavIdx)
  let depth = 0, p = divStart
  while (p < m.length) {
    if (m.slice(p,p+4) === '<div') depth++
    else if (m.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  if (m.slice(p,p+2)==='\r\n') p+=2
  else if (m.slice(p,p+1)==='\n') p+=1
  m = m.slice(0, divStart) + m.slice(p)
  console.log('✓ MatchHistory horizontal nav removed')
} else {
  // Try CRLF
  const mNavIdx2 = m.indexOf("display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16")
  if (mNavIdx2 > -1) {
    const divStart = m.lastIndexOf('<div', mNavIdx2)
    let depth = 0, p = divStart
    while (p < m.length) {
      if (m.slice(p,p+4) === '<div') depth++
      else if (m.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
      p++
    }
    if (m.slice(p,p+2)==='\r\n') p+=2
    m = m.slice(0, divStart) + m.slice(p)
    console.log('✓ MatchHistory nav removed (alt)')
  } else {
    console.log('⚠ MatchHistory nav not found')
  }
}

// Make subTab a prop
m = m.replace(
  `const [subTab, setSubTab] = useState('overview');`,
  `// subTab controlled by parent`
)
m = m.replace(
  `export default function MatchHistory() {`,
  `export default function MatchHistory({ subTab = 'overview', setSubTab }) {`
)
m = m.replace(
  `export default function MatchHistory({ currentUserId }) {`,
  `export default function MatchHistory({ currentUserId, subTab = 'overview', setSubTab }) {`
)
console.log('✓ MatchHistory accepts subTab props')

fs.writeFileSync('components/MatchHistory.js', m, 'utf8')
console.log('✓ MatchHistory saved')

// ── COMPETITAB — add states and pass props ───────────────────────────────────
let c = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Add groupSubTab and historySubTab states
c = c.replace(
  `  const [h2hSubTab, setH2hSubTab] = useState('browse');`,
  `  const [h2hSubTab, setH2hSubTab] = useState('browse');\r\n  const [groupSubTab, setGroupSubTab] = useState('my contests');\r\n  const [historySubTab, setHistorySubTab] = useState('overview');`
)
console.log('✓ groupSubTab + historySubTab states added')

// Pass props to GroupContest
c = c.replace(
  `{tab === 'groups' && <GroupContest currentUserId={currentUserId} />}`,
  `{tab === 'groups' && <GroupContest currentUserId={currentUserId} subTab={groupSubTab} setSubTab={setGroupSubTab} />}`
)
console.log('✓ GroupContest receives subTab props')

// Pass props to MatchHistory
c = c.replace(
  `{tab === 'history' && <MatchHistory />}`,
  `{tab === 'history' && <MatchHistory subTab={historySubTab} setSubTab={setHistorySubTab} />}`
)
console.log('✓ MatchHistory receives subTab props')

// Pass new states to CompeteSidebar
c = c.replace(
  `<CompeteSidebar tab={tab} setTab={setTab} h2hSubTab={h2hSubTab} setH2hSubTab={setH2hSubTab} />`,
  `<CompeteSidebar tab={tab} setTab={setTab} h2hSubTab={h2hSubTab} setH2hSubTab={setH2hSubTab} groupSubTab={groupSubTab} setGroupSubTab={setGroupSubTab} historySubTab={historySubTab} setHistorySubTab={setHistorySubTab} />`
)
console.log('✓ CompeteSidebar receives all subtab props')

// Update CompeteSidebar signature
c = c.replace(
  `function CompeteSidebar({ tab, setTab, h2hSubTab, setH2hSubTab }) {`,
  `function CompeteSidebar({ tab, setTab, h2hSubTab, setH2hSubTab, groupSubTab, setGroupSubTab, historySubTab, setHistorySubTab }) {`
)
console.log('✓ CompeteSidebar signature updated')

// Add group and history subtabs inside sidebar TABS.map — after H2H block
c = c.replace(
  `          {t.key === 'h2h' && isActive && isOpen && (
            <div style={{ width:'100%', paddingLeft:8, display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
              {['browse','my matches','invites','spectate','post challenge'].map(ft => (
                <button key={ft} onClick={() => setH2hSubTab(ft)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:5, background:h2hSubTab===ft?'rgba(75,68,200,0.08)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:11, color:h2hSubTab===ft?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ fontSize:11, color:h2hSubTab===ft?'#3C3489':'var(--text-muted)', fontWeight:h2hSubTab===ft?500:400, whiteSpace:'nowrap', textTransform:'capitalize' }}>{ft}</span>
                </button>
              ))}
            </div>
          )}`,
  `          {t.key === 'h2h' && isActive && isOpen && (
            <div style={{ width:'100%', paddingLeft:8, display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
              {['browse','my matches','invites','spectate','post challenge'].map(ft => (
                <button key={ft} onClick={() => setH2hSubTab(ft)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:5, background:h2hSubTab===ft?'rgba(75,68,200,0.08)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:11, color:h2hSubTab===ft?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ fontSize:11, color:h2hSubTab===ft?'#3C3489':'var(--text-muted)', fontWeight:h2hSubTab===ft?500:400, whiteSpace:'nowrap', textTransform:'capitalize' }}>{ft}</span>
                </button>
              ))}
            </div>
          )}
          {t.key === 'groups' && isActive && isOpen && (
            <div style={{ width:'100%', paddingLeft:8, display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
              {['my contests','browse','rankings','spectate','create contest'].map(ft => (
                <button key={ft} onClick={() => setGroupSubTab(ft)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:5, background:groupSubTab===ft?'rgba(75,68,200,0.08)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:11, color:groupSubTab===ft?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ fontSize:11, color:groupSubTab===ft?'#3C3489':'var(--text-muted)', fontWeight:groupSubTab===ft?500:400, whiteSpace:'nowrap', textTransform:'capitalize' }}>{ft}</span>
                </button>
              ))}
            </div>
          )}
          {t.key === 'history' && isActive && isOpen && (
            <div style={{ width:'100%', paddingLeft:8, display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
              {['overview','my trades','opponent','ai review'].map(ft => (
                <button key={ft} onClick={() => setHistorySubTab(ft)}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:5, background:historySubTab===ft?'rgba(75,68,200,0.08)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:11, color:historySubTab===ft?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ fontSize:11, color:historySubTab===ft?'#3C3489':'var(--text-muted)', fontWeight:historySubTab===ft?500:400, whiteSpace:'nowrap', textTransform:'capitalize' }}>{ft}</span>
                </button>
              ))}
            </div>
          )}`
)
console.log('✓ Group + History subtabs added to sidebar')

fs.writeFileSync('components/CompeteTab.js', c, 'utf8')
console.log('✓ CompeteTab saved')
console.log('\nRun: rd /s /q .next & npm run dev')
