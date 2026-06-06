const fs = require('fs')
const PATH = 'components/TradeZarJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// Find the full sidebar div content and replace it cleanly
// The sidebar starts after the onMouseLeave handler and ends before the content div
// Let's find the duplicate hamburger and remove it

// Remove the stray second hamburger div that got left behind
const STRAY = `\n\n        <div onClick={handleClick} style={{ width: 42, height: 38, background: '#4B44C8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, cursor: 'pointer', flexShrink: 0 }}>\n          <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />\n        </div>`

if (s.includes(STRAY)) {
  s = s.replace(STRAY, '')
  console.log('✓ Duplicate hamburger removed')
} else {
  console.log('⚠ Stray div not found by exact match, trying contains check...')
  // Count occurrences of ti-menu-2
  const count = (s.match(/ti-menu-2/g) || []).length
  console.log('ti-menu-2 occurrences:', count)
  if (count > 1) {
    // Remove the second occurrence's full div
    const first = s.indexOf('ti-menu-2')
    const second = s.indexOf('ti-menu-2', first + 1)
    // Walk back to find the opening div
    const divStart = s.lastIndexOf('<div onClick={handleClick}', second)
    // Walk forward to find the closing div
    const divEnd = s.indexOf('</div>', second) + 6
    s = s.slice(0, divStart) + s.slice(divEnd)
    console.log('✓ Second hamburger removed by position')
  }
}

// Also fix the tab buttons - they have gap:0 when closed which hides icons
// Make sure icons always show regardless of open state
s = s.replace(
  `display: 'flex', alignItems: 'center', gap: isOpen ? 8 : 0,\n                padding: isOpen ? '8px 10px' : '8px',`,
  `display: 'flex', alignItems: 'center', gap: isOpen ? 8 : 0,\n                padding: isOpen ? '8px 10px' : '6px 8px',`
)

// Fix icon size to always be visible
s = s.replace(
  `<i className={\`ti \${t.icon}\`} style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--color-text-secondary, var(--text-muted))', flexShrink: 0 }} aria-hidden="true" />`,
  `<i className={\`ti \${t.icon}\`} style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />`
)

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')

// Verify
const final = fs.readFileSync(PATH, 'utf8')
const menuCount = (final.match(/ti-menu-2/g) || []).length
console.log('✓ ti-menu-2 count after fix:', menuCount, '(should be 1)')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
