const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// 1. Remove the horizontal feed sub-tabs bar
const OLD_FEED_TABS = `      {/* Feed sub-tabs */}\r\n      {tab === 'feed' && (\r\n        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'stretch', overflowX:'auto', position:'sticky', top:120, zIndex:298 }}>\r\n          {[{key:'Discover',icon:'trending-up'},{key:'Following',icon:'users'},{key:'Ideas'},{key:'Screeners'},{key:'Strategies'},{key:'COT Signals'}].map(({key:ft,icon}) => (\r\n            <button key={ft} onClick={() => setFeedTab(ft)} style={{ padding:'10px 16px', background:'none', border:'none', borderBottom:feedTab===ft?'2px solid '+PURPLE:'2px solid transparent', color:feedTab===ft?PURPLE:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:feedTab===ft?600:400, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>\r\n              {icon==='trending-up' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}\r\n              {icon==='users' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}\r\n              {ft}\r\n            </button>\r\n          ))}\r\n        </div>\r\n      )}`

if (c.includes(OLD_FEED_TABS)) {
  c = c.replace(OLD_FEED_TABS, '')
  console.log('✓ Horizontal feed tabs removed (exact)')
} else {
  // Find by unique marker
  const start = c.indexOf('{/* Feed sub-tabs */}')
  if (start > -1) {
    // Find end — it's a conditional block ending with )}
    const end = c.indexOf('      )}\r\n      {/* Tab content', start)
    if (end > -1) {
      c = c.slice(0, start) + c.slice(end + 6) // skip the closing )}\r\n
      console.log('✓ Horizontal feed tabs removed (marker)')
    } else {
      const end2 = c.indexOf('      )}\n      {/* Tab content', start)
      if (end2 > -1) {
        c = c.slice(0, start) + c.slice(end2 + 6)
        console.log('✓ Horizontal feed tabs removed (LF marker)')
      } else {
        console.log('⚠ Could not find feed tabs end')
      }
    }
  } else {
    console.log('⚠ Feed sub-tabs comment not found')
  }
}

// 2. Update CommSidebar to include feed subtabs
const OLD_SIDEBAR_TABS = `  const TABS = [
    { key:'feed',   label:'Feed',     icon:'ti-home' },
    { key:'groups', label:'Groups',   icon:'ti-users' },
    { key:'dms',    label:'Messages', icon:'ti-message' },
  ]`

const NEW_SIDEBAR_TABS = `  const FEED_SUBTABS = ['Discover','Following','Ideas','Screeners','Strategies','COT Signals']
  const TABS = [
    { key:'feed',   label:'Feed',     icon:'ti-home' },
    { key:'groups', label:'Groups',   icon:'ti-users' },
    { key:'dms',    label:'Messages', icon:'ti-message' },
  ]`

c = c.replace(OLD_SIDEBAR_TABS, NEW_SIDEBAR_TABS)
console.log('✓ FEED_SUBTABS added to sidebar')

// 3. Add feed subtabs rendering after the feed tab button
const OLD_FEED_BTN_END = `            {isOpen && <span style={{ fontSize:12, color:isActive?'#3C3489':'var(--text-muted)', fontWeight:isActive?500:400, whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
        )
      })}`

const NEW_FEED_BTN_END = `            {isOpen && <span style={{ fontSize:12, color:isActive?'#3C3489':'var(--text-muted)', fontWeight:isActive?500:400, whiteSpace:'nowrap' }}>{t.label}</span>}
          </button>
          {/* Feed subtabs inline */}
          {t.key === 'feed' && isActive && isOpen && (
            <div style={{ width:'100%', paddingLeft:8, display:'flex', flexDirection:'column', gap:1, marginBottom:4 }}>
              {FEED_SUBTABS.map(ft => (
                <button key={ft} onClick={(e)=>{e.stopPropagation();setFeedTab(ft);}}
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 8px', borderRadius:5, background:feedTab===ft?'rgba(75,68,200,0.08)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:'100%', textAlign:'left' }}>
                  <i className="ti ti-chevron-right" style={{ fontSize:11, color:feedTab===ft?'#4B44C8':'var(--text-muted)', flexShrink:0 }} aria-hidden="true" />
                  <span style={{ fontSize:11, color:feedTab===ft?'#3C3489':'var(--text-muted)', fontWeight:feedTab===ft?500:400, whiteSpace:'nowrap' }}>{ft}</span>
                </button>
              ))}
            </div>
          )}
        )
      })}`

c = c.replace(OLD_FEED_BTN_END, NEW_FEED_BTN_END)
console.log('✓ Feed subtabs added to sidebar')

// 4. CommSidebar needs feedTab and setFeedTab props
c = c.replace(
  'function CommSidebar({ tab, setTab }) {',
  'function CommSidebar({ tab, setTab, feedTab, setFeedTab }) {'
)
console.log('✓ CommSidebar props updated')

// 5. Pass feedTab/setFeedTab to CommSidebar usage
c = c.replace(
  '<CommSidebar tab={tab} setTab={(t)=>setTab(t)} />',
  '<CommSidebar tab={tab} setTab={(t)=>setTab(t)} feedTab={feedTab} setFeedTab={setFeedTab} />'
)
console.log('✓ CommSidebar call updated with feedTab props')

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
