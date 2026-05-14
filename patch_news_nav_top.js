const fs = require('fs')
const path = require('path')

const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// ── 1. CommodityScreener.js ──────────────────────────────────────────────────
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let screener = fs.readFileSync(SCREENER_PATH, 'utf8')

// Fix nav tab text — make inactive tabs fully white (not muted/transparent)
// Target the color property inside the nav button styles
screener = screener.replace(
  `color: isActive ? '#ffffff' : 'rgba(255,255,255,0.72)',`,
  `color: '#ffffff',`
)
// Also bump fontWeight so inactive tabs are clearly readable
screener = screener.replace(
  `fontWeight: isActive ? 600 : 400,`,
  `fontWeight: isActive ? 700 : 500,`
)

// Fix top cutoff — the main content div has paddingTop:0 but the sticky nav is 46px
// and ticker is ~36px so total offset needed is 82px
screener = screener.replace(
  `<div style={{ padding: (section==='community'||section==='compete') ? '0' : '0', paddingTop: 0 }} onClick={()=>setShowAccount(false)}>`,
  `<div style={{ padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82 }} onClick={()=>setShowAccount(false)}>`
)

// If that didn't match (already partially patched), try the original
if (!screener.includes('paddingTop: (section===')) {
  screener = screener.replace(
    /padding: \(section===.community.\|\|section===.compete.\) \? .0. : .0., paddingTop: 0/,
    `padding: 0, paddingTop: (section==='community'||section==='compete') ? 0 : 82`
  )
}

fs.writeFileSync(SCREENER_PATH, screener, 'utf8')
console.log('✓ CommodityScreener.js — nav tabs brightened, top cutoff fixed')

// ── 2. MarketOverview.js — much wider news panel ─────────────────────────────
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let overview = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Widen news sidebar to 420px (from whatever it currently is)
overview = overview.replace(/width: \d+, flexShrink: 0, padding: 11,\s*\n\s*display: 'flex', flexDirection: 'column', overflowY: 'auto'/, 
  `width: 420, flexShrink: 0, padding: 11,\n      display: 'flex', flexDirection: 'column', overflowY: 'auto'`)

// Also fix MarketOverview height — account for nav (46) + ticker (36) = 82px
overview = overview.replace(
  "height: 'calc(100vh - 82px)', overflow: 'hidden'",
  "height: 'calc(100vh - 82px)', overflow: 'hidden'"
)

fs.writeFileSync(OVERVIEW_PATH, overview, 'utf8')
console.log('✓ MarketOverview.js — news panel widened to 420px')

console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
