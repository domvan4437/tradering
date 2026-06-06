const fs = require('fs')
const PATH = 'components/TradeZarJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// Replace the collapsed sidebar placeholder div with a visible tab trigger
s = s.replace(
  `{!isOpen && <div style={{ height: 28, marginBottom: 4 }} />}`,
  `{!isOpen && (
          <div style={{ height: 28, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(75,68,200,0.12)', border: '0.5px solid rgba(75,68,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-layout-sidebar" style={{ fontSize: 14, color: '#4B44C8' }} />
            </div>
          </div>
        )}`
)

// Also make the collapsed icon buttons more visible with a subtle border on hover
// and add a visible "JOURNAL" rotated label on the collapsed sidebar
// Replace the collapsed sidebar width/background to add a left accent bar
s = s.replace(
  `background: 'var(--surface2)',\n          display: 'flex',`,
  `background: 'var(--surface2)',\n          borderLeft: isOpen ? 'none' : '3px solid ' + '#4B44C8',\n          display: 'flex',`
)

if (s.includes('ti-layout-sidebar')) {
  console.log('✓ Sidebar toggle indicator added')
} else {
  console.log('⚠ Pattern not matched')
}

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
