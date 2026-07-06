'use client'
import React, { useState, useRef } from 'react'

const PURPLE = '#4B44C8'
const STORAGE_KEY = 'tr_journal_v3'
const JOURNAL_TREE_KEY = STORAGE_KEY+'_jtree'
const JOURNAL_ACTIVE_KEY = STORAGE_KEY+'_jactive'

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
  const[dayModal,setDayModal]=useState(null);
  const total=trades.length;const wins=trades.filter(t=>pnlNum(t.pnl)>0).length;const winRate=total>0?Math.round((wins/total)*100):0;
  const netPnl=trades.reduce((s,t)=>s+pnlNum(t.pnl),0);const avgRR=total>0?(trades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/total).toFixed(1):'—';
  const grossWin=trades.filter(t=>pnlNum(t.pnl)>0).reduce((s,t)=>s+pnlNum(t.pnl),0);const grossLoss=Math.abs(trades.filter(t=>pnlNum(t.pnl)<0).reduce((s,t)=>s+pnlNum(t.pnl),0));
  const profitFactor=grossLoss>0?(grossWin/grossLoss).toFixed(2):'—';
  let _peak=0,_dd=0,_cum=0;[...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{_cum+=pnlNum(t.pnl);if(_cum>_peak)_peak=_cum;const d=_peak-_cum;if(d>_dd)_dd=d});const maxDrawdown=_dd;
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
  const thisMonthPnl=trades.filter(t=>t.date?.startsWith(thisMonthStr)).reduce((s,t)=>s+pnlNum(t.pnl),0);
  const assetsThisMonth=[...new Set(trades.filter(t=>t.date?.startsWith(thisMonthStr)).map(t=>t.asset).filter(Boolean))];
  const recentTrades=[...trades].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  const dayTrades=dayModal?trades.filter(t=>t.date===dayModal):[];
  const dayJournal=dayModal?journals.find(j=>j.date===dayModal):null;
  const dayPnl=dayTrades.reduce((s,t)=>s+pnlNum(t.pnl),0);
  const dayWins=dayTrades.filter(t=>pnlNum(t.pnl)>0).length;
  const dayWr=dayTrades.length>0?Math.round((dayWins/dayTrades.length)*100):null;
  return(<div style={{display:'flex',flexDirection:'column',gap:14}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8}}>
      {[{label:'Win rate',value:total>0?`${winRate}%`:'—',color:winRate>=60?'var(--green)':winRate>0?'var(--red)':'var(--text)'},{label:'Total trades',value:total||'—'},{label:'Avg R:R',value:avgRR},{label:'Net P&L',value:netPnl!==0?`${netPnl>0?'+':''}$${netPnl.toFixed(0)}`:'—',color:netPnl>0?'var(--green)':netPnl<0?'var(--red)':'var(--text)'},{label:'Max drawdown',value:maxDrawdown>0?`-$${maxDrawdown.toFixed(0)}`:'—',color:maxDrawdown>0?'var(--red)':'var(--text)'}].map(s=>(<Card2 key={s.label} style={{textAlign:'center'}}><div style={{fontSize:20,fontWeight:500,color:s.color||'var(--text)',marginBottom:3}}>{s.value}</div><div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div></Card2>))}
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:12}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <SH style={{margin:0}}>P&L calendar — {monthNames[calMonth]} {calYear}</SH>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {thisMonthPnl!==0&&<span style={{fontSize:10,fontWeight:500,padding:'2px 7px',borderRadius:4,background:thisMonthPnl>0?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:thisMonthPnl>0?'#15803d':'#dc2626'}}>{thisMonthPnl>0?'+':''}${thisMonthPnl.toFixed(0)} MTD</span>}
            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}} style={{fontSize:11,padding:'2px 8px',border:'0.5px solid var(--border2)',borderRadius:4,background:'transparent',cursor:'pointer',color:'var(--text-muted)'}}>&#9664;</button>
            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}} style={{fontSize:11,padding:'2px 8px',border:'0.5px solid var(--border2)',borderRadius:4,background:'transparent',cursor:'pointer',color:'var(--text-muted)'}}>&#9654;</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:4}}>
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:'var(--text-muted)',fontWeight:500,padding:'2px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {calDays.map((day,i)=>{if(!day)return<div key={`e${i}`}/>;const ds=toDateStr(calYear,calMonth,day);const pnl=byDate[ds];const isToday=ds===toDateStr(now.getFullYear(),now.getMonth(),now.getDate());const isWknd=((i%7)===0||(i%7)===6);const bg=pnl>0?'rgba(22,163,74,0.15)':pnl<0?'rgba(220,38,38,0.12)':pnl===0?'rgba(180,83,9,0.12)':isWknd?'transparent':'var(--surface2)';const col=pnl>0?'#15803d':pnl<0?'#991b1b':pnl===0?'#92400e':'var(--text-muted)';return(<div key={ds} onClick={()=>setDayModal(ds)} onMouseEnter={e=>e.currentTarget.style.filter='brightness(0.93)'} onMouseLeave={e=>e.currentTarget.style.filter='none'} style={{borderRadius:5,background:bg,border:isToday?`1.5px solid ${PURPLE}`:'0.5px solid transparent',padding:'8px 2px',textAlign:'center',minHeight:64,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',cursor:'pointer'}}><div style={{fontSize:11,color:isToday?PURPLE:col,fontWeight:isToday?600:400}}>{day}</div>{pnl!==undefined&&<div style={{fontSize:9,color:col,fontWeight:500,lineHeight:1.2,marginTop:5}}>{pnl>0?'+':''}${Math.abs(pnl)>=1000?(pnl/1000).toFixed(1)+'k':pnl.toFixed(0)}</div>}</div>)})}
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
        <Card><SH>Emotions this month</SH>{Object.keys(emotionCounts).length===0?<div style={{fontSize:11,color:'var(--text-muted)'}}>No emotion data yet</div>:<div style={{display:'flex',flexWrap:'wrap',gap:5}}>{Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1]).map(([em,count])=><span key={em} style={{fontSize:10,fontWeight:500,padding:'2px 8px',borderRadius:10,background:EMOTION_BG[em]||'var(--surface2)',color:EMOTION_COLOR[em]||'var(--text-muted)',border:`0.5px solid ${EMOTION_COLOR[em]||'var(--border)'}33`}}>{em} \xd7 {count}</span>)}</div>}</Card>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:12}}>
      <Card><SH>Recent trades</SH>{recentTrades.length===0?<div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'20px 0'}}>No trades yet</div>:<table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{['Date','Asset','Side','Setup','Emotion','P&L'].map(h=><th key={h} style={{fontSize:9,color:'var(--text-muted)',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.04em',padding:'4px 6px',textAlign:h==='P&L'?'right':'left',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead><tbody>{recentTrades.map((t,i)=><tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}><td style={{fontSize:11,padding:'6px 6px',color:'var(--text-muted)'}}>{t.date}</td><td style={{fontSize:12,padding:'6px 6px',fontWeight:500}}>{t.asset}</td><td style={{fontSize:11,padding:'6px 6px'}}><span style={{fontSize:10,fontWeight:500,padding:'2px 5px',borderRadius:3,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td><td style={{fontSize:10,padding:'6px 6px'}}>{t.setup&&<span style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3}}>{t.setup}</span>}</td><td style={{fontSize:10,padding:'6px 6px'}}>{t.emotion&&<span style={{padding:'1px 6px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td><td style={{fontSize:12,padding:'6px 6px',fontWeight:500,color:pnlColor(t.pnl),textAlign:'right'}}>{t.pnl||'—'}</td></tr>)}</tbody></table>}</Card>
    </div>
    {dayModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={()=>setDayModal(null)}>
      <div style={{background:'var(--surface)',borderRadius:16,padding:24,width:540,maxHeight:'82vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div><div style={{fontSize:16,fontWeight:700,color:'var(--text)'}}>{dayModal}</div><div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{dayTrades.length>0?`${dayTrades.length} trade${dayTrades.length!==1?'s':''} \xb7 `:'No trades \xb7 '}{dayWr!==null?`${dayWr}% win rate`:''}</div></div>
          <button onClick={()=>setDayModal(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,color:'var(--text-muted)',lineHeight:1}}>X</button>
        </div>
        {dayTrades.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[{label:'Net P&L',value:`${dayPnl>=0?'+':''}$${dayPnl.toFixed(0)}`,color:dayPnl>0?'var(--green)':dayPnl<0?'var(--red)':'var(--text)'},{label:'Win rate',value:dayWr!==null?`${dayWr}%`:'—',color:dayWr!==null&&dayWr>=60?'var(--green)':dayWr!==null&&dayWr<50?'var(--red)':'var(--text)'},{label:'Trades',value:dayTrades.length},{label:'Avg R',value:dayTrades.length>0?(dayTrades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/dayTrades.length).toFixed(1):'—'}].map(s=><Card2 key={s.label} style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:17,fontWeight:500,color:s.color||'var(--text)',marginBottom:2}}>{s.value}</div><div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div></Card2>)}
        </div>}
        {dayTrades.length>0&&<Card style={{marginBottom:14,padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--surface2)'}}>{['Asset','Side','Entry','Exit','R','P&L','Setup','Emotion'].map(h=><th key={h} style={{fontSize:9,color:'var(--text-muted)',fontWeight:500,padding:'6px 8px',textAlign:'left',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
            <tbody>{dayTrades.map((t,i)=><tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}><td style={{fontSize:12,padding:'7px 8px',fontWeight:500}}>{t.asset}</td><td style={{fontSize:11,padding:'7px 8px'}}><span style={{fontSize:10,fontWeight:500,padding:'2px 5px',borderRadius:3,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td><td style={{fontSize:11,padding:'7px 8px'}}>{t.entry}</td><td style={{fontSize:11,padding:'7px 8px'}}>{t.exit}</td><td style={{fontSize:11,padding:'7px 8px',fontWeight:500,color:pnlColor(t.r)}}>{t.r}</td><td style={{fontSize:12,padding:'7px 8px',fontWeight:500,color:pnlColor(t.pnl)}}>{t.pnl}</td><td style={{fontSize:10,padding:'7px 8px'}}>{t.setup&&<span style={{background:'var(--surface2)',padding:'2px 5px',borderRadius:3}}>{t.setup}</span>}</td><td style={{fontSize:10,padding:'7px 8px'}}>{t.emotion&&<span style={{padding:'2px 6px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td></tr>)}</tbody>
          </table>
        </Card>}
        {dayJournal&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {dayJournal.premarket&&<Card><div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Pre-market plan</div><div style={{fontSize:12,color:'var(--text)',lineHeight:1.6,whiteSpace:'pre-wrap'}}>{dayJournal.premarket}</div></Card>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {dayJournal.went_well&&<Card><div style={{fontSize:10,fontWeight:600,color:'#15803d',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Went well</div><div style={{fontSize:12,color:'var(--text)',lineHeight:1.5,whiteSpace:'pre-wrap'}}>{dayJournal.went_well}</div></Card>}
            {dayJournal.went_wrong&&<Card><div style={{fontSize:10,fontWeight:600,color:'#991b1b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Went wrong</div><div style={{fontSize:12,color:'var(--text)',lineHeight:1.5,whiteSpace:'pre-wrap'}}>{dayJournal.went_wrong}</div></Card>}
          </div>
          {dayJournal.discipline>0&&<Card style={{display:'flex',alignItems:'center',gap:12}}><div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Discipline</div><div style={{display:'flex',gap:3}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} style={{width:18,height:18,borderRadius:3,background:n<=dayJournal.discipline?PURPLE:'var(--surface2)',fontSize:9,color:n<=dayJournal.discipline?'#fff':'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>{n}</div>)}</div><span style={{fontSize:12,fontWeight:500,color:PURPLE}}>{dayJournal.discipline}/10</span></Card>}
          {(dayJournal.emotions||[]).length>0&&<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{dayJournal.emotions.map(em=><span key={em} style={{fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:10,background:EMOTION_BG[em]||'var(--surface2)',color:EMOTION_COLOR[em]||'var(--text-muted)'}}>{em}</span>)}</div>}
        </div>}
        {dayTrades.length===0&&!dayJournal&&<div style={{textAlign:'center',padding:'30px 0',color:'var(--text-muted)',fontSize:13}}>No trades or journal entries for this day</div>}
      </div>
    </div>}
  </div>)
}

function TradeLog({trades,setTrades,tradesKey}){
  const empty={date:'',asset:'',direction:'Long',entry:'',exit:'',pnl:'',r:'',size:'',setup:'',emotion:'',rules:'',notes:''};
  const[form,setForm]=useState(empty);const[adding,setAdding]=useState(false);const[expanded,setExpanded]=useState(null);
  const[showBroker,setShowBroker]=useState(false);
  const fileRef=useRef(null);
  function addTrade(){if(!form.asset||!form.date)return;const u=[form,...trades];setTrades(u);save(tradesKey,u);setForm(empty);setAdding(false)}
  function removeTrade(i){const u=trades.filter((_,idx)=>idx!==i);setTrades(u);save(tradesKey,u)}
  function handleCSV(e){
    const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const rows=ev.target.result.trim().split(/\r?\n/);
      if(rows.length<2)return;
      const hdrs=rows[0].split(',').map(h=>h.trim().toLowerCase().replace(/['"]/g,''));
      const col=(names)=>hdrs.findIndex(h=>names.some(n=>h.includes(n)));
      const di=col(['date','time']),ai=col(['symbol','asset','ticker','instrument','market','coin']),
            si=col(['side','direction','type','action']),eni=col(['entry','open_price','entry_price']),
            exi=col(['exit','close_price','exit_price']),pi=col(['pnl','profit','p&l','realized','gain']),
            szi=col(['size','qty','quantity','amount','volume']),ni=col(['note','comment','desc']);
      const imported=[];
      for(let i=1;i<rows.length;i++){
        const c=rows[i].split(',').map(x=>x.trim().replace(/^["']|["']$/g,''));
        if(!c[di]&&!c[ai])continue;
        const dir=(c[si]||'').toLowerCase();
        imported.push({date:(c[di]||'').slice(0,10),asset:c[ai]||'',direction:dir.includes('sell')||dir.includes('short')?'Short':'Long',entry:c[eni]||'',exit:c[exi]||'',pnl:c[pi]||'',r:'',size:c[szi]||'',setup:'',emotion:'',rules:'',notes:c[ni]||''});
      }
      if(imported.length>0){const u=[...imported,...trades];setTrades(u);save(tradesKey,u);}
      alert(imported.length>0?`Imported ${imported.length} trades.`:'No valid rows found — check your column headers (date, symbol, side, pnl, etc.)');
    };
    reader.readAsText(file);e.target.value='';
  }
  return(<div style={{display:'flex',flexDirection:'column',gap:12}}>
    <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleCSV}/>
    <div style={{display:'flex',gap:8}}><BtnP onClick={()=>setAdding(!adding)}>+ Add trade</BtnP><BtnS onClick={()=>fileRef.current?.click()}>Import CSV</BtnS><BtnS onClick={()=>setShowBroker(p=>!p)}>Connect broker</BtnS><span style={{flex:1}}/><span style={{fontSize:11,color:'var(--text-muted)',alignSelf:'center'}}>{trades.length} trades logged</span></div>
    {showBroker&&<Card style={{border:'0.5px solid var(--border)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><SH style={{marginBottom:0}}>Broker connection</SH><button onClick={()=>setShowBroker(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:16,lineHeight:1}}>x</button></div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
        {[['Coinbase','ti-currency-bitcoin'],['Interactive Brokers','ti-building-bank'],['TD Ameritrade','ti-chart-line'],['Binance','ti-currency-ethereum'],['Tradovate','ti-trending-up'],['Kraken','ti-anchor']].map(([name,icon])=>(
          <div key={name} style={{padding:'10px 12px',border:'0.5px solid var(--border)',borderRadius:8,display:'flex',alignItems:'center',gap:8,opacity:0.5}}>
            <i className={`ti ${icon}`} style={{fontSize:16,color:PURPLE}}/>
            <div><div style={{fontSize:12,fontWeight:500}}>{name}</div><div style={{fontSize:10,color:'var(--text-muted)'}}>Coming soon</div></div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(75,68,200,0.05)',border:'0.5px solid rgba(75,68,200,0.2)',borderRadius:7,padding:'10px 12px',fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>
        <span style={{fontWeight:500,color:PURPLE}}>Live broker sync is on the roadmap.</span> Auto-logging requires a secure server-side OAuth connection to your broker. For now, the fastest way to import trades is to export a CSV from your broker and use the Import CSV button above — most brokers support this.
      </div>
    </Card>}
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

function JournalFolderItem({item,tree,activeJId,onEntry,onNewEntry,onNewFolder}){
  const [open,setOpen]=useState(false);
  if(item.type==='entry'){
    const isActive=item.id===activeJId;
    return(<div onClick={()=>onEntry(item.id)} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:6,cursor:'pointer',background:isActive?'#EEEDFE':'transparent'}}
      onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background='var(--surface2)'}} onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background=isActive?'#EEEDFE':'transparent'}}>
      <i className="ti ti-file-text" style={{fontSize:13,color:'var(--text-muted)',flexShrink:0}}/>
      <span style={{fontSize:13,color:isActive?'#534AB7':'var(--text)',fontWeight:isActive?500:400,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
      {isActive&&<i className="ti ti-check" style={{fontSize:11,color:'#534AB7',flexShrink:0}}/>}
    </div>);
  }
  const children=(tree.items||[]).filter(i=>i.parentId===item.id).sort((a,b)=>a.order-b.order);
  return(<div style={{position:'relative'}} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:6,cursor:'pointer',background:open?'var(--surface2)':'transparent'}}>
      <i className="ti ti-folder" style={{fontSize:13,color:'#BA7517',flexShrink:0}}/>
      <span style={{fontSize:13,color:'var(--text)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</span>
      <i className="ti ti-chevron-left" style={{fontSize:10,color:'var(--text-muted)',flexShrink:0}}/>
    </div>
    {open&&<div style={{position:'absolute',right:'calc(100% + 4px)',top:-5,background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:10,padding:5,minWidth:200,zIndex:1100,boxShadow:'0 4px 20px rgba(0,0,0,0.13)'}}>
      {children.length===0&&<div style={{padding:'8px 10px',fontSize:12,color:'var(--text-muted)'}}>Empty folder</div>}
      {children.map(child=><JournalFolderItem key={child.id} item={child} tree={tree} activeJId={activeJId} onEntry={onEntry} onNewEntry={onNewEntry} onNewFolder={onNewFolder}/>)}
      <div style={{borderTop:'0.5px solid var(--border)',margin:'4px 0'}}/>
      <div onClick={e=>{e.stopPropagation();onNewEntry(item.id);}} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text-muted)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-file-plus" style={{fontSize:12}}/>New entry here</div>
      <div onClick={e=>{e.stopPropagation();onNewFolder(item.id);}} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text-muted)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-folder-plus" style={{fontSize:12}}/>New folder here</div>
    </div>}
  </div>);
}

function BlockRow({block,onUpdate,onEnter,onDelete,onSlashOpen,slashOpen,onChangeType}){
  const [hov,setHov]=useState(false);
  const BLOCK_TYPES=[
    {type:'text',label:'Text',icon:'ti-align-left'},
    {type:'h1',label:'Heading 1',icon:'ti-heading'},
    {type:'h2',label:'Heading 2',icon:'ti-heading'},
    {type:'bullet',label:'Bullet list',icon:'ti-list'},
    {type:'check',label:'Checklist',icon:'ti-checkbox'},
    {type:'divider',label:'Divider',icon:'ti-minus'},
    {type:'callout',label:'Callout',icon:'ti-info-circle'},
  ];
  function handleKey(e){
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();onEnter();}
    if(e.key==='Backspace'&&!block.content){e.preventDefault();onDelete();}
  }
  function handleChange(e){
    const val=e.target.value;
    if(val==='/'&&!block.content){onSlashOpen();return;}
    onUpdate({content:val});
    e.target.style.height='auto';
    e.target.style.height=e.target.scrollHeight+'px';
  }
  if(block.type==='divider')return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <span style={{width:16,flexShrink:0,opacity:hov?1:0,fontSize:10,color:'var(--text-muted)',cursor:'grab',userSelect:'none'}}>⠿</span>
      <div style={{flex:1,height:'0.5px',background:'var(--border)'}}/>
      {hov&&<button onClick={onDelete} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'0 2px'}}>x</button>}
    </div>
  );
  const isH1=block.type==='h1',isH2=block.type==='h2',isCallout=block.type==='callout',isCheck=block.type==='check',isBullet=block.type==='bullet';
  const taStyle={display:'block',width:'100%',border:'none',outline:'none',resize:'none',overflow:'hidden',fontFamily:'var(--font)',background:'none',padding:0,lineHeight:1.65,fontSize:isH1?20:isH2?15:13,fontWeight:isH1||isH2?500:400,color:isCheck&&block.checked?'var(--text-muted)':'var(--text)',textDecoration:isCheck&&block.checked?'line-through':'none'};
  const calloutWrap=isCallout?{background:'var(--surface2)',borderLeft:'3px solid #534AB7',borderRadius:'0 6px 6px 0',padding:'8px 12px'}:{};
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'1px 0',position:'relative',marginBottom:2}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <span style={{width:16,flexShrink:0,marginTop:isH1?5:3,opacity:hov?1:0,fontSize:10,color:'var(--text-muted)',cursor:'grab',userSelect:'none'}}>⠿</span>
      {isBullet&&<span style={{flexShrink:0,marginTop:4,fontSize:14,color:'var(--text-muted)',lineHeight:1}}>•</span>}
      {isCheck&&<div onClick={()=>onUpdate({checked:!block.checked})} style={{flexShrink:0,marginTop:4,width:14,height:14,borderRadius:3,border:'0.5px solid '+(block.checked?'#534AB7':'#AFA9EC'),background:block.checked?'#534AB7':'#EEEDFE',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {block.checked&&<i className="ti ti-check" style={{fontSize:9,color:'#fff'}}/>}
      </div>}
      <div style={{flex:1,position:'relative',...calloutWrap}}>
        <textarea id={'blk_'+block.id} value={block.content} onChange={handleChange} onKeyDown={handleKey} rows={1}
          placeholder={isH1?'Heading 1':isH2?'Heading 2':isBullet?'List item':isCheck?'Checklist item':isCallout?'Callout...':'Type '/' for blocks…'}
          style={{...taStyle,minHeight:'1.65em'}}/>
        {slashOpen&&<div style={{position:'absolute',left:0,top:'100%',background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:8,padding:5,zIndex:200,boxShadow:'0 4px 16px rgba(0,0,0,0.12)',width:180}}>
          {BLOCK_TYPES.map(bt=><div key={bt.type} onClick={()=>{onUpdate({content:''});onChangeType(bt.type);}} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text)'}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <i className={'ti '+bt.icon} style={{fontSize:13,color:'var(--text-muted)'}}/>{bt.label}
          </div>)}
        </div>}
      </div>
      {hov&&!isH1&&<button onClick={onDelete} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'0 2px',marginTop:3,flexShrink:0}}>x</button>}
    </div>
  );
}

function DailyJournal({jTree,saveJTree,activeJId,setActiveJId}){
  const [slashBlockId,setSlashBlockId]=useState(null);
  const entry=activeJId&&jTree.entries?.[activeJId]?jTree.entries[activeJId]:null;
  const item=activeJId?(jTree.items||[]).find(i=>i.id===activeJId):null;

  function updateEntryField(field,val){
    if(!activeJId)return;
    const updated={...jTree,entries:{...jTree.entries,[activeJId]:{...(jTree.entries[activeJId]||{}),[field]:val}}};
    if(field==='name')updated.items=(updated.items||[]).map(i=>i.id===activeJId?{...i,name:val}:i);
    saveJTree(updated);
  }
  function updateBlock(blockId,changes){
    if(!entry)return;
    updateEntryField('blocks',(entry.blocks||[]).map(b=>b.id===blockId?{...b,...changes}:b));
  }
  function addBlockAfter(blockId){
    if(!entry)return;
    const nb={id:'b_'+Date.now(),type:'text',content:'',checked:false};
    const blocks=[...(entry.blocks||[])];
    const idx=blocks.findIndex(b=>b.id===blockId);
    blocks.splice(idx+1,0,nb);
    updateEntryField('blocks',blocks);
    setTimeout(()=>document.getElementById('blk_'+nb.id)?.focus(),50);
  }
  function removeBlock(blockId){
    if(!entry||(entry.blocks||[]).length<=1)return;
    const idx=(entry.blocks||[]).findIndex(b=>b.id===blockId);
    const blocks=(entry.blocks||[]).filter(b=>b.id!==blockId);
    updateEntryField('blocks',blocks);
    if(idx>0)setTimeout(()=>document.getElementById('blk_'+(entry.blocks[idx-1].id))?.focus(),30);
  }
  function changeBlockType(blockId,type){
    updateBlock(blockId,{type});
    setSlashBlockId(null);
    setTimeout(()=>document.getElementById('blk_'+blockId)?.focus(),30);
  }
  function addBlock(){
    if(!entry)return;
    const nb={id:'b_'+Date.now(),type:'text',content:'',checked:false};
    updateEntryField('blocks',[...(entry.blocks||[]),nb]);
    setTimeout(()=>document.getElementById('blk_'+nb.id)?.focus(),50);
  }

  if(!entry)return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 0',color:'var(--text-muted)',fontSize:13}}>
      <i className="ti ti-notebook" style={{fontSize:40,marginBottom:16,opacity:0.3}}/>
      <div style={{fontWeight:500,marginBottom:6,color:'var(--text)',fontSize:15}}>No entry open</div>
      <div style={{fontSize:12}}>Use the journal menu (top right) to open or create an entry.</div>
    </div>
  );

  return(
    <div style={{maxWidth:740,margin:'0 auto',paddingBottom:60}}>
      <input value={item?.name||''} onChange={e=>updateEntryField('name',e.target.value)}
        style={{display:'block',width:'100%',border:'none',outline:'none',fontSize:26,fontWeight:500,color:'var(--text)',background:'none',fontFamily:'var(--font)',marginBottom:8,padding:0}}
        placeholder="Untitled"/>
      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:24,fontSize:12,color:'var(--text-muted)'}}>
        <span>{entry.date||new Date().toISOString().slice(0,10)}</span>
        {(entry.tags||[]).map(t=><span key={t} style={{background:'#EEEDFE',color:'#3C3489',padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer'}} onClick={()=>updateEntryField('tags',(entry.tags||[]).filter(x=>x!==t))}>{t} x</span>)}
        <span onClick={()=>{const t=prompt('Tag:');if(t&&t.trim())updateEntryField('tags',[...(entry.tags||[]),t.trim()]);}} style={{cursor:'pointer',padding:'2px 6px',border:'0.5px solid var(--border)',borderRadius:4,fontSize:11}}>+ tag</span>
      </div>
      {(entry.blocks||[]).map(block=>(
        <BlockRow key={block.id} block={block}
          slashOpen={slashBlockId===block.id}
          onUpdate={changes=>updateBlock(block.id,changes)}
          onEnter={()=>addBlockAfter(block.id)}
          onDelete={()=>removeBlock(block.id)}
          onSlashOpen={()=>setSlashBlockId(slashBlockId===block.id?null:block.id)}
          onChangeType={type=>changeBlockType(block.id,type)}
        />
      ))}
      <div onClick={addBlock} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 0 0 24px',color:'var(--text-muted)',fontSize:12,cursor:'pointer',marginTop:4}}
        onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
        <i className="ti ti-plus" style={{fontSize:12}}/>Add block
      </div>
    </div>
  );
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
  const SETUPS_KEY = STORAGE_KEY+'_setups2';
  const [setups,setSetups]=useState(()=>load(SETUPS_KEY,[]));
  const ACTIVE_KEY=STORAGE_KEY+'_active_setup';
  const [activeId,setActiveId]=useState(()=>{const s=load(STORAGE_KEY+'_setups2',[]);const saved=load(ACTIVE_KEY,null);return (saved&&s.find(x=>x.id===saved))?saved:(s[0]?.id||null);});
  const [renamingId,setRenamingId]=useState(null);
  const [renameVal,setRenameVal]=useState('');
  const [newSetupName,setNewSetupName]=useState('');
  const [showNewSetup,setShowNewSetup]=useState(false);
  React.useEffect(()=>{if(!activeId&&setups.length>0)setActiveId(setups[0].id);},[setups.length]);
  React.useEffect(()=>{if(activeId)save(ACTIVE_KEY,activeId);},[activeId]);
  function saveSetups(updated){setSetups(updated);save(SETUPS_KEY,updated);}
  function createSetup(){
    if(!newSetupName.trim())return;
    const s={id:'s_'+Date.now(),name:newSetupName.trim(),overview:'',entryConditions:[],exitConditions:[],invalidation:[],checklist:[],bestConditions:'',customSections:[]};
    const updated=[...setups,s];saveSetups(updated);setActiveId(s.id);setNewSetupName('');setShowNewSetup(false);
  }
  function deleteSetup(id){const updated=setups.filter(s=>s.id!==id);saveSetups(updated);if(activeId===id)setActiveId(updated[0]?.id||null);}
  function updateSetup(field,val){saveSetups(setups.map(s=>s.id===activeId?{...s,[field]:val}:s));}
  function addToList(field,setup){updateSetup(field,[...(setup[field]||[]),'']);}
  function updateListItem(field,idx,val,setup){updateSetup(field,(setup[field]||[]).map((v,i)=>i===idx?val:v));}
  function removeListItem(field,idx,setup){updateSetup(field,(setup[field]||[]).filter((_,i)=>i!==idx));}
  function addSection(setup){updateSetup('customSections',[...(setup.customSections||[]),{title:'New section',content:''}]);}
  function updateSection(idx,key,val,setup){const s=[...(setup.customSections||[])];s[idx]={...s[idx],[key]:val};updateSetup('customSections',s);}
  function removeSection(idx,setup){updateSetup('customSections',(setup.customSections||[]).filter((_,i)=>i!==idx));}
  const setup=setups.find(s=>s.id===activeId)||setups[0]||null;
  const setupTrades=setup?trades.filter(t=>t.setup===setup.name):[];
  const wins=setupTrades.filter(t=>pnlNum(t.pnl)>0).length;
  const wr=setupTrades.length>0?Math.round((wins/setupTrades.length)*100):null;
  const netPnl=setupTrades.reduce((s,t)=>s+pnlNum(t.pnl),0);
  const avgR=setupTrades.length>0?(setupTrades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/setupTrades.length).toFixed(1):null;
  function ListSection({label,field,placeholder,dotColor}){
    const items=(setup&&setup[field])||[];
    return(<Card style={{height:'100%',boxSizing:'border-box'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <SH style={{marginBottom:0}}>{label}</SH>
        <button onClick={()=>addToList(field,setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,display:'flex',alignItems:'center',gap:3,fontFamily:'var(--font)',padding:'1px 4px',borderRadius:4}}><i className="ti ti-plus" style={{fontSize:12}}/>Add</button>
      </div>
      {items.length===0&&<div style={{fontSize:12,color:'var(--text-muted)',padding:'4px 0'}}>None yet — add one above.</div>}
      {items.map((item,i)=>(
        <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:dotColor,flexShrink:0}}/>
          <Inp value={item} onChange={e=>updateListItem(field,i,e.target.value,setup)} placeholder={placeholder}/>
          <button onClick={()=>removeListItem(field,i,setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:'1px 3px',lineHeight:1,flexShrink:0}}>x</button>
        </div>
      ))}
    </Card>);
  }
  return(
    <div style={{display:'grid',gridTemplateColumns:'190px 1fr',gap:14,alignItems:'start'}}>
      <div>
        <SH>My setups</SH>
        <div style={{display:'flex',flexDirection:'column',gap:4}}>
          {setups.map(s=>{
            const st=trades.filter(t=>t.setup===s.name);const w=st.filter(t=>pnlNum(t.pnl)>0).length;
            return(<div key={s.id}>
              {renamingId===s.id?(
                <div style={{display:'flex',gap:4,marginBottom:2}}>
                  <input value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                    onKeyDown={e=>{if(e.key==='Enter'){saveSetups(setups.map(x=>x.id===s.id?{...x,name:renameVal.trim()||x.name}:x));setRenamingId(null);}if(e.key==='Escape')setRenamingId(null);}} autoFocus
                    style={{flex:1,padding:'5px 8px',border:'0.5px solid var(--border)',borderRadius:5,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none'}}/>
                  <button onClick={()=>{saveSetups(setups.map(x=>x.id===s.id?{...x,name:renameVal.trim()||x.name}:x));setRenamingId(null);}}
                    style={{padding:'4px 8px',background:PURPLE,color:'#fff',border:'none',borderRadius:5,fontSize:11,cursor:'pointer',fontFamily:'var(--font)',fontWeight:500}}>OK</button>
                </div>
              ):(
                <div onClick={()=>setActiveId(s.id)} style={{padding:'8px 10px',borderRadius:7,border:`0.5px solid ${s.id===activeId?'rgba(75,68,200,0.3)':'var(--border)'}`,background:s.id===activeId?'rgba(75,68,200,0.06)':'var(--surface2)',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:s.id===activeId?500:400,color:s.id===activeId?'#3C3489':'var(--text)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>{st.length} trades{st.length>0?` · ${Math.round((w/st.length)*100)}% win`:''}</div>
                  </div>
                  <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                    <button onClick={()=>{setRenamingId(s.id);setRenameVal(s.name);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'1px 3px',borderRadius:3}}><i className="ti ti-pencil" style={{fontSize:10}}/></button>
                    <button onClick={()=>deleteSetup(s.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'1px 3px',borderRadius:3}}>x</button>
                  </div>
                </div>
              )}
            </div>);
          })}
        </div>
        <div style={{marginTop:8,borderTop:'0.5px solid var(--border)',paddingTop:8}}>
          {showNewSetup?(
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              <input value={newSetupName} onChange={e=>setNewSetupName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createSetup()} placeholder="Setup name..." autoFocus
                style={{width:'100%',padding:'6px 8px',border:'0.5px solid var(--border)',borderRadius:5,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',boxSizing:'border-box'}}/>
              <div style={{display:'flex',gap:4}}>
                <BtnS onClick={()=>setShowNewSetup(false)} style={{flex:1,textAlign:'center'}}>Cancel</BtnS>
                <BtnP onClick={createSetup} style={{flex:1,textAlign:'center'}}>Add</BtnP>
              </div>
            </div>
          ):(
            <div onClick={()=>setShowNewSetup(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',borderRadius:7,cursor:'pointer',color:'var(--text-muted)',fontSize:12}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <i className="ti ti-plus" style={{fontSize:13}}/>New setup
            </div>
          )}
        </div>
      </div>
      {!setup?(
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 0',color:'var(--text-muted)',fontSize:13}}>
          <i className="ti ti-book-2" style={{fontSize:32,marginBottom:12,opacity:0.4}}/>
          <div style={{fontWeight:500,marginBottom:4,color:'var(--text)'}}>No setup selected</div>
          <div style={{fontSize:12}}>Create your first setup to get started.</div>
        </div>
      ):(
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}>
            <Card style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:18,fontWeight:500,color:wr!==null&&wr>=50?'var(--green)':'var(--text)'}}>{wr!==null?wr+'%':'—'}</div><div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Win rate</div></Card>
            <Card style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:18,fontWeight:500,color:netPnl>0?'var(--green)':netPnl<0?'var(--red)':'var(--text)'}}>{setupTrades.length>0?(netPnl>=0?'+':'')+'$'+Math.abs(netPnl).toFixed(0):'—'}</div><div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Net P&amp;L</div></Card>
            <Card style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:18,fontWeight:500}}>{avgR||'—'}</div><div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Avg R</div></Card>
            <Card style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:18,fontWeight:500}}>{setupTrades.length}</div><div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>Trades</div></Card>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,gridAutoRows:'1fr'}}>
            <Card style={{height:'100%',boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
              <SH>Overview</SH>
              <Textarea value={setup.overview||''} onChange={e=>updateSetup('overview',e.target.value)} placeholder="Describe this setup — what it is, why it works, when you look for it..." style={{flex:1,minHeight:48}}/>
            </Card>
            <Card style={{height:'100%',boxSizing:'border-box'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <SH style={{marginBottom:0}}>Pre-trade checklist</SH>
                <button onClick={()=>addToList('checklist',setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,display:'flex',alignItems:'center',gap:3,fontFamily:'var(--font)',padding:'1px 4px',borderRadius:4}}><i className="ti ti-plus" style={{fontSize:12}}/>Add</button>
              </div>
              {(setup.checklist||[]).length===0&&<div style={{fontSize:12,color:'var(--text-muted)',padding:'4px 0'}}>No checklist items yet.</div>}
              {(setup.checklist||[]).map((item,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                  <div style={{width:14,height:14,borderRadius:3,border:`0.5px solid ${PURPLE}`,background:'rgba(75,68,200,0.08)',flexShrink:0}}/>
                  <Inp value={item} onChange={e=>updateListItem('checklist',i,e.target.value,setup)} placeholder="Checklist item"/>
                  <button onClick={()=>removeListItem('checklist',i,setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:'1px 3px',lineHeight:1,flexShrink:0}}>x</button>
                </div>
              ))}
            </Card>
            <ListSection label="Entry conditions" field="entryConditions" placeholder="Add an entry condition" dotColor={PURPLE}/>
            <ListSection label="Invalidation" field="invalidation" placeholder="When does this setup fail?" dotColor="#993C1D"/>
            <ListSection label="Exit conditions" field="exitConditions" placeholder="Add an exit condition" dotColor="#0F6E56"/>
            <Card style={{height:'100%',boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
              <SH>Best market conditions</SH>
              <Textarea value={setup.bestConditions||''} onChange={e=>updateSetup('bestConditions',e.target.value)} placeholder="When does this setup perform best? Seasonality, market regimes, instruments..." style={{flex:1,minHeight:48}}/>
            </Card>
          </div>
          {(setup.customSections||[]).map((cs,i)=>(
            <Card key={i} style={{minHeight:180,display:'flex',flexDirection:'column'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <input value={cs.title} onChange={e=>updateSection(i,'title',e.target.value,setup)}
                  style={{fontWeight:600,fontSize:10,background:'none',border:'none',outline:'none',color:'var(--text-muted)',fontFamily:'var(--font)',letterSpacing:'0.06em',textTransform:'uppercase'}}/>
                <button onClick={()=>removeSection(i,setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'1px 4px'}}>x</button>
              </div>
              <Textarea value={cs.content} onChange={e=>updateSection(i,'content',e.target.value,setup)} placeholder="Add your notes..."/>
            </Card>
          ))}
          <div onClick={()=>addSection(setup)} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:8,border:'0.5px dashed var(--border)',color:'var(--text-muted)',fontSize:12,cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <i className="ti ti-layout-grid-add" style={{fontSize:14}}/>Add custom section
          </div>
        </div>
      )}
    </div>
  );
}


const BOOKS_KEY = 'tr_journal_books';

const PORTFOLIO_BOOKS_KEY = 'tr_portfolio_books';
const SECTOR_COLORS = {Technology:'#534AB7',Crypto:'#BA7517',Financials:'#0F6E56',Consumer:'#185FA5',Healthcare:'#993556',Energy:'#993C1D',Materials:'#639922','Real Estate':'#D85A30',Utilities:'#5F5E5A',Communication:'#1D9E75',Cash:'#B4B2A9'};
const ASSET_COLORS = ['#534AB7','#0F6E56','#BA7517','#185FA5','#993556','#993C1D','#639922','#1D9E75','#D85A30','#5F5E5A'];

function donutPath(cx,cy,outerR,innerR,startA,endA){
  const s=startA*Math.PI/180,e=endA*Math.PI/180;
  const x1o=cx+outerR*Math.cos(s),y1o=cy+outerR*Math.sin(s);
  const x2o=cx+outerR*Math.cos(e),y2o=cy+outerR*Math.sin(e);
  const x1i=cx+innerR*Math.cos(s),y1i=cy+innerR*Math.sin(s);
  const x2i=cx+innerR*Math.cos(e),y2i=cy+innerR*Math.sin(e);
  const lg=(endA-startA)>180?1:0;
  return `M${x1o},${y1o} A${outerR},${outerR},0,${lg},1,${x2o},${y2o} L${x2i},${y2i} A${innerR},${innerR},0,${lg},0,${x1i},${y1i}Z`;
}

function Portfolio({holdings,setHoldings,holdingsKey}){
  const [allocView,setAllocView]=useState('sector');
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({symbol:'',name:'',shares:'',avgCost:'',currentPrice:'',sector:'Technology'});
  const fNum=(n)=>parseFloat(n)||0;
  const totalValue=holdings.reduce((s,h)=>s+fNum(h.shares)*fNum(h.currentPrice),0);
  const totalCost=holdings.reduce((s,h)=>s+fNum(h.shares)*fNum(h.avgCost),0);
  const unrealizedPnl=totalValue-totalCost;
  const pctReturn=totalCost>0?((unrealizedPnl/totalCost)*100):0;
  function addHolding(){
    if(!form.symbol.trim()||!form.shares||!form.avgCost)return;
    const h={id:Date.now(),...form,shares:fNum(form.shares),avgCost:fNum(form.avgCost),currentPrice:fNum(form.currentPrice)||fNum(form.avgCost)};
    const updated=[...holdings,h];
    setHoldings(updated);save(holdingsKey,updated);
    setForm({symbol:'',name:'',shares:'',avgCost:'',currentPrice:'',sector:'Technology'});setShowAdd(false);
  }
  function removeHolding(id){const updated=holdings.filter(h=>h.id!==id);setHoldings(updated);save(holdingsKey,updated);}
  let donutData=[];
  if(allocView==='sector'){
    const sectorMap={};
    holdings.forEach(h=>{const sec=h.sector||'Other';const v=fNum(h.shares)*fNum(h.currentPrice);sectorMap[sec]=(sectorMap[sec]||0)+v;});
    Object.entries(sectorMap).forEach(([sec,v])=>donutData.push({label:sec,value:v,color:SECTOR_COLORS[sec]||'#888780'}));
  } else {
    holdings.forEach((h,i)=>{const v=fNum(h.shares)*fNum(h.currentPrice);if(v>0)donutData.push({label:h.symbol||h.name,value:v,color:ASSET_COLORS[i%ASSET_COLORS.length]});});
  }
  donutData.sort((a,b)=>b.value-a.value);
  const donutTotal=donutData.reduce((s,d)=>s+d.value,0);
  let startAngle=-90;
  const segments=donutData.map(d=>{const sweep=donutTotal>0?(d.value/donutTotal)*360:0;const seg={...d,path:sweep>0?donutPath(60,60,50,30,startAngle,startAngle+sweep-0.5):''}; startAngle+=sweep;return seg;});
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
        <Card><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Total value</div><div style={{fontSize:22,fontWeight:500}}>${totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div></Card>
        <Card><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Unrealized P&amp;L</div><div style={{fontSize:22,fontWeight:500,color:unrealizedPnl>=0?'var(--green)':'var(--red)'}}>{unrealizedPnl>=0?'+':''}{unrealizedPnl.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div style={{fontSize:11,color:unrealizedPnl>=0?'var(--green)':'var(--red)'}}>{pctReturn>=0?'+':''}{pctReturn.toFixed(2)}% total return</div></Card>
        <Card><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:4}}>Positions</div><div style={{fontSize:22,fontWeight:500}}>{holdings.length}</div><div style={{fontSize:11,color:'var(--text-muted)'}}>{holdings.length===0?'No positions yet':'Across '+(new Set(holdings.map(h=>h.sector)).size)+' sectors'}</div></Card>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1.6fr 1fr',gap:14,alignItems:'start'}}>
        <Card style={{padding:'12px 14px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <SH style={{marginBottom:0}}>Holdings</SH>
            <BtnP onClick={()=>setShowAdd(p=>!p)} style={{padding:'4px 10px',fontSize:11}}>+ Add position</BtnP>
          </div>
          {showAdd&&(
            <div style={{background:'var(--surface2)',borderRadius:8,padding:10,marginBottom:10,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              <Inp value={form.symbol} onChange={e=>setForm(p=>({...p,symbol:e.target.value.toUpperCase()}))} placeholder="Symbol (AAPL)"/>
              <Inp value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Name (optional)"/>
              <Inp value={form.shares} onChange={e=>setForm(p=>({...p,shares:e.target.value}))} placeholder="Shares" type="number"/>
              <Inp value={form.avgCost} onChange={e=>setForm(p=>({...p,avgCost:e.target.value}))} placeholder="Avg cost $" type="number"/>
              <Inp value={form.currentPrice} onChange={e=>setForm(p=>({...p,currentPrice:e.target.value}))} placeholder="Current price $" type="number"/>
              <Sel value={form.sector} onChange={e=>setForm(p=>({...p,sector:e.target.value}))}>{Object.keys(SECTOR_COLORS).map(s=><option key={s}>{s}</option>)}</Sel>
              <div style={{gridColumn:'1/-1',display:'flex',gap:6,justifyContent:'flex-end'}}><BtnS onClick={()=>setShowAdd(false)}>Cancel</BtnS><BtnP onClick={addHolding}>Add</BtnP></div>
            </div>
          )}
          {holdings.length===0?(
            <div style={{textAlign:'center',padding:'32px 0',color:'var(--text-muted)',fontSize:13}}>No positions yet — add your first holding above.</div>
          ):(
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{borderBottom:'0.5px solid var(--border)'}}>
                {['Symbol','Shares','Avg cost','Price','Value','Gain',''].map((h,i)=><th key={i} style={{textAlign:i>0?'right':'left',padding:'4px 6px',fontWeight:400,color:'var(--text-muted)',fontSize:11,width:i===6?24:undefined}}>{h}</th>)}
              </tr></thead>
              <tbody>{holdings.map(h=>{
                const val=fNum(h.shares)*fNum(h.currentPrice);
                const cost=fNum(h.shares)*fNum(h.avgCost);
                const gain=val-cost;const gainPct=cost>0?(gain/cost*100):0;
                return(<tr key={h.id} style={{borderBottom:'0.5px solid var(--border)'}}>
                  <td style={{padding:'6px 6px',fontWeight:500}}>{h.symbol}</td>
                  <td style={{textAlign:'right',padding:'6px 6px',color:'var(--text-muted)'}}>{h.shares}</td>
                  <td style={{textAlign:'right',padding:'6px 6px',color:'var(--text-muted)'}}>${fNum(h.avgCost).toFixed(2)}</td>
                  <td style={{textAlign:'right',padding:'6px 6px'}}>${fNum(h.currentPrice).toFixed(2)}</td>
                  <td style={{textAlign:'right',padding:'6px 6px',fontWeight:500}}>${val.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                  <td style={{textAlign:'right',padding:'6px 6px',color:gain>=0?'var(--green)':'var(--red)',whiteSpace:'nowrap'}}>{gain>=0?'+':''}{gain.toFixed(0)} <span style={{opacity:0.7}}>({gainPct>=0?'+':''}{gainPct.toFixed(1)}%)</span></td>
                  <td><button onClick={()=>removeHolding(h.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:'2px 4px',lineHeight:1}}>x</button></td>
                </tr>);
              })}</tbody>
            </table>
          )}
        </Card>
        <div>
          <Card style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <SH style={{marginBottom:0}}>Allocation</SH>
              <div style={{display:'flex',gap:4}}>
                {['sector','asset'].map(v=>(
                  <button key={v} onClick={()=>setAllocView(v)} style={{padding:'3px 9px',borderRadius:5,border:'0.5px solid var(--border)',background:allocView===v?'#EEEDFE':'transparent',color:allocView===v?'#534AB7':'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)',fontWeight:allocView===v?500:400,textTransform:'capitalize'}}>{v}</button>
                ))}
              </div>
            </div>
            {donutData.length===0?(
              <div style={{textAlign:'center',padding:'24px 0',color:'var(--text-muted)',fontSize:12}}>Add positions to see allocation</div>
            ):(
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <svg width={120} height={120} viewBox="0 0 120 120">
                  {segments.map((seg,i)=>seg.path?<path key={i} d={seg.path} fill={seg.color} stroke="var(--surface)" strokeWidth={1.5}/>:null)}
                  <text x={60} y={56} textAnchor="middle" fontSize={10} fill="var(--text-muted)">{holdings.length} holdings</text>
                  <text x={60} y={70} textAnchor="middle" fontSize={11} fontWeight="500" fill="var(--text)">${(donutTotal/1000).toFixed(1)}k</text>
                </svg>
                <div style={{flex:1,fontSize:11}}>
                  {donutData.slice(0,7).map((d,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                      <div style={{width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                      <span style={{flex:1,color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.label}</span>
                      <span style={{fontWeight:500}}>{donutTotal>0?((d.value/donutTotal)*100).toFixed(0):0}%</span>
                    </div>
                  ))}
                  {donutData.length>7&&<div style={{fontSize:10,color:'var(--text-muted)',paddingLeft:14}}>+{donutData.length-7} more</div>}
                </div>
              </div>
            )}
          </Card>
          <Card>
            <SH>Summary</SH>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--text-muted)'}}>Total invested</span><span style={{fontWeight:500}}>${totalCost.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--text-muted)'}}>Market value</span><span style={{fontWeight:500}}>${totalValue.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--text-muted)'}}>Total return</span><span style={{fontWeight:500,color:unrealizedPnl>=0?'var(--green)':'var(--red)'}}>{pctReturn>=0?'+':''}{pctReturn.toFixed(2)}%</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}


const TOOLS_TABS = [
  { key:'Journal',    label:'Journal',        sub:'Track & review your trades', icon:'ti-notebook'    },
  { key:'Portfolio', label:'Portfolio',       sub:'Track long-term investments', icon:'ti-briefcase'   },
  { key:'COT Alerts', label:'COT alerts',     sub:'Commitment of traders data',  icon:'ti-bell-ringing'},
  { key:'Screener',   label:'Custom screener',sub:'Build your own screeners',    icon:'ti-filter'      },
]

const JOURNAL_SUBTABS = [
  { key:'dashboard', label:'Dashboard',    icon:'ti-layout-dashboard' },
  { key:'tradelog',  label:'Trade log',    icon:'ti-list-details'     },
  { key:'daily',     label:'Daily journal',icon:'ti-pencil'           },
  { key:'reports',   label:'Reports',      icon:'ti-chart-bar'        },
  { key:'playbook',  label:'Playbook',     icon:'ti-book-2'           },
  { key:'import',    label:'Import data',  icon:'ti-file-import'      },
]

export default function ToolsLayout({tab, setTab, userInfo}){
  const [journalTab, setJournalTab] = useState('dashboard');
  const [jTree,setJTree]=useState(()=>load(JOURNAL_TREE_KEY,{items:[],entries:{}}));
  const [activeJId,setActiveJId]=useState(()=>{const t=load(JOURNAL_TREE_KEY,{items:[],entries:{}});const saved=load(JOURNAL_ACTIVE_KEY,null);if(saved&&(t.items||[]).find(i=>i.id===saved&&i.type==='entry'))return saved;return (t.items||[]).find(i=>i.type==='entry')?.id||null;});
  const [showJDrop,setShowJDrop]=useState(false);
  function saveJTree(t){setJTree(t);save(JOURNAL_TREE_KEY,t);}
  React.useEffect(()=>{function h(e){if(showJDrop&&!e.target.closest('[data-jdrop]'))setShowJDrop(false);}document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[showJDrop]);
  function openJEntry(id){setActiveJId(id);save(JOURNAL_ACTIVE_KEY,id);setShowJDrop(false);}
  function newJEntry(parentId=null){const id='je_'+Date.now();const it={id,type:'entry',name:'Untitled',parentId,order:Date.now()};const en={blocks:[{id:'b_'+Date.now(),type:'text',content:'',checked:false}],tags:[],date:new Date().toISOString().slice(0,10)};const t={...jTree,items:[...(jTree.items||[]),it],entries:{...(jTree.entries||{}),[id]:en}};saveJTree(t);openJEntry(id);}
  function newJFolder(parentId=null){const id='jf_'+Date.now();const it={id,type:'folder',name:'New folder',parentId,order:Date.now()};const t={...jTree,items:[...(jTree.items||[]),it]};saveJTree(t);setShowJDrop(false);}
  const [books, setBooks] = useState(() => load(BOOKS_KEY, [{id:'default',name:'Main Journal'}]));
  const [activeBookId, setActiveBookId] = useState(() => load('tr_active_book','default'));
  const [showBookDrop, setShowBookDrop] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [showNewBook, setShowNewBook] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState('');
  const [portfolioBooks, setPortfolioBooks] = useState(() => load(PORTFOLIO_BOOKS_KEY, [{id:'default',name:'Main Portfolio'}]));
  const [activePortfolioId, setActivePortfolioId] = useState(() => load('tr_active_portfolio','default'));
  const [showPortfolioDrop, setShowPortfolioDrop] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [showNewPortfolio, setShowNewPortfolio] = useState(false);
  const [renamingPortfolioId, setRenamingPortfolioId] = useState(null);
  const [renamePortfolioVal, setRenamePortfolioVal] = useState('');
  const holdingsKey = 'tr_portfolio_holdings_'+activePortfolioId;
  const [portfolioHoldings, setPortfolioHoldings] = useState(() => load('tr_portfolio_holdings_default', []));
  const activePortfolio = portfolioBooks.find(b=>b.id===activePortfolioId)||portfolioBooks[0];
  function switchPortfolio(id){save('tr_active_portfolio',id);setActivePortfolioId(id);setPortfolioHoldings(load('tr_portfolio_holdings_'+id,[]));setShowPortfolioDrop(false);setShowNewPortfolio(false);}
  function createPortfolio(){if(!newPortfolioName.trim())return;const id='port_'+Date.now();const updated=[...portfolioBooks,{id,name:newPortfolioName.trim()}];setPortfolioBooks(updated);save(PORTFOLIO_BOOKS_KEY,updated);setNewPortfolioName('');setShowNewPortfolio(false);switchPortfolio(id);}
  function deletePortfolio(id){if(id==='default')return;const updated=portfolioBooks.filter(b=>b.id!==id);setPortfolioBooks(updated);save(PORTFOLIO_BOOKS_KEY,updated);if(activePortfolioId===id)switchPortfolio('default');}
  function renamePortfolio(id,name){if(!name.trim())return;const updated=portfolioBooks.map(b=>b.id===id?{...b,name:name.trim()}:b);setPortfolioBooks(updated);save(PORTFOLIO_BOOKS_KEY,updated);setRenamingPortfolioId(null);setRenamePortfolioVal('');}
  const tradesKey = activeBookId==='default'?STORAGE_KEY+'_trades':STORAGE_KEY+'_trades_'+activeBookId;
  const journalsKey = activeBookId==='default'?STORAGE_KEY+'_journals':STORAGE_KEY+'_journals_'+activeBookId;
  const [trades, setTrades] = useState(() => load(tradesKey, []));
  const [journals, setJournals] = useState(() => load(journalsKey, []));
  const activeBook = books.find(b=>b.id===activeBookId)||books[0];
  function switchBook(id){
    save('tr_active_book',id);setActiveBookId(id);
    const tk=id==='default'?STORAGE_KEY+'_trades':STORAGE_KEY+'_trades_'+id;
    const jk=id==='default'?STORAGE_KEY+'_journals':STORAGE_KEY+'_journals_'+id;
    setTrades(load(tk,[]));setJournals(load(jk,[]));
    setShowBookDrop(false);setShowNewBook(false);
  }
  function createBook(){
    if(!newBookName.trim())return;
    const id='book_'+Date.now();
    const updated=[...books,{id,name:newBookName.trim()}];
    setBooks(updated);save(BOOKS_KEY,updated);
    setNewBookName('');setShowNewBook(false);
    switchBook(id);
  }
  function deleteBook(id){
    if(id==='default')return;
    const updated=books.filter(b=>b.id!==id);
    setBooks(updated);save(BOOKS_KEY,updated);
    if(activeBookId===id)switchBook('default');
  }
  function renameBook(id,name){
    if(!name.trim())return;
    const updated=books.map(b=>b.id===id?{...b,name:name.trim()}:b);
    setBooks(updated);save(BOOKS_KEY,updated);
    setRenamingId(null);setRenameVal('');
  }

  React.useEffect(() => { if (!tab) setTab('Journal'); }, []);

  // Lazy-load heavy components
  const [COTAlertsTab,   setCOTAlertsTab]   = useState(null);
  const [ScreenerBuilder, setScreenerBuilder] = useState(null);
  const [ImportTab,       setImportTab]       = useState(null);

  React.useEffect(() => {
    if (tab === 'COT Alerts' && !COTAlertsTab) import('./COTAlertsTab').then(m => setCOTAlertsTab(() => m.default)).catch(() => {});
    if (tab === 'Screener'&& !ScreenerBuilder) import('./ScreenerBuilder').then(m => setScreenerBuilder(() => m.default)).catch(() => {});
    if (journalTab === 'import' && !ImportTab) import('./ImportTab').then(m => setImportTab(() => m.default)).catch(() => {});
  }, [tab, journalTab]);

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



        {/* Journal horizontal subtab strip + book selector */}
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
            <div style={{ marginLeft:'auto', position:'relative' }}>
              {journalTab==='daily'?(
                <button onClick={()=>setShowJDrop(p=>!p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:7, border:'0.5px solid var(--border)', background:'var(--surface2)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', fontWeight:500 }}>
                  <i className="ti ti-notebook" style={{fontSize:14,color:'#534AB7'}}/>{activeJId?(jTree.items||[]).find(i=>i.id===activeJId)?.name||'Journal':'Journal'}<i className="ti ti-chevron-down" style={{fontSize:11,color:'var(--text-muted)',marginLeft:4}}/>
                </button>
              ):(
                <button onClick={()=>setShowBookDrop(p=>!p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:7, border:'0.5px solid var(--border)', background:'var(--surface2)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', fontWeight:500 }}>
                  <i className="ti ti-books" style={{fontSize:14}}/>{activeBook?.name}<i className="ti ti-chevron-down" style={{fontSize:11,color:'var(--text-muted)',marginLeft:4}}/>
                </button>
              )}
              {journalTab==='daily'&&showJDrop&&<div style={{position:'absolute',right:0,top:'calc(100% + 4px)',background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:10,padding:5,minWidth:210,zIndex:999,boxShadow:'0 4px 20px rgba(0,0,0,0.13)'}} onClick={e=>e.stopPropagation()}>
                {(jTree.items||[]).filter(i=>!i.parentId).sort((a,b)=>a.order-b.order).map(item=>(
                  <JournalFolderItem key={item.id} item={item} tree={jTree} activeJId={activeJId} onEntry={openJEntry} onNewEntry={newJEntry} onNewFolder={newJFolder}/>
                ))}
                {(jTree.items||[]).filter(i=>!i.parentId).length===0&&<div style={{padding:'8px 10px',fontSize:12,color:'var(--text-muted)'}}>No entries yet</div>}
                <div style={{borderTop:'0.5px solid var(--border)',margin:'4px 0'}}/>
                <div onClick={()=>newJEntry(null)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text-muted)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-file-plus" style={{fontSize:12}}/>New entry</div>
                <div onClick={()=>newJFolder(null)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text-muted)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-folder-plus" style={{fontSize:12}}/>New folder</div>
              </div>}
              {showBookDrop&&<div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:6, minWidth:190, zIndex:999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }} onClick={e=>e.stopPropagation()}>
                {books.map(b=>(
                  <div key={b.id} style={{ borderRadius:7, background:b.id===activeBookId?'#EEEDFE':'transparent' }}
                    onMouseEnter={e=>{if(b.id!==activeBookId&&renamingId!==b.id)e.currentTarget.style.background='var(--surface2)'}} onMouseLeave={e=>{if(b.id!==activeBookId)e.currentTarget.style.background=b.id===activeBookId?'#EEEDFE':'transparent'}}>
                    {renamingId===b.id?(
                      <div style={{ display:'flex', gap:4, padding:'5px 6px' }} onClick={e=>e.stopPropagation()}>
                        <input value={renameVal} onChange={e=>setRenameVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renameBook(b.id,renameVal);if(e.key==='Escape'){setRenamingId(null);setRenameVal('');}}} autoFocus
                          style={{ flex:1, padding:'4px 7px', border:'0.5px solid var(--border)', borderRadius:5, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}/>
                        <button onClick={()=>renameBook(b.id,renameVal)} style={{ padding:'4px 8px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>OK</button>
                      </div>
                    ):(
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', cursor:'pointer' }} onClick={()=>switchBook(b.id)}>
                        <span style={{ fontSize:13, fontWeight:b.id===activeBookId?500:400, color:b.id===activeBookId?'#534AB7':'var(--text)', flex:1 }}>{b.name}</span>
                        <div style={{ display:'flex', gap:2 }} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>{setRenamingId(b.id);setRenameVal(b.name);}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, padding:'1px 3px', lineHeight:1, borderRadius:3 }} title="Rename"><i className="ti ti-pencil" style={{fontSize:11}}/></button>
                          {b.id!=='default'&&<button onClick={()=>deleteBook(b.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:'1px 3px', lineHeight:1, borderRadius:3 }}>x</button>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ borderTop:'0.5px solid var(--border)', marginTop:4, paddingTop:4 }}>
                  {showNewBook?(
                    <div style={{ padding:'4px 6px', display:'flex', gap:6 }}>
                      <input value={newBookName} onChange={e=>setNewBookName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createBook()} placeholder="Journal name..." autoFocus
                        style={{ flex:1, padding:'5px 8px', border:'0.5px solid var(--border)', borderRadius:5, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}/>
                      <button onClick={createBook} style={{ padding:'5px 10px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>Add</button>
                    </div>
                  ):(
                    <div onClick={()=>setShowNewBook(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:7, cursor:'pointer', color:'var(--text-muted)', fontSize:12 }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <i className="ti ti-plus" style={{fontSize:13}}/> New journal
                    </div>
                  )}
                </div>
              </div>}
            </div>
          </div>
        )}

        {/* Portfolio selector bar */}
        {tab === 'Portfolio' && (
          <div style={{ display:'flex', alignItems:'center', padding:'0 18px', gap:12, borderBottom:'0.5px solid var(--border)', flexShrink:0, height:44 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>Portfolio tracker</div>
            <div style={{ marginLeft:'auto', position:'relative' }}>
              <button onClick={()=>setShowPortfolioDrop(p=>!p)} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 10px', borderRadius:7, border:'0.5px solid var(--border)', background:'var(--surface2)', cursor:'pointer', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', fontWeight:500 }}>
                <i className="ti ti-briefcase" style={{fontSize:14}}/>{activePortfolio?.name}<i className="ti ti-chevron-down" style={{fontSize:11,color:'var(--text-muted)',marginLeft:4}}/>
              </button>
              {showPortfolioDrop&&<div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:6, minWidth:210, zIndex:999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }} onClick={e=>e.stopPropagation()}>
                {portfolioBooks.map(b=>(
                  <div key={b.id} style={{ borderRadius:7, background:b.id===activePortfolioId?'#EEEDFE':'transparent' }}
                    onMouseEnter={e=>{if(b.id!==activePortfolioId&&renamingPortfolioId!==b.id)e.currentTarget.style.background='var(--surface2)'}} onMouseLeave={e=>{if(b.id!==activePortfolioId)e.currentTarget.style.background=b.id===activePortfolioId?'#EEEDFE':'transparent'}}>
                    {renamingPortfolioId===b.id?(
                      <div style={{ display:'flex', gap:4, padding:'5px 6px' }} onClick={e=>e.stopPropagation()}>
                        <input value={renamePortfolioVal} onChange={e=>setRenamePortfolioVal(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')renamePortfolio(b.id,renamePortfolioVal);if(e.key==='Escape'){setRenamingPortfolioId(null);setRenamePortfolioVal('');}}} autoFocus
                          style={{ flex:1, padding:'4px 7px', border:'0.5px solid var(--border)', borderRadius:5, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}/>
                        <button onClick={()=>renamePortfolio(b.id,renamePortfolioVal)} style={{ padding:'4px 8px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>OK</button>
                      </div>
                    ):(
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', cursor:'pointer' }} onClick={()=>switchPortfolio(b.id)}>
                        <span style={{ fontSize:13, fontWeight:b.id===activePortfolioId?500:400, color:b.id===activePortfolioId?'#534AB7':'var(--text)', flex:1 }}>{b.name}</span>
                        <div style={{ display:'flex', gap:2 }} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>{setRenamingPortfolioId(b.id);setRenamePortfolioVal(b.name);}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, padding:'1px 3px', lineHeight:1, borderRadius:3 }} title="Rename"><i className="ti ti-pencil" style={{fontSize:11}}/></button>
                          {b.id!=='default'&&<button onClick={()=>deletePortfolio(b.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:'1px 3px', lineHeight:1, borderRadius:3 }}>x</button>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div style={{ borderTop:'0.5px solid var(--border)', marginTop:4, paddingTop:4 }}>
                  {showNewPortfolio?(
                    <div style={{ padding:'4px 6px', display:'flex', gap:6 }}>
                      <input value={newPortfolioName} onChange={e=>setNewPortfolioName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createPortfolio()} placeholder="Portfolio name..." autoFocus
                        style={{ flex:1, padding:'5px 8px', border:'0.5px solid var(--border)', borderRadius:5, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}/>
                      <button onClick={createPortfolio} style={{ padding:'5px 10px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>Add</button>
                    </div>
                  ):(
                    <div onClick={()=>setShowNewPortfolio(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 10px', borderRadius:7, cursor:'pointer', color:'var(--text-muted)', fontSize:12 }}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <i className="ti ti-plus" style={{fontSize:13}}/> New portfolio
                    </div>
                  )}
                </div>
              </div>}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
          {tab==='Journal' && journalTab==='dashboard' && <Dashboard trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='tradelog'  && <TradeLog  trades={trades} setTrades={setTrades} tradesKey={tradesKey}/>}
          {tab==='Journal' && journalTab==='daily'     && <DailyJournal jTree={jTree} saveJTree={saveJTree} activeJId={activeJId} setActiveJId={setActiveJId}/>}
          {tab==='Journal' && journalTab==='reports'   && <Reports   trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='playbook'  && <Playbook  trades={trades}/>}
          {tab==='Journal' && journalTab==='import'    && (ImportTab ? <ImportTab/> : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='COT Alerts'&&(COTAlertsTab    ? <COTAlertsTab/>                       : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Screener'&& (ScreenerBuilder ? <ScreenerBuilder user={userInfo}/>    : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Portfolio' && <Portfolio holdings={portfolioHoldings} setHoldings={setPortfolioHoldings} holdingsKey={holdingsKey}/>}
        </div>
      </div>
    </div>
  );
}
