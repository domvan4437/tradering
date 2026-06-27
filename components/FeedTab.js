'use client'
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
import { useState, useEffect, useCallback, useContext } from 'react';
import { UserAvatarContext } from './UserAvatarContext';

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
    postType: p.postType || p.type || 'General',
    assetTag: p.assetTag || p.symbol || '',
    direction: p.direction || null,
    authorImage: p.authorImage || null,
    authorSlug: p.authorSlug || null,
    attachmentUrl: p.imageUrl || null,
    attachmentType: p.imageUrl ? 'image' : null,
    poll: p.poll || null,
    myVote: p.myVote ?? -1,
    likes: p.likes || 0,
    comments: p.commentsCount || 0,
    reposts: p.reposts || 0,
    liked: p.liked || false,
    reposted: p.reposted || false,
    repostedBy: p.repostedBy || null,
    comments_data: [],
  };
}

// ── Type badge config ──────────────────────────────────────────
const TYPE_COLORS = {
  'General':    { bg: '#F3F4F6', color: '#6B7280' },
  'Idea':       { bg: '#EEF2FF', color: '#4F46E5' },
  'Screener':   { bg: '#F5F3FF', color: '#7C3AED' },
  'Strategy':   { bg: '#ECFDF5', color: '#059669' },
  'COT Signal': { bg: '#FFF7ED', color: '#D97706' },
};
function typeStyle(t) {
  return TYPE_COLORS[t] || TYPE_COLORS['General'];
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ letter, grad, size = 38, imageUrl }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: imageUrl ? 'transparent' : grad,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: size * 0.36, fontWeight: 700,
      color: '#fff', flexShrink: 0, overflow: 'hidden',
    }}>
      {imageUrl
        ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : letter}
    </div>
  );
}

// ── Poll Block ────────────────────────────────────────────────
function PollBlock({ postId, initialPoll, initialVoted }) {
  const [poll, setPoll] = useState(initialPoll);
  const [voted, setVoted] = useState(initialVoted >= 0 ? initialVoted : null);
  const totalVotes = poll.reduce((s, o) => s + (o.votes || 0), 0);
  const handleVote = async (i) => {
    if (voted !== null) return;
    const updated = poll.map((o, idx) => idx === i ? { ...o, votes: (o.votes || 0) + 1 } : o);
    setPoll(updated); setVoted(i);
    try {
      const res = await fetch('/api/social/posts/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId, optionIndex: i }) });
      const data = await res.json();
      if (res.ok && data.poll) setPoll(data.poll);
      if (data.alreadyVoted) setVoted(data.votedIndex);
    } catch(e) {}
  };
  return (
    <div style={{ marginBottom: 10, marginTop: 4 }}>
      {poll.map((opt, i) => {
        const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
        const isChosen = voted === i;
        return (
          <div key={i} onClick={() => handleVote(i)}
            style={{ position: 'relative', marginBottom: 6, borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${isChosen ? '#4F46E5' : '#E5E7EB'}`, cursor: voted !== null ? 'default' : 'pointer', height: 38 }}>
            {voted !== null && <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: isChosen ? 'rgba(79,70,229,0.12)' : '#F9FAFB', transition: 'width 0.3s' }} />}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: '100%', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)' }}>
              <span>{opt.label}</span>
              {voted !== null && <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{pct}%</span>}
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────
function Post({ post, onLike, onRepost, onDelete, currentUserId }) {
  const myAvatar = useContext(UserAvatarContext);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [localComments, setLocalComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showMenu, setShowMenu] = useState(false);
  const isOwn = currentUserId && post.userId === currentUserId;
  const fmt = (n) => n >= 1000 ? (n/1000).toFixed(1)+'K' : n;
  const ts = typeStyle(post.postType);

  const fetchComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/comment?postId=${post.id}`);
      const data = await res.json();
      if (data.comments) {
        setLocalComments(data.comments.map(c => ({ id: c.id, text: c.content, user: c.authorName || 'Trader' })));
        setCommentCount(data.comments.length);
      }
    } catch(e) {}
    setLoadingComments(false);
  }, [post.id]);

  const toggleComments = () => { if (!showComments) fetchComments(); setShowComments(v => !v); };
  const addComment = async () => {
    if (!comment.trim()) return;
    const text = comment;
    setLocalComments(prev => [...prev, { id: Date.now(), text, user: 'You' }]);
    setCommentCount(c => c + 1); setComment('');
    try { await fetch('/api/social/posts/comment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: post.id, content: text }) }); } catch(e) {}
  };
  const handleShare = () => {
    if (navigator.share) navigator.share({ title: 'TradeZar post', text: post.body, url: window.location.href }).catch(() => {});
    else navigator.clipboard?.writeText(window.location.href);
  };

  return (
    <div style={{ marginBottom: 10, padding: '13px 15px', borderRadius: 18, border: '0.5px solid var(--border)', background: 'var(--surface)' }}>

      {post.repostedBy && (
        <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          {post.repostedBy} reposted
        </div>
      )}

      <div style={{ display: 'flex', gap: 11 }}>
        <div onClick={() => goToProfile(post.authorSlug || post.userId)} style={{ cursor: 'pointer', paddingTop: 2 }}>
          <Avatar letter={post.avatar} grad={post.grad} size={38}
            imageUrl={post.userId === currentUserId ? (myAvatar || post.authorImage) : post.authorImage} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
            <span onClick={() => goToProfile(post.authorSlug || post.userId)}
              style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}>
              {post.user}
            </span>
            {post.verified && <span style={{ color: '#4F46E5', fontSize: 11 }}>✓</span>}
            {/* Post type badge */}
            {post.postType && post.postType !== 'General' && (
              <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ts.bg, color: ts.color, fontFamily: 'var(--font)' }}>
                {post.postType}
              </span>
            )}
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>{post.handle}</span>
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{post.time}</span>
            {/* Menu */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px 4px', fontSize: 15, lineHeight: 1, borderRadius: 4 }}>···</button>
              {showMenu && (
                <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 200, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 160 }}
                  onMouseLeave={() => setShowMenu(false)}>
                  {[
                    { label: 'Copy link', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, action: () => { navigator.clipboard?.writeText(window.location.href); setShowMenu(false); } },
                    { label: 'Share on X', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>, action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.body)}`, '_blank'); setShowMenu(false); } },
                  ].map(item => (
                    <div key={item.label} onClick={item.action}
                      style={{ padding: '7px 11px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {item.icon}{item.label}
                    </div>
                  ))}
                  {isOwn && (
                    <div onClick={() => { onDelete(post.id); setShowMenu(false); }}
                      style={{ padding: '7px 11px', fontFamily: 'var(--font)', fontSize: 12, color: '#DC2626', cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      Delete post
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Asset + direction tags */}
          {(post.assetTag || post.direction) && (
            <div style={{ display: 'flex', gap: 5, marginBottom: 7, flexWrap: 'wrap' }}>
              {post.assetTag && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: post.direction === 'LONG' ? '#DCFCE7' : post.direction === 'SHORT' ? '#FEE2E2' : '#F3F4F6', color: post.direction === 'LONG' ? '#16A34A' : post.direction === 'SHORT' ? '#DC2626' : '#6B7280' }}>
                  {post.assetTag} {post.direction === 'LONG' ? '▲' : post.direction === 'SHORT' ? '▼' : ''}
                </span>
              )}
              {post.direction && !post.assetTag && (
                <span style={{ fontFamily: 'var(--font)', fontSize: 11, padding: '2px 9px', borderRadius: 20, background: post.direction === 'LONG' ? '#DCFCE7' : '#FEE2E2', color: post.direction === 'LONG' ? '#16A34A' : '#DC2626' }}>{post.direction}</span>
              )}
            </div>
          )}

          {/* Body */}
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', lineHeight: 1.65, marginBottom: post.attachmentUrl || post.poll ? 10 : 0 }}>
            {post.body}
          </div>

          {/* Image */}
          {post.attachmentUrl && post.attachmentType === 'image' && (
            <div style={{ marginBottom: 10, marginTop: 8 }}>
              <img src={post.attachmentUrl} alt="attachment" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, display: 'block', border: '1px solid var(--border)' }} />
            </div>
          )}

          {/* Poll */}
          {post.poll && Array.isArray(post.poll) && post.poll.length > 0 && (
            <PollBlock postId={post.id} initialPoll={post.poll} initialVoted={post.myVote ?? -1} />
          )}

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10 }}>
            {/* Comment */}
            <button onClick={toggleComments}
              style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{fmt(commentCount)}</span>
            </button>
            {/* Repost */}
            <button onClick={() => onRepost(post.id)}
              style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font)', fontSize: 12, color: post.reposted ? '#16A34A' : 'var(--text-muted)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#16A34A'}
              onMouseLeave={e => e.currentTarget.style.color = post.reposted ? '#16A34A' : 'var(--text-muted)'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              <span>{fmt(post.reposts)}</span>
            </button>
            {/* Like */}
            <button onClick={() => onLike(post.id)}
              style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font)', fontSize: 12, color: post.liked ? '#E11D48' : 'var(--text-muted)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.color = '#E11D48'}
              onMouseLeave={e => e.currentTarget.style.color = post.liked ? '#E11D48' : 'var(--text-muted)'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill={post.liked ? '#E11D48' : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span>{fmt(post.likes)}</span>
            </button>
            {/* Share */}
            <button onClick={handleShare}
              style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
              onMouseEnter={e => e.currentTarget.style.color = '#4F46E5'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>

          {/* Inline comments */}
          {showComments && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              {loadingComments ? (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Loading…</div>
              ) : localComments.length === 0 ? (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>No comments yet.</div>
              ) : localComments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{(c.user||'T')[0].toUpperCase()}</div>
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '6px 10px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)' }}>
                    <span style={{ fontWeight: 700, marginRight: 6 }}>{c.user}</span>{c.text}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Add a comment…"
                  style={{ flex: 1, padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface2)', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', outline: 'none' }} />
                <button onClick={addComment} disabled={!comment.trim()}
                  style={{ padding: '7px 16px', background: comment.trim() ? '#4F46E5' : 'var(--surface2)', color: comment.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 20, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: comment.trim() ? 'pointer' : 'default' }}>Reply</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────
function FeedSidebar({ posts }) {
  const [suggestions, setSuggestions] = useState([]);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    fetch('/api/social/leaderboard?limit=4')
      .then(r => r.json())
      .then(d => {
        const users = (d.users || d.leaderboard || []).slice(0, 4);
        setSuggestions(users);
        // Pre-load current follow state for each suggestion
        users.forEach(u => {
          fetch(`/api/social/follow?userId=${u.id}`)
            .then(r => r.json())
            .then(d => { if (d.isFollowing !== undefined) setFollowed(prev => ({ ...prev, [u.id]: d.isFollowing })); })
            .catch(() => {});
        });
      })
      .catch(() => {});
  }, []);

  const trending = [...new Set(
    posts.flatMap(p => (p.body.match(/#\w+/g) || []))
  )].slice(0, 8);

  const handleFollow = async (userId) => {
    setFollowed(prev => ({ ...prev, [userId]: !prev[userId] }));
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const d = await res.json();
      if (!d.error) setFollowed(prev => ({ ...prev, [userId]: d.following }));
    } catch {}
  };

  function getColor(name) {
    const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
    return colors[(name||'?').charCodeAt(0) % colors.length];
  }

  return (
    <div style={{ width: 200, borderLeft: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Who to follow */}
      <div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Who to follow</div>
        {suggestions.length === 0 ? (
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>No suggestions yet.</div>
        ) : suggestions.map(u => {
          const name = u.displayName || u.name || 'Trader';
          const isFollowed = followed[u.id];
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div onClick={() => goToProfile(u.profileSlug || u.id)} style={{ width: 34, height: 34, borderRadius: '50%', background: getColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0, cursor: 'pointer' }}>
                {name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div onClick={() => goToProfile(u.profileSlug || u.id)} style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                {u.tradingStyle && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{u.tradingStyle}</div>}
              </div>
              <button onClick={() => handleFollow(u.id)}
                style={{ padding: '4px 11px', borderRadius: 20, border: isFollowed ? '1.5px solid #4F46E5' : '1.5px solid var(--border)', background: isFollowed ? '#EEF2FF' : 'transparent', color: isFollowed ? '#4F46E5' : 'var(--text)', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                {isFollowed ? 'Following' : 'Follow'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Trending</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trending.map(tag => (
              <span key={tag} style={{ padding: '4px 10px', borderRadius: 20, background: 'var(--surface2)', border: '1px solid var(--border)', fontFamily: 'var(--font)', fontSize: 12, color: '#4F46E5', cursor: 'pointer', fontWeight: 500 }}>{tag}</span>
            ))}
          </div>
        </div>
      )}
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
    const onPost = () => fetchPosts();
    window.addEventListener('post-created', onPost);
    return () => { clearInterval(interval); window.removeEventListener('post-created', onPost); };
  }, [fetchPosts]);

  const handleLike = async (id) => {
    setPosts(p => p.map(post => post.id === id ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } : post));
    try { await fetch('/api/social/posts/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: id }) }); } catch(e) {}
  };

  const handleRepost = async (id) => {
    try {
      const res = await fetch('/api/social/posts/repost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: id }) });
      const data = await res.json();
      if (data.reposts !== undefined) setPosts(p => p.map(p2 => p2.id === id ? { ...p2, reposted: data.reposted, reposts: data.reposts } : p2));
    } catch(e) {}
  };

  const handleDelete = async (id) => {
    setPosts(p => p.filter(post => post.id !== id));
    try { await fetch('/api/social/posts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); } catch(e) {}
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', fontFamily: 'var(--font)', minWidth: 0 }}>
      {/* ── Feed column ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading posts…</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                {activeTab === 'Following' ? 'Follow traders to see their posts' : 'Be the first to post'}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto', lineHeight: 1.6 }}>
                {activeTab === 'Following' ? 'Follow traders on Discover to see their ideas here.' : 'Tap the + button to share your market analysis and trade ideas.'}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 12px' }}>
              {posts.map(post => (
                <Post key={post.id} post={post} onLike={handleLike} onRepost={handleRepost} onDelete={handleDelete} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
