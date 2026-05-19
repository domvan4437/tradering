const fs = require('fs')
const PATH = 'components/TradeRingJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// Find the return div
const RETURN_MARKER = `return (\n    <div style={{ fontFamily: 'var(--font)', display: 'flex', minHeight: 'calc(100vh - 82px)', paddingTop: 82 }}>`
const CONTENT_MARKER = `\n\n      {/* ── CONTENT ── */}`

const returnIdx = s.indexOf(RETURN_MARKER)
const contentIdx = s.indexOf(CONTENT_MARKER)

if (returnIdx === -1) { console.log('❌ return marker not found'); process.exit(1) }
if (contentIdx === -1) { console.log('❌ content marker not found'); process.exit(1) }

console.log('✓ Markers found at', returnIdx, contentIdx)

// Everything between return div opening and content marker is the sidebar
const before = s.slice(0, returnIdx)
const after = s.slice(contentIdx)

const NEW_SIDEBAR = `return (
    <div style={{ fontFamily: 'var(--font)', display: 'flex', minHeight: 'calc(100vh - 82px)', paddingTop: 82 }}>

      {/* ── SIDEBAR ── */}
      <div
        onMouseEnter={() => { clearTimeout(hoverTimer.current); setSidebarOpen(true) }}
        onMouseLeave={() => { hoverTimer.current = setTimeout(() => { if (!sidebarPinned) setSidebarOpen(false) }, 180) }}
        style={{
          width: isOpen ? 188 : 54,
          minWidth: isOpen ? 188 : 54,
          borderRight: '0.5px solid var(--border)',
          background: 'var(--surface2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 6px',
          gap: 4,
          transition: 'width 0.18s ease, min-width 0.18s ease',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 20,
        }}>

        {/* Hamburger — always visible, purple, three lines */}
        <div
          onClick={() => setSidebarPinned(p => !p)}
          style={{
            width: 42, height: 38,
            background: PURPLE,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginBottom: 8,
          }}>
          <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
        </div>

        {/* Nav tabs */}
        {TABS.map(t => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              title={!isOpen ? t.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isOpen ? 8 : 0,
                padding: '8px',
                borderRadius: 8,
                background: isActive ? 'rgba(75,68,200,0.1)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                width: isOpen ? '100%' : 42,
                justifyContent: isOpen ? 'flex-start' : 'center',
                position: 'relative',
                flexShrink: 0,
              }}>
              {isActive && (
                <div style={{
                  position: 'absolute', left: 0,
                  top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 22,
                  background: PURPLE,
                  borderRadius: '0 3px 3px 0',
                }} />
              )}
              <i
                className={\`ti \${t.icon}\`}
                style={{ fontSize: 19, color: isActive ? PURPLE : 'var(--text-muted)', flexShrink: 0 }}
                aria-hidden="true"
              />
              {isOpen && (
                <span style={{
                  fontSize: 12,
                  color: isActive ? '#3C3489' : 'var(--text-muted)',
                  fontWeight: isActive ? 500 : 400,
                  whiteSpace: 'nowrap',
                }}>
                  {t.label}
                </span>
              )}
            </button>
          )
        })}

        {/* Stats — only when open */}
        {isOpen && (
          <div style={{
            marginTop: 'auto',
            padding: '10px',
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 8,
            width: '100%',
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>Your stats</div>
            {[
              { l: 'Win rate', v: winRate !== null ? \`\${winRate}%\` : '—', c: winRate !== null ? (winRate >= 60 ? 'var(--green)' : 'var(--red)') : undefined },
              { l: 'Trades', v: totalTrades || '—' },
              { l: 'Score', v: score || '—', c: score ? (score >= 70 ? 'var(--green)' : score >= 50 ? PURPLE : 'var(--red)') : undefined },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
                <span style={{ fontWeight: 500, color: r.c || 'var(--text)' }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>`

s = before + NEW_SIDEBAR + after

fs.writeFileSync(PATH, s, 'utf8')

// Verify
const final = fs.readFileSync(PATH, 'utf8')
const menuCount = (final.match(/ti-menu-2/g) || []).length
console.log('✓ ti-menu-2 count:', menuCount, '(should be 1)')
console.log('✓ Sidebar rewritten cleanly')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
