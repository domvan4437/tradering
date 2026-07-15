'use client'
import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { UserAvatarContext } from './UserAvatarContext';

function goToProfile(id) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(id);
}

const PURPLE = '#4f46e5';
const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
function getColor(name) { return COLORS[(name||'?').charCodeAt(0) % COLORS.length]; }

const INVITE_PREFIX = '__CONTEST_INVITE__';
function parseContestInvite(content) {
  if (!content?.startsWith(INVITE_PREFIX)) return null;
  try { return JSON.parse(content.slice(INVITE_PREFIX.length)); } catch { return null; }
}

function ContestInviteCard({ invite, isMe }) {
  const [joined, setJoined] = React.useState(false);
  const [joining, setJoining] = React.useState(false);

  const handleJoin = async () => {
    if (joined || joining) return;
    setJoining(true);
    try {
      const res = await fetch('/api/group-contests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId: invite.id }) });
      if (res.ok) setJoined(true);
    } catch {}
    setJoining(false);
  };

  return (
    <div style={{ maxWidth: 280, width: '100%' }}>
      <div style={{
        background: 'var(--surface)', border: '1.5px solid #534AB7', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 4px 16px rgba(83,74,183,0.15)',
      }}>
        <div style={{ background: 'linear-gradient(135deg, #534AB7, #7c3aed)', padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contest Invite</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{invite.name}</div>
          </div>
        </div>
        <div style={{ padding: '10px 14px 12px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Asset</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.asset || 'Any'}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Entry</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.buyIn > 0 ? `$${invite.buyIn}` : 'Free'}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Members</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.memberCount || 1}</div>
            </div>
          </div>
          <button
            onClick={handleJoin}
            disabled={joined || joining}
            style={{
              width: '100%', padding: '9px', border: 'none', borderRadius: 9,
              background: joined ? '#16a34a' : joining ? 'var(--surface3)' : '#534AB7',
              color: joined || joining ? (joined ? '#fff' : 'var(--text-muted)') : '#fff',
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: joined || joining ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {joined ? '✓ Joined!' : joining ? 'Joining…' : 'Join Contest'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ letter, size=36, imageUrl }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:imageUrl?'transparent':getColor(letter||'?'), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
      {imageUrl
        ? <img src={imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : (letter||'?')[0].toUpperCase()}
    </div>
  );
}

function groupIntoConvos(rows, myId, userDirectory) {
  const byOther = new Map();
  for (const m of rows) {
    const otherId = m.fromUserId === myId ? m.toUserId : m.fromUserId;
    if (!byOther.has(otherId)) byOther.set(otherId, []);
    byOther.get(otherId).push(m);
  }
  const convos = [];
  for (const [otherId, msgs] of byOther.entries()) {
    msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const info = userDirectory[otherId] || {};
    convos.push({ otherId, displayName: info.displayName || 'Unknown user', image: info.image || null, messages: msgs });
  }
  convos.sort((a, b) => {
    const aLast = a.messages[a.messages.length-1]?.createdAt || '';
    const bLast = b.messages[b.messages.length-1]?.createdAt || '';
    return aLast < bLast ? 1 : -1;
  });
  return convos;
}

function fmt(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const secs = Math.floor((now - d) / 1000);
  if (secs < 60) return 'now';
  if (secs < 3600) return Math.floor(secs/60)+'m';
  if (secs < 86400) return Math.floor(secs/3600)+'h';
  return d.toLocaleDateString([], { month:'short', day:'numeric' });
}

export default function DMTab({ initialUser }) {
  const myAvatar = useContext(UserAvatarContext);
  const [myId, setMyId] = useState(null);
  const [convos, setConvos] = useState([]);
  const [userDirectory, setUserDirectory] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dmSearch, setDmSearch] = useState('');
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const loadConvos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const meRes = await fetch('/api/user');
      const me = await meRes.json();
      if (!meRes.ok || !me.id) throw new Error('Could not load your session');
      setMyId(me.id);

      const res = await fetch('/api/social/messages');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load messages');
      const rows = data.messages || [];

      // Build directory from included user objects
      const directory = {};
      for (const m of rows) {
        if (m.fromUser) directory[m.fromUser.id] = m.fromUser;
        if (m.toUser)   directory[m.toUser.id]   = m.toUser;
      }
      // Fallback: batch lookup for any missing ids
      const idSet = new Set(rows.flatMap(m => [m.fromUserId, m.toUserId]));
      const missing = [...idSet].filter(id => !directory[id]);
      if (missing.length) {
        const dirRes = await fetch(`/api/users/lookup?ids=${missing.join(',')}`);
        if (dirRes.ok) { const d = await dirRes.json(); Object.assign(directory, d.users || {}); }
      }
      setUserDirectory(directory);
      setConvos(groupIntoConvos(rows, me.id, directory));
      if (initialUser) setActiveId(initialUser);
    } catch (e) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [initialUser]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [activeId, convos]);

  useEffect(() => {
    if (activeId) setTimeout(() => inputRef.current?.focus(), 50);
  }, [activeId]);

  useEffect(() => {
    window.__openDM = (userId) => setActiveId(userId);
    return () => { delete window.__openDM; };
  }, []);

  // Debounced user search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(res.ok ? (data.users || []) : []);
      } catch { setSearchResults([]); }
      setSearching(false);
    }, 300);
  }, [searchQuery]);

  const activeConvo = convos.find(c => c.otherId === activeId);

  const startConvoWith = (user) => {
    setUserDirectory(prev => ({ ...prev, [user.id]: user }));
    if (!convos.find(c => c.otherId === user.id)) {
      setConvos(prev => [{ otherId: user.id, displayName: user.displayName, messages: [] }, ...prev]);
    }
    setActiveId(user.id);
    setShowNew(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const sendMsg = async () => {
    const text = msgText.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setMsgText('');
    const optimistic = { id: 'tmp_'+Date.now(), fromUserId: myId, toUserId: activeId, content: text, createdAt: new Date().toISOString() };
    setConvos(prev => prev.map(c => c.otherId === activeId ? { ...c, messages: [...c.messages, optimistic] } : c));
    try {
      const res = await fetch('/api/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeId, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      // Replace optimistic with real
      setConvos(prev => prev.map(c => c.otherId === activeId
        ? { ...c, messages: c.messages.map(m => m.id === optimistic.id ? data.message : m) }
        : c));
    } catch (e) {
      setError(e.message || 'Failed to send');
      setMsgText(text);
      setConvos(prev => prev.map(c => c.otherId === activeId
        ? { ...c, messages: c.messages.filter(m => m.id !== optimistic.id) }
        : c));
    } finally {
      setSending(false);
    }
  };

  const deleteConvo = async (otherId) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await fetch(`/api/social/messages?with=${otherId}`, { method: 'DELETE' });
      setConvos(prev => prev.filter(c => c.otherId !== otherId));
      if (activeId === otherId) setActiveId(null);
    } catch (e) { setError('Failed to delete'); }
  };

  const lastMsg = (convo) => {
    if (!convo.messages.length) return 'No messages yet';
    const m = convo.messages[convo.messages.length-1];
    return (m.fromUserId === myId ? 'You: ' : '') + m.content;
  };

  const filtered = convos.filter(c => !dmSearch.trim() || c.displayName.toLowerCase().includes(dmSearch.toLowerCase()));

  // ── Conversation thread view ──────────────────────────────────
  if (activeId) {
    const convo = activeConvo || { otherId: activeId, displayName: userDirectory[activeId]?.displayName || 'Unknown', messages: [] };
    return (
      <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--surface)' }}>
          <button onClick={() => setActiveId(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, padding:'0 4px', display:'flex', alignItems:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div onClick={() => goToProfile(convo.otherId)} style={{ cursor:'pointer' }}><Avatar letter={convo.displayName} size={32} imageUrl={convo.image} /></div>
          <span onClick={() => goToProfile(convo.otherId)} style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', cursor:'pointer' }}>{convo.displayName}</span>
          <div style={{ flex:1 }} />
          <button onClick={() => deleteConvo(activeId)} title="Delete conversation" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:4 }}
            onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>

        {error && <div style={{ padding:'6px 14px', fontSize:12, color:'#dc2626', background:'#fef2f2', flexShrink:0 }}>{error}<button onClick={()=>setError('')} style={{marginLeft:8,background:'none',border:'none',cursor:'pointer',color:'#dc2626'}}>×</button></div>}

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:4 }}>
          {convo.messages.length === 0 && (
            <div style={{ margin:'auto', textAlign:'center', color:'var(--text-muted)', fontSize:13 }}>
              No messages yet. Say hi to {convo.displayName}!
            </div>
          )}
          {convo.messages.map((m, i) => {
            const isMe = m.fromUserId === myId;
            const showName = !isMe && (i === 0 || convo.messages[i-1]?.fromUserId !== m.fromUserId);
            const invite = parseContestInvite(m.content);
            return (
              <div key={m.id} style={{ display:'flex', flexDirection:'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom:2 }}>
                {showName && <span style={{ fontSize:11, color:'var(--text-muted)', marginBottom:2, marginLeft:4 }}>{convo.displayName}</span>}
                {invite ? (
                  <ContestInviteCard invite={invite} isMe={isMe} />
                ) : (
                  <div style={{
                    maxWidth:'72%', padding:'9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMe ? PURPLE : 'var(--surface2)',
                    color: isMe ? '#fff' : 'var(--text)',
                    fontFamily:'var(--font)', fontSize:13, lineHeight:1.5,
                    border: isMe ? 'none' : '1px solid var(--border)',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                )}
                <span style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, marginLeft:4, marginRight:4 }}>{fmt(m.createdAt)}</span>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'2px solid #534AB7', borderRadius:14, padding:'10px 14px', boxShadow:'0 2px 12px rgba(83,74,183,0.18)' }}>
            <input
              ref={inputRef}
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder={`Message ${convo.displayName}...`}
              disabled={sending}
              style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', caretColor:'#534AB7' }}
            />
            <button onClick={sendMsg} disabled={sending || !msgText.trim()}
              style={{ width:30, height:30, borderRadius:8, background: msgText.trim() ? PURPLE : 'rgba(83,74,183,0.3)', color:'#fff', border:'none', cursor: msgText.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity: sending ? 0.6 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Conversation list view ────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font)' }}>
      {/* Header */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>Messages</span>
          <button onClick={() => setShowNew(s => !s)}
            style={{ padding:'5px 12px', borderRadius:8, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            + New
          </button>
        </div>

        {/* New message search */}
        {showNew && (
          <div style={{ marginBottom:8 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              autoFocus
              style={{ width:'100%', padding:'8px 12px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }}
            />
            {searchQuery.trim() && (
              <div style={{ marginTop:4, border:'1px solid var(--border)', borderRadius:10, maxHeight:220, overflowY:'auto', background:'var(--surface)', boxShadow:'0 4px 16px rgba(0,0,0,0.15)' }}>
                {searching ? (
                  <div style={{ padding:12, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding:12, fontSize:12, color:'var(--text-muted)', textAlign:'center' }}>No users found for "{searchQuery}"</div>
                ) : searchResults.map(u => (
                  <div key={u.id} onClick={() => startConvoWith(u)}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <Avatar letter={u.displayName} size={30} imageUrl={u.image} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName}</div>
                      {u.username && <div style={{ fontSize:11, color:'var(--text-muted)' }}>@{u.username}</div>}
                    </div>
                    {u.verifiedBadge && <span style={{ marginLeft:'auto', fontSize:10, color:PURPLE }}>✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filter existing convos */}
        <input
          value={dmSearch}
          onChange={e => setDmSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{ width:'100%', padding:'7px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }}
        />
      </div>

      {error && <div style={{ padding:'6px 14px', fontSize:12, color:'#dc2626', background:'#fef2f2', flexShrink:0 }}>{error}<button onClick={()=>setError('')} style={{marginLeft:8,background:'none',border:'none',cursor:'pointer',color:'#dc2626'}}>×</button></div>}

      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--text-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:20, color:'var(--text-muted)', fontSize:13, textAlign:'center' }}>
          {dmSearch ? 'No conversations match.' : 'No messages yet.\nClick "+ New" to message a trader.'}
        </div>
      ) : (
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.map(c => (
            <div key={c.otherId}
              onClick={() => setActiveId(c.otherId)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', background:'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div onClick={e => { e.stopPropagation(); goToProfile(c.otherId); }} style={{ cursor:'pointer', flexShrink:0 }}><Avatar letter={c.displayName} size={40} imageUrl={c.image} /></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{c.displayName}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lastMsg(c)}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
                <span style={{ fontSize:10, color:'var(--text-muted)' }}>{fmt(c.messages[c.messages.length-1]?.createdAt)}</span>
                <button onClick={e => { e.stopPropagation(); deleteConvo(c.otherId); }}
                  title="Delete" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:2, lineHeight:1 }}
                  onMouseEnter={e => e.currentTarget.style.color='#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
