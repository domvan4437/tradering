'use client';
import { useState } from 'react';

const ASSET_CLASSES = ['Open (Any)','Forex','Commodities','Futures','Stocks','Crypto'];
const DURATIONS = ['1 Day','3 Days','1 Week','2 Weeks','1 Month','3 Months','6 Months','Custom'];
const PRIZE_STRUCTURES = ['Winner Take All','Top 2 Split','Top 3 Split','Top 5 Split','Custom %'];

const MOCK_CONTESTS = [
  {
    id:1, name:'May Commodities Cup', host:'cotmaster', asset:'Commodities',
    duration:'1 Month', endsIn:'18d 4h', entryFee:'$50/group',
    prizePool:'$4,200', prizeStructure:'Top 3 Split', prizes:['$2,100','$1,260','$840'],
    maxGroups:15, groups:9, minTrades:10, public:true, started:true,
    groups_list:[
      { name:'COT Masters', members:6, pnl:'+12.4%', rank:1, trades:24 },
      { name:'Grain Alliance', members:5, pnl:'+8.1%', rank:2, trades:18 },
      { name:'Metal Bulls', members:7, pnl:'+5.7%', rank:3, trades:31 },
      { name:'Your Group', members:4, pnl:'+3.2%', rank:4, trades:12, isYou:true },
    ],
  },
  {
    id:2, name:'Weekly Forex Sprint', host:'fxswing99', asset:'Forex',
    duration:'1 Week', endsIn:'3d 12h', entryFee:'$25/group',
    prizePool:'$750', prizeStructure:'Top 2 Split', prizes:['$500','$250'],
    maxGroups:8, groups:5, minTrades:5, public:true, started:true,
    groups_list:[
      { name:'Pip Masters', members:4, pnl:'+6.8%', rank:1, trades:15 },
      { name:'FX Warriors', members:3, pnl:'+4.2%', rank:2, trades:11 },
    ],
  },
];

function PrizeBar({ prizes, structure }) {
  const colors = ['#d97706','#6b7280','#b45309','#4f46e5','#0891b2'];
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:6 }}>
      {prizes.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)' }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:colors[i], fontWeight:700 }}>#{i+1}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var(--text)' }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function ContestCard({ contest, onEnter, onSpectate }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((contest.groups/contest.maxGroups)*100);
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ height:3, background:`linear-gradient(90deg,var(--accent),#7c3aed)` }} />
      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{contest.name}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Hosted by {contest.host} · {contest.asset} · {contest.duration}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:'var(--accent)' }}>{contest.prizePool}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>prize pool</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:14 }}>
          {[
            { label:'Entry', value:contest.entryFee },
            { label:'Groups', value:`${contest.groups}/${contest.maxGroups}` },
            { label:'Ends in', value:contest.endsIn },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--text)' }}>{s.value}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{contest.prizeStructure}</span>
            <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{pct}% full</span>
          </div>
          <div style={{ height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:'var(--accent)', borderRadius:2 }} />
          </div>
          <PrizeBar prizes={contest.prizes} structure={contest.prizeStructure} />
        </div>

        {/* Live leaderboard preview */}
        {expanded && (
          <div style={{ marginTop:14, border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
            <div style={{ padding:'8px 12px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)' }}>LIVE STANDINGS</div>
            {contest.groups_list?.map((g,i) => (
              <div key={g.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderBottom: i<contest.groups_list.length-1?'1px solid var(--border)':'none', background: g.isYou?'var(--accent-bg)':'transparent' }}>
                <div style={{ width:22, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color: i===0?'#d97706':i===1?'#6b7280':i===2?'#b45309':'var(--text-muted)', textAlign:'center' }}>#{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color: g.isYou?'var(--accent)':'var(--text)' }}>{g.name}{g.isYou?' (you)':''}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.members} members · {g.trades} trades</div>
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color: g.pnl.startsWith('+')?'var(--green)':'var(--red)' }}>{g.pnl}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {expanded ? 'Hide Standings' : 'Live Standings'}
          </button>
          <button onClick={() => onSpectate && onSpectate(contest)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            👁 Spectate
          </button>
          <button onClick={() => onEnter(contest)} style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            Enter Contest →
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateContestModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name:'', asset:'Open (Any)', duration:'1 Month', customDuration:'',
    entryFee:'50', maxGroups:'15', minTrades:'10',
    prizeStructure:'Top 3 Split', customPrizes:'', public:true, description:'',
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const inputStyle = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 };

  const estimatedPool = form.entryFee && form.maxGroups ? `$${(parseFloat(form.entryFee||0)*parseInt(form.maxGroups||0)).toLocaleString()}` : '$0';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:520, maxWidth:'92vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Create Group Contest</div>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>Everything is customizable to your trading style and community.</div>

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Contest Name</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. May Commodities Cup" style={inputStyle} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={labelStyle}>Asset Class</label>
            <select value={form.asset} onChange={e=>set('asset',e.target.value)} style={inputStyle}>
              {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration</label>
            <select value={form.duration} onChange={e=>set('duration',e.target.value)} style={inputStyle}>
              {DURATIONS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {form.duration==='Custom' && (
            <div style={{ gridColumn:'1/-1' }}>
              <label style={labelStyle}>Custom Duration</label>
              <input value={form.customDuration} onChange={e=>set('customDuration',e.target.value)} placeholder="e.g. 45 days" style={inputStyle} />
            </div>
          )}
          <div>
            <label style={labelStyle}>Entry Fee Per Group ($)</label>
            <input type="number" min="0" value={form.entryFee} onChange={e=>set('entryFee',e.target.value)} placeholder="50" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Max Groups</label>
            <input type="number" min="2" value={form.maxGroups} onChange={e=>set('maxGroups',e.target.value)} placeholder="15" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Min Trades Required</label>
            <input type="number" min="1" value={form.minTrades} onChange={e=>set('minTrades',e.target.value)} placeholder="10" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Prize Structure</label>
            <select value={form.prizeStructure} onChange={e=>set('prizeStructure',e.target.value)} style={inputStyle}>
              {PRIZE_STRUCTURES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {form.prizeStructure==='Custom %' && (
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Custom Prize Split (e.g. "50%, 30%, 20%")</label>
            <input value={form.customPrizes} onChange={e=>set('customPrizes',e.target.value)} placeholder="50%, 30%, 20%" style={inputStyle} />
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={labelStyle}>Description & Rules</label>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the contest, any specific rules, trading requirements..." rows={3} style={{...inputStyle, resize:'none'}} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <button onClick={() => set('public',!form.public)} style={{ width:40, height:22, borderRadius:11, background: form.public?'var(--accent)':'var(--surface2)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
            <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form.public?20:3, transition:'left 0.2s' }} />
          </button>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>{form.public?'Public contest — anyone can join':'Invite only — share link to invite groups'}</span>
        </div>

        {/* Estimated pool preview */}
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:10, padding:'12px 14px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', marginBottom:4 }}>Estimated Prize Pool</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:'var(--accent)' }}>{estimatedPool}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>at {form.maxGroups} groups × ${form.entryFee}/group</div>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={() => { onCreate(form); onClose(); }} disabled={!form.name.trim()} style={{ flex:2, padding:'11px', borderRadius:10, border:'none', background: form.name.trim()?'var(--accent)':'var(--surface3)', color: form.name.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor: form.name.trim()?'pointer':'default' }}>Create Contest</button>
        </div>
      </div>
    </div>
  );
}

export default function GroupContest({ onSpectate }) {
  const [contests, setContests] = useState(MOCK_CONTESTS);
  const [showCreate, setShowCreate] = useState(false);
  const [entered, setEntered] = useState(null);

  return (
    <div style={{ fontFamily:'var(--font)', padding:'20px' }}>
      {showCreate && <CreateContestModal onClose={() => setShowCreate(false)} onCreate={form => setContests(p => [{
        id:Date.now(), name:form.name, host:'you', asset:form.asset,
        duration:form.duration==='Custom'?form.customDuration:form.duration,
        endsIn:'Upcoming', entryFee:`$${form.entryFee}/group`,
        prizePool:'$0 (filling)', prizeStructure:form.prizeStructure,
        prizes:['TBD'], maxGroups:parseInt(form.maxGroups), groups:0,
        minTrades:parseInt(form.minTrades), public:form.public, started:false, groups_list:[],
      },...p])} />}

      {entered && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:32, width:360, textAlign:'center', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Your group is entered!</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{entered.name} · {entered.prizePool} pool</div>
            <button onClick={() => setEntered(null)} style={{ width:'100%', padding:'11px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Got it</button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)' }}>Group Open Contests</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Groups compete for massive prize pools · Fully customizable</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding:'9px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Create Contest</button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {contests.map(c => <ContestCard key={c.id} contest={c} onEnter={setEntered} onSpectate={onSpectate} />)}
      </div>
    </div>
  );
}
