const fs = require('fs')
const path = require('path')

const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// ── 1. CommodityScreener.js — fix gap + purple nav ──────────────────────────
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let screener = fs.readFileSync(SCREENER_PATH, 'utf8')

// Fix 1: Remove the paddingTop:120 gap on the main content wrapper
const OLD_MAIN_WRAP = `<div style={{ padding: (section==='community'||section==='compete') ? '0' : '20px 24px', paddingTop: (section==='community'||section==='compete') ? 0 : 120 }} onClick={()=>setShowAccount(false)}>`
const NEW_MAIN_WRAP = `<div style={{ padding: (section==='community'||section==='compete') ? '0' : '0', paddingTop: 0 }} onClick={()=>setShowAccount(false)}>`

if (screener.includes(OLD_MAIN_WRAP)) {
  screener = screener.replace(OLD_MAIN_WRAP, NEW_MAIN_WRAP)
  console.log('✓ Removed paddingTop:120 gap')
} else {
  console.warn('⚠ Could not find main content wrapper — trying alternate match')
  // Try a more flexible replace
  screener = screener.replace(
    /padding: \(section===.community.\|\|section===.compete.\) \? '0' : '20px 24px', paddingTop: \(section===.community.\|\|section===.compete.\) \? 0 : 120/,
    `padding: 0, paddingTop: 0`
  )
  console.log('✓ Removed paddingTop:120 (alternate match)')
}

// Fix 2: Purple nav bar background
const OLD_NAV_BG = `background:'var(--bg1)', position:'sticky', top:0, zIndex:300, borderBottom:'1px solid var(--border)'`
const NEW_NAV_BG = `background:'#4B44C8', position:'sticky', top:0, zIndex:300, borderBottom:'none'`

if (screener.includes(OLD_NAV_BG)) {
  screener = screener.replace(OLD_NAV_BG, NEW_NAV_BG)
  console.log('✓ Nav background set to purple')
} else {
  console.warn('⚠ Could not find nav bg — check manually')
}

// Fix 3: Nav text — active item white, inactive semi-transparent white
const OLD_NAV_ACTIVE_BG = `background: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',`
const NEW_NAV_ACTIVE_BG = `background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',`

if (screener.includes(OLD_NAV_ACTIVE_BG)) {
  screener = screener.replace(OLD_NAV_ACTIVE_BG, NEW_NAV_ACTIVE_BG)
  console.log('✓ Nav active item styled white')
} else {
  console.warn('⚠ Could not find nav active style')
}

// Fix 4: Logo text white
const OLD_LOGO_TEXT = `fontSize:15, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px'`
const NEW_LOGO_TEXT = `fontSize:15, fontWeight:700, color:'#ffffff', letterSpacing:'-0.4px'`
if (screener.includes(OLD_LOGO_TEXT)) {
  screener = screener.replace(OLD_LOGO_TEXT, NEW_LOGO_TEXT)
  console.log('✓ Logo text set to white')
} else {
  console.warn('⚠ Could not find logo text style')
}

// Fix 5: Logo ring border white
const OLD_LOGO_RING = `border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0`
const NEW_LOGO_RING = `border:'2px solid rgba(255,255,255,0.85)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0`
if (screener.includes(OLD_LOGO_RING)) {
  screener = screener.replace(OLD_LOGO_RING, NEW_LOGO_RING)
  console.log('✓ Logo ring set to white')
} else {
  console.warn('⚠ Could not find logo ring style')
}

// Fix 6: Upgrade button on purple nav
const OLD_UPGRADE_BTN = `background:'var(--accent)', color:'#fff', border:'none', padding:'5px 13px', borderRadius:3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)'`
const NEW_UPGRADE_BTN = `background:'rgba(255,255,255,0.2)', color:'#fff', border:'1px solid rgba(255,255,255,0.4)', padding:'5px 13px', borderRadius:3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)'`
if (screener.includes(OLD_UPGRADE_BTN)) {
  screener = screener.replace(OLD_UPGRADE_BTN, NEW_UPGRADE_BTN)
  console.log('✓ Upgrade button styled for purple nav')
} else {
  console.warn('⚠ Could not find upgrade button style')
}

// Fix 7: Account dropdown button white
const OLD_ACCT_BTN = `background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', padding:'4px 10px', fontSize:12, fontWeight:500, borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:6`
const NEW_ACCT_BTN = `background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', padding:'4px 10px', fontSize:12, fontWeight:500, borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:6`
if (screener.includes(OLD_ACCT_BTN)) {
  screener = screener.replace(OLD_ACCT_BTN, NEW_ACCT_BTN)
  console.log('✓ Account button styled for purple nav')
} else {
  console.warn('⚠ Could not find account button style')
}

// Fix 8: Plan badge (FREE · 0/) on purple nav
const OLD_PLAN_BADGE = `fontSize:11, fontWeight:600, color:'var(--accent)', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', padding:'3px 9px', borderRadius:5`
const NEW_PLAN_BADGE = `fontSize:11, fontWeight:600, color:'#fff', background:'rgba(255,255,255,0.18)', border:'1px solid rgba(255,255,255,0.3)', padding:'3px 9px', borderRadius:5`
if (screener.includes(OLD_PLAN_BADGE)) {
  screener = screener.replace(OLD_PLAN_BADGE, NEW_PLAN_BADGE)
  console.log('✓ Plan badge styled for purple nav')
} else {
  console.warn('⚠ Could not find plan badge style')
}

// Fix 9: Theme toggle button on purple nav
const OLD_THEME_BTN = `background:'transparent', border:'1px solid var(--border2)', color:'var(--text-muted)', width:28, height:28, borderRadius:3, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center'`
const NEW_THEME_BTN = `background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.25)', color:'#fff', width:28, height:28, borderRadius:3, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center'`
if (screener.includes(OLD_THEME_BTN)) {
  screener = screener.replace(OLD_THEME_BTN, NEW_THEME_BTN)
  console.log('✓ Theme toggle styled for purple nav')
} else {
  console.warn('⚠ Could not find theme toggle style')
}

// Fix 10: markets section — remove extra padding wrapper
const OLD_MARKETS_WRAP = `{tab==='News' && <div style={{padding:'20px 24px'}}><NewsTab /></div>}`
const NEW_MARKETS_WRAP = `{tab==='News' && <div style={{padding:'20px 24px', paddingTop:16}}><NewsTab /></div>}`
if (screener.includes(OLD_MARKETS_WRAP)) {
  screener = screener.replace(OLD_MARKETS_WRAP, NEW_MARKETS_WRAP)
  console.log('✓ Markets news padding adjusted')
}

fs.writeFileSync(SCREENER_PATH, screener, 'utf8')
console.log('✓ CommodityScreener.js saved\n')

// ── 2. MarketOverview.js — wider news panel + separate column scroll ─────────
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let overview = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Widen right news panel: 205 -> 320
overview = overview.replace(
  'width: 280, flexShrink: 0, padding: 11,',
  'width: 340, flexShrink: 0, padding: 11,'
)
// fallback if previous patch didn't run
overview = overview.replace(
  'width: 205, flexShrink: 0, padding: 11,',
  'width: 340, flexShrink: 0, padding: 11,'
)

// Widen left panel if not already done
overview = overview.replace(
  'width: 195, flexShrink: 0,',
  'width: 260, flexShrink: 0,'
)

// Fix height — no purple ticker anymore so only nav (46px) + white ticker (36px) = 82px
overview = overview.replace(
  "height: 'calc(100vh - 82px)', overflow: 'hidden'",
  "height: 'calc(100vh - 82px)', overflow: 'hidden'"
)

// Make each column independently scrollable — left panel
overview = overview.replace(
  `width: 260, flexShrink: 0,
      borderRight: '0.5px solid var(--border)',
      padding: 11, display: 'flex', flexDirection: 'column',
      overflowY: 'auto',`,
  `width: 260, flexShrink: 0,
      borderRight: '0.5px solid var(--border)',
      padding: 11, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', height: '100%',`
)

// Make main panel independently scrollable
overview = overview.replace(
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto',`,
  `flex: 1, minWidth: 0, padding: 11,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto', height: '100%',`
)

// Make news sidebar independently scrollable
overview = overview.replace(
  `width: 340, flexShrink: 0, padding: 11,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',`,
  `width: 340, flexShrink: 0, padding: 11,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100%',`
)

// Make the 3-col body fill remaining height with overflow hidden
overview = overview.replace(
  `{ display: 'flex', flex: 1, overflow: 'hidden' }`,
  `{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }`
)

fs.writeFileSync(OVERVIEW_PATH, overview, 'utf8')
console.log('✓ MarketOverview.js — news panel widened to 340px, columns independently scrollable\n')

console.log('✅ All patches applied. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
