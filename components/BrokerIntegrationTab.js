'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',font:'var(--font)',mono:'var(--font-mono)',
}

const BROKERS = [
  {
    id: 'tradovate', name: 'Tradovate', logo: '🔵', color: '#0066FF',
    desc: 'Popular futures platform. Connect with your API token.',
    assets: 'Futures (ES, NQ, CL, GC, ZC...)',
    guide: 'In Tradovate: Settings → API Access → Generate Token',
    fields: [{ key:'apiKey', label:'API Token', placeholder:'Paste your Tradovate API token', type:'password' }],
    docsUrl: 'https://api.tradovate.com',
  },
  {
    id: 'alpaca', name: 'Alpaca', logo: '🦙', color: '#F6C344',
    desc: 'Commission-free stocks & crypto. Works with paper and live accounts.',
    assets: 'Stocks, ETFs, Crypto',
    guide: 'In Alpaca dashboard: Your Account → API Keys → Generate New Key',
    fields: [
      { key:'apiKey', label:'API Key ID', placeholder:'AKXXXXXXXXXXXXXXXX', type:'text' },
      { key:'apiSecret', label:'API Secret', placeholder:'Your secret key', type:'password' },
    ],
    docsUrl: 'https://alpaca.markets/docs',
  },
  {
    id: 'ibkr', name: 'Interactive Brokers', logo: '🏦', color: '#CC0000',
    desc: 'Professional platform. Supports all asset classes globally.',
    assets: 'Stocks, Futures, Forex, Options, Bonds',
    guide: 'Requires TWS or IB Gateway running locally. Full setup guide in docs.',
    fields: [{ key:'apiKey', label:'Account Number', placeholder:'Your IBKR account number', type:'text' }],
    docsUrl: 'https://interactivebrokers.github.io',
    comingSoon: false,
    manualNote: 'IBKR integration requires TWS Gateway. Auto-sync available when gateway is running.',
  },
  {
    id: 'schwab', name: 'TD Ameritrade / Schwab', logo: '🟢', color: '#007B5E',
    desc: 'Merged platform. Stocks, options, futures via OAuth.',
    assets: 'Stocks, Options, Futures',
    guide: 'Requires OAuth setup. Click Connect to begin the authorization flow.',
    fields: [{ key:'apiKey', label:'Client ID', placeholder:'Your Schwab app client ID', type:'text' }],
    docsUrl: 'https://developer.schwab.com',
    comingSoon: true,
  },
]

function BrokerCard({ broker, connection, onConnect, onSync, onDisconnect, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState({})
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleConnect = async () => {
    setConnecting(true); setError(''); setSuccess('')
    const result = await onConnect(broker.id, form)
    if (result.error) setError(result.error)
    else { setSuccess(`Connected! Account: ${result.accountInfo?.equity ? `$${parseFloat(result.accountInfo.equity).toLocaleString()} equity` : result.accountInfo?.note || 'Verified'}`) ; setExpanded(false) }
    setConnecting(false)
  }

  const handleSync = async () => {
    setSyncing(true); setError('')
    const result = await onSync(connection.id)
    if (result.error) setError(result.error)
    else setSuccess(`Synced ${result.synced || 0} trades`)
    setSyncing(false)
  }

  const statusColor = { connected: C.green, error: C.red, disconnected: C.muted }

  return (
    <div style={{ background: C.surface, border: `1px solid ${connection ? broker.color+'40' : C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ height: 4, background: connection ? broker.color : C.border }} />
      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 28 }}>{broker.logo}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{broker.name}</span>
              {broker.comingSoon && <span style={{ fontSize: 10, color: C.dim, background: C.surface2, padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>Coming Soon</span>}
              {connection && <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[connection.status]||C.muted }}>● {connection.status}</span>}
            </div>
            <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{broker.assets}</div>
          </div>
          {connection && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSync} disabled={syncing} style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: C.font }}>
                {syncing ? '⏳' : '↻ Sync'}
              </button>
              <button onClick={() => onDisconnect(connection.id)} style={{ background: 'transparent', color: C.red, border: `1px solid ${C.border}`, padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, cursor: 'pointer' }}>✕</button>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: C.muted, margin: '0 0 14px', lineHeight: 1.6 }}>{broker.desc}</p>

        {/* Connection status details */}
        {connection && (
          <div style={{ background: C.surface2, borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Account ID</span>
              <span style={{ fontSize: 12, fontFamily: C.mono, color: C.text }}>{connection.accountId || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Last synced</span>
              <span style={{ fontSize: 12, color: C.text }}>{connection.lastSynced ? new Date(connection.lastSynced).toLocaleTimeString() : 'Never'}</span>
            </div>
            {/* Toggles */}
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: 'flex', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.muted }}>
                <input type="checkbox" checked={connection.autoCompete} onChange={e => onToggle(connection.id, 'autoCompete', e.target.checked)} />
                Auto-enter competitions
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12, color: C.muted }}>
                <input type="checkbox" checked={connection.showPnL} onChange={e => onToggle(connection.id, 'showPnL', e.target.checked)} />
                Show P&L publicly
              </label>
            </div>
          </div>
        )}

        {(success || error) && (
          <div style={{ background: error ? 'var(--red-bg)' : 'var(--green-bg)', border: `1px solid ${error ? 'var(--red-border)' : 'var(--green-border)'}`, borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: error ? C.red : C.green }}>
            {error || success}
          </div>
        )}

        {/* Connect form */}
        {!connection && !broker.comingSoon && (
          <div>
            {!expanded ? (
              <button onClick={() => setExpanded(true)} style={{ width: '100%', background: broker.color, color: '#fff', border: 'none', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
                Connect {broker.name}
              </button>
            ) : (
              <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius-sm)', padding: 14 }}>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, lineHeight: 1.6, background: C.surface, borderRadius: 4, padding: '8px 10px' }}>
                  💡 {broker.guide}
                </div>
                {broker.fields.map(f => (
                  <div key={f.key} style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]||''} onChange={e => setForm(prev => ({...prev, [f.key]: e.target.value}))}
                      placeholder={f.placeholder}
                      style={{ width: '100%', background: C.surface, color: C.text, border: `1px solid ${C.border2}`, padding: '8px 10px', borderRadius: 4, fontSize: 13, fontFamily: C.font, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={handleConnect} disabled={connecting} style={{ flex: 1, background: broker.color, color: '#fff', border: 'none', padding: '9px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
                    {connecting ? '⏳ Connecting...' : 'Connect'}
                  </button>
                  <button onClick={() => { setExpanded(false); setError(''); setForm({}) }} style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, padding: '9px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {broker.comingSoon && !connection && (
          <div style={{ background: C.surface2, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <span style={{ fontSize: 12, color: C.dim }}>OAuth integration in progress — coming soon</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TradeHistory({ trades, stats }) {
  if (!trades.length) return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
      <div style={{ fontSize: 14, color: C.muted }}>No trades synced yet. Connect a broker and hit Sync.</div>
    </div>
  )

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Trades', value: stats.total, color: C.text },
          { label: 'Win Rate', value: stats.total ? `${Math.round((stats.winTrades/stats.total)*100)}%` : '—', color: stats.winTrades/stats.total >= 0.5 ? C.green : C.red },
          { label: 'Total P&L', value: `${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL?.toFixed(2)}`, color: stats.totalPnL >= 0 ? C.green : C.red },
        ].map((s,i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: C.mono }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trade table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '10px 16px', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
          {['Asset','Broker','Dir','Entry','Exit','P&L','Date'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</div>
          ))}
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {trades.map((t, i) => (
            <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 1fr 1fr', padding: '11px 16px', borderBottom: i < trades.length-1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.asset}</div>
              <div style={{ fontSize: 11, color: C.dim, textTransform: 'capitalize' }}>{t.connection?.broker}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: t.direction === 'LONG' ? C.green : C.red }}>{t.direction === 'LONG' ? '▲' : '▼'} {t.direction}</div>
              <div style={{ fontSize: 12, fontFamily: C.mono }}>{t.entryPrice?.toFixed(2)}</div>
              <div style={{ fontSize: 12, fontFamily: C.mono, color: C.muted }}>{t.exitPrice?.toFixed(2) || '—'}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: (t.realizedPnL||0) >= 0 ? C.green : C.red, fontFamily: C.mono }}>
                {t.realizedPnL != null ? `${t.realizedPnL >= 0 ? '+' : ''}$${t.realizedPnL.toFixed(2)}` : '—'}
              </div>
              <div style={{ fontSize: 11, color: C.dim }}>{new Date(t.openedAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function BrokerIntegrationTab() {
  const [connections, setConnections] = useState([])
  const [trades, setTrades] = useState([])
  const [tradeStats, setTradeStats] = useState({ total: 0, totalPnL: 0, winTrades: 0 })
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('brokers')

  useEffect(() => {
    Promise.all([
      fetch('/api/broker/connect').then(r => r.json()),
      fetch('/api/broker/trades').then(r => r.json()),
    ]).then(([connData, tradeData]) => {
      setConnections(connData.connections || [])
      setTrades(tradeData.trades || [])
      setTradeStats(tradeData.stats || { total: 0, totalPnL: 0, winTrades: 0 })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleConnect = async (broker, form) => {
    try {
      const res = await fetch('/api/broker/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ broker, ...form })
      })
      const data = await res.json()
      if (data.error) return { error: data.error }
      setConnections(prev => {
        const existing = prev.findIndex(c => c.broker === broker)
        if (existing >= 0) { const next = [...prev]; next[existing] = data.connection; return next }
        return [...prev, data.connection]
      })
      return { accountInfo: data.accountInfo }
    } catch (e) { return { error: e.message } }
  }

  const handleSync = async (connectionId) => {
    try {
      const res = await fetch('/api/broker/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connectionId }) })
      const data = await res.json()
      if (data.error) return { error: data.error }
      // Refresh trades
      fetch('/api/broker/trades').then(r => r.json()).then(d => { setTrades(d.trades||[]); setTradeStats(d.stats||{}) })
      return data
    } catch (e) { return { error: e.message } }
  }

  const handleDisconnect = async (id) => {
    if (!confirm('Disconnect this broker? Your trade history will be kept.')) return
    await fetch('/api/broker/connect', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setConnections(prev => prev.filter(c => c.id !== id))
  }

  const handleToggle = async (id, field, value) => {
    setConnections(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
    await fetch('/api/broker/connect', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [field]: value }) })
  }

  const getConnection = (brokerId) => connections.find(c => c.broker === brokerId)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 400, margin: '0 0 8px' }}>
          Broker <span style={{ color: C.gold }}>Integration</span>
        </h2>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
          Connect your real broker accounts. Trades sync automatically and enter active competitions — trade your normal account and compete at the same time.
        </p>
      </div>

      {/* How it works */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { icon: '🔗', title: 'Connect', desc: 'Link your broker with a read-only API key — we never touch your account' },
          { icon: '🔄', title: 'Auto-Sync', desc: 'Trades pull in automatically every time you hit Sync' },
          { icon: '⚔️', title: 'Auto-Compete', desc: 'Matching trades auto-enter any active competitions you\'re in' },
          { icon: '📊', title: 'Track P&L', desc: 'Real dollar P&L tracked on every trade. You choose what\'s public' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '14px 16px', display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div style={{ background: C.accent + '08', border: `1px solid ${C.accent}30`, borderRadius: 'var(--radius)', padding: '12px 18px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: C.text }}>Read-only access only.</strong> TradeZar cannot place, modify, or cancel any orders in your broker account. We only read your trade history. API keys are stored encrypted and never shared.
        </p>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['brokers', '🔗 Brokers'], ['trades', '📋 Trade History']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveView(id)} style={{ background: activeView === id ? C.accent : C.surface2, color: activeView === id ? '#fff' : C.muted, border: `1px solid ${activeView === id ? C.accent : C.border}`, padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: activeView === id ? 600 : 400, cursor: 'pointer', fontFamily: C.font }}>{label}</button>
        ))}
        {connections.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted }}>
            <span style={{ color: C.green }}>●</span> {connections.filter(c => c.status === 'connected').length} connected
          </div>
        )}
      </div>

      {loading ? <div style={{ color: C.muted }}>Loading...</div> : activeView === 'brokers' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: 16 }}>
          {BROKERS.map(broker => (
            <BrokerCard key={broker.id} broker={broker} connection={getConnection(broker.id)}
              onConnect={handleConnect} onSync={handleSync}
              onDisconnect={handleDisconnect} onToggle={handleToggle} />
          ))}
        </div>
      ) : (
        <TradeHistory trades={trades} stats={tradeStats} />
      )}
    </div>
  )
}
