'use client';
import { useState } from 'react';

const MOCK_CONTESTS = []

const MY_CONTESTS = [];

const ASSET_CLASSES = ['Any','Forex','Commodities','Futures','Stocks','Crypto'];
const DURATIONS = ['1 Day','3 Days','1 Week','2 Weeks','1 Month','3 Months'];
const STAKES = ['$10','$25','$50','$100','$250','$500'];
const STRUCTURES = ['Winner Take All','Top 2 Split','Top 3 Split','Top 5 Split'];

function ContestCard({ c, onEnter, onSpectate }) {
  const lc = c.host[0].toUpperCase();
  const colors = ['#534AB7','#0891b2','#d97706','#16a34a','#dc2626','#7c3aed'];
  const color = colors[c.id % colors.length];
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
        <div style={{ width:38, height:38, borderRadius:'50%', background:`linear-gradient(135deg,${color},${color}aa)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>{lc}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.host}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.groupsEntered}/{c.maxGroups} groups entered</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:20, fontWeight:700, color:'var(--accent)' }}>{c.prizePool}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>prize pool</div>
        </div>
      </div>
      <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:10 }}>{c.name}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
        {[c.asset, c.duration, c.entryFee+'/group', c.started?c.endsIn:'Starts '+c.endsIn].map((t,i) => (
          <span key={i} style={{ fontFamily:'var(--font)', fontSize:11, padding:'3px 9px', borderRadius:20, border:'1px solid var(--border)', color:'var(--text-muted)' }}>{t}</span>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={() => onSpectate(c)} style={{ flex:1, padding:'8px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>👁 Spectate</button>
        <button onClick={() => onEnter(c)} disabled={c.groupsEntered >= c.maxGroups} style={{ flex:2, padding:'8px', borderRadius:8, border:'none', background: c.groupsEntered >= c.maxGroups ? 'var(--surface2)' : 'var(--accent)', color: c.groupsEntered >= c.maxGroups ? 'var(--text-muted)' : '#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor: c.groupsEntered >= c.maxGroups ? 'not-allowed' : 'pointer' }}>
          {c.groupsEntered >= c.maxGroups ? 'Full' : 'Enter with group →'}
        </button>
      </div>
    </div>
  );
}

export default function GroupContest({ currentUserId, subTab = 'my contests', setSubTab }) {
  // subTab controlled by parent
  const [filterAsset, setFilterAsset] = useState('Any');
  const [entered, setEntered] = useState(null);
  const [spectating, setSpectating] = useState(null);
  const [form, setForm] = useState({ name:'', asset:'Any', duration:'1 Month', fee:'$50', maxGroups:10, structure:'Top 3 Split', minTrades:10, desc:'' });
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  const TABS = ['my contests','browse','rankings','spectate','create contest'];
  const filtered = MOCK_CONTESTS.filter(c => filterAsset === 'Any' || c.asset === filterAsset);

  const tabStyle = (t) => ({ padding:'11px 16px', background:'none', border:'none', borderBottom: subTab===t?'2px solid var(--accent)':'2px solid transparent', color: subTab===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: subTab===t?700:400, cursor:'pointer', whiteSpace:'nowrap', textTransform:'capitalize' });
  const btn = (txt, onClick, primary=true) => <button onClick={onClick} style={{ flex:1, padding:'9px 14px', background: primary?'var(--accent)':'transparent', color: primary?'#fff':'var(--text-muted)', border: primary?'none':'1px solid var(--border)', borderRadius:8, fontFamily:'var(--font)', fontSize:13, fontWeight:primary?700:500, cursor:'pointer' }}>{txt}</button>;
  const sbox = (val, lbl) => <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 12px', flex:1, textAlign:'center' }}><div style={{ fontFamily:'var(--font)', fontSize:20, fontWeight:700, color:'var(--text)' }}>{val}</div><div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{lbl}</div></div>;

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {/* Entered modal */}
      {entered && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:32, width:360, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🏆</div>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Contest entered!</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>{entered.name} · {entered.duration} · {entered.entryFee}/group</div>
            <button onClick={() => { setEntered(null); setSubTab('my contests'); }} style={{ width:'100%', padding:11, borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>View in My Contests →</button>
          </div>
        </div>
      )}

      {/* Sub-tab bar */}
      
      {/* MY CONTESTS */}
      {subTab === 'my contests' && (
        <div style={{ padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>My Contests</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>1 active · 1 completed</div>
          {MY_CONTESTS.map(c => (
            <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>Your group: {c.group} · {c.status === 'active' ? c.daysLeft+'d remaining' : 'Completed'}</div>
                </div>
                <span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background: c.status==='active'?'#EAF3DE':'var(--surface2)', color: c.status==='active'?'#27500A':'var(--text-muted)', fontWeight:600 }}>{c.status==='active'?`Active · #${c.rank}`:'Completed'}</span>
              </div>
              {c.status === 'active' && (
                <>
                  <div style={{ display:'flex', gap:10, marginBottom:14 }}>
                    {sbox(`#${c.rank}`,'Current rank')}
                    {sbox(c.pnl,'Group P&L')}
                    {sbox(c.prize,'Prize if top 3')}
                    {sbox(c.trades,'Trades logged')}
                  </div>
                  <div style={{ height:5, background:'var(--surface2)', borderRadius:3, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ height:'100%', width:c.pct+'%', background:'var(--accent)', borderRadius:3 }} />
                  </div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>{c.pct}% complete</div>
                  <div style={{ display:'flex', gap:8 }}>{btn('View live standings →', () => setSubTab('rankings'))}{btn('Leave contest', ()=>{}, false)}</div>
                </>
              )}
              {c.status === 'completed' && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Finished #{c.rank} · {c.pnl} P&L</div>
                  <span style={{ fontSize:13, fontWeight:700, color:'#27500A' }}>{c.prize}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* BROWSE */}
      {subTab === 'browse' && (
        <div style={{ padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)' }}>Group Contest Marketplace</div>
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{MOCK_CONTESTS.length} open contests · Enter with your group</div>
            </div>
            <button onClick={() => setSubTab('create contest')} style={{ padding:'9px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Create Contest</button>
          </div>
          <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
            {ASSET_CLASSES.map(a => (
              <button key={a} onClick={() => setFilterAsset(a)} style={{ padding:'4px 12px', borderRadius:20, border:'1px solid var(--border)', background: filterAsset===a?'var(--accent)':'transparent', color: filterAsset===a?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:500, cursor:'pointer' }}>{a}</button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {filtered.map(c => <ContestCard key={c.id} c={c} onEnter={setEntered} onSpectate={setSpectating} />)}
          </div>
        </div>
      )}

      {/* RANKINGS */}
      {subTab === 'rankings' && (
        <div style={{ padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)' }}>Live rankings</div>
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>May Commodities Cup · 18d remaining</div>
            </div>
            <select style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>
              {MOCK_CONTESTS.map(c => <option key={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
            <div style={{ display:'grid', gridTemplateColumns:'36px 1fr 80px 70px 70px', gap:10, padding:'10px 16px', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
              <div>#</div><div>Group</div><div style={{ textAlign:'right' }}>P&L</div><div style={{ textAlign:'right' }}>Trades</div><div style={{ textAlign:'right' }}>Prize</div>
            </div>
            {MOCK_CONTESTS[0].standings.map((s,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'36px 1fr 80px 70px 70px', gap:10, padding:'12px 16px', background: s.isYou?'#EEEDFE':'transparent', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--accent)' }}>{s.rank}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight: s.isYou?700:400, color: s.isYou?'#3C3489':'var(--text)' }}>{s.name}{s.isYou?' (you)':''}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'#16a34a', textAlign:'right' }}>{s.pnl}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'right' }}>{s.trades}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, color: MOCK_CONTESTS[0].prizes[i]?'var(--accent)':'var(--text-muted)', fontWeight: MOCK_CONTESTS[0].prizes[i]?600:400, textAlign:'right' }}>{MOCK_CONTESTS[0].prizes[i]||'—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPECTATE */}
      {subTab === 'spectate' && (
        <div style={{ padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Live contests</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>2 live · 1 starting soon</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {MOCK_CONTESTS.filter(c => c.started).map(c => (
              <div key={c.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{c.name}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.groupsEntered} groups · {c.endsIn} left</div>
                  </div>
                  <span style={{ fontSize:11, padding:'3px 9px', borderRadius:20, background:'#EAF3DE', color:'#27500A', fontWeight:600 }}>Live</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
                  {c.standings.slice(0,3).map((s,i) => {
                    const pct = Math.max(20, 100 - i*25);
                    return (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'var(--font)', fontSize:12, color: s.isYou?'var(--accent)':'var(--text-muted)', width:90, flexShrink:0 }}>{s.name}</span>
                        <div style={{ flex:1, height:5, background:'var(--surface2)', borderRadius:3, overflow:'hidden' }}><div style={{ height:'100%', width:pct+'%', background:'var(--accent)', borderRadius:3 }} /></div>
                        <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'#16a34a', width:44, textAlign:'right' }}>{s.pnl}</span>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setSpectating(c)} style={{ width:'100%', padding:'9px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Watch live →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE CONTEST */}
      {subTab === 'create contest' && (
        <div style={{ padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:4 }}>Create a group contest</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>Set the rules, prize structure, and entry fee. Other groups join to compete.</div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Contest name</label>
                <input value={form.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. COT Monthly Commodities Cup" style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
              </div>
              {[['Asset class','asset',ASSET_CLASSES],['Duration','duration',DURATIONS],['Entry fee / group','fee',STAKES],['Prize structure','structure',STRUCTURES]].map(([lbl,key,opts]) => (
                <div key={key}>
                  <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>{lbl}</label>
                  <select value={form[key]} onChange={e=>setF(key,e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }}>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Max groups</label>
                <input type="number" value={form.maxGroups} onChange={e=>setF('maxGroups',e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Min trades required</label>
                <input type="number" value={form.minTrades} onChange={e=>setF('minTrades',e.target.value)} style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Rules / description</label>
                <textarea value={form.desc} onChange={e=>setF('desc',e.target.value)} rows={3} placeholder="Describe rules, allowed assets, and any special conditions..." style={{ width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ background:'var(--surface2)', borderRadius:8, padding:'12px 14px', marginBottom:14, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>
              Estimated prize pool: <strong style={{ color:'var(--text)' }}>{`$${parseInt(form.fee.replace('$','')) * parseInt(form.maxGroups)}`}</strong> ({form.maxGroups} groups × {form.fee})
            </div>
            <button style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:'pointer' }}>Create contest →</button>
          </div>
        </div>
      )}
    </div>
  );
}
