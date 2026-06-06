const fs = require('fs')

// ── Fix CommunityLayout Who to Follow ─────────────────────────
let cl = fs.readFileSync('components/CommunityLayout.js', 'utf8')
cl = cl.replace(
  `{[{user:'seasonaltrader',wr:'67%',style:'Swing',color:'#4f46e5'},{user:'alpharesearch',wr:'71%',style:'Macro',color:'#0891b2'},{user:'graintrader99',wr:'59%',style:'Position',color:'#d97706'}].map(u => (
          <div key={u.user} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{u.user[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{u.user}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{u.wr} WR · {u.style}</div>
            </div>
            <button style={{ padding:'4px 10px', borderRadius:20, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Follow</button>
          </div>
        ))}`,
  `<div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font)', lineHeight:1.5 }}>Follow other traders to see them here.</div>`
)
console.log('✓ Who to Follow mock users removed')
fs.writeFileSync('components/CommunityLayout.js', cl, 'utf8')

// ── Fix CompeteTab leaderboard DATA ───────────────────────────
let ct = fs.readFileSync('components/CompeteTab.js', 'utf8')
const dataStart = ct.indexOf('  const DATA = {')
if (dataStart > -1) {
  // Find end of DATA object
  let depth = 0, dataEnd = dataStart
  for (let i = dataStart; i < ct.length; i++) {
    if (ct[i] === '{') depth++
    if (ct[i] === '}') { depth--; if (depth === 0) { dataEnd = i + 1; break } }
  }
  // Also find and remove the rows line that references DATA
  const rowsLine = ct.indexOf('\n  const rows = DATA', dataEnd)
  const rowsEnd = rowsLine > -1 ? ct.indexOf('\n', rowsLine + 1) : dataEnd

  ct = ct.slice(0, dataStart) + ct.slice(rowsEnd + 1)
  console.log('✓ Hardcoded DATA leaderboard removed')

  // Fix filtered to use rows from API state (already set by loadData)
  ct = ct.replace(
    `  const filtered = rows.filter(r => (market==='All'||r.market===market) && (bracket==='All'));`,
    `  const filtered = (rows||[]).filter(r => !market || market==='All' || r.market===market);`
  )
  console.log('✓ filtered uses API rows')
} else {
  console.log('⚠ DATA block already removed')
}

fs.writeFileSync('components/CompeteTab.js', ct, 'utf8')
console.log('✓ CompeteTab saved')
console.log('\nRun: rd /s /q .next & npm run dev')
