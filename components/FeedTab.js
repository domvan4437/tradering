'use client';
import { useState, useRef } from 'react';

const MOCK_POSTS = [
  {
    id: 1,
    user: 'commodityking', handle: '@commodityking', verified: true,
    avatar: 'C', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
    time: '2h', style: 'Swing',
    body: 'Gold commercials hit the 82nd percentile this week — highest reading since October 2023. Combined with the April seasonal tailwind and price coiling above 4,820 support, this is a high-conviction long setup. Entry above 4,820, stop 4,750, target 5,000+.',
    tags: ['GoldCOT', 'Commodities'],
    tradeTag: { dir: 'Long', asset: 'Gold', sym: 'GC=F', cot: 82, target: '+4.7%', up: true },
    likes: 142, comments: 31, reposts: 14, views: 2400, liked: false, reposted: false,
    images: 2,
  },
  {
    id: 2,
    user: 'cotmaster', handle: '@cotmaster', verified: true,
    avatar: 'C', grad: 'linear-gradient(135deg,#0891b2,#0e7490)',
    time: '3h', style: 'Position',
    repostedBy: 'fxpro_trader',
    body: 'COT Extreme Setup screener just flagged 3 assets simultaneously. Last time this happened was November 2023 — preceded a 12% rally in Gold. Running the same filters now. Screener is public and free to fork.',
    tags: ['COT', 'Screener'],
    screener: { name: 'COT Extreme Setup', desc: 'Flags when commercial positioning hits 80th+ percentile AND seasonal score exceeds 70. Currently flagging 3 assets.', uses: 847, forks: 124 },
    likes: 203, comments: 18, reposts: 89, views: 5100, liked: false, reposted: false,
  },
  {
    id: 3,
    user: 'energydesk', handle: '@energy_desk', verified: false,
    avatar: 'E', grad: 'linear-gradient(135deg,#ef4444,#dc2626)',
    time: '4h', style: 'Position',
    body: 'Crude just rejected the 200-day MA for the second time this month. EIA inventory build was massive. COT commercials are net short at the 31st percentile. Monthly seasonal is bearish through May. Four confluences lining up — this is the setup.',
    tags: ['CrudeOil', 'OOTT'],
    tradeTag: { dir: 'Short', asset: 'Crude Oil', sym: 'CL=F', cot: 31, target: '-6.2%', up: false },
    likes: 76, comments: 22, reposts: 8, views: 1800, liked: false, reposted: false,
  },
  {
    id: 4,
    user: 'fxpro_trader', handle: '@fxpro_trader', verified: false,
    avatar: 'F', grad: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    time: '5h', style: 'Day Trader',
    body: 'DXY bouncing off major support while EUR/USD rejected 1.0850 resistance cleanly. COT shows large specs reducing longs for the 3rd consecutive week. Targeting 1.0750 on the break.',
    tags: ['EURUSD', 'Forex'],
    tradeTag: { dir: 'Short', asset: 'EUR/USD', sym: 'EURUSD=X', cot: 28, target: '-0.85%', up: false },
    likes: 89, comments: 18, reposts: 11, views: 3200, liked: false, reposted: false,
  },
];

const TRENDING = [
  { tag: 'GoldCOT',    cat: 'Commodities', posts: 2847 },
  { tag: 'FOMC',       cat: 'Futures',     posts: 1204 },
  { tag: 'EURUSD',     cat: 'Forex',       posts: 892  },
  { tag: 'CrudeOil',   cat: 'Energy',      posts: 744  },
  { tag: 'NatGas',     cat: 'Energy',      posts: 381  },
];

const WHO_TO_FOLLOW = [
  { user: 'seasonaltrader', verified: true,  grad: 'linear-gradient(135deg,#16a34a,#15803d)', avatar: 'S', style: 'Swing',    winRate: '67%' },
  { user: 'alpharesearch',  verified: true,  grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', avatar: 'A', style: 'Macro',    winRate: '71%' },
  { user: 'graintrader99',  verified: false, grad: 'linear-gradient(135deg,#d97706,#b45309)', avatar: 'G', style: 'Position', winRate: '59%' },
];

const MARKET_TAGS = [
  { label: 'Metals',  bg: '#FFF7ED', color: '#92400e' },
  { label: 'Energy',  bg: '#FEF3C7', color: '#78350f' },
  { label: 'Forex',   bg: '#EFF6FF', color: '#1e40af' },
  { label: 'Grains',  bg: '#F0FDF4', color: '#166534' },
  { label: 'Futures', bg: '#EEF2FF', color: '#3730a3' },
  { label: 'Crypto',  bg: '#FFFBEB', color: '#92400e' },
];

function Avatar({ letter, grad, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font)', fontSize: size * 0.35, fontWeight: 700,
      color: '#fff', flexShrink: 0,
    }}>{letter}</div>
  );
}

function ActionBar({ post, onLike, onRepost, onDelete }) {
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n;
  const [showMenu, setShowMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const isOwn = post.user === 'dominicvansaghi';

  const addComment = () => {
    if(!comment.trim()) return;
    setComments(p => [...p, { id: Date.now(), user: 'you', text: comment, time: 'now' }]);
    setComment('');
  };

  const btnBase = {
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', borderRadius: 20,
    fontFamily: 'var(--font)', fontSize: 13,
    transition: 'all 0.15s',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, marginLeft: -10 }}>
        <button style={{ ...btnBase, color: 'var(--text-muted)' }}
          onClick={() => setShowComments(!showComments)}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>{fmt(post.comments + comments.length)}</span>
        </button>
        <button style={{ ...btnBase, color: post.reposted ? '#16a34a' : 'var(--text-muted)' }}
          onClick={() => onRepost(post.id)}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(22,163,74,0.08)'; e.currentTarget.style.color='#16a34a'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.reposted?'#16a34a':'var(--text-muted)'; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span>{fmt(post.reposts + (post.reposted ? 1 : 0))}</span>
        </button>
        <button style={{ ...btnBase, color: post.liked ? '#e11d48' : 'var(--text-muted)' }}
          onClick={() => onLike(post.id)}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(225,29,72,0.08)'; e.currentTarget.style.color='#e11d48'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.liked?'#e11d48':'var(--text-muted)'; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked ? '#e11d48' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <span>{fmt(post.likes + (post.liked ? 1 : 0))}</span>
        </button>
        <button style={{ ...btnBase, color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
          onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          <span>{fmt(post.views)}</span>
        </button>
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <button style={{ ...btnBase, color: 'var(--text-muted)' }}
            onClick={() => setShowMenu(!showMenu)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          {showMenu && (
            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, boxShadow: 'var(--shadow-md)', minWidth: 150 }}
              onMouseLeave={() => setShowMenu(false)}>
              <div onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); }}
                style={{ padding: '8px 12px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', borderRadius: 6 }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                Copy link
              </div>
              {isOwn && (
                <div onClick={() => { onDelete(post.id); setShowMenu(false); }}
                  style={{ padding: '8px 12px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--red)', cursor: 'pointer', borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--red-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  Delete post
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showComments && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {comments.length === 0 && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>No comments yet.</div>}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>D</div>
              <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '6px 10px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)' }}>{c.text}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key==='Enter' && addComment()} placeholder="Add a comment..." style={{ flex: 1, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', outline: 'none' }} />
            <button onClick={addComment} disabled={!comment.trim()} style={{ padding: '6px 14px', background: comment.trim()?'var(--accent)':'var(--surface2)', color: comment.trim()?'#fff':'var(--text-muted)', border: 'none', borderRadius: 20, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: comment.trim()?'pointer':'default' }}>Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Post({ post, onLike, onRepost, onDelete }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, transition: 'background 0.1s', cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <Avatar letter={post.avatar} grad={post.grad} size={42} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {post.repostedBy && (
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            {post.repostedBy} reposted
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{post.user}</span>
          {post.verified && <span style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>✓</span>}
          <span style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>{post.handle}</span>
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{post.time}</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text)', lineHeight: 1.65, marginBottom: 10 }}>
          {post.body}{' '}
          {post.tags?.map(t => (
            <span key={t} style={{ color: 'var(--accent)' }}>#{t} </span>
          ))}
        </div>

        {post.images === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ background: 'var(--surface2)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <div style={{ background: 'var(--surface2)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
          </div>
        )}

        {post.tradeTag && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: post.tradeTag.up ? 'var(--green-bg)' : 'var(--red-bg)',
            border: `1px solid ${post.tradeTag.up ? 'var(--green-border)' : 'var(--red-border)'}`,
            padding: '5px 14px', borderRadius: 8, marginBottom: 10,
          }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: post.tradeTag.up ? 'var(--green)' : 'var(--red)' }}>
              {post.tradeTag.up ? '▲' : '▼'} {post.tradeTag.dir} · {post.tradeTag.asset} · {post.tradeTag.sym}
            </span>
            <div style={{ width: 1, height: 12, background: post.tradeTag.up ? 'var(--green-border)' : 'var(--red-border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 36, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${post.tradeTag.cot}%`, height: '100%', background: post.tradeTag.up ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: post.tradeTag.up ? 'var(--green)' : 'var(--red)' }}>COT {post.tradeTag.cot}%</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: post.tradeTag.up ? 'var(--green)' : 'var(--red)' }}>{post.tradeTag.target}</span>
          </div>
        )}

        {post.screener && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', marginBottom: 10, transition: 'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{post.screener.name}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 8 }}>{post.screener.desc}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 9px', borderRadius: 20 }}>{post.screener.uses.toLocaleString()}× used</span>
              <span style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, background: 'var(--surface2)', color: 'var(--text-muted)', padding: '2px 9px', borderRadius: 20 }}>{post.screener.forks}× forked</span>
            </div>
          </div>
        )}

        <ActionBar post={post} onLike={onLike} onRepost={onRepost} onDelete={onDelete} />
      </div>
    </div>
  );
}

export default function FeedTab() {
  const [activeTab,  setActiveTab]  = useState('For You');
  const [posts,      setPosts]      = useState([]);
  const [postText,   setPostText]   = useState('');
  const [activeDir,  setActiveDir]  = useState(null);
  const [activeTags, setActiveTags] = useState([]);
  const textRef = useRef(null);

  const TABS = ['For You', 'Following', 'Ideas', 'Screeners', 'Strategies'];

  const toggleTag = (label) => setActiveTags(p => p.includes(label) ? p.filter(t=>t!==label) : [...p, label]);
  const handleLike   = (id) => setPosts(p => p.map(post => post.id === id ? { ...post, liked: !post.liked } : post));
  const handleRepost = (id) => setPosts(p => p.map(post => post.id === id ? { ...post, reposted: !post.reposted } : post));
  const handleDelete = (id) => setPosts(p => p.filter(post => post.id !== id));

  const handlePost = () => {
    if (!postText.trim()) return;
    const newPost = {
      id: Date.now(),
      user: 'dominicvansaghi', handle: '@domvan4437', verified: false,
      avatar: 'D', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
      time: 'now', style: 'Swing',
      body: postText,
      tags: activeTags,
      tradeTag: activeDir ? { dir: activeDir, asset: activeTags[0] || 'Market', sym: '', cot: null, target: '', up: activeDir === 'Long' } : null,
      likes: 0, comments: 0, reposts: 0, views: 0, liked: false, reposted: false,
    };
    setPosts(p => [newPost, ...p]);
    setPostText('');
    setActiveDir(null);
    setActiveTags([]);
  };

  const charsLeft = 280 - postText.length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', fontFamily: 'var(--font)' }}>

      {/* Main feed */}
      <div style={{ borderRight: '1px solid var(--border)' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 10 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '12px 16px', fontSize: 13, fontWeight: activeTab === t ? 700 : 400,
              background: 'none', border: 'none',
              borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === t ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
            }}>{t}</button>
          ))}
        </div>

        {/* Compose box */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Avatar letter="D" grad="linear-gradient(135deg,#4f46e5,#7c3aed)" size={40} />
            <div style={{ flex: 1 }}>
              <textarea
                ref={textRef}
                value={postText}
                onChange={e => setPostText(e.target.value)}
                placeholder="Share your analysis..."
                style={{
                  width: '100%', border: 'none', background: 'transparent', outline: 'none',
                  fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text)',
                  resize: 'none', minHeight: 52, lineHeight: 1.6, padding: '4px 0',
                  borderBottom: '1px solid var(--border)', marginBottom: 10,
                }}
                rows={2}
              />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                {MARKET_TAGS.map(tag => (
                  <button key={tag.label} onClick={() => toggleTag(tag.label)} style={{
                    fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500,
                    padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                    background: activeTags.includes(tag.label) ? tag.color : tag.bg,
                    color: activeTags.includes(tag.label) ? '#fff' : tag.color,
                    border: `1px solid ${tag.color}40`, transition: 'all 0.15s',
                  }}>{tag.label}</button>
                ))}
                <div style={{ width: 1, height: 20, background: 'var(--border)', alignSelf: 'center', margin: '0 2px' }} />
                <button onClick={() => setActiveDir(d => d === 'Long' ? null : 'Long')} style={{
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  background: activeDir === 'Long' ? 'var(--green)' : 'var(--green-bg)',
                  color: activeDir === 'Long' ? '#fff' : 'var(--green)',
                  border: '1px solid var(--green-border)', transition: 'all 0.15s',
                }}>Long</button>
                <button onClick={() => setActiveDir(d => d === 'Short' ? null : 'Short')} style={{
                  fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                  background: activeDir === 'Short' ? 'var(--red)' : 'var(--red-bg)',
                  color: activeDir === 'Short' ? '#fff' : 'var(--red)',
                  border: '1px solid var(--red-border)', transition: 'all 0.15s',
                }}>Short</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { tip: 'Image', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
                    { tip: 'Chart', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                    { tip: 'Poll',  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
                  ].map(b => (
                    <button key={b.tip} title={b.tip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: '4px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >{b.icon}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: charsLeft < 20 ? 'var(--red)' : 'var(--text-muted)' }}>{charsLeft}</span>
                  <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
                  <button onClick={handlePost} disabled={!postText.trim()} style={{
                    padding: '8px 20px', background: postText.trim() ? 'var(--accent)' : 'var(--surface3)',
                    color: postText.trim() ? '#fff' : 'var(--text-muted)',
                    border: 'none', borderRadius: 20, fontFamily: 'var(--font)',
                    fontSize: 14, fontWeight: 700, cursor: postText.trim() ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                  }}>Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts or empty state */}
        {posts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Be the first to post</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>Share your market analysis, trade ideas, and COT insights with the community.</div>
          </div>
        ) : (
          posts.map(post => (
            <Post key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Right sidebar */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: 'var(--surface2)', borderRadius: 20, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Search traders & ideas</span>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Trending</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TRENDING.map((t, i) => (
              <div key={t.tag} style={{ padding: '8px 6px', borderRadius: 8, cursor: 'pointer', borderTop: i > 0 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>{t.cat}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>#{t.tag}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{t.posts.toLocaleString()} posts</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Who to follow</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {WHO_TO_FOLLOW.map((u, i) => (
              <div key={u.user} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: i > 0 ? 10 : 0, borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <Avatar letter={u.avatar} grad={u.grad} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    {u.user} {u.verified && <span style={{ color: 'var(--accent)', fontSize: 11 }}>✓</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{u.winRate} win · {u.style}</div>
                </div>
                <button style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--accent)', color: '#fff', border: 'none', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Follow</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
