const fs = require('fs')

// Fix CompeteTab line 676 - trader99 hardcoded in JSX
let ct = fs.readFileSync('components/CompeteTab.js', 'utf8')
ct = ct.replace(
  `<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)' }}>trader99</div>`,
  `<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)' }}>Opponent</div>`
)

// Also clear any remaining stat hardcodes in CompeteHome (rank #7, 68%, $840, 2 matches)
ct = ct.replace(`'#7'`, `'--'`)
ct = ct.replace(`68%`, `--%`)
ct = ct.replace(`$840`, `$0`)

// Check remaining
const mocks = ['trader99','goldtrader','cotmaster','swingking','graintrader','seasonalace','fxswing99']
mocks.forEach(m => {
  const i = ct.indexOf(m)
  if (i > -1) console.log('Still in CompeteTab:', m, 'line', ct.slice(0,i).split('\n').length)
})

fs.writeFileSync('components/CompeteTab.js', ct, 'utf8')
console.log('✓ CompeteTab fixed')

// Fix CommunityLayout - Who to Follow mock users
let cl = fs.readFileSync('components/CommunityLayout.js', 'utf8')
// Replace the entire who to follow inline array
const oldWhoToFollow = `{[{user:'seasonaltrader',wr:'67%',style:'Swing',color:'#4f46e5'},{user:'alpharesearch',wr:'71%',style:'Macro',color:'#0891b2'},{user:'graintrader99',wr:'59%',style:'Position',color:'#d97706'}].map(u => (`
const newWhoToFollow = `{[].map(u => (`

cl = cl.replace(oldWhoToFollow, newWhoToFollow)

// Also add an empty state message
cl = cl.replace(
  `{[].map(u => (`,
  `{false && [].map(u => (`
)

// Add empty state for who to follow section
cl = cl.replace(
  `<div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Who to follow</div>\n        {false && [].map(u => (`,
  `<div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Who to follow</div>\n        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>Follow other traders to see suggestions here.</div>\n        {false && [].map(u => (`
)

fs.writeFileSync('components/CommunityLayout.js', cl, 'utf8')
console.log('✓ CommunityLayout fixed')
console.log('\nRun: rd /s /q .next & npm run dev')
