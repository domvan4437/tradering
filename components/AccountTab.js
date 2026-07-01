'use client'
import React, { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import ProfileTab from './ProfileTab'

const PURPLE = '#4B44C8'

function Card({ children, style }) {
  return <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 16px', ...style }}>{children}</div>
}
function Card2({ children, style }) {
  return <div style={{ background: 'var(--surface2)', borderRadius: 7, padding: '10px 12px', ...style }}>{children}</div>
}
function SH({ children, color }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: color || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{children}</div>
}
function Row({ label, value, valueColor, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value && <span style={{ fontWeight: 500, color: valueColor || 'var(--text)' }}>{value}</span>}
        {action}
      </div>
    </div>
  )
}
function MiniBar({ data }) {
  const max = Math.max(...data)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${(v / max) * 100}%`, borderRadius: '3px 3px 0 0', background: i === data.length - 1 ? PURPLE : 'rgba(75,68,200,0.15)' }} />
      ))}
    </div>
  )
}
function RepBar({ label, value, pct, color, note }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 500, color }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 3 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  )
}
function BtnP({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '7px 14px', background: PURPLE, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}
function BtnS({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-muted)', border: '0.5px solid var(--border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}

// ─── BROKER HELPERS ───────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function PlatformForm({ fields, onConnect, connecting, error, signupUrl, signupLabel, helpText }) {
  const [values, setValues] = React.useState(() => Object.fromEntries(fields.map(f => [f.key, ''])))
  const set = (k, v) => setValues(prev => ({ ...prev, [k]: v }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      {helpText && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{helpText}</div>}
      {fields.map(f => (
        <input key={f.key} value={values[f.key]} onChange={e => set(f.key, e.target.value)}
          type={f.secret ? 'password' : 'text'} placeholder={f.label}
          style={{ padding: '9px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'monospace', fontSize: 12, color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
        />
      ))}
      {error && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#ef4444' }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onConnect(values)} disabled={connecting}
          style={{ flex: 1, padding: '9px 14px', background: connecting ? 'var(--surface2)' : '#534AB7', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {connecting ? <><i className="ti ti-loader-2 animate-spin" /> Connecting…</> : <><i className="ti ti-plug-connected" /> Connect</>}
        </button>
        {signupUrl && (
          <a href={signupUrl} target="_blank" rel="noopener noreferrer"
            style={{ padding: '9px 12px', background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <i className="ti ti-external-link" style={{ fontSize: 13 }} /> {signupLabel || 'Sign Up'}
          </a>
        )}
      </div>
    </div>
  )
}

function PlaidConnectButton({ onSuccess }) {
  const [linkToken, setLinkToken] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  React.useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then(r => r.json()).then(d => { if (d.link_token) setLinkToken(d.link_token) }).catch(() => {})
  }, [])
  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    setLoading(true)
    try {
      const res = await fetch('/api/plaid/exchange-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_token, institution_name: metadata.institution?.name, institution_id: metadata.institution?.institution_id, accounts: metadata.accounts }) })
      const data = await res.json()
      if (data.success) onSuccess?.()
      else alert('Connection failed: ' + (data.error || 'Unknown error'))
    } catch (e) { alert('Connection failed: ' + e.message) }
    setLoading(false)
  }, [onSuccess])
  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess: onPlaidSuccess })
  return (
    <button onClick={() => open()} disabled={!ready || loading}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: (!ready || loading) ? 'not-allowed' : 'pointer', opacity: (!ready || loading) ? 0.6 : 1, flexShrink: 0 }}>
      <i className="ti ti-plug-connected" />
      {loading ? 'Connecting…' : 'Connect'}
    </button>
  )
}

function ConnectionPanel({ connections, onSynced }) {
  const [expanded, setExpanded] = React.useState(null)
  const [connecting, setConnecting] = React.useState(null)
  const [syncing, setSyncing] = React.useState(null)
  const [errors, setErrors] = React.useState({})
  const [demoing, setDemoing] = React.useState(false)
  const hasDemo = connections?.some(c => c.broker === 'demo')
  const loadDemo = async () => {
    setDemoing(true)
    try {
      await fetch('/api/broker/demo', { method: hasDemo ? 'DELETE' : 'POST' })
      if (!hasDemo) await fetch('/api/broker/demo', { method: 'POST' })
      onSynced?.()
    } catch {}
    setDemoing(false)
  }
  const conn = (broker) => connections?.find(c => c.broker === broker)
  const has  = (broker) => !!conn(broker)
  const setErr = (id, msg) => setErrors(prev => ({ ...prev, [id]: msg }))
  const connectAndSync = async (id, connectUrl, syncUrl, body) => {
    setConnecting(id); setErr(id, '')
    try {
      const res  = await fetch(connectUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { setErr(id, data.error || 'Connection failed'); setConnecting(null); return }
      await fetch(syncUrl, { method: 'POST' })
      onSynced?.(); setExpanded(null)
    } catch { setErr(id, 'Network error') }
    setConnecting(null)
  }
  const syncBroker = async (id, syncUrl) => {
    setSyncing(id)
    try { await fetch(syncUrl, { method: 'POST' }); onSynced?.() } catch {}
    setSyncing(null)
  }
  const PLATFORMS = [
    { id: 'alpaca_paper', name: 'Alpaca', tag: 'Stocks · ETFs · Crypto', icon: 'ti-chart-line', color: '#FFBE00', signupUrl: 'https://app.alpaca.markets/paper-trading/overview', signupLabel: 'Free Account', helpText: 'alpaca.markets → Paper Trading → API Keys → Generate Key', fields: [{ key: 'keyId', label: 'API Key ID  (starts with PK…)' }, { key: 'secretKey', label: 'Secret Key', secret: true }], onConnect: (v) => connectAndSync('alpaca_paper', '/api/broker/alpaca/connect', '/api/broker/alpaca/sync', { keyId: v.keyId, secretKey: v.secretKey, paper: true }), onSync: () => syncBroker('alpaca_paper', '/api/broker/alpaca/sync') },
    { id: 'oanda_practice', name: 'OANDA', tag: 'Forex · Gold · Oil · Indices', icon: 'ti-currency-dollar', color: '#E85D26', signupUrl: 'https://www.oanda.com/us-en/trading/try-free-demo/', signupLabel: 'Free Demo', helpText: 'oanda.com → My Account → Manage API Access → Generate token.', fields: [{ key: 'token', label: 'API Token' }, { key: 'accountId', label: 'Account ID  (e.g. 001-001-XXXXXXX-001)' }], onConnect: (v) => connectAndSync('oanda_practice', '/api/broker/oanda/connect', '/api/broker/oanda/sync', { token: v.token, accountId: v.accountId }), onSync: () => syncBroker('oanda_practice', '/api/broker/oanda/sync') },
    { id: 'binance_testnet', name: 'Binance Testnet', tag: 'Crypto Spot', icon: 'ti-currency-bitcoin', color: '#F3BA2F', signupUrl: 'https://testnet.binance.vision/', signupLabel: 'Get Keys', helpText: 'Go to testnet.binance.vision → Log in with GitHub → Generate HMAC key.', fields: [{ key: 'apiKey', label: 'API Key' }, { key: 'secret', label: 'Secret Key', secret: true }], onConnect: (v) => connectAndSync('binance_testnet', '/api/broker/binance/connect', '/api/broker/binance/sync', { apiKey: v.apiKey, secret: v.secret }), onSync: () => syncBroker('binance_testnet', '/api/broker/binance/sync') },
    { id: 'bybit_testnet', name: 'Bybit Testnet', tag: 'Crypto · Perp Futures · Inverse', icon: 'ti-chart-bar', color: '#F7A600', signupUrl: 'https://testnet.bybit.com/', signupLabel: 'Free Testnet', helpText: 'testnet.bybit.com → Account & Security → API Management → Create Key.', fields: [{ key: 'apiKey', label: 'API Key' }, { key: 'secret', label: 'API Secret', secret: true }], onConnect: (v) => connectAndSync('bybit_testnet', '/api/broker/bybit/connect', '/api/broker/bybit/sync', { apiKey: v.apiKey, secret: v.secret }), onSync: () => syncBroker('bybit_testnet', '/api/broker/bybit/sync') },
    { id: 'okx_demo', name: 'OKX Demo', tag: 'Crypto · Options · Futures · Spot', icon: 'ti-circle-letter-o', color: '#000000', signupUrl: 'https://www.okx.com/account/users/personal-center/demo-trading/create-api-key', signupLabel: 'Demo API Keys', helpText: 'okx.com → Demo Trading mode → Account → API Management → Create API Key.', fields: [{ key: 'apiKey', label: 'API Key' }, { key: 'secret', label: 'Secret Key', secret: true }, { key: 'passphrase', label: 'Passphrase', secret: true }], onConnect: (v) => connectAndSync('okx_demo', '/api/broker/okx/connect', '/api/broker/okx/sync', { apiKey: v.apiKey, secret: v.secret, passphrase: v.passphrase }), onSync: () => syncBroker('okx_demo', '/api/broker/okx/sync') },
    { id: 'plaid', name: 'Real Broker Account', tag: 'Robinhood · Fidelity · Coinbase · Schwab & more', icon: 'ti-building-bank', color: '#534AB7', isPlaid: true, onSync: () => syncBroker('plaid', '/api/broker/sync') },
  ]
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connect your trading account</div>
        <button onClick={loadDemo} disabled={demoing}
          style={{ padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 11, color: hasDemo ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer' }}>
          {demoing ? '…' : hasDemo ? 'Clear Demo' : '✦ Try Demo'}
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PLATFORMS.map(p => {
          const isConnected = has(p.id); const c = conn(p.id); const isExpanded = expanded === p.id; const isSyncing = syncing === p.id; const isConnecting = connecting === p.id
          return (
            <div key={p.id} style={{ background: 'var(--surface2)', border: `1px solid ${isConnected ? p.color + '44' : 'var(--border)'}`, borderRadius: 11, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: p.color + '18', border: `1px solid ${p.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${p.icon}`} style={{ fontSize: 18, color: p.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.name}{isConnected && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Connected</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{isConnected ? `Last sync: ${timeAgo(c?.lastSynced)}` : p.tag}</div>
                </div>
                {isConnected ? (
                  <button onClick={() => p.onSync()} disabled={isSyncing} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>
                    <i className={`ti ti-refresh${isSyncing ? ' animate-spin' : ''}`} />{isSyncing ? 'Syncing…' : 'Sync'}
                  </button>
                ) : p.isPlaid ? (
                  <PlaidConnectButton onSuccess={() => { onSynced?.() }} />
                ) : (
                  <button onClick={() => setExpanded(isExpanded ? null : p.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: isExpanded ? p.color : 'transparent', color: isExpanded ? '#fff' : p.color, border: `1px solid ${p.color}55`, borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    {isExpanded ? 'Cancel' : 'Connect'}
                  </button>
                )}
              </div>
              {!p.isPlaid && isExpanded && !isConnected && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--border)' }}>
                  <PlatformForm fields={p.fields} onConnect={p.onConnect} connecting={isConnecting} error={errors[p.id]} signupUrl={p.signupUrl} signupLabel={p.signupLabel} helpText={p.helpText} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
// ── Profile Tab ────────────────────────────────────────────────
function OverviewTab({ user }) {
  const [editing, setEditing] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState('')
  const [profile, setProfile] = React.useState(() => {
    try {
      const s = typeof window !== 'undefined' ? localStorage.getItem('tr_profile_v1') : null
      return s ? JSON.parse(s) : {}
    } catch { return {} }
  })

  // Fetch real profile from DB on mount
  React.useEffect(() => {
    fetch('/api/profile/update').then(r => r.json()).then(d => {
      if (d.user) {
        const u = d.user
        const merged = {
          displayName: u.displayName || u.name || '',
          username: u.username || '',
          tagline: u.tagline || '',
          bio: u.bio || '',
          country: u.country || '',
          city: u.city || '',
          tradingStyle: u.tradingStyle || '',
          experience: u.experience || '',
          assets: u.primaryAssets ? u.primaryAssets.split(',').map(s => s.trim()).filter(Boolean) : [],
          openToMeetups: !!u.openToMeetups,
          openToMentoring: !!u.openToMentoring,
          twitter: u.twitter || '',
          youtube: u.youtube || '',
          website: u.website || '',
          instagram: u.instagram || '',
          publicWinRate: u.publicWinRate !== false,
          publicPnl: u.publicPnl !== false,
          publicTrades: u.publicTrades !== false,
          publicLocation: u.publicLocation !== false,
        }
        setProfile(merged)
        setForm(merged)
        try { localStorage.setItem('tr_profile_v1', JSON.stringify(merged)) } catch {}
      }
    }).catch(() => {})
  }, [])

  const [form, setForm] = React.useState({
    displayName: profile.displayName || user?.name || '',
    username: profile.username || user?.email?.split('@')[0] || '',
    tagline: profile.tagline || '',
    bio: profile.bio || '',
    country: profile.country || '',
    city: profile.city || '',
    tradingStyle: profile.tradingStyle || '',
    experience: profile.experience || '',
    assets: profile.assets || [],
    openToMeetups: profile.openToMeetups || false,
    openToMentoring: profile.openToMentoring || false,
    twitter: profile.twitter || '',
    youtube: profile.youtube || '',
    website: profile.website || '',
    instagram: profile.instagram || '',
    publicWinRate: profile.publicWinRate !== false,
    publicPnl: profile.publicPnl !== false,
    publicTrades: profile.publicTrades !== false,
    publicLocation: profile.publicLocation !== false,
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleAsset = (a) => setForm(f => ({
    ...f,
    assets: f.assets.includes(a) ? f.assets.filter(x => x !== a) : [...f.assets, a]
  }))

  const save = async () => {
    setSaving(true)
    setSaveError('')
    try {
      const body = {
        displayName: form.displayName,
        username: form.username,
        tagline: form.tagline,
        bio: form.bio,
        country: form.country,
        city: form.city,
        tradingStyle: form.tradingStyle,
        experience: form.experience,
        primaryAssets: form.assets.join(', '),
        openToMeetups: form.openToMeetups,
        openToMentoring: form.openToMentoring,
        twitter: form.twitter,
        youtube: form.youtube,
        website: form.website,
        instagram: form.instagram,
        publicWinRate: form.publicWinRate,
        publicPnl: form.publicPnl,
        publicTrades: form.publicTrades,
        publicLocation: form.publicLocation,
      }
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setSaveError(d.error || 'Save failed')
        setSaving(false)
        return
      }
    } catch (e) {
      setSaveError('Network error')
      setSaving(false)
      return
    }
    try { localStorage.setItem('tr_profile_v1', JSON.stringify(form)) } catch {}
    setProfile(form)
    setEditing(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const ASSETS_LIST = ['Gold','Silver','Crude Oil','Natural Gas','Wheat','Corn','Soybeans','EUR/USD','GBP/USD','AUD/USD','USD/JPY','ES Futures','NQ Futures','Bitcoin','Ethereum','Stocks']
  const STYLES = ['Swing','Scalp','Position','Seasonal','Day trade']
  const LEVELS = ['Beginner','Intermediate','Advanced','Professional']
  const P = '#4B44C8'

  const inpStyle = { width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid var(--border2,#d1d5db)', background:'var(--surface2,#f9fafb)', color:'var(--text,#111)', fontSize:13, fontFamily:'var(--font,system-ui)', outline:'none', boxSizing:'border-box' }
  const labelStyle = { fontSize:11, fontWeight:500, color:'var(--text-muted,#6b7280)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5, display:'block' }
  const sectionStyle = { background:'var(--surface,#fff)', border:'0.5px solid var(--border,#e5e7eb)', borderRadius:12, padding:'18px 20px', marginBottom:14 }
  const sectionTitle = { fontSize:12, fontWeight:600, color:'var(--text-muted,#9ca3af)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }

  // Journal stats
  const trades = React.useMemo(() => {
    try { const d = localStorage.getItem('tr_journal_v3_trades'); return d ? JSON.parse(d) : [] } catch { return [] }
  }, [])
  const winRate = trades.length ? Math.round(trades.filter(t => parseFloat(t.pnl) > 0).length / trades.length * 100) : null
  const totalPnl = trades.reduce((s, t) => s + (parseFloat(t.pnl) || 0), 0)

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '20px 20px 40px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ fontSize:18, fontWeight:600, color:'var(--text,#111)' }}>My Profile</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {saved && <span style={{ fontSize:12, color:'#059669' }}>✓ Saved</span>}
          {saveError && <span style={{ fontSize:12, color:'#dc2626' }}>{saveError}</span>}
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setSaveError('') }} style={{ padding:'7px 16px', background:'transparent', color:'var(--text-muted,#6b7280)', border:'0.5px solid var(--border,#e5e7eb)', borderRadius:8, fontSize:13, cursor:'pointer', fontFamily:'var(--font,system-ui)' }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'7px 16px', background:P, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:saving?'default':'pointer', opacity:saving?0.7:1, fontFamily:'var(--font,system-ui)' }}>{saving ? 'Saving…' : 'Save profile'}</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={{ padding:'7px 16px', background:P, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'var(--font,system-ui)' }}>Edit profile</button>
          )}
        </div>
      </div>

      {/* Avatar + name preview */}
      <div style={{ ...sectionStyle, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${P},#7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, fontWeight:700, color:'#fff', flexShrink:0 }}>
          {(form.displayName || form.username || 'T')[0].toUpperCase()}
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:18, fontWeight:600, color:'var(--text,#111)', marginBottom:2 }}>{form.displayName || 'Your name'}</div>
          <div style={{ fontSize:13, color:'var(--text-muted,#6b7280)', marginBottom:3 }}>@{form.username || 'username'}</div>
          {form.tagline && <div style={{ fontSize:13, color:'var(--text-muted,#6b7280)', fontStyle:'italic' }}>{form.tagline}</div>}
          <div style={{ display:'flex', gap:8, marginTop:6, flexWrap:'wrap' }}>
            {form.tradingStyle && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(75,68,200,0.1)', color:P }}>{form.tradingStyle}</span>}
            {form.experience && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--surface2,#f3f4f6)', color:'var(--text-muted,#6b7280)' }}>{form.experience}</span>}
            {form.city && form.publicLocation && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'var(--surface2,#f3f4f6)', color:'var(--text-muted,#6b7280)' }}>📍 {form.city}</span>}
            {form.openToMeetups && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(5,150,105,0.1)', color:'#059669' }}>Open to meetups</span>}
            {form.openToMentoring && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:'rgba(217,119,6,0.1)', color:'#d97706' }}>Open to mentoring</span>}
          </div>
        </div>
        {/* Track record stats */}
        <div style={{ display:'flex', gap:12, flexShrink:0 }}>
          {form.publicWinRate && winRate !== null && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:600, color:'#16a34a' }}>{winRate}%</div>
              <div style={{ fontSize:10, color:'var(--text-muted,#9ca3af)', textTransform:'uppercase' }}>Win rate</div>
            </div>
          )}
          {form.publicTrades && trades.length > 0 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:600, color:'var(--text,#111)' }}>{trades.length}</div>
              <div style={{ fontSize:10, color:'var(--text-muted,#9ca3af)', textTransform:'uppercase' }}>Trades</div>
            </div>
          )}
          {form.publicPnl && trades.length > 0 && (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:600, color: totalPnl >= 0 ? '#16a34a' : '#dc2626' }}>{totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}</div>
              <div style={{ fontSize:10, color:'var(--text-muted,#9ca3af)', textTransform:'uppercase' }}>Net P&L</div>
            </div>
          )}
        </div>
      </div>

      {!editing && <div style={{ fontSize:11, color:'var(--text-muted,#9ca3af)', textAlign:'center', marginTop:-8, marginBottom:6 }}>Click <strong style={{color:'#4B44C8'}}>Edit profile</strong> to make changes</div>}
      {/* Identity */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Identity</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div>
            <label style={labelStyle}>Display name</label>
            <input style={inpStyle} value={form.displayName} onChange={e=>set('displayName',e.target.value)} disabled={!editing} placeholder="Your full name or alias" />
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input style={inpStyle} value={form.username} onChange={e=>set('username',e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,''))} disabled={!editing} placeholder="yourhandle" />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelStyle}>Tagline</label>
            <input style={inpStyle} value={form.tagline} onChange={e=>set('tagline',e.target.value)} disabled={!editing} placeholder="e.g. COT-based commodity trader · 4 years" />
          </div>
          <div style={{ gridColumn:'1/-1' }}>
            <label style={labelStyle}>Bio</label>
            <textarea style={{ ...inpStyle, height:80, resize:'vertical' }} value={form.bio} onChange={e=>set('bio',e.target.value)} disabled={!editing} placeholder="Tell other traders about yourself, your approach, and what you're looking for..." />
          </div>
        </div>
      </div>

      {/* Location & style */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Trading background</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={labelStyle}>Country</label>
            <select style={inpStyle} value={form.country} onChange={e=>set('country',e.target.value)} disabled={!editing}>
              <option value="">Select country</option>
              <option key="Afghanistan" value="Afghanistan">🇦🇫 Afghanistan</option>
                <option key="Albania" value="Albania">🇦🇱 Albania</option>
                <option key="Algeria" value="Algeria">🇩🇿 Algeria</option>
                <option key="Andorra" value="Andorra">🇦🇩 Andorra</option>
                <option key="Angola" value="Angola">🇦🇴 Angola</option>
                <option key="Antigua and Barbuda" value="Antigua and Barbuda">🇦🇬 Antigua and Barbuda</option>
                <option key="Argentina" value="Argentina">🇦🇷 Argentina</option>
                <option key="Armenia" value="Armenia">🇦🇲 Armenia</option>
                <option key="Australia" value="Australia">🇦🇺 Australia</option>
                <option key="Austria" value="Austria">🇦🇹 Austria</option>
                <option key="Azerbaijan" value="Azerbaijan">🇦🇿 Azerbaijan</option>
                <option key="Bahamas" value="Bahamas">🇧🇸 Bahamas</option>
                <option key="Bahrain" value="Bahrain">🇧🇭 Bahrain</option>
                <option key="Bangladesh" value="Bangladesh">🇧🇩 Bangladesh</option>
                <option key="Barbados" value="Barbados">🇧🇧 Barbados</option>
                <option key="Belarus" value="Belarus">🇧🇾 Belarus</option>
                <option key="Belgium" value="Belgium">🇧🇪 Belgium</option>
                <option key="Belize" value="Belize">🇧🇿 Belize</option>
                <option key="Benin" value="Benin">🇧🇯 Benin</option>
                <option key="Bhutan" value="Bhutan">🇧🇹 Bhutan</option>
                <option key="Bolivia" value="Bolivia">🇧🇴 Bolivia</option>
                <option key="Bosnia and Herzegovina" value="Bosnia and Herzegovina">🇧🇦 Bosnia and Herzegovina</option>
                <option key="Botswana" value="Botswana">🇧🇼 Botswana</option>
                <option key="Brazil" value="Brazil">🇧🇷 Brazil</option>
                <option key="Brunei" value="Brunei">🇧🇳 Brunei</option>
                <option key="Bulgaria" value="Bulgaria">🇧🇬 Bulgaria</option>
                <option key="Burkina Faso" value="Burkina Faso">🇧🇫 Burkina Faso</option>
                <option key="Burundi" value="Burundi">🇧🇮 Burundi</option>
                <option key="Cabo Verde" value="Cabo Verde">🇨🇻 Cabo Verde</option>
                <option key="Cambodia" value="Cambodia">🇰🇭 Cambodia</option>
                <option key="Cameroon" value="Cameroon">🇨🇲 Cameroon</option>
                <option key="Canada" value="Canada">🇨🇦 Canada</option>
                <option key="Central African Republic" value="Central African Republic">🇨🇫 Central African Republic</option>
                <option key="Chad" value="Chad">🇹🇩 Chad</option>
                <option key="Chile" value="Chile">🇨🇱 Chile</option>
                <option key="China" value="China">🇨🇳 China</option>
                <option key="Colombia" value="Colombia">🇨🇴 Colombia</option>
                <option key="Comoros" value="Comoros">🇰🇲 Comoros</option>
                <option key="Congo" value="Congo">🇨🇬 Congo</option>
                <option key="Costa Rica" value="Costa Rica">🇨🇷 Costa Rica</option>
                <option key="Croatia" value="Croatia">🇭🇷 Croatia</option>
                <option key="Cuba" value="Cuba">🇨🇺 Cuba</option>
                <option key="Cyprus" value="Cyprus">🇨🇾 Cyprus</option>
                <option key="Czech Republic" value="Czech Republic">🇨🇿 Czech Republic</option>
                <option key="Denmark" value="Denmark">🇩🇰 Denmark</option>
                <option key="Djibouti" value="Djibouti">🇩🇯 Djibouti</option>
                <option key="Dominica" value="Dominica">🇩🇲 Dominica</option>
                <option key="Dominican Republic" value="Dominican Republic">🇩🇴 Dominican Republic</option>
                <option key="Ecuador" value="Ecuador">🇪🇨 Ecuador</option>
                <option key="Egypt" value="Egypt">🇪🇬 Egypt</option>
                <option key="El Salvador" value="El Salvador">🇸🇻 El Salvador</option>
                <option key="Equatorial Guinea" value="Equatorial Guinea">🇬🇶 Equatorial Guinea</option>
                <option key="Eritrea" value="Eritrea">🇪🇷 Eritrea</option>
                <option key="Estonia" value="Estonia">🇪🇪 Estonia</option>
                <option key="Eswatini" value="Eswatini">🇸🇿 Eswatini</option>
                <option key="Ethiopia" value="Ethiopia">🇪🇹 Ethiopia</option>
                <option key="Fiji" value="Fiji">🇫🇯 Fiji</option>
                <option key="Finland" value="Finland">🇫🇮 Finland</option>
                <option key="France" value="France">🇫🇷 France</option>
                <option key="Gabon" value="Gabon">🇬🇦 Gabon</option>
                <option key="Gambia" value="Gambia">🇬🇲 Gambia</option>
                <option key="Georgia" value="Georgia">🇬🇪 Georgia</option>
                <option key="Germany" value="Germany">🇩🇪 Germany</option>
                <option key="Ghana" value="Ghana">🇬🇭 Ghana</option>
                <option key="Greece" value="Greece">🇬🇷 Greece</option>
                <option key="Grenada" value="Grenada">🇬🇩 Grenada</option>
                <option key="Guatemala" value="Guatemala">🇬🇹 Guatemala</option>
                <option key="Guinea" value="Guinea">🇬🇳 Guinea</option>
                <option key="Guinea-Bissau" value="Guinea-Bissau">🇬🇼 Guinea-Bissau</option>
                <option key="Guyana" value="Guyana">🇬🇾 Guyana</option>
                <option key="Haiti" value="Haiti">🇭🇹 Haiti</option>
                <option key="Honduras" value="Honduras">🇭🇳 Honduras</option>
                <option key="Hong Kong" value="Hong Kong">🇭🇰 Hong Kong</option>
                <option key="Hungary" value="Hungary">🇭🇺 Hungary</option>
                <option key="Iceland" value="Iceland">🇮🇸 Iceland</option>
                <option key="India" value="India">🇮🇳 India</option>
                <option key="Indonesia" value="Indonesia">🇮🇩 Indonesia</option>
                <option key="Iran" value="Iran">🇮🇷 Iran</option>
                <option key="Iraq" value="Iraq">🇮🇶 Iraq</option>
                <option key="Ireland" value="Ireland">🇮🇪 Ireland</option>
                <option key="Israel" value="Israel">🇮🇱 Israel</option>
                <option key="Italy" value="Italy">🇮🇹 Italy</option>
                <option key="Jamaica" value="Jamaica">🇯🇲 Jamaica</option>
                <option key="Japan" value="Japan">🇯🇵 Japan</option>
                <option key="Jordan" value="Jordan">🇯🇴 Jordan</option>
                <option key="Kazakhstan" value="Kazakhstan">🇰🇿 Kazakhstan</option>
                <option key="Kenya" value="Kenya">🇰🇪 Kenya</option>
                <option key="Kiribati" value="Kiribati">🇰🇮 Kiribati</option>
                <option key="Kuwait" value="Kuwait">🇰🇼 Kuwait</option>
                <option key="Kyrgyzstan" value="Kyrgyzstan">🇰🇬 Kyrgyzstan</option>
                <option key="Laos" value="Laos">🇱🇦 Laos</option>
                <option key="Latvia" value="Latvia">🇱🇻 Latvia</option>
                <option key="Lebanon" value="Lebanon">🇱🇧 Lebanon</option>
                <option key="Lesotho" value="Lesotho">🇱🇸 Lesotho</option>
                <option key="Liberia" value="Liberia">🇱🇷 Liberia</option>
                <option key="Libya" value="Libya">🇱🇾 Libya</option>
                <option key="Liechtenstein" value="Liechtenstein">🇱🇮 Liechtenstein</option>
                <option key="Lithuania" value="Lithuania">🇱🇹 Lithuania</option>
                <option key="Luxembourg" value="Luxembourg">🇱🇺 Luxembourg</option>
                <option key="Macau" value="Macau">🇲🇴 Macau</option>
                <option key="Madagascar" value="Madagascar">🇲🇬 Madagascar</option>
                <option key="Malawi" value="Malawi">🇲🇼 Malawi</option>
                <option key="Malaysia" value="Malaysia">🇲🇾 Malaysia</option>
                <option key="Maldives" value="Maldives">🇲🇻 Maldives</option>
                <option key="Mali" value="Mali">🇲🇱 Mali</option>
                <option key="Malta" value="Malta">🇲🇹 Malta</option>
                <option key="Marshall Islands" value="Marshall Islands">🇲🇭 Marshall Islands</option>
                <option key="Mauritania" value="Mauritania">🇲🇷 Mauritania</option>
                <option key="Mauritius" value="Mauritius">🇲🇺 Mauritius</option>
                <option key="Mexico" value="Mexico">🇲🇽 Mexico</option>
                <option key="Micronesia" value="Micronesia">🇫🇲 Micronesia</option>
                <option key="Moldova" value="Moldova">🇲🇩 Moldova</option>
                <option key="Monaco" value="Monaco">🇲🇨 Monaco</option>
                <option key="Mongolia" value="Mongolia">🇲🇳 Mongolia</option>
                <option key="Montenegro" value="Montenegro">🇲🇪 Montenegro</option>
                <option key="Morocco" value="Morocco">🇲🇦 Morocco</option>
                <option key="Mozambique" value="Mozambique">🇲🇿 Mozambique</option>
                <option key="Myanmar" value="Myanmar">🇲🇲 Myanmar</option>
                <option key="Namibia" value="Namibia">🇳🇦 Namibia</option>
                <option key="Nauru" value="Nauru">🇳🇷 Nauru</option>
                <option key="Nepal" value="Nepal">🇳🇵 Nepal</option>
                <option key="Netherlands" value="Netherlands">🇳🇱 Netherlands</option>
                <option key="New Zealand" value="New Zealand">🇳🇿 New Zealand</option>
                <option key="Nicaragua" value="Nicaragua">🇳🇮 Nicaragua</option>
                <option key="Niger" value="Niger">🇳🇪 Niger</option>
                <option key="Nigeria" value="Nigeria">🇳🇬 Nigeria</option>
                <option key="North Korea" value="North Korea">🇰🇵 North Korea</option>
                <option key="North Macedonia" value="North Macedonia">🇲🇰 North Macedonia</option>
                <option key="Norway" value="Norway">🇳🇴 Norway</option>
                <option key="Oman" value="Oman">🇴🇲 Oman</option>
                <option key="Pakistan" value="Pakistan">🇵🇰 Pakistan</option>
                <option key="Palau" value="Palau">🇵🇼 Palau</option>
                <option key="Panama" value="Panama">🇵🇦 Panama</option>
                <option key="Papua New Guinea" value="Papua New Guinea">🇵🇬 Papua New Guinea</option>
                <option key="Paraguay" value="Paraguay">🇵🇾 Paraguay</option>
                <option key="Peru" value="Peru">🇵🇪 Peru</option>
                <option key="Philippines" value="Philippines">🇵🇭 Philippines</option>
                <option key="Poland" value="Poland">🇵🇱 Poland</option>
                <option key="Portugal" value="Portugal">🇵🇹 Portugal</option>
                <option key="Puerto Rico" value="Puerto Rico">🇵🇷 Puerto Rico</option>
                <option key="Qatar" value="Qatar">🇶🇦 Qatar</option>
                <option key="Romania" value="Romania">🇷🇴 Romania</option>
                <option key="Russia" value="Russia">🇷🇺 Russia</option>
                <option key="Rwanda" value="Rwanda">🇷🇼 Rwanda</option>
                <option key="Saint Kitts and Nevis" value="Saint Kitts and Nevis">🇰🇳 Saint Kitts and Nevis</option>
                <option key="Saint Lucia" value="Saint Lucia">🇱🇨 Saint Lucia</option>
                <option key="Saint Vincent" value="Saint Vincent">🇻🇨 Saint Vincent</option>
                <option key="Samoa" value="Samoa">🇼🇸 Samoa</option>
                <option key="San Marino" value="San Marino">🇸🇲 San Marino</option>
                <option key="Sao Tome and Principe" value="Sao Tome and Principe">🇸🇹 Sao Tome and Principe</option>
                <option key="Saudi Arabia" value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                <option key="Senegal" value="Senegal">🇸🇳 Senegal</option>
                <option key="Serbia" value="Serbia">🇷🇸 Serbia</option>
                <option key="Seychelles" value="Seychelles">🇸🇨 Seychelles</option>
                <option key="Sierra Leone" value="Sierra Leone">🇸🇱 Sierra Leone</option>
                <option key="Singapore" value="Singapore">🇸🇬 Singapore</option>
                <option key="Slovakia" value="Slovakia">🇸🇰 Slovakia</option>
                <option key="Slovenia" value="Slovenia">🇸🇮 Slovenia</option>
                <option key="Solomon Islands" value="Solomon Islands">🇸🇧 Solomon Islands</option>
                <option key="Somalia" value="Somalia">🇸🇴 Somalia</option>
                <option key="South Africa" value="South Africa">🇿🇦 South Africa</option>
                <option key="South Sudan" value="South Sudan">🇸🇸 South Sudan</option>
                <option key="Spain" value="Spain">🇪🇸 Spain</option>
                <option key="Sri Lanka" value="Sri Lanka">🇱🇰 Sri Lanka</option>
                <option key="Sudan" value="Sudan">🇸🇩 Sudan</option>
                <option key="Suriname" value="Suriname">🇸🇷 Suriname</option>
                <option key="Sweden" value="Sweden">🇸🇪 Sweden</option>
                <option key="Switzerland" value="Switzerland">🇨🇭 Switzerland</option>
                <option key="Syria" value="Syria">🇸🇾 Syria</option>
                <option key="Taiwan" value="Taiwan">🇹🇼 Taiwan</option>
                <option key="Tajikistan" value="Tajikistan">🇹🇯 Tajikistan</option>
                <option key="Tanzania" value="Tanzania">🇹🇿 Tanzania</option>
                <option key="Thailand" value="Thailand">🇹🇭 Thailand</option>
                <option key="Timor-Leste" value="Timor-Leste">🇹🇱 Timor-Leste</option>
                <option key="Togo" value="Togo">🇹🇬 Togo</option>
                <option key="Tonga" value="Tonga">🇹🇴 Tonga</option>
                <option key="Trinidad and Tobago" value="Trinidad and Tobago">🇹🇹 Trinidad and Tobago</option>
                <option key="Tunisia" value="Tunisia">🇹🇳 Tunisia</option>
                <option key="Turkey" value="Turkey">🇹🇷 Turkey</option>
                <option key="Turkmenistan" value="Turkmenistan">🇹🇲 Turkmenistan</option>
                <option key="Tuvalu" value="Tuvalu">🇹🇻 Tuvalu</option>
                <option key="Uganda" value="Uganda">🇺🇬 Uganda</option>
                <option key="Ukraine" value="Ukraine">🇺🇦 Ukraine</option>
                <option key="United Arab Emirates" value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                <option key="United Kingdom" value="United Kingdom">🇬🇧 United Kingdom</option>
                <option key="United States" value="United States">🇺🇸 United States</option>
                <option key="Uruguay" value="Uruguay">🇺🇾 Uruguay</option>
                <option key="Uzbekistan" value="Uzbekistan">🇺🇿 Uzbekistan</option>
                <option key="Vanuatu" value="Vanuatu">🇻🇺 Vanuatu</option>
                <option key="Venezuela" value="Venezuela">🇻🇪 Venezuela</option>
                <option key="Vietnam" value="Vietnam">🇻🇳 Vietnam</option>
                <option key="Yemen" value="Yemen">🇾🇪 Yemen</option>
                <option key="Zambia" value="Zambia">🇿🇲 Zambia</option>
                <option key="Zimbabwe" value="Zimbabwe">🇿🇼 Zimbabwe</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>City (opt-in)</label>
            <input style={inpStyle} value={form.city} onChange={e=>set('city',e.target.value)} disabled={!editing} placeholder="St. Louis, MO" />
          </div>
          <div>
            <label style={labelStyle}>Trading style</label>
            <select style={inpStyle} value={form.tradingStyle} onChange={e=>set('tradingStyle',e.target.value)} disabled={!editing}>
              <option value="">Select style</option>
              {STYLES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Experience level</label>
            <select style={inpStyle} value={form.experience} onChange={e=>set('experience',e.target.value)} disabled={!editing}>
              <option value="">Select level</option>
              {LEVELS.map(l=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Assets traded</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {ASSETS_LIST.map(a => (
              <button key={a} onClick={() => editing && toggleAsset(a)}
                style={{ padding:'4px 10px', borderRadius:20, border:'none', fontSize:11, fontWeight:500, cursor: editing ? 'pointer' : 'default',
                  background: form.assets.includes(a) ? 'rgba(75,68,200,0.12)' : 'var(--surface2,#f3f4f6)',
                  color: form.assets.includes(a) ? P : 'var(--text-muted,#6b7280)',
                  fontFamily:'var(--font,system-ui)' }}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Social preferences */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Community preferences</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { key:'openToMeetups', label:'Open to local meetups', desc:'Show up in the Local Traders discovery tab and let nearby traders know you\'re open to meeting up.' },
            { key:'openToMentoring', label:'Open to mentoring', desc:'Let other traders know you\'re willing to mentor or be mentored.' },
          ].map(item => (
            <div key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text,#111)', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:11, color:'var(--text-muted,#6b7280)', lineHeight:1.4 }}>{item.desc}</div>
              </div>
              <div onClick={() => editing && set(item.key, !form[item.key])}
                style={{ width:40, height:22, borderRadius:11, background: form[item.key] ? P : 'var(--border,#d1d5db)', cursor: editing ? 'pointer' : 'default', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form[item.key] ? 21 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Links & contact</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            { key:'twitter', label:'Twitter / X', placeholder:'@yourhandle' },
            { key:'instagram', label:'Instagram', placeholder:'@yourhandle' },
            { key:'youtube', label:'YouTube', placeholder:'youtube.com/@yourchannel' },
            { key:'website', label:'Website', placeholder:'yourwebsite.com' },
          ].map(l => (
            <div key={l.key}>
              <label style={labelStyle}>{l.label}</label>
              <input style={inpStyle} value={form[l.key]} onChange={e=>set(l.key,e.target.value)} disabled={!editing} placeholder={l.placeholder} />
            </div>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div style={sectionStyle}>
        <div style={sectionTitle}>Privacy & visibility</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { key:'publicWinRate', label:'Show win rate publicly' },
            { key:'publicPnl', label:'Show net P&L publicly' },
            { key:'publicTrades', label:'Show trade count publicly' },
            { key:'publicLocation', label:'Show city in Local Traders tab' },
          ].map(item => (
            <div key={item.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13, color:'var(--text,#111)' }}>{item.label}</div>
              <div onClick={() => editing && set(item.key, !form[item.key])}
                style={{ width:40, height:22, borderRadius:11, background: form[item.key] ? P : 'var(--border,#d1d5db)', cursor: editing ? 'pointer' : 'default', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: form[item.key] ? 21 : 3, transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function AnalyticsCommunityTab() {
  const followerData = [30, 44, 38, 55, 62, 72, 100]
  const reachData = [20, 35, 48, 42, 60, 55, 88]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Top 6 stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
        {[
          { label: 'Followers',     value: '—', sub: '+0 this week' },
          { label: 'Profile views', value: '—', sub: '+0 this week' },
          { label: 'Posts (30d)',   value: '0',  sub: '0 avg views' },
          { label: 'Engage rate',   value: '—',  sub: 'likes + comments', color: PURPLE },
          { label: 'Group members', value: '0',  sub: '+0 this week' },
          { label: '30d retention', value: '—',  sub: 'group members', color: '#16a34a' },
        ].map(s => (
          <Card2 key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: s.color || 'var(--text)', marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </Card2>
        ))}
      </div>

      {/* 3-column middle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Follower growth</SH>
          <MiniBar data={followerData} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, marginBottom: 8 }}><span>6 weeks ago</span><span>Now</span></div>
          <div style={{ fontSize: 11 }}>Net new this month: <strong style={{ color: '#16a34a' }}>+0</strong></div>
        </Card>
        <Card>
          <SH>Post reach (top posts)</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>No posts yet. Start posting to see your reach data here.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Post 1', 'Post 2', 'Post 3'].map((p, i) => (
              <div key={p}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{p}</span>
                  <span style={{ fontWeight: 500 }}>— views</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SH>Engagement breakdown</SH>
          {[
            { label: 'Avg views / post',    value: '—' },
            { label: 'Avg likes / post',    value: '—' },
            { label: 'Avg comments / post', value: '—' },
            { label: 'Avg saves / post',    value: '—', color: PURPLE },
            { label: 'Profile clicks',      value: '—' },
            { label: 'Save rate',           value: '—', color: PURPLE },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Bottom 2-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Audience interests</SH>
          {[
            { label: 'Commodities', pct: 0, color: '#633806' },
            { label: 'Forex',       pct: 0, color: '#085041' },
            { label: 'Crypto',      pct: 0, color: '#3C3489' },
            { label: 'Stocks',      pct: 0, color: '#791F1F' },
            { label: 'Futures',     pct: 0, color: '#444441' },
          ].map(r => (
            <div key={r.label} style={{ marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                <span style={{ fontWeight: 500 }}>{r.pct}%</span>
              </div>
              <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 2 }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>Based on your followers' activity on TradeZar</div>
        </Card>
        <Card>
          <SH>Group & community stats</SH>
          {[
            { label: 'Active groups',           value: '0' },
            { label: 'Total group members',     value: '0' },
            { label: 'Active members (7d)',     value: '0' },
            { label: 'Posts in groups (7d)',    value: '0' },
            { label: '30-day retention',        value: '—', color: '#16a34a' },
            { label: 'New members this month',  value: '+0', color: '#16a34a' },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ─── BROKER TAB ───────────────────────────────────────────────
function BrokerTab() {
  const [connections, setConnections] = React.useState([])
  React.useEffect(() => {
    fetch('/api/broker/sync').then(r => r.json()).then(d => { if (d.connections) setConnections(d.connections) }).catch(() => {})
  }, [])
  const reload = () => {
    fetch('/api/broker/sync').then(r => r.json()).then(d => { if (d.connections) setConnections(d.connections) }).catch(() => {})
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <ConnectionPanel connections={connections} onSynced={reload} />
      </Card>
      <Card>
        <SH>What broker sync does</SH>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { icon: 'ti-download', text: 'Auto-imports all your trades directly from your broker' },
            { icon: 'ti-shield-check', text: 'Verifies your track record with a trusted badge on your profile' },
            { icon: 'ti-map-pin', text: 'Featured in the Local Traders tab as a verified trader' },
            { icon: 'ti-building', text: 'Discoverable by prop firms looking for funded trader candidates' },
            { icon: 'ti-lock', text: 'Read-only access only — we can never place or modify trades' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: '#4B44C8', marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
              {item.text}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── MONETIZATION ─────────────────────────────────────────────────────────────
function MonetizationTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
        {[
          { label: 'This month',      value: '$0' },
          { label: 'Last month',      value: '$0' },
          { label: 'All time',        value: '$0' },
          { label: 'Paid subscribers',value: '0' },
          { label: 'Pending payout',  value: '$0', color: '#dc2626' },
        ].map(s => (
          <Card2 key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: s.color || 'var(--text)', marginBottom: 3 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </Card2>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Payout method</SH>
          <div style={{ padding: '8px 10px', borderRadius: 6, border: '0.5px solid #dc2626', background: 'rgba(220,38,38,0.05)', fontSize: 11, color: '#dc2626', marginBottom: 10 }}>
            No payout method connected. Set one up to receive earnings.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <BtnP style={{ width: '100%' }}>Connect Stripe</BtnP>
            <BtnS style={{ width: '100%' }}>Connect bank account</BtnS>
          </div>
        </Card>
        <Card>
          <SH>Available monetization</SH>
          {[
            { label: 'Paid groups',          status: 'Available', available: true },
            { label: 'Paid courses',          status: 'Available', available: true },
            { label: 'Tips / donations',      status: 'Available', available: true },
            { label: 'Signal subscriptions',  status: 'Available', available: true },
            { label: 'Revenue share (content)',status: 'Pro only', available: false },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 12 }}>
              <span>{r.label}</span>
              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 3, background: r.available ? 'rgba(22,163,74,0.1)' : 'rgba(180,83,9,0.1)', color: r.available ? '#15803d' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{r.status}</span>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card>
          <SH>Your paid products</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>No paid products yet. Create a paid group, course, or signal service to start earning.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <BtnP style={{ fontSize: 10 }}>+ Paid group</BtnP>
            <BtnS style={{ fontSize: 10 }}>+ Paid course</BtnS>
            <BtnS style={{ fontSize: 10 }}>+ Signals</BtnS>
          </div>
        </Card>
        <Card>
          <SH>Subscriber management</SH>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>No paid subscribers yet. Manage cancellations, refunds, and messages here once you do.</div>
          {[
            { label: 'Active subscribers',    value: '0' },
            { label: 'Cancelled this month',  value: '0' },
          ].map((r, i, a) => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
              <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
              <span style={{ fontWeight: 500 }}>{r.value}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <SH>Payout history</SH>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No payouts yet. Earnings are paid out on the 1st of each month once you've connected a payout method and reached the $25 minimum threshold.</div>
      </Card>

    </div>
  )
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const SETTINGS_SECTIONS = ['Account', 'Appearance', 'Notifications', 'Privacy', 'Broker', 'Billing', 'Delete my account']

function SettingsContent({ section, user }) {
  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>{section}</div>

        {section === 'Account' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Email</div>
                <div style={{ display: 'flex', gap: 6 }}><input defaultValue={user?.email || ''} style={{ flex: 1, padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }} /><BtnS>Change</BtnS></div>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Username</div>
                <input defaultValue={user?.name || ''} style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Nationality</div>
                <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                  <option value="">Select country</option>
                  {['🇺🇸 United States','🇬🇧 United Kingdom','🇨🇦 Canada','🇦🇺 Australia','🇩🇪 Germany','🇫🇷 France','🇯🇵 Japan','🇳🇱 Netherlands','🇸🇬 Singapore','🇦🇪 UAE','🇿🇦 South Africa','🇧🇷 Brazil','🇮🇳 India','🇳🇿 New Zealand','🇨🇭 Switzerland','🇸🇪 Sweden','🇳🇴 Norway','🇩🇰 Denmark','🇵🇹 Portugal','🇦🇹 Austria','🇲🇽 Mexico','🇦🇷 Argentina','🇰🇷 South Korea','🇹🇷 Turkey','🇮🇱 Israel','🇵🇱 Poland','🇪🇸 Spain','🇮🇹 Italy','🇭🇰 Hong Kong','🇹🇭 Thailand','Other'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Timezone</div>
                <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                  {['UTC-12','UTC-11','UTC-10','UTC-9','UTC-8 Pacific','UTC-7 Mountain','UTC-6 Central','UTC-5 Eastern','UTC-4','UTC-3','UTC-2','UTC-1','UTC+0 London','UTC+1 Paris','UTC+2','UTC+3 Dubai','UTC+4','UTC+5','UTC+5:30 India','UTC+6','UTC+7','UTC+8 Singapore','UTC+9 Tokyo','UTC+10 Sydney','UTC+11','UTC+12'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <ChangePasswordSection />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '0.5px solid var(--border)' }}>
              <div><div style={{ fontSize: 12, fontWeight: 500 }}>Two-factor authentication</div><div style={{ fontSize: 10, color: '#dc2626' }}>Currently off</div></div>
              <BtnS>Enable 2FA</BtnS>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '0.5px solid var(--border)' }}>
              <div><div style={{ fontSize: 12, fontWeight: 500 }}>Plan: Free</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Upgrade for analytics, revenue share, and more</div></div>
              <BtnP>Upgrade to Pro</BtnP>
            </div>
            <BtnP style={{ width: 120 }}>Save changes</BtnP>
          </div>
        )}

        {section === 'Appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Theme</div>
              <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                <option>System default</option><option>Light</option><option>Dark</option>
              </select>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Default market section on load</div>
              <select style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }}>
                <option>Commodities</option><option>Stocks</option><option>Forex</option><option>Crypto</option><option>Futures</option>
              </select>
            </div>
            <BtnP style={{ width: 120 }}>Save</BtnP>
          </div>
        )}

        {section === 'Notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'New followers', sub: 'When someone follows you' },
              { label: 'Post likes & comments', sub: 'When someone engages with your posts' },
              { label: 'Trade idea results', sub: 'When your public trade ideas hit targets' },
              { label: 'Group activity', sub: 'New posts in your groups' },
              { label: 'New subscribers', sub: 'When someone subscribes to a paid product' },
              { label: 'Platform updates', sub: 'New features and announcements' },
            ].map((n, i, a) => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.sub}</div></div>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 16, height: 16 }} />
              </div>
            ))}
          </div>
        )}

        {section === 'Privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { label: 'Show profile on leaderboards', sub: 'Let others find you in rankings' },
              { label: 'Show trade history publicly', sub: 'Others can see your win rate and trade log' },
              { label: 'Allow direct messages', sub: "From users you don't follow" },
              { label: 'Show online status', sub: "Let others see when you're active" },
            ].map((n, i, a) => (
              <div key={n.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                <div><div style={{ fontSize: 12 }}>{n.label}</div><div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.sub}</div></div>
                <input type="checkbox" defaultChecked style={{ cursor: 'pointer', width: 16, height: 16 }} />
              </div>
            ))}
          </div>
        )}

        {section === 'Broker' && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.5 }}>Connect your brokerage account to automatically track and verify your trade history.</div>
            <BtnP style={{ marginBottom: 10 }}>Connect broker</BtnP>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Supports: Interactive Brokers, TD Ameritrade, TradeStation, MetaTrader 4/5, and more.</div>
          </div>
        )}

        {section === 'Billing' && (
          <div>
            <div style={{ padding: '12px', background: 'var(--surface2)', borderRadius: 8, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Current plan: <span style={{ color: PURPLE }}>Free</span></div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Upgrade to Pro for advanced analytics, revenue share, and priority support.</div>
            </div>
            <BtnP style={{ marginBottom: 10 }}>Upgrade to Pro</BtnP>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No active subscriptions or payment methods on file.</div>
          </div>
        )}

        {section === 'Delete my account' && (
          <div style={{ padding: '12px', background: 'rgba(220,38,38,0.05)', border: '0.5px solid rgba(220,38,38,0.3)', borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#dc2626', marginBottom: 4 }}>Delete account</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>Permanently delete your TradeZar account. This cannot be undone.</div>
            <button style={{ padding: '7px 14px', background: 'transparent', color: '#dc2626', border: '0.5px solid #dc2626', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)' }}>Delete my account</button>
          </div>
        )}
    </div>
  )
}

function ChangePasswordSection() {
  const [open, setOpen] = React.useState(false)
  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [msg, setMsg] = React.useState(null) // { type: 'success'|'error', text }

  const inp = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none' }

  const handleSave = async () => {
    if (!current || !next || !confirm) { setMsg({ type: 'error', text: 'All fields are required' }); return }
    if (next !== confirm) { setMsg({ type: 'error', text: 'New passwords do not match' }); return }
    if (next.length < 8) { setMsg({ type: 'error', text: 'Password must be at least 8 characters' }); return }
    setLoading(true); setMsg(null)
    try {
      const res = await fetch('/api/change-pw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      setMsg({ type: 'success', text: 'Password updated successfully' })
      setCurrent(''); setNext(''); setConfirm(''); setOpen(false)
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Password</div>
      {!open ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1, padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: 2 }}>••••••••</span>
          <BtnS onClick={() => { setOpen(true); setMsg(null); }}>Change</BtnS>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', border: '0.5px solid var(--border2)', borderRadius: 8, background: 'var(--surface2)' }}>
          <input type="password" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Current password" style={inp} />
          <input type="password" value={next} onChange={e => setNext(e.target.value)} placeholder="New password (min 8 chars)" style={inp} />
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm new password" style={inp} />
          {msg && (
            <div style={{ fontSize: 11, padding: '5px 8px', borderRadius: 5, background: msg.type === 'success' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: msg.type === 'success' ? '#16a34a' : '#dc2626' }}>
              {msg.text}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <BtnP onClick={handleSave} style={{ fontSize: 11, padding: '5px 12px' }}>{loading ? 'Saving…' : 'Save'}</BtnP>
            <BtnS onClick={() => { setOpen(false); setCurrent(''); setNext(''); setConfirm(''); setMsg(null); }} style={{ fontSize: 11 }}>Cancel</BtnS>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingsTab({ user }) { return null }

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const SETTINGS_ICONS = {
  'Account': 'ti-user', 'Appearance': 'ti-palette', 'Notifications': 'ti-bell',
  'Privacy': 'ti-lock', 'Broker': 'ti-plug-connected', 'Billing': 'ti-credit-card',
  'Delete my account': 'ti-trash'
}

const ACCOUNT_TABS = [
  { key: 'overview',     label: 'Profile',               sub: 'Edit your public profile',    icon: 'ti-user'            },
  { key: 'analytics',    label: 'Analytics',             sub: 'Performance & community',     icon: 'ti-chart-bar'       },
  { key: 'monetization', label: 'Monetization',          sub: 'Earnings & payouts',          icon: 'ti-currency-dollar' },
  { key: 'broker',       label: 'Connect Broker',        sub: 'Sync your trading accounts',  icon: 'ti-building-bank'   },
  { key: 'settings',     label: 'Settings',              sub: 'Account & preferences',       icon: 'ti-settings'        },
]

export default function AccountTab({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [settingsSection, setSettingsSection] = useState('Account')

  const meta = ACCOUNT_TABS.find(t => t.key === activeTab) || ACCOUNT_TABS[0]

  return (
    <div style={{ fontFamily: 'var(--font)', display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

      {/* ── SIDEBAR — 56px fixed, matches Community/Compete ── */}
      <div style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, borderRight: '0.5px solid var(--border)', background: 'var(--surface)', flexShrink: 0, alignSelf: 'stretch' }}>
        {ACCOUNT_TABS.map(t => {
          const isActive = activeTab === t.key
          return (
            <div key={t.key} title={t.label} onClick={() => setActiveTab(t.key)}
              style={{ width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: isActive ? '#EEEDFE' : 'transparent', color: isActive ? '#534AB7' : 'var(--text-muted)', fontSize: 19, transition: 'all .15s', flexShrink: 0 }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = '#EEEDFE'; e.currentTarget.style.color = '#534AB7' } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' } }}>
              <i className={`ti ${t.icon}`} aria-hidden="true" />
            </div>
          )
        })}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>



        {/* Settings horizontal subtab strip */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 18px', gap: 20, borderBottom: '0.5px solid var(--border)', flexShrink: 0, height: 44, overflowX: 'auto' }}>
            {SETTINGS_SECTIONS.map(sec => (
              <span key={sec} onClick={() => setSettingsSection(sec)}
                style={{ all: 'unset', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: settingsSection === sec ? 600 : 400, color: settingsSection === sec ? 'var(--text)' : 'var(--text-muted)', position: 'relative', height: 44, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <i className={`ti ${SETTINGS_ICONS[sec] || 'ti-circle'}`} style={{ fontSize: 14 }} aria-hidden="true" />
                {sec}
                {settingsSection === sec && <span style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#534AB7', borderRadius: 1 }} />}
              </span>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        {activeTab === 'overview' ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            <ProfileTab user={user} />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {activeTab === 'analytics'    && <AnalyticsCommunityTab />}
            {activeTab === 'monetization' && <MonetizationTab />}
            {activeTab === 'broker'       && <BrokerTab />}
            {activeTab === 'settings'     && <SettingsContent section={settingsSection} user={user} />}
          </div>
        )}
      </div>
    </div>
  )
}
