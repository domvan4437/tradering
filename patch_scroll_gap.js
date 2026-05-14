const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// ── CommodityScreener.js — fix paddingTop gap ────────────────────────────────
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let s = fs.readFileSync(SCREENER_PATH, 'utf8')

// The gap comes from paddingTop:82 on the main content div
// Markets section handles its own height, so set paddingTop to 0 for markets
// and keep 82 only for sections that need it
const OLD_WRAP = `<div style={{ padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82 }} onClick={()=>setShowAccount(false)}>`
const NEW_WRAP = `<div style={{ padding: 0, paddingTop: 0 }} onClick={()=>setShowAccount(false)}>`

if (s.includes(OLD_WRAP)) {
  s = s.replace(OLD_WRAP, NEW_WRAP)
  console.log('✓ Removed paddingTop gap entirely')
} else {
  // Try regex for CRLF
  const fixed = s.replace(
    /padding: 0, paddingTop: \(section==='community'\|\|section==='compete'\) \? 0 : 82/,
    `padding: 0, paddingTop: 0`
  )
  if (fixed !== s) {
    s = fixed
    console.log('✓ Removed paddingTop gap (regex)')
  } else {
    console.warn('⚠ Could not find paddingTop gap line')
  }
}

fs.writeFileSync(SCREENER_PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved\n')

// ── MarketOverview.js — fix left panel scroll ────────────────────────────────
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let o = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Root container needs to be the height anchor
o = o.replace(
  `display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden',`,
  `display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden', position: 'relative',`
)

// 3-col body must have explicit height so children can scroll independently
o = o.replace(
  `{ display: 'flex', flex: 1, overflow: 'hidden', alignItems: 'stretch' }`,
  `{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }`
)
// fallback
o = o.replace(
  `{ display: 'flex', flex: 1, overflow: 'hidden' }`,
  `{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }`
)

// Left panel — must have height:100% and overflowY:auto to scroll independently
// Find and fix the left panel style
o = o.replace(
  /width: (195|260), flexShrink: 0,\r?\n\s+borderRight: '0\.5px solid var\(--border\)',\r?\n\s+padding: 11, display: 'flex', flexDirection: 'column',\r?\n\s+overflowY: 'auto'[^,]/,
  `width: 260, flexShrink: 0,\n      borderRight: '0.5px solid var(--border)',\n      padding: 11, display: 'flex', flexDirection: 'column',\n      overflowY: 'auto', overflowX: 'hidden', minHeight: 0,`
)

// Also ensure left panel has overflowX hidden (no horizontal scroll)
o = o.replace(
  `width: 260, flexShrink: 0,\n      borderRight: '0.5px solid var(--border)',\n      padding: 11, display: 'flex', flexDirection: 'column',\n      overflowY: 'auto', overflowX: 'hidden',`,
  `width: 260, flexShrink: 0,\n      borderRight: '0.5px solid var(--border)',\n      padding: 11, display: 'flex', flexDirection: 'column',\n      overflowY: 'auto', overflowX: 'hidden', minHeight: 0,`
)

// Main panel — minHeight:0 so flex child can scroll
o = o.replace(
  `flex: 1, minWidth: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', gap: 9,\n      borderRight: '0.5px solid var(--border)',\n      overflowY: 'auto', overflowX: 'hidden',`,
  `flex: 1, minWidth: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', gap: 9,\n      borderRight: '0.5px solid var(--border)',\n      overflowY: 'auto', overflowX: 'hidden', minHeight: 0,`
)

// News sidebar — minHeight:0
o = o.replace(
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden',`,
  `width: 440, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', minHeight: 0,`
)

console.log('✓ MarketOverview.js — minHeight:0 added to all scroll columns')

// Also fix the height calculation — if nav is 46px and ticker is 36px = 82px total
// But check if purple ticker was removed — if so MarketOverview shouldn't subtract ticker height
// The component already has height: calc(100vh - 82px) which accounts for both
o = o.replace(
  `height: 'calc(100vh - 82px)', overflow: 'hidden', position: 'relative',`,
  `height: 'calc(100vh - 82px)', overflow: 'hidden',`
)

fs.writeFileSync(OVERVIEW_PATH, o, 'utf8')
console.log('✓ MarketOverview.js saved\n')

console.log('✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
