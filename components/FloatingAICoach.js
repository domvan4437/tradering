'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';

const PURPLE = '#4B44C8';

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function pnlNum(v) { return parseFloat(String(v||'').replace(/[^0-9.\-]/g,''))||0; }

function gatherTraderContext() {
  try {
    const trades   = lsGet('tr_journal_v3',[]);
    const jTree    = lsGet('tr_journal_v3_jtree',{});
    const setups   = lsGet('tr_journal_v3_setups2',[]);
    const accounts = lsGet('tr_port_accounts_v3',[]);
    const total=trades.length,wins=trades.filter(t=>pnlNum(t.pnl)>0),losses=trades.filter(t=>pnlNum(t.pnl)<0);
    const winRate=total>0?Math.round((wins.length/total)*100):0;
    const netPnl=trades.reduce((s,t)=>s+pnlNum(t.pnl),0);
    const avgR=total>0?(trades.reduce((s,t)=>s+(parseFloat(t.r)||0),0)/total).toFixed(2):'0';
    const grossWin=wins.reduce((s,t)=>s+pnlNum(t.pnl),0),grossLoss=Math.abs(losses.reduce((s,t)=>s+pnlNum(t.pnl),0));
    const pf=grossLoss>0?(grossWin/grossLoss).toFixed(2):wins.length>0?'inf':'0';
    let peak=0,dd=0,cum=0;
    [...trades].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).forEach(t=>{cum+=pnlNum(t.pnl);if(cum>peak)peak=cum;if(peak-cum>dd)dd=peak-cum;});
    const byAsset={},bySetup={},byEmotion={},byDir={Long:{w:0,t:0},Short:{w:0,t:0}};
    trades.forEach(t=>{
      if(t.asset){if(!byAsset[t.asset])byAsset[t.asset]={w:0,t:0,pnl:0};byAsset[t.asset].t++;byAsset[t.asset].pnl+=pnlNum(t.pnl);if(pnlNum(t.pnl)>0)byAsset[t.asset].w++;}
      if(t.setup){if(!bySetup[t.setup])bySetup[t.setup]={w:0,t:0,pnl:0};bySetup[t.setup].t++;bySetup[t.setup].pnl+=pnlNum(t.pnl);if(pnlNum(t.pnl)>0)bySetup[t.setup].w++;}
      if(t.emotion){if(!byEmotion[t.emotion])byEmotion[t.emotion]={w:0,t:0,pnl:0};byEmotion[t.emotion].t++;byEmotion[t.emotion].pnl+=pnlNum(t.pnl);if(pnlNum(t.pnl)>0)byEmotion[t.emotion].w++;}
      if(t.direction==='Long'||t.direction==='Short'){byDir[t.direction].t++;if(pnlNum(t.pnl)>0)byDir[t.direction].w++;}
    });
    const fa=(o,n)=>Object.entries(o).sort((a,b)=>b[1].t-a[1].t).slice(0,n).map(([k,d])=>k+': '+Math.round(d.w/d.t*100)+'% WR, '+d.t+' trades, $'+d.pnl.toFixed(0)+' P&L');
    const fe=o=>Object.entries(o).sort((a,b)=>b[1].t-a[1].t).map(([k,d])=>k+': '+Math.round(d.w/d.t*100)+'% WR, '+d.t+' trades');
    const recent=[...trades].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,10)
      .map(t=>(t.date||'?')+' | '+(t.asset||'?')+' '+(t.direction||'')+' | Setup:'+(t.setup||'none')+' | P&L:'+(t.pnl||'?')+' | R:'+(t.r||'?')+' | Emotion:'+(t.emotion||'none'));
    const accountTotal=accounts.reduce((s,a)=>s+(typeof a.cash==='number'?a.cash:parseFloat(a.cash)||0),0);
    const entries=jTree.entries||{};
    const recentNotes=(jTree.items||[]).filter(i=>i.type==='entry').sort((a,b)=>(b.order||0)-(a.order||0)).slice(0,5)
      .map(i=>{const e=entries[i.id];if(!e)return null;const t=(e.blocks||[]).map(b=>b.text||b.content||'').filter(Boolean).join(' ').slice(0,300);return t?'['+i.name+']: '+t:null;}).filter(Boolean);
    return {
      summary:{totalTrades:total,winRate:winRate+'%',wins:wins.length,losses:losses.length,netPnL:'$'+netPnl.toFixed(0),avgR,profitFactor:pf,maxDrawdown:'$'+dd.toFixed(0),accountBalance:accountTotal>0?'$'+accountTotal.toFixed(0):'not set',longRecord:byDir.Long.w+'W/'+(byDir.Long.t-byDir.Long.w)+'L ('+(byDir.Long.t>0?Math.round(byDir.Long.w/byDir.Long.t*100):0)+'% WR)',shortRecord:byDir.Short.w+'W/'+(byDir.Short.t-byDir.Short.w)+'L ('+(byDir.Short.t>0?Math.round(byDir.Short.w/byDir.Short.t*100):0)+'% WR)',emotionalTrades:trades.filter(t=>['FOMO','Revenge','Anxious'].includes(t.emotion)).length,fullRuleTrades:trades.filter(t=>t.rules==='4/4').length},
      byAsset:fa(byAsset,8).length?fa(byAsset,8):['No assets logged'],bySetup:fa(bySetup,6).length?fa(bySetup,6):['No setups tagged'],byEmotion:fe(byEmotion).length?fe(byEmotion):['No emotions tagged'],
      recentTrades:recent.length?recent:['No trades logged'],playbookSetups:setups.length?setups.map(s=>s.name).join(', '):'None',recentJournalNotes:recentNotes,
    };
  } catch { return null; }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function fmt(text) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((p,i)=>{
    if(p.startsWith('**')&&p.endsWith('**'))return React.createElement('strong',{key:i},p.slice(2,-2));
    if(p.startsWith('*')&&p.endsWith('*'))return React.createElement('em',{key:i,style:{fontStyle:'italic'}},p.slice(1,-1));
    if(p.startsWith('`')&&p.endsWith('`'))return React.createElement('code',{key:i,style:{background:'rgba(0,0,0,0.15)',padding:'1px 5px',borderRadius:3,fontFamily:'monospace',fontSize:12}},p.slice(1,-1));
    return p;
  });
}
function Markdown({text}){
  if(!text)return null;
  return React.createElement('div',{style:{fontSize:13.5}},
    ...text.split('\n').map((line,i)=>{
      if(line.startsWith('### '))return React.createElement('div',{key:i,style:{fontWeight:700,fontSize:13,marginTop:10,marginBottom:3,color:PURPLE}},fmt(line.slice(4)));
      if(line.startsWith('## '))return React.createElement('div',{key:i,style:{fontWeight:700,fontSize:14,marginTop:12,marginBottom:4}},fmt(line.slice(3)));
      if(line.startsWith('# '))return React.createElement('div',{key:i,style:{fontWeight:700,fontSize:15,marginTop:14,marginBottom:5}},fmt(line.slice(2)));
      if(line.startsWith('- ')||line.startsWith('• '))return React.createElement('div',{key:i,style:{display:'flex',gap:7,margin:'2px 0',alignItems:'flex-start'}},React.createElement('span',{style:{color:PURPLE,flexShrink:0,marginTop:1,fontSize:12}},'•'),React.createElement('span',null,fmt(line.slice(2))));
      const nl=line.match(/^(\d+)\.\s(.*)/);
      if(nl)return React.createElement('div',{key:i,style:{display:'flex',gap:7,margin:'2px 0',alignItems:'flex-start'}},React.createElement('span',{style:{color:PURPLE,flexShrink:0,fontWeight:600,minWidth:18,fontSize:12}},nl[1]+'.'),React.createElement('span',null,fmt(nl[2])));
      if(line==='---'||line==='***')return React.createElement('div',{key:i,style:{height:1,background:'var(--border)',margin:'8px 0'}});
      if(line==='')return React.createElement('div',{key:i,style:{height:5}});
      return React.createElement('div',{key:i,style:{margin:'1px 0',lineHeight:1.65}},fmt(line));
    })
  );
}
function Dots(){return React.createElement('div',{style:{display:'flex',gap:4,padding:'6px 0',alignItems:'center'}},...[0,1,2].map(i=>React.createElement('div',{key:i,style:{width:7,height:7,borderRadius:'50%',background:'var(--text-muted)',animation:'tz-bounce 1.2s ease-in-out infinite',animationDelay:i*0.18+'s'}})));}

// ── Quick prompts ─────────────────────────────────────────────────────────────
const QUICK_CATS=[
  {label:'My Stats',prompts:['What are my strongest and weakest setups?','Break down my emotional trading patterns','Which asset am I most profitable on?','Review my last 10 trades and find patterns']},
  {label:'Concepts',prompts:['Explain liquidity sweeps with a real example','What are orderblocks and how do I trade them?','Explain fair value gaps (FVGs)','How do I read the COT report?']},
  {label:'Risk',prompts:['Help me size my next trade risking 1% of my account','What is a good risk:reward for my trading style?','How do I calculate max drawdown risk?','When should I reduce size after losses?']},
  {label:'Psychology',prompts:['How do I stop revenge trading?','I keep moving my stop loss — how do I fix this?','How do I build unshakeable discipline?','I just had 3 losses in a row — what now?']},
];

const WELCOME='**Welcome. I\'m your TradeZar AI Coach.**\n\nI have full access to your trade journal, performance stats, playbook, and notes. Ask me anything.\n\n- **Analyze your data** — win rates, setups, emotional patterns\n- **Explain any concept** — SMC, ICT, risk management, COT, TA\n- **Chart analysis** — paste a screenshot and I\'ll break it down\n- **Live decision help** — "should I take this trade?" with your actual stats\n- **Content ingestion** — share a YouTube video or article, I\'ll analyze it\n\nWhat do you want to work on?';

// ── Main component ────────────────────────────────────────────────────────────
export default function FloatingAICoach(){
  const [open,setOpen]=useState(false);
  const [view,setView]=useState('chat'); // 'chat' | 'history'
  const [messages,setMessages]=useState([{role:'assistant',content:WELCOME}]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [cat,setCat]=useState(0);
  const [pulse,setPulse]=useState(true);
  // Image
  const [pendingImg,setPendingImg]=useState(null); // {b64, preview, name}
  // Voice
  const [recording,setRecording]=useState(false);
  const recognRef=useRef(null);
  // Follow-ups
  const [followUps,setFollowUps]=useState([]);
  // Content ingestion
  const [showIngest,setShowIngest]=useState(false);
  const [ingestUrl,setIngestUrl]=useState('');
  const [ingestLoading,setIngestLoading]=useState(false);
  const [ingestedContent,setIngestedContent]=useState(null); // {type,title,content}
  // History
  const [conversations,setConversations]=useState([]);
  const [convId,setConvId]=useState(null);
  const [histLoading,setHistLoading]=useState(false);
  // Refs
  const bottomRef=useRef(null);
  const inputRef=useRef(null);
  const fileRef=useRef(null);

  useEffect(()=>{if(open){setTimeout(()=>inputRef.current?.focus(),100);setPulse(false);}if(open&&view==='history')loadHistory();},[open,view]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth'});},[messages,busy]);

  // ── External trigger from other components ────────────────────────────────
  useEffect(()=>{
    const handler=(e)=>{
      setOpen(true);
      setView('chat');
      if(e.detail?.message){
        setTimeout(()=>send(e.detail.message,null,null),200);
      }
    };
    window.addEventListener('ai-coach-open',handler);
    return()=>window.removeEventListener('ai-coach-open',handler);
  },[]);

  // ── Paste image handler ───────────────────────────────────────────────────
  useEffect(()=>{
    const handler=e=>{
      if(!open)return;
      const item=[...(e.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));
      if(!item)return;
      const file=item.getAsFile();
      readImageFile(file);
    };
    window.addEventListener('paste',handler);
    return()=>window.removeEventListener('paste',handler);
  },[open]);

  function readImageFile(file){
    if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      setPendingImg({b64:ev.target.result,preview:ev.target.result,name:file.name||'chart.png'});
    };
    reader.readAsDataURL(file);
  }

  // ── Voice input ───────────────────────────────────────────────────────────
  function toggleRecording(){
    if(recording){recognRef.current?.stop();setRecording(false);return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert('Voice input not supported in this browser. Try Chrome.');return;}
    const r=new SR();r.continuous=false;r.interimResults=true;r.lang='en-US';
    r.onresult=e=>{const t=Array.from(e.results).map(r=>r[0].transcript).join('');setInput(t);};
    r.onend=()=>setRecording(false);
    r.start();recognRef.current=r;setRecording(true);
  }

  // ── Content ingestion ─────────────────────────────────────────────────────
  async function ingestUrl_fn(){
    if(!ingestUrl.trim())return;
    setIngestLoading(true);
    try{
      const res=await fetch('/api/ai-coach/ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:ingestUrl.trim()})});
      const data=await res.json();
      if(!res.ok||data.error){alert('Could not load content: '+(data.error||'Unknown error'));return;}
      setIngestedContent(data);
      setIngestUrl('');setShowIngest(false);
    }catch(e){alert('Failed to fetch: '+e.message);}
    finally{setIngestLoading(false);}
  }

  // ── History ───────────────────────────────────────────────────────────────
  async function loadHistory(){
    setHistLoading(true);
    try{const r=await fetch('/api/ai-coach/history');const d=await r.json();setConversations(d.conversations||[]);}
    catch{}finally{setHistLoading(false);}
  }
  async function saveConversation(){
    const saveable=messages.filter(m=>m.role==='user'||m.role==='assistant');
    if(saveable.length<2)return;
    const title=messages.find(m=>m.role==='user')?.content?.slice(0,60)||'Conversation';
    const res=await fetch('/api/ai-coach/history',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:convId||undefined,messages:saveable,title})});
    const d=await res.json();
    if(d.conversationId)setConvId(d.conversationId);
  }
  async function loadConversation(conv){
    setMessages(conv.messages.map(m=>({role:m.role,content:m.content})));
    setConvId(conv.id);setFollowUps([]);setView('chat');
  }
  async function deleteConversation(id,e){
    e.stopPropagation();
    await fetch('/api/ai-coach/history?id='+id,{method:'DELETE'});
    setConversations(prev=>prev.filter(c=>c.id!==id));
    if(convId===id){setConvId(null);}
  }

  // ── Follow-up generation ──────────────────────────────────────────────────
  async function generateFollowUps(msgs){
    try{
      const r=await fetch('/api/ai-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'followups',messages:msgs})});
      const d=await r.json();
      if(d.followups?.length)setFollowUps(d.followups);
    }catch{}
  }

  // ── Morning briefing ──────────────────────────────────────────────────────
  function morningBriefing(){
    const ctx=gatherTraderContext();
    const s=ctx?.summary;
    const briefMsg=s
      ? 'Give me a complete morning session briefing for today. Include: (1) a review of my recent performance trends based on my stats, (2) key things to focus on based on my weak areas, (3) risk management reminders given my drawdown and emotional trade history, (4) any mental/process notes for today\'s session. Be specific and direct — use my actual numbers.'
      : 'Give me a comprehensive morning trading session briefing. Cover: pre-session mindset, key levels to watch, risk management protocol, and a framework for staying disciplined throughout the day.';
    send(briefMsg);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const send=useCallback(async(text,imgOverride,ingestOverride)=>{
    const content=(text||input).trim();
    if(!content&&!imgOverride&&!pendingImg)return;
    if(busy)return;
    const img=imgOverride!==undefined?imgOverride:pendingImg;
    const ingested=ingestOverride!==undefined?ingestOverride:ingestedContent;
    const userMsg={role:'user',content:content||'[Analyzing chart image]',image:img?.b64||null};
    setMessages(prev=>[...prev,userMsg]);
    setInput('');setPendingImg(null);setIngestedContent(null);setFollowUps([]);setBusy(true);
    const tradeContext=gatherTraderContext();
    const history=[...messages,userMsg].map(m=>({role:m.role,content:m.content,image:m.image||null}));
    try{
      const res=await fetch('/api/ai-coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history,tradeContext,ingestedContent:ingested||null})});
      if(res.status===429){const d=await res.json();setMessages(prev=>[...prev,{role:'assistant',content:d.message||'Daily limit reached.',isLimit:true,plan:d.plan}]);setBusy(false);return;}
      if(!res.ok||!res.body){const d=await res.json().catch(()=>({}));setMessages(prev=>[...prev,{role:'assistant',content:d.error||'Something went wrong.'}]);setBusy(false);return;}
      setMessages(prev=>[...prev,{role:'assistant',content:'',streaming:true}]);
      const reader=res.body.getReader();const decoder=new TextDecoder();let full='';
      while(true){const{done,value}=await reader.read();if(done)break;full+=decoder.decode(value,{stream:true});const snap=full;setMessages(prev=>{const next=[...prev];next[next.length-1]={role:'assistant',content:snap,streaming:true};return next;});}
      setMessages(prev=>{const next=[...prev];next[next.length-1]={role:'assistant',content:full,streaming:false};return next;});
      const finalMsgs=[...history,{role:'assistant',content:full}];
      generateFollowUps(finalMsgs);
      // Auto-save if already has a convId
      if(convId){setTimeout(()=>saveConversation(),500);}
    }catch(err){setMessages(prev=>[...prev,{role:'assistant',content:'Connection error. Please try again.'}]);}
    setBusy(false);
  },[input,busy,messages,pendingImg,ingestedContent,convId]);

  const clearChat=()=>{setMessages([{role:'assistant',content:WELCOME}]);setConvId(null);setFollowUps([]);setPendingImg(null);setIngestedContent(null);};
  const isWelcome=messages.length<=1;

  // ── Render ────────────────────────────────────────────────────────────────
  return React.createElement(React.Fragment,null,
    // Floating button
    React.createElement('button',{onClick:()=>setOpen(s=>!s),title:'AI Coach',
      style:{position:'fixed',bottom:26,right:26,zIndex:500,width:54,height:54,borderRadius:'50%',background:'linear-gradient(135deg,#4B44C8,#7c3aed)',border:'none',boxShadow:'0 4px 20px rgba(75,68,200,0.45)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,transition:'all 0.2s',color:'#fff',animation:pulse?'tz-pulse 2.4s ease-in-out infinite':'none'},
      onMouseEnter:e=>{e.currentTarget.style.transform='scale(1.1)';},onMouseLeave:e=>{e.currentTarget.style.transform='scale(1)';}},
      open?'✕':'✦'),

    // Chat panel
    open&&React.createElement('div',{style:{position:'fixed',bottom:90,right:26,zIndex:499,width:540,height:700,background:'var(--surface)',border:'0.5px solid var(--border)',borderRadius:16,boxShadow:'0 20px 60px rgba(0,0,0,0.3)',display:'flex',flexDirection:'column',fontFamily:'var(--font)',animation:'tz-up 0.2s ease-out'}},

      // ── Header
      React.createElement('div',{style:{padding:'10px 14px',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',gap:8,flexShrink:0,borderRadius:'16px 16px 0 0',background:'linear-gradient(135deg,rgba(75,68,200,0.08),rgba(124,58,237,0.06))'}},
        React.createElement('div',{style:{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#4B44C8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,color:'#fff'}},'✦'),
        React.createElement('div',{style:{flex:1}},
          React.createElement('div',{style:{fontSize:13,fontWeight:700,color:'var(--text)'}},'AI Coach'),
          React.createElement('div',{style:{fontSize:10,color:'var(--green)',display:'flex',alignItems:'center',gap:3}},
            React.createElement('div',{style:{width:5,height:5,borderRadius:'50%',background:'var(--green)'}}),
            'Live journal access · calendar aware')
        ),
        // Morning briefing
        React.createElement('button',{onClick:morningBriefing,title:'Morning briefing',style:{background:'none',border:'0.5px solid var(--border)',borderRadius:6,cursor:'pointer',color:'var(--text-muted)',fontSize:10,fontFamily:'var(--font)',padding:'3px 8px',transition:'all 0.1s',whiteSpace:'nowrap'},onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.color=PURPLE;},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)';}},
          '☀ Briefing'),
        // History toggle
        React.createElement('button',{onClick:()=>setView(v=>v==='history'?'chat':'history'),title:'Conversation history',style:{background:view==='history'?'rgba(75,68,200,0.1)':'none',border:'0.5px solid '+(view==='history'?PURPLE:'var(--border)'),borderRadius:6,cursor:'pointer',color:view==='history'?PURPLE:'var(--text-muted)',fontSize:10,fontFamily:'var(--font)',padding:'3px 8px',transition:'all 0.1s'}},
          '⟳ History'),
        // New chat
        React.createElement('button',{onClick:clearChat,style:{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:10,fontFamily:'var(--font)',padding:'3px 8px',borderRadius:5,transition:'all 0.1s'},onMouseEnter:e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.color='var(--text)';},onMouseLeave:e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text-muted)';}},
          '+ New')
      ),

      // ── View: History
      view==='history'&&React.createElement('div',{style:{flex:1,overflowY:'auto',padding:12}},
        histLoading
          ? React.createElement('div',{style:{textAlign:'center',padding:30,color:'var(--text-muted)',fontSize:12}},'Loading...')
          : conversations.length===0
            ? React.createElement('div',{style:{textAlign:'center',padding:'40px 20px',color:'var(--text-muted)',fontSize:12}},
                React.createElement('div',{style:{fontSize:28,marginBottom:8,opacity:0.3}},'⟳'),
                React.createElement('div',null,'No saved conversations yet.'),
                React.createElement('div',{style:{marginTop:4,fontSize:11}},'Chat first, then save.')
              )
            : React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:6}},
                React.createElement('div',{style:{fontSize:11,color:'var(--text-muted)',marginBottom:4,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em'}},'Saved Conversations'),
                ...conversations.map(c=>React.createElement('div',{key:c.id,onClick:()=>loadConversation(c),
                  style:{padding:'10px 12px',borderRadius:8,border:'0.5px solid var(--border)',background:'var(--surface2)',cursor:'pointer',transition:'all 0.1s',display:'flex',justifyContent:'space-between',alignItems:'flex-start'},
                  onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';}},
                  React.createElement('div',{style:{flex:1,minWidth:0}},
                    React.createElement('div',{style:{fontSize:12,fontWeight:500,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},(c.title||'Conversation')),
                    React.createElement('div',{style:{fontSize:10,color:'var(--text-muted)',marginTop:2}},c.messages?.length+' messages · '+new Date(c.updatedAt).toLocaleDateString())
                  ),
                  React.createElement('button',{onClick:e=>deleteConversation(c.id,e),style:{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:14,padding:'0 0 0 8px',flexShrink:0},onMouseEnter:e=>{e.currentTarget.style.color='var(--red)';},onMouseLeave:e=>{e.currentTarget.style.color='var(--text-muted)';}},
                    '×')
                ))
              )
      ),

      // ── View: Chat messages
      view==='chat'&&React.createElement('div',{style:{flex:1,overflowY:'auto',padding:'12px 12px',display:'flex',flexDirection:'column',gap:8}},
        ...messages.map((m,i)=>React.createElement('div',{key:i,style:{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-start'}},
          m.role==='assistant'&&React.createElement('div',{style:{width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#4B44C8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0,marginRight:6,marginTop:2,color:'#fff'}},'✦'),
          React.createElement('div',{style:{maxWidth:'85%',padding:'9px 13px',borderRadius:m.role==='user'?'14px 14px 3px 14px':'3px 14px 14px 14px',background:m.role==='user'?'linear-gradient(135deg,#4B44C8,#7c3aed)':m.isLimit?'rgba(245,158,11,0.08)':'var(--surface2)',color:m.role==='user'?'#fff':m.isLimit?'#f59e0b':'var(--text)',border:m.isLimit?'0.5px solid rgba(245,158,11,0.3)':'none',fontSize:13.5,lineHeight:1.65}},
            // Show image thumbnail if user message had one
            m.role==='user'&&m.image&&React.createElement('img',{src:m.image,alt:'chart',style:{display:'block',maxWidth:'100%',borderRadius:6,marginBottom:6,maxHeight:120,objectFit:'cover'}}),
            m.role==='user'?React.createElement('span',null,m.content):React.createElement(Markdown,{text:m.content}),
            m.streaming&&React.createElement('span',{style:{display:'inline-block',width:8,height:14,background:PURPLE,borderRadius:1,marginLeft:2,animation:'tz-blink 0.8s step-end infinite',verticalAlign:'text-bottom'}}),
            m.isLimit&&React.createElement('button',{onClick:()=>window.location.href='/api/stripe/checkout?plan=pro',style:{display:'block',marginTop:8,padding:'5px 14px',borderRadius:6,border:'none',background:'#f59e0b',color:'#fff',fontFamily:'var(--font)',fontSize:11,fontWeight:700,cursor:'pointer'}},'Upgrade to Pro →')
          )
        )),
        busy&&!messages[messages.length-1]?.streaming&&React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6}},
          React.createElement('div',{style:{width:22,height:22,borderRadius:'50%',background:'linear-gradient(135deg,#4B44C8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,flexShrink:0,color:'#fff'}},'✦'),
          React.createElement('div',{style:{background:'var(--surface2)',borderRadius:'3px 14px 14px 14px',padding:'6px 12px'}},React.createElement(Dots))
        ),
        React.createElement('div',{ref:bottomRef})
      ),

      // ── Quick prompts (welcome screen only)
      view==='chat'&&isWelcome&&React.createElement('div',{style:{padding:'0 12px 8px',flexShrink:0}},
        React.createElement('div',{style:{display:'flex',gap:5,marginBottom:6}},
          ...QUICK_CATS.map((c,i)=>React.createElement('button',{key:i,onClick:()=>setCat(i),style:{padding:'2px 8px',borderRadius:20,border:'0.5px solid '+(cat===i?PURPLE:'var(--border)'),background:cat===i?'rgba(75,68,200,0.1)':'transparent',color:cat===i?PURPLE:'var(--text-muted)',fontFamily:'var(--font)',fontSize:10,cursor:'pointer',fontWeight:cat===i?600:400}},c.label))
        ),
        React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:3}},
          ...QUICK_CATS[cat].prompts.map(q=>React.createElement('button',{key:q,onClick:()=>send(q),style:{padding:'6px 10px',borderRadius:7,border:'0.5px solid var(--border)',background:'var(--surface2)',color:'var(--text)',fontFamily:'var(--font)',fontSize:12,cursor:'pointer',textAlign:'left',transition:'all 0.1s',lineHeight:1.4},onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.background='rgba(75,68,200,0.05)';},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface2)';}},q))
        )
      ),

      // ── Follow-up suggestions
      view==='chat'&&followUps.length>0&&React.createElement('div',{style:{padding:'0 12px 8px',flexShrink:0}},
        React.createElement('div',{style:{fontSize:10,color:'var(--text-muted)',marginBottom:5,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}},'Follow-up'),
        React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:3}},
          ...followUps.map(q=>React.createElement('button',{key:q,onClick:()=>send(q),style:{padding:'5px 10px',borderRadius:7,border:'0.5px solid var(--border)',background:'var(--surface2)',color:'var(--text-muted)',fontFamily:'var(--font)',fontSize:11,cursor:'pointer',textAlign:'left',transition:'all 0.1s',lineHeight:1.4},onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.color='var(--text)';e.currentTarget.style.background='rgba(75,68,200,0.04)';},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.background='var(--surface2)';}},q))
        )
      ),

      // ── Ingested content chip
      view==='chat'&&ingestedContent&&React.createElement('div',{style:{padding:'0 12px 6px',flexShrink:0}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:7,background:'rgba(75,68,200,0.08)',border:'0.5px solid rgba(75,68,200,0.25)'}},
          React.createElement('span',{style:{fontSize:12}},'📎'),
          React.createElement('span',{style:{fontSize:11,color:PURPLE,fontWeight:500,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},(ingestedContent.type==='youtube'?'▶ ':'🔗 ')+(ingestedContent.title||'Content loaded')),
          React.createElement('button',{onClick:()=>setIngestedContent(null),style:{background:'none',border:'none',cursor:'pointer',color:PURPLE,fontSize:14,padding:'0 2px'}},'×')
        )
      ),

      // ── Pending image preview
      view==='chat'&&pendingImg&&React.createElement('div',{style:{padding:'0 12px 6px',flexShrink:0}},
        React.createElement('div',{style:{position:'relative',display:'inline-block'}},
          React.createElement('img',{src:pendingImg.preview,alt:'chart preview',style:{height:56,borderRadius:6,border:'0.5px solid var(--border)',objectFit:'cover'}}),
          React.createElement('button',{onClick:()=>setPendingImg(null),style:{position:'absolute',top:-5,right:-5,width:16,height:16,borderRadius:'50%',background:'rgba(0,0,0,0.6)',border:'none',cursor:'pointer',color:'#fff',fontSize:10,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}},'×')
        )
      ),

      // ── URL ingest input
      view==='chat'&&showIngest&&React.createElement('div',{style:{padding:'0 12px 6px',flexShrink:0,display:'flex',gap:5}},
        React.createElement('input',{value:ingestUrl,onChange:e=>setIngestUrl(e.target.value),onKeyDown:e=>{if(e.key==='Enter')ingestUrl_fn();if(e.key==='Escape')setShowIngest(false);},placeholder:'Paste YouTube URL or article link…',style:{flex:1,padding:'7px 10px',borderRadius:7,border:'0.5px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:12,color:'var(--text)',outline:'none'},onFocus:e=>e.target.style.borderColor=PURPLE,onBlur:e=>e.target.style.borderColor='var(--border)'}),
        React.createElement('button',{onClick:ingestUrl_fn,disabled:ingestLoading||!ingestUrl.trim(),style:{padding:'7px 12px',borderRadius:7,border:'none',background:PURPLE,color:'#fff',fontFamily:'var(--font)',fontSize:11,fontWeight:600,cursor:'pointer',opacity:ingestLoading||!ingestUrl.trim()?0.5:1}},ingestLoading?'…':'Load')
      ),

      // ── Input row
      React.createElement('div',{style:{padding:'8px 10px',borderTop:'0.5px solid var(--border)',display:'flex',gap:6,flexShrink:0,alignItems:'flex-end'}},
        // Image upload
        React.createElement('button',{onClick:()=>fileRef.current?.click(),title:'Attach chart image (or paste)',style:{width:34,height:34,borderRadius:8,border:'0.5px solid '+(pendingImg?PURPLE:'var(--border)'),background:pendingImg?'rgba(75,68,200,0.1)':'transparent',cursor:'pointer',color:pendingImg?PURPLE:'var(--text-muted)',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.1s'}},
          '📷'),
        React.createElement('input',{ref:fileRef,type:'file',accept:'image/*',style:{display:'none'},onChange:e=>readImageFile(e.target.files[0])}),
        // URL ingest toggle
        React.createElement('button',{onClick:()=>setShowIngest(s=>!s),title:'Ingest YouTube/article URL',style:{width:34,height:34,borderRadius:8,border:'0.5px solid '+(showIngest?PURPLE:'var(--border)'),background:showIngest?'rgba(75,68,200,0.1)':'transparent',cursor:'pointer',color:showIngest?PURPLE:'var(--text-muted)',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.1s'}},
          '🔗'),
        // Voice input
        React.createElement('button',{onClick:toggleRecording,title:recording?'Stop recording':'Voice input',style:{width:34,height:34,borderRadius:8,border:'0.5px solid '+(recording?'var(--red)':'var(--border)'),background:recording?'rgba(220,38,38,0.1)':'transparent',cursor:'pointer',color:recording?'var(--red)':'var(--text-muted)',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.1s',animation:recording?'tz-pulse-red 1s ease-in-out infinite':'none'}},
          '🎤'),
        // Save button (shown once there's content to save)
        messages.length>1&&React.createElement('button',{onClick:saveConversation,title:'Save conversation',style:{width:34,height:34,borderRadius:8,border:'0.5px solid var(--border)',background:'transparent',cursor:'pointer',color:'var(--text-muted)',fontSize:14,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.1s'},onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.color=PURPLE;},onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)';}},
          '💾'),
        // Textarea
        React.createElement('textarea',{ref:inputRef,value:input,onChange:e=>{setInput(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,100)+'px';},onKeyDown:e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}},placeholder:recording?'Listening…':'Ask your AI coach… (Shift+Enter = newline)',rows:1,style:{flex:1,padding:'8px 12px',borderRadius:8,border:'0.5px solid var(--border)',background:'var(--surface2)',fontFamily:'var(--font)',fontSize:13,color:'var(--text)',outline:'none',resize:'none',lineHeight:1.5,transition:'border-color 0.15s',overflow:'hidden',background:recording?'rgba(220,38,38,0.05)':'var(--surface2)'},onFocus:e=>e.target.style.borderColor=PURPLE,onBlur:e=>e.target.style.borderColor='var(--border)'}),
        // Send
        React.createElement('button',{onClick:()=>send(),disabled:busy||(!input.trim()&&!pendingImg),style:{width:36,height:36,borderRadius:8,border:'none',flexShrink:0,background:busy||(!input.trim()&&!pendingImg)?'var(--surface2)':'linear-gradient(135deg,#4B44C8,#7c3aed)',color:busy||(!input.trim()&&!pendingImg)?'var(--text-muted)':'#fff',cursor:busy||(!input.trim()&&!pendingImg)?'not-allowed':'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.15s'}},'↑')
      )
    ),

    // Styles
    React.createElement('style',null,
      '@keyframes tz-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}'+
      '@keyframes tz-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}'+
      '@keyframes tz-pulse{0%,100%{box-shadow:0 4px 20px rgba(75,68,200,0.45)}50%{box-shadow:0 4px 32px rgba(75,68,200,0.75)}}'+
      '@keyframes tz-pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)}50%{box-shadow:0 0 0 6px rgba(220,38,38,0)}}'+
      '@keyframes tz-blink{0%,100%{opacity:1}50%{opacity:0}}'
    )
  );
}
