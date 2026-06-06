const fs = require('fs')
const PATH = 'components/TradeZarJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// Replace the isOpen-conditional header with one that always shows the hamburger
// and only shows the "Journal" label when open
const OLD = `{isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2 }}>
            <div onClick={handleClick} style={{ width: 42, height: 38, background: '#4B44C8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Journal</span>
          </div>
        )}`

const NEW = `<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingLeft: 2 }}>
          <div onClick={handleClick} style={{ width: 42, height: 38, background: '#4B44C8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
          </div>
          {isOpen && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Journal</span>}
        </div>`

if (s.includes(OLD)) {
  s = s.replace(OLD, NEW)
  console.log('✓ Hamburger now always visible (exact match)')
} else {
  // Try without the extra newline variations
  const idx = s.indexOf('{isOpen && (\n          <div style={{ display: \'flex\', alignItems: \'center\', gap: 8, marginBottom: 12')
  if (idx > -1) {
    // Find end of this block
    const end = s.indexOf('        )}', idx) + 10
    s = s.slice(0, idx) + NEW + s.slice(end)
    console.log('✓ Hamburger now always visible (index match)')
  } else {
    console.log('⚠ Pattern not found — logging context:')
    const i = s.indexOf('ti-menu-2')
    console.log(JSON.stringify(s.slice(i - 300, i + 50)))
  }
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
