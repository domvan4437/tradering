'use client';
import { useState, useRef, useEffect } from 'react';

const PURPLE = '#4f46e5';
const STORAGE_KEY = 'tr_ai_chats';

const QUICK_ACTIONS = [
  { id:'analysis', label:'Personalized Analysis', icon:'📊', prompt:'Generate my personalized trading performance analysis based on all my data.' },
  { id:'briefing', label:'Market Briefing', icon:'🌐', prompt:'Give me a concise market briefing covering the major markets, key levels to watch, and any high-impact events coming up.' },
  { id:'cot', label:'COT Interpreter', icon:'📈', prompt:'Explain how to read the Commitment of Traders report and what current positioning data typically signals for traders. Give me a practical breakdown.' },
  { id:'strategy', label:'Strategy Builder', icon:'🏗️', prompt:'Help me build a personalized strategy framework. Ask me questions about my style, timeframe, preferred markets, and risk tolerance, then build me a structured plan with entry criteria, exit rules, and position sizing guidelines.' },
  { id:'review', label:'Trade Review', icon:'🔍', prompt:'I want you to review a specific trade I made. I will describe the setup, entry, exit, and my reasoning. Give me detailed feedback on what I did well and what I should have done differently.' },
  { id:'risk', label:'Risk Calculator', icon:'⚖️', prompt:'Help me calculate proper position sizing for a trade. Ask me my account size, risk percentage per trade, entry price, and stop loss level, then give me the exact position size, max dollar risk, and evaluate whether the risk/reward makes sense.' },
];

function loadChats() {
  try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; } catch { return []; }
}
function saveChats(chats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch {}
}
function newChat() {
  return { id: Date.now(), title: 'New Chat', createdAt: new Date().toISOString(), messages: [{ id:1, role:'assistant', content:'Hi! I am TradeRing AI. Ask me anything, or use a quick action above to get started.', time: new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }] };
}

function RateLimitMsg({ m }) {
  const PURPLE = '#4f46e5';
  return (
    <div style={{ margin:'12px 0', padding:'16px 18px', background:'rgba(79,70,229,0.08)', border:'1px solid rgba(79,70,229,0.25)', borderRadius:12 }}>
      <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:PURPLE, marginBottom:6 }}>
        ⚡ Daily AI limit reached
      </div>
      <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:12 }}>
        {m.plan === 'free'
          ? `You've used all ${m.limit} free messages today. Upgrade to Pro for 100 messages/day, or Trader for unlimited access.`
          : `You've used all ${m.limit} messages today. Your limit resets at midnight.`}
      </div>
      {m.upgradeRequired && (
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => window.location.href = '/api/stripe/checkout?plan=pro'}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            Upgrade to Pro — $29/mo
          </button>
          <button onClick={() => window.location.href = '/api/stripe/checkout?plan=trader'}
            style={{ padding:'8px 18px', borderRadius:8, border:'1px solid '+PURPLE, background:'transparent', color:PURPLE, fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Trader — $79/mo
          </button>
        </div>
      )}
    </div>
  );
}

function Msg({ m }) {
  const u = m.role === 'user';
  return (
    <div style={{ display:'flex', gap:10, flexDirection:u?'row-reverse':'row', alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:30, height:30, borderRadius:'50%', backgroundColor:u?PURPLE:'#e0e7ff', border:u?'none':'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:u?'#fff':PURPLE }}>{u?'D':'AI'}</div>
      <div style={{ maxWidth:'78%' }}>
        <div style={{ backgroundColor:u?PURPLE:'var(--surface2)', color:u?'#fff':'var(--text)', padding:'11px 15px', borderRadius:u?'16px 4px 16px 16px':'4px 16px 16px 16px', fontFamily:'var(--font)', fontSize:13, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{m.content}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:3, textAlign:u?'right':'left' }}>{m.time}</div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:16 }}>
      <div style={{ width:30, height:30, borderRadius:'50%', backgroundColor:'#e0e7ff', border:'1px solid #c7d2fe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:PURPLE }}>AI</div>
      <div style={{ backgroundColor:'var(--surface2)', padding:'13px 16px', borderRadius:'4px 16px 16px 16px', display:'flex', gap:5 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'var(--text-muted)', animation:'bounce 1.2s ease-in-out '+(i*0.2)+'s infinite' }} />)}
      </div>
    </div>
  );
}

export default function AICoachTab() {
  const ts = () => new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [act, setAct] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const endRef = useRef(null);
  const taRef = useRef(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const saved = loadChats();
    if (saved.length > 0) {
      setChats(saved);
      setActiveChatId(saved[0].id);
    } else {
      const first = newChat();
      setChats([first]);
      setActiveChatId(first.id);
    }
  }, []);

  // Save chats whenever they change
  useEffect(() => {
    if (chats.length > 0) saveChats(chats);
  }, [chats]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chats, busy, activeChatId]);

  const activeChat = chats.find(c => c.id === activeChatId);
  const msgs = activeChat?.messages || [];

  const updateChat = (id, updater) => {
    setChats(prev => prev.map(c => c.id === id ? updater(c) : c));
  };

  const send = async (content) => {
    if (!content.trim() || busy || !activeChatId) return;
    const userMsg = { id:Date.now(), role:'user', content, time:ts() };
    const currentMsgs = [...msgs, userMsg];
    // Auto-title from first user message
    const isFirstUserMsg = msgs.filter(m => m.role==='user').length === 0;
    updateChat(activeChatId, c => ({
      ...c,
      title: isFirstUserMsg ? content.slice(0,40)+(content.length>40?'...':'') : c.title,
      messages: currentMsgs,
    }));
    setTxt('');
    setBusy(true);
    try {
      const r = await fetch('/api/ai-coach', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ messages:currentMsgs.map(m=>({role:m.role,content:m.content})), mode:'chat' }) });
      const d = await r.json();
      if (r.status === 429) {
        const limitMsg = { id:Date.now()+1, role:'assistant', isRateLimit:true, plan:d.plan, upgradeRequired:d.upgradeRequired, used:d.used, limit:d.limit, content:d.message||'Daily limit reached.', time:ts() };
        updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, limitMsg] }));
      } else {
        const aiMsg = { id:Date.now()+1, role:'assistant', content:d.analysis||d.response||d.error||'Something went wrong.', time:ts() };
        updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, aiMsg] }));
      }
      updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, aiMsg] }));
    } catch {
      const errMsg = { id:Date.now()+1, role:'assistant', content:'Connection error. Please try again.', time:ts() };
      updateChat(activeChatId, c => ({ ...c, messages: [...c.messages, errMsg] }));
    }
    setBusy(false);
  };

  const createNewChat = () => {
    const c = newChat();
    setChats(prev => [c, ...prev]);
    setActiveChatId(c.id);
    setAct(null);
    setTxt('');
  };

  const deleteChat = (id) => {
    const remaining = chats.filter(c => c.id !== id);
    if (remaining.length === 0) {
      const fresh = newChat();
      setChats([fresh]);
      setActiveChatId(fresh.id);
    } else {
      setChats(remaining);
      if (activeChatId === id) setActiveChatId(remaining[0].id);
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 3600) return Math.floor(diff/60)+'m ago';
    if (diff < 86400) return Math.floor(diff/3600)+'h ago';
    if (diff < 604800) return Math.floor(diff/86400)+'d ago';
    return d.toLocaleDateString([], {month:'short', day:'numeric'});
  };

  return (
    <div style={{ display:'flex', height:'calc(100vh - 140px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>

      {/* Sidebar */}
      {sidebarOpen && (
        <div style={{ width:240, borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', background:'var(--surface)', flexShrink:0, overflow:'hidden' }}>
          <div style={{ padding:'12px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
            <button onClick={createNewChat} style={{ width:'100%', padding:'8px', borderRadius:8, backgroundColor:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              <svg width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'><line x1='12' y1='5' x2='12' y2='19'/><line x1='5' y1='12' x2='19' y2='12'/></svg>
              New Chat
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'8px 6px' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', padding:'4px 8px 8px' }}>Recent</div>
            {chats.map(chat => (
              <div key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{ padding:'9px 10px', borderRadius:8, cursor:'pointer', marginBottom:2, backgroundColor: activeChatId===chat.id?'#eef2ff':'transparent', border: activeChatId===chat.id?'1px solid #c7d2fe':'1px solid transparent', position:'relative' }}
                onMouseEnter={e => { if(activeChatId!==chat.id) e.currentTarget.style.backgroundColor='var(--surface2)'; e.currentTarget.querySelector('.del-btn').style.opacity='1'; }}
                onMouseLeave={e => { if(activeChatId!==chat.id) e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.querySelector('.del-btn').style.opacity='0'; }}
              >
                {editingId === chat.id ? (
                  <input autoFocus value={editTitle} onChange={e=>setEditTitle(e.target.value)} onBlur={() => { updateChat(chat.id, c=>({...c,title:editTitle||c.title})); setEditingId(null); }} onKeyDown={e=>e.key==='Enter'&&(updateChat(chat.id,c=>({...c,title:editTitle||c.title})),setEditingId(null))} style={{ width:'100%', border:'1px solid '+PURPLE, borderRadius:4, padding:'2px 4px', fontFamily:'var(--font)', fontSize:12, outline:'none', background:'var(--bg)' }} />
                ) : (
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight: activeChatId===chat.id?600:400, color: activeChatId===chat.id?PURPLE:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', paddingRight:20 }} onDoubleClick={() => { setEditingId(chat.id); setEditTitle(chat.title); }}>{chat.title}</div>
                )}
                <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{formatDate(chat.createdAt)}</div>
                <button className='del-btn' onClick={e => { e.stopPropagation(); deleteChat(chat.id); }} style={{ position:'absolute', top:8, right:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', opacity:0, fontSize:14, lineHeight:1, padding:'0 2px' }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* Header */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'4px', borderRadius:6 }}>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><line x1='3' y1='6' x2='21' y2='6'/><line x1='3' y1='12' x2='21' y2='12'/><line x1='3' y1='18' x2='21' y2='18'/></svg>
          </button>
          <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:PURPLE, flex:1 }}>TradeRing AI</span>
          <button onClick={createNewChat} style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+PURPLE, backgroundColor:'transparent', color:PURPLE, fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>+ New Chat</button>
        </div>

        {/* Quick actions */}
        <div style={{ padding:'8px 20px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:6, overflowX:'auto' }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.id} onClick={() => { setAct(a.id); send(a.prompt); }} disabled={busy}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:20, border:'1px solid '+(act===a.id?PURPLE:'var(--border)'), backgroundColor:act===a.id?'#eef2ff':'var(--surface2)', color:act===a.id?PURPLE:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:busy?'default':'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                <span>{a.icon}</span><span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'20px', minHeight:0 }}>
          {msgs.map(m => <Msg key={m.id} m={m} />)}
          {busy && <Dots />}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'12px 20px', background:'var(--surface)', flexShrink:0 }}>
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
            <button onClick={() => send(txt)} style={{ width:36, height:36, borderRadius:9, backgroundColor:'#4f46e5', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='white' strokeWidth='2.5'><line x1='22' y1='2' x2='11' y2='13'/><polygon points='22 2 15 22 11 13 2 9 22 2'/></svg>
            </button>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:5, textAlign:'center' }}>Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </div>
  );
}