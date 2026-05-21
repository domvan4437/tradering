const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

s = s.replace(
  `position:'fixed', top:'auto', bottom:0, left:0, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)', transform:'translateY(-100px) translateX(60px)'`,
  `position:'absolute', top:48, left:0, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:9999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)'`
)

console.log('Fixed:', s.includes("top:48, left:0"))
fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
