const fs = require('fs')

// ── COMMUNITY ─────────────────────────────────────────────────────────────────
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Remove old purple nav starting at '{/* Purple top nav */'
const commNavStart = c.indexOf('{/* Purple top nav */')
if (commNavStart > -1) {
  // Find the opening <div right after the comment
  const divStart = c.indexOf('<div', commNavStart)
  // Count div depth to find matching close
  let depth = 0, p = divStart
  while (p < c.length) {
    if (c.slice(p,p+4) === '<div') depth++
    else if (c.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  // Remove the comment + nav div
  c = c.slice(0, commNavStart) + c.slice(p)
  console.log('✓ Community old nav removed')
} else {
  console.log('⚠ Community nav comment not found')
}

// Also make sure the outer div is flex row (for sidebar to sit beside content)
c = c.replace(
  "display:'flex', flexDirection:'column', fontFamily:'var(--font)'",
  "display:'flex', flexDirection:'row', fontFamily:'var(--font)'"
)

// Inject CommSidebar after the outer opening div if not already there
if (!c.includes('<CommSidebar')) {
  const outerEnd = c.indexOf("display:'flex', flexDirection:'row', fontFamily:'var(--font)'")
  const tagEnd = c.indexOf('>', outerEnd) + 1
  c = c.slice(0, tagEnd) +
    `\n      <CommSidebar tab={tab} setTab={(t)=>setTab(t)} />\n      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>` +
    c.slice(tagEnd)
  // Close the inner div before last outer close
  const lastClose = c.lastIndexOf('</div>')
  c = c.slice(0, lastClose) + '      </div>\n    </div>\n  )\n}\n'
  console.log('✓ CommSidebar injected')
} else {
  console.log('✓ CommSidebar already injected')
}

fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('✓ CommunityLayout saved')

// ── COMPETE ───────────────────────────────────────────────────────────────────
let comp = fs.readFileSync('components/CompeteTab.js', 'utf8')

// Find compete nav - we know alt index is 69029 from before
const compNavIdx = comp.indexOf("background: PURPLE, padding: '0 20px'")
if (compNavIdx > -1) {
  const divStart = comp.lastIndexOf('<div', compNavIdx)
  let depth = 0, p = divStart
  while (p < comp.length) {
    if (comp.slice(p,p+4) === '<div') depth++
    else if (comp.slice(p,p+6) === '</div>') { depth--; if(depth===0){p+=6;break;} }
    p++
  }
  comp = comp.slice(0, divStart) + comp.slice(p)
  console.log('✓ Compete old nav removed')
} else {
  console.log('⚠ Compete nav not found')
}

// Make outer div flex row
comp = comp.replace(
  "display: 'flex', flexDirection: 'column', fontFamily: 'var(--font)'",
  "display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)'"
)

// Inject CompeteSidebar if not already there
if (!comp.includes('<CompeteSidebar')) {
  const outerEnd = comp.indexOf("display: 'flex', flexDirection: 'row', fontFamily: 'var(--font)'")
  const tagEnd = comp.indexOf('>', outerEnd) + 1
  comp = comp.slice(0, tagEnd) +
    `\n      <CompeteSidebar tab={tab} setTab={setTab} />\n      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>` +
    comp.slice(tagEnd)
  const lastClose = comp.lastIndexOf('</div>')
  comp = comp.slice(0, lastClose) + '      </div>\n    </div>\n  )\n}\n'
  console.log('✓ CompeteSidebar injected')
} else {
  console.log('✓ CompeteSidebar already injected')
}

fs.writeFileSync('components/CompeteTab.js', comp, 'utf8')
console.log('✓ CompeteTab saved')
console.log('\nRun: rd /s /q .next & npm run dev')
