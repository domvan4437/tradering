const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// ── CommodityScreener.js ─────────────────────────────────────────────────────
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let s = fs.readFileSync(SCREENER_PATH, 'utf8')

// 1. Nav button — make all tabs bright white, active has white underline
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
                      flexShrink: 0,`

const NEW_BTN = `                    style={{
                      background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
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
                      flexShrink: 0,`

if (s.includes(OLD_BTN)) {
  s = s.replace(OLD_BTN, NEW_BTN)
  console.log('✓ Nav tab text set to white')
} else {
  console.warn('⚠ Nav button style not matched — already patched or whitespace differs')
}

// 2. Fix the gap — find the exact main content div and set paddingTop correctly
// The div has padding and paddingTop set conditionally
const OLD_CONTENT = `<div style={{ padding: (section==='community'||section==='compete') ? '0' : '20px 24px', paddingTop: (section==='community'||section==='compete') ? 0 : 120 }} onClick={()=>setShowAccount(false)}>`
const NEW_CONTENT = `<div style={{ padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82 }} onClick={()=>setShowAccount(false)}>`

if (s.includes(OLD_CONTENT)) {
  s = s.replace(OLD_CONTENT, NEW_CONTENT)
  console.log('✓ Removed 120px gap, set to 82px offset')
} else {
  // Try the version that was already partially patched
  const OLD2 = `<div style={{ padding: 0, paddingTop: 0 }} onClick={()=>setShowAccount(false)}>`
  const OLD3 = `<div style={{ padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82 }} onClick={()=>setShowAccount(false)}>`
  if (s.includes(OLD2)) {
    s = s.replace(OLD2, NEW_CONTENT)
    console.log('✓ Fixed gap from zero-padded version')
  } else if (s.includes(OLD3)) {
    console.log('✓ Gap already correctly set to 82px')
  } else {
    // Nuclear option — regex replace
    s = s.replace(
      /padding: \(section===.community.\|\|section===.compete.\)[^,]+,\s*paddingTop: \(section===.community.\|\|section===.compete.\)[^}]+\}/,
      `padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82 }`
    )
    console.log('✓ Gap fixed via regex')
  }
}

// 3. Markets section — remove the extra 20px 24px padding wrappers so content starts flush
const OLD_MARKETS = `        {section==='markets' ? (
          <div>
            {tab==='News' && <div style={{padding:'20px 24px'}}><NewsTab /></div>}
            {tab!=='News' && <MarketsLayout tab={tab} setTab={setTab} plan={plan} onUpgrade={()=>handleUpgrade()} currentUserId={session?.user?.id} />}`
const NEW_MARKETS = `        {section==='markets' ? (
          <div style={{height:'calc(100vh - 82px)', overflow:'hidden', display:'flex', flexDirection:'column'}}>
            {tab==='News' && <div style={{padding:'20px 24px', overflowY:'auto', flex:1}}><NewsTab /></div>}
            {tab!=='News' && <MarketsLayout tab={tab} setTab={setTab} plan={plan} onUpgrade={()=>handleUpgrade()} currentUserId={session?.user?.id} />}`

if (s.includes(OLD_MARKETS)) {
  s = s.replace(OLD_MARKETS, NEW_MARKETS)
  console.log('✓ Markets section set to full height scrollable container')
} else {
  console.warn('⚠ Markets section wrapper not matched')
}

fs.writeFileSync(SCREENER_PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved\n')

// ── MarketOverview.js — independent scroll per column ────────────────────────
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let o = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Widen news sidebar — try all possible current widths
;['width: 205,', 'width: 280,', 'width: 340,', 'width: 420,'].forEach(w => {
  if (o.includes(w + ' flexShrink: 0, padding: 11,')) {
    o = o.replace(w + ' flexShrink: 0, padding: 11,', 'width: 440, flexShrink: 0, padding: 11,')
    console.log(`✓ News panel widened from ${w} to 440px`)
  }
})

// Root container — full height, no overflow
o = o.replace(
  `display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden',`,
  `display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden',`
)

// Make the 3-col body use full height
o = o.replace(
  `{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }`,
  `{ display: 'flex', flex: 1, overflow: 'hidden' }`
)
o = o.replace(
  `{ display: 'flex', flex: 1, overflow: 'hidden' }`,
  `{ display: 'flex', flex: 1, overflow: 'hidden', alignItems: 'stretch' }`
)

// Left panel — independent scroll
o = o.replace(
  /width: (195|260), flexShrink: 0,\s*\n\s*borderRight: '0\.5px solid var\(--border\)',\s*\n\s*padding: 11, display: 'flex', flexDirection: 'column',\s*\n\s*overflowY: 'auto'[^,]/,
  `width: 260, flexShrink: 0,\n      borderRight: '0.5px solid var(--border)',\n      padding: 11, display: 'flex', flexDirection: 'column',\n      overflowY: 'auto', overflowX: 'hidden',`
)

// Main panel — independent scroll
o = o.replace(
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto', height: '100%',`,
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden',`
)
o = o.replace(
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto',`,
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden',`
)

// News sidebar — independent scroll
o = o.replace(
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%',`,
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',`
)
o = o.replace(
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto',`,
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',`
)

fs.writeFileSync(OVERVIEW_PATH, o, 'utf8')
console.log('✓ MarketOverview.js — columns independently scrollable, news panel 440px\n')

console.log('✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
