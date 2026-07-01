'use client'
import React, { useState, useRef } from 'react'

const PURPLE = '#4B44C8'
const STORAGE_KEY = 'tr_journal_v3'

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {} 
}
function pnlNum(v) { return parseFloat(String(v || '0').replace(/[$,%\s]/g, '')) || 0 }
function pnlColor(v) { const n = parseFloat(String(v).replace(/[$,%\s]/g,'')); return isNaN(n)?'var(--text)':n>0?'var(--green)':n<0?'var(--red)':'var(--text-muted)' }

const EMOTIONS = ['Confident','Calm','Focused','Patient','Neutral','Anxious','FOMO','Revenge','Tired','Greedy']
const EMOTION_COLOR = {Confident:'#15803d',Calm:'#15803d',Focused:'#15803d',Patient:'#15803d',Neutral:'#3C3489',Anxious:'#991b1b',FOMO:'#991b1b',Revenge:'#991b1b',Tired:'#991b1b',Greedy:'#991b1b'}
const EMOTION_BG = {Confident:'rgba(22,163,74,0.08)',Calm:'rgba(22,163,74,0.08)',Focused:'rgba(22,163,74,0.08)',Patient:'rgba(22,163,74,0.08)',Neutral:'rgba(75,68,200,0.08)',Anxious:'rgba(220,38,38,0.07)',FOMO:'rgba(220,38,38,0.07)',Revenge:'rgba(220,38,38,0.07)',Tired:'rgba(220,38,38,0.07)',Greedy:'rgba(220,38,38,0.07)'}
const SETUPS = ['COT breakout','Seasonal','Trend follow','Key level bounce','News reaction','FOMO entry','Breakout','Reversal','Range fade','Gap fill']
const ASSETS = ['Gold','Silver','Copper','Crude Oil','Natural Gas','Wheat','Corn','Soybeans','EUR/USD','GBP/USD','USD/JPY','AUD/USD','BTC','ETH','SOL','NVDA','AAPL','MSFT','TSLA','S&P 500','Nasdaq','ES','NQ','ZB']

function Card({children,style}){return <div style={{background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:10,padding:'14px 16px',...style}}>{children}</div>}
function Card2({children,style}){return <div style={{background:'var(--surface2)',borderRadius:7,padding:'10px 12px',...style}}>{children}</div>}
function SH({children,color,style}){return <div style={{fontSize:10,fontWeight:600,color:color||'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8,...style}}>{children}</div>}
function BtnP({children,onClick,style}){return <button onClick={onClick} style={{padding:'6px 12px',background:PURPLE,color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',...style}}>{children}</button>}
function BtnS({children,onClick,style}){return <button onClick={onClick} style={{padding:'5px 10px',background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border2)',borderRadius:6,fontSize:11,cursor:'pointer',fontFamily:'var(--font)',...style}}>{children}</button>}
function Inp({value,onChange,placeholder,style,type='text'}){return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:'7px 10px',border:'0.5px solid var(--border2)',borderRadius:6,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',boxSizing:'border-box',...style}}/>}
function Sel({value,onChange,children,style}){return <select value={value} onChange={onChange} style={{width:'100%',padding:'7px 10px',border:'0.5px solid var(--border2)',borderRadius:6,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',...style}}>{children}</select>}
function Textarea({value,onChange,placeholder,style}){return <textarea value={value} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:'8px 10px',border:'0.5px solid var(--border2)',borderRadius:6,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',resize:'vertical',minHeight:72,boxSizing:'border-box',...style}}/>}

function getCalendarDays(year,month){const firstDay=new Date(year,month,1).getDay();const daysInMonth=new Date(year,month+1,0).getDate();const days=[];for(let i=0;i<firstDay;i++)days.push(null);for(let i=1;i<=daysInMonth;i++)days.push(i);return days}
function toDateStr(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}

function Dashboard({trades,journals}){
  const now=new Date();const[calYear,setCalYear]=useState(now.getFullYear());const[calMonth,setCalMonth]=useState(now.getMonth());
  const total=trades.length;const wins=trades.filter(t=>pnlNum(t.pnl)>0).length;const winRate=total>0?Math.round((wins/total)*100):0;
  const netPnl=trades.reduce((s,t)=>s+pnlNum(t.pnl),0);const avgRR=total>0?(trades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/total).toFixed(1):'—';
  const grossWin=trades.filter(t=>pnlNum(t.pnl)>0).reduce((s,t)=>s+pnlNum(t.pnl),0);const grossLoss=Math.abs(trades.filter(t=>pnlNum(t.pnl)<0).reduce((s,t)=>s+pnlNum(t.pnl),0));
  const profitFactor=grossLoss>0?(grossWin/grossLoss).toFixed(2):'—';
  const score=total===0?0:Math.min(100,Math.round(winRate*0.4+Math.min(30,(parseFloat(avgRR)||0)*15)+Math.min(30,(journals.length/Math.max(total,1))*30)));
  const scoreColor=score>=70?'#16a34a':score>=50?PURPLE:'#dc2626';
  const byDate={};trades.forEach(t=>{if(!t.date)return;byDate[t.date]=(byDate[t.date]||0)+pnlNum(t.pnl)});
  const calDays=getCalendarDays(calYear,calMonth);
  const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const sorted=[...trades].sort((a,b)=>(b.date||'').localeCompare(a.date||''));let streak=0,streakType=null;
  for(const t of sorted){const p=pnlNum(t.pnl);const type=p>0?'W':p<0?'L':null;if(!type)break;if(streakType===null)streakType=type;if(type!==streakType)break;streak++}
  const byAsset={};trades.forEach(t=>{if(!t.asset)return;if(!byAsset[t.asset])byAsset[t.asset]={wins:0,total:0,pnl:0};byAsset[t.asset].total++;if(pnlNum(t.pnl)>0)byAsset[t.asset].wins++;byAsset[t.asset].pnl+=pnlNum(t.pnl)});
  const assetList=Object.entries(byAsset);const bestAsset=assetList.sort((a,b)=>b[1].pnl-a[1].pnl)[0];const worstAsset=assetList.sort((a,b)=>a[1].pnl-b[1].pnl)[0];
  const discTrend=[...journals].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,7).reverse().map(j=>j.discipline||0);
  const thisMonthStr=`${calYear}-${String(calMonth+1).padStart(2,'0')}`;
  const emotionCounts={};trades.filter(t=>t.date?.startsWith(thisMonthStr)&&t.emotion).forEach(t=>{emotionCounts[t.emotion]=(emotionCounts[t.emotion]||0)+1});
  const tradingDays=[...new Set(trades.map(t=>t.date).filter(Boolean))].length;const journaledDays=journals.filter(j=>j.premarket?.trim()).length;
  const prevMonthStr=calMonth===0?`${calYear-1}-12`:`${calYear}-${String(calMonth).padStart(2,'0')}`;
  const thisMonthPnl=trades.filter(t=>t.date?.startsWith(thisMonthStr)).reduce((s,t)=>s+pnlNum(t.pnl),0);
  const prevMonthPnl=trades.filter(t=>t.date?.startsWith(prevMonthStr)).reduce((s,t)=>s+pnlNum(t.pnl),0);
  const assetsThisMonth=[...new Set(trades.filter(t=>t.date?.startsWith(thisMonthStr)).map(t=>t.asset).filter(Boolean))];
  const recentTrades=[...trades].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  return(<div style={{display:'flex',flexDirection:'column',gap:14}}>
    <div style={{display:'flex',gap:10,alignItems:'stretch'}}>
      <Card style={{display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
        <div style={{width:64,height:64,borderRadius:'50%',border:`4px solid ${scoreColor}`,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',flexShrink:0}}>
          <div style={{fontSize:20,fontWeight:600,color:scoreColor}}>{score}</div>
          <div style={{fontSize:8,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>score</div>
        </div>
        <div><div style={{fontSize:12,fontWeight:500,marginBottom:2}}>Trader score</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Win rate · R:R · Journal consistency</div><div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{total} trade{total!==1?'s':''} logged</div></div>
      </Card>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,flex:1}}>
        {[{label:'Win rate',value:total>0?`${winRate}%`:'—',color:winRate>=60?'var(--green)':winRate>0?'var(--red)':'var(--text)'},{label:'Total trades',value:total||'—'},{label:'Avg R:R',value:avgRR},{label:'Net P&L',value:netPnl!==0?`${netPnl>0?'+':''}$${netPnl.toFixed(0)}`:'—',color:netPnl>0?'var(--green)':netPnl<0?'var(--red)':'var(--text)'},{label:'Profit factor',value:profitFactor}].map(s=>(<Card2 key={s.label} style={{textAlign:'center'}}><div style={{fontSize:20,fontWeight:500,color:s.color||'var(--text)',marginBottom:3}}>{s.value}</div><div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div></Card2>))}
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:12}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <SH style={{margin:0}}>P&L calendar — {monthNames[calMonth]} {calYear}</SH>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {thisMonthPnl!==0&&<span style={{fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:4,background:thisMonthPnl>0?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:thisMonthPnl>0?'#15803d':'#dc2626'}}>{thisMonthPnl>0?'+':''}${thisMonthPnl.toFixed(0)} MTD</span>}
            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}} style={{fontSize:11,padding:'2px 8px',border:'0.5px solid var(--border2)',borderRadius:4,background:'transparent',cursor:'pointer',color:'var(--text-muted)'}}>◀</button>
            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}} style={{fontSize:11,padding:'2px 8px',border:'0.5px solid var(--border2)',borderRadius:4,background:'transparent',cursor:'pointer',color:'var(--text-muted)'}}>▶</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:'var(--text-muted)',fontWeight:500,padding:'2px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
          {calDays.map((day,i)=>{if(!day)return<div key={`e${i}`}/>;const ds=toDateStr(calYear,calMonth,day);const pnl=byDate[ds];const isToday=ds===toDateStr(now.getFullYear(),now.getMonth(),now.getDate());const isWknd=((i%7)===0||(i%7)===6);const bg=pnl>0?'rgba(22,163,74,0.15)':pnl<0?'rgba(220,38,38,0.12)':pnl===0?'rgba(180,83,9,0.12)':isWknd?'transparent':'var(--surface2)';const col=pnl>0?'#15803d':pnl<0?'#991b1b':pnl===0?'#92400e':'var(--text-muted)';return(<div key={ds} style={{borderRadius:5,background:bg,border:isToday?`1.5px solid ${PURPLE}`:'0.5px solid transparent',padding:'4px 2px',textAlign:'center',minHeight:38,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><div style={{fontSize:10,color:isToday?PURPLE:col,fontWeight:isToday?600:400}}>{day}</div>{pnl!==undefined&&<div style={{fontSize:8,color:col,fontWeight:500,lineHeight:1}}>{pnl>0?'+':''}${Math.abs(pnl)>=1000?(pnl/1000).toFixed(1)+'k':pnl.toFixed(0)}</div>}</div>)})}
        </div>
        <div style={{display:'flex',gap:12,marginTop:10}}>{[{bg:'rgba(22,163,74,0.15)',label:'Win day'},{bg:'rgba(220,38,38,0.12)',label:'Loss day'},{bg:'rgba(180,83,9,0.12)',label:'Breakeven'}].map(l=><div key={l.label} style={{display:'flex',alignItems:'center',gap:4,fontSize:9,color:'var(--text-muted)'}}><div style={{width:10,height:10,borderRadius:2,background:l.bg}}/>{l.label}</div>)}</div>
      </Card>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        <Card><SH>Performance snapshot</SH>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:10}}>
            <Card2 style={{textAlign:'center'}}><div style={{fontSize:16,fontWeight:500,color:streakType==='W'?'var(--green)':streakType==='L'?'var(--red)':'var(--text)'}}>{streak>0?`${streakType}${streak}`:'—'}</div><div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em',marginTop:2}}>Streak</div></Card2>
            <Card2 style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:500,color:'var(--green)',marginBottom:1}}>{bestAsset?bestAsset[0]:'—'}</div><div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>Best asset</div>{bestAsset&&<div style={{fontSize:9,color:'var(--green)'}}>+${bestAsset[1].pnl.toFixed(0)}</div>}</Card2>
            <Card2 style={{textAlign:'center'}}><div style={{fontSize:11,fontWeight:500,color:'var(--red)',marginBottom:1}}>{worstAsset&&worstAsset[1].pnl<0?worstAsset[0]:'—'}</div><div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>Watch out</div>{worstAsset&&worstAsset[1].pnl<0&&<div style={{fontSize:9,color:'var(--red)'}}>${worstAsset[1].pnl.toFixed(0)}</div>}</Card2>
          </div>
          <div style={{marginBottom:10}}><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:5}}>Discipline trend (last {discTrend.length} entries)</div>{discTrend.length===0?<div style={{fontSize:11,color:'var(--text-muted)'}}>No journal entries yet</div>:<div style={{display:'flex',alignItems:'flex-end',gap:3,height:28}}>{discTrend.map((v,i)=><div key={i} style={{flex:1,borderRadius:'2px 2px 0 0',background:v>=7?'rgba(22,163,74,0.4)':v>=5?'rgba(75,68,200,0.4)':'rgba(220,38,38,0.3)',height:`${(v/10)*100}%`}}/>)}</div>}</div>
          <div><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}><span style={{color:'var(--text-muted)'}}>Journal consistency</span><span style={{fontWeight:500}}>{journaledDays}/{Math.max(tradingDays,1)} days</span></div><div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${tradingDays>0?(journaledDays/tradingDays)*100:0}%`,height:'100%',background:PURPLE,borderRadius:2}}/></div></div>
        </Card>
        <Card><SH>Emotions this month</SH>{Object.keys(emotionCounts).length===0?<div style={{fontSize:11,color:'var(--text-muted)'}}>No emotion data yet</div>:<div style={{display:'flex',flexWrap:'wrap',gap:5}}>{Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1]).map(([em,count])=><span key={em} style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:10,background:EMOTION_BG[em]||'var(--surface2)',color:EMOTION_COLOR[em]||'var(--text-muted)',border:`0.5px solid ${EMOTION_COLOR[em]||'var(--border)'}33`}}>{em} × {count}</span>)}</div>}</Card>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:12}}>
      <Card><SH>Recent trades</SH>{recentTrades.length===0?<div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No trades yet</div>:<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Date','Asset','Side','Setup','Emotion','P&L'].map(h=><th key={h} style={{fontSize:9,color:'var(--text-muted)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em',padding:'4px 6px',textAlign:h==='P&L'?'right':'left',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead><tbody>{recentTrades.map((t,i)=><tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}><td style={{fontSize:11,padding:'6px 6px',color:'var(--text-muted)'}}>{t.date}</td><td style={{fontSize:12,padding:'6px 6px',fontWeight:500}}>{t.asset}</td><td style={{fontSize:11,padding:'6px 6px'}}><span style={{fontSize:9,fontWeight:500,padding:'1px 5px',borderRadius:3,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td><td style={{fontSize:10,padding:'6px 6px'}}>{t.setup&&<span style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3}}>{t.setup}</span>}</td><td style={{fontSize:10,padding:'6px 6px'}}>{t.emotion&&<span style={{padding:'1px 6px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td><td style={{fontSize:12,padding:'6px 6px',fontWeight:500,color:pnlColor(t.pnl),textAlign:'right'}}>{t.pnl||'—'}</td></tr>)}</tbody></table>}</Card>
      <Card><SH>Assets traded this month</SH>{assetsThisMonth.length===0?<div style={{fontSize:11,color:'var(--text-muted)'}}>No trades this month yet</div>:<div style={{display:'flex',flexDirection:'column',gap:6}}>{assetsThisMonth.map(asset=>{const at=trades.filter(t=>t.asset===asset&&t.date?.startsWith(thisMonthStr));const aw=at.filter(t=>pnlNum(t.pnl)>0).length;const ap=at.reduce((s,t)=>s+pnlNum(t.pnl),0);return(<div key={asset} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'5px 0',borderBottom:'0.5px solid var(--border)',fontSize:11}}><div><div style={{fontWeight:500}}>{asset}</div><div style={{fontSize:9,color:'var(--text-muted)'}}>{at.length} trade{at.length!==1?'s':''} · {Math.round((aw/at.length)*100)}% win</div></div><span style={{fontWeight:500,color:ap>0?'var(--green)':ap<0?'var(--red)':'var(--text-muted)'}}>{ap>0?'+':''}${ap.toFixed(0)}</span></div>)})}</div>}</Card>
    </div>
  </div>)
}

function TradeLog({trades,setTrades}){
  const empty={date:'',asset:'',direction:'Long',entry:'',exit:'',pnl:'',r:'',size:'',setup:'',emotion:'',rules:'',notes:''};
  const[form,setForm]=useState(empty);const[adding,setAdding]=useState(false);const[expanded,setExpanded]=useState(null);
  function addTrade(){if(!form.asset||!form.date)return;const u=[form,...trades];setTrades(u);save(STORAGE_KEY+'_trades',u);setForm(empty);setAdding(false)}
  function removeTrade(i){const u=trades.filter((_,idx)=>idx!==i);setTrades(u);save(STORAGE_KEY+'_trades',u)}
  return(<div style={{display:'flex',flexDirection:'column',gap:12}}>
    <div style={{display:'flex',gap:8}}><BtnP onClick={()=>setAdding(!adding)}>+ Add trade</BtnP><BtnS>Import CSV</BtnS><BtnS>Connect broker</BtnS><span style={{flex:1}}/><span style={{fontSize:11,color:'var(--text-muted)',alignSelf:'center'}}>{trades.length} trades logged</span></div>
    {adding&&<Card style={{border:`0.5px solid ${PURPLE}`}}><SH color={PURPLE}>New trade</SH>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Date</div><Inp type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Asset</div><Sel value={form.asset} onChange={e=>setForm(f=>({...f,asset:e.target.value}))}><option value="">Select</option>{ASSETS.map(a=><option key={a}>{a}</option>)}</Sel></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Direction</div><Sel value={form.direction} onChange={e=>setForm(f=>({...f,direction:e.target.value}))}><option>Long</option><option>Short</option></Sel></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Setup</div><Sel value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}><option value="">None</option>{SETUPS.map(s=><option key={s}>{s}</option>)}</Sel></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Entry</div><Inp value={form.entry} onChange={e=>setForm(f=>({...f,entry:e.target.value}))} placeholder="0.00"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Exit</div><Inp value={form.exit} onChange={e=>setForm(f=>({...f,exit:e.target.value}))} placeholder="0.00"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>P&L ($)</div><Inp value={form.pnl} onChange={e=>setForm(f=>({...f,pnl:e.target.value}))} placeholder="+240"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>R-multiple</div><Inp value={form.r} onChange={e=>setForm(f=>({...f,r:e.target.value}))} placeholder="+1.8R"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Size</div><Inp value={form.size} onChange={e=>setForm(f=>({...f,size:e.target.value}))} placeholder="2 lots"/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Emotion</div><Sel value={form.emotion} onChange={e=>setForm(f=>({...f,emotion:e.target.value}))}><option value="">Select</option>{EMOTIONS.map(e=><option key={e}>{e}</option>)}</Sel></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Rules followed</div><Inp value={form.rules} onChange={e=>setForm(f=>({...f,rules:e.target.value}))} placeholder="4/4"/></div>
      </div>
      <div style={{marginBottom:10}}><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Notes</div><Textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Pre-trade rationale..."/></div>
      <div style={{display:'flex',gap:8}}><BtnP onClick={addTrade}>Save trade</BtnP><BtnS onClick={()=>{setAdding(false);setForm(empty)}}>Cancel</BtnS></div>
    </Card>}
    {trades.length===0?<Card style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:32,marginBottom:10}}>📋</div><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>No trades logged yet</div><BtnP onClick={()=>setAdding(true)}>+ Add your first trade</BtnP></Card>:
    <Card style={{padding:0,overflow:'hidden'}}><table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
      <thead><tr style={{background:'var(--surface2)'}}>{['Date','Asset','Side','Entry','Exit','R','P&L','Setup','Emotion','Rules',''].map((h,i)=><th key={h+i} style={{fontSize:10,color:'var(--text-muted)',fontWeight:500,padding:'6px 8px',textAlign:i>2&&i<9?'center':'left',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'0.5px solid var(--border)',width:h===''?28:h==='Date'?80:h==='Setup'||h==='Emotion'?100:undefined}}>{h}</th>)}</tr></thead>
      <tbody>{trades.map((t,i)=><React.Fragment key={i}>
        <tr onClick={()=>setExpanded(expanded===i?null:i)} style={{cursor:'pointer',background:expanded===i?'rgba(75,68,200,0.04)':'transparent',borderBottom:'0.5px solid var(--border)'}}>
          <td style={{fontSize:11,padding:'7px 8px',color:'var(--text-muted)'}}>{t.date}</td>
          <td style={{fontSize:12,padding:'7px 8px',fontWeight:500}}>{t.asset}</td>
          <td style={{fontSize:11,padding:'7px 8px'}}><span style={{fontSize:10,fontWeight:500,padding:'2px 5px',borderRadius:3,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td>
          <td style={{fontSize:11,padding:'7px 8px',textAlign:'center'}}>{t.entry}</td>
          <td style={{fontSize:11,padding:'7px 8px',textAlign:'center'}}>{t.exit}</td>
          <td style={{fontSize:11,padding:'7px 8px',textAlign:'center',fontWeight:500,color:pnlColor(t.r)}}>{t.r}</td>
          <td style={{fontSize:12,padding:'7px 8px',textAlign:'center',fontWeight:500,color:pnlColor(t.pnl)}}>{t.pnl}</td>
          <td style={{fontSize:10,padding:'7px 8px'}}><span style={{background:'var(--surface2)',padding:'2px 5px',borderRadius:3}}>{t.setup}</span></td>
          <td style={{fontSize:10,padding:'7px 8px'}}>{t.emotion&&<span style={{padding:'2px 6px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td>
          <td style={{fontSize:11,padding:'7px 8px',textAlign:'center',fontWeight:500,color:t.rules==='4/4'?'var(--green)':t.rules?.startsWith('2')?'var(--red)':'var(--text)'}}>{t.rules}</td>
          <td style={{padding:'7px 4px',textAlign:'center'}}><button onClick={e=>{e.stopPropagation();removeTrade(i)}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14}}>×</button></td>
        </tr>
        {expanded===i&&<tr><td colSpan={11} style={{padding:'10px 14px',background:'rgba(75,68,200,0.04)',borderBottom:'0.5px solid var(--border)',borderLeft:`2px solid ${PURPLE}`}}>{t.notes&&<div style={{fontSize:11,color:'var(--text-muted)',padding:'8px 10px',background:'var(--surface2)',borderRadius:5,lineHeight:1.5}}>{t.notes}</div>}</td></tr>}
      </React.Fragment>)}</tbody>
    </table></Card>}
  </div>)
}

function DailyJournal({journals,setJournals}){
  const today=new Date().toISOString().slice(0,10);const[selectedDate,setSelectedDate]=useState(today);
  const[entry,setEntry]=useState({premarket:'',went_well:'',went_wrong:'',discipline:5,emotions:[]});
  React.useEffect(()=>{const e=journals.find(j=>j.date===selectedDate);setEntry(e||{premarket:'',went_well:'',went_wrong:'',discipline:5,emotions:[]})},[selectedDate,journals]);
  function saveEntry(){const u=[...journals.filter(j=>j.date!==selectedDate),{...entry,date:selectedDate}];setJournals(u);save(STORAGE_KEY+'_journals',u)}
  function toggleEmotion(em){setEntry(e=>({...e,emotions:e.emotions.includes(em)?e.emotions.filter(x=>x!==em):[...e.emotions,em]}))}
  return(<div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:14}}>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}><Inp type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{width:160}}/><BtnP onClick={saveEntry}>Save entry</BtnP><span style={{fontSize:11,color:'var(--text-muted)'}}>{journals.length} entries</span></div>
      <Card><SH>Pre-market plan</SH><Textarea value={entry.premarket} onChange={e=>setEntry(en=>({...en,premarket:e.target.value}))} placeholder="Today I'm watching..." style={{minHeight:100}}/></Card>
      <Card><SH>End of day review</SH><div style={{display:'flex',flexDirection:'column',gap:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>What went well?</div><Textarea value={entry.went_well} onChange={e=>setEntry(en=>({...en,went_well:e.target.value}))} placeholder="Followed my plan..."/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>What went wrong?</div><Textarea value={entry.went_wrong} onChange={e=>setEntry(en=>({...en,went_wrong:e.target.value}))} placeholder="Took a FOMO trade..." style={{background:'rgba(220,38,38,0.03)',borderColor:'rgba(220,38,38,0.2)'}}/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:6}}>Discipline: {entry.discipline}/10</div><div style={{display:'flex',gap:4}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><button key={n} onClick={()=>setEntry(en=>({...en,discipline:n}))} style={{width:28,height:28,borderRadius:5,border:'none',background:n<=entry.discipline?PURPLE:'var(--surface2)',color:n<=entry.discipline?'#fff':'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>{n}</button>)}</div></div>
      </div></Card>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      <Card><SH>Emotion check-in</SH><div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>{EMOTIONS.map(em=>{const sel=entry.emotions.includes(em);return(<button key={em} onClick={()=>toggleEmotion(em)} style={{fontSize:10,fontWeight:sel?500:400,padding:'3px 8px',borderRadius:10,border:`0.5px solid ${sel?EMOTION_COLOR[em]:'var(--border2)'}`,background:sel?EMOTION_BG[em]:'transparent',color:sel?EMOTION_COLOR[em]:'var(--text-muted)',cursor:'pointer',fontFamily:'var(--font)'}}>{em}</button>)})}</div>{entry.emotions.some(e=>['FOMO','Revenge','Anxious','Greedy'].includes(e))&&<div style={{fontSize:10,padding:'6px 8px',background:'rgba(220,38,38,0.05)',border:'0.5px solid rgba(220,38,38,0.2)',borderRadius:5,color:'#991b1b',lineHeight:1.4}}>⚠ Negative emotions detected.</div>}</Card>
      <Card><SH>Recent entries</SH>{journals.length===0?<div style={{fontSize:11,color:'var(--text-muted)'}}>No entries yet.</div>:[...journals].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(j=><div key={j.date} onClick={()=>setSelectedDate(j.date)} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'0.5px solid var(--border)',cursor:'pointer',fontSize:11}}><span style={{color:j.date===selectedDate?PURPLE:'var(--text)'}}>{j.date}</span><div style={{display:'flex',gap:4}}><span style={{fontSize:10,color:'var(--text-muted)'}}>{j.discipline}/10</span>{(j.emotions||[]).slice(0,2).map(em=><span key={em} style={{fontSize:9,padding:'1px 4px',borderRadius:3,background:EMOTION_BG[em],color:EMOTION_COLOR[em]}}>{em}</span>)}</div></div>)}</Card>
    </div>
  </div>)
}

function Reports({trades,journals}){
  if(trades.length===0)return(<Card style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:32,marginBottom:10}}>📊</div><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>No data yet</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Log at least 5 trades to see reports.</div></Card>);
  const byAsset={},bySetup={},byEmotion={};
  trades.forEach(t=>{if(t.asset){if(!byAsset[t.asset])byAsset[t.asset]={wins:0,total:0,pnl:0};byAsset[t.asset].total++;if(pnlNum(t.pnl)>0)byAsset[t.asset].wins++;byAsset[t.asset].pnl+=pnlNum(t.pnl)}if(t.setup){if(!bySetup[t.setup])bySetup[t.setup]={wins:0,total:0,pnl:0};bySetup[t.setup].total++;if(pnlNum(t.pnl)>0)bySetup[t.setup].wins++;bySetup[t.setup].pnl+=pnlNum(t.pnl)}if(t.emotion){if(!byEmotion[t.emotion])byEmotion[t.emotion]={wins:0,total:0,pnl:0};byEmotion[t.emotion].total++;if(pnlNum(t.pnl)>0)byEmotion[t.emotion].wins++;byEmotion[t.emotion].pnl+=pnlNum(t.pnl)}});
  const avgDisc=journals.length>0?(journals.reduce((s,j)=>s+(j.discipline||0),0)/journals.length).toFixed(1):'—';
  return(<div style={{display:'flex',flexDirection:'column',gap:12}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Card><SH>Win rate by asset</SH>{Object.entries(byAsset).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,6).map(([asset,d])=>{const wr=Math.round((d.wins/d.total)*100);return(<div key={asset} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}><span style={{color:'var(--text-muted)'}}>{asset} ({d.total})</span><span style={{fontWeight:500,color:wr>=60?'var(--green)':wr<50?'var(--red)':'#b45309'}}>{wr}%</span></div><div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${wr}%`,height:'100%',background:wr>=60?'#16a34a':wr<50?'#dc2626':'#b45309',borderRadius:2}}/></div></div>)})}</Card>
      <Card><SH>Performance by setup</SH>{Object.entries(bySetup).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,6).map(([setup,d])=><div key={setup} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:11}}><span style={{color:'var(--text-muted)'}}>{setup}</span><div style={{textAlign:'right'}}><div style={{fontWeight:500,color:d.pnl>0?'var(--green)':'var(--red)'}}>{d.pnl>0?'+':''}${d.pnl.toFixed(0)}</div><div style={{fontSize:9,color:'var(--text-muted)'}}>{Math.round((d.wins/d.total)*100)}% · {d.total}tr</div></div></div>)}{Object.keys(bySetup).length===0&&<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag trades with setups.</div>}</Card>
      <Card><SH>Performance by emotion</SH>{Object.entries(byEmotion).sort((a,b)=>b[1].pnl-a[1].pnl).map(([em,d])=>{const wr=Math.round((d.wins/d.total)*100);return(<div key={em} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:11}}><span style={{padding:'2px 6px',borderRadius:10,background:EMOTION_BG[em],color:EMOTION_COLOR[em],fontSize:10}}>{em}</span><div style={{textAlign:'right'}}><div style={{fontWeight:500,color:wr>=60?'var(--green)':'var(--red)'}}>{wr}%</div><div style={{fontSize:9,color:'var(--text-muted)'}}>{d.pnl>0?'+':''}${d.pnl.toFixed(0)}</div></div></div>)})}{Object.keys(byEmotion).length===0&&<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag emotions to see this.</div>}</Card>
    </div>
    <Card><SH>Discipline & consistency</SH><div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>{[{l:'Avg discipline',v:avgDisc},{l:'Journal entries',v:journals.length},{l:'Full rule trades',v:trades.filter(t=>t.rules==='4/4').length},{l:'Emotional trades',v:trades.filter(t=>['FOMO','Revenge'].includes(t.emotion)).length,danger:true}].map(s=><Card2 key={s.l} style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:500,color:s.danger?'var(--red)':'var(--text)',marginBottom:2}}>{s.v}</div><div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.l}</div></Card2>)}</div></Card>
  </div>)
}

function Playbook({trades}){
  const defaultSetups=['COT breakout','Seasonal','Trend follow','Gap fill'].map(name=>({name,rules:['','',''],exitRules:['',''],checklist:['','','']}));
  const[setups,setSetups]=useState(()=>load(STORAGE_KEY+'_setups',defaultSetups));const[active,setActive]=useState(0);
  function saveSetups(){save(STORAGE_KEY+'_setups',setups)}
  function updateRule(type,idx,val){const s=[...setups];s[active]={...s[active],[type]:s[active][type].map((r,i)=>i===idx?val:r)};setSetups(s)}
  const setup=setups[active];const setupTrades=trades.filter(t=>t.setup===setup?.name);const wins=setupTrades.filter(t=>pnlNum(t.pnl)>0).length;const wr=setupTrades.length>0?Math.round((wins/setupTrades.length)*100):null;const netPnl=setupTrades.reduce((s,t)=>s+pnlNum(t.pnl),0);
  return(<div style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:14}}>
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      <SH>My setups</SH>
      {setups.map((s,i)=>{const st=trades.filter(t=>t.setup===s.name);const w=st.filter(t=>pnlNum(t.pnl)>0).length;return(<div key={i} onClick={()=>setActive(i)} style={{padding:'8px 10px',borderRadius:7,border:`0.5px solid ${i===active?'rgba(75,68,200,0.3)':'var(--border)'}`,background:i===active?'rgba(75,68,200,0.06)':'var(--surface2)',cursor:'pointer'}}><div style={{fontSize:12,fontWeight:i===active?500:400,color:i===active?'#3C3489':'var(--text)',marginBottom:2}}>{s.name}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>{st.length} trades{st.length>0?` · ${Math.round((w/st.length)*100)}% win`:''}</div></div>)})}
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <Card><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><div><div style={{fontSize:14,fontWeight:500}}>{setup?.name}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{setupTrades.length} trades{wr!==null?` · ${wr}% win`:''}{netPnl!==0?` · ${netPnl>0?'+':''}$${netPnl.toFixed(0)}`:''}</div></div><BtnP onClick={saveSetups}>Save</BtnP></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div><SH>Entry rules</SH>{setup?.rules.map((r,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><span style={{color:PURPLE,fontWeight:500,fontSize:12}}>✓</span><Inp value={r} onChange={e=>updateRule('rules',i,e.target.value)} placeholder={`Entry rule ${i+1}`}/></div>)}</div>
          <div><SH>Exit rules</SH>{setup?.exitRules.map((r,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}><span style={{color:'#b45309',fontWeight:500,fontSize:12}}>→</span><Inp value={r} onChange={e=>updateRule('exitRules',i,e.target.value)} placeholder={`Exit rule ${i+1}`}/></div>)}</div>
        </div>
      </Card>
      <Card><SH>Pre-trade checklist</SH>{setup?.checklist.map((item,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><span style={{fontSize:14,color:item?PURPLE:'var(--text-muted)'}}>☑</span><Inp value={item} onChange={e=>updateRule('checklist',i,e.target.value)} placeholder={`Checklist item ${i+1}`}/></div>)}</Card>
    </div>
  </div>)
}

const TOOLS_TABS = [
  { key:'Journal',    label:'Journal',        sub:'Track & review your trades', icon:'ti-notebook'    },
  { key:'COT Alerts', label:'COT alerts',     sub:'Commitment of traders data',  icon:'ti-bell-ringing'},
  { key:'Screener',   label:'Custom screener',sub:'Build your own screeners',    icon:'ti-filter'      },
  { key:'Import',     label:'Import data',    sub:'Import trades & history',     icon:'ti-file-import' },
]

const JOURNAL_SUBTABS = [
  { key:'dashboard', label:'Dashboard',    icon:'ti-layout-dashboard' },
  { key:'tradelog',  label:'Trade log',    icon:'ti-list-details'     },
  { key:'daily',     label:'Daily journal',icon:'ti-pencil'           },
  { key:'reports',   label:'Reports',      icon:'ti-chart-bar'        },
  { key:'playbook',  label:'Playbook',     icon:'ti-book-2'           },
]

export default function ToolsLayout({tab, setTab, userInfo}){
  const [journalTab, setJournalTab] = useState('dashboard');
  const [trades,   setTrades]   = useState(() => load(STORAGE_KEY+'_trades',   []));
  const [journals, setJournals] = useState(() => load(STORAGE_KEY+'_journals', []));

  React.useEffect(() => { if (!tab) setTab('Journal'); }, []);

  // Lazy-load heavy components
  const [COTAlertsTab,   setCOTAlertsTab]   = useState(null);
  const [ScreenerBuilder, setScreenerBuilder] = useState(null);
  const [ImportTab,       setImportTab]       = useState(null);

  React.useEffect(() => {
    if (tab === 'COT Alerts' && !COTAlertsTab) import('./COTAlertsTab').then(m => setCOTAlertsTab(() => m.default)).catch(() => {});
    if (tab === 'Screener'&& !ScreenerBuilder) import('./ScreenerBuilder').then(m => setScreenerBuilder(() => m.default)).catch(() => {});
    if (tab === 'Import'  && !ImportTab)       import('./ImportTab').then(m => setImportTab(()          => m.default)).catch(() => {});
  }, [tab]);

  const meta = TOOLS_TABS.find(t => t.key === tab) || TOOLS_TABS[0];

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:'var(--font)' }}>

      {/* ── Sidebar ── matches Community/Compete exactly ── */}
      <div style={{ width:56, display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:4, borderRight:'0.5px solid var(--border)', background:'var(--surface)', flexShrink:0, alignSelf:'stretch' }}>
        {TOOLS_TABS.map(t => {
          const isActive = tab === t.key;
          return (
            <div key={t.key} title={t.label} onClick={() => setTab(t.key)}
              style={{ width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:isActive?'#EEEDFE':'transparent', color:isActive?'#534AB7':'var(--text-muted)', fontSize:19, transition:'all .15s', flexShrink:0 }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='#EEEDFE'; e.currentTarget.style.color='#534AB7'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; } }}
            >
              <i className={`ti ${t.icon}`} aria-hidden="true" />
            </div>
          );
        })}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>



        {/* Journal horizontal subtab strip */}
        {tab === 'Journal' && (
          <div style={{ display:'flex', alignItems:'center', padding:'0 18px', gap:24, borderBottom:'0.5px solid var(--border)', flexShrink:0, height:44 }}>
            {JOURNAL_SUBTABS.map(s => (
              <span key={s.key} onClick={() => setJournalTab(s.key)}
                style={{ all:'unset', cursor:'pointer', fontFamily:'var(--font)', fontSize:13, fontWeight:journalTab===s.key?600:400, color:journalTab===s.key?'var(--text)':'var(--text-muted)', position:'relative', height:44, display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:14 }} aria-hidden="true" />
                {s.label}
                {journalTab===s.key && <span style={{ position:'absolute', bottom:-1, left:0, right:0, height:2, background:'#534AB7', borderRadius:1 }} />}
              </span>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {tab==='Journal' && journalTab==='dashboard' && <Dashboard trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='tradelog'  && <TradeLog  trades={trades} setTrades={setTrades}/>}
          {tab==='Journal' && journalTab==='daily'     && <DailyJournal journals={journals} setJournals={setJournals}/>}
          {tab==='Journal' && journalTab==='reports'   && <Reports   trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='playbook'  && <Playbook  trades={trades}/>}
          {tab==='COT Alerts'&&(COTAlertsTab    ? <COTAlertsTab/>                       : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Screener'&& (ScreenerBuilder ? <ScreenerBuilder user={userInfo}/>    : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Import'  && (ImportTab       ? <ImportTab/>                          : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
        </div>
      </div>
    </div>
  );
}
                                                                                                                                                                                                                                                                                         