const fs = require('fs')
let s = fs.readFileSync('components/CompeteTab.js', 'utf8')

const homeStart = s.indexOf('function CompeteHome({ setTab })')
const homeEnd = s.indexOf('\nfunction CompeteSidebar')

const newCompeteHome = `function CompeteHome({ setTab }) {
  const PURPLE = '#4f46e5';
  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px' };

  const modes = [
    { key:'h2h', icon:'⚔️', title:'Head to Head', desc:'Challenge any trader directly. Best verified P&L wins. Pure skill.', action:'Browse challenges' },
    { key:'groups', icon:'🏆', title:'Group Contests', desc:'Compete with multiple traders in a contest. Best P&L wins the prize pool.', action:'Browse contests' },
    { key:'leaderboard', icon:'📊', title:'Leaderboard', desc:'See where you rank among all traders by verified P&L this month.', action:'View leaderboard' },
    { key:'history', icon:'📋', title:'Match History', desc:'Review your completed H2H matches, stats, and performance over time.', action:'View history' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ ...card, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, fontFamily: 'var(--font)' }}>Welcome to Compete</div>
        <div style={{ fontSize: 13, opacity: 0.85, fontFamily: 'var(--font)', lineHeight: 1.5 }}>
          Challenge other traders head-to-head, join group contests, and climb the leaderboard. All P&L is tracked through your connected broker or journal.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {modes.map(m => (
          <div key={m.key} onClick={() => setTab(m.key)} style={{ ...card, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = PURPLE}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{m.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font)', marginBottom: 6 }}>{m.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font)', lineHeight: 1.5, marginBottom: 12 }}>{m.desc}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: PURPLE, fontFamily: 'var(--font)' }}>{m.action} →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
`

s = s.slice(0, homeStart) + newCompeteHome + s.slice(homeEnd)
console.log('✓ CompeteHome replaced with clean empty state')

// Also fix the hardcoded '2' in active matches stat
s = s.replace(`['Active matches', '2', false]`, `['Active matches', '0', false]`)

fs.writeFileSync('components/CompeteTab.js', s, 'utf8')
console.log('✓ Saved\nRun: rd /s /q .next & npm run dev')
