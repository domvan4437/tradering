'use client';
import { useState, useRef, useEffect } from 'react';

const PURPLE = '#4f46e5';

const QUICK_ACTIONS = [
  { id:'analysis', label:'Personalized Analysis', icon:'📊', prompt:'Generate my personalized trading performance analysis based on all my data.' },
  { id:'briefing', label:'Market Briefing', icon:'🌐', prompt:'Give me a concise market briefing covering the major markets, key levels to watch, and any high-impact events coming up.' },
  { id:'cot', label:'COT Interpreter', icon:'📈', prompt:'Explain how to read the Commitment of Traders report and what current positioning data typically signals for traders. Give me a practical breakdown.' },
  { id:'strategy', label:'Strategy Builder', icon:'🏗️', prompt:'Help me build a personalized strategy framework. Ask me questions about my style, timeframe, preferred markets, and risk tolerance, then build me a structured plan with entry criteria, exit rules, and position sizing guidelines.' },
  { id:'review', label:'Trade Review', icon:'🔍', prompt:'I want you to review a specific trade I made. I will describe the setup, entry, exit, and my reasoning. Give me detailed feedback on what I did well and what I should have done differently.' },
  { id:'risk', label:'Risk Calculator', icon:'⚖️', prompt:'Help me calculate proper position sizing for a trade. Ask me my account size, risk percentage per trade, entry price, and stop loss level, then give me the exact position size, max dollar risk, and evaluate whether the risk/reward makes sense.' },
];

function Msg({ m }) {
  const u = m.role === 'user';
  return (
    <div style={{ display:'flex', gap:10, flexDirection:u?'row-reverse':'row', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:30, height:30, borderRadius:'50%', background:u?PURPLE:'#e0e7ff', border:u?'none':'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:u?'#fff':PURPLE }}>
        {u ? 'D' : 'AI'}
      </div>
      <div style={{ maxWidth:'78%' }}>
        <div style={{ background:u?PURPLE:'var(--surface2)', color:u?'#fff':'var(--text)', padding:'11px 15px', borderRadius:u?'16px 4px 16px 16px':'4px 16px 16px 16px', fontFamily:'var(--font)', fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap' }}>
          {m.content}
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:3, textAlign:u?'right':'left' }}>{m.time}</div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:30, height:30, borderRadius:'50%', background:'#e0e7ff', border:'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:PURPLE }}>AI</div>
      <div style={{ background:'var(--surface2)', padding:'13px 16px', borderRadius:'4px 16px 16px 16px', display:'flex', gap:5 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)', animation:'bounce 1.2s ease-in-out '+(i*0.2)+'s infinite' }} />)}
      </div>
    </div>
  );
}

export default function AICoachTab() {
  const ts = () => new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const [msgs, setMsgs] = useState([{ id:1, role:'assistant', content:'Hi! I am TradeRing AI. Ask me anything, or use a quick action above to get started.', time:ts() }]);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [act, setAct] = useState(null);
  const endRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [msgs, busy]);

  const send = async (content) => {
    if (!content.trim() || busy) return;
    const um = { id:Date.now(), role:'user', content, time:ts() };
    const next = [...msgs, um];
    setMsgs(next);
    setTxt('');
    setBusy(true);
    try {
      const r = await fetch('/api/ai-coach', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:next.map(m=>({role:m.role,content:m.content})), mode:'chat' }) });
      const d = await r.json();
      setMsgs(p => [...p, { id:Date.now()+1, role:'assistant', content:d.analysis||d.response||d.error||'Something went wrong.', time:ts() }]);
    } catch {
      setMsgs(p => [...p, { id:Date.now()+1, role:'assistant', content:'Connection error. Please try again.', time:ts() }]);
    }
    setBusy(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 140px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>

      {/* Header */}
      <div style={{ padding:'14px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:PURPLE }}>TradeRing AI</span>
        <button onClick={() => { setMsgs([{id:Date.now(),role:'assistant',content:'Chat cleared.',time:ts()}]); setAct(null); }} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Clear chat</button>
      </div>

      {/* Quick actions */}
      <div style={{ padding:'8px 24px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.id} onClick={() => { setAct(a.id); send(a.prompt); }} disabled={busy}
              style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1px solid '+(act===a.id?PURPLE:'var(--border)'), background:act===a.id?'#eef2ff':'var(--surface2)', color:act===a.id?PURPLE:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:busy?'default':'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              <span>{a.icon}</span><span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Messages - ONLY scrollable part */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'20px 24px', minHeight:0 }}>
        {msgs.map(m => <Msg key={m.id} m={m} />)}
        {busy && <Dots />}
        <div ref={endRef} />
      </div>

      {/* Input - fixed at bottom */}
      <div style={{ padding:'14px 24px', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', border:'2px solid '+PURPLE, borderRadius:14, padding:'10px 10px 10px 16px', background:'var(--bg)' }}>
          <textarea
            ref={taRef}
            value={txt}
            onChange={e => setTxt(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(txt);} }}
            placeholder='Ask anything...'
            rows={2}
            disabled={busy}
            style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none', lineHeight:1.6 }}
          />
          <button
            onClick={() => send(txt)}
            style={{ width:36, height:36, borderRadius:9, backgroundColor:'#4f46e5', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'>
              <line x1='22' y1='2' x2='11' y2='13'/>
              <polygon points='22 2 15 22 11 13 2 9 22 2'/>
            </svg>
          </button>
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:5, textAlign:'center' }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
}