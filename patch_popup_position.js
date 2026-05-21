const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Simple fix: just change position from fixed top:0,left:0 to absolute bottom above button
s = s.replace(
  "position:'fixed', bottom:'auto', top:0, left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'6px', minWidth:160, zIndex:99999, boxShadow:'0 8px 24px rgba(0,0,0,0.15)'",
  "position:'fixed', bottom:60, left:'auto', right:'auto', background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:160, zIndex:99999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)'"
)

// Now find the + button and read its ref or use getBoundingClientRect approach
// Actually simpler: use a ref on the button and position via JS
// Even simpler: just use bottom:60px left:16px which puts it just above the input bar
s = s.replace(
  "position:'fixed', bottom:60, left:'auto', right:'auto'",
  "position:'fixed', bottom:60, left:16"
)

console.log('Applied:', s.includes("bottom:60"))

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
