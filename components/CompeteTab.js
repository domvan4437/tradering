
'use client';
import { useState } from 'react';

// ── Shared helpers ─────────────────────────────────────────────

function Avatar({ letter, grad, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: size * 0.34, fontWeight: 800,
      color: '#fff', flexShrink: 0,
    }}>{letter}</div>
  );
}

function BattleBar({ leftPct, leftColor, rightColor, leftLabel, rightLabel }) {
  return (
    <div>
      <div style={{ height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: leftPct + '%', background: leftColor, borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
        <div style={{ flex: 1, background: rightColor, borderRadius: '0 4px 4px 0' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: leftColor }}>{leftLabel}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: rightColor }}>{rightLabel}</span>
      </div>
    </div>
  );
}

// Tab accent colors per mode
const MODE_COLORS = {
  Home:          { accent: 'var(--accent)',  border: 'var(--accent-border)', bg: 'var(--accent-bg)' },
  H2H:           { accent: 'var(--accent)',  border: 'var(--accent-border)', bg: 'var(--accent-bg)' },
  'Group Battle':{ accent: '#10b981',        border: 'rgba(16,185,129,0.25)', bg: 'rgba(16,185,129,0.08)' },
  Bracket:       { accent: '#d97706',        border: 'rgba(217,119,6,0.25)',  bg: 'rgba(217,119,6,0.08)'  },
  Contest:       { accent: '#7c3aed',        border: 'rgba(124,58,237,0.25)', bg: 'rgba(124,58,237,0.08)' },
};

const TABS = ['Home', 'H2H', 'Group Battle', 'Bracket', 'Contest'];

// ── HOME ──────────────────────────────────────────────────────

function HomeTab({ setMode }) {
  const MODES = [
    {
      key: 'H2H', accent: 'var(--accent)', border: 'var(--accent-border)',
      bg: 'var(--accent-bg)', label: '1v1', title: 'Head to Head',
      desc: 'Challenge any trader directly. Best P&L wins. Pure skill, no luck.',
      stats: ['24 live battles', '8 pending challenges'],
      statColors: ['var(--green)', 'var(--text-muted)'],
    },
    {
      key: 'Group Battle', accent: '#10b981', border: 'rgba(16,185,129,0.25)',
      bg: 'rgba(16,185,129,0.08)', label: 'Team War', title: 'Group Battle',
      desc: 'Random teams, random matchups. Combined P&L wins. No picking sides.',
      stats: ['8 wars active', '3 forming now'],
      statColors: ['var(--green)', 'var(--text-muted)'],
    },
    {
      key: 'Bracket', accent: '#d97706', border: 'rgba(217,119,6,0.25)',
      bg: 'rgba(217,119,6,0.08)', label: 'Bracket', title: 'Bracket',
      desc: 'Single elimination. Win your match, advance. Last trader standing takes all.',
      stats: ['3 tournaments live', '$12,500 in pools'],
      statColors: ['#d97706', 'var(--text-muted)'],
    },
    {
      key: 'Contest', accent: '#7c3aed', border: 'rgba(124,58,237,0.25)',
      bg: 'rgba(124,58,237,0.08)', label: 'Open Contest', title: 'Contest',
      desc: 'Enter the field. Top traders split the prize pool. Your rank, your prize.',
      stats: ['12 contests open', '$5 – $50 entry'],
      statColors: ['#7c3aed', 'var(--text-muted)'],
    },
  ];

  return (
    <div>
      {/* Active status strip */}
      <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
        {[
          { label: 'H2H', val: '+8.4% vs seasonaltrader', color: 'var(--green)' },
          { label: 'Group', val: 'Team leading', color: 'var(--green)' },
          { label: 'Bracket', val: 'Semifinal', color: '#d97706' },
          { label: 'Contest', val: '#3 · $36 prize', color: '#7c3aed' },
        ].map((s, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {s.label}: <span style={{ color: s.color, fontWeight: 700 }}>{s.val}</span>
          </span>
        ))}
      </div>

      {/* Mode cards */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        {MODES.map((m) => (
          <div key={m.key} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'20px', position:'relative', overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column' }}
            onMouseEnter={e => e.currentTarget.style.borderColor=m.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:m.accent }} />
            <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:700, color:m.accent, marginBottom:4 }}>{m.label}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{m.title}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:12, flex:1 }}>{m.desc}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:3, marginBottom:16 }}>
              {m.stats.map((s, j) => (
                <div key={j} style={{ fontFamily:'var(--font-mono)', fontSize:11, color:m.statColors[j] }}>{j===0?'● ':'○ '}{s}</div>
              ))}
            </div>
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:12, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setMode(m.key)} style={{ padding:'7px 16px', background:m.bg, color:m.accent, border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Enter →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ── H2H ──────────────────────────────────────────────────────

function H2HTab() {
  const [activeChallenge] = useState({
    title: 'Spring Grain Championship',
    timeLeft: '4d 12h',
    me: { letter: 'D', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', name: 'you', rank: '#3 of 24', pct: '+8.4%', pnl: '+$840', trades: '3 trades', record: '2W / 1L',
      calls: [{ name: 'Gold Long', pct: '+4.2%', up: true }, { name: 'Crude Short', pct: '+6.1%', up: true }, { name: 'NatGas Long', pct: '-1.9%', up: false }] },
    opp: { letter: 'S', grad: 'linear-gradient(135deg,#16a34a,#15803d)', name: 'seasonaltrader', verified: true, rank: '#1 of 24', pct: '+14.2%', pnl: '+$1,420', trades: '5 trades', record: '4W / 1L',
      calls: [{ name: 'Wheat Long', pct: '+5.8%', up: true }, { name: 'Corn Short', pct: '+4.3%', up: true }, { name: 'Soybeans', pct: '+4.1%', up: true }] },
  });

  const CHALLENGES = [
    { letter: 'C', grad: 'linear-gradient(135deg,#0891b2,#0e7490)', name: 'cotmaster', verified: true, win: '71%', style: 'Position' },
    { letter: 'E', grad: 'linear-gradient(135deg,#ef4444,#dc2626)', name: 'energydesk', verified: false, win: '59%', style: 'Day' },
    { letter: 'G', grad: 'linear-gradient(135deg,#d97706,#b45309)', name: 'graintrader99', verified: false, win: '54%', style: 'Swing' },
    { letter: 'A', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', name: 'alpharesearch', verified: true, win: '67%', style: 'Macro' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px' }}>

      {/* Arena */}
      <div style={{ padding: '28px 26px', borderRight: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: 'var(--green)', marginBottom: 6 }}>
            ● LIVE · {activeChallenge.title} · {activeChallenge.timeLeft} left
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Head to Head Battle</div>
        </div>

        {/* Scoreboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 1fr', gap: 0, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* You */}
          <div style={{ padding: '22px 20px', background: 'var(--accent-bg)', textAlign: 'center', borderRight: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>You</div>
            <Avatar letter={activeChallenge.me.letter} grad={activeChallenge.me.grad} size={50} />
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '10px 0 4px' }}>{activeChallenge.me.name}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>{activeChallenge.me.rank}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 900, color: 'var(--green)', letterSpacing: '-2px', lineHeight: 1, marginBottom: 4 }}>{activeChallenge.me.pct}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', marginBottom: 16 }}>{activeChallenge.me.pnl} · {activeChallenge.me.trades} · {activeChallenge.me.record}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {activeChallenge.me.calls.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-secondary)' }}>{c.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: c.up ? 'var(--green)' : 'var(--red)' }}>{c.pct}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--surface2)', padding: '16px 0' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)' }}>ROUND 1</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 900, color: 'var(--border3)', letterSpacing: '2px' }}>VS</div>
            <div style={{ width: 1, height: 30, background: 'var(--border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginBottom: 3 }}>GAP</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 800, color: 'var(--red)' }}>-5.8%</div>
            </div>
            <div style={{ width: 1, height: 30, background: 'var(--border)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{activeChallenge.timeLeft}</div>
          </div>

          {/* Opponent */}
          <div style={{ padding: '22px 20px', background: 'rgba(16,185,129,0.05)', textAlign: 'center', borderLeft: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#10b981', marginBottom: 12, textTransform: 'uppercase' }}>Opponent</div>
            <Avatar letter={activeChallenge.opp.letter} grad={activeChallenge.opp.grad} size={50} />
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '10px 0 4px' }}>
              {activeChallenge.opp.name} {activeChallenge.opp.verified && <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>{activeChallenge.opp.rank}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 38, fontWeight: 900, color: 'var(--green)', letterSpacing: '-2px', lineHeight: 1, marginBottom: 4 }}>{activeChallenge.opp.pct}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--green)', marginBottom: 16 }}>{activeChallenge.opp.pnl} · {activeChallenge.opp.trades} · {activeChallenge.opp.record}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {activeChallenge.opp.calls.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-secondary)' }}>{c.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: c.up ? 'var(--green)' : 'var(--red)' }}>{c.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BattleBar leftPct={37} leftColor="var(--accent)" rightColor="var(--green)" leftLabel="you · 37%" rightLabel="seasonaltrader · 63%" />

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button style={{ flex: 1, padding: 12, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit Trade Call</button>
          <button style={{ padding: '12px 18px', background: 'var(--surface2)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>Challenge Another</button>
        </div>
      </div>

      {/* Challenge panel */}
      <div style={{ padding: '18px 16px' }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Challenge a Trader</div>
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, border: '1px solid var(--border)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>Search traders...</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CHALLENGES.map(c => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: '1px solid var(--border)', borderRadius: 9, cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar letter={c.letter} grad={c.grad} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{c.name} {c.verified && <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>{c.win} win · {c.style}</div>
              </div>
              <button style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>Challenge</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Incoming</div>
          <div style={{ padding: 12, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 10 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>fxpro_trader challenged you</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>7-day · Forex pairs · Expires 12h</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, padding: 6, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Accept</button>
              <button style={{ flex: 1, padding: 6, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer' }}>Decline</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GROUP BATTLE ──────────────────────────────────────────────

function GroupBattleTab() {
  const teamA = {
    name: 'Team Alpha', color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--accent-border)',
    pct: '+12.4%', yours: true,
    members: [
      { letter: 'D', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', name: 'you', pct: '+8.4%', up: true },
      { letter: 'S', grad: 'linear-gradient(135deg,#16a34a,#15803d)', name: 'seasonaltrader', pct: '+3.2%', up: true },
      { letter: 'G', grad: 'linear-gradient(135deg,#d97706,#b45309)', name: 'graintrader99', pct: '+0.8%', up: true },
    ],
  };
  const teamB = {
    name: 'Team Bravo', color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.2)',
    pct: '+9.8%', yours: false,
    members: [
      { letter: 'C', grad: 'linear-gradient(135deg,#0891b2,#0e7490)', name: 'cotmaster', pct: '+6.1%', up: true },
      { letter: 'E', grad: 'linear-gradient(135deg,#ef4444,#dc2626)', name: 'energydesk', pct: '+2.9%', up: true },
      { letter: 'F', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)', name: 'fxpro_trader', pct: '+0.8%', up: true },
    ],
  };

  const TeamPanel = ({ team }) => (
    <div style={{ padding: '20px', background: team.bg, border: `1px solid ${team.border}`, borderRadius: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: team.color, textTransform: 'uppercase' }}>{team.name}</span>
        {team.yours && <span style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 600, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>YOUR TEAM</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1px', marginBottom: 16 }}>{team.pct}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {team.members.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <Avatar letter={m.letter} grad={m.grad} size={28} />
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{m.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: m.up ? 'var(--green)' : 'var(--red)' }}>{m.pct}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '28px 26px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#10b981', marginBottom: 6 }}>● WAR IN PROGRESS · 3 DAYS LEFT</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 4 }}>Spring Grain War</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Randomly assigned teams · Swing style · Combined P&L wins</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: 12, marginBottom: 20 }}>
        <TeamPanel team={teamA} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, color: 'var(--text-dim)', letterSpacing: '3px' }}>VS</div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 900, color: '#10b981' }}>+2.6</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>lead</div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>WAR</div>
        </div>
        <TeamPanel team={teamB} />
      </div>

      <BattleBar leftPct={56} leftColor="var(--accent)" rightColor="#ef4444" leftLabel="Team Alpha · 56%" rightLabel="Team Bravo · 44%" />

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button style={{ flex: 1, padding: 12, background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit Trade for Your Team</button>
        <button style={{ padding: '12px 18px', background: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>Join New War</button>
      </div>
    </div>
  );
}

// ── BRACKET ──────────────────────────────────────────────────

function BracketTab() {
  const left = [
    { name: 'seasonaltrader', pct: '+14.2%', won: true, you: false },
    { name: 'graintrader99', pct: '+6.1%', won: false, you: false },
    { name: 'you', pct: '+8.4%', won: true, you: true },
    { name: 'fxpro_trader', pct: '+4.8%', won: false, you: false },
  ];
  const semis = [
    { name: 'seasonaltrader', pct: '+14.2%', you: false },
    { name: 'you', pct: '+8.4%', you: true },
  ];

  const BracketRow = ({ p }) => (
    <div style={{
      border: p.you ? '2px solid var(--accent)' : p.won === false ? '1px solid var(--border)' : '1px solid var(--green-border)',
      borderRadius: 8, padding: '8px 12px',
      background: p.you ? 'var(--accent-bg)' : p.won === false ? 'var(--surface2)' : 'rgba(22,163,74,0.05)',
      opacity: p.won === false ? 0.4 : 1,
    }}>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: p.you ? 700 : 600, color: p.you ? 'var(--accent)' : 'var(--text)' }}>
        {p.name}{p.you && ' · NEXT MATCH'}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: p.won === false ? 'var(--red)' : 'var(--green)', marginTop: 2 }}>{p.pct} {p.won ? '✓' : ''}</div>
    </div>
  );

  return (
    <div style={{ padding: '28px 26px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#d97706', marginBottom: 6 }}>SEMIFINALS · COT MASTERS</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900, color: '#d97706', letterSpacing: '-1px' }}>$5,000</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Winner takes all · 16-trader bracket</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr 40px 100px', alignItems: 'center', gap: 0, marginBottom: 24 }}>
        {/* Round 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {left.map((p, i) => (
            <div key={i}>
              <BracketRow p={p} />
              {i === 1 && <div style={{ height: 10 }} />}
            </div>
          ))}
        </div>
        {/* Connector */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'center' }}>
          <div style={{ width: 16, height: 1, background: 'var(--border)' }} />
          <div style={{ width: 1, height: 60, background: 'var(--border)' }} />
          <div style={{ width: 16, height: 1, background: 'var(--border)' }} />
        </div>
        {/* Semis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
          {semis.map((p, i) => (
            <BracketRow key={i} p={p} />
          ))}
        </div>
        {/* Connector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 16, height: 1, background: 'var(--border)' }} />
            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />
            <div style={{ width: 16, height: 1, background: 'var(--border)' }} />
          </div>
        </div>
        {/* Final */}
        <div style={{ textAlign: 'center', border: '1px solid rgba(217,119,6,0.4)', borderRadius: 12, padding: '16px 10px', background: 'rgba(217,119,6,0.06)' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#92400e', textTransform: 'uppercase', marginBottom: 6 }}>FINAL</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 900, color: '#d97706' }}>$5K</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 9, color: '#92400e', marginTop: 4 }}>Winner takes all</div>
        </div>
      </div>

      <button style={{ width: '100%', padding: 13, background: '#d97706', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
        Submit Trade → Semifinal
      </button>
    </div>
  );
}

// ── CONTEST ──────────────────────────────────────────────────

function ContestTab() {
  const prizes = [
    { place: '1st', amount: '$90', pct: '50%', color: '#d97706', bg: 'rgba(217,119,6,0.1)', border: 'rgba(217,119,6,0.3)' },
    { place: '2nd', amount: '$54', pct: '30%', color: '#9ca3af', bg: 'rgba(156,163,175,0.08)', border: 'rgba(156,163,175,0.2)' },
    { place: '3rd', amount: '$27', pct: '15%', color: '#cd7f32', bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.2)' },
    { place: '4th', amount: '$9',  pct: '5%',  color: 'var(--accent)', bg: 'var(--accent-bg)', border: 'var(--accent-border)' },
  ];
  const leaderboard = [
    { rank: 1, name: 'seasonaltrader', verified: true, pct: '+14.2%', prize: '$90', prizeColor: '#d97706', highlight: false, you: false },
    { rank: 2, name: 'cotmaster',      verified: true, pct: '+11.8%', prize: '$54', prizeColor: '#9ca3af', highlight: false, you: false },
    { rank: 3, name: 'you',            verified: false,pct: '+8.4%',  prize: '$27', prizeColor: '#7c3aed', highlight: true,  you: true  },
    { rank: 4, name: 'energydesk',     verified: false,pct: '+5.2%',  prize: '—',   prizeColor: 'var(--text-dim)', highlight: false, you: false },
    { rank: 5, name: 'fxpro_trader',   verified: false,pct: '+3.1%',  prize: '—',   prizeColor: 'var(--text-dim)', highlight: false, you: false },
  ];
  const rankColors = ['#d97706','#9ca3af','#cd7f32','var(--text-muted)','var(--text-muted)'];

  return (
    <div style={{ padding: '28px 26px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.25em', color: '#7c3aed', marginBottom: 6 }}>● LIVE · APRIL OPEN · WEEK 3</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px' }}>April Open — Commodities</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>18 entered · $10 entry fee · Top 4 win prizes</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 900, color: '#7c3aed', letterSpacing: '-1px' }}>$180</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>prize pool</div>
        </div>
      </div>

      {/* Prize breakdown */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {prizes.map(p => (
          <div key={p.place} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 8, padding: '8px 14px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: p.color, marginBottom: 2, fontWeight: 600 }}>{p.place}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 800, color: p.color }}>{p.amount}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 20 }}>
        {leaderboard.map((p, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 10, alignItems: 'center',
            padding: '10px 14px', borderRadius: 10,
            background: p.highlight ? 'rgba(124,58,237,0.06)' : 'var(--surface2)',
            border: p.highlight ? '1px solid rgba(124,58,237,0.25)' : '1px solid var(--border)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: rankColors[i] }}>{p.rank}</span>
            <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: p.you ? 700 : 500, color: p.you ? '#7c3aed' : 'var(--text)' }}>
              {p.name} {p.verified && <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>} {p.you && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#7c3aed' }}>← YOU</span>}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{p.pct}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: p.prizeColor, background: p.prize !== '—' ? 'var(--surface)' : 'transparent', padding: '2px 8px', borderRadius: 10, border: p.prize !== '—' ? '1px solid var(--border)' : 'none' }}>{p.prize}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button style={{ flex: 1, padding: 13, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Submit Trade Call</button>
        <button style={{ padding: '13px 18px', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 10, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>Browse Contests</button>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────

export default function CompeteTab({ currentUserId, mode: modeProp, setMode: setModeProp }) {
  const [localMode, setLocalMode] = useState('Home');
  const mode_ = modeProp !== undefined ? modeProp : localMode;
  const setMode = setModeProp || setLocalMode;
  const mc = MODE_COLORS[mode_] || MODE_COLORS.Home;

  if (mode_ !== 'Home') {
    return (
      <div style={{ fontFamily:'var(--font)', height:'100%', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
          <button onClick={() => setMode('Home')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font)', fontSize:12, padding:'4px 8px', borderRadius:6 }}
            onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background='none'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{mode_}</span>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {mode_==='H2H' && <H2HTab />}
          {mode_==='Group Battle' && <GroupBattleTab />}
          {mode_==='Bracket' && <BracketTab />}
          {mode_==='Contest' && <ContestTab />}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font)' }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setMode(t)} style={{
            padding: '12px 20px', fontSize: 13,
            fontWeight: mode_ === t ? 700 : 400,
            background: 'none', border: 'none',
            borderBottom: mode_ === t ? `2px solid ${mc.accent}` : '2px solid transparent',
            color: mode_ === t ? mc.accent : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.15s',
            whiteSpace: 'nowrap', fontFamily: 'var(--font)',
          }}>{t}</button>
        ))}
      </div>

      {/* Content */}
      {mode_ === 'Home'          && <HomeTab setMode={setMode} />}
      {mode_ === 'H2H'           && <H2HTab />}
      {mode_ === 'Group Battle'  && <GroupBattleTab />}
      {mode_ === 'Bracket'       && <BracketTab />}
      {mode_ === 'Contest'       && <ContestTab />}
    </div>
  );
}
