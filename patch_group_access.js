const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// 1. Filter out closed groups from BROWSE_GROUPS_DATA display
// Change the filtered array to exclude Closed groups
s = s.replace(
  `const filtered = BROWSE_GROUPS_DATA.filter(g =>
    (!search || g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.join(' ').toLowerCase().includes(search.toLowerCase()) || g.bio.toLowerCase().includes(search.toLowerCase())) &&
    (!cat || g.cat === cat) &&
    (!vis || g.access === vis)
  )`,
  `const filtered = BROWSE_GROUPS_DATA.filter(g =>
    g.access !== 'Closed' &&
    (!search || g.name.toLowerCase().includes(search.toLowerCase()) || g.tags.join(' ').toLowerCase().includes(search.toLowerCase()) || g.bio.toLowerCase().includes(search.toLowerCase())) &&
    (!cat || g.cat === cat) &&
    (!vis || g.access === vis)
  )`
)
console.log('✓ Closed groups filtered out')

// 2. Fix button text - Join for Open, Request for Invite (remove Closed case)
// In GroupRow component
s = s.replace(
  `{g.access==='Closed'?'Request':'Join'}`,
  `{g.access==='Invite'?'Request to join':'Join'}`
)
// In the featured grid
s = s.replace(
  `{g.access==='Closed'?'Request':'Join'}`,
  `{g.access==='Invite'?'Request to join':'Join'}`
)
// Any remaining
s = s.replaceAll(`g.access==='Closed'?'Request':'Join'`, `g.access==='Invite'?'Request to join':'Join'`)

// 3. Also remove Closed from the access dropdown options
s = s.replace(
  `{['Open','Invite','Closed'].map(v=><option key={v}>{v}</option>)}`,
  `{['Open','Invite'].map(v=><option key={v}>{v}</option>)}`
)
console.log('✓ Button text fixed and Closed removed from filter')

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
