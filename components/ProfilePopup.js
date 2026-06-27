'use client';
import { useState, useEffect, useCallback } from 'react';

const PURPLE = '#534AB7';

const TYPE_COLORS = {
  'General':    { bg: '#F3F4F6', color: '#6B7280' },
  'Idea':       { bg: '#ECFDF5', color: '#059669' },
  'Screener':   { bg: '#F5F3FF', color: '#7C3AED' },
  'Strategy':   { bg: '#EEF2FF', color: '#4F46E5' },
  'COT Signal': { bg: '#FFF7ED', color: '#D97706' },
};

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

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

const fmt = n => (n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n ?? 0));

// Icons
const IconX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>;
const IconIG      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>;
const IconYT      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42A2.78 2.78 0 0 0 20.6 4.46C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg>;
const IconWeb     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const IconPin     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconMsg     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconHeart   = ({ filled }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#E11D48' : 'none'} stroke={filled ? '#E11D48' : 'currentColor'} strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconComment = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconRepost  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>;
const IconShare   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

export default function ProfilePopup({ slug, onClose }) {
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [posts, setPosts]         = useState([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch('/api/profile/' + slug)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setData(d);
          setFollowing(!!d.isFollowing);
          setFollowerCount(d.profile?.followerCount ?? 0);
          setFollowingCount(d.profile?.followingCount ?? 0);
          setPosts((d.posts || []).map(p => ({
            id:           p.id,
            userId:       p.userId,
            postType:     p.postType || 'General',
            body:         p.content || '',
            attachmentUrl: p.imageUrl || null,
            time:         timeAgo(p.createdAt),
            likes:        p.likes || 0,
            liked:        false,
            reposts:      p.reposts || 0,
            reposted:     false,
            comments:     p._count?.comments || 0,
          })));
          // Separately verify follow status from the dedicated follow API
          // (profile API's embedded isFollowing can be stale/wrong due to session timing)
          if (d.profile?.id) {
            fetch('/api/social/follow?userId=' + d.profile.id)
              .then(r => r.json())
              .then(f => {
                if (!f.error) {
                  setFollowing(!!f.isFollowing);
                  setFollowerCount(f.followers ?? d.profile?.followerCount ?? 0);
                }
              })
              .catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleFollow = useCallback(async () => {
    if (!data?.profile?.id) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.profile.id }),
      });
      const d = await res.json();
      if (!d.error) {
        setFollowing(d.following);
        setFollowerCount(prev => prev + (d.following ? 1 : -1));
      }
    } catch {}
    setFollowLoading(false);
  }, [data]);

  const handleMessage = useCallback(() => {
    if (data?.profile?.id && typeof window !== 'undefined' && window.__openDM) {
      window.__openDM(data.profile.id);
    }
    onClose();
  }, [data, onClose]);

  const handleLike = useCallback(async (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
    try {
      await fetch('/api/social/posts/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
    } catch {}
  }, []);

  // Close on backdrop or Escape
  const handleBackdrop = useCallback(e => { if (e.target === e.currentTarget) onClose(); }, [onClose]);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const profile    = data?.profile;
  const isPrivate  = data?.isPrivate;
  const name       = profile?.displayName || profile?.profileSlug || 'Trader';
  const initials   = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const grad       = gradFromId(profile?.id || name);
  const avatarUrl  = profile?.image || null;

  const assets = Array.isArray(profile?.primaryAssets)
    ? profile.primaryAssets
    : (typeof profile?.primaryAssets === 'string' && profile.primaryAssets
        ? profile.primaryAssets.split(',').map(s => s.trim()).filter(Boolean)
        : []);

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Modal — Instagram-style: tall, scrollable */}
      <div style={{
        background: 'var(--bg)',
        border: '0.5px solid var(--border)',
        borderRadius: 20,
        width: '100%',
        maxWidth: 500,
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'var(--font)',
      }}>

        {/* ── Sticky close button ── */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 14, zIndex: 10,
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--surface2)', border: '0.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14,
          }}
        >✕</button>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Loading…
          </div>
        ) : !data || !profile ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            Profile not found
          </div>
        ) : (
          /* ── Single scrollable container (Instagram-style) ── */
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Top spacer so avatar isn't under close button */}
            <div style={{ height: 28 }} />

            {/* ── Profile header ── */}
            <div style={{ padding: '0 22px 18px', borderBottom: '0.5px solid var(--border)' }}>

              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: avatarUrl ? 'transparent' : grad,
                overflow: 'hidden', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 26, fontWeight: 500,
                color: '#fff', border: '3px solid var(--bg)', flexShrink: 0,
                marginBottom: 4,
              }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>

              {/* Name + handle + verified */}
              <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>{name}</div>
              {profile.profileSlug && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>@{profile.profileSlug}</div>
              )}
              {profile.verifiedBadge && (
                <div style={{ fontSize: 11, color: PURPLE, fontWeight: 600, marginTop: 2 }}>✓ Verified</div>
              )}

              {/* Follower / following counts */}
              <div style={{ display: 'flex', gap: 18, marginTop: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{fmt(posts.length)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>posts</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{fmt(followerCount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>followers</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{fmt(followingCount)}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>following</div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, marginTop: 10 }}>{profile.bio}</div>
              )}

              {/* Location */}
              {(profile.city || profile.country) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  <IconPin /> {[profile.city, profile.country].filter(Boolean).join(', ')}
                </div>
              )}

              {/* Trading style + asset pills */}
              {(profile.tradingStyle || assets.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                  {profile.tradingStyle && (
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 16, background: '#EEEDFE', color: PURPLE }}>
                      {profile.tradingStyle}
                    </span>
                  )}
                  {assets.map(a => (
                    <span key={a} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {/* Social links */}
              {(profile.twitterHandle || profile.instagramHandle || profile.youtubeHandle || profile.tradingviewHandle) && (
                <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                  {profile.twitterHandle && (
                    <a href={`https://x.com/${profile.twitterHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <IconX /> {profile.twitterHandle}
                    </a>
                  )}
                  {profile.instagramHandle && (
                    <a href={`https://instagram.com/${profile.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <IconIG /> {profile.instagramHandle}
                    </a>
                  )}
                  {profile.youtubeHandle && (
                    <a href={`https://youtube.com/@${profile.youtubeHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <IconYT /> {profile.youtubeHandle}
                    </a>
                  )}
                  {profile.tradingviewHandle && (
                    <a href={`https://tradingview.com/u/${profile.tradingviewHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <IconWeb /> {profile.tradingviewHandle}
                    </a>
                  )}
                </div>
              )}

              {/* Follow + Message buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    border: following ? '1px solid var(--border)' : 'none',
                    background: following ? 'var(--surface2)' : PURPLE,
                    color: following ? 'var(--text)' : '#fff',
                    transition: 'all 0.15s',
                  }}
                >
                  {followLoading ? '…' : following ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface2)',
                    color: 'var(--text)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <IconMsg /> Message
                </button>
              </div>
            </div>

            {/* ── Posts ── */}
            {isPrivate ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>This account is private</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Follow to see their posts.</div>
              </div>
            ) : (
              <div style={{ padding: '16px 16px 40px' }}>

                {/* Posts label */}
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                  Posts
                </div>

                {posts.length === 0 ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                    No posts yet.
                  </div>
                ) : posts.map(post => {
                  const ts = TYPE_COLORS[post.postType] || TYPE_COLORS['General'];
                  return (
                    <div key={post.id} style={{
                      marginBottom: 12, padding: '14px 16px',
                      borderRadius: 16, border: '0.5px solid var(--border)',
                      background: 'var(--surface)',
                    }}>
                      {/* Post header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: avatarUrl ? 'transparent' : grad,
                          overflow: 'hidden', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 12, fontWeight: 500,
                          color: '#fff', flexShrink: 0,
                        }}>
                          {avatarUrl
                            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : initials}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{name}</span>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: ts.bg, color: ts.color }}>
                              {post.postType}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {post.time}</span>
                          </div>
                          {profile.profileSlug && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{profile.profileSlug}</div>
                          )}
                        </div>
                        <span style={{ fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>···</span>
                      </div>

                      {/* Body */}
                      {post.body && (
                        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, marginBottom: post.attachmentUrl ? 10 : 0 }}>
                          {post.body}
                        </div>
                      )}

                      {/* Image */}
                      {post.attachmentUrl && (
                        <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', border: '0.5px solid var(--border)', display: 'inline-block', maxWidth: '100%' }}>
                          <img src={post.attachmentUrl} alt="" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 10 }}>
                        <button style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
                          <IconComment /> {fmt(post.comments)}
                        </button>
                        <button style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: post.reposted ? '#16A34A' : 'var(--text-muted)', cursor: 'pointer' }}>
                          <IconRepost /> {fmt(post.reposts)}
                        </button>
                        <button onClick={() => handleLike(post.id)} style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: post.liked ? '#E11D48' : 'var(--text-muted)', cursor: 'pointer' }}>
                          <IconHeart filled={post.liked} /> {fmt(post.likes)}
                        </button>
                        <button style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}>
                          <IconShare />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
