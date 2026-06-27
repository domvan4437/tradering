'use client'
import React, { useState, useEffect, useRef, useContext } from 'react'
import { UserAvatarContext } from './UserAvatarContext'

const PURPLE = '#4B44C8'
const COLORS = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#0284c7','#9333ea']
function getColor(n) { return COLORS[(n||'?').charCodeAt(0) % COLORS.length] }

// ── Trader profile modal ──────────────────────────────────────
function TraderProfile({ trader, onClose, onMessage, myAvatar, onViewProfile }) {
  const [following, setFollowing] = React.useState(false)
  const [followLoading, setFollowLoading] = React.useState(false)

  // Load current follow state
  React.useEffect(() => {
    if (!trader.isMe && trader.id) {
      fetch('/api/social/follow?userId=' + trader.id)
        .then(r => r.json())
        .then(d => { if (!d.error) setFollowing(!!d.isFollowing) })
        .catch(() => {})
    }
  }, [trader.id, trader.isMe])

  const handleFollow = async () => {
    setFollowLoading(true)
    try {
      const res = await fetch('/api/social/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: trader.id }),
      })
      const d = await res.json()
      if (!d.error) setFollowing(d.following)
    } catch {}
    setFollowLoading(false)
  }

  const initials = (trader.displayName||'T').slice(0,2).toUpperCase()
  const color = trader.isMe ? PURPLE : getColor(trader.displayName)
  const avatarImg = trader.isMe && myAvatar ? myAvatar : (trader.image || null)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'var(--bg,#18181b)', borderRadius:20, width:440, maxWidth:'95vw', boxShadow:'0 20px 60px rgba(0,0,0,0.4)', border:'1px solid var(--border,#27272a)', overflow:'hidden' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'20px 22px 22px' }}>
          {/* Avatar + close row */}
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
            {/* Clickable avatar → opens full ProfilePopup */}
            <div
              onClick={() => onViewProfile && onViewProfile(trader.profileSlug || trader.id)}
              title="View full profile"
              style={{ width:56, height:56, borderRadius:'50%', background: avatarImg ? 'transparent' : color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden', cursor: trader.isMe ? 'default' : 'pointer', position:'relative' }}>
              {avatarImg ? <img src={avatarImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginBottom:3 }}>
                <span
                  onClick={() => !trader.isMe && onViewProfile && onViewProfile(trader.profileSlug || trader.id)}
                  style={{ fontSize:16, fontWeight:700, color:'var(--text,#f4f4f5)', cursor: trader.isMe ? 'default' : 'pointer' }}>
                  {trader.displayName}
                </span>
                {trader.isMe && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(75,68,200,0.2)', color:PURPLE, fontWeight:600 }}>You</span>}
                {trader.openToMeetups && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:20, background:'rgba(5,150,105,0.15)', color:'#10b981', fontWeight:600 }}>Open to meetups</span>}
              </div>
              <div style={{ fontSize:12, color:'var(--text-muted,#71717a)', display:'flex', gap:8, flexWrap:'wrap' }}>
                {trader.username && <span>@{trader.username}</span>}
                {(trader.city || trader.country) && <span>📍 {[trader.city, trader.country].filter(Boolean).join(', ')}</span>}
                {trader.tradingStyle && <span>· {trader.tradingStyle}</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background:'var(--surface2,#27272a)', border:'1px solid var(--border,#3f3f46)', borderRadius:'50%', width:30, height:30, cursor:'pointer', color:'var(--text-muted,#71717a)', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>×</button>
          </div>

          {/* Bio */}
          {trader.bio && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted,#71717a)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>About</div>
              <p style={{ fontSize:13, color:'var(--text,#e4e4e7)', margin:0, lineHeight:1.6 }}>{trader.bio}</p>
            </div>
          )}

          {/* Assets */}
          {trader.assets?.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted,#71717a)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Trades</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {trader.assets.map(a => (
                  <span key={a} style={{ fontSize:12, padding:'4px 10px', borderRadius:20, background:'var(--surface2,#27272a)', color:'var(--text-muted,#a1a1aa)', border:'1px solid var(--border,#3f3f46)' }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Groups */}
          {trader.groups?.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted,#71717a)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>Groups</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {trader.groups.map(g => (
                  <div key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, border:'1px solid var(--border,#3f3f46)', background:'var(--surface2,#27272a)' }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{(g.name||'G')[0].toUpperCase()}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text,#f4f4f5)' }}>{g.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted,#71717a)' }}>{g.memberCount ? `${g.memberCount} members` : 'Public'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {!trader.isMe && (
            <div style={{ display:'flex', gap:8 }}>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{ flex:1, padding:'11px', background: following ? 'var(--surface2,#27272a)' : PURPLE, color: following ? 'var(--text,#f4f4f5)' : '#fff', border: following ? '1px solid var(--border,#3f3f46)' : 'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
                {followLoading ? '…' : following ? 'Following' : 'Follow'}
              </button>
              <button onClick={() => { onMessage(trader.id); onClose(); }}
                style={{ flex:1, padding:'11px', background:'transparent', color:'var(--text,#f4f4f5)', border:'1px solid var(--border,#3f3f46)', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function LocalTradersTab({ currentUserId, onNavigate }) {
  const myAvatar = useContext(UserAvatarContext)
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  const [traders, setTraders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [styleFilter, setStyleFilter] = useState('')
  const [meetupOnly, setMeetupOnly] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'map'
  const [mapReady, setMapReady] = useState(false)
  const [mapInited, setMapInited] = useState(false)

  // Load Leaflet when switching to map view
  useEffect(() => {
    if (view !== 'map' || typeof window === 'undefined') return
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
    if (window.L) { leafletRef.current = window.L; setMapReady(true); return }
    if (document.getElementById('leaflet-js')) return
    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => { leafletRef.current = window.L; setMapReady(true) }
    document.head.appendChild(script)
  }, [view])

  // Fetch traders
  useEffect(() => {
    fetch('/api/social/map')
      .then(r => r.json())
      .then(d => {
        if (d.traders) setTraders(d.traders)
        else setError(d.error || 'Failed to load traders')
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false))
  }, [])

  // Init map once Leaflet ready and map div mounted
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInited) return
    const L = leafletRef.current
    const map = L.map(mapRef.current, { center:[20,0], zoom:2, minZoom:2, maxZoom:14 })
    mapInstanceRef.current = map
    setMapInited(true)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom:19,
    }).addTo(map)
  }, [mapReady, mapInited])

  // Sync markers with filtered traders
  useEffect(() => {
    const map = mapInstanceRef.current
    const L = leafletRef.current
    if (!map || !L) return
    markersRef.current.forEach(m => map.removeLayer(m))
    markersRef.current = []
    filtered.forEach(t => {
      if (!t.lat || !t.lng) return
      const color = t.isMe ? PURPLE : getColor(t.displayName)
      const letter = (t.displayName||'T')[0].toUpperCase()
      const avatarImg = t.isMe && myAvatar ? myAvatar : (t.image || null)
      const icon = L.divIcon({
        className:'',
        html: avatarImg
          ? `<div style="width:36px;height:36px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);overflow:hidden;cursor:pointer"><img src="${avatarImg}" style="width:100%;height:100%;object-fit:cover" /></div>`
          : `<div style="width:36px;height:36px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;cursor:pointer;font-family:system-ui">${letter}</div>`,
        iconSize:[36,36], iconAnchor:[18,18],
      })
      const marker = L.marker([t.lat, t.lng], { icon })
        .addTo(map)
        .bindTooltip(`<b>${t.displayName}</b><br>${[t.city,t.country].filter(Boolean).join(', ')}`, {
          direction:'top', offset:[0,-22], className:'tr-map-tooltip',
        })
        .on('click', () => setSelected(t))
      markersRef.current.push(marker)
    })
  }, [traders, search, countryFilter, styleFilter, meetupOnly, mapInited])

  // Invalidate map size when switching to map view
  useEffect(() => {
    if (view === 'map' && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100)
    }
  }, [view])

  const filtered = traders.filter(t => {
    if (meetupOnly && !t.openToMeetups) return false
    if (countryFilter && t.country !== countryFilter) return false
    if (styleFilter && t.tradingStyle !== styleFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (t.displayName||'').toLowerCase().includes(q) ||
        (t.username||'').toLowerCase().includes(q) ||
        (t.city||'').toLowerCase().includes(q) ||
        (t.country||'').toLowerCase().includes(q)
      )
    }
    return true
  })

  const countries = [...new Set(traders.map(t => t.country).filter(Boolean))].sort()
  const styles = [...new Set(traders.map(t => t.tradingStyle).filter(Boolean))].sort()

  const handleMessage = (userId) => {
    if (window.__openDM) window.__openDM(userId)
    if (onNavigate) onNavigate('dms')
  }

  const sel = { padding:'6px 10px', borderRadius:8, border:'1px solid var(--border,#3f3f46)', background:'var(--surface2,#27272a)', color:'var(--text,#f4f4f5)', fontSize:12, fontFamily:'var(--font,system-ui)', cursor:'pointer', outline:'none' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font,system-ui)', overflow:'hidden' }}>
      <style>{`
        .tr-map-tooltip { background:rgba(15,15,20,0.95)!important; border:1px solid rgba(255,255,255,0.1)!important; border-radius:10px!important; color:#f4f4f5!important; font-size:12px!important; padding:7px 11px!important; box-shadow:0 4px 16px rgba(0,0,0,0.4)!important; white-space:nowrap; pointer-events:none; }
        .tr-map-tooltip::before { display:none!important; }
        .leaflet-control-zoom a { background:var(--surface,#18181b)!important; color:var(--text,#f4f4f5)!important; border-color:var(--border,#3f3f46)!important; }
        .leaflet-control-attribution { font-size:9px!important; opacity:0.4; }
        .tr-row:hover { background:var(--surface2,#27272a) !important; }
      `}</style>

      {selected && <TraderProfile
        trader={selected}
        onClose={() => setSelected(null)}
        onMessage={handleMessage}
        myAvatar={myAvatar}
        onViewProfile={slug => { if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug) }}
      />}

      {/* Top bar */}
      <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border,#27272a)', flexShrink:0 }}>
        {/* Search + toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:10 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:8, background:'var(--surface2,#27272a)', border:'1px solid var(--border,#3f3f46)', borderRadius:10, padding:'8px 12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted,#71717a)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, or country…"
              style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font,system-ui)', fontSize:13, color:'var(--text,#f4f4f5)', outline:'none' }}
            />
            {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted,#71717a)', fontSize:18, lineHeight:1, padding:0 }}>×</button>}
          </div>
          {/* List / Map toggle */}
          <div style={{ display:'flex', background:'var(--surface2,#27272a)', border:'1px solid var(--border,#3f3f46)', borderRadius:10, padding:3, gap:2 }}>
            {[['list','☰ List'],['map','⊙ Map']].map(([v,label]) => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding:'6px 14px', borderRadius:7, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap',
                  background: view===v ? PURPLE : 'transparent',
                  color: view===v ? '#fff' : 'var(--text-muted,#71717a)',
                  transition:'all .15s',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={sel}>
            <option value="">All countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={styleFilter} onChange={e => setStyleFilter(e.target.value)} style={sel}>
            <option value="">All styles</option>
            {styles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setMeetupOnly(m => !m)}
            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid var(--border,#3f3f46)', background: meetupOnly ? 'rgba(16,185,129,0.15)' : 'var(--surface2,#27272a)', color: meetupOnly ? '#10b981' : 'var(--text-muted,#71717a)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            📍 Open to meetups
          </button>
          <span style={{ fontSize:12, color:'var(--text-muted,#71717a)', marginLeft:'auto' }}>
            {loading ? 'Loading…' : `${filtered.length} trader${filtered.length!==1?'s':''}`}
          </span>
        </div>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading && (
            <div style={{ padding:40, textAlign:'center', fontSize:13, color:'var(--text-muted,#71717a)' }}>Loading traders…</div>
          )}
          {!loading && error && (
            <div style={{ padding:20, margin:16, borderRadius:10, background:'rgba(220,38,38,0.1)', border:'1px solid rgba(220,38,38,0.2)', fontSize:13, color:'#f87171', textAlign:'center' }}>{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding:40, textAlign:'center', fontSize:13, color:'var(--text-muted,#71717a)' }}>
              {search || countryFilter || styleFilter || meetupOnly ? 'No traders match your filters.' : 'No traders with locations set yet.'}
            </div>
          )}
          {filtered.map(t => {
            const color = t.isMe ? PURPLE : getColor(t.displayName)
            const initials = (t.displayName||'T').slice(0,2).toUpperCase()
            const avatarImg = t.isMe && myAvatar ? myAvatar : (t.image || null)
            return (
              <div key={t.id} className="tr-row"
                onClick={() => setSelected(t)}
                style={{ display:'flex', alignItems:'center', gap:13, padding:'13px 16px', borderBottom:'1px solid var(--border,#27272a)', cursor:'pointer', transition:'background .1s' }}>
                {/* Avatar */}
                <div style={{ width:44, height:44, borderRadius:'50%', background: avatarImg ? 'transparent' : color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0, boxShadow: t.isMe ? `0 0 0 2.5px var(--surface), 0 0 0 4.5px ${color}` : 'none', overflow:'hidden' }}>
                  {avatarImg ? <img src={avatarImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : initials}
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:14, fontWeight:600, color:'var(--text,#f4f4f5)' }}>{t.displayName}</span>
                    {t.username && <span style={{ fontSize:12, color:'var(--text-muted,#71717a)' }}>@{t.username}</span>}
                    {t.isMe && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'rgba(75,68,200,0.2)', color:PURPLE, fontWeight:600 }}>You</span>}
                    {t.openToMeetups && <span style={{ fontSize:11, padding:'1px 7px', borderRadius:20, background:'rgba(16,185,129,0.12)', color:'#10b981', fontWeight:600 }}>Meetups</span>}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted,#71717a)', display:'flex', gap:10, flexWrap:'wrap' }}>
                    {(t.city || t.country) && <span>📍 {[t.city, t.country].filter(Boolean).join(', ')}</span>}
                    {t.tradingStyle && <span>· {t.tradingStyle}</span>}
                    {t.assets?.length > 0 && <span>· {t.assets.slice(0,2).join(', ')}{t.assets.length > 2 ? ` +${t.assets.length-2}` : ''}</span>}
                  </div>
                </div>
                {/* Message button */}
                {!t.isMe && (
                  <button onClick={e => { e.stopPropagation(); handleMessage(t.id) }}
                    style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${PURPLE}`, background:'transparent', color:PURPLE, fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 }}>
                    Message
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MAP VIEW */}
      {view === 'map' && (
        <div style={{ flex:1, position:'relative', minHeight:0 }}>
          <div ref={mapRef} style={{ width:'100%', height:'100%', minHeight:400 }} />
          {!mapInited && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface2,#27272a)', fontSize:13, color:'var(--text-muted,#71717a)', zIndex:10 }}>
              Loading map…
            </div>
          )}
          <div style={{ position:'absolute', bottom:16, left:14, zIndex:1000, background:'rgba(15,15,20,0.85)', backdropFilter:'blur(6px)', padding:'5px 12px', borderRadius:20, fontSize:12, color:'#d4d4d8', pointerEvents:'none', border:'1px solid rgba(255,255,255,0.1)' }}>
            {filtered.filter(t => t.lat).length} traders on map
          </div>
        </div>
      )}
    </div>
  )
}
