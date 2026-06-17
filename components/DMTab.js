'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';

const PURPLE = '#4f46e5';

const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
function getColor(name) { return COLORS[(name||'?').charCodeAt(0) % COLORS.length]; }

function Avatar({ letter, size=36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:getColor(letter), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:size*0.38, fontWeight:700, color:'#fff', flexShrink:0 }}>
      {(letter||'?')[0].toUpperCase()}
    </div>
  );
}

// Groups a flat list of DirectMessage rows into per-conversation threads keyed by the
// other participant's user id. myId is required to know which side of each row is "them".
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
    convos.push({
      otherId,
      displayName: info.displayName || 'Unknown user',
      messages: msgs,
    });
  }
  convos.sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt || '';
    const bLast = b.messages[b.messages.length - 1]?.createdAt || '';
    return aLast < bLast ? 1 : -1;
  });
  return convos;
}

export default function DMTab({ initialUser }) {
  const [myId, setMyId] = useState(null);
  const [convos, setConvos] = useState([]);
  const [userDirectory, setUserDirectory] = useState({}); // userId -> {displayName, username, verifiedBadge}
  const [activeId, setActiveId] = useState(null); // otherUserId of the open thread
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
  const searchDebounceRef = useRef(null);

  // Loads all messages involving the current user, resolves the other participants'
  // display names, and groups everything into threads.
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

      const idSet = new Set();
      rows.forEach(m => { idSet.add(m.fromUserId); idSet.add(m.toUserId); });

      let directory = {};
      if (idSet.size > 0) {
        const dirRes = await fetch(`/api/users/lookup?ids=${[...idSet].join(',')}`);
        if (dirRes.ok) {
          const dirData = await dirRes.json();
          directory = dirData.users || {};
        }
      }
      setUserDirectory(directory);
      setConvos(groupIntoConvos(rows, me.id, directory));

      if (initialUser) setActiveId(initialUser); // initialUser is expected to be a real userId
    } catch (e) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [initialUser]);

  useEffect(() => { loadConvos(); }, [loadConvos]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [activeId, convos]);

  // Expose global so other components (e.g. FeedTab) can open a DM by real user id.
  useEffect(() => {
    window.__openDM = (userId) => { setActiveId(userId); };
    return () => { delete window.__openDM; };
  }, []);

  // Debounced live search against the real User table instead of accepting raw text.
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(res.ok ? (data.users || []) : []);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
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
    try {
      const res = await fetch('/api/social/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: activeId, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setConvos(prev => prev.map(c => c.otherId === activeId
        ? { ...c, messages: [...c.messages, data.message] }
        : c));
    } catch (e) {
      setError(e.message || 'Failed to send message');
      setMsgText(text); // restore so the user doesn't lose what they typed
    } finally {
      setSending(false);
    }
  };

  const deleteConvo = async (otherId) => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/social/messages?with=${otherId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      setConvos(prev => prev.filter(c => c.otherId !== otherId));
      if (activeId === otherId) setActiveId(null);
    } catch (e) {
      setError(e.message || 'Failed to delete conversation');
    }
  };

  const lastMsg = (convo) => {
    if (!convo.messages.length) return 'No messages yet';
    const m = convo.messages[convo.messages.length-1];
    const mine = myId !== null && m.fromUserId === myId;
    return (mine ? 'You: ' : '') + m.content;
  };

  return (
    <div style={{ display:'flex', height:'100%', fontFamily:'var(--font)' }}>
      <div style={{ width:'100%', display:'flex', flexDirection:'column', height:'100%' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ marginBottom:10 }}>
            <input
              value={dmSearch}
              onChange={e => setDmSearch(e.target.value)}
              placeholder="Search conversations..."
              style={{ width:'100%', padding:'8px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: showNew?10:0 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>Messages</span>
            <button onClick={() => setShowNew(s=>!s)} style={{ padding:'4px 10px', borderRadius:6, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>+ New</button>
          </div>
          {showNew && (
            <div style={{ position:'relative' }}>
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                autoFocus
                style={{ width:'100%', padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box' }}
              />
              {searchQuery.trim() && (
                <div style={{ marginTop:6, border:'1px solid var(--border)', borderRadius:8, maxHeight:200, overflowY:'auto', background:'var(--surface)' }}>
                  {searching ? (
                    <div style={{ padding:10, fontSize:12, color:'var(--text-muted)' }}>Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding:10, fontSize:12, color:'var(--text-muted)' }}>No users found.</div>
                  ) : searchResults.map(u => (
                    <div key={u.id} onClick={() => startConvoWith(u)}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <Avatar letter={u.displayName} size={26} />
                      <span style={{ fontSize:12, color:'var(--text)' }}>{u.displayName}</span>
                      {u.verifiedBadge && <span style={{ fontSize:10, color:PURPLE }}>✓ Verified</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding:'8px 14px', fontSize:12, color:'#dc2626', background:'#fef2f2' }}>{error}</div>
        )}

        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'var(--text-muted)' }}>Loading...</div>
        ) : convos.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20, gap:8 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No messages yet. Click "+ New" to start a conversation with a real user.</div>
          </div>
        ) : (
          <div style={{ flex:1, overflowY:'auto' }}>
            {convos.filter(c => !dmSearch.trim() || c.displayName.toLowerCase().includes(dmSearch.toLowerCase())).map(c => (
              <div key={c.otherId} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', background: activeId===c.otherId ? 'var(--accent-bg)' : 'transparent' }}>
                <div onClick={() => setActiveId(c.otherId)} style={{ display:'flex', alignItems:'center', gap:10, flex:1, minWidth:0 }}>
                  <Avatar letter={c.displayName} size={38} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: activeId===c.otherId?PURPLE:'var(--text)' }}>{c.displayName}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{lastMsg(c)}</div>
                  </div>
                </div>
                <button onClick={() => deleteConvo(c.otherId)} title="Delete conversation"
                  style={{ border:'none', background:'transparent', color:'var(--text-muted)', cursor:'pointer', fontSize:14, padding:4 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {activeConvo && (
          <div style={{ borderTop:'2px solid var(--border)', padding:'10px 14px', display:'flex', gap:8, flexShrink:0 }}>
            <input
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
              placeholder={`Message ${activeConvo.displayName}...`}
              disabled={sending}
              style={{ flex:1, padding:'8px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }}
            />
            <button onClick={sendMsg} disabled={sending || !msgText.trim()} style={{ padding:'8px 16px', borderRadius:20, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', opacity: sending?0.6:1 }}>Send</button>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
