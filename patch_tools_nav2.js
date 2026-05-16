const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

const ANIM = "animation: 'tr-fadeUp 0.12s ease both',"
const idx = s.lastIndexOf(ANIM)
if (idx === -1) { console.log('animation line not found'); process.exit(1) }

const after = s.slice(idx)
const mapsIdx = after.indexOf('{tabs.map')
if (mapsIdx === -1) { console.log('{tabs.map not found'); process.exit(1) }

const absIdx = idx + mapsIdx
const before = s.slice(0, absIdx)
const rest = s.slice(absIdx)

const OPEN = `{sec === 'tools2' ? TOOLS_LIST.map(tool => (
                        <button
                          key={tool.key}
                          onClick={() => { setSection(sec); setTab(tool.key); setHovered(null); }}
                          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', textAlign:'left' }}
                          onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                          onMouseLeave={e=>e.currentTarget.style.background='none'}
                        >
                          <i className={\`ti \${tool.icon}\`} style={{fontSize:13,color:tool.color}} />
                          {tool.title}
                        </button>
                      )) : tabs.map(t => (`

const patched = rest.replace('{tabs.map(t => (', OPEN)
s = before + patched

fs.writeFileSync(PATH, s, 'utf8')

if (s.includes("sec === 'tools2' ? TOOLS_LIST")) {
  console.log('✓ Tools nav dropdown patched')
} else {
  console.log('⚠ Patch did not apply')
}
console.log('✓ Saved')
