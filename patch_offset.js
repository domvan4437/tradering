const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// Fix CommodityScreener — markets section needs paddingTop:82 back
// so the sticky nav doesn't cover the content
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let s = fs.readFileSync(SCREENER_PATH, 'utf8')

// Find the main content wrapper and restore paddingTop only for markets
const OLD = `<div style={{ padding: 0, paddingTop: 0 }} onClick={()=>setShowAccount(false)}>`
const NEW = `<div style={{ padding: 0, paddingTop: (section==='community'||section==='compete'||section==='markets') ? 0 : 82 }} onClick={()=>setShowAccount(false)}>`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ paddingTop restored for non-markets sections')
} else {
  console.warn('⚠ Could not find main wrapper — trying regex')
  s = s.replace(
    /padding: 0, paddingTop: 0/,
    `padding: 0, paddingTop: (section==='community'||section==='compete'||section==='markets') ? 0 : 82`
  )
  console.log('✓ paddingTop fixed via regex')
}

fs.writeFileSync(SCREENER_PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved\n')

// Fix MarketOverview root — use marginTop instead of relying on parent padding
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let o = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// The root div needs to account for nav(46) + ticker(36) = 82px offset
// height should be 100vh - 82px, and we add marginTop:0 (parent already offset)
o = o.replace(
  `fontFamily: 'var(--font)', color: 'var(--text)',\n      display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden',`,
  `fontFamily: 'var(--font)', color: 'var(--text)',\n      display: 'flex', flexDirection: 'column',\n      height: 'calc(100vh - 82px)', overflow: 'hidden', marginTop: 82,`
)

fs.writeFileSync(OVERVIEW_PATH, o, 'utf8')
console.log('✓ MarketOverview.js — added marginTop:82 to push below nav+ticker')

console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
