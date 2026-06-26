'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'

const PURPLE = '#534AB7'

const TRADING_STYLES = ['Scalper','Day trader','Swing trader','Position trader','Macro trader','Investor']

const ASSET_OPTIONS = [
  'Gold','Silver','Copper','Crude Oil','Natural Gas','Platinum','Palladium',
  'Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle',
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF','NZD/USD',
  'S&P 500','Nasdaq','Dow Jones','Russell 2000',
  'Bitcoin','Ethereum','Solana','BNB','XRP',
  'AAPL','NVDA','TSLA','SPY','QQQ',
]

const TYPE_COLORS = {
  'General':    { bg: '#F3F4F6', color: '#6B7280' },
  'Idea':       { bg: '#ECFDF5', color: '#059669' },
  'Screener':   { bg: '#F5F3FF', color: '#7C3AED' },
  'Strategy':   { bg: '#EEF2FF', color: '#4F46E5' },
  'COT Signal': { bg: '#FFF7ED', color: '#D97706' },
}

const GRADS = [
  'linear-gradient(135deg,#4f46e5,#7c3aed)',
  'linear-gradient(135deg,#0ea5e9,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
]
function gradFromId(id) {
  if (!id) return GRADS[0]
  let n = 0
  for (let i = 0; i < id.length; i++) n += id.charCodeAt(i)
  return GRADS[n % GRADS.length]
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

const IconComment = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconRepost  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
const IconHeart   = ({ filled }) => <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#E11D48' : 'none'} stroke={filled ? '#E11D48' : 'currentColor'} strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IconShare   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
const IconX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.254 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
const IconIG      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/></svg>
const IconYT      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22.54 6.42A2.78 2.78 0 0 0 20.6 4.46C18.88 4 12 4 12 4s-6.88 0-8.6.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.4 19.54C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/></svg>
const IconWeb     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
const IconPin     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IconCamera  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>

// ── Edit View ────────────────────────────────────────────────────
function EditView({ profile, setProfile, avatarUrl, onAvatarChange, onSave, onCancel, saved, toggleAsset }) {
  const fileRef = useRef(null)
  const inp = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }
  const card = { background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginBottom: 14 }
  const sec  = { fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font)', padding: '18px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>Edit profile</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)' }}>Cancel</button>
          <button onClick={onSave} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: saved ? '#16a34a' : PURPLE, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
      </div>

      {/* Avatar upload in edit view */}
      <div style={card}>
        <div style={sec}>Profile photo</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 64, height: 64, cursor: 'pointer', flexShrink: 0 }} onClick={() => fileRef.current?.click()}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#534AB7,#7c3aed)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 500, color: '#fff', border: '2px solid var(--border)' }}>
              {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (profile.displayName?.[0] || 'T').toUpperCase()}
            </div>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <IconCamera />
            </div>
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} style={{ padding: '6px 14px', borderRadius: 8, border: '0.5px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', display: 'block', marginBottom: 6 }}>Upload photo</button>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>JPG or PNG, max 2MB</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Public info</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={lbl}>Display name</label>
            <input style={inp} value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label style={lbl}>Profile URL</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', overflow: 'hidden' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '7px 0 7px 10px', whiteSpace: 'nowrap' }}>tradezar.com/p/</span>
              <input value={profile.slug} onChange={e => setProfile(p => ({ ...p, slug: e.target.value }))} placeholder="your-name" style={{ flex: 1, padding: '7px 10px 7px 0', border: 'none', background: 'transparent', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }} />
            </div>
          </div>
        </div>
        <div>
          <label style={lbl}>Bio</label>
          <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell other traders about your approach and edge..." style={{ ...inp, resize: 'vertical', minHeight: 68 }} />
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Location</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={lbl}>City</label>
            <input style={inp} value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="New York" />
          </div>
          <div>
            <label style={lbl}>Country</label>
            <input style={inp} value={profile.country} onChange={e => setProfile(p => ({ ...p, country: e.target.value }))} placeholder="United States" />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Trading identity</div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Trading style</label>
          <select value={profile.tradingStyle} onChange={e => setProfile(p => ({ ...p, tradingStyle: e.target.value }))} style={inp}>
            <option value="">Not specified</option>
            {TRADING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label style={{ ...lbl, marginBottom: 8 }}>Primary assets <span style={{ color: 'var(--text-muted)' }}>({profile.primaryAssets.length}/5)</span></label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {ASSET_OPTIONS.map(a => {
              const sel = profile.primaryAssets.includes(a)
              return (
                <button key={a} onClick={() => toggleAsset(a)}
                  style={{ fontSize: 10, fontWeight: sel ? 500 : 400, padding: '3px 8px', borderRadius: 4, border: `0.5px solid ${sel ? 'rgba(83,74,183,0.3)' : 'var(--border2)'}`, background: sel ? 'rgba(83,74,183,0.1)' : 'transparent', color: sel ? PURPLE : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  {a}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={sec}>Social links</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { key: 'twitter',   label: 'X / Twitter',  placeholder: '@handle' },
            { key: 'instagram', label: 'Instagram',     placeholder: '@handle' },
            { key: 'youtube',   label: 'YouTube',       placeholder: 'youtube.com/c/...' },
            { key: 'website',   label: 'Website',       placeholder: 'yoursite.com' },
          ].map(f => (
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ paddingBottom: 40 }} />
    </div>
  )
}

// ── Main ProfileTab ──────────────────────────────────────────────
export default function ProfileTab({ user }) {
  const [editing,   setEditing]   = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [posts,     setPosts]     = useState([])
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarHover, setAvatarHover] = useState(false)
  const fileRef = useRef(null)

  const [profile, setProfile] = useState({
    displayName: user?.name || '',
    slug: user?.username || (user?.name || '').toLowerCase().replace(/\s+/g, '') || '',
    bio: '',
    tradingStyle: '',
    city: '',
    country: '',
    primaryAssets: [],
    twitter: '',
    instagram: '',
    youtube: '',
    website: '',
  })

  // Load saved profile from DB on mount
  useEffect(() => {
    fetch('/api/profile/update')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          setProfile(prev => ({
            ...prev,
            displayName:  data.name       || prev.displayName,
            slug:         data.username   || prev.slug,
            bio:          data.bio        || '',
            tradingStyle: data.tradingStyle || '',
            city:         data.city       || '',
            country:      data.country    || '',
            primaryAssets: data.primaryAssets || [],
            twitter:      data.twitter    || '',
            instagram:    data.instagram  || '',
            youtube:      data.youtube    || '',
            website:      data.website    || '',
          }))
        }
      })
      .catch(() => {})
  }, [])

  const fetchPosts = useCallback(async () => {
    try {
      const res  = await fetch('/api/social/posts?tab=discover')
      const data = await res.json()
      if (data.posts) {
        setPosts(
          data.posts
            .filter(p => p.userId === user?.id)
            .map(p => ({
              id:            p.id,
              body:          p.content || p.body || '',
              postType:      p.postType || p.type || 'General',
              time:          timeAgo(p.createdAt),
              likes:         p.likes || 0,
              liked:         p.liked || false,
              comments:      p.commentsCount || 0,
              reposts:       p.reposts || 0,
              reposted:      p.reposted || false,
              attachmentUrl: p.imageUrl || null,
            }))
        )
      }
    } catch(e) {}
  }, [user?.id])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setAvatarUrl(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleLike = async (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    try { await fetch('/api/social/posts/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: id }) }) } catch(e) {}
  }

  const toggleAsset = (a) => {
    setProfile(p => ({
      ...p,
      primaryAssets: p.primaryAssets.includes(a)
        ? p.primaryAssets.filter(x => x !== a)
        : p.primaryAssets.length < 5 ? [...p.primaryAssets, a] : p.primaryAssets,
    }))
  }

  const handleSave = async () => {
    try {
      await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          profile.displayName,
          username:      profile.slug,
          bio:           profile.bio,
          tradingStyle:  profile.tradingStyle,
          city:          profile.city,
          country:       profile.country,
          primaryAssets: profile.primaryAssets,
          twitter:       profile.twitter,
          instagram:     profile.instagram,
          youtube:       profile.youtube,
          website:       profile.website,
        }),
      })
    } catch(e) {}
    setSaved(true)
    setTimeout(() => { setSaved(false); setEditing(false) }, 1500)
  }

  const name     = profile.displayName || user?.name || 'Trader'
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const grad     = gradFromId(user?.id || name)
  const fmt      = n => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : n

  if (editing) {
    return (
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <EditView
          profile={profile} setProfile={setProfile}
          avatarUrl={avatarUrl} onAvatarChange={handleAvatarChange}
          onSave={handleSave} onCancel={() => setEditing(false)}
          saved={saved} toggleAsset={toggleAsset}
        />
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', fontFamily: 'var(--font)', background: 'var(--bg)' }}>

      {/* White top space — no gradient */}
      <div style={{ height: 32, background: 'var(--bg)', position: 'relative' }}>
        <button onClick={() => setEditing(true)}
          style={{ position: 'absolute', top: 10, right: 14, background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text)', fontSize: 11, padding: '4px 12px', borderRadius: 16, cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 4 }}>
          ✎ Edit profile
        </button>
      </div>

      {/* Info */}
      <div style={{ padding: '0 22px 18px', borderBottom: '0.5px solid var(--border)' }}>

        {/* Avatar with upload on hover */}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        <div
          style={{ position: 'relative', width: 66, height: 66, cursor: 'pointer', marginBottom: -10, transform: 'translateY(-10px)' }}
          onClick={() => fileRef.current?.click()}
          onMouseEnter={() => setAvatarHover(true)}
          onMouseLeave={() => setAvatarHover(false)}>
          <div style={{ width: 66, height: 66, borderRadius: '50%', background: avatarUrl ? 'transparent' : grad, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 23, fontWeight: 500, color: '#fff', border: '3px solid var(--bg)', flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          {avatarHover && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: '#fff' }}>
              <IconCamera />
              <span style={{ fontSize: 8, fontWeight: 500, lineHeight: 1.2, textAlign: 'center' }}>Upload</span>
            </div>
          )}
        </div>

        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginTop: 8 }}>{name}</div>
        {profile.slug && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>@{profile.slug}</div>}

        <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text)', fontWeight: 500 }}>0</strong> followers</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text)', fontWeight: 500 }}>0</strong> following</span>
        </div>

        {profile.bio ? (
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginTop: 8 }}>{profile.bio}</div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 8, fontStyle: 'italic' }}>No bio yet — click Edit profile to add one.</div>
        )}

        {(profile.city || profile.country) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7, fontSize: 12, color: 'var(--text-muted)' }}>
            <IconPin /> {[profile.city, profile.country].filter(Boolean).join(', ')}
          </div>
        )}

        {(profile.tradingStyle || profile.primaryAssets.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 9 }}>
            {profile.tradingStyle && (
              <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 16, background: '#EEEDFE', color: PURPLE }}>{profile.tradingStyle}</span>
            )}
            {profile.primaryAssets.map(a => (
              <span key={a} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: 'var(--surface2)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>{a}</span>
            ))}
          </div>
        )}

        {(profile.twitter || profile.instagram || profile.youtube || profile.website) && (
          <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
            {profile.twitter && (
              <a href={`https://x.com/${profile.twitter.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <IconX /> {profile.twitter}
              </a>
            )}
            {profile.instagram && (
              <a href={`https://instagram.com/${profile.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <IconIG /> {profile.instagram}
              </a>
            )}
            {profile.youtube && (
              <a href={profile.youtube.startsWith('http') ? profile.youtube : `https://${profile.youtube}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <IconYT /> {profile.youtube}
              </a>
            )}
            {profile.website && (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>
                <IconWeb /> {profile.website}
              </a>
            )}
          </div>
        )}

        {/* Follow / Message — purple, below all info */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', border: 'none', background: PURPLE, color: '#fff' }}>
            Follow
          </button>
          <button style={{ flex: 1, padding: '8px 0', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', border: 'none', background: PURPLE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Message
          </button>
        </div>
      </div>

      {/* Posts — half-width centered column */}
      <div style={{ padding: '12px 22px 8px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Posts
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 12px' }}>
        {posts.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
            No posts yet — share ideas in the Community tab.
          </div>
        ) : posts.map(post => {
          const ts = TYPE_COLORS[post.postType] || TYPE_COLORS['General']
          return (
            <div key={post.id} style={{ marginBottom: 10, padding: '13px 15px', borderRadius: 18, border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarUrl ? 'transparent' : grad, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10, background: ts.bg, color: ts.color }}>{post.postType}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {post.time}</span>
                  </div>
                  {profile.slug && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{profile.slug}</div>}
                </div>
                <span style={{ fontSize: 15, color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>···</span>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: post.attachmentUrl ? 9 : 0 }}>
                {post.body}
              </div>

              {/* True-size image — natural dimensions, not stretched */}
              {post.attachmentUrl && (
                <div style={{ marginBottom: 9, borderRadius: 10, overflow: 'hidden', border: '0.5px solid var(--border)', display: 'inline-block', maxWidth: '100%' }}>
                  <img
                    src={post.attachmentUrl}
                    alt=""
                    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                  />
                </div>
              )}

              {/* Flat action buttons */}
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
                <button style={{ all: 'unset', display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}>
                  <IconShare />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ paddingBottom: 40 }} />
    </div>
  )
}
