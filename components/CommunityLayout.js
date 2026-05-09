'use client'
import { useState, useEffect, useRef } from 'react';
import FeedTab from './FeedTab';
import GroupsTab from './GroupsTab';
import DMTab from './DMTab';

const PURPLE = '#4f46e5';

function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}

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
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search traders..."
        style={{ width:'100%', padding:'9px 14px 9px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'all 0.15s' }}
        onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = '0 0 0 3px ' + PURPLE + '18'; setOpen(true); }}
        onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.2)', zIndex:500, maxHeight:340, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          ) : results.length === 0 ? (
            <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          ) : results.map(u => (
            <div key={u.id}
              onClick={() => { goToProfile(u.profileSlug || u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                  {u.verifiedBadge && <span style={{ fontSize:11, color:PURPLE, fontWeight:700 }}>✓</span>}
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {u.tradingStyle && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', textTransform:'capitalize' }}>{u.tradingStyle}</span>}
                  {u.consistency?.winRate && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--green)' }}>{Math.round(u.consistency.winRate*100)}% WR</span>}
                </div>
              </div>
              <span style={{ fontSize:13, color:'var(--text-muted)' }}>→</span>
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
    <input
      value={query}
      onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
      placeholder="Search groups..."
      style={{ width:'100%', padding:'9px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box', transition:'all 0.15s' }}
      onFocus={e => { e.target.style.borderColor = PURPLE; e.target.style.boxShadow = '0 0 0 3px ' + PURPLE + '18'; }}
      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
    />
  );
}

export default function CommunityLayout({ currentUserId }) {
  const [groupMode, setGroupMode] = useState('discover');
  const [groupSearch, setGroupSearch] = useState('');
  // Use a ref to measure the actual top offset after mount
  const containerRef = useRef(null);
  const [topOffset, setTopOffset] = useState(120);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTopOffset(rect.top);
    }
  }, []);

  const colHeight = `calc(100vh - ${topOffset}px)`;

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        height: colHeight,
        fontFamily: 'var(--font)',
        // Pull out of parent padding completely
        margin: '0',
        marginTop: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT: Groups panel ── */}
      <div style={{
        width: '36%',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Sticky header */}
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg)' }}>
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {[['discover','Groups'],['mine','My Groups'],['dms','Messages']].map(([mode,label]) => (
              <button key={mode} onClick={() => setGroupMode(mode)} style={{
                flex:1, padding:'7px 4px', borderRadius:10,
                border: groupMode===mode ? 'none' : '1px solid var(--border)',
                background: groupMode===mode ? PURPLE : 'transparent',
                color: groupMode===mode ? '#fff' : 'var(--text-muted)',
                fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer',
                transition:'all 0.15s', whiteSpace:'nowrap',
              }}>{label}</button>
            ))}
          </div>
          {groupMode !== 'dms' && <GroupSearch onSearch={setGroupSearch} />}
        </div>
        {/* Scrollable groups list — isolated */}
        <div style={{ flex:1, minHeight:0, overflowY:'scroll', overflowX:'hidden' }}>
          {groupMode === 'dms'
            ? <DMTab />
            : <GroupsTab currentUserId={currentUserId} searchQuery={groupSearch} mode={groupMode} />}
        </div>
      </div>

      {/* ── RIGHT: Feed panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        {/* Sticky header */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg)' }}>
          <UserSearch />
        </div>
        {/* Scrollable feed — isolated */}
        <div style={{ flex:1, minHeight:0, overflowY:'scroll', overflowX:'hidden' }}>
          <FeedTab currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
