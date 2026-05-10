'use client'
import { useState, useEffect, useRef } from 'react';
import FeedTab from './FeedTab';
import DMTab from './DMTab';

const PURPLE = '#4f46e5';

// ── Helpers ───────────────────────────────────────────────────────────────────
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
function getColor(name) {
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  return colors[(name||'?').charCodeAt(0) % colors.length];
}
function loadGroups() {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem('tr_groups'); if (!d) return []; return JSON.parse(d).map(g => ({ visibility:'open', country:'', desc:'', profileImg:null, ...g })); } catch(e) { return []; }
}

// ── UserSearch ────────────────────────────────────────────────────────────────
function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/social/leaderboard?search=' + encodeURIComponent(query) + '&limit=8');
        const data = await res.json();
        setResults(data.users || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:320 }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = '0 0 0 3px ' + PURPLE + '18'; setOpen(true); }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        placeholder="Search traders..."
        style={{ width:'100%', padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'all 0.15s' }}
      />
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.2)', zIndex:500, maxHeight:320, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          ) : results.map(u => (
            <div key={u.id} onClick={() => { goToProfile(u.profileSlug || u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:11, color:PURPLE }}>✓</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {u.tradingStyle && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</span>}
                  {u.consistency?.winRate && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)' }}>{Math.round(u.consistency.winRate*100)}% WR</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline GroupRoom for the Groups tab ───────────────────────────────────────
function GroupChatRoom({ group, activeChannel, onChannelChange }) {
  const [msg, setMsg] = React.useState('');
  const [messages, setMessages] = React.useState([]);
  const endRef = React.useRef(null);

  React.useEffect(() => {
    try {
      const d = localStorage.getItem('tr_chat_' + group.id + '_' + activeChannel);
      setMessages(d ? JSON.parse(d) : []);
    } catch { setMessages([]); }
  }, [group.id, activeChannel]);

  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    const newMsg = { id:Date.now(), user:'you', text:msg.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    const updated = [...messages, newMsg];
    setMessages(updated);
    try { localStorage.setItem('tr_chat_' + group.id + '_' + activeChannel, JSON.stringify(updated)); } catch {}
    setMsg('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minWidth:0 }}>
      {/* Channel label */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>#</span>
        <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{activeChannel}</span>
      </div>
      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages in #{activeChannel} yet. Say hello!</div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:getColor(m.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {(m.user||'?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.time}</span>
              </div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {/* Input */}
      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px' }}>
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder={'Message #' + activeChannel}
            style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
          <button onClick={send} disabled={!msg.trim()} style={{ width:30, height:30, borderRadius:8, background:msg.trim()?PURPLE:'var(--surface3)', color:'#fff', border:'none', cursor:msg.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client'
import { useState, useEffect, useRef } from 'react';
import FeedTab from './FeedTab';
import DMTab from './DMTab';

const PURPLE = '#4f46e5';

// ── Helpers ───────────────────────────────────────────────────────────────────
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
function getColor(name) {
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  return colors[(name||'?').charCodeAt(0) % colors.length];
}
function loadGroups() {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem('tr_groups'); if (!d) return []; return JSON.parse(d).map(g => ({ visibility:'open', country:'', desc:'', profileImg:null, ...g })); } catch(e) { return []; }
}

// ── UserSearch ────────────────────────────────────────────────────────────────
function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/social/leaderboard?search=' + encodeURIComponent(query) + '&limit=8');
        const data = await res.json();
        setResults(data.users || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:320 }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = '0 0 0 3px ' + PURPLE + '18'; setOpen(true); }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        placeholder="Search traders..."
        style={{ width:'100%', padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'all 0.15s' }}
      />
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.2)', zIndex:500, maxHeight:320, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          ) : results.map(u => (
            <div key={u.id} onClick={() => { goToProfile(u.profileSlug || u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:11, color:PURPLE }}>✓</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {u.tradingStyle && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</span>}
                  {u.consistency?.winRate && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)' }}>{Math.round(u.consistency.winRate*100)}% WR</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline GroupRoom for the Groups tab ───────────────────────────────────────
function GroupChatRoom({ group, onBack }) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomTab, setRoomTab] = useState('chat');
  const endRef = useRef(null);

  const CHANNELS = ['general','trade-ideas','cot-analysis','announcements'];

  useEffect(() => {
    try {
      const d = localStorage.getItem('tr_chat_' + group.id + '_' + activeChannel);
      setMessages(d ? JSON.parse(d) : []);
    } catch { setMessages([]); }
  }, [group.id, activeChannel]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    const newMsg = { id:Date.now(), user:'you', text:msg.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    const updated = [...messages, newMsg];
    setMessages(updated);
    try { localStorage.setItem('tr_chat_' + group.id + '_' + activeChannel, JSON.stringify(updated)); } catch {}
    setMsg('');
  };

  const MEMBERS = group.creator === 'you'
    ? [{ name:'you', role:'Founder', color:'#4f46e5' }]
    : [
        { name: group.creator || 'Creator', role:'Founder', color:'#16a34a' },
        { name:'you', role:'Member', color:'#4f46e5' },
      ];

  const roleColor = (role) => role==='Founder' ? '#16a34a' : role==='Co-Leader' ? '#d97706' : 'var(--text-muted)';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Group picker + channel bar */}
      <div style={{ flexShrink:0, background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
        {/* Back + group name */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:28, height:28, borderRadius:8, background:group.grad||PURPLE, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {group.profileImg ? <img src={group.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (group.name||'G')[0].toUpperCase()}
          </div>
          <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{group.name}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{group.type === 'club' ? group.members + '/' + (group.max||50) : (group.members||1)} members</span>
        </div>

        {/* Horizontal channel tabs */}
        <div style={{ display:'flex', alignItems:'center', overflowX:'auto', padding:'0 16px' }}>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setActiveChannel(ch)} style={{
              padding:'8px 14px', background:'none', border:'none',
              borderBottom: activeChannel===ch ? '2px solid ' + PURPLE : '2px solid transparent',
              color: activeChannel===ch ? PURPLE : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:12, fontWeight: activeChannel===ch ? 600 : 400,
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1,
              display:'flex', alignItems:'center', gap:4,
            }}>
              # {ch}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center', paddingLeft:8 }}>
            <button onClick={() => setRoomTab(roomTab==='chat'?'members':'chat')} style={{ background:'none', border:'none', cursor:'pointer', color: roomTab==='members'?PURPLE:'var(--text-muted)', padding:'4px', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
            <button onClick={onBack} title="Settings" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'4px', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat + members */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Messages */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages in #{activeChannel} yet. Say hello!</div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display:'flex', gap:10, flexDirection:'row', alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:getColor(m.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {(m.user||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.time}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{m.text}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {/* Input */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px' }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }} placeholder={'Message #' + activeChannel}
                style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
              <button onClick={send} disabled={!msg.trim()} style={{ width:30, height:30, borderRadius:8, background:msg.trim()?PURPLE:'var(--surface3)', color:'#fff', border:'none', cursor:msg.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Members panel */}
        {roomTab === 'members' && (
          <div style={{ width:180, borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'12px' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Members</div>
            {MEMBERS.map(m => (
              <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:roleColor(m.role) }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main CommunityLayout ──────────────────────────────────────────────────────
export default function CommunityLayout({ currentUserId }) {
  const [tab, setTab] = useState('feed');
  const [feedTab, setFeedTab] = useState('Discover');
  const containerRef = useRef(null);
  const [topOffset, setTopOffset] = useState(120);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTopOffset(Math.round(rect.top));
    }
  }, []);

  const h = 'calc(100vh - ' + topOffset + 'px)';

  return (
    <div ref={containerRef} style={{ display:'flex', flexDirection:'column', height:h, fontFamily:'var(--font)', overflow:'hidden' }}>
      {/* top nav - option 2 style */}
      <div style={{ background:'#4f46e5', padding:'0 20px', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', gap:0 }}>
          {[['feed','Feed'],['groups','Groups'],['dms','Messages']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'11px 20px', background:'none', border:'none',
              borderBottom: tab===t ? '2px solid #fff' : '2px solid transparent',
              color: tab===t ? '#fff' : 'rgba(255,255,255,0.6)',
              fontFamily:'var(--font)', fontSize:13, fontWeight: tab===t ? 600 : 400,
              cursor:'pointer', transition:'all 0.15s', marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, color:'rgba(255,255,255,0.7)' }}>
          {tab === 'feed' && <UserSearch />}
          <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ cursor:'pointer', flexShrink:0 }}><path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/><path d='M13.73 21a2 2 0 0 1-3.46 0'/></svg>
        </div>
      </div>
      {/* feed sub-tabs (only on feed view) */}
      {tab === 'feed' && (
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'stretch', overflowX:'auto' }}>
          {[
            { key:'Discover', icon:'trending-up' },
            { key:'Following', icon:'users' },
            { key:'Ideas', icon:null },
            { key:'Screeners', icon:null },
            { key:'Strategies', icon:null },
            { key:'COT Signals', icon:null },
          ].map(({ key: ft, icon }) => (
            <button key={ft} onClick={() => setFeedTab(ft)} style={{
              padding:'10px 16px', background:'none', border:'none',
              borderBottom: feedTab===ft ? '2px solid #4f46e5' : '2px solid transparent',
              color: feedTab===ft ? '#4f46e5' : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:13, fontWeight: feedTab===ft ? 600 : 400,
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1,
              display:'flex', alignItems:'center', gap:6,
            }}>
              {icon && <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>{icon==='trending-up' ? <><polyline points='23 6 13.5 15.5 8.5 10.5 1 18'/><polyline points='17 6 23 6 23 12'/></> : <><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></>}</svg>}
              {ft}
            </button>
          ))}
        </div>
      )}


      {/* ── Tab content ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

        {/* FEED */}
        {tab === 'feed' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Main feed */}
            <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
              <FeedTab currentUserId={currentUserId} activeTab={feedTab} />
            </div>
            {/* Right sidebar */}
            <div style={{ width:220, borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'16px 14px', flexShrink:0 }}>
              <RightSidebar />
            </div>
          </div>
        )}

        {/* GROUPS */}
        {tab === 'groups' && (
          <div style={{ flex:1, overflow:'hidden' }}>
            <GroupsView currentUserId={currentUserId} />
          </div>
        )}

        {/* MESSAGES */}
        {tab === 'dms' && (
          <div style={{ flex:1, overflow:'hidden' }}>
            <DMTab />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Right sidebar (feed view) ─────────────────────────────────────────────────
function RightSidebar() {
  const [groups, setGroups] = useState([]);
  useEffect(() => { setGroups(loadGroups().slice(0, 3)); }, []);

  const TRENDING = [
    { tag:'GoldCOT', posts:2847 },
    { tag:'FOMC', posts:1204 },
    { tag:'EURUSD', posts:892 },
    { tag:'CrudeOil', posts:744 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Active groups */}
      {groups.length > 0 && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Your Groups</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {groups.map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, background:'var(--surface2)', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface3,var(--surface2))'}
                onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}>
                <div style={{ width:28, height:28, borderRadius:8, background:g.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                  {g.profileImg ? <img src={g.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Trending</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {TRENDING.map(t => (
            <div key={t.tag} style={{ cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>#{t.tag}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{t.posts.toLocaleString()} posts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Who to follow</div>
        {[
          { user:'seasonaltrader', wr:'67%', style:'Swing', color:'#4f46e5' },
          { user:'alpharesearch', wr:'71%', style:'Macro', color:'#0891b2' },
          { user:'graintrader99', wr:'59%', style:'Position', color:'#d97706' },
        ].map(u => (
          <div key={u.user} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {u.user[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.user}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{u.wr} WR · {u.style}</div>
            </div>
            <button style={{ padding:'4px 10px', borderRadius:20, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function GroupsView({ currentUserId }) {
  const [groups, setGroups] = React.useState([]);
  const [openGroup, setOpenGroup] = React.useState(null);
  const [activeChannel, setActiveChannel] = React.useState('general');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef(null);

  const CHANNELS = ['general','trade-ideas','cot-analysis','announcements'];

  React.useEffect(() => {
    const loaded = loadGroups();
    setGroups(loaded);
    const lastId = localStorage.getItem('tr_last_group');
    const def = loaded.find(g => g.id === lastId) || loaded.find(g => g.joined) || loaded[0] || null;
    if (def) setOpenGroup(def);
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchGroup = (g) => {
    setOpenGroup(g);
    setActiveChannel('general');
    setDropdownOpen(false);
    try { localStorage.setItem('tr_last_group', g.id); } catch(e) {}
  };

  const MEMBERS = openGroup
    ? (openGroup.creator === 'you'
        ? [{ name:'you', role:'Founder', color:'#4f46e5' }]
        : [{ name: openGroup.creator || 'Creator', role:'Founder', color:'#16a34a' }, { name:'you', role:'Member', color:'#4f46e5' }])
    : [];

  const roleColor = (role) => role==='Founder' ? '#16a34a' : role==='Co-Leader' ? '#d97706' : 'var(--text-muted)';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* Icon rail */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, overflowX:'auto' }}>
        {groups.length === 0 ? (
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>No groups yet</span>
        ) : groups.map(g => {
          const active = openGroup && openGroup.id === g.id;
          return (
            <div key={g.id} style={{ position:'relative' }} ref={active ? dropdownRef : null}>
              <button
                onClick={() => { if (active) setDropdownOpen(d => !d); else switchGroup(g); }}
                title={g.name}
                style={{ width:40, height:40, borderRadius: active ? 14 : '50%', background:g.grad||PURPLE, border: active ? '2px solid ' + PURPLE : '2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0, overflow:'hidden', transition:'all 0.2s', outline:'none', padding:0 }}
              >
                {g.profileImg ? <img src={g.profileImg} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
              </button>

              {/* Floating dropdown — only for active group */}
              {active && dropdownOpen && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, width:230, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, zIndex:200, overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }}>
                  {/* Group header */}
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:10, background:g.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
                      {g.profileImg ? <img src={g.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{g.name}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{g.type==='club' ? g.members+'/'+(g.max||50)+' members' : (g.members||1)+' members'} · {g.visibility||'open'}</div>
                    </div>
                  </div>
                  {/* Channels */}
                  <div style={{ padding:'8px 8px 4px' }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Channels</div>
                    {CHANNELS.map(ch => (
                      <button key={ch} onClick={() => { setActiveChannel(ch); setDropdownOpen(false); }}
                        style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background: activeChannel===ch ? '#EEEDFE' : 'transparent', color: activeChannel===ch ? '#3C3489' : 'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight: activeChannel===ch ? 600 : 400, cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}
                        onMouseEnter={e => { if(activeChannel!==ch) e.currentTarget.style.background='var(--surface2)'; }}
                        onMouseLeave={e => { if(activeChannel!==ch) e.currentTarget.style.background='transparent'; }}>
                        <span style={{ fontSize:14, color:'var(--text-muted)' }}>#</span> {ch}
                      </button>
                    ))}
                  </div>
                  {/* Members */}
                  <div style={{ padding:'4px 8px 4px', borderTop:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Members</div>
                    {MEMBERS.map(m => (
                      <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8 }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{m.name[0].toUpperCase()}</div>
                        <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>{m.name}</span>
                        <span style={{ fontFamily:'var(--font)', fontSize:10, color:roleColor(m.role), marginLeft:'auto' }}>{m.role}</span>
                      </div>
                    ))}
                  </div>
                  {/* Settings */}
                  <div style={{ padding:'4px 8px 8px', borderTop:'1px solid var(--border)' }}>
                    <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer', textAlign:'left' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                      Group settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add group button */}
        {groups.length > 0 && <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0, margin:'0 2px' }} />}
        <button title="Find groups" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'var(--text-muted)', fontSize:20, fontWeight:300, outline:'none' }}>+</button>
      </div>

      {/* Chat area */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {openGroup ? (
          <GroupChatRoom group={openGroup} activeChannel={activeChannel} onChannelChange={setActiveChannel} />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)' }}>No groups yet</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Create or join a group to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}
'use client'
import { useState, useEffect, useRef } from 'react';
import FeedTab from './FeedTab';
import DMTab from './DMTab';

const PURPLE = '#4f46e5';

// ── Helpers ───────────────────────────────────────────────────────────────────
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
function getColor(name) {
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  return colors[(name||'?').charCodeAt(0) % colors.length];
}
function loadGroups() {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem('tr_groups'); if (!d) return []; return JSON.parse(d).map(g => ({ visibility:'open', country:'', desc:'', profileImg:null, ...g })); } catch(e) { return []; }
}

// ── UserSearch ────────────────────────────────────────────────────────────────
function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/social/leaderboard?search=' + encodeURIComponent(query) + '&limit=8');
        const data = await res.json();
        setResults(data.users || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:320 }}>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = '0 0 0 3px ' + PURPLE + '18'; setOpen(true); }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
        placeholder="Search traders..."
        style={{ width:'100%', padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'all 0.15s' }}
      />
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.2)', zIndex:500, maxHeight:320, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          ) : results.map(u => (
            <div key={u.id} onClick={() => { goToProfile(u.profileSlug || u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:11, color:PURPLE }}>✓</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {u.tradingStyle && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</span>}
                  {u.consistency?.winRate && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)' }}>{Math.round(u.consistency.winRate*100)}% WR</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Inline GroupRoom for the Groups tab ───────────────────────────────────────
function GroupChatRoom({ group, onBack }) {
  const [activeChannel, setActiveChannel] = useState('general');
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomTab, setRoomTab] = useState('chat');
  const endRef = useRef(null);

  const CHANNELS = ['general','trade-ideas','cot-analysis','announcements'];

  useEffect(() => {
    try {
      const d = localStorage.getItem('tr_chat_' + group.id + '_' + activeChannel);
      setMessages(d ? JSON.parse(d) : []);
    } catch { setMessages([]); }
  }, [group.id, activeChannel]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    const newMsg = { id:Date.now(), user:'you', text:msg.trim(), time: new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) };
    const updated = [...messages, newMsg];
    setMessages(updated);
    try { localStorage.setItem('tr_chat_' + group.id + '_' + activeChannel, JSON.stringify(updated)); } catch {}
    setMsg('');
  };

  const MEMBERS = group.creator === 'you'
    ? [{ name:'you', role:'Founder', color:'#4f46e5' }]
    : [
        { name: group.creator || 'Creator', role:'Founder', color:'#16a34a' },
        { name:'you', role:'Member', color:'#4f46e5' },
      ];

  const roleColor = (role) => role==='Founder' ? '#16a34a' : role==='Co-Leader' ? '#d97706' : 'var(--text-muted)';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'var(--bg)' }}>

      {/* Group picker + channel bar */}
      <div style={{ flexShrink:0, background:'var(--surface)', borderBottom:'1px solid var(--border)' }}>
        {/* Back + group name */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ width:28, height:28, borderRadius:8, background:group.grad||PURPLE, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
            {group.profileImg ? <img src={group.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (group.name||'G')[0].toUpperCase()}
          </div>
          <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{group.name}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{group.type === 'club' ? group.members + '/' + (group.max||50) : (group.members||1)} members</span>
        </div>

        {/* Horizontal channel tabs */}
        <div style={{ display:'flex', alignItems:'center', overflowX:'auto', padding:'0 16px' }}>
          {CHANNELS.map(ch => (
            <button key={ch} onClick={() => setActiveChannel(ch)} style={{
              padding:'8px 14px', background:'none', border:'none',
              borderBottom: activeChannel===ch ? '2px solid ' + PURPLE : '2px solid transparent',
              color: activeChannel===ch ? PURPLE : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:12, fontWeight: activeChannel===ch ? 600 : 400,
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1,
              display:'flex', alignItems:'center', gap:4,
            }}>
              # {ch}
            </button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', gap:10, alignItems:'center', paddingLeft:8 }}>
            <button onClick={() => setRoomTab(roomTab==='chat'?'members':'chat')} style={{ background:'none', border:'none', cursor:'pointer', color: roomTab==='members'?PURPLE:'var(--text-muted)', padding:'4px', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </button>
            <button onClick={onBack} title="Settings" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'4px', display:'flex', alignItems:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat + members */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Messages */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages in #{activeChannel} yet. Say hello!</div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display:'flex', gap:10, flexDirection:'row', alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:getColor(m.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {(m.user||'?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.time}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{m.text}</div>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {/* Input */}
          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px' }}>
              <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }} placeholder={'Message #' + activeChannel}
                style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
              <button onClick={send} disabled={!msg.trim()} style={{ width:30, height:30, borderRadius:8, background:msg.trim()?PURPLE:'var(--surface3)', color:'#fff', border:'none', cursor:msg.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Members panel */}
        {roomTab === 'members' && (
          <div style={{ width:180, borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'12px' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Members</div>
            {MEMBERS.map(m => (
              <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {m.name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:roleColor(m.role) }}>{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


// ── Main CommunityLayout ──────────────────────────────────────────────────────
export default function CommunityLayout({ currentUserId }) {
  const [tab, setTab] = useState('feed');
  const [feedTab, setFeedTab] = useState('Discover');
  const containerRef = useRef(null);
  const [topOffset, setTopOffset] = useState(120);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTopOffset(Math.round(rect.top));
    }
  }, []);

  const h = 'calc(100vh - ' + topOffset + 'px)';

  return (
    <div ref={containerRef} style={{ display:'flex', flexDirection:'column', height:h, fontFamily:'var(--font)', overflow:'hidden' }}>
      {/* top nav - option 2 style */}
      <div style={{ background:'#4f46e5', padding:'0 20px', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', gap:0 }}>
          {[['feed','Feed'],['groups','Groups'],['dms','Messages']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding:'11px 20px', background:'none', border:'none',
              borderBottom: tab===t ? '2px solid #fff' : '2px solid transparent',
              color: tab===t ? '#fff' : 'rgba(255,255,255,0.6)',
              fontFamily:'var(--font)', fontSize:13, fontWeight: tab===t ? 600 : 400,
              cursor:'pointer', transition:'all 0.15s', marginBottom:-1,
            }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, color:'rgba(255,255,255,0.7)' }}>
          {tab === 'feed' && <UserSearch />}
          <svg width='17' height='17' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' style={{ cursor:'pointer', flexShrink:0 }}><path d='M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'/><path d='M13.73 21a2 2 0 0 1-3.46 0'/></svg>
        </div>
      </div>
      {/* feed sub-tabs (only on feed view) */}
      {tab === 'feed' && (
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'stretch', overflowX:'auto' }}>
          {[
            { key:'Discover', icon:'trending-up' },
            { key:'Following', icon:'users' },
            { key:'Ideas', icon:null },
            { key:'Screeners', icon:null },
            { key:'Strategies', icon:null },
            { key:'COT Signals', icon:null },
          ].map(({ key: ft, icon }) => (
            <button key={ft} onClick={() => setFeedTab(ft)} style={{
              padding:'10px 16px', background:'none', border:'none',
              borderBottom: feedTab===ft ? '2px solid #4f46e5' : '2px solid transparent',
              color: feedTab===ft ? '#4f46e5' : 'var(--text-muted)',
              fontFamily:'var(--font)', fontSize:13, fontWeight: feedTab===ft ? 600 : 400,
              cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1,
              display:'flex', alignItems:'center', gap:6,
            }}>
              {icon && <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>{icon==='trending-up' ? <><polyline points='23 6 13.5 15.5 8.5 10.5 1 18'/><polyline points='17 6 23 6 23 12'/></> : <><path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M23 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/></>}</svg>}
              {ft}
            </button>
          ))}
        </div>
      )}


      {/* ── Tab content ── */}
      <div style={{ flex:1, overflow:'hidden', display:'flex' }}>

        {/* FEED */}
        {tab === 'feed' && (
          <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
            {/* Main feed */}
            <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
              <FeedTab currentUserId={currentUserId} activeTab={feedTab} />
            </div>
            {/* Right sidebar */}
            <div style={{ width:220, borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'16px 14px', flexShrink:0 }}>
              <RightSidebar />
            </div>
          </div>
        )}

        {/* GROUPS */}
        {tab === 'groups' && (
          <div style={{ flex:1, overflow:'hidden' }}>
            <GroupsView currentUserId={currentUserId} />
          </div>
        )}

        {/* MESSAGES */}
        {tab === 'dms' && (
          <div style={{ flex:1, overflow:'hidden' }}>
            <DMTab />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Right sidebar (feed view) ─────────────────────────────────────────────────
function RightSidebar() {
  const [groups, setGroups] = useState([]);
  useEffect(() => { setGroups(loadGroups().slice(0, 3)); }, []);

  const TRENDING = [
    { tag:'GoldCOT', posts:2847 },
    { tag:'FOMC', posts:1204 },
    { tag:'EURUSD', posts:892 },
    { tag:'CrudeOil', posts:744 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Active groups */}
      {groups.length > 0 && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Your Groups</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {groups.map(g => (
              <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, background:'var(--surface2)', cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface3,var(--surface2))'}
                onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}>
                <div style={{ width:28, height:28, borderRadius:8, background:g.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                  {g.profileImg ? <img src={g.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Trending</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {TRENDING.map(t => (
            <div key={t.tag} style={{ cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>#{t.tag}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{t.posts.toLocaleString()} posts</div>
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Who to follow</div>
        {[
          { user:'seasonaltrader', wr:'67%', style:'Swing', color:'#4f46e5' },
          { user:'alpharesearch', wr:'71%', style:'Macro', color:'#0891b2' },
          { user:'graintrader99', wr:'59%', style:'Position', color:'#d97706' },
        ].map(u => (
          <div key={u.user} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {u.user[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.user}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{u.wr} WR · {u.style}</div>
            </div>
            <button style={{ padding:'4px 10px', borderRadius:20, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
}
function GroupsView({ currentUserId }) {
  const [groups, setGroups] = useState([]);
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    const loaded = loadGroups();
    setGroups(loaded);
    const lastId = localStorage.getItem('tr_last_group');
    const def = loaded.find(g => g.id === lastId) || loaded.find(g => g.joined) || loaded[0] || null;
    if (def) setOpenGroup(def);
  }, []);

  const switchGroup = (g) => {
    setOpenGroup(g);
    try { localStorage.setItem('tr_last_group', g.id); } catch(e) {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>

      {/* ── Group icon rail across top ── */}
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 12px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, overflowX:'auto' }}>
        {groups.length === 0 ? (
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>No groups yet — create one!</span>
        ) : groups.map(g => {
          const active = openGroup && openGroup.id === g.id;
          return (
            <button key={g.id} onClick={() => switchGroup(g)} title={g.name} style={{
              width:40, height:40, borderRadius: active ? 14 : '50%',
              background: g.grad || PURPLE,
              border: active ? '2px solid ' + PURPLE : '2px solid transparent',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:15, fontWeight:700, color:'#fff',
              cursor:'pointer', flexShrink:0, overflow:'hidden',
              transition:'all 0.2s', outline:'none',
            }}>
              {g.profileImg
                ? <img src={g.profileImg} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : (g.name||'G')[0].toUpperCase()
              }
            </button>
          );
        })}
        {/* Divider + add group button */}
        {groups.length > 0 && <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0, margin:'0 2px' }} />}
        <button title="Find groups" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'var(--text-muted)', fontSize:20, fontWeight:300 }}>
          +
        </button>
      </div>

      {/* ── Group chat or empty state ── */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {openGroup ? (
          <GroupChatRoom
            group={groups.find(g => g.id === openGroup.id) || openGroup}
            onBack={() => setOpenGroup(null)}
            onSwitch={switchGroup}
          />
        ) : (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
            <div style={{ fontSize:36 }}>💬</div>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)' }}>No groups yet</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Create or join a group to get started.</div>
          </div>
        )}
      </div>
    </div>
  );
}


