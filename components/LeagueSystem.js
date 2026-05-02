'use client';
import { useState } from 'react';

// ── League & Bracket Data ─────────────────────────────────────
export const LEAGUES = [
  { id:'iron',     name:'Iron',     color:'#6b7280', bg:'#f3f4f6', icon:'⬜', minWins:0,   maxWins:4   },
  { id:'bronze',   name:'Bronze',   color:'#b45309', bg:'#fef3c7', icon:'🟫', minWins:5,   maxWins:14  },
  { id:'silver',   name:'Silver',   color:'#6b7280', bg:'#f1f5f9', icon:'⬛', minWins:15,  maxWins:29  },
  { id:'gold',     name:'Gold',     color:'#d97706', bg:'#fffbeb', icon:'🟨', minWins:30,  maxWins:49  },
  { id:'platinum', name:'Platinum', color:'#0891b2', bg:'#ecfeff', icon:'🟦', minWins:50,  maxWins:74  },
  { id:'diamond',  name:'Diamond',  color:'#4f46e5', bg:'#eef2ff', icon:'💎', minWins:75,  maxWins:99  },
  { id:'master',   name:'Master',   color:'#7c3aed', bg:'#f5f3ff', icon:'👑', minWins:100, maxWins:999 },
];

export const ACCOUNT_BRACKETS = [
  { id:'micro',         name:'Micro',         range:'Under $1K',      color:'#6b7280' },
  { id:'standard',      name:'Standard',      range:'$1K – $25K',     color:'#0891b2' },
  { id:'pro',           name:'Pro',           range:'$25K – $100K',   color:'#d97706' },
  { id:'institutional', name:'Institutional', range:'$100K+',         color:'#7c3aed' },
];

// Mock current user data
const MOCK_USER = {
  league: 'silver', wins: 18, losses: 7, winRate: 72,
  bracket: 'standard', accountSize: '$8,400',
  streak: 3, leaguePoints: 340, pointsToNext: 160,
  flags: { sandbagging: false, reviewed: false },
};

const MOCK_LEADERBOARD = {
  iron:     [{ name:'rookie_fx',    wins:3,  losses:2,  rate:60 },{ name:'newtrader22', wins:2, losses:3, rate:40 }],
  bronze:   [{ name:'grain_guy',    wins:12, losses:4,  rate:75 },{ name:'cotbasic',    wins:10,losses:5, rate:67 }],
  silver:   [{ name:'you',          wins:18, losses:7,  rate:72 },{ name:'fxswing99',   wins:16,losses:8, rate:67 }],
  gold:     [{ name:'seasonalace',  wins:38, losses:12, rate:76 },{ name:'cotmaster2',  wins:35,losses:14,rate:71 }],
  platinum: [{ name:'alphatrader',  wins:62, losses:18, rate:78 },{ name:'edgefinder',  wins:58,losses:20,rate:74 }],
  diamond:  [{ name:'elitedesk',    wins:88, losses:22, rate:80 },{ name:'fundrunner',  wins:82,losses:25,rate:77 }],
  master:   [{ name:'grandmaster1', wins:142,losses:28, rate:84 },{ name:'apexcot',     wins:131,losses:31,rate:81 }],
};

function LeagueBadge({ leagueId, size='md' }) {
  const league = LEAGUES.find(l => l.id === leagueId);
  if(!league) return null;
  const sz = size === 'sm' ? { padding:'2px 8px', fontSize:10 } : size === 'lg' ? { padding:'8px 16px', fontSize:14 } : { padding:'4px 10px', fontSize:11 };
  return (
    <span style={{ ...sz, background:league.bg, color:league.color, border:`1px solid ${league.color}40`, borderRadius:20, fontFamily:'var(--font)', fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
      {league.icon} {league.name}
    </span>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value/max)*100));
  return (
    <div style={{ height:6, background:'var(--surface2)', borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.5s' }} />
    </div>
  );
}

export default function LeagueSystem() {
  const [activeLeague, setActiveLeague] = useState('silver');
  const [activeBracket, setActiveBracket] = useState('standard');
  const user = MOCK_USER;
  const currentLeague = LEAGUES.find(l => l.id === user.league);
  const nextLeague = LEAGUES[LEAGUES.findIndex(l => l.id === user.league) + 1];
  const leaderboard = MOCK_LEADERBOARD[activeLeague] || [];

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>

      {/* My League Card */}
      <div style={{ background:'var(--surface)', border:`2px solid ${currentLeague.color}40`, borderRadius:14, padding:'20px 24px', marginBottom:20, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:currentLeague.color }} />
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:16 }}>
          <div style={{ width:56, height:56, borderRadius:14, background:currentLeague.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, border:`2px solid ${currentLeague.color}30` }}>
            {currentLeague.icon}
          </div>
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:4 }}>Your League</div>
            <div style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:800, color:currentLeague.color }}>{currentLeague.name}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{user.accountSize} · {ACCOUNT_BRACKETS.find(b=>b.id===user.bracket)?.name} Bracket</div>
          </div>
          <div style={{ marginLeft:'auto', textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:800, color:'var(--text)' }}>{user.winRate}%</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Win rate</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Wins', value:user.wins, color:'var(--green)' },
            { label:'Losses', value:user.losses, color:'var(--red)' },
            { label:'Streak', value:`${user.streak}W`, color:currentLeague.color },
            { label:'LP', value:user.leaguePoints, color:'var(--text)' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:s.color }}>{s.value}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {nextLeague && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Progress to {nextLeague.name}</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:nextLeague.color }}>{user.leaguePoints}/{user.leaguePoints+user.pointsToNext} LP</span>
            </div>
            <ProgressBar value={user.leaguePoints} max={user.leaguePoints+user.pointsToNext} color={nextLeague.color} />
          </div>
        )}
      </div>

      {/* Anti-cheat notice */}
      <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 14px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Fair play protected · Broker-verified accounts only · Sandbagging detection active</span>
      </div>

      {/* League selector */}
      <div style={{ marginBottom:14 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>All Leagues</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {LEAGUES.map(l => (
            <button key={l.id} onClick={() => setActiveLeague(l.id)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${activeLeague===l.id?l.color:'var(--border)'}`, background: activeLeague===l.id?l.bg:'transparent', color: activeLeague===l.id?l.color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              {l.icon} {l.name}
            </button>
          ))}
        </div>
      </div>

      {/* Account bracket selector */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>Account Bracket</div>
        <div style={{ display:'flex', gap:6 }}>
          {ACCOUNT_BRACKETS.map(b => (
            <button key={b.id} onClick={() => setActiveBracket(b.id)} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background: activeBracket===b.id?'var(--accent)':'transparent', color: activeBracket===b.id?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard for selected league */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>{LEAGUES.find(l=>l.id===activeLeague)?.icon}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{LEAGUES.find(l=>l.id===activeLeague)?.name} League Rankings</span>
        </div>
        <div style={{ padding:'8px 0' }}>
          {leaderboard.length === 0
            ? <div style={{ padding:'20px', textAlign:'center', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No traders in this league yet.</div>
            : leaderboard.map((t, i) => (
              <div key={t.name} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom: i<leaderboard.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ width:24, fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: i===0?'#d97706':i===1?'#6b7280':'var(--text-muted)', textAlign:'center' }}>#{i+1}</div>
                <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${LEAGUES.find(l=>l.id===activeLeague)?.color},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:800, color:'#fff' }}>{t.name[0].toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: t.name==='you'?'var(--accent)':'var(--text)' }}>{t.name}{t.name==='you'?' (you)':''}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{t.wins}W · {t.losses}L</div>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--green)' }}>{t.rate}%</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

export { LeagueBadge };
