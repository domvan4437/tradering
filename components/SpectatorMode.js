'use client';
import { useState, useEffect } from 'react';

const MOCK_LIVE_MATCHES = [
  {
    id:1, type:'H2H', status:'live', asset:'Gold (GC=F)', startedAgo:'2h 14m ago',
    trader1:{ name:'seasonalace', avatar:'S', grad:'linear-gradient(135deg,#d97706,#b45309)', pnl:'+8.4%', pnlDollar:'+$420', trades:3, league:'gold' },
    trader2:{ name:'fxswing99',   avatar:'F', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', pnl:'-2.1%', pnlDollar:'-$105', trades:2, league:'silver' },
    stake:'$50', spectators:14,
    feed:[
      { time:'14:22', actor:'seasonalace', action:'Opened Long Gold', detail:'Entry $3,241 · 2 contracts', positive:true },
      { time:'13:45', actor:'fxswing99',   action:'Closed Short Gold', detail:'Exit $3,198 · -$105 loss', positive:false },
      { time:'12:01', actor:'seasonalace', action:'Closed Long Silver', detail:'Exit $32.14 · +$180 profit', positive:true },
      { time:'11:30', actor:'fxswing99',   action:'Opened Short Gold', detail:'Entry $3,201 · 1 contract', positive:false },
      { time:'10:15', actor:'seasonalace', action:'Opened Long Silver', detail:'Entry $31.90 · 3 contracts', positive:true },
    ],
    reactions:{ fire:42, rocket:18, eyes:31, thumbsdown:7 },
  },
  {
    id:2, type:'Group Battle', status:'live', asset:'Forex Majors', startedAgo:'1d 6h ago',
    trader1:{ name:'COT Masters', avatar:'C', grad:'linear-gradient(135deg,#16a34a,#15803d)', pnl:'+12.4%', pnlDollar:'+$2,480', trades:24, league:'gold', isGroup:true },
    trader2:{ name:'Grain Alliance', avatar:'G', grad:'linear-gradient(135deg,#0891b2,#0e7490)', pnl:'+8.1%', pnlDollar:'+$1,620', trades:18, league:'silver', isGroup:true },
    stake:'$200/team', spectators:67,
    feed:[
      { time:'15:01', actor:'COT Masters', action:'Member closed EUR/USD Long', detail:'+2.1% · +$420', positive:true },
      { time:'14:44', actor:'Grain Alliance', action:'Member opened USD/JPY Short', detail:'Entry 155.20', positive:true },
    ],
    reactions:{ fire:89, rocket:45, eyes:112, thumbsdown:3 },
  },
];

const REACTION_EMOJIS = [
  { key:'fire',      emoji:'🔥', label:'Fire' },
  { key:'rocket',    emoji:'🚀', label:'Rocket' },
  { key:'eyes',      emoji:'👀', label:'Eyes' },
  { key:'thumbsdown',emoji:'👎', label:'Down' },
];

function PnlBar({ pnl1, pnl2, name1, name2, color1, color2 }) {
  const v1 = parseFloat(pnl1);
  const v2 = parseFloat(pnl2);
  const total = Math.abs(v1) + Math.abs(v2) || 1;
  const pct1 = Math.round((Math.abs(v1)/total)*100);
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:color1 }}>{name1}</span>
        <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:color2 }}>{name2}</span>
      </div>
      <div style={{ height:8, background:'var(--surface2)', borderRadius:4, overflow:'hidden', display:'flex' }}>
        <div style={{ width:`${pct1}%`, background:color1, transition:'width 0.8s' }} />
        <div style={{ flex:1, background:color2 }} />
      </div>
    </div>
  );
}

function LiveTicker({ feed }) {
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
      <div style={{ padding:'8px 12px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:6 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626', animation:'pulse 1.5s infinite' }} />
        <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)' }}>LIVE TRADE FEED</span>
      </div>
      {feed.map((f,i) => (
        <div key={i} style={{ display:'flex', gap:10, padding:'10px 12px', borderBottom: i<feed.length-1?'1px solid var(--border)':'none', alignItems:'flex-start' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', flexShrink:0, marginTop:1 }}>{f.time}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:1 }}>{f.actor}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>{f.action}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color: f.positive?'var(--green)':'var(--red)' }}>{f.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchViewer({ match, onBack }) {
  const [reactions, setReactions] = useState(match.reactions);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([
    { id:1, user:'grain_guy', text:'seasonalace holding steady, classic setup', time:'5m ago' },
    { id:2, user:'cotbasic', text:'fxswing needs to cut that loss soon', time:'2m ago' },
  ]);
  const [ticker, setTicker] = useState(true);

  const addReaction = (key) => setReactions(p => ({...p,[key]:p[key]+1}));
  const addComment = () => {
    if(!comment.trim()) return;
    setComments(p => [...p, { id:Date.now(), user:'you', text:comment, time:'now' }]);
    setComment('');
  };

  const t1 = match.trader1, t2 = match.trader2;
  const t1Up = parseFloat(t1.pnl) > 0;
  const t2Up = parseFloat(t2.pnl) > 0;

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, marginBottom:16, padding:0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Spectator Lobby
      </button>

      {/* Match header */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px', marginBottom:16, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#dc2626,transparent,#dc2626)' }} />
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:16 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626' }} />
          <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#dc2626' }}>LIVE · {match.type} · {match.asset}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>· {match.spectators} watching</span>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:12, alignItems:'center', marginBottom:16 }}>
          {/* Trader 1 */}
          <div style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:t1.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'#fff', margin:'0 auto 8px' }}>{t1.avatar}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{t1.name}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color: t1Up?'var(--green)':'var(--red)' }}>{t1.pnl}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color: t1Up?'var(--green)':'var(--red)' }}>{t1.pnlDollar}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{t1.trades} trades</div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'var(--text-muted)' }}>VS</div>
          {/* Trader 2 */}
          <div style={{ textAlign:'center' }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:t2.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:18, fontWeight:800, color:'#fff', margin:'0 auto 8px' }}>{t2.avatar}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{t2.name}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color: t2Up?'var(--green)':'var(--red)' }}>{t2.pnl}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color: t2Up?'var(--green)':'var(--red)' }}>{t2.pnlDollar}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{t2.trades} trades</div>
          </div>
        </div>

        <PnlBar pnl1={t1.pnl} pnl2={t2.pnl} name1={t1.name} name2={t2.name} color1='var(--green)' color2='var(--red)' />

        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>
          <span>Stake: {match.stake}</span>
          <span>Started {match.startedAgo}</span>
        </div>
      </div>

      {/* Reactions */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {REACTION_EMOJIS.map(r => (
          <button key={r.key} onClick={() => addReaction(r.key)} style={{ flex:1, padding:'8px 4px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            <span style={{ fontSize:18 }}>{r.emoji}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color:'var(--text)' }}>{reactions[r.key]}</span>
          </button>
        ))}
      </div>

      {/* Live feed */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)' }}>Trade Activity</span>
          <button onClick={() => setTicker(!ticker)} style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>{ticker?'Hide':'Show'}</button>
        </div>
        {ticker && <LiveTicker feed={match.feed} />}
      </div>

      {/* Live chat */}
      <div style={{ border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ padding:'8px 12px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)' }}>SPECTATOR CHAT</div>
        <div style={{ maxHeight:160, overflowY:'auto', padding:'8px 0' }}>
          {comments.map(c => (
            <div key={c.id} style={{ padding:'6px 12px', display:'flex', gap:8 }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:800, color:'var(--accent)', flexShrink:0 }}>{c.user[0].toUpperCase()}</div>
              <div>
                <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--accent)' }}>{c.user} </span>
                <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>{c.text}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginLeft:6 }}>{c.time}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'8px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addComment()} placeholder="Chat with spectators..." style={{ flex:1, padding:'7px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
          <button onClick={addComment} disabled={!comment.trim()} style={{ padding:'7px 14px', background: comment.trim()?'var(--accent)':'var(--surface2)', color: comment.trim()?'#fff':'var(--text-muted)', border:'none', borderRadius:20, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor: comment.trim()?'pointer':'default' }}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default function SpectatorMode() {
  const [viewing, setViewing] = useState(null);
  const [filter, setFilter] = useState('All');
  const matches = MOCK_LIVE_MATCHES.filter(m => filter==='All' || m.type===filter);

  if(viewing) return <MatchViewer match={viewing} onBack={() => setViewing(null)} />;

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Spectator Mode</div>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Watch live matches, react in real time, and learn from the best</div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['All','H2H','Group Battle','Bracket','Contest'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background: filter===f?'var(--accent)':'transparent', color: filter===f?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{f}</button>
        ))}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {matches.map(m => (
          <div key={m.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', cursor:'pointer', transition:'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
            onClick={() => setViewing(m)}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#dc2626' }} />
                <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text)' }}>{m.type} · {m.asset}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>👁 {m.spectators}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.stake} stake</span>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:m.trader1.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{m.trader1.avatar}</div>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.trader1.name}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color: parseFloat(m.trader1.pnl)>0?'var(--green)':'var(--red)' }}>{m.trader1.pnl}</div>
                </div>
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--text-muted)' }}>VS</span>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexDirection:'row-reverse' }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:m.trader2.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:800, color:'#fff', flexShrink:0 }}>{m.trader2.avatar}</div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.trader2.name}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color: parseFloat(m.trader2.pnl)>0?'var(--green)':'var(--red)' }}>{m.trader2.pnl}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
