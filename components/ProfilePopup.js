'use client';
import { useState, useEffect, useCallback } from 'react';

const PURPLE = '#534AB7';

function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];
  const color = colors[(name || 'T').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ProfilePopup({ slug, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch('/api/profile/' + slug)
      .then(r => r.json())
      .then(d => {
        if (!d.error) { setData(d); setFollowing(d.isFollowing); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleFollow = useCallback(async () => {
    if (!data) return;
    setFollowLoading(true);
    try {
      const res = await fetch('/api/social/follow', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: data.profile.id }) });
      const d = await res.json();
      setFollowing(d.following);
      setData(prev => ({ ...prev, profile: { ...prev.profile, followerCount: prev.profile.followerCount + (d.following ? 1 : -1) } }));
    } catch {}
    setFollowLoading(false);
  }, [data]);

  // Close on backdrop click
  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const profile = data?.profile;
  const posts = data?.posts || [];
  const ownedGroups = data?.ownedGroups || [];
  const memberGroups = data?.memberGroups || [];
  const allGroups = [...ownedGroups, ...memberGroups];
  const isPrivate = data?.isPrivate;

  const groupColors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#7c3aed', '#dc2626'];

  return (
    <div
      onClick={handleBackdrop}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 400, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 0' }}>
          <div style={{ width: 28 }} />
          <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            {profile?.profileSlug || profile?.displayName || ''}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16, lineHeight: 1 }}>
            {String.fromCharCode(215)}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading...</div>
        ) : !data ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Profile not found</div>
        ) : (
          <>
            <div style={{ padding: '14px 16px 0' }}>
              {/* Avatar + counts row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
                <Avatar name={profile.displayName} size={76} />
                <div style={{ display: 'flex', flex: 1 }}>
                  {[
                    { num: posts.length, label: 'Posts' },
                    { num: profile.followerCount || 0, label: 'Followers' },
                    { num: profile.followingCount || 0, label: 'Following' },
                  ].map(({ num, label }) => (
                    <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{num}</div>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Name + bio */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{profile.displayName || 'Trader'}</span>
                  {profile.verifiedBadge && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: PURPLE }}>{'✓'} Verified</span>
                  )}
                </div>
                {profile.bio && (
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{profile.bio}</div>
                )}
              </div>

              {/* Groups */}
              {allGroups.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Groups</div>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                    {allGroups.slice(0, 6).map((g, i) => {
                      const color = groupColors[i % groupColors.length];
                      const initials = (g.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                      return (
                        <div key={g.id} style={{ flexShrink: 0, textAlign: 'center', width: 62 }}>
                          <div style={{ width: 54, height: 54, borderRadius: 16, background: color + '18', border: '2px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color }}>
                            {initials}
                          </div>
                          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Follow + Message buttons */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: following ? 'var(--surface2)' : PURPLE, color: following ? 'var(--text)' : '#fff', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer', border: following ? '1px solid var(--border)' : 'none' }}
                >
                  {followLoading ? '...' : following ? 'Following' : 'Follow'}
                </button>
                <button style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Message
                </button>
              </div>
            </div>

            {/* Private wall */}
            {isPrivate ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{'🔒'}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>This account is private</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>Follow to see their posts</div>
              </div>
            ) : (
              <>
                {/* Tab bar */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {[{ id: 'posts', icon: '⋮⋮⋮' }, { id: 'saved', icon: '🔖' }].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      style={{ flex: 1, padding: '10px 0', background: 'none', border: 'none', borderBottom: activeTab === t.id ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer', fontSize: 18, marginBottom: -1 }}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>

                {/* Posts grid */}
                {posts.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>No posts yet</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    {posts.slice(0, 9).map((post, i) => (
                      <div
                        key={post.id}
                        style={{ aspectRatio: '1', background: i % 2 === 0 ? 'var(--surface2)' : 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, overflow: 'hidden', position: 'relative' }}
                      >
                        {post.imageUrl ? (
                          <img src={post.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <>
                            {post.assetTag && <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{post.assetTag}</div>}
                            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>{(post.content || '').slice(0, 40)}</div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
