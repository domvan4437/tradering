const fs = require('fs')

// ── 1. LocalTradersTab — replace mock traders with empty state ─
let lt = fs.readFileSync('components/LocalTradersTab.js', 'utf8')

// Replace the MOCK_TRADERS array with empty
const mockStart = lt.indexOf('const MOCK_TRADERS = [')
const mockEnd = lt.indexOf(']', lt.indexOf(']', lt.indexOf(']', lt.indexOf(']', lt.indexOf(']', mockStart + 10) + 1) + 1) + 1) + 1) + 1
// Find the actual end of the array (the last ] before the component)
let depth = 0, end = mockStart
for (let i = mockStart; i < lt.length; i++) {
  if (lt[i] === '[') depth++
  if (lt[i] === ']') { depth--; if (depth === 0) { end = i + 1; break } }
}
lt = lt.slice(0, mockStart) + 'const MOCK_TRADERS = []' + lt.slice(end)
console.log('✓ LocalTradersTab mock traders removed')

// Update empty state message
lt = lt.replace(
  `{filtered.length === 0 ? (\n      <div style={{ textAlign:'center', padding:'30px', color:'var(--text-muted,#6b7280)', fontSize:13 }}>No traders match your filters</div>`,
  `{filtered.length === 0 ? (\n      <div style={{ textAlign:'center', padding:'40px 20px' }}>\n        <div style={{ fontSize:32, marginBottom:12 }}>📍</div>\n        <div style={{ fontSize:15, fontWeight:500, color:'var(--text,#111)', marginBottom:8 }}>No traders found nearby</div>\n        <div style={{ fontSize:13, color:'var(--text-muted,#6b7280)', lineHeight:1.5 }}>Be the first! Set your city in Account → Profile and enable "Show city in Local Traders tab".</div>\n      </div>`
)
fs.writeFileSync('components/LocalTradersTab.js', lt, 'utf8')
console.log('✓ LocalTradersTab saved')

// ── 2. CompeteTab — remove mock data from H2HTab LIVE spectate ─
let ct = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Remove hardcoded spectate LIVE data - it's already [] from our patch
// Just make sure spectate tab shows empty state
ct = ct.replace(
  `<div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Live H2H matches</div>\n          {LIVE.map(m => (`,
  `<div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Live H2H matches</div>\n          {LIVE.length === 0 && <div style={{ textAlign:'center', padding:'60px' }}><div style={{ fontSize:36, marginBottom:12 }}>👁</div><div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No live matches</div><div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginTop:8 }}>Active H2H matches will appear here</div></div>}\n          {LIVE.map(m => (`
)
fs.writeFileSync('components/CompeteTab.js', ct, 'utf8')
console.log('✓ CompeteTab spectate empty state added')

// ── 3. GroupContest — remove MOCK_CONTESTS, show empty state ──
let gc = fs.readFileSync('components/GroupContest.js', 'utf8')
const gcMockStart = gc.indexOf('const MOCK_CONTESTS = [')
if (gcMockStart > -1) {
  let d = 0, gcEnd = gcMockStart
  for (let i = gcMockStart; i < gc.length; i++) {
    if (gc[i] === '[') d++
    if (gc[i] === ']') { d--; if (d === 0) { gcEnd = i + 1; break } }
  }
  gc = gc.slice(0, gcMockStart) + 'const MOCK_CONTESTS = []' + gc.slice(gcEnd)
  console.log('✓ GroupContest mock data removed')
}
// Fix the reference - uses (contests||MOCK_CONTESTS) which now returns []
fs.writeFileSync('components/GroupContest.js', gc, 'utf8')
console.log('✓ GroupContest saved')

// ── 4. MatchHistory — remove MOCK_MATCHES ─────────────────────
let mh = fs.readFileSync('components/MatchHistory.js', 'utf8')
const mhMockStart = mh.indexOf('const MOCK_MATCHES = [')
if (mhMockStart > -1) {
  let d = 0, mhEnd = mhMockStart
  for (let i = mhMockStart; i < mh.length; i++) {
    if (mh[i] === '[') d++
    if (mh[i] === ']') { d--; if (d === 0) { mhEnd = i + 1; break } }
  }
  mh = mh.slice(0, mhMockStart) + 'const MOCK_MATCHES = []' + mh.slice(mhEnd)
  console.log('✓ MatchHistory mock data removed')
}
fs.writeFileSync('components/MatchHistory.js', mh, 'utf8')
console.log('✓ MatchHistory saved')

// ── 5. CommunityLayout — remove browse groups mock data ────────
let cl = fs.readFileSync('components/CommunityLayout.js', 'utf8')
const bgStart = cl.indexOf('const BROWSE_GROUPS_DATA = [')
if (bgStart > -1) {
  let d = 0, bgEnd = bgStart
  for (let i = bgStart; i < cl.length; i++) {
    if (cl[i] === '[') d++
    if (cl[i] === ']') { d--; if (d === 0) { bgEnd = i + 1; break } }
  }
  cl = cl.slice(0, bgStart) + 'const BROWSE_GROUPS_DATA = []' + cl.slice(bgEnd)
  console.log('✓ CommunityLayout browse groups mock data removed')
}
fs.writeFileSync('components/CommunityLayout.js', cl, 'utf8')
console.log('✓ CommunityLayout saved')

console.log('\n✓ All mock traders/data removed')
console.log('Run: rd /s /q .next & npm run dev')
