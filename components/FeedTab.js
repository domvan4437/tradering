'use client'
// Navigate to a user profile inside the app
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
function openDM(user) {
  if (typeof window !== 'undefined' && window.__openDM) window.__openDM(user);
}
import { useState, useRef, useEffect } from 'react';

// ── Constants ─────────────────────────────────────────────────

function savePosts(posts) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('tr_feed_posts', JSON.stringify(posts)); } catch(e) {}
}
function loadPosts() {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem('tr_feed_posts'); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}

const TABS = ['Discover', 'Following', 'Ideas', 'Screeners', 'Strategies', 'COT Signals'];

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

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ letter, grad, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: size * 0.35, fontWeight: 700,
      color: '#fff', flexShrink: 0,
    }}>{letter}</div>
  );
}

// ── Post Component ────────────────────────────────────────────
function Post({ post, onLike, onRepost, onDelete }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = post.user === 'you';
  const fmt = (n) => n >= 1000 ? (n/1000).toFixed(1)+'K' : n;
  const [localComments, setLocalComments] = useState(post.comments_data || []);
  const saveComments = (newComments) => {
    const all = loadPosts();
    const idx = all.findIndex(p => p.id === post.id);
    if (idx !== -1) { all[idx].comments_data = newComments; localStorage.setItem('tr_feed_posts', JSON.stringify(all)); }
  };

  const addComment = () => {
    if(!comment.trim()) return;
    const newC = [...localComments, { id:Date.now(), text:comment, user:'you', time:'now' }];
    setLocalComments(newC);
    saveComments(newC);
    setComment('');
  };

  const btnBase = {
    background:'none', border:'none', cursor:'pointer',
    display:'flex', alignItems:'center', gap:5,
    padding:'6px 10px', borderRadius:20,
    fontFamily:'var(--font)', fontSize:13,
    transition:'all 0.15s',
  };

  return (
    <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, transition:'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}>
      <div onClick={()=>{ if(typeof window!=='undefined'&&window.__goToProfile) window.__goToProfile(post.slug||post.user); }} style={{ cursor:'pointer' }}>
  <Avatar letter={post.avatar} grad={post.grad} size={42} />
</div>
      <div style={{ flex:1, minWidth:0 }}>
        {post.repostedBy && (
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            {post.repostedBy} reposted
          </div>
        )}
        <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4, flexWrap:'wrap' }}>
          <span onClick={()=>{ if(typeof window!=='undefined'&&window.__goToProfile) window.__goToProfile(post.slug||post.user); }} style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.color='var(--accent)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text)'}>{post.user}</span>
          {post.verified && <span style={{ color:'var(--accent)', fontSize:12, fontWeight:700 }}>✓</span>}
          <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>{post.handle}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>{post.time}</span>
          {/* Options menu */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 6px', fontSize:16, lineHeight:1 }}>···</button>
            {showMenu && (
              <div style={{ position:'absolute', right:0, top:'100%', zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:6, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', minWidth:150 }}
                onMouseLeave={() => setShowMenu(false)}>
                <div onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); }}
                  style={{ padding:'8px 12px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Copy link
                </div>
                {isOwn && (
                  <div onClick={() => { onDelete(post.id); setShowMenu(false); }}
                    style={{ padding:'8px 12px', fontFamily:'var(--font)', fontSize:12, color:'var(--red)', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--red-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    Delete post
                  </div>
                )}
              </div>
            )}
          </div>
        {(post.assetTag || (post.postType && post.postType !== 'General')) && (
          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            {post.assetTag ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent)' }}>{post.assetTag}</span> : null}
            {post.postType && post.postType !== 'General' ? <span style={{ fontFamily:'var(--font)', fontSize:11, padding:'2px 8px', borderRadius:20, background:'var(--surface2)', color:'var(--text-muted)', border:'1px solid var(--border)' }}>{post.postType}</span> : null}
          </div>
        )}
        </div>

        <div style={{ fontFamily:'var(--font)', fontSize:14, color:'var(--text)', lineHeight:1.65, marginBottom:10 }}>
          {post.body}{' '}
          {post.tags?.map(t => <span key={t} style={{ color:'var(--accent)' }}>#{t} </span>)}
        </div>

        {post.images === 2 && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3, borderRadius:12, overflow:'hidden', marginBottom:10 }}>
            {[0,1].map(i => (
              <div key={i} style={{ background:'var(--surface2)', height:120, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            ))}
          </div>
        )}

        {post.attachmentUrl && (
          <div style={{ marginBottom:10, borderRadius:12, overflow:'hidden', border:'1px solid var(--border)' }}>
            {post.attachmentType === 'image'
              ? <img src={post.attachmentUrl} alt="attachment" style={{ width:'100%', maxHeight:300, objectFit:'cover', display:'block' }} />
              : <div style={{ padding:'12px 14px', background:'var(--surface2)', display:'flex', alignItems:'center', gap:10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{post.attachmentName}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{post.attachmentSize}</div>
                  </div>
                </div>
            }
          </div>
        )}

        {post.tradeTag && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background: post.tradeTag.up?'var(--green-bg)':'var(--red-bg)', border:`1px solid ${post.tradeTag.up?'var(--green-border)':'var(--red-border)'}`, padding:'5px 14px', borderRadius:8, marginBottom:10 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color: post.tradeTag.up?'var(--green)':'var(--red)' }}>
              {post.tradeTag.up?'▲':'▼'} {post.tradeTag.dir} · {post.tradeTag.asset} · {post.tradeTag.sym}
            </span>
            <div style={{ width:1, height:12, background: post.tradeTag.up?'var(--green-border)':'var(--red-border)' }} />
            {post.tradeTag.cot && (
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:36, height:4, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                  <div style={{ width:`${post.tradeTag.cot}%`, height:'100%', background: post.tradeTag.up?'var(--green)':'var(--red)', borderRadius:2 }} />
                </div>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700, color: post.tradeTag.up?'var(--green)':'var(--red)' }}>COT {post.tradeTag.cot}%</span>
              </div>
            )}
            {post.tradeTag.target && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: post.tradeTag.up?'var(--green)':'var(--red)' }}>{post.tradeTag.target}</span>}
          </div>
        )}

        {post.screener && (
          <div style={{ border:'1px solid var(--border)', borderRadius:12, padding:'12px 14px', marginBottom:10, transition:'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{post.screener.name}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.5, marginBottom:8 }}>{post.screener.desc}</div>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, background:'var(--accent-bg)', color:'var(--accent)', padding:'2px 9px', borderRadius:20 }}>{post.screener.uses.toLocaleString()}× used</span>
              <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, background:'var(--surface2)', color:'var(--text-muted)', padding:'2px 9px', borderRadius:20 }}>{post.screener.forks}× forked</span>
            </div>
          </div>
        )}

        {/* Action bar */}
        <div style={{ display:'flex', alignItems:'center', marginTop:8, marginLeft:-10 }}>
          <button style={{ ...btnBase, color:'var(--text-muted)' }}
            onClick={() => setShowComments(!showComments)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{fmt(post.comments + comments.length)}</span>
          </button>
          <button style={{ ...btnBase, color: post.reposted?'#16a34a':'var(--text-muted)' }}
            onClick={() => onRepost(post.id)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(22,163,74,0.08)'; e.currentTarget.style.color='#16a34a'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.reposted?'#16a34a':'var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span>{fmt(post.reposts + (post.reposted?1:0))}</span>
          </button>
          <button style={{ ...btnBase, color: post.liked?'#e11d48':'var(--text-muted)' }}
            onClick={() => onLike(post.id)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(225,29,72,0.08)'; e.currentTarget.style.color='#e11d48'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.liked?'#e11d48':'var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked?'#e11d48':'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>{fmt(post.likes + (post.liked?1:0))}</span>
          </button>
          <button style={{ ...btnBase, color:'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span>{fmt(post.views)}</span>
          </button>
        </div>

        {/* Inline comments */}
        {showComments && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
            {comments.length === 0 && <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>No comments yet.</div>}
            {localComments.map(c => (
              <div key={c.id} style={{ display:'flex', gap:8, marginBottom:8 }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>D</div>
                <div style={{ flex:1, background:'var(--surface2)', borderRadius:10, padding:'6px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>{c.text}</div>
              </div>
            ))}
            <div style={{ display:'flex', gap:8 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key==='Enter' && addComment()} placeholder="Add a comment..." style={{ flex:1, padding:'6px 12px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
              <button onClick={addComment} disabled={!comment.trim()} style={{ padding:'6px 14px', background: comment.trim()?'var(--accent)':'var(--surface2)', color: comment.trim()?'#fff':'var(--text-muted)', border:'none', borderRadius:20, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor: comment.trim()?'pointer':'default' }}>Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main FeedTab ──────────────────────────────────────────────
export default function FeedTab() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState([]);
  useEffect(() => { setMounted(true); setPosts(loadPosts()); }, []);
  useEffect(() => { if (mounted) savePosts(posts); }, [posts, mounted]);
  const [postText, setPostText]   = useState('');
  
  const fileInputRef              = useRef(null);
  const [pendingFile, setPendingFile] = useState(null); // { url, type, name, size }
  const [postType, setPostType] = useState('General');
  const [assetTag, setAssetTag] = useState('');

  const POST_TYPES = ['General', 'Idea', 'Screener', 'Strategy', 'COT Signal'];
  const TAB_FILTER = {
    'Discover':    null,         // show all
    'Following':   null,         // show all (would filter by followed users later)
    'Ideas':       'Idea',
    'Screeners':   'Screener',
    'Strategies':  'Strategy',
    'COT Signals': 'COT Signal',
  };

  const visiblePosts = (() => {
    const filter = TAB_FILTER[activeTab];
    if(!filter) return posts;
    return posts.filter(p => p.postType === filter);
  })();

  const handleLike   = (id) => setPosts(p => p.map(post => post.id===id ? {...post, liked:!post.liked} : post));
  const handleRepost = (id) => setPosts(p => p.map(post => post.id===id ? {...post, reposted:!post.reposted} : post));
  const handleDelete = (id) => setPosts(p => p.filter(post => post.id!==id));

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(isImage) {
        setPendingFile({ url:ev.target.result, type:'image', name:file.name, size:'' });
      } else {
        setPendingFile({ url:null, type:'file', name:file.name, size: file.size>1024*1024?(file.size/1024/1024).toFixed(1)+'MB':Math.round(file.size/1024)+'KB' });
      }
    };
    isImage ? reader.readAsDataURL(file) : reader.readAsArrayBuffer(file);
    e.target.value='';
  };

  const handlePost = () => {
    if(!postText.trim() && !pendingFile) return;
    const newPost = {
      id: Date.now(),
      user:'you', handle:'@you', verified:false,
      avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)',
      time:'now',
      body: postText,
      tags: [],
      postType,
      assetTag: assetTag.trim(),
      tradeTag: null,
      attachmentUrl: pendingFile?.url || null,
      attachmentType: pendingFile?.type || null,
      attachmentName: pendingFile?.name || null,
      attachmentSize: pendingFile?.size || null,
      likes:0, comments:0, reposts:0, views:0, liked:false, reposted:false,
    };
    setPosts(p => [newPost, ...p]);
    setPostText(''); setPendingFile(null); setPostType('General'); setAssetTag('');
  };

  const charsLeft = 280 - postText.length;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', fontFamily:'var(--font)' }}>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.mp4" style={{ display:'none' }} onChange={handleFileSelect} />

      {/* ── Main feed ── */}
      <div style={{ borderRight:'1px solid var(--border)' }}>

        {/* Single tab bar */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--surface)', zIndex:10, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding:'12px 14px', fontSize:12, fontWeight: activeTab===t?700:400,
              background:'none', border:'none',
              borderBottom: activeTab===t?'2px solid var(--accent)':'2px solid transparent',
              color: activeTab===t?'var(--text)':'var(--text-muted)',
              cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
              fontFamily:'var(--font)',
            }}>{t}</button>
          ))}
        </div>

        {/* Compose box */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', gap:12 }}>
            <Avatar letter="D" grad="linear-gradient(135deg,#4f46e5,#7c3aed)" size={40} />
            <div style={{ flex:1 }}>
              <textarea
                value={postText}
                onChange={e => setPostText(e.target.value.slice(0,280))}
                placeholder="What's on your mind?"
                style={{ width:'100%', border:'none', background:'transparent', outline:'none', fontFamily:'var(--font)', fontSize:15, color:'var(--text)', resize:'none', minHeight:52, lineHeight:1.6, padding:'4px 0', borderBottom:'1px solid var(--border)', marginBottom:10 }}
                rows={2}
              />

              {/* Post type selector */}
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                {POST_TYPES.map(t => (
                  <button key={t} onClick={() => setPostType(t)} style={{
                    fontFamily:'var(--font)', fontSize:11, fontWeight: postType===t?700:400,
                    padding:'3px 11px', borderRadius:20, cursor:'pointer',
                    background: postType===t?'var(--accent)':'var(--surface2)',
                    color: postType===t?'#fff':'var(--text-muted)',
                    border: postType===t?'1px solid var(--accent)':'1px solid var(--border)',
                    transition:'all 0.15s',
                  }}>{t}</button>
                ))}
              </div>
              {/* Asset tag */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', flexShrink:0 }}>Asset:</span>
                <input
                  value={assetTag}
                  onChange={e => setAssetTag(e.target.value.toUpperCase().slice(0,10))}
                  placeholder="e.g. GOLD, EURUSD, BTC"
                  list="asset-list"
                  style={{ flex:1, padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text)', outline:'none' }}
                />
                <datalist id="asset-list">
                  {['GOLD','SILVER','CRUDE OIL','NAT GAS','CORN','WHEAT','SOYBEANS','COFFEE','COTTON','SUGAR','EUR/USD','GBP/USD','USD/JPY','AUD/USD','BTC','ETH','SPX','NQ','ES'].map(a => <option key={a} value={a} />)}
                </datalist>
              </div>

              {/* Pending attachment preview */}
              {pendingFile && (
                <div style={{ marginBottom:10, borderRadius:10, overflow:'hidden', border:'1px solid var(--border)', position:'relative' }}>
                  {pendingFile.type==='image'
                    ? <img src={pendingFile.url} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }} />
                    : <div style={{ padding:'10px 14px', background:'var(--surface2)', display:'flex', alignItems:'center', gap:10 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <div>
                          <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{pendingFile.name}</div>
                          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{pendingFile.size}</div>
                        </div>
                      </div>
                  }
                  <button onClick={() => setPendingFile(null)} style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>×</button>
                </div>
              )}



              {/* Bottom bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', gap:4 }}>
                  {/* Image attach */}
                  <button onClick={() => { fileInputRef.current.accept='image/*'; fileInputRef.current.click(); }} title="Attach image" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', padding:'5px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  {/* File attach */}
                  <button onClick={() => { fileInputRef.current.accept='.pdf,.doc,.docx,.txt,.csv,.xlsx'; fileInputRef.current.click(); }} title="Attach file" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent)', padding:'5px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='none'}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>

                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color: charsLeft<20?'var(--red)':'var(--text-muted)' }}>{charsLeft}</span>
                  <div style={{ width:1, height:16, background:'var(--border)' }} />
                  <button onClick={handlePost} disabled={!postText.trim()&&!pendingFile} style={{ padding:'8px 20px', background: (postText.trim()||pendingFile)?'var(--accent)':'var(--surface3)', color: (postText.trim()||pendingFile)?'#fff':'var(--text-muted)', border:'none', borderRadius:20, fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor: (postText.trim()||pendingFile)?'pointer':'default', transition:'all 0.15s' }}>Post</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div style={{ padding:'60px 20px', textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
            <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>
              {TAB_FILTER[activeTab] ? `No ${activeTab} posts yet` : activeTab==='Following' ? 'Follow traders to see their posts' : 'Be the first to post'}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', maxWidth:300, margin:'0 auto', lineHeight:1.6 }}>
              {TAB_FILTER[activeTab] ? `Be the first to post in ${activeTab}.` : activeTab==='Following' ? 'Find traders on the Discover feed.' : 'Share your market analysis, trade ideas, and COT insights.'}
            </div>
          </div>
        ) : (
          visiblePosts.map(post => <Post key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} onDelete={handleDelete} />)
        )}
      </div>

      {/* ── Right sidebar ── */}
      <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'var(--surface2)', borderRadius:20, padding:'8px 14px', display:'flex', alignItems:'center', gap:8, border:'1px solid var(--border)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Search traders & ideas</span>
        </div>

        <div style={{ background:'var(--surface2)', borderRadius:12, padding:'14px', border:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Trending</div>
          {TRENDING.map((t, i) => (
            <div key={t.tag} style={{ padding:'8px 6px', borderRadius:8, cursor:'pointer', borderTop: i>0?'1px solid var(--border)':'none', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{t.cat}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>#{t.tag}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{t.posts.toLocaleString()} posts</div>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--surface2)', borderRadius:12, padding:'14px', border:'1px solid var(--border)' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Who to follow</div>
          {WHO_TO_FOLLOW.map((u, i) => (
            <div key={u.user} style={{ display:'flex', alignItems:'center', gap:8, paddingTop: i>0?10:0, borderTop: i>0?'1px solid var(--border)':'none' }}>
              <Avatar letter={u.avatar} grad={u.grad} size={34} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.user} {u.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{u.winRate} win · {u.style}</div>
              </div>
              <button style={{ padding:'5px 12px', borderRadius:20, background:'var(--accent)', color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>Follow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
