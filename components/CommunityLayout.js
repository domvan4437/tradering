'use client'
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) {
    window.__goToProfile(slug);
  }
}
import { useState, useEffect, useRef } from 'react';
import FeedTab from './FeedTab';
import GroupsTab from './GroupsTab';

const PURPLE = '#4f46e5';

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

  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  const getColor = (name) => colors[(name||'?').charCodeAt(0) % colors.length];

  return (
    <div ref={ref} style={{ position:'relative', flex:1 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search traders..."
          style={{ width:'100%', padding:'8px 12px 8px 32px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
          onMouseEnter={e=>e.target.style.borderColor=PURPLE}
          onMouseLeave={e=>{ if(document.activeElement!==e.target) e.target.style.borderColor='var(--border)'; }}
        />
      </div>
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', zIndex:300, maxHeight:320, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:'16px', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding:'16px', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          ) : results.map(u => (
            <div key={u.id}
              onClick={() => { goToProfile(u.profileSlug || u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:10, color:PURPLE, fontWeight:700, flexShrink:0 }}>✓</span>}
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {u.tradingStyle && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</span>}
                  {u.consistency?.winRate && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)' }}>{Math.round(u.consistency.winRate*100)}% WR</span>}
                </div>
              </div>
              <span style={{ fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>→</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupSearch({ onSearch }) {
  const [query, setQuery] = useState('');
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'var(--text-muted)', pointerEvents:'none' }}>🔍</span>
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
        placeholder="Search groups..."
        style={{ width:'100%', padding:'7px 12px 7px 30px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' }}
        onFocus={e=>e.target.style.borderColor=PURPLE}
        onBlur={e=>e.target.style.borderColor='var(--border)'}
      />
    </div>
  );
}

export default function CommunityLayout({ currentUserId }) {
  const [groupMode, setGroupMode] = useState('discover');
  const [groupSearch, setGroupSearch] = useState('');

  return (
    <div style={{ display:'flex', height:'calc(100vh - 100px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      {/* Left — Groups panel */}
      <div style={{ width:'38%', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Group tabs + search */}
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setGroupMode('discover')} style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background: groupMode==='discover'?PURPLE:'var(--surface2)', color: groupMode==='discover'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Discover</button>
            <button onClick={() => setGroupMode('mine')} style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background: groupMode==='mine'?PURPLE:'var(--surface2)', color: groupMode==='mine'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>My Groups</button>
          </div>
          <GroupSearch onSearch={setGroupSearch} />
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          <GroupsTab currentUserId={currentUserId} searchQuery={groupSearch} />
        </div>
      </div>

      {/* Right — Feed panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* User search bar above feed */}
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'center', gap:10 }}>
          <UserSearch />
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          <FeedTab currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
