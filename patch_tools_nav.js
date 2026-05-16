const fs = require('fs')
const PATH = 'components/CommodityScreener.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Add TOOLS_LIST to import
if (!s.includes('TOOLS_LIST')) {
  s = s.replace(
    "import { ToolsLanding2 } from './ToolsLanding2'",
    "import { ToolsLanding2, TOOLS_LIST } from './ToolsLanding2'"
  )
  console.log('✓ TOOLS_LIST import added')
} else {
  console.log('✓ TOOLS_LIST already imported')
}

// 2. Find dropdown container and inject tools2 override
const TARGET = "padding: '6px 0',\r\n                    }}>\r\n                      {tabs.map"
const TARGET_LF = "padding: '6px 0',\n                    }}>\n                      {tabs.map"

const TOOLS_OVERRIDE = `sec === 'tools2' ? TOOLS_LIST.map(tool => (
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
                      )) : tabs.map`

if (s.includes(TARGET)) {
  s = s.replace(TARGET, "padding: '6px 0',\r\n                    }}>\r\n                      {" + TOOLS_OVERRIDE)
  console.log('✓ Patched (CRLF)')
} else if (s.includes(TARGET_LF)) {
  s = s.replace(TARGET_LF, "padding: '6px 0',\n                    }}>\n                      {" + TOOLS_OVERRIDE)
  console.log('✓ Patched (LF)')
} else {
  const i = s.indexOf("padding: '6px 0'")
  console.log('⚠ Target not found. Context:', JSON.stringify(s.slice(i, i+120)))
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
