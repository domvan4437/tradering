const fs = require('fs')
let c = fs.readFileSync('components/CommunityLayout.js', 'utf8')
const lines = c.split('\n')

// Line 509 (index 508): button missing style prop
// Current: "          <button onClick={(e)=>{e.stopPropagation();setTab(t.key);}}"
// Need:    "          <button onClick={(e)=>{e.stopPropagation();setTab(t.key);}}"
//          "            style={{ display:'flex', ...}}>

// Check current line 509
console.log('Line 509:', JSON.stringify(lines[508]))
console.log('Line 510:', JSON.stringify(lines[509]))

// The button needs a style prop and closing >
// Insert the style line after 509
const STYLE_LINE = "            style={{ display:'flex', alignItems:'center', gap:isOpen?8:0, padding:'8px', borderRadius:8, background:isActive?'rgba(75,68,200,0.1)':'transparent', border:'none', cursor:'pointer', fontFamily:'var(--font)', width:isOpen?'100%':42, justifyContent:isOpen?'flex-start':'center', position:'relative', flexShrink:0 }}>"

lines.splice(509, 0, STYLE_LINE)
console.log('✓ Style prop inserted at line 510')

// Verify
console.log('\nNew lines 507-512:')
lines.slice(506, 513).forEach((l, i) => console.log(507+i, JSON.stringify(l)))

c = lines.join('\n')
fs.writeFileSync('components/CommunityLayout.js', c, 'utf8')
console.log('\n✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
