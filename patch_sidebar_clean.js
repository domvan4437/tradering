const fs = require('fs')
const PATH = 'components/TradeZarJournal.js'
let s = fs.readFileSync(PATH, 'utf8')

// Find the sidebar div content start (after the style closing }}>)
const SIDEBAR_START = `      {/* ── SIDEBAR ── */}\n      <div\n        onMouseEnter={handleMouseEnter}\n        onMouseLeave={handleMouseLeave}\n        style={{\n          width: isOpen ? 188 : 50,\n          minWidth: isOpen ? 188 : 50,\n          borderRight: '0.5px solid var(--border)',\n          background: 'var(--surface2)',\n          display: 'flex',\n          flexDirection: 'column',\n          gap: 2,\n          padding: isOpen ? '16px 10px' : '16px 7px',\n          transition: 'width 0.16s ease, min-width 0.16s ease, padding 0.16s ease',\n          overflow: 'hidden',\n          flexShrink: 0,\n          zIndex: 20,\n          cursor: 'default',\n        }}>`

// Find where the sidebar div ends and content begins
const CONTENT_START = `\n\n      {/* ── CONTENT ── */}`

const startIdx = s.indexOf(SIDEBAR_START)
const endIdx = s.indexOf(CONTENT_START)

if (startIdx === -1) { console.log('❌ SIDEBAR_START not found'); process.exit(1) }
if (endIdx === -1) { console.log('❌ CONTENT_START not found'); process.exit(1) }

console.log('✓ Found sidebar section:', startIdx, '->', endIdx)

const NEW_SIDEBAR = `      {/* ── SIDEBAR ── */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          width: isOpen ? 188 : 54,
          minWidth: isOpen ? 188 : 54,
          borderRight: '0.5px solid var(--border)',
          background: 'var(--surface2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOpen ? 'flex-start' : 'center',
          gap: 2,
          padding: '10px 6px',
          transition: 'width 0.16s ease, min-width 0.16s ease',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 20,
        }}>

        {/* Hamburger — always visible */}
        <div
          onClick={handleClick}
          style={{
            width: 42, height: 38,
            background: PURPLE,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginBottom: 10,
            alignSelf: 'center',
          }}>
          <i className="ti ti-menu-2" style={{ fontSize: 20, color: '#fff' }} aria-hidden="true" />
        </div>

        {/* Tab buttons */}
        {TABS.map(t => {
          const isActive = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              title={!isOpen ? t.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
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

        {/* Stats mini panel — only when open */}
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

// Replace everything between SIDEBAR_START and CONTENT_START
s = s.slice(0, startIdx) + NEW_SIDEBAR + s.slice(endIdx)

fs.writeFileSync(PATH, s, 'utf8')
console.log('✓ Sidebar completely rewritten')
console.log('✓ Saved')
console.log('\nRun: taskkill /f /im node.exe & rd /s /q .next & npm run dev')
