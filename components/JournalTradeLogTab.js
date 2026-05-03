'use client';
import { useState, useEffect } from 'react';

const PURPLE = '#4f46e5';
const STORAGE_KEY = 'tr_tradelog_v2';
const DEFAULT_FIELDS = ['Date','Asset','Direction','Entry','Exit','P&L','Size','Setup','Notes'];

function loadLog() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch { return {}; } }
function saveLog(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

function parsePnl(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[$,%\s]/g,''));
  return isNaN(n) ? null : n;
}
function pnlColor(val) { const n=parsePnl(val); if(n===null) return 'var(--text)'; return n>0?'var(--green)':n<0?'var(--red)':'var(--text-muted)'; }
function formatPnl(val) { const n=parsePnl(val); if(n===null) return val||'—'; return (n>=0?'+':'')+n.toFixed(2); }

function calcStats(trades) {
  const pnls = trades.map(t=>parsePnl(t.fields['P&L']||t.fields['pnl']||'')).filter(n=>n!==null);
  const total = pnls.reduce((a,b)=>a+b,0);
  const wins = pnls.filter(n=>n>0), losses = pnls.filter(n=>n<0);
  const winRate = pnls.length?Math.round((wins.length/pnls.length)*100):null;
  const avgWin = wins.length?wins.reduce((a,b)=>a+b,0)/wins.length:null;
  const avgLoss = losses.length?losses.reduce((a,b)=>a+b,0)/losses.length:null;
  const profitFactor = losses.length&&avgLoss?Math.abs(wins.reduce((a,b)=>a+b,0)/losses.reduce((a,b)=>a+b,0)):null;
  const largest = pnls.length?Math.max(...pnls):null;
  const worstDraw = pnls.length?Math.min(...pnls):null;
  const streak = (()=>{ let cur=0,best=0; for(const p of pnls){if(p>0){cur++;best=Math.max(best,cur);}else cur=0;} return best; })();
  return { total, winRate, avgWin, avgLoss, profitFactor, largest, worstDraw, streak, count:trades.length, winCount:wins.length, lossCount:losses.length };
}

function CalendarView({ trades }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const y=month.getFullYear(), m=month.getMonth();
  const daysInMonth=new Date(y,m+1,0).getDate(), firstDay=new Date(y,m,1).getDay();
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const [hovDay, setHovDay] = useState(null);

  const getDayData = (day) => {
    const dateKey=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayTrades=trades.filter(t=>(t.fields['Date']||t.createdAt?.slice(0,10)||'').startsWith(dateKey));
    const pnls=dayTrades.map(t=>parsePnl(t.fields['P&L']||'')).filter(n=>n!==null);
    const total=pnls.length?pnls.reduce((a,b)=>a+b,0):null;
    let bg='transparent';
    if(dayTrades.length>0){ if(total===null) bg='#374151'; else if(total>0) bg='rgba(0,200,100,0.25)'; else if(total<0) bg='rgba(255,50,80,0.22)'; else bg='#374151'; }
    return { trades:dayTrades, pnl:total, bg, dateKey };
  };

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
        <button onClick={()=>setMonth(new Date(y,m-1,1))} style={{ width:28,height:28,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='15 18 9 12 15 6'/></svg>
        </button>
        <span style={{ fontFamily:'var(--font)',fontSize:15,fontWeight:700,color:'var(--text)',flex:1,textAlign:'center' }}>{MONTHS[m]} {y}</span>
        <button onClick={()=>setMonth(new Date(y,m+1,1))} style={{ width:28,height:28,borderRadius:6,border:'1px solid var(--border)',background:'var(--surface2)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polyline points='9 18 15 12 9 6'/></svg>
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:4 }}>
        {DAYS.map(d=><div key={d} style={{ fontFamily:'var(--font)',fontSize:10,fontWeight:700,color:'var(--text-muted)',textAlign:'center',padding:'4px 0',textTransform:'uppercase',letterSpacing:'0.06em' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 }}>
        {Array(firstDay).fill(null).map((_,i)=><div key={'e'+i}/>)}
        {Array(daysInMonth).fill(null).map((_,i)=>{
          const day=i+1, data=getDayData(day);
          const isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===day;
          return (
            <div key={day} onMouseEnter={()=>setHovDay(day)} onMouseLeave={()=>setHovDay(null)}
              style={{ aspectRatio:'1',borderRadius:10,background:data.bg,border:isToday?`2px solid ${PURPLE}`:hovDay===day?'1px solid var(--text-muted)':'1px solid var(--border)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:3,cursor:data.trades.length?'pointer':'default',transition:'all 0.1s',position:'relative' }}>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:12,fontWeight:isToday?700:400,color:isToday?PURPLE:data.trades.length?'var(--text)':'var(--text-muted)' }}>{day}</div>
              {data.trades.length>0&&<div style={{ fontFamily:'var(--font-mono)',fontSize:9,fontWeight:700,color:data.pnl===null?'var(--text-muted)':data.pnl>0?'#22c55e':data.pnl<0?'#ef4444':'var(--text-muted)',marginTop:1 }}>{data.pnl!==null?(data.pnl>=0?'+':'')+data.pnl.toFixed(0):data.trades.length+'T'}</div>}
              {hovDay===day&&data.trades.length>0&&(
                <div style={{ position:'absolute',bottom:'calc(100% + 6px)',left:'50%',transform:'translateX(-50%)',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',zIndex:100,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,0.3)',pointerEvents:'none' }}>
                  <div style={{ fontFamily:'var(--font)',fontSize:11,fontWeight:700,color:'var(--text)',marginBottom:3 }}>{data.trades.length} trade{data.trades.length!==1?'s':''}</div>
                  {data.pnl!==null&&<div style={{ fontFamily:'var(--font-mono)',fontSize:12,fontWeight:800,color:data.pnl>0?'#22c55e':data.pnl<0?'#ef4444':'var(--text-muted)' }}>{data.pnl>=0?'+':''}{data.pnl.toFixed(2)}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex',gap:16,marginTop:14,justifyContent:'center',flexWrap:'wrap' }}>
        {[['Profitable','rgba(0,200,100,0.25)'],['Loss','rgba(255,50,80,0.22)'],['No P&L','#374151'],['No trades','transparent']].map(([label,bg])=>(
          <div key={label} style={{ display:'flex',alignItems:'center',gap:5 }}>
            <div style={{ width:12,height:12,borderRadius:3,background:bg,border:'1px solid var(--border)' }}/>
            <span style={{ fontFamily:'var(--font)',fontSize:10,color:'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddTradeModal({ fields, onSave, onClose }) {
  const [values, setValues] = useState({ Date: new Date().toISOString().slice(0,10) });
  const set=(k,v)=>setValues(p=>({...p,[k]:v}));
  const inputStyle={ width:'100%',padding:'8px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:13,color:'var(--text)',outline:'none',boxSizing:'border-box' };
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:500,maxWidth:'100%',maxHeight:'88vh',overflowY:'auto',boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <div style={{ fontFamily:'var(--font)',fontSize:16,fontWeight:700,color:'var(--text)' }}>Log a Trade</div>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:20 }}>×</button>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20 }}>
          {fields.map(f=>(
            <div key={f} style={{ gridColumn:(f==='Notes'||f==='Setup')?'1 / -1':'auto' }}>
              <label style={{ fontFamily:'var(--font)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-muted)',display:'block',marginBottom:5 }}>{f}</label>
              {f==='Direction'?(
                <div style={{ display:'flex',gap:4 }}>
                  {['Long','Short','Other'].map(d=>(
                    <button key={d} onClick={()=>set(f,d)} style={{ flex:1,padding:'8px 6px',borderRadius:8,border:'1px solid '+(values[f]===d?PURPLE:'var(--border)'),background:values[f]===d?PURPLE:'var(--surface2)',color:values[f]===d?'#fff':'var(--text-muted)',fontFamily:'var(--font)',fontSize:12,fontWeight:600,cursor:'pointer' }}>{d}</button>
                  ))}
                </div>
              ):(f==='Notes'||f==='Setup')?(
                <textarea value={values[f]||''} onChange={e=>set(f,e.target.value)} rows={3} style={{...inputStyle,resize:'none'}}/>
              ):(
                <input value={values[f]||''} onChange={e=>set(f,e.target.value)} type={f==='Date'?'date':'text'} placeholder={f==='P&L'?'+150.00 or -75.50':''} style={inputStyle}/>
              )}
            </div>
          ))}
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'11px',borderRadius:10,border:'1px solid var(--border)',background:'transparent',color:'var(--text-muted)',fontFamily:'var(--font)',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{onSave({id:Date.now()+'',fields:values,createdAt:new Date().toISOString()});onClose();}} style={{ flex:2,padding:'11px',borderRadius:10,border:'none',backgroundColor:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:13,fontWeight:700,cursor:'pointer' }}>Save Trade</button>
        </div>
      </div>
    </div>
  );
}

function FieldManager({ fields, onUpdate, onClose }) {
  const [local, setLocal]=useState([...fields]), [newF, setNewF]=useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:28,width:380,maxWidth:'100%',boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily:'var(--font)',fontSize:16,fontWeight:700,color:'var(--text)',marginBottom:4 }}>Customize Fields</div>
        <div style={{ fontFamily:'var(--font)',fontSize:12,color:'var(--text-muted)',marginBottom:16 }}>Add or remove columns from your trade log.</div>
        <div style={{ marginBottom:14 }}>
          {local.map(f=>(
            <div key={f} style={{ display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:8,background:'var(--surface2)',marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font)',fontSize:13,flex:1,color:'var(--text)' }}>{f}</span>
              <button onClick={()=>setLocal(p=>p.filter(x=>x!==f))} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--red)',fontSize:16 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display:'flex',gap:8,marginBottom:20 }}>
          <input value={newF} onChange={e=>setNewF(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&newF.trim()){setLocal(p=>[...p,newF.trim()]);setNewF('');} }} placeholder='Add custom field...' style={{ flex:1,padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:13,color:'var(--text)',outline:'none' }}/>
          <button onClick={()=>{if(newF.trim()){setLocal(p=>[...p,newF.trim()]);setNewF('');}}} style={{ padding:'8px 14px',borderRadius:8,border:'none',backgroundColor:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:12,fontWeight:700,cursor:'pointer' }}>Add</button>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px',borderRadius:10,border:'1px solid var(--border)',background:'transparent',color:'var(--text-muted)',fontFamily:'var(--font)',fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancel</button>
          <button onClick={()=>{onUpdate(local);onClose();}} style={{ flex:2,padding:'10px',borderRadius:10,border:'none',backgroundColor:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:13,fontWeight:700,cursor:'pointer' }}>Save Fields</button>
        </div>
      </div>
    </div>
  );
}

export default function JournalTradeLogTab() {
  const [view, setView]=useState('list');
  const [trades, setTrades]=useState([]);
  const [fields, setFields]=useState(DEFAULT_FIELDS);
  const [showAdd, setShowAdd]=useState(false);
  const [showFields, setShowFields]=useState(false);
  const [search, setSearch]=useState('');
  const [filterDir, setFilterDir]=useState('All');
  const [sortBy, setSortBy]=useState('date_desc');
  const [expandedId, setExpandedId]=useState(null);

  useEffect(()=>{ const s=loadLog(); if(s.trades) setTrades(s.trades); if(s.fields) setFields(s.fields); },[]);
  useEffect(()=>{ saveLog({trades,fields}); },[trades,fields]);

  const addTrade=(trade)=>setTrades(p=>[trade,...p]);
  const deleteTrade=(id)=>setTrades(p=>p.filter(t=>t.id!==id));

  const filtered = trades.filter(t=>{
    if(filterDir!=='All'){ const dir=(t.fields['Direction']||'').toLowerCase(); if(filterDir==='Long'&&dir!=='long') return false; if(filterDir==='Short'&&dir!=='short') return false; }
    if(!search) return true;
    const s=search.toLowerCase();
    return Object.values(t.fields).some(v=>v&&v.toString().toLowerCase().includes(s));
  }).sort((a,b)=>{
    if(sortBy==='date_desc') return new Date(b.fields['Date']||b.createdAt||0)-new Date(a.fields['Date']||a.createdAt||0);
    if(sortBy==='date_asc')  return new Date(a.fields['Date']||a.createdAt||0)-new Date(b.fields['Date']||b.createdAt||0);
    if(sortBy==='pnl_desc')  return (parsePnl(b.fields['P&L'])||0)-(parsePnl(a.fields['P&L'])||0);
    if(sortBy==='pnl_asc')   return (parsePnl(a.fields['P&L'])||0)-(parsePnl(b.fields['P&L'])||0);
    return 0;
  });

  const stats=calcStats(trades);
  const filteredStats=calcStats(filtered);

  const statCards=[
    {label:'Total Trades', value:stats.count, color:'var(--text)'},
    {label:'Win Rate', value:stats.winRate!==null?stats.winRate+'%':'—', color:'var(--green)'},
    {label:'Total P&L', value:stats.total?(stats.total>=0?'+':'')+stats.total.toFixed(2):'—', color:stats.total>=0?'var(--green)':'var(--red)'},
    {label:'Avg Win', value:stats.avgWin!==null?'+'+stats.avgWin.toFixed(2):'—', color:'var(--green)'},
    {label:'Avg Loss', value:stats.avgLoss!==null?stats.avgLoss.toFixed(2):'—', color:'var(--red)'},
    {label:'Profit Factor', value:stats.profitFactor!==null?stats.profitFactor.toFixed(2):'—', color:stats.profitFactor>=1?'var(--green)':'var(--red)'},
    {label:'Best Trade', value:stats.largest!==null?(stats.largest>=0?'+':'')+stats.largest.toFixed(2):'—', color:'var(--green)'},
    {label:'Worst Trade', value:stats.worstDraw!==null?stats.worstDraw.toFixed(2):'—', color:'var(--red)'},
  ];

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {showAdd&&<AddTradeModal fields={fields} onSave={addTrade} onClose={()=>setShowAdd(false)}/>}
      {showFields&&<FieldManager fields={fields} onUpdate={setFields} onClose={()=>setShowFields(false)}/>}

      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap' }}>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)',fontSize:18,fontWeight:700,color:'var(--text)' }}>Trade Log</div>
          <div style={{ fontFamily:'var(--font)',fontSize:12,color:'var(--text-muted)',marginTop:2 }}>{trades.length} trade{trades.length!==1?'s':''} logged</div>
        </div>
        <button onClick={()=>setShowFields(true)} style={{ padding:'7px 14px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text-muted)',fontFamily:'var(--font)',fontSize:12,fontWeight:600,cursor:'pointer' }}>⚙ Fields</button>
        <button onClick={()=>setShowAdd(true)} style={{ padding:'7px 16px',borderRadius:8,border:'none',backgroundColor:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:12,fontWeight:700,cursor:'pointer' }}>+ Log Trade</button>
      </div>

      {trades.length>0&&(
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:18 }}>
          {statCards.map(s=>(
            <div key={s.label} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 14px',textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-mono)',fontSize:17,fontWeight:800,color:s.color }}>{s.value}</div>
              <div style={{ fontFamily:'var(--font)',fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex',gap:8,marginBottom:14,alignItems:'center',flexWrap:'wrap' }}>
        <div style={{ display:'flex',gap:3,background:'var(--surface2)',borderRadius:10,padding:3 }}>
          {[['list','📋 List'],['calendar','📅 Calendar']].map(([v,label])=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:'5px 14px',borderRadius:7,border:'none',background:view===v?PURPLE:'transparent',color:view===v?'#fff':'var(--text-muted)',fontFamily:'var(--font)',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s' }}>{label}</button>
          ))}
        </div>
        <div style={{ display:'flex',gap:3 }}>
          {['All','Long','Short'].map(d=>(
            <button key={d} onClick={()=>setFilterDir(d)} style={{ padding:'5px 12px',borderRadius:20,border:'1px solid '+(filterDir===d?PURPLE:'var(--border)'),background:filterDir===d?PURPLE:'transparent',color:filterDir===d?'#fff':'var(--text-muted)',fontFamily:'var(--font)',fontSize:11,fontWeight:600,cursor:'pointer' }}>{d}</button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search trades...' style={{ flex:1,minWidth:120,padding:'7px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:12,color:'var(--text)',outline:'none' }}/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ padding:'7px 10px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:12,color:'var(--text)',outline:'none',cursor:'pointer' }}>
          <option value='date_desc'>Newest First</option>
          <option value='date_asc'>Oldest First</option>
          <option value='pnl_desc'>Best P&L First</option>
          <option value='pnl_asc'>Worst P&L First</option>
        </select>
      </div>

      {view==='list'&&(
        <div>
          {filtered.length===0?(
            <div style={{ textAlign:'center',padding:'60px 20px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14 }}>
              <div style={{ fontSize:40,marginBottom:12 }}>📋</div>
              <div style={{ fontFamily:'var(--font)',fontSize:15,fontWeight:600,color:'var(--text)',marginBottom:6 }}>{trades.length===0?'No trades logged yet':'No trades match your filters'}</div>
              {trades.length===0&&<button onClick={()=>setShowAdd(true)} style={{ padding:'9px 20px',borderRadius:8,border:'none',backgroundColor:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:13,fontWeight:700,cursor:'pointer',marginTop:8 }}>+ Log First Trade</button>}
            </div>
          ):(
            <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden' }}>
              <div style={{ display:'grid',gridTemplateColumns:fields.map(()=>'1fr').join(' ')+' 40px',padding:'10px 16px',background:'var(--surface2)',borderBottom:'1px solid var(--border)' }}>
                {fields.map(f=><div key={f} style={{ fontFamily:'var(--font)',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em' }}>{f}</div>)}
                <div/>
              </div>
              {filtered.map((t,i)=>{
                const isExp=expandedId===t.id;
                const pnlNum=parsePnl(t.fields['P&L']||'');
                const rowBorder=pnlNum!==null?(pnlNum>0?'2px solid rgba(0,200,100,0.3)':pnlNum<0?'2px solid rgba(255,50,80,0.3)':'1px solid var(--border)'):'1px solid var(--border)';
                return (
                  <div key={t.id}>
                    <div onClick={()=>setExpandedId(isExp?null:t.id)}
                      style={{ display:'grid',gridTemplateColumns:fields.map(()=>'1fr').join(' ')+' 40px',padding:'11px 16px',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',borderLeft:rowBorder,cursor:'pointer',transition:'background 0.1s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      {fields.map(f=>{
                        const val=t.fields[f]||'', isPnl=f==='P&L'||f==='pnl', isDir=f==='Direction';
                        return <div key={f} style={{ fontFamily:isPnl?'var(--font-mono)':'var(--font)',fontSize:12,color:isPnl?pnlColor(val):isDir?(val.toLowerCase()==='long'?'var(--green)':val.toLowerCase()==='short'?'var(--red)':'var(--text)'):'var(--text)',fontWeight:isPnl?700:isDir?600:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{isPnl?formatPnl(val):val||'—'}</div>;
                      })}
                      <button onClick={e=>{e.stopPropagation();deleteTrade(t.id);}} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.5 }} onMouseEnter={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.color='var(--red)';}} onMouseLeave={e=>{e.currentTarget.style.opacity='0.5';e.currentTarget.style.color='var(--text-muted)';}}>×</button>
                    </div>
                    {isExp&&(
                      <div style={{ padding:'14px 18px',background:'var(--surface2)',borderBottom:i<filtered.length-1?'1px solid var(--border)':'none',borderLeft:rowBorder }}>
                        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10 }}>
                          {fields.filter(f=>f==='Notes'||f==='Setup').map(f=>t.fields[f]?(
                            <div key={f} style={{ gridColumn:'1/-1' }}>
                              <div style={{ fontFamily:'var(--font)',fontSize:10,fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4 }}>{f}</div>
                              <div style={{ fontFamily:'var(--font)',fontSize:13,color:'var(--text)',lineHeight:1.6 }}>{t.fields[f]}</div>
                            </div>
                          ):null)}
                          <div style={{ fontFamily:'var(--font)',fontSize:11,color:'var(--text-muted)' }}>Logged {new Date(t.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {filtered.length>0&&filtered.length!==trades.length&&(
            <div style={{ marginTop:10,padding:'10px 14px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,display:'flex',gap:20,flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--font)',fontSize:12,color:'var(--text-muted)' }}>Showing {filtered.length} of {trades.length} trades</span>
              {filteredStats.winRate!==null&&<span style={{ fontFamily:'var(--font)',fontSize:12,color:'var(--green)' }}>Win rate: {filteredStats.winRate}%</span>}
              {filteredStats.total!==0&&<span style={{ fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,color:filteredStats.total>=0?'var(--green)':'var(--red)' }}>P&L: {filteredStats.total>=0?'+':''}{filteredStats.total.toFixed(2)}</span>}
            </div>
          )}
        </div>
      )}

      {view==='calendar'&&(
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:24 }}>
          <CalendarView trades={trades}/>
        </div>
      )}

      <div style={{ marginTop:16,padding:'12px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,display:'flex',alignItems:'center',gap:10 }}>
        <div style={{ fontSize:20 }}>🔗</div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:'var(--font)',fontSize:13,fontWeight:600,color:'var(--text)' }}>Auto-import trades</div>
          <div style={{ fontFamily:'var(--font)',fontSize:12,color:'var(--text-muted)',marginTop:1 }}>Connect your broker in Account → Broker to automatically log trades here.</div>
        </div>
        <button style={{ padding:'6px 14px',borderRadius:8,border:'1px solid var(--border)',background:'var(--surface2)',color:'var(--text-muted)',fontFamily:'var(--font)',fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap' }}>Connect Broker →</button>
      </div>
    </div>
  );
}
