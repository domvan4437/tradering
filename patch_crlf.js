const fs = require('fs')
const path = require('path')
const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'
const SCREENER_PATH = path.join(BASE, 'CommodityScreener.js')
let s = fs.readFileSync(SCREENER_PATH, 'utf8')

// 1. Nav button — use regex with \r\n to match Windows line endings
const navFixed = s.replace(
  /background: isActive \? 'var\(--accent-bg\)' : 'transparent',\r\n(\s+)color: isActive \? 'var\(--accent\)' : 'var\(--text-muted\)',\r\n(\s+)border: 'none',\r\n(\s+)borderBottom: isActive \? '2px solid var\(--accent\)' : '2px solid transparent',/,
  (match, sp1, sp2, sp3) =>
    `background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',\r\n${sp1}color: '#ffffff',\r\n${sp2}border: 'none',\r\n${sp3}borderBottom: isActive ? '2px solid #ffffff' : '2px solid transparent',`
)
if (navFixed !== s) {
  s = navFixed
  console.log('✓ Nav tabs set to white')
} else {
  console.warn('⚠ Nav regex still not matched')
}

// 2. Markets wrapper — regex with \r\n
const marketsFixed = s.replace(
  /\{section==='markets' \? \(\r\n(\s+)<div>\r\n(\s+)\{tab==='News' && <div style=\{\{padding:'20px 24px', paddingTop:16\}\}><NewsTab \/><\/div>\}/,
  (match, sp1, sp2) =>
    `{section==='markets' ? (\r\n${sp1}<div style={{height:'calc(100vh - 82px)', overflow:'hidden', display:'flex', flexDirection:'column'}}>\r\n${sp2}{tab==='News' && <div style={{padding:'20px 24px', overflowY:'auto', flex:1}}><NewsTab /></div>}`
)
if (marketsFixed !== s) {
  s = marketsFixed
  console.log('✓ Markets wrapper set to full-height scrollable')
} else {
  console.warn('⚠ Markets wrapper regex not matched')
}

fs.writeFileSync(SCREENER_PATH, s, 'utf8')
console.log('✓ CommodityScreener.js saved')
console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
