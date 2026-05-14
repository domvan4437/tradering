const fs = require('fs')
const path = require('path')

const BASE = 'C:\\Users\\Domin\\Downloads\\commodity-screener-final\\commodity-screener\\components'

// ── 1. MarketOverview.js — remove purple ticker, widen columns ───────────────
const OVERVIEW_PATH = path.join(BASE, 'MarketOverview.js')
let overview = fs.readFileSync(OVERVIEW_PATH, 'utf8')

// Remove the TickerStrip call inside the return
overview = overview.replace(
  /\{\/\* Ticker strip \*\/\}\s*\n\s*<TickerStrip \/>/,
  '{/* purple ticker removed */}'
)

// Also remove TickerStrip function definition entirely
overview = overview.replace(
  /\/\/ [─\-]+ Ticker [─\-]+[\s\S]*?function TickerStrip\(\)[\s\S]*?\}\s*\n\n/,
  '\n'
)

// Also remove TICKER_ITEMS const
overview = overview.replace(
  /const TICKER_ITEMS = \[[\s\S]*?\]\s*\n\n/,
  '\n'
)

// Also remove PURPLE_DARK since ticker used it (keep PURPLE)
overview = overview.replace(
  /const PURPLE_DARK = '#3D37A8'\s*\n/,
  '\n'
)

// Widen left panel: 195 -> 260
overview = overview.replace('width: 195, flexShrink: 0,', 'width: 260, flexShrink: 0,')

// Widen right panel (NewsSidebar): 205 -> 280
overview = overview.replace(
  'width: 205, flexShrink: 0, padding: 11,',
  'width: 280, flexShrink: 0, padding: 11,'
)

// Fix height now that purple ticker is gone (was 82px = 46 nav + 36 ticker)
// The white ticker is in CommodityScreener, so MarketOverview just needs to fill remaining space
overview = overview.replace(
  "height: 'calc(100vh - 82px)'",
  "height: 'calc(100vh - 82px)'"
)

fs.writeFileSync(OVERVIEW_PATH, overview, 'utf8')
console.log('✓ MarketOverview.js — purple ticker removed, columns widened')

// ── 2. NavBar.js — restyle to solid purple ───────────────────────────────────
const NAV_PATH = path.join(BASE, 'NavBar.js')
let nav = fs.readFileSync(NAV_PATH, 'utf8')

// Replace the nav element style block
nav = nav.replace(
  `position:'fixed', top:0, left:0, right:0, height:48,
      background:'var(--bg)',
      backdropFilter:'blur(20px)',
      borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center',
      paddingLeft:18, paddingRight:18,
      zIndex:300,`,
  `position:'fixed', top:0, left:0, right:0, height:48,
      background:'#4B44C8',
      borderBottom:'none',
      display:'flex', alignItems:'center',
      paddingLeft:18, paddingRight:18,
      zIndex:300,`
)

// Logo text color: white
nav = nav.replace(
  `color:'var(--text)', letterSpacing:'-0.3px',`,
  `color:'#ffffff', letterSpacing:'-0.3px',`
)

// Logo ring: white border
nav = nav.replace(
  `border:'2.5px solid '+PURPLE,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 0 3px rgba(79,70,229,0.12)',`,
  `border:'2.5px solid rgba(255,255,255,0.8)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 0 3px rgba(255,255,255,0.15)',`
)

// Logo inner dot: white
nav = nav.replace(
  `width:8, height:8, borderRadius:'50%', background:PURPLE`,
  `width:8, height:8, borderRadius:'50%', background:'#fff'`
)

// Nav button active state: white bg pill, white text
nav = nav.replace(
  `background: isActive ? 'rgba(79,70,229,0.1)' : 'transparent',
                  color: isActive ? PURPLE : 'var(--text-muted)',
                  border:'none',
                  borderRadius:8,
                  padding:'6px 12px',
                  fontSize:13,
                  fontWeight: isActive ? 700 : 500,
                  cursor:'pointer',
                  fontFamily:'var(--font)',
                  transition:'all 0.15s',
                  whiteSpace:'nowrap',`,
  `background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  border:'none',
                  borderBottom: isActive ? '2px solid #fff' : '2px solid transparent',
                  borderRadius:0,
                  padding:'6px 12px',
                  fontSize:13,
                  fontWeight: isActive ? 600 : 400,
                  cursor:'pointer',
                  fontFamily:'var(--font)',
                  transition:'all 0.15s',
                  whiteSpace:'nowrap',`
)

// Dropdown: keep same but fix shadow for purple bg context
nav = nav.replace(
  `boxShadow:'0 8px 32px rgba(0,0,0,0.15)',`,
  `boxShadow:'0 8px 32px rgba(0,0,0,0.35)',`
)

// Plan badge on white bg looks odd on purple — make it white/transparent
nav = nav.replace(
  `fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.08em', padding:'3px 10px', borderRadius:20,
          background:ps.bg, color:ps.color,`,
  `fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.08em', padding:'3px 10px', borderRadius:20,
          background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)',`
)

// Account button on purple nav
nav = nav.replace(
  `background: activeSection==='account' ? 'rgba(79,70,229,0.1)' : 'var(--surface2)',
          border:'1px solid var(--border)',
          borderRadius:20, padding:'5px 14px',
          fontFamily:'var(--font)', fontSize:12, fontWeight:600,
          color: activeSection==='account' ? PURPLE : 'var(--text-muted)',
          cursor:'pointer', transition:'all 0.15s',`,
  `background: activeSection==='account' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.12)',
          border:'1px solid rgba(255,255,255,0.25)',
          borderRadius:20, padding:'5px 14px',
          fontFamily:'var(--font)', fontSize:12, fontWeight:600,
          color:'#ffffff',
          cursor:'pointer', transition:'all 0.15s',`
)

fs.writeFileSync(NAV_PATH, nav, 'utf8')
console.log('✓ NavBar.js — restyled to solid purple')

console.log('\n✅ Done. Now run:')
console.log('   taskkill /f /im node.exe & rd /s /q .next & npm run dev')
