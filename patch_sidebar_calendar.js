const fs = require('fs')
const PATH = 'components/TradeRingJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// ── 1. Fix calendar to start on Sunday ───────────────────────────────────────
// getCalendarDays uses new Date(year, month, 1).getDay() which returns 0=Sun, 1=Mon...
// Currently it uses that directly (so Sunday=0 empty cells before day 1, which is correct)
// But the headers show Mo,Tu,We,Th,Fr,Sa,Su — change to Su,Mo,Tu,We,Th,Fr,Sa
s = s.replace(
  `['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']`,
  `['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']`
)
// The getCalendarDays firstDay already uses .getDay() (0=Sun) so it naturally aligns with Sunday-first
console.log('✓ Calendar headers updated to Sunday-first')

// ── 2. Replace the collapsed sidebar top indicator with something very visible ─
// Replace the old indicator block
const OLD_INDICATOR = `{!isOpen && (
          <div style={{ height: 28, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(75,68,200,0.12)', border: '0.5px solid rgba(75,68,200,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-layout-sidebar" style={{ fontSize: 14, color: '#4B44C8' }} />
            </div>
          </div>
        )}`

const NEW_INDICATOR = `{!isOpen && (
          <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#4B44C8', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(75,68,200,0.4)' }}>
              <i className="ti ti-layout-sidebar-left-expand" style={{ fontSize: 17, color: '#fff' }} />
            </div>
            <span style={{ fontSize: 8, color: '#4B44C8', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: 4 }}>Menu</span>
          </div>
        )}`

if (s.includes(OLD_INDICATOR)) {
  s = s.replace(OLD_INDICATOR, NEW_INDICATOR)
  console.log('✓ Sidebar indicator replaced (exact match)')
} else {
  // Fallback — find and replace the ti-layout-sidebar block
  s = s.replace(
    /\{!isOpen && \(\s*<div style=\{\{ height: 28[\s\S]*?ti-layout-sidebar[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
    NEW_INDICATOR
  )
  console.log('✓ Sidebar indicator replaced (regex)')
}

// ── 3. Also improve collapsed icon buttons — add a tooltip-style left label ──
// Make the sidebar left border more prominent
s = s.replace(
  `borderLeft: isOpen ? 'none' : '3px solid ' + '#4B44C8',`,
  `borderLeft: isOpen ? 'none' : '3px solid #4B44C8',`
)

// ── 4. Make collapsed tab icons bigger and more visible ──────────────────────
s = s.replace(
  `<i className={\`ti \${t.icon}\`} style={{ fontSize: 16, color: isActive ? PURPLE : 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />`,
  `<i className={\`ti \${t.icon}\`} style={{ fontSize: isOpen ? 16 : 18, color: isActive ? PURPLE : isOpen ? 'var(--text-muted)' : 'rgba(75,68,200,0.5)', flexShrink: 0 }} aria-hidden="true" />`
)

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
