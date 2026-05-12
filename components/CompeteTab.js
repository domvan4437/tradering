
'use client';
import { useState } from 'react';
import LeagueSystem from './LeagueSystem';
import ChallengeMarketplace from './ChallengeMarketplace';
import GroupContest from './GroupContest';
import SpectatorMode from './SpectatorMode';
import MatchHistory from './MatchHistory';

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


// ── HOME ──────────────────────────────────────────────────────

function HomeTab({ setMode }) {
  const MODES = [
    { key:'H2H',          accent:'#534AB7', bg:'#EEEDFE', label:'1v1',           title:'Head to Head',       desc:'Challenge any trader directly. Best verified P&L% wins. Pure skill, no luck.',     stats:['24 live battles','8 pending invites'],   statColors:['#534AB7','var(--text-muted)'] },
    { key:'GroupContest', accent:'#7c3aed', bg:'#f5f3ff', label:'Group Contest',  title:'Group Open Contest', desc:'Groups compete for massive customizable prize pools. Monthly, weekly, or custom.',   stats:['3 active pools','Up to $50K prize'],     statColors:['#7c3aed','var(--text-muted)'] },
    { key:'Leaderboard',  accent:'#d97706', bg:'#fffbeb', label:'Leaderboard',    title:'P&L Leaderboard',    desc:'Ranked purely by verified P&L%. Position traders and day traders compete equally.',  stats:['847 ranked traders','Updated live'],     statColors:['#d97706','var(--text-muted)'] },
    { key:'History',      accent:'#16a34a', bg:'#f0fdf4', label:'History',        title:'Match History',      desc:'Deep post-match analytics, trade grades, AI review. Export to your notes.',          stats:['18 matches played','Avg grade: B+'],     statColors:['#16a34a','var(--text-muted)'] },
  ];
  return (
    <div style={{ padding:'20px', fontFamily:'var(--font)' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
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
// ── H2H ─────────────────────────────────────────────────────
function H2HTab() {
  const [subTab, setSubTab] = useState('browse');
  const [accepted, setAccepted] = useState(null);

  const MY_MATCHES = [
    { id:1, opponent:'fxswing99', asset:'Gold (GC=F)', duration:'1 Week', stake:'$50', myPnl:'+8.4%', oppPnl:'-2.1%', timeLeft:'3d 4h', status:'winning' },
    { id:2, opponent:'cotbasic', asset:'EUR/USD', duration:'3 Days', stake:'$25', myPnl:'+1.2%', oppPnl:'+3.8%', timeLeft:'12h', status:'losing' },
  ];

  const INVITES = [
    { id:1, from:'seasonalace', league:'gold', asset:'Commodities', duration:'1 Week', stake:'$100', message:'COT setups only. Grains and metals. Best P&L wins.', received:'2h ago' },
    { id:2, from:'cotmaster2', league:'gold', asset:'Any', duration:'2 Weeks', stake:'$50', message:'Open asset class challenge.', received:'5h ago' },
  ];

  const OPEN = [
    { id:1, poster:'seasonalace', league:'gold', asset:'Commodities', duration:'1 Week', stake:'$50', desc:'COT-based setups only. Grains and metals. Best P&L after 7 days wins.', posted:'2h ago', accepts:0, max:1, winRate:76, wins:38 },
    { id:2, poster:'fxswing99', league:'silver', asset:'Forex', duration:'3 Days', stake:'$25', desc:'Major pairs only. No scalping — minimum 4hr hold time per trade.', posted:'4h ago', accepts:0, max:1, winRate:67, wins:16 },
    { id:3, poster:'cotmaster2', league:'gold', asset:'Any', duration:'2 Weeks', stake:'$100', desc:'Open asset class. Verified broker account required. Top P&L% wins.', posted:'6h ago', accepts:1, max:3, winRate:71, wins:35 },
    { id:4, poster:'edgefinder', league:'platinum', asset:'Futures', duration:'1 Month', stake:'$250', desc:'Equity index futures only. ES, NQ, YM. Monthly P&L competition.', posted:'1d ago', accepts:0, max:1, winRate:74, wins:58 },
    { id:5, poster:'newtrader22', league:'iron', asset:'Forex', duration:'1 Day', stake:'$5', desc:'Quick 1-day EUR/USD challenge. First trade within 2hrs of market open.', posted:'30m ago', accepts:0, max:1, winRate:40, wins:2 },
  ];

  const LIVE = [
    { id:1, t1:'seasonalace', t1pnl:'+8.4%', t2:'fxswing99', t2pnl:'-2.1%', asset:'Gold', stake:'$50', spectators:14, startedAgo:'2h 14m' },
    { id:2, t1:'cotmaster2', t1pnl:'+5.1%', t2:'edgefinder', t2pnl:'+2.3%', asset:'EUR/USD', stake:'$100', spectators:8, startedAgo:'4h 32m' },
  ];

  const LC = { iron:'#6b7280', bronze:'#b45309', silver:'#9ca3af', gold:'#d97706', platinum:'#0891b2', diamond:'#4f46e5', master:'#7c3aed' };
  const lc = (l) => LC[l]||'#6b7280';

  const ASSET_CLASSES = ['Any','Forex','Commodities','Futures','Stocks','Crypto'];
  const DURATIONS = ['1 Day','3 Days','1 Week','2 Weeks','1 Month'];
  const STAKES = ['$5','$10','$25','$50','$100','$250','$500','$1,000'];
  const [form, setForm] = useState({ asset:'Any', duration:'1 Week', stake:'$25', maxAccepts:1, desc:'' });
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 };

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {accepted && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:32, width:360, textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>⚔️</div>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Challenge Accepted!</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>vs <strong>{accepted.poster||accepted.from}</strong> · {accepted.duration} · {accepted.stake}</div>
            <button onClick={() => { setAccepted(null); setSubTab('my matches'); }} style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>View in My Matches</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', overflowX:'auto' }}>
        {['browse','my matches','invites','spectate','post challenge'].map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding:'11px 16px', background:'none', border:'none', borderBottom: subTab===t?'2px solid var(--accent)':'2px solid transparent', color: subTab===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: subTab===t?700:400, cursor:'pointer', whiteSpace:'nowrap', textTransform:'capitalize' }}>
            {t}{t==='invites'&&INVITES.length>0?` (${INVITES.length})`:''}
          </button>
        ))}
      </div>

      {subTab==='browse' && (
        <div style={{ padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Open challenges matched to your league (Silver ±1)</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {OPEN.map(c => {
              const full = c.accepts >= c.max;
              return (
                <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${lc(c.league)},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>{c.poster[0].toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.poster}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{c.winRate}% win · {c.wins}W · {c.league}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'var(--accent)' }}>{c.stake}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>entry</div>
                    </div>
                  </div>
                  <div style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', lineHeight:1.5 }}>{c.desc}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {[c.asset, c.duration, `${c.accepts}/${c.max} accepted`, c.posted].map((tag,i) => (
                      <span key={i} style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20, background:'var(--surface2)', color:i===2&&full?'var(--red)':i===2?'var(--green)':'var(--text-muted)', border:'1px solid var(--border)' }}>{tag}</span>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={() => setSubTab('spectate')} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>👁 Spectate</button>
                    <button onClick={() => !full && setAccepted(c)} disabled={full} style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:full?'var(--surface3)':'var(--accent)', color:full?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:full?'default':'pointer' }}>
                      {full?'Full':'Accept Challenge →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab==='my matches' && (
        <div style={{ padding:'20px' }}>
          {MY_MATCHES.length===0
            ? <div style={{ textAlign:'center', padding:'60px' }}><div style={{ fontSize:36, marginBottom:12 }}>⚔️</div><div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No active matches</div></div>
            : MY_MATCHES.map(m => (
              <div key={m.id} style={{ background:'var(--surface)', border:`1px solid ${m.status==='winning'?'var(--green-border)':'var(--red-border)'}`, borderRadius:12, padding:'16px', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>vs {m.opponent}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.timeLeft} left · {m.stake}</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>You</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:m.myPnl.startsWith('+')?'var(--green)':'var(--red)' }}>{m.myPnl}</div>
                  </div>
                  <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px', textAlign:'center' }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>{m.opponent}</div>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:m.oppPnl.startsWith('+')?'var(--green)':'var(--red)' }}>{m.oppPnl}</div>
                  </div>
                </div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.asset} · {m.duration} · Currently <strong style={{ color:m.status==='winning'?'var(--green)':'var(--red)' }}>{m.status}</strong></div>
              </div>
            ))
          }
        </div>
      )}

      {subTab==='invites' && (
        <div style={{ padding:'20px' }}>
          {INVITES.length===0
            ? <div style={{ textAlign:'center', padding:'60px' }}><div style={{ fontSize:36, marginBottom:12 }}>📬</div><div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'var(--text)' }}>No pending invites</div></div>
            : INVITES.map(inv => (
              <div key={inv.id} style={{ background:'var(--surface)', border:'1px solid var(--accent-border)', borderRadius:12, padding:'16px', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${lc(inv.league)},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color:'#fff' }}>{inv.from[0].toUpperCase()}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{inv.from} challenged you</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{inv.asset} · {inv.duration} · {inv.stake} · {inv.received}</div>
                  </div>
                </div>
                <div style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', marginBottom:10 }}>{inv.message}</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Decline</button>
                  <button onClick={() => setAccepted(inv)} style={{ flex:2, padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Accept →</button>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {subTab==='spectate' && (
        <div style={{ padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Live H2H matches</div>
          {LIVE.map(m => (
            <div key={m.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px', marginBottom:10, cursor:'pointer', transition:'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626' }} />
                  <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)' }}>LIVE · {m.asset}</span>
                </div>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>👁 {m.spectators} · {m.stake}</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:8 }}>
                <div><div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700 }}>{m.t1}</div><div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color:m.t1pnl.startsWith('+')?'var(--green)':'var(--red)' }}>{m.t1pnl}</div></div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>VS</span>
                <div style={{ textAlign:'right' }}><div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700 }}>{m.t2}</div><div style={{ fontFamily:'var(--font-mono)', fontSize:16, fontWeight:800, color:m.t2pnl.startsWith('+')?'var(--green)':'var(--red)' }}>{m.t2pnl}</div></div>
              </div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:8 }}>Started {m.startedAgo} ago · Click to watch</div>
            </div>
          ))}
        </div>
      )}

      {subTab==='post challenge' && (
        <div style={{ padding:'20px', maxWidth:520 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Post an Open Challenge</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>Other traders in your league can browse and accept.</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
            <div><label style={labelStyle}>Asset Class</label><select value={form.asset} onChange={e=>setF('asset',e.target.value)} style={inputStyle}>{ASSET_CLASSES.map(a=><option key={a}>{a}</option>)}</select></div>
            <div><label style={labelStyle}>Duration</label><select value={form.duration} onChange={e=>setF('duration',e.target.value)} style={inputStyle}>{DURATIONS.map(d=><option key={d}>{d}</option>)}</select></div>
            <div><label style={labelStyle}>Entry Stake</label><select value={form.stake} onChange={e=>setF('stake',e.target.value)} style={inputStyle}>{STAKES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label style={labelStyle}>Max Challengers</label><input type="number" min="1" max="10" value={form.maxAccepts} onChange={e=>setF('maxAccepts',parseInt(e.target.value)||1)} style={inputStyle} /></div>
          </div>
          <div style={{ marginBottom:14 }}><label style={labelStyle}>Rules & Description</label><textarea value={form.desc} onChange={e=>setF('desc',e.target.value)} placeholder="Asset restrictions, hold time requirements, COT setup rules..." rows={4} style={{...inputStyle,resize:'none'}} /></div>
          <div style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>⚠️ Matched with Silver league traders (±1). Entry stakes held in escrow.</div>
          <button onClick={() => form.desc.trim() && (setAccepted({from:'posted',duration:form.duration,stake:form.stake}),setSubTab('my matches'))} disabled={!form.desc.trim()} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:form.desc.trim()?'var(--accent)':'var(--surface3)', color:form.desc.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:form.desc.trim()?'pointer':'default' }}>Post Challenge</button>
        </div>
      )}
    </div>
  );
}

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

function LeaderboardTab() {
  const [period, setPeriod] = useState('1M');
  const [market, setMarket] = useState('All');
  const [bracket, setBracket] = useState('All');

  const PERIODS = ['1W','1M','3M','1Y','All Time'];
  const MARKETS = ['All','Forex','Commodities','Futures','Stocks','Crypto'];
  const BRACKETS = ['All','Micro','Standard','Pro','Institutional'];

  const DATA = {
    '1W': [
      { rank:1, name:'edgefinder',   pnl:'+31.2%', dollar:'+$8,400', trades:2, style:'Position', market:'Futures',     broker:'IBKR',   verified:true,  streak:'+', change:0 },
      { rank:2, name:'seasonalace',  pnl:'+18.7%', dollar:'+$4,200', trades:4, style:'Swing',    market:'Commodities', broker:'TD',     verified:true,  streak:'+', change:1 },
      { rank:3, name:'cotmaster2',   pnl:'+14.3%', dollar:'+$2,860', trades:6, style:'Swing',    market:'Any',         broker:'IBKR',   verified:true,  streak:'+', change:-1 },
      { rank:4, name:'alpharesearch',pnl:'+11.8%', dollar:'+$5,900', trades:3, style:'Macro',    market:'Forex',       broker:'Oanda',  verified:true,  streak:'+', change:2 },
      { rank:5, name:'fxswing99',    pnl:'+9.4%',  dollar:'+$940',   trades:8, style:'Swing',    market:'Forex',       broker:'Forex',  verified:true,  streak:' ', change:-1 },
      { rank:6, name:'graintrader99',pnl:'+8.1%',  dollar:'+$1,215', trades:5, style:'Position', market:'Commodities', broker:'ADM',    verified:true,  streak:'+', change:0 },
      { rank:7, name:'you',          pnl:'+6.3%',  dollar:'+$630',   trades:3, style:'Swing',    market:'Commodities', broker:'IBKR',   verified:true,  streak:'+', change:3 },
      { rank:8, name:'pittrader44',  pnl:'+5.9%',  dollar:'+$2,950', trades:11,style:'Day',      market:'Futures',     broker:'NinjaT', verified:false, streak:' ', change:-2 },
      { rank:9, name:'rookie_fx',    pnl:'+4.2%',  dollar:'+$210',   trades:14,style:'Day',      market:'Forex',       broker:'Forex',  verified:false, streak:' ', change:1 },
      { rank:10,name:'cotbasic',     pnl:'+3.8%',  dollar:'+$380',   trades:7, style:'Swing',    market:'Commodities', broker:'IBKR',   verified:true,  streak:' ', change:-1 },
    ],
  };

  const rows = DATA['1W'] || DATA['1W'];
  const filtered = rows.filter(r => (market==='All'||r.market===market) && (bracket==='All'));

  const medalColor = (rank) => rank===1?'#d97706':rank===2?'#6b7280':rank===3?'#b45309':'var(--text-muted)';
  const medalIcon  = (rank) => rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':null;

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>P&L Leaderboard</div>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Ranked by verified P&L%. Position, swing, and day traders compete on equal terms.</div>
      </div>

      {/* Your rank card */}
      <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:800, color:'var(--accent)' }}>#7</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>Your ranking this week</div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>+6.3% P&L · 3 trades · Commodities</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:'var(--green)' }}>+6.3%</div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--green)' }}>+3 spots this week</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:16, marginBottom:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Period</div>
          <div style={{ display:'flex', gap:4 }}>
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background: period===p?'var(--accent)':'transparent', color: period===p?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{p}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Market</div>
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {MARKETS.map(m => (
              <button key={m} onClick={() => setMarket(m)} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background: market===m?'var(--accent)':'transparent', color: market===m?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{m}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Account Size</div>
          <div style={{ display:'flex', gap:4 }}>
            {BRACKETS.map(b => (
              <button key={b} onClick={() => setBracket(b)} style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background: bracket===b?'var(--accent)':'transparent', color: bracket===b?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{b}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'44px 1fr 90px 80px 60px 60px', gap:0, padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--surface2)' }}>
          {['#','Trader','P&L %','Dollar','Trades','Style'].map(h => (
            <div key={h} style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
          ))}
        </div>
        {/* Rows */}
        {filtered.map((r, i) => {
          const isYou = r.name === 'you';
          return (
            <div key={r.rank} style={{ display:'grid', gridTemplateColumns:'44px 1fr 90px 80px 60px 60px', gap:0, padding:'12px 16px', borderBottom: i<filtered.length-1?'1px solid var(--border)':'none', background: isYou?'var(--accent-bg)':'transparent', transition:'background 0.1s', cursor:'pointer' }}
              onMouseEnter={e => !isYou && (e.currentTarget.style.background='var(--surface2)')}
              onMouseLeave={e => !isYou && (e.currentTarget.style.background='transparent')}>
              {/* Rank */}
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                {medalIcon(r.rank)
                  ? <span style={{ fontSize:16 }}>{medalIcon(r.rank)}</span>
                  : <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:medalColor(r.rank) }}>#{r.rank}</span>
                }
                {r.change !== 0 && <span style={{ fontSize:9, color:r.change>0?'var(--green)':'var(--red)' }}>{r.change>0?'▲':'▼'}</span>}
              </div>
              {/* Trader */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${isYou?'#4f46e5':'#6b7280'},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>{r.name[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight: isYou?700:600, color: isYou?'var(--accent)':'var(--text)' }}>{r.name}{isYou?' (you)':''} {r.verified&&<span style={{ color:'var(--accent)', fontSize:10 }}>✓</span>}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{r.market} · {r.broker}</div>
                </div>
              </div>
              {/* P&L % */}
              <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:'var(--green)', display:'flex', alignItems:'center' }}>{r.pnl}</div>
              {/* Dollar */}
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, color:'var(--green)', display:'flex', alignItems:'center' }}>{r.dollar}</div>
              {/* Trades */}
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{r.trades}</div>
              {/* Style */}
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>{r.style}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:12, fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textAlign:'center', lineHeight:1.6 }}>
        Rankings update every 15 minutes · Broker-verified accounts only · P&L% calculated on capital deployed per trade
      </div>
    </div>
  );
}

export default function CompeteTab({ currentUserId }) {
  const PURPLE = '#4f46e5';
  const [tab, setTab] = useState('compete');

  const navTabs = [
    { key: 'compete', label: 'Compete' },
    { key: 'groups', label: 'Group contests' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'history', label: 'History' },
  ];

  const winRate = 68;
  const rank = 7;
  const winnings = 840;

  const topTraders = [
    { rank: 1, name: 'goldtrader', pct: '+18.4%', color: '#d97706' },
    { rank: 2, name: 'cotmaster', pct: '+14.2%', color: '#0891b2' },
    { rank: 3, name: 'swingking', pct: '+11.8%', color: '#16a34a' },
  ];

  const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' };
  const statBox = { background: 'var(--surface2)', borderRadius: 8, padding: '10px 12px' };
  const btnP = { padding: '8px 16px', background: PURPLE, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', flex: 1 };
  const btnO = { padding: '8px 16px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)', flex: 1 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font)' }}>
      <div style={{ background: PURPLE, padding: '0 20px', display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 299 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {navTabs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: '11px 18px', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid #fff' : '2px solid transparent', color: '#fff', opacity: tab === key ? 1 : 0.75, fontFamily: 'var(--font)', fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1 }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
          <button onClick={() => setTab('groups')} style={{ padding: '5px 12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>Browse challenges</button>
          <button style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>+ Challenge trader</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'compete' && (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Head-to-head</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489' }}>1 active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--surface2)', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>D</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>you <span style={{ color: '#16a34a' }}>+4.2%</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Winning · 3d left</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface3)', borderRadius: 20, padding: '3px 8px' }}>VS</span>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>trader99 <span style={{ color: 'var(--text-muted)' }}>+2.8%</span></div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>$50 stakes</div>
                  </div>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>T</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnP} onClick={() => setTab('h2h')}>View match</button>
                  <button style={btnO}>New challenge</button>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Group contest</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EAF3DE', color: '#27500A' }}>Joined</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--surface2)', borderRadius: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>COT Swing Challenge</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>12 traders · 5 days left</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 600, color: PURPLE }}>#3</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>$500 pool</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={btnP} onClick={() => setTab('groups')}>View rankings</button>
                  <button style={btnO} onClick={() => setTab('groups')}>Browse contests</button>
                </div>
              </div>
            </div>

            <div style={{ width: 220, borderLeft: '1px solid var(--border)', padding: 16, background: 'var(--surface)', flexShrink: 0, overflowY: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Your stats</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>All time</div>
              <div style={{ ...statBox, marginBottom: 8 }}>
                <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>{winRate}%</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Win rate</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={statBox}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>#{rank}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Global rank</div>
                </div>
                <div style={statBox}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>${winnings}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Winnings</div>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Top 3 this week</div>
              {topTraders.map(t => (
                <div key={t.rank} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: PURPLE, width: 20 }}>#{t.rank}</span>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{t.name[0].toUpperCase()}</div>
                  <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{t.name}</span>
                  <span style={{ fontSize: 11, color: '#16a34a' }}>{t.pct}</span>
                </div>
              ))}
              <button style={{ width: '100%', marginTop: 12, padding: '8px', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }} onClick={() => setTab('leaderboard')}>Full leaderboard →</button>
            </div>
          </div>
        )}
        {tab === 'h2h' && <div style={{ padding: 20 }}><H2HTab /></div>}
        {tab === 'groups' && <div style={{ padding: 20 }}><GroupBattleTab /></div>}
        {tab === 'leaderboard' && <div style={{ padding: 20 }}><LeaderboardTab /></div>}
        {tab === 'history' && <div style={{ padding: 20 }}><MatchHistory /></div>}
      </div>
    </div>
  );
}
