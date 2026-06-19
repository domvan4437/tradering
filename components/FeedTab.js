'use client'
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
import { useState, useEffect, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────

const GRADS = [
  'linear-gradient(135deg,#4f46e5,#7c3aed)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
];

function gradFromId(id) {
  if (!id) return GRADS[0];
  let n = 0;
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i);
  return GRADS[n % GRADS.length];
}

function mapApiPost(p) {
  const name = p.authorName || p.user?.username || p.user?.name || 'Trader';
  const username = p.user?.username || p.user?.name || 'trader';
  const letter = name[0]?.toUpperCase() || 'T';
  const elapsed = (() => {
    const secs = Math.floor((Date.now() - new Date(p.createdAt)) / 1000);
    if (secs < 60) return `${secs}s`;
    if (secs < 3600) return `${Math.floor(secs/60)}m`;
    if (secs < 86400) return `${Math.floor(secs/3600)}h`;
    return `${Math.floor(secs/86400)}d`;
  })();
  return {
    id: p.id,
    userId: p.userId,
    user: name,
    handle: `@${username}`,
    verified: false,
    avatar: letter,
    grad: gradFromId(p.userId),
    slug: username,
    time: elapsed,
    body: p.content || p.body || '',
    assetTag: p.assetTag || p.symbol || '',
    direction: p.direction || null,
    attachmentUrl: p.imageUrl || null,
    attachmentType: p.imageUrl ? 'image' : null,
    poll: p.poll || null,
    myVote: p.myVote ?? -1,
    likes: p.likes || 0,
    comments: p.commentsCount || 0,
    reposts: p.reposts || 0,
    liked: p.liked || false,
    reposted: p.reposted || false,
    comments_data: [],
  };
}

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

// ── Poll Block ────────────────────────────────────────────────
function PollBlock({ postId, initialPoll, initialVoted }) {
  const [poll, setPoll] = useState(initialPoll);
  const [voted, setVoted] = useState(initialVoted >= 0 ? initialVoted : null);

  const totalVotes = poll.reduce((s, o) => s + (o.votes || 0), 0);

  const handleVote = async (i) => {
    if (voted !== null) return; // already voted
    // Optimistic
    const updated = poll.map((o, idx) => idx === i ? { ...o, votes: (o.votes || 0) + 1 } : o);
    setPoll(updated);
    setVoted(i);
    try {
      const res = await fetch('/api/social/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, optionIndex: i }),
      });
      const data = await res.json();
      if (res.ok && data.poll) setPoll(data.poll);
      if (data.alreadyVoted) setVoted(data.votedIndex);
    } catch(e) {}
  };

  return (
    <div style={{ marginBottom:10 }}>
      {poll.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
        const isChosen = voted === i;
        return (
          <div key={i} onClick={() => handleVote(i)}
            style={{ position:'relative', marginBottom:6, borderRadius:8, overflow:'hidden',
              border: `1px solid ${isChosen ? 'var(--accent)' : 'var(--border)'}`,
              cursor: voted !== null ? 'default' : 'pointer', height:36 }}>
            {/* Vote bar */}
            {voted !== null && (
              <div style={{ position:'absolute', inset:0, width:`${pct}%`,
                background: isChosen ? 'rgba(99,102,241,0.18)' : 'var(--surface2)', transition:'width 0.3s' }} />
            )}
            <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'0 12px', height:'100%', fontFamily:'var(--font)', fontSize:13, color:'var(--text)' }}>
              <span>{opt.label}</span>
              {voted !== null && <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>{pct}%</span>}
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ── Post Component ────────────────────────────────────────────
function Post({ post, onLike, onRepost, onDelete, currentUserId }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = currentUserId && post.userId === currentUserId;
  const fmt = (n) => n >= 1000 ? (n/1000).toFixed(1)+'K' : n;

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/comment?postId=${post.id}`);
      const data = await res.json();
      if (data.comments) {
        setLocalComments(data.comments.map(c => ({
          id: c.id,
          text: c.content,
          user: c.authorName || 'Trader',
        })));
        setCommentCount(data.comments.length);
      }
    } catch(e) {}
    setLoadingComments(false);
  }, [post.id]);

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(v => !v);
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    const text = comment;
    setLocalComments(prev => [...prev, { id: Date.now(), text, user: 'You' }]);
    setCommentCount(c => c + 1);
    setComment('');
    try {
      await fetch('/api/social/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, content: text }),
      });
    } catch(e) {}
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Tradering post', text: post.body, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
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
      <div onClick={() => goToProfile(post.slug || post.user)} style={{ cursor:'pointer' }}>
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
          <span onClick={() => goToProfile(post.slug || post.user)} style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.color='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.color='var(--text)'}>{post.user}</span>
          {post.verified && <span style={{ color:'var(--accent)', fontSize:12, fontWeight:700 }}>✓</span>}
          <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>{post.handle}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginLeft:'auto' }}>{post.time}</span>
          {/* Options menu */}
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 6px', fontSize:16, lineHeight:1 }}>···</button>
            {showMenu && (
              <div style={{ position:'absolute', right:0, top:'100%', zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:6, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', minWidth:160 }}
                onMouseLeave={() => setShowMenu(false)}>
                <div onClick={() => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); }}
                  style={{ padding:'8px 12px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Copy link
                </div>
                <div onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.body)}`, '_blank'); setShowMenu(false); }}
                  style={{ padding:'8px 12px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                  Share on X
                </div>
                {isOwn && (
                  <div onClick={() => { onDelete(post.id); setShowMenu(false); }}
                    style={{ padding:'8px 12px', fontFamily:'var(--font)', fontSize:12, color:'#dc2626', cursor:'pointer', borderRadius:6, display:'flex', alignItems:'center', gap:8 }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    Delete post
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {(post.assetTag || post.direction) && (
          <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
            {post.assetTag && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent)' }}>{post.assetTag}</span>}
            {post.direction && <span style={{ fontFamily:'var(--font)', fontSize:11, padding:'2px 8px', borderRadius:20, background: post.direction==='LONG'?'rgba(22,163,74,0.1)':post.direction==='SHORT'?'rgba(220,38,38,0.1)':'var(--surface2)', color: post.direction==='LONG'?'#16a34a':post.direction==='SHORT'?'#dc2626':'var(--text-muted)', border:`1px solid ${post.direction==='LONG'?'#16a34a':post.direction==='SHORT'?'#dc2626':'var(--border)'}` }}>{post.direction}</span>}
          </div>
        )}

        <div style={{ fontFamily:'var(--font)', fontSize:14, color:'var(--text)', lineHeight:1.65, marginBottom:10 }}>
          {post.body}
        </div>

        {post.attachmentUrl && post.attachmentType === 'image' && (
          <div style={{ marginBottom:10 }}>
            <img src={post.attachmentUrl} alt="attachment"
              style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', borderRadius:10, display:'block', background:'var(--surface2)' }} />
          </div>
        )}

        {post.poll && Array.isArray(post.poll) && post.poll.length > 0 && (
          <PollBlock postId={post.id} initialPoll={post.poll} initialVoted={post.myVote ?? -1} />
        )}

        {/* Action bar */}
        <div style={{ display:'flex', alignItems:'center', marginTop:8, marginLeft:-10 }}>
          <button style={{ ...btnBase, color:'var(--text-muted)' }}
            onClick={toggleComments}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{fmt(commentCount)}</span>
          </button>
          <button style={{ ...btnBase, color: post.reposted?'#16a34a':'var(--text-muted)' }}
            onClick={() => onRepost(post.id)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(22,163,74,0.08)'; e.currentTarget.style.color='#16a34a'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.reposted?'#16a34a':'var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
            <span>{fmt(post.reposts)}</span>
          </button>
          <button style={{ ...btnBase, color: post.liked?'#e11d48':'var(--text-muted)' }}
            onClick={() => onLike(post.id)}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(225,29,72,0.08)'; e.currentTarget.style.color='#e11d48'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color=post.liked?'#e11d48':'var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={post.liked?'#e11d48':'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>{fmt(post.likes)}</span>
          </button>
          <button style={{ ...btnBase, color:'var(--text-muted)' }}
            onClick={handleShare}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.08)'; e.currentTarget.style.color='#6366f1'; }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-muted)'; }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            <span>Share</span>
          </button>
        </div>

        {/* Inline comments */}
        {showComments && (
          <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--border)' }}>
            {loadingComments ? (
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>Loading…</div>
            ) : localComments.length === 0 ? (
              <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>No comments yet.</div>
            ) : (
              localComments.map(c => (
                <div key={c.id} style={{ display:'flex', gap:8, marginBottom:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>{(c.user||'T')[0].toUpperCase()}</div>
                  <div style={{ flex:1, background:'var(--surface2)', borderRadius:10, padding:'6px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>
                    <span style={{ fontWeight:700, marginRight:6 }}>{c.user}</span>{c.text}
                  </div>
                </div>
              ))
            )}
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key==='Enter' && addComment()} placeholder="Add a comment…" style={{ flex:1, padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
              <button onClick={addComment} disabled={!comment.trim()} style={{ padding:'7px 16px', background:comment.trim()?'var(--accent)':'var(--surface2)', color:comment.trim()?'#fff':'var(--text-muted)', border:'none', borderRadius:20, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:comment.trim()?'pointer':'default' }}>Reply</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main FeedTab ──────────────────────────────────────────────
export default function FeedTab({ currentUserId, activeTab: activeTabProp }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const activeTab = activeTabProp || 'Discover';

  const fetchPosts = useCallback(async () => {
    try {
      const tabParam = activeTab === 'Following' ? 'following' : 'discover';
      const res = await fetch(`/api/social/posts?tab=${tabParam}`);
      const data = await res.json();
      if (data.posts) setPosts(data.posts.map(mapApiPost));
    } catch(e) {}
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
    const interval = setInterval(fetchPosts, 20000);
    // Refresh immediately when a post is created via the "+" modal
    const onPost = () => fetchPosts();
    window.addEventListener('post-created', onPost);
    return () => {
      clearInterval(interval);
      window.removeEventListener('post-created', onPost);
    };
  }, [fetchPosts]);

  const handleLike = async (id) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post));
    try { await fetch('/api/social/posts/like', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ postId: id }) }); } catch(e) {}
  };

  const handleRepost = async (id) => {
    try {
      const res = await fetch('/api/social/posts/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: id }),
      });
      const data = await res.json();
      if (data.reposts !== undefined) {
        setPosts(p => p.map(p2 => p2.id === id ? { ...p2, reposted: data.reposted, reposts: data.reposts } : p2));
      }
    } catch(e) {}
  };

  const handleDelete = async (id) => {
    setPosts(p => p.filter(post => post.id !== id));
    try { await fetch('/api/social/posts', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) }); } catch(e) {}
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', fontFamily:'var(--font)' }}>
      {loading ? (
        <div style={{ padding:'60px 20px', textAlign:'center' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Loading posts…</div>
        </div>
      ) : posts.length === 0 ? (
        <div style={{ padding:'60px 20px', textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
          <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>
            {activeTab === 'Following' ? 'Follow traders to see their posts' : 'Be the first to post'}
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', maxWidth:300, margin:'0 auto', lineHeight:1.6 }}>
            {activeTab === 'Following' ? 'Follow traders on Discover to see their ideas here.' : 'Tap the + button to share your market analysis, trade ideas, and COT insights.'}
          </div>
        </div>
      ) : (
        posts.map(post => <Post key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} onDelete={handleDelete} currentUserId={currentUserId} />)
      )}
    </div>
  );
}
