'use client'
import React, { useState, useRef, useLayoutEffect } from 'react'

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
function Textarea({value,onChange,placeholder,style}){
  const ref=React.useRef(null);
  React.useEffect(()=>{if(!ref.current)return;ref.current.style.height='auto';ref.current.style.height=Math.max(ref.current.scrollHeight,parseInt(style?.minHeight||72))+"px";},[value]);
  return <textarea ref={ref} value={value} onChange={onChange} placeholder={placeholder} style={{width:'100%',padding:'8px 10px',border:'0.5px solid var(--border2)',borderRadius:6,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',resize:'none',minHeight:96,boxSizing:'border-box',overflow:'hidden',...style}}/>;
}

function getCalendarDays(year,month){const firstDay=new Date(year,month,1).getDay();const daysInMonth=new Date(year,month+1,0).getDate();const days=[];for(let i=0;i<firstDay;i++)days.push(null);for(let i=1;i<=daysInMonth;i++)days.push(i);return days}
function toDateStr(y,m,d){return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`}
function fmtDateWithDay(s){if(!s)return'—';const d=new Date(s+'T00:00:00');return['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+' '+s;}

// ── Equity SVG line chart ─────────────────────────────────────────────────────
function EquityChart({points}){
  const [hi,setHi]=useState(null);
  if(!points||points.length<2)return<div style={{height:160,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:12}}>Add trades to see your equity curve</div>;
  const W=480,H=160,pl=52,pr=12,pt=14,pb=28,cW=W-pl-pr,cH=H-pt-pb;
  const vals=points.map(p=>p.bal);
  const mn=Math.min(...vals),mx=Math.max(...vals),rng=Math.max(mx-mn,1);
  const pad=rng*0.14;const yLo=mn-pad,yRng=(mx+pad)-yLo;
  const toX=i=>pl+(points.length>1?i/(points.length-1):0.5)*cW;
  const toY=v=>pt+cH-((v-yLo)/yRng)*cH;
  const lineD=points.map((p,i)=>(i===0?'M':'L')+toX(i).toFixed(1)+' '+toY(p.bal).toFixed(1)).join(' ');
  const areaD=lineD+` L${toX(points.length-1).toFixed(1)} ${(pt+cH).toFixed(1)} L${pl} ${(pt+cH).toFixed(1)} Z`;
  const yTicks=[0,1,2,3].map(k=>yLo+yRng*k/3);
  const fmtK=v=>{const a=Math.abs(v);return a>=1000000?'$'+(v/1e6).toFixed(1)+'M':a>=1000?'$'+(v/1000).toFixed(0)+'k':'$'+v.toFixed(0);};
  const hP=hi!==null?points[hi]:null;
  const hX=hP?toX(hi):0,hY=hP?toY(hP.bal):0;
  const tW=100,tH=36,tX=Math.min(Math.max(hX-tW/2,pl),W-tW-4),tY=Math.max(hY-tH-10,2);
  const fmtDateLabel=d=>{if(!d)return'';const[,mm,dd]=d.split('-');const mon=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mm];return mon+' '+parseInt(dd);};
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',overflow:'visible'}}>
      <defs>
        <linearGradient id="eq-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      {yTicks.map((v,i)=>(
        <g key={i}>
          <line x1={pl} y1={toY(v)} x2={pl+cW} y2={toY(v)} stroke="var(--border)" strokeWidth="0.5"/>
          <text x={pl-5} y={toY(v)+3.5} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font)">{fmtK(v)}</text>
        </g>
      ))}
      <path d={areaD} fill="url(#eq-g)"/>
      <path d={lineD} fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      {hP&&<line x1={hX} y1={pt} x2={hX} y2={pt+cH} stroke="rgba(0,0,0,0.12)" strokeWidth="1" strokeDasharray="3,2"/>}
      {points.map((p,i)=>{
        const dotCol=i===0?'#94a3b8':p.pnl>0?'#16a34a':p.pnl<0?'#ef4444':'#94a3b8';
        return(
          <circle key={i} cx={toX(i)} cy={toY(p.bal)} r={hi===i?6:4}
            style={{fill:dotCol,stroke:'var(--surface)',strokeWidth:1.5,cursor:'crosshair'}}
            onMouseEnter={()=>setHi(i)} onMouseLeave={()=>setHi(null)}/>
        );
      })}
      {points.map((p,i)=>p.date?(
        <text key={p.date} x={toX(i)} y={H-2} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="var(--font)">{fmtDateLabel(p.date)}</text>
      ):null)}
      {hP&&(
        <g>
          <rect x={tX} y={tY} width={tW} height={tH} rx={6} fill="rgba(5,5,10,0.88)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
          <text x={tX+tW/2} y={tY+13} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.55)" fontFamily="var(--font)">{hP.date||'Start'}</text>
          <text x={tX+tW/2} y={tY+29} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="var(--font)">{fmtK(hP.bal)}</text>
        </g>
      )}
    </svg>
  );
}

function Dashboard({trades,journals}){
  const now=new Date();const[calYear,setCalYear]=useState(now.getFullYear());const[calMonth,setCalMonth]=useState(now.getMonth());
  const[dayModal,setDayModal]=useState(null);
  const total=trades.length;const wins=trades.filter(t=>pnlNum(t.pnl)>0).length;const winRate=total>0?Math.round((wins/total)*100):0;
  const netPnl=trades.reduce((s,t)=>s+pnlNum(t.pnl),0);const avgRR=total>0?(trades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/total).toFixed(1):'—';
  const grossWin=trades.filter(t=>pnlNum(t.pnl)>0).reduce((s,t)=>s+pnlNum(t.pnl),0);const grossLoss=Math.abs(trades.filter(t=>pnlNum(t.pnl)<0).reduce((s,t)=>s+pnlNum(t.pnl),0));
  const profitFactor=grossLoss>0?(grossWin/grossLoss).toFixed(2):'—';
  let _peak=0,_dd=0,_cum=0;[...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{_cum+=pnlNum(t.pnl);if(_cum>_peak)_peak=_cum;const d=_peak-_cum;if(d>_dd)_dd=d});const maxDrawdown=_dd;
  const PACC_KEY='tr_port_accounts_v3';const _accs=load(PACC_KEY,[]);const accountTotal=_accs.length>0?_accs.reduce((s,a)=>s+(typeof a.cash==='number'?a.cash:parseFloat(a.cash)||0),0):null;
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

  // ── Time slot state ──
  const TIME_SLOTS_KEY=STORAGE_KEY+'_tslots';
  const defaultTimeSlots=[
    {id:'ts1',label:'Pre-market',start:'09:00',end:'09:30'},
    {id:'ts2',label:'Open (9:30–10)',start:'09:30',end:'10:00'},
    {id:'ts3',label:'Morning (10–11)',start:'10:00',end:'11:00'},
    {id:'ts4',label:'Midday (11–1)',start:'11:00',end:'13:00'},
    {id:'ts5',label:'Afternoon (1–3)',start:'13:00',end:'15:00'},
    {id:'ts6',label:'Close (3–4)',start:'15:00',end:'16:00'},
  ];
  const [timeSlots,setTimeSlots]=useState(()=>load(TIME_SLOTS_KEY,defaultTimeSlots));
  const [editSlots,setEditSlots]=useState(false);
  function saveSlots(s){setTimeSlots(s);save(TIME_SLOTS_KEY,s);}
  function tmToMins(t){const[h,m]=(t||'').split(':').map(Number);return isNaN(h)?null:h*60+(m||0);}
  const hasTimes=trades.some(t=>t.time);
  const todStats=timeSlots.map(slot=>{
    const s=tmToMins(slot.start),e=tmToMins(slot.end);
    const matching=trades.filter(t=>{const tm=tmToMins(t.time);return tm!==null&&tm>=s&&tm<e;});
    const w=matching.filter(t=>pnlNum(t.pnl)>0).length;
    const pnl=matching.reduce((a,t)=>a+pnlNum(t.pnl),0);
    return {...slot,count:matching.length,wins:w,wr:matching.length>0?Math.round(w/matching.length*100):null,pnl};
  });
  const avgMae=trades.filter(t=>t.mae).length>0?(trades.filter(t=>t.mae).reduce((s,t)=>s+pnlNum(t.mae),0)/trades.filter(t=>t.mae).length):null;
  const avgMfe=trades.filter(t=>t.mfe).length>0?(trades.filter(t=>t.mfe).reduce((s,t)=>s+pnlNum(t.mfe),0)/trades.filter(t=>t.mfe).length):null;
  // ── Analytics computations ──
  const dailySorted=Object.entries(byDate).sort((a,b)=>a[0].localeCompare(b[0]));
  const last60=dailySorted.slice(-60);
  const maxAbsDaily=Math.max(...last60.map(([,v])=>Math.abs(v)),1);
  const byMonth={};trades.forEach(t=>{if(!t.date)return;const m=t.date.slice(0,7);byMonth[m]=(byMonth[m]||0)+pnlNum(t.pnl);});
  const monthList=Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).slice(-8);
  const maxAbsMonth=Math.max(...monthList.map(([,v])=>Math.abs(v)),1);
  const byDow={0:{w:0,t:0,pnl:0},1:{w:0,t:0,pnl:0},2:{w:0,t:0,pnl:0},3:{w:0,t:0,pnl:0},4:{w:0,t:0,pnl:0},5:{w:0,t:0,pnl:0},6:{w:0,t:0,pnl:0}};
  trades.forEach(t=>{if(!t.date)return;const d=new Date(t.date+'T00:00:00').getDay();byDow[d].t++;if(pnlNum(t.pnl)>0)byDow[d].w++;byDow[d].pnl+=pnlNum(t.pnl);});
  const dowNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dowData=[1,2,3,4,5].map(d=>({name:dowNames[d],wr:byDow[d].t>0?Math.round((byDow[d].w/byDow[d].t)*100):null,trades:byDow[d].t,pnl:byDow[d].pnl}));
  const rBuckets=[{label:'<-1R',min:-999,max:-1,c:0},{label:'-1R',min:-1,max:0,c:0},{label:'0R',min:0,max:1,c:0},{label:'1R',min:1,max:2,c:0},{label:'2R',min:2,max:3,c:0},{label:'3R',min:3,max:4,c:0},{label:'4R+',min:4,max:999,c:0}];
  trades.forEach(t=>{const r=parseFloat(t.r);if(isNaN(r))return;rBuckets.forEach((b,bi)=>{if(bi===rBuckets.length-1){if(r>=b.min)b.c++;}else{if(r>=b.min&&r<b.max)b.c++;}});});
  const rMax=Math.max(...rBuckets.map(b=>b.c),1);
  const bySetupD={},byEmotionD={};
  trades.forEach(t=>{
    if(t.setup){if(!bySetupD[t.setup])bySetupD[t.setup]={w:0,t:0,pnl:0};bySetupD[t.setup].t++;if(pnlNum(t.pnl)>0)bySetupD[t.setup].w++;bySetupD[t.setup].pnl+=pnlNum(t.pnl);}
    if(t.emotion){if(!byEmotionD[t.emotion])byEmotionD[t.emotion]={w:0,t:0};byEmotionD[t.emotion].t++;if(pnlNum(t.pnl)>0)byEmotionD[t.emotion].w++;}
  });
  const setupRows=Object.entries(bySetupD).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,6);
  const emotionRows=Object.entries(byEmotionD).sort((a,b)=>(b[1].t>0?b[1].w/b[1].t:0)-(a[1].t>0?a[1].w/a[1].t:0));
  const avgWinPnl=wins>0?grossWin/wins:0;const avgLossPnl=grossLoss>0&&(total-wins)>0?grossLoss/(total-wins):0;
  const avgR=total>0?(trades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/total):0;
  const winR=wins>0?(trades.filter(t=>pnlNum(t.pnl)>0).reduce((s,t)=>s+(parseFloat(t.r)||0),0)/wins):0;
  const lossR=(total-wins)>0?(trades.filter(t=>pnlNum(t.pnl)<0).reduce((s,t)=>s+(parseFloat(t.r)||0),0)/(total-wins)):0;

  // ── Equity curve points ──
  const eqSorted=[...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const accountStart=(accountTotal||0)-netPnl;
  const eqDates=[...new Set(eqSorted.map(t=>t.date).filter(Boolean))].sort();
  const eqPoints=[{date:null,bal:accountStart,pnl:0}];
  let runBal=accountStart;
  eqDates.forEach(d=>{const dp=eqSorted.filter(t=>t.date===d).reduce((s,t)=>s+pnlNum(t.pnl),0);runBal+=dp;eqPoints.push({date:d,bal:runBal,pnl:dp});});
  const eqDisplay=eqPoints.slice(-21);
  const peakBal=Math.max(...eqDisplay.map(p=>p.bal));
  const netChange=eqDisplay.length>1?eqDisplay[eqDisplay.length-1].bal-eqDisplay[0].bal:0;
  const netChangePct=eqDisplay[0].bal>0?((netChange/eqDisplay[0].bal)*100):0;
  const fmtPnl=v=>{const a=Math.abs(v);const s=v>=0?'+':'-';return s+'$'+(a>=1000?(a/1000).toFixed(1)+'k':a.toFixed(0));};
  const fmtMoney=v=>{const a=Math.abs(v);return'$'+(a>=1000000?(a/1e6).toFixed(2)+'M':a>=1000?(a/1000).toFixed(0)+'k':a.toFixed(0));};

  return(<div style={{display:'flex',flexDirection:'column',gap:14}}>

    {/* ── Stats row ── */}
    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
      {[
        {label:'Account Total',value:accountTotal!==null?fmtMoney(accountTotal):'—',color:'var(--text)'},
        {label:'Win Rate',value:total>0?`${winRate}%`:'—',color:'var(--text)'},
        {label:'Total Trades',value:total||'—',color:'var(--text)'},
        {label:'Avg R:R',value:avgRR,color:'var(--text)'},
        {label:'Net P&L',value:netPnl!==0?(netPnl>0?'+':'')+`$${Math.abs(netPnl)>=1000?(netPnl/1000).toFixed(1)+'k':netPnl.toFixed(0)}`:'—',color:netPnl>0?'#16a34a':netPnl<0?'#dc2626':'var(--text)'},
        {label:'Max Drawdown',value:maxDrawdown>0?`-$${maxDrawdown>=1000?(maxDrawdown/1000).toFixed(1)+'k':maxDrawdown.toFixed(0)}`:'—',color:maxDrawdown>0?'#dc2626':'var(--text-muted)'},
      ].map((s,i)=>(
        <div key={s.label} style={{padding:'18px 20px',borderRight:i<5?'0.5px solid var(--border)':'none',textAlign:'left'}}>
          <div style={{fontSize:26,fontWeight:600,color:s.color,letterSpacing:'-0.5px',marginBottom:4,lineHeight:1}}>{s.value}</div>
          <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* ── Calendar + Performance Snapshot ── */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:14}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <SH style={{margin:0}}>P&L Calendar — {monthNames[calMonth]} {calYear}</SH>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {thisMonthPnl!==0&&<span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:5,background:thisMonthPnl>0?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:thisMonthPnl>0?'#15803d':'#dc2626'}}>{thisMonthPnl>0?'+':''}${Math.abs(thisMonthPnl)>=1000?(thisMonthPnl/1000).toFixed(1)+'k':thisMonthPnl.toFixed(0)} MTD</span>}
            <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1)}else setCalMonth(m=>m-1)}} style={{width:26,height:26,border:'0.5px solid var(--border)',borderRadius:6,background:'transparent',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>◀</button>
            <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1)}else setCalMonth(m=>m+1)}} style={{width:26,height:26,border:'0.5px solid var(--border)',borderRadius:6,background:'transparent',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11}}>▶</button>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:6}}>
          {['SU','MO','TU','WE','TH','FR','SA'].map(d=><div key={d} style={{textAlign:'center',fontSize:9,color:'var(--text-muted)',fontWeight:600,letterSpacing:'0.04em',padding:'3px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {calDays.map((day,i)=>{
            if(!day)return<div key={`e${i}`}/>;
            const ds=toDateStr(calYear,calMonth,day);
            const pnl=byDate[ds];
            const isToday=ds===toDateStr(now.getFullYear(),now.getMonth(),now.getDate());
            const isWknd=(i%7)===0||(i%7)===6;
            const hasTrade=pnl!==undefined;
            const bg=pnl>0?'rgba(22,163,74,0.13)':pnl<0?'rgba(220,38,38,0.10)':hasTrade?'rgba(180,83,9,0.10)':isWknd?'transparent':'var(--surface2)';
            const col=pnl>0?'#15803d':pnl<0?'#991b1b':'#92400e';
            return(
              <div key={ds} onClick={()=>setDayModal(ds)}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.8'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                style={{borderRadius:7,background:bg,border:isToday?`1.5px solid ${PURPLE}`:'0.5px solid transparent',padding:'8px 4px',textAlign:'center',minHeight:60,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',cursor:'pointer',gap:3,transition:'opacity 0.1s'}}>
                <div style={{fontSize:11,color:isToday?PURPLE:'var(--text-muted)',fontWeight:isToday?700:400}}>{day}</div>
                {hasTrade&&<div style={{fontSize:13,color:col,fontWeight:700,lineHeight:1,letterSpacing:'-0.3px'}}>{pnl>0?'+':''}${Math.abs(pnl)>=1000?(pnl/1000).toFixed(1)+'k':Math.abs(pnl).toFixed(0)}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:14,marginTop:12}}>
          {[{bg:'rgba(22,163,74,0.13)',label:'Win day'},{bg:'rgba(220,38,38,0.10)',label:'Loss day'},{bg:'var(--surface2)',label:'No trades'}].map(l=>(
            <div key={l.label} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'var(--text-muted)'}}>
              <div style={{width:11,height:11,borderRadius:3,background:l.bg,border:'0.5px solid var(--border)'}}/>
              {l.label}
            </div>
          ))}
        </div>
      </Card>

      {/* Performance Snapshot */}
      <Card>
        <SH>Performance Snapshot</SH>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
          <Card2 style={{textAlign:'center',padding:'12px 8px'}}>
            <div style={{fontSize:22,fontWeight:700,color:streakType==='W'?'#16a34a':streakType==='L'?'#dc2626':'var(--text)',letterSpacing:'-0.5px'}}>{streak>0?`${streakType}${streak}`:'—'}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:3,fontWeight:600}}>Streak</div>
          </Card2>
          <Card2 style={{textAlign:'center',padding:'12px 8px'}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bestAsset?bestAsset[0]:'—'}</div>
            <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Best Asset</div>
            {bestAsset&&<div style={{fontSize:10,color:'#16a34a',fontWeight:600,marginTop:2}}>{fmtPnl(bestAsset[1].pnl)}</div>}
          </Card2>
          <Card2 style={{textAlign:'center',padding:'12px 8px'}}>
            <div style={{fontSize:14,fontWeight:700,color:'var(--text-muted)',marginBottom:2}}>—</div>
            <div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Watch Out</div>
            {worstAsset&&worstAsset[1].pnl<0&&<div style={{fontSize:10,color:'#dc2626',fontWeight:600,marginTop:2}}>{fmtPnl(worstAsset[1].pnl)}</div>}
          </Card2>
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:'var(--text-muted)',marginBottom:6,fontWeight:500}}>Discipline trend (last {discTrend.length} entries)</div>
          {discTrend.length===0
            ?<div style={{fontSize:11,color:'var(--text-muted)'}}>No journal entries yet</div>
            :<div style={{display:'flex',alignItems:'flex-end',gap:3,height:28}}>
              {discTrend.map((v,i)=><div key={i} style={{flex:1,borderRadius:'2px 2px 0 0',background:v>=7?'rgba(22,163,74,0.5)':v>=5?'rgba(75,68,200,0.45)':'rgba(220,38,38,0.4)',height:`${(v/10)*100}%`,minHeight:2}}/>)}
            </div>
          }
        </div>
        <div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:6}}>
            <span style={{color:'var(--text-muted)'}}>Journal consistency</span>
            <span style={{fontWeight:600,color:'var(--text)'}}>{journaledDays}/{Math.max(tradingDays,1)} days</span>
          </div>
          <div style={{height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
            <div style={{width:`${tradingDays>0?(journaledDays/tradingDays)*100:0}%`,height:'100%',background:PURPLE,borderRadius:3}}/>
          </div>
        </div>
      </Card>
    </div>

    {/* ── Recent Trades ── */}
    <Card style={{padding:'14px 0'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,padding:'0 16px'}}>
        <SH style={{margin:0}}>Recent Trades</SH>
        {recentTrades.length>0&&<span style={{fontSize:10,fontWeight:600,padding:'3px 8px',borderRadius:5,background:'var(--surface2)',color:'var(--text-muted)',border:'0.5px solid var(--border)'}}>{recentTrades.length} trades</span>}
      </div>
      {recentTrades.length===0
        ?<div style={{fontSize:12,color:'var(--text-muted)',textAlign:'center',padding:'24px 0'}}>No trades yet</div>
        :<div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:860}}>
            <thead>
              <tr>
                {['DATE','TIME','ASSET','SIDE','ENTRY','EXIT','STOP','R','MAE','MFE','SIZE','SETUP','EMOTION','P&L'].map(h=>(
                  <th key={h} style={{fontSize:9,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',padding:'5px 10px',textAlign:h==='P&L'?'right':'left',borderBottom:'0.5px solid var(--border)',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((t,i)=>{
                const dash=v=>v||<span style={{color:'var(--text-muted)'}}>—</span>;
                return(
                <tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}>
                  <td style={{fontSize:11,padding:'9px 10px',color:'#4B44C8',fontWeight:500,whiteSpace:'nowrap'}}>{t.date||'—'}</td>
                  <td style={{fontSize:11,padding:'9px 10px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{t.time?t.time+(t.exitTime?' – '+t.exitTime:''):'—'}</td>
                  <td style={{fontSize:13,padding:'9px 10px',fontWeight:700,color:'var(--text)',whiteSpace:'nowrap'}}>{t.asset||'—'}</td>
                  <td style={{fontSize:11,padding:'9px 10px',whiteSpace:'nowrap'}}>
                    <span style={{fontSize:10,fontWeight:600,padding:'2px 7px',borderRadius:4,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction||'—'}</span>
                  </td>
                  <td style={{fontSize:11,padding:'9px 10px',fontWeight:500}}>{dash(t.entry)}</td>
                  <td style={{fontSize:11,padding:'9px 10px',fontWeight:500}}>{dash(t.exit)}</td>
                  <td style={{fontSize:11,padding:'9px 10px',color:'var(--text-muted)'}}>{dash(t.risk)}</td>
                  <td style={{fontSize:11,padding:'9px 10px',fontWeight:600,color:pnlColor(t.r)}}>{dash(t.r)}</td>
                  <td style={{fontSize:11,padding:'9px 10px',color:'#dc2626'}}>{t.mae||<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td style={{fontSize:11,padding:'9px 10px',color:'#16a34a'}}>{t.mfe||<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td style={{fontSize:11,padding:'9px 10px',color:'var(--text-muted)'}}>{dash(t.size)}</td>
                  <td style={{fontSize:11,padding:'9px 10px'}}>{t.setup?<span style={{background:'var(--surface2)',padding:'2px 7px',borderRadius:4,fontSize:10,border:'0.5px solid var(--border)',whiteSpace:'nowrap'}}>{t.setup}</span>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td style={{fontSize:11,padding:'9px 10px'}}>{t.emotion?<span style={{padding:'2px 8px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:10,fontWeight:500,whiteSpace:'nowrap'}}>{t.emotion}</span>:<span style={{color:'var(--text-muted)'}}>—</span>}</td>
                  <td style={{fontSize:12,padding:'9px 10px',fontWeight:700,color:pnlColor(t.pnl),textAlign:'right',whiteSpace:'nowrap'}}>{t.pnl?(pnlNum(t.pnl)>0?'+':'')+t.pnl:'—'}</td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      }
    </Card>

    {trades.length>0&&<>

    {/* ── Equity Curve + Streak & Consistency ── */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card>
        <SH>Equity Curve</SH>
        <EquityChart points={eqDisplay}/>
        <div style={{display:'flex',gap:20,marginTop:10,fontSize:11,color:'var(--text-muted)'}}>
          <span>Start <span style={{fontWeight:600,color:'var(--text)'}}>{fmtMoney(eqDisplay[0]?.bal||0)}</span></span>
          <span>Peak <span style={{fontWeight:600,color:'#16a34a'}}>{fmtMoney(peakBal)}</span></span>
          <span>Net change <span style={{fontWeight:600,color:netChange>=0?'#16a34a':'#dc2626'}}>{netChange>=0?'+':''}{fmtMoney(netChange)} ({netChangePct>=0?'+':''}{netChangePct.toFixed(1)}%)</span></span>
        </div>
      </Card>
      <Card>
        <SH>Streak &amp; Consistency</SH>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:20}}>
          <div>
            <div style={{fontSize:30,fontWeight:700,color:streakType==='W'?'#16a34a':streakType==='L'?'#dc2626':'var(--text)',letterSpacing:'-1px',lineHeight:1}}>{streak>0?streak:'—'}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginTop:4}}>{streakType==='W'?'Win Streak':streakType==='L'?'Loss Streak':'Streak'}</div>
          </div>
          <div>
            <div style={{fontSize:30,fontWeight:700,color:'var(--text)',letterSpacing:'-1px',lineHeight:1}}>{tradingDays}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginTop:4}}>Trading Days</div>
          </div>
          <div>
            <div style={{fontSize:30,fontWeight:700,color:parseFloat(profitFactor)>=1?'#16a34a':'#dc2626',letterSpacing:'-1px',lineHeight:1}}>{profitFactor}</div>
            <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600,marginTop:4}}>Profit Factor</div>
          </div>
        </div>
        <SH style={{marginBottom:10}}>Daily P&amp;L</SH>
        {dailySorted.length===0
          ?<div style={{fontSize:11,color:'var(--text-muted)'}}>No trade data</div>
          :<div style={{display:'flex',flexDirection:'column',gap:6}}>
            {dailySorted.slice(-7).map(([date,val])=>{
              const maxV=Math.max(...dailySorted.slice(-7).map(([,v])=>Math.abs(v)),1);
              const pct=Math.abs(val)/maxV*100;
              const [,mm,dd]=date.split('-');
              const mon=['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mm];
              return(
                <div key={date} style={{display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:10,color:'var(--text-muted)',width:42,flexShrink:0,fontWeight:500}}>{mon} {parseInt(dd)}</span>
                  <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:val>=0?'#16a34a':'#dc2626',borderRadius:4}}/>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:val>=0?'#16a34a':'#dc2626',width:62,textAlign:'right',flexShrink:0}}>{val>=0?'+':''}${Math.abs(val)>=1000?(val/1000).toFixed(1)+'k':val.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        }
      </Card>
    </div>

    {/* ── Win Rate by Time of Day + Performance by Day of Week ── */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <SH style={{margin:0}}>Win Rate by Time of Day</SH>
          <button onClick={()=>setEditSlots(p=>!p)} style={{fontSize:10,color:editSlots?PURPLE:'var(--text-muted)',background:'none',border:'0.5px solid var(--border)',borderRadius:5,cursor:'pointer',padding:'3px 8px',fontFamily:'var(--font)',fontWeight:500}}>{editSlots?'Done':'Edit slots'}</button>
        </div>
        {!hasTimes&&<div style={{fontSize:11,color:'var(--text-muted)',marginBottom:10,padding:'6px 10px',background:'var(--surface2)',borderRadius:6}}>Log entry times on trades to see live data</div>}
        {editSlots?(
          <div>
            {timeSlots.map((slot,si)=>(
              <div key={slot.id} style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <input value={slot.label} onChange={e=>{const s=[...timeSlots];s[si]={...s[si],label:e.target.value};saveSlots(s);}}
                  style={{flex:1,fontSize:11,padding:'4px 6px',border:'0.5px solid var(--border)',borderRadius:4,background:'var(--surface2)',color:'var(--text)',fontFamily:'var(--font)',outline:'none'}}/>
                <input type="time" value={slot.start} onChange={e=>{const s=[...timeSlots];s[si]={...s[si],start:e.target.value};saveSlots(s);}}
                  style={{fontSize:10,padding:'3px 4px',border:'0.5px solid var(--border)',borderRadius:4,background:'var(--surface2)',color:'var(--text)',fontFamily:'var(--font)',outline:'none'}}/>
                <span style={{fontSize:10,color:'var(--text-muted)'}}>–</span>
                <input type="time" value={slot.end} onChange={e=>{const s=[...timeSlots];s[si]={...s[si],end:e.target.value};saveSlots(s);}}
                  style={{fontSize:10,padding:'3px 4px',border:'0.5px solid var(--border)',borderRadius:4,background:'var(--surface2)',color:'var(--text)',fontFamily:'var(--font)',outline:'none'}}/>
                <button onClick={()=>saveSlots(timeSlots.filter((_,j)=>j!==si))} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:16,lineHeight:1,padding:'0 2px'}}>×</button>
              </div>
            ))}
            <button onClick={()=>saveSlots([...timeSlots,{id:'ts'+Date.now(),label:'New slot',start:'09:00',end:'10:00'}])}
              style={{fontSize:11,color:PURPLE,background:'none',border:'0.5px dashed '+PURPLE,borderRadius:5,cursor:'pointer',padding:'5px 10px',fontFamily:'var(--font)',width:'100%',marginTop:4}}>+ Add slot</button>
          </div>
        ):(
          todStats.map(slot=>{
            const col=slot.wr===null?'var(--border)':slot.wr>=60?'#16a34a':slot.wr<50?'#dc2626':'#b45309';
            return(
              <div key={slot.id} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:4}}>
                  <span style={{color:'var(--text-muted)',fontWeight:500}}>{slot.label}{slot.count>0?` (${slot.count})`:''}</span>
                  <div style={{display:'flex',gap:10,alignItems:'center'}}>
                    {slot.count>0&&<span style={{fontSize:10,color:slot.pnl>0?'#16a34a':slot.pnl<0?'#dc2626':'var(--text-muted)'}}>{slot.pnl>0?'+':''}${slot.pnl.toFixed(0)}</span>}
                    <span style={{fontWeight:700,color:col,fontSize:12}}>{slot.wr!==null?slot.wr+'%':'—'}</span>
                  </div>
                </div>
                <div style={{height:5,background:'var(--border)',borderRadius:3,overflow:'hidden'}}>
                  <div style={{width:`${slot.wr||0}%`,height:'100%',background:col,borderRadius:3}}/>
                </div>
              </div>
            );
          })
        )}
      </Card>
      <Card>
        <SH>Performance by Day of Week</SH>
        {dowData.every(d=>d.trades===0)
          ?<div style={{fontSize:11,color:'var(--text-muted)'}}>Log trades with dates to see this.</div>
          :dowData.map(d=>{
            const wr=d.wr;
            const col=wr===null?'var(--border)':wr>=60?'#16a34a':wr<50?'#dc2626':'#b45309';
            return(
              <div key={d.name} style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:5}}>
                  <span style={{fontWeight:600,color:'var(--text)'}}>{d.name}{d.trades>0?<span style={{color:'var(--text-muted)',fontWeight:400}}> ({d.trades})</span>:null}</span>
                  <span style={{fontWeight:700,color:col,fontSize:12}}>{wr!==null?wr+'%':'—'}</span>
                </div>
                <div style={{height:5,background:'var(--border)',borderRadius:3,overflow:'hidden',marginBottom:3}}>
                  <div style={{width:`${wr||0}%`,height:'100%',background:col,borderRadius:3}}/>
                </div>
                {d.trades>0&&<div style={{fontSize:10,color:d.pnl>0?'#16a34a':d.pnl<0?'#dc2626':'var(--text-muted)',fontWeight:600}}>{d.pnl>0?'+':''}${Math.abs(d.pnl)>=1000?(d.pnl/1000).toFixed(1)+'k':d.pnl.toFixed(0)}</div>}
              </div>
            );
          })
        }
      </Card>
    </div>

    {/* ── MAE/MFE + R-Multiple Distribution ── */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card>
        <SH>MAE / MFE Breakdown</SH>
        <div style={{fontSize:11,color:'var(--text-muted)',marginBottom:14}}>How far trades moved against / for you before closing</div>
        {!trades.some(t=>t.mae)&&<div style={{fontSize:11,color:'var(--text-muted)',marginBottom:12,padding:'7px 12px',background:'var(--surface2)',borderRadius:6,border:'0.5px solid var(--border)'}}>Log MAE/MFE on trades to see real excursion data</div>}
        {[
          {dot:'#dc2626',label:'Avg max adverse excursion',value:avgMae!==null?`-$${Math.abs(avgMae).toFixed(0)}`:`-$${avgLossPnl.toFixed(0)} (avg loss)`,col:'#dc2626'},
          {dot:'#16a34a',label:'Avg max favorable excursion',value:avgMfe!==null?`+$${avgMfe.toFixed(0)}`:`+$${avgWinPnl.toFixed(0)} (avg win)`,col:'#16a34a'},
          {dot:'#4B44C8',label:'Win / loss ratio',value:avgLossPnl>0?(avgWinPnl/avgLossPnl).toFixed(2)+'x':'—',col:'#4B44C8'},
          {dot:'#b45309',label:'Profit factor',value:profitFactor,col:parseFloat(profitFactor)>=1?'#16a34a':'#dc2626'},
        ].map(r=>(
          <div key={r.label} style={{display:'flex',alignItems:'center',gap:12,padding:'9px 0',borderBottom:'0.5px solid var(--border)'}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:r.dot,flexShrink:0}}/>
            <div style={{flex:1,fontSize:12,color:'var(--text-muted)'}}>{r.label}</div>
            <div style={{fontSize:13,fontWeight:700,color:r.col}}>{r.value}</div>
          </div>
        ))}
      </Card>
      <Card>
        <SH>R-Multiple Distribution</SH>
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-around',gap:4,height:130,padding:'0 8px',marginBottom:4}}>
          {rBuckets.map(b=>{
            const hPct=Math.max(b.c/rMax*100,b.c>0?10:0);
            const isNeg=b.label.startsWith('-');const isZ=b.label==='0R';
            const col=isNeg?'#ef4444':isZ?'#94a3b8':'#22c55e';
            const bg=isNeg?'rgba(239,68,68,0.1)':isZ?'rgba(148,163,184,0.1)':'rgba(34,197,94,0.1)';
            return(
              <div key={b.label} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%',gap:5,width:28}}>
                {b.c>0&&<span style={{fontSize:10,fontWeight:700,color:col}}>{b.c}</span>}
                <div style={{width:18,height:`${hPct}%`,minHeight:b.c>0?14:0,background:b.c>0?col:bg,borderRadius:'4px 4px 0 0',opacity:b.c>0?0.9:0.4}}/>
                <span style={{fontSize:9,color:b.c>0?'var(--text)':'var(--text-muted)',fontWeight:b.c>0?600:400,lineHeight:1}}>{b.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{display:'flex',gap:16,fontSize:11,flexWrap:'wrap',paddingTop:8,borderTop:'0.5px solid var(--border)'}}>
          <span style={{color:'var(--text-muted)'}}>Avg win <span style={{fontWeight:700,color:'#22c55e'}}>{winR.toFixed(1)}R</span></span>
          <span style={{color:'var(--text-muted)'}}>Avg loss <span style={{fontWeight:700,color:'#ef4444'}}>{lossR.toFixed(1)}R</span></span>
          <span style={{color:'var(--text-muted)'}}>Overall <span style={{fontWeight:700,color:'var(--text)'}}>{avgR.toFixed(1)}R</span></span>
        </div>
      </Card>
    </div>

    {/* ── Setup Performance + Monthly P&L ── */}
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
      <Card>
        <SH>Setup Performance</SH>
        {setupRows.length===0
          ?<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag your trades with setups to see this.</div>
          :<>
            <div style={{display:'grid',gridTemplateColumns:'1fr 52px 52px 76px',fontSize:9,color:'var(--text-muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6,paddingBottom:6,borderBottom:'0.5px solid var(--border)'}}>
              <span>Setup</span><span style={{textAlign:'center'}}>Trades</span><span style={{textAlign:'center'}}>WR</span><span style={{textAlign:'right'}}>Net P&L</span>
            </div>
            {setupRows.map(([name,d])=>{const wr=Math.round((d.w/d.t)*100);const col=wr>=60?'#16a34a':wr<50?'#dc2626':'#b45309';return(
              <div key={name} style={{display:'grid',gridTemplateColumns:'1fr 52px 52px 76px',fontSize:12,padding:'8px 0',borderBottom:'0.5px solid var(--border)'}}>
                <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{name}</span>
                <span style={{textAlign:'center',color:'var(--text-muted)'}}>{d.t}</span>
                <span style={{textAlign:'center',fontWeight:700,color:col}}>{wr}%</span>
                <span style={{textAlign:'right',fontWeight:700,color:d.pnl>0?'#16a34a':d.pnl<0?'#dc2626':'var(--text)'}}>{d.pnl>0?'+':''}${Math.abs(d.pnl)>=1000?(d.pnl/1000).toFixed(1)+'k':d.pnl.toFixed(0)}</span>
              </div>
            );})}
          </>
        }
      </Card>
      <Card>
        {(()=>{
          const MON_NAMES=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const yr12=Array.from({length:12},(_,mi)=>{
            const key=`${calYear}-${String(mi+1).padStart(2,'0')}`;
            return{mi,key,val:byMonth[key]??null};
          });
          const nonNull=yr12.filter(x=>x.val!==null);
          const maxAbs12=Math.max(...yr12.map(x=>Math.abs(x.val||0)),1);
          const best=nonNull.length?nonNull.reduce((a,b)=>b.val>a.val?b:a):null;
          const worst=nonNull.length?nonNull.reduce((a,b)=>b.val<a.val?b:a):null;
          const curMi=now.getFullYear()===calYear?now.getMonth():-1;
          const yearTotal=nonNull.reduce((s,x)=>s+x.val,0);
          return(<>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <SH style={{margin:0}}>Monthly P&amp;L</SH>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                {nonNull.length>0&&<span style={{fontSize:10,fontWeight:600,color:yearTotal>=0?'#22c55e':'#ef4444',padding:'2px 7px',borderRadius:5,background:yearTotal>=0?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)'}}>{yearTotal>=0?'+':''}${Math.abs(yearTotal)>=1000?(yearTotal/1000).toFixed(1)+'k':yearTotal.toFixed(0)} {calYear}</span>}
                <button onClick={()=>setCalYear(y=>y-1)} style={{width:24,height:24,border:'0.5px solid var(--border)',borderRadius:5,background:'transparent',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>◀</button>
                <span style={{fontSize:11,fontWeight:600,color:'var(--text)',minWidth:32,textAlign:'center'}}>{calYear}</span>
                <button onClick={()=>setCalYear(y=>y+1)} style={{width:24,height:24,border:'0.5px solid var(--border)',borderRadius:5,background:'transparent',cursor:'pointer',color:'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10}}>▶</button>
              </div>
            </div>
            {nonNull.length===0
              ?<div style={{fontSize:11,color:'var(--text-muted)',padding:'20px 0',textAlign:'center'}}>No trades in {calYear}</div>
              :<>
                <div style={{display:'flex',alignItems:'flex-end',gap:3,height:110,marginBottom:6}}>
                  {yr12.map(({mi,key,val})=>{
                    const hPct=val!==null?Math.max(Math.abs(val)/maxAbs12*86,val!==0?6:2):0;
                    const col=val===null?'var(--border)':val>0?'#22c55e':val<0?'#ef4444':'#94a3b8';
                    const isCur=mi===curMi;
                    return(
                      <div key={mi} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',height:'100%',gap:3}}>
                        {val!==null&&val!==0&&<span style={{fontSize:8,fontWeight:700,color:col,whiteSpace:'nowrap',lineHeight:1}}>{val>0?'+':''}${Math.abs(val)>=1000?(val/1000).toFixed(1)+'k':val.toFixed(0)}</span>}
                        <div style={{width:10,height:val!==null&&val!==0?`${hPct}%`:'2px',background:val!==null&&val!==0?col:'var(--border)',borderRadius:'3px 3px 0 0',opacity:val===null?0.3:0.9,minHeight:val!==null&&val!==0?4:2}}/>
                        <span style={{fontSize:8.5,color:isCur?PURPLE:'var(--text-muted)',fontWeight:isCur?700:500,lineHeight:1}}>{MON_NAMES[mi]}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:'0.5px solid var(--border)',fontSize:11}}>
                  <span style={{color:'var(--text-muted)'}}>Best <span style={{color:'#22c55e',fontWeight:700}}>{best?MON_NAMES[best.mi]+' '+(best.val>0?'+':'')+'$'+(Math.abs(best.val)>=1000?(best.val/1000).toFixed(1)+'k':best.val.toFixed(0)):'—'}</span></span>
                  <span style={{color:'var(--text-muted)'}}>Worst <span style={{color:'#ef4444',fontWeight:700}}>{worst&&worst.val<0?MON_NAMES[worst.mi]+' -$'+(Math.abs(worst.val)>=1000?(Math.abs(worst.val)/1000).toFixed(1)+'k':Math.abs(worst.val).toFixed(0)):'—'}</span></span>
                </div>
              </>
            }
          </>);
        })()}
      </Card>
    </div>

    {/* ── Emotion vs P&L ── */}
    <Card>
      <SH>Emotion vs. P&amp;L</SH>
      {emotionRows.length===0
        ?<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag your trades with emotions to see this.</div>
        :<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {emotionRows.map(([em,d])=>{const wr=Math.round((d.w/d.t)*100);const col=wr>=60?'#16a34a':wr<50?'#dc2626':'#b45309';return(
            <div key={em} style={{display:'flex',alignItems:'center',gap:14}}>
              <span style={{width:76,flexShrink:0,fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:10,background:EMOTION_BG[em]||'var(--surface2)',color:EMOTION_COLOR[em]||'var(--text-muted)',textAlign:'center',border:'0.5px solid var(--border)'}}>{em}</span>
              <div style={{flex:1,height:7,background:'var(--border)',borderRadius:4,overflow:'hidden'}}><div style={{width:`${wr}%`,height:'100%',background:col,borderRadius:4}}/></div>
              <span style={{fontWeight:700,color:col,width:40,textAlign:'right',fontSize:12}}>{wr}%</span>
            </div>
          );})}
        </div>
      }
    </Card>

    </>}

    {/* ── Day modal ── */}
    {dayModal&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}} onClick={()=>setDayModal(null)}>
      <div style={{background:'var(--surface)',borderRadius:16,padding:24,width:560,maxHeight:'84vh',overflowY:'auto',boxShadow:'0 16px 48px rgba(0,0,0,0.25)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{dayModal}</div>
            <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{dayTrades.length>0?`${dayTrades.length} trade${dayTrades.length!==1?'s':''} · `:'No trades · '}{dayWr!==null?`${dayWr}% win rate`:''}</div>
          </div>
          <button onClick={()=>setDayModal(null)} style={{background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text-muted)',lineHeight:1}}>×</button>
        </div>
        {dayTrades.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[{label:'Net P&L',value:`${dayPnl>=0?'+':''}$${dayPnl.toFixed(0)}`,color:dayPnl>0?'var(--green)':dayPnl<0?'var(--red)':'var(--text)'},{label:'Win rate',value:dayWr!==null?`${dayWr}%`:'—',color:dayWr!==null&&dayWr>=60?'var(--green)':dayWr!==null&&dayWr<50?'var(--red)':'var(--text)'},{label:'Trades',value:dayTrades.length},{label:'Avg R',value:dayTrades.length>0?(dayTrades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/dayTrades.length).toFixed(1):'—'}].map(s=><Card2 key={s.label} style={{textAlign:'center',padding:'10px 8px'}}><div style={{fontSize:17,fontWeight:600,color:s.color||'var(--text)',marginBottom:2}}>{s.value}</div><div style={{fontSize:9,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.04em'}}>{s.label}</div></Card2>)}
        </div>}
        {dayTrades.length>0&&<Card style={{marginBottom:14,padding:0,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'var(--surface2)'}}>{['Asset','Side','Entry','Exit','R','P&L','Setup','Emotion'].map(h=><th key={h} style={{fontSize:9,color:'var(--text-muted)',fontWeight:600,padding:'6px 8px',textAlign:'left',textTransform:'uppercase',letterSpacing:'0.05em',borderBottom:'0.5px solid var(--border)'}}>{h}</th>)}</tr></thead>
            <tbody>{dayTrades.map((t,i)=><tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}><td style={{fontSize:12,padding:'7px 8px',fontWeight:600}}>{t.asset}</td><td style={{fontSize:11,padding:'7px 8px'}}><span style={{fontSize:10,fontWeight:600,padding:'2px 6px',borderRadius:4,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td><td style={{fontSize:11,padding:'7px 8px'}}>{t.entry}</td><td style={{fontSize:11,padding:'7px 8px'}}>{t.exit}</td><td style={{fontSize:11,padding:'7px 8px',fontWeight:600,color:pnlColor(t.r)}}>{t.r}</td><td style={{fontSize:12,padding:'7px 8px',fontWeight:600,color:pnlColor(t.pnl)}}>{t.pnl}</td><td style={{fontSize:10,padding:'7px 8px'}}>{t.setup&&<span style={{background:'var(--surface2)',padding:'2px 6px',borderRadius:4}}>{t.setup}</span>}</td><td style={{fontSize:10,padding:'7px 8px'}}>{t.emotion&&<span style={{padding:'2px 7px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td></tr>)}</tbody>
          </table>
        </Card>}
        {dayJournal&&<div style={{display:'flex',flexDirection:'column',gap:10}}>
          {dayJournal.premarket&&<Card><div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Pre-market plan</div><div style={{fontSize:12,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{dayJournal.premarket}</div></Card>}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {dayJournal.went_well&&<Card><div style={{fontSize:10,fontWeight:600,color:'#15803d',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Went well</div><div style={{fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{dayJournal.went_well}</div></Card>}
            {dayJournal.went_wrong&&<Card><div style={{fontSize:10,fontWeight:600,color:'#991b1b',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>Went wrong</div><div style={{fontSize:12,lineHeight:1.5,whiteSpace:'pre-wrap'}}>{dayJournal.went_wrong}</div></Card>}
          </div>
          {dayJournal.discipline>0&&<Card style={{display:'flex',alignItems:'center',gap:12}}><div style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Discipline</div><div style={{display:'flex',gap:3}}>{[1,2,3,4,5,6,7,8,9,10].map(n=><div key={n} style={{width:18,height:18,borderRadius:3,background:n<=dayJournal.discipline?PURPLE:'var(--surface2)',fontSize:9,color:n<=dayJournal.discipline?'#fff':'var(--text-muted)',display:'flex',alignItems:'center',justifyContent:'center'}}>{n}</div>)}</div><span style={{fontSize:12,fontWeight:600,color:PURPLE}}>{dayJournal.discipline}/10</span></Card>}
          {(dayJournal.emotions||[]).length>0&&<div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{dayJournal.emotions.map(em=><span key={em} style={{fontSize:11,fontWeight:500,padding:'3px 10px',borderRadius:10,background:EMOTION_BG[em]||'var(--surface2)',color:EMOTION_COLOR[em]||'var(--text-muted)'}}>{em}</span>)}</div>}
        </div>}
        {dayTrades.length===0&&!dayJournal&&<div style={{textAlign:'center',padding:'30px 0',color:'var(--text-muted)',fontSize:13}}>No trades or journal entries for this day</div>}
      </div>
    </div>}
  </div>)
}

function TradeLog({trades,setTrades,tradesKey}){
  const empty={date:'',asset:'',direction:'Long',entry:'',exit:'',pnl:'',r:'',risk:'',size:'',time:'',exitTime:'',mae:'',mfe:'',setup:'',emotion:'',rules:'',notes:''};
  const[form,setForm]=useState(empty);const[adding,setAdding]=useState(false);const[expanded,setExpanded]=useState(null);
  const[showBroker,setShowBroker]=useState(false);
  const[editId,setEditId]=useState(null);const[editForm,setEditForm]=useState(empty);
  function startEdit(i){setEditId(i);setEditForm({...trades[i]});setExpanded(null);}
  function saveEdit(){if(editId===null)return;const u=trades.map((t,i)=>i===editId?{...t,...editForm}:t);setTrades(u);save(tradesKey,u);setEditId(null);setEditForm(empty);}
  const userSetups=load(STORAGE_KEY+'_setups2',[]);
  const[riskMode,setRiskMode]=useState('$');
  const _tlAccs=load('tr_port_accounts_v3',[]);
  const tlAccTotal=_tlAccs.length>0?_tlAccs.reduce((s,a)=>s+(typeof a.cash==='number'?a.cash:parseFloat(a.cash)||0),0):null;
  const tlNetPnl=trades.reduce((s,t)=>s+pnlNum(t.pnl),0);
  const tlStartVal=tlAccTotal!==null?tlAccTotal-tlNetPnl:null;
  const tradeBalances=(()=>{
    const sorted=[...trades.map((t,idx)=>({idx,date:t.date||'',pnl:pnlNum(t.pnl)}))].sort((a,b)=>a.date.localeCompare(b.date));
    const map={};let running=tlStartVal||0;
    sorted.forEach(({idx,pnl})=>{const before=running;running+=pnl;map[idx]={before,after:running};});
    return map;
  })();
  const fileRef=useRef(null);
  function addTrade(){if(!form.asset||!form.date)return;const u=[form,...trades];setTrades(u);save(tradesKey,u);setForm(empty);setAdding(false)}
  function removeTrade(i){if(!window.confirm('Delete this trade? This cannot be undone.'))return;const u=trades.filter((_,idx)=>idx!==i);setTrades(u);save(tradesKey,u)}
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
        imported.push({date:(c[di]||'').slice(0,10),asset:c[ai]||'',direction:dir.includes('sell')||dir.includes('short')?'Short':'Long',entry:c[eni]||'',exit:c[exi]||'',pnl:c[pi]||'',r:'',size:c[szi]||'',time:'',exitTime:'',mae:'',mfe:'',setup:'',emotion:'',rules:'',notes:c[ni]||''});
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
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Setup</div><Sel value={form.setup} onChange={e=>setForm(f=>({...f,setup:e.target.value}))}><option value="">None</option>{userSetups.length===0?<option disabled style={{color:'var(--text-muted)'}}>— create setups in Playbook —</option>:userSetups.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</Sel></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Entry</div><Inp value={form.entry} onChange={e=>setForm(f=>({...f,entry:e.target.value}))} placeholder="0.00"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Exit</div><Inp value={form.exit} onChange={e=>setForm(f=>({...f,exit:e.target.value}))} placeholder="0.00"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>P&L ($)</div><Inp value={form.pnl} onChange={e=>setForm(f=>({...f,pnl:e.target.value}))} placeholder="+240"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>R-multiple</div><Inp value={form.r} onChange={e=>setForm(f=>({...f,r:e.target.value}))} placeholder="+1.8R"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Size</div><Inp value={form.size} onChange={e=>setForm(f=>({...f,size:e.target.value}))} placeholder="2 lots"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Risk ($)</div><Inp value={form.risk} onChange={e=>setForm(f=>({...f,risk:e.target.value}))} placeholder="500"/></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:10}}>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Time (entry – exit)</div><div style={{display:'flex',alignItems:'center',gap:4}}><Inp type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={{flex:1}}/><span style={{fontSize:10,color:'var(--text-muted)',flexShrink:0}}>–</span><Inp type="time" value={form.exitTime||''} onChange={e=>setForm(f=>({...f,exitTime:e.target.value}))} style={{flex:1}}/></div></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>MAE ($)</div><Inp value={form.mae} onChange={e=>setForm(f=>({...f,mae:e.target.value}))} placeholder="-120"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>MFE ($)</div><Inp value={form.mfe} onChange={e=>setForm(f=>({...f,mfe:e.target.value}))} placeholder="+340"/></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Emotion</div><Sel value={form.emotion} onChange={e=>setForm(f=>({...f,emotion:e.target.value}))}><option value="">Select</option>{EMOTIONS.map(e=><option key={e}>{e}</option>)}</Sel></div>
        <div><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Rules followed</div><Inp value={form.rules} onChange={e=>setForm(f=>({...f,rules:e.target.value}))} placeholder="4/4"/></div>
      </div>
      <div style={{marginBottom:10}}><div style={{fontSize:11,color:'var(--text-muted)',marginBottom:3}}>Notes</div><Textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Pre-trade rationale..."/></div>
      <div style={{display:'flex',gap:8}}><BtnP onClick={addTrade}>Save trade</BtnP><BtnS onClick={()=>{setAdding(false);setForm(empty)}}>Cancel</BtnS></div>
    </Card>}
    {trades.length===0?<Card style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>No trades logged yet</div><BtnP onClick={()=>setAdding(true)}>+ Add your first trade</BtnP></Card>:
    <Card style={{padding:0,overflow:'hidden'}}><table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
      <thead><tr style={{background:'var(--surface2)'}}>{['Date','Asset','Side','Entry','Exit','R','P&L','Risk','Time','MAE','MFE','Setup','Emotion','Rules',''].map((h,i)=>{
        if(h==='Risk')return(<th key="Risk" style={{fontSize:10,color:'var(--text-muted)',fontWeight:500,padding:'6px 8px',textAlign:'left',borderBottom:'0.5px solid var(--border)',width:72}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{textTransform:'uppercase',letterSpacing:'0.04em'}}>Risk</span>
            <select value={riskMode} onChange={e=>{e.stopPropagation();setRiskMode(e.target.value);}} onClick={e=>e.stopPropagation()} style={{fontSize:9,padding:'1px 3px',border:'0.5px solid var(--border)',borderRadius:3,background:'var(--surface)',color:'var(--text-muted)',cursor:'pointer',outline:'none'}}>
              <option value="$">$</option>
              <option value="%">%</option>
            </select>
          </div>
        </th>);
        return<th key={h+i} style={{fontSize:10,color:'var(--text-muted)',fontWeight:500,padding:'6px 8px',textAlign:'left',textTransform:'uppercase',letterSpacing:'0.04em',borderBottom:'0.5px solid var(--border)',width:h===''?52:h==='Date'?90:h==='Setup'||h==='Emotion'?90:h==='Time'?110:h==='MAE'||h==='MFE'?60:undefined}}>{h}</th>;
      })}</tr></thead>
      <tbody>{trades.map((t,i)=><React.Fragment key={i}>
        {editId===i?(
          <tr style={{background:'rgba(75,68,200,0.04)',borderBottom:'0.5px solid var(--border)'}}>
            <td colSpan={15} style={{padding:'12px 14px',borderLeft:`2px solid ${PURPLE}`}}>
              <div style={{fontSize:10,fontWeight:600,color:PURPLE,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:10}}>Edit trade</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Date</div><Inp type="date" value={editForm.date||''} onChange={e=>setEditForm(f=>({...f,date:e.target.value}))}/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Asset</div><Sel value={editForm.asset||''} onChange={e=>setEditForm(f=>({...f,asset:e.target.value}))}><option value="">Select</option>{ASSETS.map(a=><option key={a}>{a}</option>)}</Sel></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Direction</div><Sel value={editForm.direction||'Long'} onChange={e=>setEditForm(f=>({...f,direction:e.target.value}))}><option>Long</option><option>Short</option></Sel></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Setup</div><Sel value={editForm.setup||''} onChange={e=>setEditForm(f=>({...f,setup:e.target.value}))}><option value="">None</option>{userSetups.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</Sel></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Entry</div><Inp value={editForm.entry||''} onChange={e=>setEditForm(f=>({...f,entry:e.target.value}))} placeholder="0.00"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Exit</div><Inp value={editForm.exit||''} onChange={e=>setEditForm(f=>({...f,exit:e.target.value}))} placeholder="0.00"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>P&L ($)</div><Inp value={editForm.pnl||''} onChange={e=>setEditForm(f=>({...f,pnl:e.target.value}))} placeholder="+240"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>R-multiple</div><Inp value={editForm.r||''} onChange={e=>setEditForm(f=>({...f,r:e.target.value}))} placeholder="+1.8R"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Size</div><Inp value={editForm.size||''} onChange={e=>setEditForm(f=>({...f,size:e.target.value}))} placeholder="2 lots"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Risk ($)</div><Inp value={editForm.risk||''} onChange={e=>setEditForm(f=>({...f,risk:e.target.value}))} placeholder="500"/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Entry time</div><Inp type="time" value={editForm.time||''} onChange={e=>setEditForm(f=>({...f,time:e.target.value}))}/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Exit time</div><Inp type="time" value={editForm.exitTime||''} onChange={e=>setEditForm(f=>({...f,exitTime:e.target.value}))}/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>MAE ($)</div><Inp value={editForm.mae||''} onChange={e=>setEditForm(f=>({...f,mae:e.target.value}))} placeholder="-120"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>MFE ($)</div><Inp value={editForm.mfe||''} onChange={e=>setEditForm(f=>({...f,mfe:e.target.value}))} placeholder="+340"/></div>
                <div><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Emotion</div><Sel value={editForm.emotion||''} onChange={e=>setEditForm(f=>({...f,emotion:e.target.value}))}><option value="">Select</option>{EMOTIONS.map(em=><option key={em}>{em}</option>)}</Sel></div>
              </div>
              <div style={{marginBottom:8}}><div style={{fontSize:10,color:'var(--text-muted)',marginBottom:2}}>Notes</div><Textarea value={editForm.notes||''} onChange={e=>setEditForm(f=>({...f,notes:e.target.value}))} placeholder="Notes..."/></div>
              <div style={{display:'flex',gap:8}}><BtnP onClick={saveEdit}>Save changes</BtnP><BtnS onClick={()=>setEditId(null)}>Cancel</BtnS></div>
            </td>
          </tr>
        ):(
          <>
          <tr onClick={()=>setExpanded(expanded===i?null:i)} style={{cursor:'pointer',background:expanded===i?'rgba(75,68,200,0.04)':'transparent',borderBottom:'0.5px solid var(--border)'}}>
            <td style={{fontSize:11,padding:'7px 8px',color:'var(--text-muted)'}}>{fmtDateWithDay(t.date)}</td>
            <td style={{fontSize:12,padding:'7px 8px',fontWeight:500}}>{t.asset}</td>
            <td style={{fontSize:11,padding:'7px 8px'}}><span style={{fontSize:10,fontWeight:500,padding:'2px 5px',borderRadius:3,background:t.direction==='Long'?'rgba(22,163,74,0.1)':'rgba(220,38,38,0.08)',color:t.direction==='Long'?'#15803d':'#991b1b'}}>{t.direction}</span></td>
            <td style={{fontSize:11,padding:'7px 8px'}}>{t.entry}</td>
            <td style={{fontSize:11,padding:'7px 8px'}}>{t.exit}</td>
            <td style={{fontSize:11,padding:'7px 8px',fontWeight:500,color:pnlColor(t.r)}}>{t.r}</td>
            <td style={{fontSize:12,padding:'7px 8px',fontWeight:500,color:pnlColor(t.pnl)}}>{t.pnl}</td>
            <td style={{fontSize:11,padding:'7px 8px',color:t.risk?'var(--red)':'var(--text-muted)'}}>
              {t.risk?(riskMode==='%'&&tlAccTotal?`${((pnlNum(t.risk)/tlAccTotal)*100).toFixed(1)}%`:riskMode==='%'&&!tlAccTotal?`$${pnlNum(t.risk).toFixed(0)}`:`$${pnlNum(t.risk).toFixed(0)}`):'—'}
            </td>
            <td style={{fontSize:11,padding:'7px 8px',color:'var(--text-muted)',whiteSpace:'nowrap'}}>{t.time?(t.exitTime?t.time+' – '+t.exitTime:t.time):'—'}</td>
            <td style={{fontSize:11,padding:'7px 8px',color:t.mae?'#dc2626':'var(--text-muted)'}}>{t.mae||'—'}</td>
            <td style={{fontSize:11,padding:'7px 8px',color:t.mfe?'#16a34a':'var(--text-muted)'}}>{t.mfe||'—'}</td>
            <td style={{fontSize:10,padding:'7px 8px'}}><span style={{background:'var(--surface2)',padding:'2px 5px',borderRadius:3}}>{t.setup}</span></td>
            <td style={{fontSize:10,padding:'7px 8px'}}>{t.emotion&&<span style={{padding:'2px 6px',borderRadius:10,background:EMOTION_BG[t.emotion]||'var(--surface2)',color:EMOTION_COLOR[t.emotion]||'var(--text-muted)',fontSize:9}}>{t.emotion}</span>}</td>
            <td style={{fontSize:11,padding:'7px 8px',fontWeight:500,color:t.rules==='4/4'?'var(--green)':t.rules?.startsWith('2')?'var(--red)':'var(--text)'}}>{t.rules}</td>
            <td style={{padding:'7px 4px',textAlign:'center',whiteSpace:'nowrap'}}>
              <button onClick={e=>{e.stopPropagation();startEdit(i);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'0 3px'}} title="Edit"><i className="ti ti-pencil" style={{fontSize:11}}/></button>
              <button onClick={e=>{e.stopPropagation();removeTrade(i)}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'0 3px'}} title="Delete">×</button>
            </td>
          </tr>
          {expanded===i&&<tr><td colSpan={15} style={{padding:'10px 14px',background:'rgba(75,68,200,0.04)',borderBottom:'0.5px solid var(--border)',borderLeft:`2px solid ${PURPLE}`}}>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:t.notes?8:0}}>
              {tradeBalances[i]&&(tlStartVal!==null||tradeBalances[i].before!==0)&&<>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Balance before</span>
                  <span style={{fontSize:12,fontWeight:600,color:'var(--text)'}}>${tradeBalances[i].before.toFixed(0)}</span>
                </div>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>→</span>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>After</span>
                  <span style={{fontSize:12,fontWeight:600,color:tradeBalances[i].after>=tradeBalances[i].before?'var(--green)':'var(--red)'}}>${tradeBalances[i].after.toFixed(0)}</span>
                </div>
                {tradeBalances[i].before!==0&&<span style={{fontSize:10,color:'var(--text-muted)'}}>({((pnlNum(t.pnl)/Math.abs(tradeBalances[i].before))*100)>=0?'+':''}{((pnlNum(t.pnl)/Math.abs(tradeBalances[i].before))*100).toFixed(2)}% of account)</span>}
              </>}
            </div>
            {t.notes&&<div style={{fontSize:11,color:'var(--text-muted)',padding:'8px 10px',background:'var(--surface2)',borderRadius:5,lineHeight:1.5}}>{t.notes}</div>}
            <div style={{marginTop:8}}>
              <button onClick={e=>{e.stopPropagation();const msg='Analyze this trade for me in detail:\n- Date: '+(t.date||'?')+'\n- Asset: '+(t.asset||'?')+'\n- Direction: '+(t.direction||'?')+'\n- Setup: '+(t.setup||'none')+'\n- P&L: '+(t.pnl||'?')+'\n- R: '+(t.r||'?')+'\n- Emotion: '+(t.emotion||'none')+'\n- Risk: '+(t.risk||'not logged')+'\n- Notes: '+(t.notes||'none')+'\n\nGive me: (1) what I likely did right or wrong based on the setup and emotion, (2) what the P&L and R suggest about execution quality, (3) one specific improvement I can apply to my next similar trade.';window.dispatchEvent(new CustomEvent('ai-coach-open',{detail:{message:msg}}));}}
                style={{padding:'4px 12px',borderRadius:6,border:'0.5px solid rgba(75,68,200,0.4)',background:'rgba(75,68,200,0.07)',color:'#4B44C8',fontFamily:'var(--font)',fontSize:11,fontWeight:600,cursor:'pointer',transition:'all 0.1s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='rgba(75,68,200,0.15)';}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(75,68,200,0.07)';}}>
                ✦ AI Analysis
              </button>
            </div>
          </td></tr>}
          </>
        )}
      </React.Fragment>)}</tbody>
    </table></Card>}
  </div>)
}

function JournalPageItem({item,tree,activeJId,onNavigate,onRename,onDelete,onNewEntry,depth=0}){
  const [expanded,setExpanded]=useState(false);
  const [renaming,setRenaming]=useState(false);
  const [renameVal,setRenameVal]=useState('');
  const [hov,setHov]=useState(false);
  const children=(tree.items||[]).filter(i=>i.parentId===item.id).sort((a,b)=>a.order-b.order);
  const isActive=item.id===activeJId;
  function commitRename(){if(renameVal.trim())onRename(item.id,renameVal.trim());setRenaming(false);}
  function handleNew(e){e.stopPropagation();setExpanded(true);onNewEntry&&onNewEntry(item.id);}
  return(<div>
    <div style={{display:'flex',alignItems:'center',gap:0,paddingLeft:depth*14,borderRadius:6,background:isActive?'#EEEDFE':'transparent'}}
      onMouseEnter={e=>{setHov(true);if(!isActive)e.currentTarget.style.background='var(--surface2)'}}
      onMouseLeave={e=>{setHov(false);if(!isActive)e.currentTarget.style.background=isActive?'#EEEDFE':'transparent'}}>
      <div onClick={()=>setExpanded(p=>!p)} style={{width:18,height:28,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer',color:'var(--text-muted)',fontSize:9}}>
        {children.length>0?(expanded?'▾':'▸'):''}
      </div>
      <i className="ti ti-file-text" style={{fontSize:12,color:isActive?'#534AB7':'var(--text-muted)',flexShrink:0,marginRight:6}}/>
      {renaming?(
        <input value={renameVal} autoFocus onChange={e=>setRenameVal(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter')commitRename();if(e.key==='Escape')setRenaming(false);}}
          onBlur={commitRename} onClick={e=>e.stopPropagation()}
          style={{flex:1,border:'none',outline:'none',fontSize:13,fontFamily:'var(--font)',background:'transparent',color:'var(--text)',padding:'4px 0'}}/>
      ):(
        <span onClick={()=>onNavigate(item.id)} style={{flex:1,fontSize:13,color:isActive?'#534AB7':'var(--text)',fontWeight:isActive?500:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',padding:'5px 0',cursor:'pointer'}}>{item.name}</span>
      )}
      {hov&&!renaming&&<div style={{display:'flex',gap:1,flexShrink:0,marginLeft:4}}>
        <button onClick={handleNew} title="New sub-page" style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'2px 4px',borderRadius:3,fontSize:13,lineHeight:1,fontWeight:300}}>+</button>
        <button onClick={e=>{e.stopPropagation();setRenameVal(item.name);setRenaming(true);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'2px 3px',borderRadius:3,fontSize:10,lineHeight:1}}><i className="ti ti-pencil" style={{fontSize:10}}/></button>
        <button onClick={e=>{e.stopPropagation();onDelete(item.id);}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'2px 3px',borderRadius:3,fontSize:11,lineHeight:1}}>x</button>
      </div>}
    </div>
    {expanded&&children.map(child=><JournalPageItem key={child.id} item={child} tree={tree} activeJId={activeJId} onNavigate={onNavigate} onRename={onRename} onDelete={onDelete} onNewEntry={onNewEntry} depth={depth+1}/>)}
  </div>);
}

function DotMenu({onAddSubpage,onDelete,onClose,blockTypes,onChangeType,showTypes,deleteLabel,onUploadFile}){
  const ref=React.useRef();
  React.useEffect(()=>{function h(e){if(ref.current&&!ref.current.contains(e.target))onClose();}document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[]);
  const menuItem=(icon,label,action,danger)=>(
    <div onClick={action} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:danger?'var(--red)':'var(--text)'}}
      onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <i className={'ti '+icon} style={{fontSize:13,color:danger?'var(--red)':'var(--text-muted)',flexShrink:0}}/>{label}
    </div>
  );
  return(
    <div ref={ref} style={{position:'absolute',left:20,top:0,zIndex:300,background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:8,padding:4,boxShadow:'0 4px 16px rgba(0,0,0,0.13)',minWidth:170}}>
      {onAddSubpage&&menuItem('ti-file-plus','Add sub-page',onAddSubpage)}
      {onUploadFile&&menuItem('ti-upload','Upload file / image',onUploadFile)}
      {showTypes&&<><div style={{height:'0.5px',background:'var(--border)',margin:'3px 0'}}/>
      {blockTypes.map(bt=><div key={bt.type} onClick={()=>onChangeType(bt.type)} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:5,cursor:'pointer',fontSize:12,color:'var(--text)'}}
        onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
        <i className={'ti '+bt.icon} style={{fontSize:13,color:'var(--text-muted)',flexShrink:0}}/>{bt.label}
      </div>)}</>}
      <div style={{height:'0.5px',background:'var(--border)',margin:'3px 0'}}/>
      {onDelete&&menuItem('ti-trash',deleteLabel||'Delete block',onDelete,true)}
    </div>
  );
}

function BlockRow({block,onUpdate,onEnter,onDelete,onSlashOpen,slashOpen,onChangeType,onNavigate,childPageName,onAddSubpage,onDeletePage,onUploadFile}){
  const [hov,setHov]=useState(false);
  const [dotMenu,setDotMenu]=useState(false);
  const fileInputRef=useRef(null);
  const taRef=useRef(null);
  useLayoutEffect(()=>{
    const el=taRef.current;
    if(!el)return;
    el.style.height='auto';
    el.style.height=el.scrollHeight+'px';
  });
  function handleFileSelect(e){
    const file=e.target.files[0];if(!file)return;
    const isImage=file.type.startsWith('image/');
    const reader=new FileReader();
    reader.onload=ev=>{
      onUploadFile&&onUploadFile(ev.target.result,file.name,file.type,isImage?'image':'file');
    };
    reader.readAsDataURL(file);
    e.target.value='';
  }
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
  if(block.type==='subpage')return(
    <div style={{position:'relative',margin:'3px 0'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setDotMenu(false);}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:8,border:'0.5px solid var(--border)',cursor:'pointer',background:hov?'#EEEDFE':'var(--surface2)'}}
        onClick={()=>onNavigate&&onNavigate(block.pageId)}>
        <span onClick={e=>{e.stopPropagation();setDotMenu(p=>!p);}} style={{fontSize:10,color:'var(--text-muted)',cursor:'pointer',userSelect:'none',padding:'1px 3px',borderRadius:3,opacity:hov?1:0,flexShrink:0}}>⠿</span>
        {dotMenu&&<DotMenu onAddSubpage={null} onDelete={()=>{setDotMenu(false);onDeletePage&&onDeletePage();}} onClose={()=>setDotMenu(false)} blockTypes={[]} onChangeType={()=>{}} showTypes={false} deleteLabel="Delete page"/>}
        <i className="ti ti-file-text" style={{fontSize:14,color:'#534AB7',flexShrink:0}}/>
        <span style={{flex:1,fontSize:13,fontWeight:500,color:'var(--text)'}}>{childPageName||'Untitled'}</span>
        <i className="ti ti-chevron-right" style={{fontSize:11,color:'var(--text-muted)'}}/>
      </div>
    </div>
  );
  if(block.type==='image'){
    const imgW=block.imgWidth||100;
    function startResize(e){
      e.preventDefault();e.stopPropagation();
      const startX=e.clientX,startPct=imgW;
      const container=e.currentTarget.closest('[data-blk-wrap]');
      const cw=container?container.offsetWidth:600;
      function onMove(ev){const dx=ev.clientX-startX;const np=Math.max(10,Math.min(100,Math.round((startPct/100*cw+dx)/cw*100)));onUpdate({imgWidth:np});}
      function onUp(){document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);}
      document.addEventListener('mousemove',onMove);document.addEventListener('mouseup',onUp);
    }
    return(
      <div style={{position:'relative',padding:'3px 0'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setDotMenu(false);}}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,application/pdf,*" style={{display:'none'}} onChange={handleFileSelect}/>
        <div style={{display:'flex',alignItems:'flex-start',gap:4}}>
          <span onClick={e=>{e.stopPropagation();setDotMenu(p=>!p);}} style={{marginTop:4,fontSize:10,color:'var(--text-muted)',cursor:'grab',userSelect:'none',opacity:hov?1:0,flexShrink:0,borderRadius:3,padding:'1px 2px'}}>⠿</span>
          {dotMenu&&<DotMenu onDelete={()=>{setDotMenu(false);onDelete();}} onClose={()=>setDotMenu(false)} blockTypes={[]} onChangeType={()=>{}} showTypes={false} deleteLabel="Delete image"/>}
          <div style={{position:'relative',flex:1}}>
            <img src={block.content} alt={block.fileName||'image'} style={{width:'100%',borderRadius:8,display:'block',objectFit:'contain'}}/>
            {hov&&<div style={{position:'absolute',top:6,right:6,display:'flex',gap:3,background:'rgba(0,0,0,0.55)',borderRadius:6,padding:'3px 5px'}}>
              {[25,33,50,75,100].map(w=>(
                <button key={w} onClick={e=>{e.stopPropagation();onUpdate({imgWidth:w});}}
                  style={{background:imgW===w?'#4B44C8':'transparent',border:'none',color:'#fff',fontSize:9,fontWeight:imgW===w?700:400,cursor:'pointer',borderRadius:3,padding:'1px 4px',fontFamily:'var(--font)'}}>
                  {w}%
                </button>
              ))}
            </div>}
            {hov&&<div onMouseDown={startResize} style={{position:'absolute',bottom:0,right:0,width:14,height:14,background:'#4B44C8',borderRadius:'6px 0 6px 0',cursor:'se-resize',opacity:0.85}}/>}
            {block.fileName&&<div style={{fontSize:10,color:'var(--text-muted)',marginTop:2}}>{block.fileName}</div>}
          </div>
        </div>
      </div>
    );
  }
  if(block.type==='file')return(
    <div style={{position:'relative',margin:'4px 0'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setDotMenu(false);}}>
      <input ref={fileInputRef} type="file" accept="*" style={{display:'none'}} onChange={handleFileSelect}/>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <span onClick={e=>{e.stopPropagation();setDotMenu(p=>!p);}} style={{fontSize:10,color:'var(--text-muted)',cursor:'pointer',userSelect:'none',opacity:hov?1:0,flexShrink:0,borderRadius:3,padding:'1px 2px'}}>⠿</span>
        {dotMenu&&<DotMenu onDelete={()=>{setDotMenu(false);onDelete();}} onClose={()=>setDotMenu(false)} blockTypes={[]} onChangeType={()=>{}} showTypes={false} deleteLabel="Delete file"/>}
        <a href={block.content} download={block.fileName||'file'} onClick={e=>e.stopPropagation()} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,border:'0.5px solid var(--border)',background:'var(--surface2)',textDecoration:'none',color:'var(--text)',flex:1}}>
          <i className="ti ti-file-download" style={{fontSize:16,color:'#534AB7',flexShrink:0}}/>
          <span style={{fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{block.fileName||'Download file'}</span>
          <span style={{fontSize:11,color:'var(--text-muted)',marginLeft:'auto',flexShrink:0}}>{block.fileType||''}</span>
        </a>
      </div>
    </div>
  );
  if(block.type==='divider')return(
    <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',position:'relative'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setDotMenu(false);}}>
      <input ref={fileInputRef} type="file" accept="image/*,video/*,application/pdf,*" style={{display:'none'}} onChange={handleFileSelect}/>
      <span onClick={e=>{e.stopPropagation();setDotMenu(p=>!p);}} style={{width:16,flexShrink:0,opacity:hov?1:0,fontSize:10,color:'var(--text-muted)',cursor:'pointer',userSelect:'none',borderRadius:3,padding:'1px 2px'}}>⠿</span>
      {dotMenu&&<DotMenu onAddSubpage={()=>{setDotMenu(false);onAddSubpage&&onAddSubpage();}} onUploadFile={()=>{setDotMenu(false);fileInputRef.current?.click();}} onDelete={()=>{setDotMenu(false);onDelete();}} onClose={()=>setDotMenu(false)} blockTypes={BLOCK_TYPES} onChangeType={t=>{setDotMenu(false);onChangeType(t);}} showTypes={false}/>}
      <div style={{flex:1,height:'0.5px',background:'var(--border)'}}/>
      {hov&&<button onClick={onDelete} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'0 2px'}}>x</button>}
    </div>
  );
  const isH1=block.type==='h1',isH2=block.type==='h2',isCallout=block.type==='callout',isCheck=block.type==='check',isBullet=block.type==='bullet';
  const taStyle={display:'block',width:'100%',border:'none',outline:'none',resize:'none',overflow:'hidden',fontFamily:'var(--font)',background:'none',padding:0,lineHeight:1.65,fontSize:isH1?20:isH2?15:13,fontWeight:isH1||isH2?500:400,color:isCheck&&block.checked?'var(--text-muted)':'var(--text)',textDecoration:isCheck&&block.checked?'line-through':'none'};
  const calloutWrap=isCallout?{background:'var(--surface2)',borderLeft:'3px solid #534AB7',borderRadius:'0 6px 6px 0',padding:'8px 12px'}:{};
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'1px 0',position:'relative',marginBottom:2}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>{setHov(false);setDotMenu(false);}}>
      <span onClick={e=>{e.stopPropagation();setDotMenu(p=>!p);}} style={{width:16,flexShrink:0,marginTop:isH1?5:3,opacity:hov?1:0,fontSize:10,color:'var(--text-muted)',cursor:'pointer',userSelect:'none',borderRadius:3,padding:'1px 2px'}}>⠿</span>
      <input ref={fileInputRef} type="file" accept="image/*,video/*,application/pdf,*" style={{display:'none'}} onChange={handleFileSelect}/>
      {dotMenu&&<DotMenu onAddSubpage={()=>{setDotMenu(false);onAddSubpage&&onAddSubpage();}} onUploadFile={()=>{setDotMenu(false);fileInputRef.current?.click();}} onDelete={()=>{setDotMenu(false);onDelete();}} onClose={()=>setDotMenu(false)} blockTypes={BLOCK_TYPES} onChangeType={t=>{setDotMenu(false);onChangeType(t);}} showTypes={true}/>}
      {isBullet&&<span style={{flexShrink:0,marginTop:4,fontSize:14,color:'var(--text-muted)',lineHeight:1}}>•</span>}
      {isCheck&&<div onClick={()=>onUpdate({checked:!block.checked})} style={{flexShrink:0,marginTop:4,width:14,height:14,borderRadius:3,border:'0.5px solid '+(block.checked?'#534AB7':'#AFA9EC'),background:block.checked?'#534AB7':'#EEEDFE',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
        {block.checked&&<i className="ti ti-check" style={{fontSize:9,color:'#fff'}}/>}
      </div>}
      <div style={{flex:1,position:'relative',...calloutWrap}}>
        <textarea ref={taRef} id={'blk_'+block.id} value={block.content==null||typeof block.content!=='string'?'':block.content} onChange={handleChange} onKeyDown={handleKey} rows={1}
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

function DailyJournal({jTree,saveJTree,activeJId,jNavHistory,navigateJTo,jGoBack}){
  const entry=activeJId&&jTree.entries?.[activeJId]?jTree.entries[activeJId]:null;
  const item=activeJId?(jTree.items||[]).find(i=>i.id===activeJId):null;

  // breadcrumb
  const breadcrumb=[];
  if(item){let cur=item;while(cur){breadcrumb.unshift(cur);cur=cur.parentId?(jTree.items||[]).find(i=>i.id===cur.parentId):null;}}

  function updateEntryField(field,val){
    if(!activeJId)return;
    const updated={...jTree,entries:{...jTree.entries,[activeJId]:{...(jTree.entries[activeJId]||{}),[field]:val}}};
    if(field==='name')updated.items=(updated.items||[]).map(i=>i.id===activeJId?{...i,name:val}:i);
    saveJTree(updated);
  }

  // Migrate old block-based entries to plain text
  function getEntryText(){
    if(!entry)return'';
    if(entry.text!=null)return entry.text;
    return(entry.blocks||[]).map(b=>b.content||b.text||'').filter(Boolean).join('\n');
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
      {breadcrumb.length>1&&(
        <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:16,flexWrap:'wrap'}}>
          {breadcrumb.map((bc,idx)=>(
            <React.Fragment key={bc.id}>
              {idx>0&&<span style={{color:'var(--text-muted)',fontSize:12}}>/</span>}
              <span onClick={()=>idx<breadcrumb.length-1&&navigateJTo(bc.id)}
                style={{fontSize:12,color:idx===breadcrumb.length-1?'var(--text)':'var(--text-muted)',cursor:idx<breadcrumb.length-1?'pointer':'default',fontWeight:idx===breadcrumb.length-1?500:400}}
                onMouseEnter={e=>{if(idx<breadcrumb.length-1)e.currentTarget.style.color='var(--text)';}}
                onMouseLeave={e=>{if(idx<breadcrumb.length-1)e.currentTarget.style.color='var(--text-muted)';}}>
                {bc.name||'Untitled'}
              </span>
            </React.Fragment>
          ))}
          {jNavHistory&&jNavHistory.length>0&&(
            <button onClick={jGoBack} style={{marginLeft:6,display:'flex',alignItems:'center',gap:3,background:'none',border:'0.5px solid var(--border)',borderRadius:5,cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'1px 7px',fontFamily:'var(--font)'}}>
              <i className="ti ti-arrow-left" style={{fontSize:10}}/>Back
            </button>
          )}
        </div>
      )}
      <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:4}}>
        <input value={item?.name||''} onChange={e=>updateEntryField('name',e.target.value)}
          style={{flex:1,display:'block',border:'none',outline:'none',fontSize:26,fontWeight:500,color:'var(--text)',background:'none',fontFamily:'var(--font)',padding:0}}
          placeholder="Untitled"/>
        <button
          onClick={()=>{const text=getEntryText().slice(0,3000);const msg='Review this journal entry and give me honest, specific coaching feedback.\n\nEntry: '+(item?.name||'Untitled')+'\n\n'+text+'\n\nI want: (1) what my mindset and process look like, (2) any mental patterns or biases, (3) one thing I should focus on improving.';window.dispatchEvent(new CustomEvent('ai-coach-open',{detail:{message:msg}}));}}
          style={{flexShrink:0,marginTop:6,padding:'5px 12px',borderRadius:7,border:'0.5px solid rgba(75,68,200,0.4)',background:'rgba(75,68,200,0.07)',color:'#4B44C8',fontFamily:'var(--font)',fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.1s'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(75,68,200,0.15)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(75,68,200,0.07)'}>
          ❖ AI Review
        </button>
      </div>
      <textarea
        key={activeJId}
        defaultValue={getEntryText()}
        onChange={e=>updateEntryField('text',e.target.value)}
        placeholder="Start writing..."
        style={{display:'block',width:'100%',minHeight:'70vh',border:'none',outline:'none',resize:'none',fontFamily:'var(--font)',fontSize:14,lineHeight:1.75,color:'var(--text)',background:'none',padding:0,boxSizing:'border-box'}}
      />
    </div>
  );
}


function Reports({trades,journals}){
  if(trades.length===0)return(<Card style={{textAlign:'center',padding:'40px 20px'}}><div style={{fontSize:14,fontWeight:500,marginBottom:6}}>No data yet</div><div style={{fontSize:12,color:'var(--text-muted)'}}>Log at least 5 trades to see reports.</div></Card>);
  const byAsset={},bySetup={},byEmotion={};
  trades.forEach(t=>{if(t.asset){if(!byAsset[t.asset])byAsset[t.asset]={wins:0,total:0,pnl:0};byAsset[t.asset].total++;if(pnlNum(t.pnl)>0)byAsset[t.asset].wins++;byAsset[t.asset].pnl+=pnlNum(t.pnl)}if(t.setup){if(!bySetup[t.setup])bySetup[t.setup]={wins:0,total:0,pnl:0};bySetup[t.setup].total++;if(pnlNum(t.pnl)>0)bySetup[t.setup].wins++;bySetup[t.setup].pnl+=pnlNum(t.pnl)}if(t.emotion){if(!byEmotion[t.emotion])byEmotion[t.emotion]={wins:0,total:0,pnl:0};byEmotion[t.emotion].total++;if(pnlNum(t.pnl)>0)byEmotion[t.emotion].wins++;byEmotion[t.emotion].pnl+=pnlNum(t.pnl)}});
  const avgDisc=journals.length>0?(journals.reduce((s,j)=>s+(j.discipline||0),0)/journals.length).toFixed(1):'—';
  return(<div style={{display:'flex',flexDirection:'column',gap:12}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
      <Card><SH>Win rate by asset</SH>{Object.entries(byAsset).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,6).map(([asset,d])=>{const wr=Math.round((d.wins/d.total)*100);return(<div key={asset} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:3}}><span style={{color:'var(--text-muted)'}}>{asset} ({d.total})</span><span style={{fontWeight:500,color:wr>=60?'var(--green)':wr<50?'var(--red)':'#b45309'}}>{wr}%</span></div><div style={{height:4,background:'var(--border)',borderRadius:2,overflow:'hidden'}}><div style={{width:`${wr}%`,height:'100%',background:wr>=60?'#16a34a':wr<50?'#dc2626':'#b45309',borderRadius:2}}/></div></div>)})}</Card>
      <Card><SH>Performance by setup</SH>{Object.entries(bySetup).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,6).map(([setup,d])=><div key={setup} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:11}}><span style={{color:'var(--text-muted)'}}>{setup}</span><div style={{textAlign:'right'}}><div style={{fontWeight:500,color:d.pnl>0?'var(--green)':'var(--red)'}}>{d.pnl>0?'+':''}${d.pnl.toFixed(0)}</div><div style={{fontSize:9,color:'var(--text-muted)'}}>{Math.round((d.wins/d.total)*100)}% · {d.total}tr</div></div></div>)}{Object.keys(bySetup).length===0&&<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag trades with setups.</div>}</Card>
      <Card><SH>Performance by emotion</SH>{Object.entries(byEmotion).sort((a,b)=>b[1].pnl-a[1].pnl).map(([em,d])=>{const wr=Math.round((d.wins/d.total)*100);return(<div key={em} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 0',borderBottom:'0.5px solid var(--border)',fontSize:11}}><span style={{padding:'2px 6px',borderRadius:10,background:EMOTION_BG[em],color:EMOTION_COLOR[em],fontSize:10}}>{em}</span><div style={{textAlign:'right',paddingRight:8}}><div style={{fontWeight:500,color:wr>=60?'var(--green)':'var(--red)'}}>{wr}%</div><div style={{fontSize:9,color:'var(--text-muted)'}}>{d.pnl>0?'+':''}${d.pnl.toFixed(0)}</div></div></div>)})}{Object.keys(byEmotion).length===0&&<div style={{fontSize:11,color:'var(--text-muted)'}}>Tag emotions to see this.</div>}</Card>
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
              <Textarea value={setup.overview||''} onChange={e=>updateSetup('overview',e.target.value)} placeholder="Describe this setup — what it is, why it works, when you look for it..." style={{flex:1}}/>
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
          {(setup.customSections||[]).length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {(setup.customSections||[]).map((cs,i)=>{
            const imgInputRef=React.createRef();
            function handleSectionImg(e){
              const file=e.target.files&&e.target.files[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=ev=>{
                const imgs=[...(cs.images||[]),{id:'img_'+Date.now(),src:ev.target.result,name:file.name,width:100}];
                updateSection(i,'images',imgs,setup);
              };
              reader.readAsDataURL(file);
            }
            return(
            <Card key={i} style={{display:'flex',flexDirection:'column'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <input value={cs.title} onChange={e=>updateSection(i,'title',e.target.value,setup)}
                  style={{fontWeight:600,fontSize:10,background:'none',border:'none',outline:'none',color:'var(--text-muted)',fontFamily:'var(--font)',letterSpacing:'0.06em',textTransform:'uppercase',flex:1}}/>
                <div style={{display:'flex',gap:4,alignItems:'center'}}>
                  <button onClick={()=>imgInputRef.current&&imgInputRef.current.click()} title="Upload image"
                    style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:'1px 4px',lineHeight:1}}>
                    <i className="ti ti-photo" style={{fontSize:13}}/>
                  </button>
                  <input ref={imgInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleSectionImg}/>
                  <button onClick={()=>removeSection(i,setup)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'1px 4px'}}>x</button>
                </div>
              </div>
              <Textarea value={cs.content} onChange={e=>updateSection(i,'content',e.target.value,setup)} placeholder="Add your notes..." style={{minHeight:60}}/>
              {(cs.images||[]).length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:10}}>
                  {(cs.images||[]).map((img,ii)=>(
                    <div key={img.id} style={{position:'relative',width:(img.width||100)+'%'}}>
                      <img src={img.src} alt={img.name} style={{width:'100%',borderRadius:5,display:'block'}}/>
                      <div style={{position:'absolute',top:4,right:4,display:'flex',gap:3}}>
                        {[25,50,75,100].map(w=>(
                          <button key={w} onClick={()=>{const imgs=[...(cs.images||[])];imgs[ii]={...imgs[ii],width:w};updateSection(i,'images',imgs,setup);}}
                            style={{fontSize:8,padding:'1px 4px',background:img.width===w?PURPLE:'rgba(0,0,0,0.55)',color:'#fff',border:'none',borderRadius:3,cursor:'pointer'}}>{w}%</button>
                        ))}
                        <button onClick={()=>{const imgs=(cs.images||[]).filter((_,j)=>j!==ii);updateSection(i,'images',imgs,setup);}}
                          style={{fontSize:10,padding:'1px 4px',background:'rgba(220,38,38,0.8)',color:'#fff',border:'none',borderRadius:3,cursor:'pointer',lineHeight:1}}>x</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>);
          })}</div>}
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
const PACC_KEY = 'tr_port_accounts_v3';
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

function Portfolio({holdings,setHoldings,holdingsKey,externalAccountId,onAccountsChange}){
  const PACC_KEY='tr_port_accounts_v3';
  const PPOS_KEY='tr_port_positions_v3';
  const PACT_KEY='tr_port_activity_v3';
  const PSNAP_KEY='tr_port_snapshots_v3';

  const DEF_ACCOUNTS=[];

  const [accounts,setAccountsInternal]=useState(()=>load(PACC_KEY,DEF_ACCOUNTS));
  function setAccounts(v){const next=typeof v==='function'?v(accounts):v;setAccountsInternal(next);try{localStorage.setItem(PACC_KEY,JSON.stringify(next));}catch{}onAccountsChange?.(next);}
  const [activeAccount,setActiveAccount]=useState(externalAccountId||'all');
  React.useEffect(()=>{if(externalAccountId!==undefined)setActiveAccount(externalAccountId);},[externalAccountId]);
  const [positions,setPositions]=useState(()=>load(PPOS_KEY,[]));
  const [activity,setActivity]=useState(()=>load(PACT_KEY,[]));
  const [snapshots,setSnapshots]=useState(()=>load(PSNAP_KEY,[]));
  const [timeRange,setTimeRange]=useState('All');
  const [showAddPos,setShowAddPos]=useState(false);
  const [showAddActivity,setShowAddActivity]=useState(false);
  const [showAddAccount,setShowAddAccount]=useState(false);
  const [showAddSnap,setShowAddSnap]=useState(false);
  const [posForm,setPosForm]=useState({accountId:'',symbol:'',qty:'',avgCost:'',currentPrice:'',sector:'Technology'});
  const [actForm,setActForm]=useState({type:'BUY',symbol:'',detail:'',accountId:'',pnl:''});
  const [accLabel,setAccLabel]=useState('');
  const [accCash,setAccCash]=useState('');
  const [snapVal,setSnapVal]=useState('');
  const [snapDate,setSnapDate]=useState(()=>new Date().toISOString().split('T')[0]);
  const [editPosId,setEditPosId]=useState(null);
  const [editPosForm,setEditPosForm]=useState({});
  const [editCashId,setEditCashId]=useState(null);
  const [editCashVal,setEditCashVal]=useState('');

  const fp=activeAccount==='all'?positions:positions.filter(p=>p.accountId===activeAccount);
  const fa=activeAccount==='all'?activity:activity.filter(a=>a.accountId===activeAccount);
  const posPnl=p=>p.qty*p.currentPrice-p.qty*p.avgCost;
  const totalPosValue=fp.reduce((s,p)=>s+p.qty*p.currentPrice,0);
  const totalCost=fp.reduce((s,p)=>s+p.qty*p.avgCost,0);
  const unrealizedPnl=totalPosValue-totalCost;
  const pctReturn=totalCost>0?(unrealizedPnl/totalCost*100):0;
  const filteredAccounts=activeAccount==='all'?accounts:accounts.filter(a=>a.id===activeAccount);
  const totalCash=filteredAccounts.reduce((s,a)=>s+(parseFloat(a.cash)||0),0);
  const totalValue=totalPosValue+totalCash;

  const todayStr=new Date().toDateString();
  const todayActs=fa.filter(a=>new Date(a.ts||0).toDateString()===todayStr);
  const dayPnl=todayActs.reduce((s,a)=>s+(parseFloat(a.pnl)||0),0);
  const todayCount=todayActs.length;

  const secMap={};
  fp.forEach(p=>{const s=p.sector||'Other';secMap[s]=(secMap[s]||0)+p.qty*p.currentPrice;});
  if(totalCash>0)secMap['Cash']=totalCash;
  const allocColors={'Technology':'#1a1a1a','Financials':'#555555','Crypto':'#999999','Cash':'#dddddd','Healthcare':'#444444','Energy':'#777777','Consumer':'#888888','Real Estate':'#bbbbbb','Other':'#aaaaaa'};
  const allocData=Object.entries(secMap).sort((a,b)=>b[1]-a[1]);
  const allocTotal=allocData.reduce((s,[,v])=>s+v,0);
  let dAngle=-90;
  const dSegs=allocData.map(([lbl,val])=>{
    const sweep=allocTotal>0?(val/allocTotal)*360:0;
    const path=sweep>1?donutPath(100,100,76,50,dAngle,dAngle+sweep-0.5):'';
    dAngle+=sweep;
    return{label:lbl,value:val,path,color:allocColors[lbl]||'#aaa'};
  });

  const now2=Date.now();
  const filteredSnaps=snapshots.filter(s=>{
    if(timeRange==='All')return true;
    if(timeRange==='YTD'){return new Date(s.date+'T12:00:00').getFullYear()===new Date().getFullYear();}
    const days={'1W':7,'1M':30,'3M':90}[timeRange];
    if(!days)return true;
    return new Date(s.date+'T12:00:00').getTime()>=(now2-days*86400000);
  }).sort((a,b)=>new Date(a.date)-new Date(b.date));

  const EW=560,EH=160,EL=48,ER=8,ET=8,EB=28;
  const EIW=EW-EL-ER,EIH=EH-ET-EB;
  let linePath='',areaPath='',ePts=[],yTicks=[],xAxisLabels=[];
  if(filteredSnaps.length>=2){
    const vals=filteredSnaps.map(s=>s.value);
    const eMin=Math.min(...vals)*0.98;
    const eMax=Math.max(...vals)*1.02;
    const ex2=i=>(EL+(i/(filteredSnaps.length-1))*EIW);
    const ey2=v=>(ET+EIH-((v-eMin)/(eMax-eMin))*EIH);
    ePts=filteredSnaps.map((s,i)=>({x:ex2(i),y:ey2(s.value),v:s.value,date:s.date}));
    linePath='M'+ePts[0].x+','+ePts[0].y;
    for(let i=1;i<ePts.length;i++){const cpx=(ePts[i-1].x+ePts[i].x)/2;linePath+=' C'+cpx+','+ePts[i-1].y+' '+cpx+','+ePts[i].y+' '+ePts[i].x+','+ePts[i].y;}
    areaPath=linePath+' L'+ePts[ePts.length-1].x+','+(ET+EIH)+' L'+ePts[0].x+','+(ET+EIH)+'Z';
    const rawRange=eMax-eMin||1;
    const mag=Math.pow(10,Math.floor(Math.log10(rawRange/4)));
    const niceStep=Math.ceil((rawRange/4)/mag)*mag;
    const niceMin=Math.floor(eMin/niceStep)*niceStep;
    for(let v=niceMin;v<=eMax*1.01;v+=niceStep){if(v>=eMin*0.97)yTicks.push({v,y:ey2(v)});}
    if(yTicks.length>5)yTicks=yTicks.filter((_,i)=>i%Math.ceil(yTicks.length/4)===0);
    const maxL=4,stepL=Math.max(1,Math.floor(filteredSnaps.length/maxL));
    const idxSet=new Set([0,filteredSnaps.length-1]);
    for(let i=stepL;i<filteredSnaps.length-1;i+=stepL)idxSet.add(i);
    xAxisLabels=[...idxSet].sort((a,b)=>a-b).map(i=>{
      const d=new Date(filteredSnaps[i].date+'T12:00:00');
      return{label:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),x:ex2(i)};
    });
  }

  let maxDD=null;
  if(snapshots.length>=2){
    const sorted=[...snapshots].sort((a,b)=>new Date(a.date)-new Date(b.date));
    let peak=-Infinity,dd=0;
    for(const s of sorted){if(s.value>peak)peak=s.value;const d=(s.value-peak)/peak*100;if(d<dd)dd=d;}
    if(dd<0)maxDD=dd;
  }
  const periodStart=filteredSnaps[0]?.value;
  const periodHigh=filteredSnaps.length>0?Math.max(...filteredSnaps.map(s=>s.value)):null;
  const periodEnd=filteredSnaps[filteredSnaps.length-1]?.value;
  const netChange=(periodStart!=null&&periodEnd!=null)?periodEnd-periodStart:null;
  const netPct=(periodStart&&netChange!=null)?(netChange/periodStart*100):null;

  function addPosition(){
    if(!posForm.symbol.trim()||!posForm.qty||!posForm.avgCost)return;
    const np={id:Date.now(),...posForm,qty:parseFloat(posForm.qty),avgCost:parseFloat(posForm.avgCost),currentPrice:parseFloat(posForm.currentPrice)||parseFloat(posForm.avgCost)};
    const upd=[...positions,np];setPositions(upd);save(PPOS_KEY,upd);
    setPosForm(f=>({...f,symbol:'',qty:'',avgCost:'',currentPrice:''}));setShowAddPos(false);
  }
  function removePosition(id){const upd=positions.filter(p=>p.id!==id);setPositions(upd);save(PPOS_KEY,upd);}
  function saveEditPos(){
    const upd=positions.map(p=>p.id===editPosId?{...p,qty:parseFloat(editPosForm.qty)||p.qty,avgCost:parseFloat(editPosForm.avgCost)||p.avgCost,currentPrice:parseFloat(editPosForm.currentPrice)||p.currentPrice}:p);
    setPositions(upd);save(PPOS_KEY,upd);setEditPosId(null);setEditPosForm({});
  }
  function addActivity(){
    if(!actForm.symbol.trim())return;
    const acct=accounts.find(a=>a.id===actForm.accountId);
    const na={id:Date.now(),...actForm,pnl:parseFloat(actForm.pnl)||0,ts:Date.now(),accountLabel:acct?.label||actForm.accountId};
    const upd=[na,...activity];setActivity(upd);save(PACT_KEY,upd);
    setActForm(f=>({...f,symbol:'',detail:'',pnl:''}));setShowAddActivity(false);
  }
  function removeActivity(id){const upd=activity.filter(a=>a.id!==id);setActivity(upd);save(PACT_KEY,upd);}
  function addAccount(){
    if(!accLabel.trim())return;
    const na={id:'acc_'+Date.now(),label:accLabel.trim(),cash:parseFloat(accCash)||0};
    const upd=[...accounts,na];setAccounts(upd);save(PACC_KEY,upd);
    setPosForm(f=>({...f,accountId:f.accountId||na.id}));
    setActForm(f=>({...f,accountId:f.accountId||na.id}));
    setAccLabel('');setAccCash('');setShowAddAccount(false);
  }
  function updateAccountCash(id,val){
    const upd=accounts.map(a=>a.id===id?{...a,cash:parseFloat(val)||0}:a);
    setAccounts(upd);save(PACC_KEY,upd);setEditCashId(null);setEditCashVal('');
  }
  function addSnapshot(){
    if(!snapVal||!snapDate)return;
    const ns={id:Date.now(),date:snapDate,value:parseFloat(snapVal)};
    const upd=[...snapshots,ns].sort((a,b)=>new Date(a.date)-new Date(b.date));
    setSnapshots(upd);save(PSNAP_KEY,upd);setSnapVal('');setShowAddSnap(false);
  }
  function removeSnapshot(id){const upd=snapshots.filter(s=>s.id!==id);setSnapshots(upd);save(PSNAP_KEY,upd);}

  const fv=v=>'$'+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});
  const fp2=v=>'$'+parseFloat(v).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fmtK=v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'k':Math.round(v).toString();
  const fmtActDate=a=>{if(!a.ts)return a.date||'';const d=new Date(a.ts);return d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' \xb7 '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});};
  const inpS={padding:'6px 10px',border:'0.5px solid var(--border)',borderRadius:6,background:'var(--surface2)',fontSize:12,color:'var(--text)',fontFamily:'var(--font)',outline:'none',width:'100%',boxSizing:'border-box'};
  const cardS={background:'var(--surface)',borderRadius:12,border:'0.5px solid var(--border)'};
  const lblS={fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'};
  const hasPositions=fp.length>0;

  return (
    <div style={{maxWidth:1020,margin:'0 auto'}}>
      {/* Account tabs */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {[{id:'all',label:'All accounts'},...accounts].map(acc=>{
            const isActive=activeAccount===acc.id;
            const isAll=acc.id==='all';
            return(
              <button key={acc.id} onClick={()=>setActiveAccount(acc.id)} style={{padding:'7px 16px',borderRadius:20,border:'0.5px solid '+(isActive&&isAll?'transparent':'var(--border)'),background:isActive&&isAll?'var(--text)':isActive?'var(--surface2)':'transparent',color:isActive&&isAll?'var(--surface)':isActive?'var(--text)':'var(--text-muted)',fontSize:13,fontWeight:isActive?600:400,cursor:'pointer',fontFamily:'var(--font)',transition:'all .12s'}}>
                {acc.label}
              </button>
            );
          })}
        </div>
        <span style={{fontSize:12,color:'var(--text-muted)'}}>Manual entry mode</span>
      </div>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <h2 style={{fontSize:22,fontWeight:700,color:'var(--text)',margin:0,letterSpacing:'-0.3px'}}>Portfolio Overview</h2>
        <button onClick={()=>setShowAddAccount(p=>!p)} style={{padding:'8px 18px',borderRadius:8,background:'var(--text)',color:'var(--surface)',border:'none',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>+ Add account</button>
      </div>

      {showAddAccount&&(
        <div style={{...cardS,padding:14,marginBottom:14,display:'grid',gridTemplateColumns:'1fr 180px auto auto',gap:8,alignItems:'flex-end'}}>
          <div><div style={{...lblS,marginBottom:4}}>Account name</div><input value={accLabel} onChange={e=>setAccLabel(e.target.value)} placeholder="e.g. Options (Tastytrade)" style={inpS} onKeyDown={e=>e.key==='Enter'&&addAccount()}/></div>
          <div><div style={{...lblS,marginBottom:4}}>Cash balance</div><input value={accCash} onChange={e=>setAccCash(e.target.value)} placeholder="$0.00" type="number" style={inpS}/></div>
          <button onClick={addAccount} style={{padding:'7px 16px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',whiteSpace:'nowrap'}}>Add</button>
          <button onClick={()=>setShowAddAccount(false)} style={{padding:'7px 12px',borderRadius:6,background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border)',fontSize:12,cursor:'pointer',fontFamily:'var(--font)'}}>Cancel</button>
        </div>
      )}

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',border:'0.5px solid var(--border)',borderRadius:12,marginBottom:18,overflow:'hidden'}}>
        {[
          {lbl:'Total Value',val:totalValue>0?fv(totalValue):'—',sub:totalValue>0&&unrealizedPnl!==0?((unrealizedPnl>=0?'+':'')+fv(Math.abs(unrealizedPnl))+' unrealized'):null,subC:unrealizedPnl>=0?'#22c55e':'#ef4444',valC:'var(--text)'},
          {lbl:'Unrealized P&L',val:totalCost>0?((unrealizedPnl>=0?'+':'')+fv(Math.abs(unrealizedPnl))):'—',sub:totalCost>0?pctReturn.toFixed(1)+'% overall':null,valC:totalCost>0?(unrealizedPnl>=0?'#22c55e':'#ef4444'):'var(--text-muted)'},
          {lbl:'Day P&L',val:todayCount>0?((dayPnl>=0?'+':'')+fv(Math.abs(dayPnl))):'—',sub:todayCount>0?(todayCount+' trade'+(todayCount!==1?'s':'')+' today'):null,valC:todayCount>0?(dayPnl>=0?'#22c55e':'#ef4444'):'var(--text-muted)'},
          {lbl:'Max Drawdown',val:maxDD!==null?maxDD.toFixed(1)+'%':'—',sub:maxDD!==null&&periodHigh?('-'+fv(Math.abs(maxDD/100*periodHigh))+' from peak'):null,valC:maxDD!==null?'#ef4444':'var(--text-muted)'},
        ].map((k,i)=>(
          <div key={i} style={{padding:'20px 22px',borderRight:i<3?'0.5px solid var(--border)':'none',background:'var(--surface)'}}>
            <div style={{...lblS,marginBottom:6}}>{k.lbl}</div>
            <div style={{fontSize:26,fontWeight:700,color:k.valC,letterSpacing:'-0.5px',lineHeight:1.2}}>{k.val}</div>
            <div style={{fontSize:12,color:k.sub?k.subC||'var(--text-muted)':'var(--text-muted)',marginTop:3,opacity:k.sub?1:0.45}}>{k.sub||'no data yet'}</div>
          </div>
        ))}
      </div>

      {/* Equity curve + Allocation */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:16,marginBottom:18}}>
        <div style={{...cardS,padding:'18px 20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
            <div style={lblS}>Portfolio equity curve</div>
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {['1W','1M','3M','YTD','All'].map(r=>(
                <button key={r} onClick={()=>setTimeRange(r)} style={{padding:'3px 10px',borderRadius:6,border:'0.5px solid '+(timeRange===r?'var(--text)':'var(--border)'),background:timeRange===r?'var(--text)':'transparent',color:timeRange===r?'var(--surface)':'var(--text-muted)',fontSize:11,fontWeight:timeRange===r?600:400,cursor:'pointer',fontFamily:'var(--font)'}}>{r}</button>
              ))}
              <button onClick={()=>setShowAddSnap(p=>!p)} style={{padding:'3px 10px',borderRadius:6,border:'0.5px solid var(--border)',background:'transparent',color:'var(--text-muted)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>+ Snapshot</button>
            </div>
          </div>
          {showAddSnap&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto auto',gap:8,marginBottom:12,alignItems:'flex-end'}}>
              <div><div style={{...lblS,marginBottom:3}}>Date</div><input type="date" value={snapDate} onChange={e=>setSnapDate(e.target.value)} style={inpS}/></div>
              <div><div style={{...lblS,marginBottom:3}}>Total value ($)</div><input type="number" value={snapVal} onChange={e=>setSnapVal(e.target.value)} placeholder="e.g. 84230" style={inpS} onKeyDown={e=>e.key==='Enter'&&addSnapshot()}/></div>
              <button onClick={addSnapshot} style={{padding:'6px 14px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',whiteSpace:'nowrap'}}>Log</button>
              <button onClick={()=>setShowAddSnap(false)} style={{padding:'6px 10px',borderRadius:6,background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>Cancel</button>
            </div>
          )}
          {filteredSnaps.length<2?(
            <div style={{height:130,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,border:'0.5px dashed var(--border)',borderRadius:8}}>
              <div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center'}}>{snapshots.length===0?'Log portfolio snapshots to track your equity curve':'Need at least 2 snapshots to draw the curve'}</div>
              {!showAddSnap&&<button onClick={()=>setShowAddSnap(true)} style={{padding:'5px 14px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>+ Log snapshot</button>}
            </div>
          ):(
            <svg viewBox={'0 0 '+EW+' '+EH} width="100%" style={{display:'block',marginBottom:6}}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--text)" stopOpacity="0.07"/>
                  <stop offset="100%" stopColor="var(--text)" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {yTicks.map(({v,y},ti)=>(<g key={ti}><line x1={EL} y1={y} x2={EW-ER} y2={y} stroke="var(--border)" strokeWidth="0.7"/><text x={EL-5} y={y+3} fontSize={9} fill="var(--text-muted)" textAnchor="end" fontFamily="Inter,sans-serif">${fmtK(v)}</text></g>))}
              {xAxisLabels.map(({label,x},i)=>(<text key={i} x={x} y={EH-4} fontSize={9} fill="var(--text-muted)" textAnchor="middle" fontFamily="Inter,sans-serif">{label}</text>))}
              <path d={areaPath} fill="url(#portGrad)"/>
              <path d={linePath} fill="none" stroke="var(--text)" strokeWidth="1.5"/>
              {ePts.length>3&&ePts.filter((_,i)=>i>0&&i<ePts.length-1&&i%Math.max(1,Math.floor(ePts.length/3))===0).map((p,i)=>(
                <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="var(--surface)" stroke="var(--text)" strokeWidth="1.5"/>
              ))}
              {ePts.length>=1&&(<>
                <rect x={ePts[ePts.length-1].x-35} y={ePts[ePts.length-1].y-22} width={72} height={18} rx={4} fill="var(--text)"/>
                <text x={ePts[ePts.length-1].x+1} y={ePts[ePts.length-1].y-9} fontSize={9} fill="var(--surface)" textAnchor="middle" fontFamily="Inter,sans-serif" fontWeight="600">{fv(ePts[ePts.length-1].v)}</text>
                <circle cx={ePts[ePts.length-1].x} cy={ePts[ePts.length-1].y} r={3.5} fill="var(--text)"/>
              </>)}
            </svg>
          )}
          {filteredSnaps.length>=2&&(
            <div style={{display:'flex',gap:20,paddingTop:10,borderTop:'0.5px solid var(--border)',fontSize:12,color:'var(--text-muted)',flexWrap:'wrap'}}>
              {periodStart!=null&&<span>Period start <strong style={{color:'var(--text)'}}>{fv(periodStart)}</strong></span>}
              {periodHigh!=null&&<span>Period high <strong style={{color:'var(--text)'}}>{fv(periodHigh)}</strong></span>}
              {netChange!=null&&<span>Net change <strong style={{color:netChange>=0?'#22c55e':'#ef4444'}}>{netChange>=0?'+':''}{fv(Math.abs(netChange))} ({netPct!=null?(netPct>=0?'+':'')+netPct.toFixed(0)+'%':''})</strong></span>}
            </div>
          )}
          {snapshots.length>0&&(
            <div style={{marginTop:12,paddingTop:12,borderTop:'0.5px solid var(--border)'}}>
              <div style={{...lblS,marginBottom:8}}>Snapshots ({snapshots.length})</div>
              <div style={{maxHeight:110,overflowY:'auto',display:'flex',flexDirection:'column',gap:4}}>
                {[...snapshots].reverse().map(s=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                    <span style={{color:'var(--text-muted)',minWidth:100}}>{new Date(s.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                    <span style={{color:'var(--text)',fontWeight:600}}>{fv(s.value)}</span>
                    <button onClick={()=>removeSnapshot(s.id)} style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:13,padding:'1px 4px'}}>x</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{...cardS,padding:'18px 20px'}}>
          <div style={{...lblS,marginBottom:14}}>Allocation</div>
          {allocTotal<=0?(
            <div style={{minHeight:160,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:6,border:'0.5px dashed var(--border)',borderRadius:8,marginBottom:12}}>
              <div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:'0 12px'}}>Add positions or cash balance to see allocation</div>
            </div>
          ):(
            <>
              <div style={{display:'flex',justifyContent:'center',marginBottom:8}}>
                <svg width={200} height={200} viewBox="0 0 200 200">
                  {dSegs.map((seg,i)=>seg.path?<path key={i} d={seg.path} fill={seg.color} stroke="var(--surface)" strokeWidth={2}/>:null)}
                  <text x={100} y={95} textAnchor="middle" fontSize={16} fontWeight="700" fill="var(--text)" fontFamily="Inter,sans-serif">{fv(allocTotal)}</text>
                  <text x={100} y={113} textAnchor="middle" fontSize={11} fill="var(--text-muted)" fontFamily="Inter,sans-serif">total value</text>
                </svg>
              </div>
              {allocData.map(([lbl,val])=>(
                <div key={lbl} style={{display:'flex',alignItems:'center',padding:'7px 0',borderTop:'0.5px solid var(--border)'}}>
                  <div style={{width:10,height:10,borderRadius:2,background:allocColors[lbl]||'#aaa',marginRight:10,flexShrink:0}}/>
                  <span style={{flex:1,fontSize:13,color:'var(--text)'}}>{lbl}</span>
                  <span style={{fontSize:13,color:'var(--text-muted)',marginRight:14}}>{fv(val)}</span>
                  <span style={{fontSize:13,fontWeight:700,color:'var(--text)',minWidth:32,textAlign:'right'}}>{Math.round((val/allocTotal)*100)}%</span>
                </div>
              ))}
            </>
          )}
          <div style={{marginTop:14,paddingTop:14,borderTop:'0.5px solid var(--border)'}}>
            <div style={{...lblS,marginBottom:8}}>Cash balances</div>
            {accounts.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,fontSize:12}}>
                <span style={{flex:1,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.label}</span>
                {editCashId===a.id?(
                  <>
                    <input value={editCashVal} onChange={e=>setEditCashVal(e.target.value)} type="number" style={{...inpS,width:90,textAlign:'right'}} autoFocus onKeyDown={e=>e.key==='Enter'&&updateAccountCash(a.id,editCashVal)}/>
                    <button onClick={()=>updateAccountCash(a.id,editCashVal)} style={{padding:'3px 8px',borderRadius:4,background:PURPLE,color:'#fff',border:'none',fontSize:10,cursor:'pointer',fontFamily:'var(--font)',whiteSpace:'nowrap'}}>Save</button>
                  </>
                ):(
                  <>
                    <span style={{color:'var(--text)',fontWeight:500,flexShrink:0}}>{fv(a.cash||0)}</span>
                    <button onClick={()=>{setEditCashId(a.id);setEditCashVal(String(a.cash||0));}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,padding:'1px 4px',flexShrink:0}}><i className="ti ti-pencil" style={{fontSize:11}}/></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div style={{...cardS,marginBottom:18}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderBottom:'0.5px solid var(--border)'}}>
          <span style={lblS}>Open positions</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface2)',border:'0.5px solid var(--border)',padding:'3px 10px',borderRadius:20}}>{fp.length} positions</span>
            <button onClick={()=>setShowAddPos(p=>!p)} style={{padding:'5px 12px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>+ Add</button>
          </div>
        </div>
        {showAddPos&&(
          <div style={{padding:'12px 18px',borderBottom:'0.5px solid var(--border)',background:'var(--surface2)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr',gap:8,marginBottom:8}}>
              <select value={posForm.accountId} onChange={e=>setPosForm(p=>({...p,accountId:e.target.value}))} style={inpS}>{accounts.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>
              <input value={posForm.symbol} onChange={e=>setPosForm(p=>({...p,symbol:e.target.value.toUpperCase()}))} placeholder="Symbol" style={inpS}/>
              <input value={posForm.qty} onChange={e=>setPosForm(p=>({...p,qty:e.target.value}))} placeholder="Qty" type="number" style={inpS}/>
              <input value={posForm.avgCost} onChange={e=>setPosForm(p=>({...p,avgCost:e.target.value}))} placeholder="Avg cost $" type="number" style={inpS}/>
              <input value={posForm.currentPrice} onChange={e=>setPosForm(p=>({...p,currentPrice:e.target.value}))} placeholder="Current price $" type="number" style={inpS}/>
              <select value={posForm.sector} onChange={e=>setPosForm(p=>({...p,sector:e.target.value}))} style={inpS}>{['Technology','Financials','Healthcare','Energy','Consumer','Crypto','Real Estate','Other'].map(s=><option key={s}>{s}</option>)}</select>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={addPosition} style={{padding:'6px 14px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Add position</button>
              <button onClick={()=>setShowAddPos(false)} style={{padding:'6px 10px',borderRadius:6,background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>Cancel</button>
            </div>
          </div>
        )}
        {!hasPositions?(
          <div style={{padding:'36px',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No positions yet — click <strong style={{color:'var(--text)'}}>+ Add</strong> to log your first holding</div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr>{['Symbol','Qty','Avg Cost','Price','P&L',''].map((h,i)=>(
                <th key={i} style={{fontSize:10,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em',padding:'10px 18px 8px',textAlign:i===0?'left':'right',borderBottom:'0.5px solid var(--border)',width:i===5?60:undefined}}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {fp.map(p=>{
                const pnl=posPnl(p);const isUp=pnl>=0;
                if(editPosId===p.id) return(
                  <tr key={p.id} style={{background:'var(--surface2)'}}>
                    <td style={{padding:'10px 18px',fontWeight:700,borderBottom:'0.5px solid var(--border)',color:'var(--text)'}}>{p.symbol}</td>
                    <td style={{padding:'8px 18px',textAlign:'right',borderBottom:'0.5px solid var(--border)'}}><input value={editPosForm.qty!=null?editPosForm.qty:p.qty} onChange={e=>setEditPosForm(f=>({...f,qty:e.target.value}))} style={{...inpS,width:70,textAlign:'right'}}/></td>
                    <td style={{padding:'8px 18px',textAlign:'right',borderBottom:'0.5px solid var(--border)'}}><input value={editPosForm.avgCost!=null?editPosForm.avgCost:p.avgCost} onChange={e=>setEditPosForm(f=>({...f,avgCost:e.target.value}))} style={{...inpS,width:80,textAlign:'right'}}/></td>
                    <td style={{padding:'8px 18px',textAlign:'right',borderBottom:'0.5px solid var(--border)'}}><input value={editPosForm.currentPrice!=null?editPosForm.currentPrice:p.currentPrice} onChange={e=>setEditPosForm(f=>({...f,currentPrice:e.target.value}))} style={{...inpS,width:80,textAlign:'right'}}/></td>
                    <td style={{padding:'10px 18px',textAlign:'right',color:isUp?'#22c55e':'#ef4444',fontWeight:700,borderBottom:'0.5px solid var(--border)'}}>{isUp?'+':'-'}{fv(Math.abs(pnl))}</td>
                    <td style={{padding:'8px 18px',textAlign:'right',borderBottom:'0.5px solid var(--border)',whiteSpace:'nowrap'}}>
                      <button onClick={saveEditPos} style={{fontSize:11,padding:'4px 10px',borderRadius:5,background:PURPLE,color:'#fff',border:'none',cursor:'pointer',fontFamily:'var(--font)',marginRight:4}}>Save</button>
                      <button onClick={()=>setEditPosId(null)} style={{fontSize:11,padding:'4px 8px',borderRadius:5,background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border)',cursor:'pointer',fontFamily:'var(--font)'}}>x</button>
                    </td>
                  </tr>
                );
                return(
                  <tr key={p.id} style={{transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{padding:'12px 18px',fontWeight:700,color:'var(--text)',borderBottom:'0.5px solid var(--border)',fontSize:14}}>{p.symbol}</td>
                    <td style={{padding:'12px 18px',textAlign:'right',color:isUp?'#22c55e':'#ef4444',borderBottom:'0.5px solid var(--border)',fontSize:14}}>{p.qty}</td>
                    <td style={{padding:'12px 18px',textAlign:'right',color:'var(--text-muted)',borderBottom:'0.5px solid var(--border)',fontSize:14}}>{fp2(p.avgCost)}</td>
                    <td style={{padding:'12px 18px',textAlign:'right',color:'var(--text)',borderBottom:'0.5px solid var(--border)',fontSize:14}}>{fp2(p.currentPrice)}</td>
                    <td style={{padding:'12px 18px',textAlign:'right',color:isUp?'#22c55e':'#ef4444',fontWeight:700,borderBottom:'0.5px solid var(--border)',fontSize:14}}>{isUp?'+':'-'}{fv(Math.abs(pnl))}</td>
                    <td style={{padding:'12px 18px',textAlign:'right',borderBottom:'0.5px solid var(--border)'}}>
                      <button onClick={()=>{setEditPosId(p.id);setEditPosForm({qty:p.qty,avgCost:p.avgCost,currentPrice:p.currentPrice});}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12,padding:'2px 6px',marginRight:2}} title="Edit"><i className="ti ti-pencil" style={{fontSize:12}}/></button>
                      <button onClick={()=>removePosition(p.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'2px 4px'}} title="Remove">x</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Activity */}
      <div style={{...cardS,marginBottom:8}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderBottom:'0.5px solid var(--border)'}}>
          <span style={lblS}>Recent activity</span>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span style={{fontSize:11,color:'var(--text-muted)',background:'var(--surface2)',border:'0.5px solid var(--border)',padding:'3px 10px',borderRadius:20}}>{fa.length} entries</span>
            <button onClick={()=>setShowAddActivity(p=>!p)} style={{padding:'5px 12px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>+ Log</button>
          </div>
        </div>
        {showAddActivity&&(
          <div style={{padding:'12px 18px',borderBottom:'0.5px solid var(--border)',background:'var(--surface2)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
              <select value={actForm.type} onChange={e=>setActForm(p=>({...p,type:e.target.value}))} style={inpS}>{['BUY','SELL','DAY TRADE','DIVIDEND','SHORT','COVER'].map(t=><option key={t}>{t}</option>)}</select>
              <select value={actForm.accountId} onChange={e=>setActForm(p=>({...p,accountId:e.target.value}))} style={inpS}>{accounts.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select>
              <input value={actForm.symbol} onChange={e=>setActForm(p=>({...p,symbol:e.target.value.toUpperCase()}))} placeholder="Symbol (e.g. NVDA)" style={inpS}/>
              <input value={actForm.detail} onChange={e=>setActForm(p=>({...p,detail:e.target.value}))} placeholder="Detail (e.g. 10 sh @ $199.40)" style={{...inpS,gridColumn:'1 / span 2'}}/>
              <input value={actForm.pnl} onChange={e=>setActForm(p=>({...p,pnl:e.target.value}))} placeholder="P&L (e.g. 1994 or -500)" type="number" style={inpS}/>
            </div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={addActivity} style={{padding:'6px 14px',borderRadius:6,background:PURPLE,color:'#fff',border:'none',fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'var(--font)'}}>Log trade</button>
              <button onClick={()=>setShowAddActivity(false)} style={{padding:'6px 10px',borderRadius:6,background:'transparent',color:'var(--text-muted)',border:'0.5px solid var(--border)',fontSize:11,cursor:'pointer',fontFamily:'var(--font)'}}>Cancel</button>
            </div>
          </div>
        )}
        {fa.length===0?(
          <div style={{padding:'36px',textAlign:'center',color:'var(--text-muted)',fontSize:13}}>No trades logged yet — click <strong style={{color:'var(--text)'}}>+ Log</strong> to add activity</div>
        ):(
          fa.map(a=>{
            const isBuy=a.type==='BUY';
            return(
              <div key={a.id} style={{display:'grid',gridTemplateColumns:'88px 1fr 150px 140px 100px 36px',alignItems:'center',padding:'12px 18px',borderBottom:'0.5px solid var(--border)',gap:8,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{padding:'4px 8px',borderRadius:5,background:isBuy?'var(--text)':'transparent',color:isBuy?'var(--surface)':'var(--text)',border:isBuy?'none':'0.5px solid var(--border)',fontSize:10,fontWeight:700,textAlign:'center',letterSpacing:'0.04em',whiteSpace:'nowrap'}}>{a.type}</div>
                <div style={{fontSize:13,minWidth:0}}><strong style={{color:'var(--text)'}}>{a.symbol}</strong>{a.detail&&<span style={{color:'var(--text-muted)'}}> &middot; {a.detail}</span>}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.accountLabel}</div>
                <div style={{fontSize:12,color:'var(--text-muted)',whiteSpace:'nowrap'}}>{fmtActDate(a)}</div>
                <div style={{fontSize:13,fontWeight:700,color:a.pnl>=0?'#22c55e':'#ef4444',textAlign:'right',whiteSpace:'nowrap'}}>{a.pnl!==0?((a.pnl>=0?'+':'')+fv(Math.abs(a.pnl))):'—'}</div>
                <button onClick={()=>removeActivity(a.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'2px',textAlign:'center'}}>x</button>
              </div>
            );
          })
        )}
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
  { key:'daily',     label:'Journal',      icon:'ti-pencil'           },
  { key:'tradelog',  label:'Trade log',    icon:'ti-list-details'     },
  { key:'reports',   label:'Reports',      icon:'ti-chart-bar'        },
  { key:'playbook',  label:'Playbook',     icon:'ti-book-2'           },
  { key:'import',    label:'Import data',  icon:'ti-file-import'      },
]

function sanitizeTree(t){
  const items=(t.items||[]).filter(i=>i&&i.id&&i.type);
  const entries={...(t.entries||{})};
  Object.keys(entries).forEach(id=>{
    if(entries[id]){
      entries[id]={...entries[id],blocks:(entries[id].blocks||[]).filter(b=>b&&b.id).map(b=>({...b,content:typeof b.content==='string'?b.content:''}))}
    }
  });
  return {items,entries};
}

export default function ToolsLayout({tab, setTab, userInfo}){
  const [journalTab, setJournalTab] = useState('dashboard');
  const [jTree,setJTree]=useState(()=>sanitizeTree(load(JOURNAL_TREE_KEY,{items:[],entries:{}})));
  const [activeJId,setActiveJId]=useState(()=>{const t=load(JOURNAL_TREE_KEY,{items:[],entries:{}});const saved=load(JOURNAL_ACTIVE_KEY,null);if(saved&&(t.items||[]).find(i=>i.id===saved&&i.type==='entry'))return saved;return (t.items||[]).find(i=>i.type==='entry')?.id||null;});
  const [jNavHistory,setJNavHistory]=useState([]);
  const [showJDrop,setShowJDrop]=useState(false);
  function saveJTree(t){const s=sanitizeTree(t);setJTree(s);save(JOURNAL_TREE_KEY,s);}
  React.useEffect(()=>{function h(e){if(showJDrop&&!e.target.closest('[data-jdrop]'))setShowJDrop(false);}document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h);},[showJDrop]);
  React.useEffect(()=>{setShowJDrop(false);setShowBookDrop(false);},[tab]);
  // Sidebar account/COT/screener state
  const [sidebarAccounts, setSidebarAccounts] = useState(() => load(PACC_KEY, []));
  const [activePortfolioAccount, setActivePortfolioAccount] = useState('all');
  const [cotGroup, setCotGroup] = useState('Commodities');
  const [screenerAction, setScreenerAction] = useState(null);
  function openJEntry(id){setActiveJId(id);save(JOURNAL_ACTIVE_KEY,id);setJNavHistory([]);}
  function navigateJTo(id){setJNavHistory(h=>[...h,activeJId]);setActiveJId(id);save(JOURNAL_ACTIVE_KEY,id);setShowJDrop(false);}
  function jGoBack(){setJNavHistory(h=>{const prev=[...h];const last=prev.pop();if(last){setActiveJId(last);save(JOURNAL_ACTIVE_KEY,last);}return prev;});}
  function newJEntry(parentId=null){const id='je_'+Date.now();const it={id,type:'entry',name:'Untitled',parentId,order:Date.now()};const en={blocks:[],tags:[],date:new Date().toISOString().slice(0,10)};const t={...jTree,items:[...(jTree.items||[]),it],entries:{...(jTree.entries||{}),[id]:en}};saveJTree(t);openJEntry(id);}
  function renameJItem(id,name){const t={...jTree,items:(jTree.items||[]).map(i=>i.id===id?{...i,name}:i)};saveJTree(t);}
  function deleteJItem(id){
    // also delete all descendants
    function getDesc(pid){const kids=(jTree.items||[]).filter(i=>i.parentId===pid);return kids.flatMap(k=>[k.id,...getDesc(k.id)]);}
    const toDelete=[id,...getDesc(id)];
    const newEntries={...(jTree.entries||{})};
    toDelete.forEach(d=>delete newEntries[d]);
    const t={...jTree,items:(jTree.items||[]).filter(i=>!toDelete.includes(i.id)),entries:newEntries};
    saveJTree(t);
    if(toDelete.includes(activeJId)){const first=(t.items||[]).find(i=>i.type==='entry');setActiveJId(first?.id||null);save(JOURNAL_ACTIVE_KEY,first?.id||null);}
  }
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

  const sbItem = (label, isActive, onClick, indent=false) => (
    <button onClick={onClick} style={{ width:'100%', display:'flex', alignItems:'center', padding: indent ? '6px 10px 6px 22px' : '7px 10px', borderRadius:7, border:'none', background:isActive?'#111827':'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight:isActive?600:400, color:isActive?'#fff':'var(--text)', cursor:'pointer', textAlign:'left', marginBottom:1, flexShrink:0 }}
      onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background='var(--surface2)';}}
      onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent';}}>
      {label}
    </button>
  );
  const sbl = (label) => <div style={{ padding:'10px 10px 4px', fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'var(--font)' }}>{label}</div>;
  const sbDivider = () => <div style={{ height:'0.5px', background:'var(--border)', margin:'8px 0' }} />;
  const sbMuted = (label, onClick) => (
    <button onClick={onClick} style={{ width:'100%', display:'flex', alignItems:'center', padding:'6px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', cursor:'pointer', textAlign:'left', marginBottom:1 }}
      onMouseEnter={e=>e.currentTarget.style.color='var(--text)'}
      onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
      + {label}
    </button>
  );

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:'var(--font)' }}>

      {/* ── 240px Text Sidebar ── */}
      <div style={{ width:240, display:'flex', flexDirection:'column', borderRight:'0.5px solid var(--border)', background:'var(--surface)', flexShrink:0, alignSelf:'stretch', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'18px 16px 10px', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:17, fontWeight:700, color:'var(--text)' }}>Tools</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginTop:2 }}>Plan. Track. Improve.</div>
        </div>

        {/* Top nav */}
        <div style={{ padding:'0 8px', flexShrink:0 }}>
          {TOOLS_TABS.map(t => {
            const isActive = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border:'none', background:isActive?'#111827':'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight:isActive?600:400, color:isActive?'#fff':'var(--text)', cursor:'pointer', textAlign:'left', marginBottom:2 }}
                onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background='var(--surface2)';}}
                onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent';}}>
                <i className={`ti ${t.icon}`} style={{ fontSize:15, flexShrink:0 }} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>

        {sbDivider()}

        {/* Sub-sections */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 8px 16px' }}>

          {/* ── Journal sub-nav ── */}
          {tab === 'Journal' && <>
            {sbl('Journal')}
            {JOURNAL_SUBTABS.map(s => sbItem(s.label, journalTab===s.key, ()=>setJournalTab(s.key)))}
            {sbDivider()}
            {sbl('Journals')}
            {books.map(b => (
              <button key={b.id} onClick={()=>switchBook(b.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:7, border:'none', background:b.id===activeBookId?'#111827':'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight:b.id===activeBookId?600:400, color:b.id===activeBookId?'#fff':'var(--text)', cursor:'pointer', textAlign:'left', marginBottom:1 }}
                onMouseEnter={e=>{if(b.id!==activeBookId)e.currentTarget.style.background='var(--surface2)';}}
                onMouseLeave={e=>{if(b.id!==activeBookId)e.currentTarget.style.background='transparent';}}>
                <i className="ti ti-notebook" style={{ fontSize:13, flexShrink:0 }} aria-hidden="true" />
                {b.name}
              </button>
            ))}
            {showNewBook ? (
              <div style={{ display:'flex', gap:4, padding:'4px 2px' }}>
                <input value={newBookName} onChange={e=>setNewBookName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createBook()} placeholder="Journal name…" autoFocus
                  style={{ flex:1, padding:'5px 8px', border:'0.5px solid var(--border)', borderRadius:5, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }}/>
                <button onClick={createBook} style={{ padding:'5px 10px', background:PURPLE, color:'#fff', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontFamily:'var(--font)', fontWeight:500 }}>Add</button>
              </div>
            ) : sbMuted('New journal', ()=>setShowNewBook(true))}
          </>}

          {/* ── Portfolio sub-nav ── */}
          {tab === 'Portfolio' && <>
            {sbl('Accounts')}
            {sbItem('All accounts', activePortfolioAccount==='all', ()=>setActivePortfolioAccount('all'))}
            {sidebarAccounts.map(a => sbItem(a.label||a.name||'Account', activePortfolioAccount===a.id, ()=>setActivePortfolioAccount(a.id)))}
            {sbMuted('Add account', ()=>{/* triggers inside Portfolio */})}
          </>}

          {/* ── COT Alerts sub-nav ── */}
          {tab === 'COT Alerts' && <>
            {sbl('Watchlists')}
            {['Commodities','Forex','Financials'].map(g => sbItem(g, cotGroup===g, ()=>setCotGroup(g)))}
          </>}

          {/* ── Custom Screener sub-nav ── */}
          {tab === 'Screener' && <>
            {sbl('Protocols')}
            <div style={{ padding:'4px 10px 8px', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No screeners yet</div>
            {sbMuted('New Screener', ()=>setScreenerAction('new'))}
          </>}

        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px 24px 120px 24px' }}>
          {tab==='Journal' && journalTab==='dashboard' && <Dashboard trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='tradelog'  && <TradeLog  trades={trades} setTrades={setTrades} tradesKey={tradesKey}/>}
          {tab==='Journal' && journalTab==='daily'     && <DailyJournal jTree={jTree} saveJTree={saveJTree} activeJId={activeJId} setActiveJId={setActiveJId} jNavHistory={jNavHistory} navigateJTo={navigateJTo} jGoBack={jGoBack}/>}
          {tab==='Journal' && journalTab==='reports'   && <Reports   trades={trades} journals={journals}/>}
          {tab==='Journal' && journalTab==='playbook'  && <Playbook  trades={trades}/>}
          {tab==='Journal' && journalTab==='import'    && (ImportTab ? <ImportTab/> : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='COT Alerts'&&(COTAlertsTab    ? <COTAlertsTab externalGroup={cotGroup} onGroupChange={setCotGroup}/> : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Screener'&& (ScreenerBuilder ? <ScreenerBuilder user={userInfo} externalAction={screenerAction} onActionHandled={()=>setScreenerAction(null)}/> : <div style={{color:'var(--text-muted)',padding:20}}>Loading...</div>)}
          {tab==='Portfolio' && <Portfolio holdings={portfolioHoldings} setHoldings={setPortfolioHoldings} holdingsKey={holdingsKey} externalAccountId={activePortfolioAccount} onAccountsChange={setSidebarAccounts}/>}
        </div>
      </div>
    </div>
  );
}