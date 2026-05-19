const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

// 1. Remove the horizontal H2H subtab bar
// It starts with: <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', overflowX:'auto' }}>
// and contains: ['browse','my matches','invites','spectate','post challenge'].map

const navStart = s.indexOf("      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', overflowX:'auto' }}>")
if (navStart > -1) {
  let depth = 0, p = navStart
  while (p < s.length) {
    if (s.slice(p,p+4) === '<div') depth++
    else if (s.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  // Skip trailing \r\n
  if (s.slice(p,p+2)==='\r\n') p+=2
  s = s.slice(0, navStart) + s.slice(p)
  console.log('✓ H2H horizontal tab bar removed')
} else {
  console.log('⚠ H2H nav bar not found')
}

// 2. Add h2hSubTab state to H2HTab (it already has subTab state)
// The subTab state in H2HTab IS the h2h subtab state
// We need to lift it up to CompeteTab and pass it to CompeteSidebar

// 3. Add H2H subtabs to CompeteSidebar
// Find the H2H tab entry in CompeteSidebar TABS and add subtabs after it
// Current sidebar TABS array:
const OLD_TABS = `  const TABS = [
    { key:'compete',     label:'Home',           icon:'ti-home' },
    { key:'h2h',         label:'H2H',            icon:'ti-sword' },
    { key:'groups',      label:'Group Contests',  icon:'ti-users' },
    { key:'leaderboard', label:'Leaderboard',     icon:'ti-trophy' },
    { key:'history',     label:'History',         icon:'ti-history' },
  ]`

// We'll add h2hSubTab state and subtabs rendering to CompeteSidebar
// But first, let's add the h2hSubTab state to the main CompeteTab component
// and pass it as a prop to CompeteSidebar and H2HTab

// Add h2hSubTab state to CompeteTab export default
s = s.replace(
  `  const [tab, setTab] = useState('compete');`,
  `  const [tab, setTab] = useState('compete');\r\n  const [h2hSubTab, setH2hSubTab] = useState('browse');`
)
console.log('✓ h2hSubTab state added to CompeteTab')

// Pass h2hSubTab to CompeteSidebar
s = s.replace(
  `<CompeteSidebar tab={tab} setTab={setTab} />`,
  `<CompeteSidebar tab={tab} setTab={setTab} h2hSubTab={h2hSubTab} setH2hSubTab={setH2hSubTab} />`
)
console.log('✓ h2hSubTab passed to CompeteSidebar')

// Pass h2hSubTab to H2HTab
s = s.replace(
  `{tab === 'h2h' && <H2HTab />}`,
  `{tab === 'h2h' && <H2HTab subTab={h2hSubTab} setSubTab={setH2hSubTab} />}`
)
console.log('✓ h2hSubTab passed to H2HTab')

// Update H2HTab to accept props instead of internal state
s = s.replace(
  `function H2HTab() {\r\n  const [subTab, setSubTab] = useState('browse');`,
  `function H2HTab({ subTab = 'browse', setSubTab }) {\r\n  // subTab controlled by parent`
)
s = s.replace(
  `function H2HTab() {\n  const [subTab, setSubTab] = useState('browse');`,
  `function H2HTab({ subTab = 'browse', setSubTab }) {\n  // subTab controlled by parent`
)
console.log('✓ H2HTab updated to accept props')

// Update CompeteSidebar to accept h2hSubTab and show subtabs under H2H
s = s.replace(
  `function CompeteSidebar({ tab, setTab }) {`,
  `function CompeteSidebar({ tab, setTab, h2hSubTab, setH2hSubTab }) {`
)

// Add h2h subtabs rendering inside the TABS.map - similar to how we did feed subtabs
// Find the closing of the button in CompeteSidebar and add Fragment + subtabs
const H2H_SUBTABS = ['browse','my matches','invites','spectate','post challenge']

// Find the TABS.map return in CompeteSidebar and wrap with Fragment + add subtabs
s = s.replace(
  `      return (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:isOpen?8:0, padding:'8px', borderRadius:8, background:isActive?'rgba(75,68,200,0.1)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:isOpen?'100%':42, justifyContent:isOpen?'flex-start':'center', position:'relative', flexShrink:0 }}>
            {isActive && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:22, background:'#4B44C8', borderRadius:'0 3px 3px 0' }} />}
            <i className={\`ti \${t.icon}\`} style={{ fontSize:19, color:isActive?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
            {isOpen && <span style={{ fontSize:12, color:isActive?'#3C3489':'var(--text-muted)', fontWeight:isActive?500:400, whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
        )
      })}`,
  `      return (
          <React.Fragment key={t.key}>
          <button onClick={() => setTab(t.key)}
            style={{ display:'flex', alignItems:'center', gap:isOpen?8:0, padding:'8px', borderRadius:8, background:isActive?'rgba(75,68,200,0.1)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:isOpen?'100%':42, justifyContent:isOpen?'flex-start':'center', position:'relative', flexShrink:0 }}>
            {isActive && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:22, background:'#4B44C8', borderRadius:'0 3px 3px 0' }} />}
            <i className={\`ti \${t.icon}\`} style={{ fontSize:19, color:isActive?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
            {isOpen && <span style={{ fontSize:12, color:isActive?'#3C3489':'var(--text-muted)', fontWeight:isActive?500:400, whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
          {t.key === 'h2h' && isActive && isOpen && (
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
          </React.Fragment>
        )
      })}`
)
console.log('✓ H2H subtabs added to CompeteSidebar')

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
