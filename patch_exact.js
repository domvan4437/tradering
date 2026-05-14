const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let s = fs.readFileSync(SCREENER_PATH, 'utf8')

// 1. Nav button — exact match including all trailing properties
const OLD_BTN = `                    style={{
                      background: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      padding: '0 12px',
                      height: 46,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                      marginBottom: -1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}`

const NEW_BTN = `                    style={{
                      background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',
                      padding: '0 12px',
                      height: 46,
                      fontSize: 12,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                      marginBottom: -1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}`

if (s.includes(OLD_BTN)) {
  s = s.replace(OLD_BTN, NEW_BTN)
  console.log('✓ Nav tabs set to white')
} else {
  console.warn('⚠ Nav button still not matched')
}

// 2. Markets wrapper — exact match
const OLD_MARKETS = `        {section==='markets' ? (
          <div>
            {tab==='News' && <div style={{padding:'20px 24px', paddingTop:16}}><NewsTab /></div>}
            {tab!=='News' && <MarketsLayout tab={tab} setTab={setTab} plan={plan} onUpgrade={()=>handleUpgrade()} currentUserId={session?.user?.id} />}
          </div>`

const NEW_MARKETS = `        {section==='markets' ? (
          <div style={{height:'calc(100vh - 82px)', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            {tab==='News' && <div style={{padding:'20px 24px', overflowY:'auto', flex:1}}><NewsTab /></div>}
            {tab!=='News' && <MarketsLayout tab={tab} setTab={setTab} plan={plan} onUpgrade={()=>handleUpgrade()} currentUserId={session?.user?.id} />}
          </div>`

if (s.includes(OLD_MARKETS)) {
  s = s.replace(OLD_MARKETS, NEW_MARKETS)
  console.log('✓ Markets wrapper set to full-height scrollable')
} else {
  console.warn('⚠ Markets wrapper not matched')
}

fs.writeFileSync(SCREENER_PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
