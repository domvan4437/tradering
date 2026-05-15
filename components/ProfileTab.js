'use client'
import React, { useState, useEffect } from 'react'

const PURPLE = '#4B44C8'

const TRADING_STYLES = ['Scalper','Day trader','Swing trader','Position trader','Macro trader','Investor']

const ASSET_OPTIONS = [
  'Gold','Silver','Copper','Crude Oil','Natural Gas','Platinum','Palladium',
  'Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle',
  'EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','USD/CHF','NZD/USD',
  'S&P 500','Nasdaq','Dow Jones','Russell 2000',
  'Bitcoin','Ethereum','Solana','BNB','XRP',
  'AAPL','NVDA','TSLA','SPY','QQQ',
]

function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = [PURPLE, '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font)', fontSize: size * 0.34, fontWeight: 600, color: '#fff', flexShrink: 0, border: `3px solid var(--bg)`, boxShadow: `0 0 0 2px ${color}` }}>
      {initials}
    </div>
  )
}

function RepBar({ label, value, max = 100, color = PURPLE, note }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 500, color }}>{typeof value === 'number' && max === 100 ? `${value}/100` : value}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{note}</div>}
    </div>
  )
}

export default function ProfileTab({ user }) {
  const [profile, setProfile] = useState({
    displayName: user?.name || '',
    slug: '',
    bio: '',
    tradingStyle: '',
    visibility: 'public',
    primaryAssets: [],
    twitter: '',
    youtube: '',
    tradingview: '',
    website: '',
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Mock stats — will come from real data later
  const stats = {
    winRate: null,
    trades: 0,
    avgRR: null,
    followers: 0,
    communityScore: null,
    contentScore: null,
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function toggleAsset(a) {
    setProfile(p => ({
      ...p,
      primaryAssets: p.primaryAssets.includes(a)
        ? p.primaryAssets.filter(x => x !== a)
        : p.primaryAssets.length < 5 ? [...p.primaryAssets, a] : p.primaryAssets,
    }))
  }

  const tabs = ['Profile', 'Analytics', 'Community', 'Trade Log', 'Monetization', 'Settings']

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 14, minHeight: 'calc(100vh - 82px)' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 0, paddingLeft: 24 }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t.toLowerCase())}
            style={{ fontSize: 12, padding: '8px 14px', color: activeTab === t.toLowerCase() ? PURPLE : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === t.toLowerCase() ? PURPLE : 'transparent'}`, background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.toLowerCase() ? PURPLE : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: 'calc(100vh - 140px)' }}>

          {/* LEFT SIDEBAR */}
          <div style={{ borderRight: '0.5px solid var(--border)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Avatar + name */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 16, borderBottom: '0.5px solid var(--border)' }}>
              <Avatar name={profile.displayName || user?.name || 'U'} size={72} />
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', textAlign: 'center' }}>{profile.displayName || user?.name || 'Your name'}</div>
              {profile.slug && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>tradering.com/p/{profile.slug}</div>}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                {stats.trades >= 50 ? (
                  <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: 'rgba(75,68,200,0.12)', color: '#3C3489', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verified track record</span>
                ) : (
                  <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 7px', borderRadius: 3, background: 'var(--surface2)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unverified</span>
                )}
              </div>
            </div>

            {/* Trading style */}
            {profile.tradingStyle && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Trading style</div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: 'rgba(75,68,200,0.1)', color: PURPLE }}>{profile.tradingStyle}</span>
              </div>
            )}

            {/* Primary assets */}
            {profile.primaryAssets.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Primary assets</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {profile.primaryAssets.map(a => (
                    <span key={a} style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text-muted)' }}>{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Reputation */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Reputation</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <RepBar
                  label="Trade accuracy"
                  value={stats.winRate !== null ? `${stats.winRate}%` : '—'}
                  pct={stats.winRate || 0}
                  color="#16a34a"
                  note={stats.trades > 0 ? `${stats.trades} public trades` : 'No trades yet'}
                />
                <RepBar label="Community score" value={stats.communityScore || 0} color={PURPLE} note="Followers + engagement" />
                <RepBar label="Content quality" value={stats.contentScore || 0} color={PURPLE} note="Upvotes and saves" />
              </div>
            </div>

            <button
              onClick={handleSave}
              style={{ marginTop: 'auto', width: '100%', padding: '9px', background: saved ? '#16a34a' : PURPLE, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.2s' }}>
              {saved ? '✓ Saved' : 'Save profile'}
            </button>
          </div>

          {/* RIGHT CONTENT */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

            {/* Public info */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Public info</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Display name</div>
                  <input value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="Your name" style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Profile URL</div>
                  <div style={{ display: 'flex', alignItems: 'center', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', overflow: 'hidden' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', padding: '7px 0 7px 10px', whiteSpace: 'nowrap' }}>tradering.com/p/</span>
                    <input value={profile.slug} onChange={e => setProfile(p => ({ ...p, slug: e.target.value }))}
                      placeholder="your-name" style={{ flex: 1, padding: '7px 10px 7px 0', border: 'none', background: 'transparent', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }} />
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Bio</div>
                <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell other traders about your approach, experience, and edge..."
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Trade performance */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Trade performance (public)</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {[
                  { label: 'Win rate',     value: stats.winRate !== null ? `${stats.winRate}%` : '—', color: stats.winRate ? '#16a34a' : 'var(--text-muted)' },
                  { label: 'Public trades',value: stats.trades || '—', color: 'var(--text)' },
                  { label: 'Avg R:R',      value: stats.avgRR !== null ? stats.avgRR : '—', color: 'var(--text)' },
                  { label: 'Followers',    value: stats.followers || '—', color: 'var(--text)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 500, color: s.color, marginBottom: 3 }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6 }}>
                Your trade performance is calculated automatically from public trade ideas you post. The more you share, the more your track record builds — and the more transparent your profile becomes to followers.
              </div>
            </div>

            {/* Trading identity */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Trading identity</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Trading style</div>
                  <select value={profile.tradingStyle} onChange={e => setProfile(p => ({ ...p, tradingStyle: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                    <option value="">Not specified</option>
                    {TRADING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Profile visibility</div>
                  <select value={profile.visibility} onChange={e => setProfile(p => ({ ...p, visibility: e.target.value }))}
                    style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                    <option value="public">Public — visible on leaderboards</option>
                    <option value="invite">Invite only — share via link</option>
                    <option value="private">Private — only you</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Primary assets <span style={{ color: 'var(--text-dim)' }}>({profile.primaryAssets.length}/5 selected)</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {ASSET_OPTIONS.map(a => {
                    const sel = profile.primaryAssets.includes(a)
                    return (
                      <button key={a} onClick={() => toggleAsset(a)}
                        style={{ fontSize: 10, fontWeight: sel ? 500 : 400, padding: '3px 8px', borderRadius: 4, border: `0.5px solid ${sel ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: sel ? 'rgba(75,68,200,0.1)' : 'transparent', color: sel ? PURPLE : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Social links */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Social links</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'twitter',     label: 'Twitter / X',  placeholder: '@handle' },
                  { key: 'youtube',     label: 'YouTube',       placeholder: 'youtube.com/c/...' },
                  { key: 'tradingview', label: 'TradingView',   placeholder: 'tradingview.com/u/...' },
                  { key: 'website',     label: 'Website',       placeholder: 'yoursite.com' },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{f.label}</div>
                    <input value={profile[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Account info */}
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Account info</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {[
                  { label: 'Email',        value: user?.email || '—' },
                  { label: 'Plan',         value: 'Free' },
                  { label: 'Member since', value: '—' },
                  { label: 'Username',     value: user?.name || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ paddingBottom: 40 }} />
          </div>
        </div>
      )}

      {activeTab !== 'profile' && (
        <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{tabs.find(t => t.toLowerCase() === activeTab)}</div>
          Coming soon — this section is being built out.
        </div>
      )}
    </div>
  )
}
