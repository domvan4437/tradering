'use client'
import React, { useState, useEffect, useRef } from 'react';

const PURPLE = '#4f46e5';

function saveConvos(convos) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('tr_dms', JSON.stringify(convos)); } catch(e) {}
}
function loadConvos() {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem('tr_dms'); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
function getColor(name) { return COLORS[(name||'?').charCodeAt(0) % COLORS.length]; }

function Avatar({ letter, size=36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:getColor(letter), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {(letter||'?')[0].toUpperCase()}
    </div>
  );
}

export default function DMTab({ initialUser }) {
  const [mounted, setMounted] = useState(false);
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [newUser, setNewUser] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const loaded = loadConvos();
    setConvos(loaded);
    if (initialUser) {
      // Open or create convo with this user
      const existing = loaded.find(c => c.user === initialUser);
      if (existing) {
        setActiveId(existing.id);
      } else {
        const newConvo = { id: Date.now(), user: initialUser, messages: [], unread: 0 };
        const updated = [newConvo, ...loaded];
        setConvos(updated);
        saveConvos(updated);
        setActiveId(newConvo.id);
      }
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
  }, []);

  useEffect(() => { if (mounted) saveConvos(convos); }, [convos, mounted]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [activeId, convos]);

  // Expose global so FeedTab can open a DM
  useEffect(() => {
    window.__openDM = (user) => {
      const existing = convos.find(c => c.user === user);
      if (existing) { setActiveId(existing.id); return; }
      const newConvo = { id: Date.now(), user, messages: [], unread: 0 };
      setConvos(prev => { const u = [newConvo, ...prev]; saveConvos(u); return u; });
      setActiveId(newConvo.id);
    };
    return () => { delete window.__openDM; };
  }, [convos]);

  const activeConvo = convos.find(c => c.id === activeId);

  const sendMsg = () => {
    if (!msgText.trim() || !activeConvo) return;
    const msg = { id: Date.now(), from: 'you', text: msgText.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, msg] } : c));
    setMsgText('');
  };

  const startNewConvo = () => {
    if (!newUser.trim()) return;
    const existing = convos.find(c => c.user === newUser.trim());
    if (existing) { setActiveId(existing.id); setShowNew(false); setNewUser(''); return; }
    const newConvo = { id: Date.now(), user: newUser.trim(), messages: [], unread: 0 };
    setConvos(prev => [newConvo, ...prev]);
    setActiveId(newConvo.id);
    setShowNew(false);
    setNewUser('');
  };

  const lastMsg = (convo) => {
    if (!convo.messages.length) return 'No messages yet';
    const m = convo.messages[convo.messages.length-1];
    return (m.from === 'you' ? 'You: ' : '') + m.text;
  };

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:'var(--font)' }}>

      {/* Convo list */}
      <div style={{ width:'100%', display:'flex', flexDirection:'column', height:'100%' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ marginBottom:10 }}>
            <input
  value={dmSearch}
  onChange={e => setDmSearch(e.target.value)}
  onKeyDown={e => {
    if (e.key === 'Enter' && dmSearch.trim()) {
      const existing = convos.find(c => c.user.toLowerCase() === dmSearch.trim().toLowerCase());
      if (existing) { setActiveId(existing.id); setDmSearch(''); return; }
      const newConvo = { id:Date.now(), user:dmSearch.trim(), messages:[], unread:0 };
      setConvos(prev => { const u=[newConvo,...prev]; saveConvos(u); return u; });
      setActiveId(newConvo.id);
      setDmSearch('');
    }
  }}
  placeholder="Search..."
  style={{ width:'100%', padding:'8px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }}
/>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showNew?10:0 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>Messages</span>
            <button onClick={() => setShowNew(s=>!s)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>+ New</button>
          </div>
          {showNew && (
            <div style={{ display:'flex', gap:6 }}>
              <input value={newUser} onChange={e=>setNewUser(e.target.value)} onKeyDown={e=>e.key==='Enter'&&startNewConvo()} placeholder="Username..." style={{ flex:1, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
              <button onClick={startNewConvo} style={{ padding:'7px 12px', borderRadius:8, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Go</button>
            </div>
          )}
        </div>

        {convos.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, gap:8 }}>
            <div style={{ fontSize:28 }}>💬</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No messages yet. Click a username on the feed to start a conversation.</div>
          </div>
        ) : (
          <div style={{ flex:1, overflowY:'auto' }}>
            {convos.filter(c => !dmSearch.trim() || c.user.toLowerCase().includes(dmSearch.toLowerCase())).map(c => (
              <div key={c.id} onClick={() => setActiveId(c.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', background: activeId===c.id ? 'var(--accent-bg)' : 'transparent', transition:'background 0.1s' }}
                onMouseEnter={e => { if(activeId!==c.id) e.currentTarget.style.background='var(--surface2)'; }}
                onMouseLeave={e => { if(activeId!==c.id) e.currentTarget.style.background='transparent'; }}>
                <Avatar letter={c.user} size={38} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: activeId===c.id?PURPLE:'var(--text)' }}>{c.user}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lastMsg(c)}</div>
                </div>
                {c.unread > 0 && <span style={{ width:18, height:18, borderRadius:'50%', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{c.unread}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
