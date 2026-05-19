const fs = require('fs')
const PATH = 'components/TradeRingJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// 1. Replace the collapsed sidebar indicator block (the purple button at top)
const OLD1 = `{!isOpen && (
          <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#4B44C8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(75,68,200,0.4)' }}>
              <i className="ti ti-layout-sidebar-left-expand" style={{ fontSize: 17, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 8, color: '#4B44C8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: 4 }}>Menu</span>
          </div>
        )}`

const NEW1 = `<div onClick={handleClick} style={{ width: 42, height: 38, background: '#4B44C8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, cursor: 'pointer', flexShrink: 0 }}>
          <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
        </div>`

if (s.includes(OLD1)) {
  s = s.replace(OLD1, NEW1)
  console.log('✓ Hamburger button added (exact match)')
} else {
  // fallback regex
  s = s.replace(
    /\{!isOpen && \(\s*<div style=\{\{[\s\S]*?Menu[\s\S]*?\}\}\s*\)\}/,
    NEW1
  )
  console.log('✓ Hamburger button added (regex)')
}

// 2. Replace the isOpen header block (pin button + Journal label when expanded)
// with a hamburger that works in both states
const OLD2 = `{isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 6px' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Journal</span>
            <button onClick={handleClick} title={sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: sidebarPinned ? PURPLE : 'var(--text-muted)', padding: 2 }}>
              {sidebarPinned ? '📌' : '📍'}
            </button>
          </div>
        )}`

const NEW2 = `{isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2 }}>
            <div onClick={handleClick} style={{ width: 42, height: 38, background: '#4B44C8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Journal</span>
          </div>
        )}`

if (s.includes(OLD2)) {
  s = s.replace(OLD2, NEW2)
  console.log('✓ Expanded header updated')
} else {
  console.log('⚠ Expanded header not matched — may need manual check')
}

// 3. Update the tab buttons to use the left accent bar style for active state
// Replace the active background style with the accent bar approach
const OLD3 = `background: isActive ? 'rgba(75,68,200,0.12)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                width: '100%', justifyContent: isOpen ? 'flex-start' : 'center',
                transition: 'padding 0.16s ease',
              }}>
              <i className={\`ti \${t.icon}\`} style={{ fontSize: isOpen ? 16 : 18, color: isActive ? PURPLE : isOpen ? 'var(--text-muted)' : 'rgba(75,68,200,0.5)', flexShrink: 0 }} aria-hidden="true" />`

const NEW3 = `background: isActive ? 'rgba(75,68,200,0.1)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                width: '100%', justifyContent: isOpen ? 'flex-start' : 'center',
                transition: 'padding 0.16s ease',
                position: 'relative',
              }}>
              {isActive && !isOpen && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, background: PURPLE, borderRadius: '0 3px 3px 0' }} />}
              {isActive && isOpen && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 22, background: PURPLE, borderRadius: '0 3px 3px 0' }} />}
              <i className={\`ti \${t.icon}\`} style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--color-text-secondary, var(--text-muted))', flexShrink: 0 }} aria-hidden="true" />`

if (s.includes(OLD3)) {
  s = s.replace(OLD3, NEW3)
  console.log('✓ Active tab accent bar added')
} else {
  // simpler patch — just update the icon line
  s = s.replace(
    `<i className={\`ti \${t.icon}\`} style={{ fontSize: isOpen ? 16 : 18, color: isActive ? PURPLE : isOpen ? 'var(--text-muted)' : 'rgba(75,68,200,0.5)', flexShrink: 0 }} aria-hidden="true" />`,
    `<i className={\`ti \${t.icon}\`} style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />`
  )
  console.log('✓ Icon colors updated (fallback)')
}

// 4. Remove the old border-left from sidebar div — hamburger replaces it
s = s.replace(
  `borderLeft: isOpen ? 'none' : '3px solid #4B44C8',\n          display: 'flex',`,
  `display: 'flex',`
)
s = s.replace(
  `borderLeft: isOpen ? 'none' : '3px solid ' + '#4B44C8',\n          display: 'flex',`,
  `display: 'flex',`
)
console.log('✓ Old border-left removed')

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
