'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'

const PURPLE = '#4B44C8'

function PlaidLinkButton({ onSuccess, disabled }) {
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.link_token) setLinkToken(d.link_token) })
      .catch(() => {})
  }, [])

  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    setLoading(true)
    try {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          institution_name: metadata.institution?.name,
          institution_id: metadata.institution?.institution_id,
          accounts: metadata.accounts,
        })
      })
      const data = await res.json()
      if (data.success) onSuccess(data)
      else alert('Connection failed: ' + (data.error || 'Unknown error'))
    } catch (e) {
      alert('Connection failed: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess: onPlaidSuccess })

  const btnStyle = {
    padding: '10px 20px', background: PURPLE, color: '#fff', border: 'none',
    borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: (ready && !disabled && !loading) ? 'pointer' : 'not-allowed',
    opacity: (ready && !disabled && !loading) ? 1 : 0.6, fontFamily: 'var(--font,system-ui)',
    display: 'flex', alignItems: 'center', gap: 8,
  }

  return (
    <button style={btnStyle} onClick={() => open()} disabled={!ready || disabled || loading}>
      <i className="ti ti-building-bank" style={{ fontSize: 15 }} aria-hidden="true" />
      {loading ? 'Connecting...' : 'Connect broker account'}
    </button>
  )
}

export default function BrokerTab() {
  const [connections, setConnections] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)

  const cardStyle = { background: 'var(--surface,#fff)', border: '0.5px solid var(--border,#e5e7eb)', borderRadius: 12, padding: '16px 18px', marginBottom: 12 }
  const shStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted,#9ca3af)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }

  const load = async () => {
    try {
      const res = await fetch('/api/plaid/sync')
      const data = await res.json()
      setConnections(data.connections || [])
      setTrades(data.trades || [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/plaid/sync', { method: 'POST' })
      await load()
      setLastSync(new Date())
    } catch(e) { console.error(e) }
    finally { setSyncing(false) }
  }

  const handleConnected = async () => {
    await load()
  }

  const disconnect = async (id) => {
    if (!confirm('Disconnect this broker? Your imported trades will remain.')) return
    await fetch(`/api/plaid/connections?id=${id}`, { method: 'DELETE' })
    await load()
  }

  // Calculate stats from trades
  const pnlTrades = trades.filter(t => t.realizedPnL != null)
  const totalPnl = pnlTrades.reduce((s, t) => s + (t.realizedPnL || 0), 0)
  const winTrades = pnlTrades.filter(t => t.realizedPnL > 0).length
  const winRate = pnlTrades.length ? Math.round(winTrades / pnlTrades.length * 100) : null

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted,#6b7280)', fontSize: 13 }}>
      Loading broker data...
    </div>
  )

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '20px 20px 40px', fontFamily: 'var(--font,system-ui)' }}>

      {/* Connected accounts */}
      <div style={cardStyle}>
        <div style={shStyle}>Connected accounts</div>
        {connections.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--text-muted,#6b7280)', marginBottom: 14, lineHeight: 1.6 }}>
            No broker connected. Connect your broker to automatically import trades, verify your track record, and unlock the verified trader badge.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {connections.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: 'rgba(22,163,74,0.06)', border: '0.5px solid rgba(22,163,74,0.2)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text,#111)', marginBottom: 2 }}>{c.label}</div>
                  <div style={{ fontSize: 11, color: '#16a34a' }}>
                    ✓ Connected · {c.lastSynced ? `Last synced ${new Date(c.lastSynced).toLocaleDateString()}` : 'Never synced'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSync} disabled={syncing}
                    style={{ padding: '5px 12px', background: 'transparent', color: PURPLE, border: `0.5px solid ${PURPLE}`, borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font,system-ui)' }}>
                    {syncing ? 'Syncing...' : 'Sync now'}
                  </button>
                  <button onClick={() => disconnect(c.id)}
                    style={{ padding: '5px 12px', background: 'transparent', color: '#dc2626', border: '0.5px solid #dc2626', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font,system-ui)' }}>
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PlaidLinkButton onSuccess={handleConnected} disabled={false} />
      </div>

      {/* Stats */}
      {trades.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
          {[
            { l: 'Trades imported', v: trades.length },
            { l: 'Win rate', v: winRate != null ? winRate + '%' : '—', c: '#16a34a' },
            { l: 'Net P&L', v: pnlTrades.length ? (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(0) : '—', c: totalPnl >= 0 ? '#16a34a' : '#dc2626' },
            { l: 'Verified badge', v: connections.length > 0 ? '✓ Active' : 'Not yet', c: connections.length > 0 ? '#16a34a' : undefined },
          ].map(s => (
            <div key={s.l} style={{ ...cardStyle, marginBottom: 0, textAlign: 'center', padding: '12px' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: s.c || 'var(--text,#111)', marginBottom: 3 }}>{s.v}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted,#9ca3af)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent trades */}
      {trades.length > 0 && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={shStyle}>Imported trades</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted,#6b7280)' }}>{trades.length} total</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 70px 80px', gap: 8, padding: '6px 0', borderBottom: '0.5px solid var(--border,#f3f4f6)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted,#9ca3af)', textTransform: 'uppercase' }}>
              <span>Asset</span><span>Direction</span><span>Qty</span><span>Price</span><span>Date</span>
            </div>
            {trades.slice(0, 20).map((t, i) => (
              <div key={t.id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 70px 80px', gap: 8, padding: '8px 0', borderBottom: '0.5px solid var(--border,#f3f4f6)', fontSize: 12, color: 'var(--text,#111)', alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{t.symbol || t.asset}</span>
                <span style={{ color: t.direction === 'LONG' ? '#16a34a' : '#dc2626', fontWeight: 500 }}>{t.direction}</span>
                <span>{t.quantity}</span>
                <span>${parseFloat(t.entryPrice || 0).toFixed(2)}</span>
                <span style={{ color: 'var(--text-muted,#6b7280)' }}>{t.openedAt ? new Date(t.openedAt).toLocaleDateString() : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What broker sync does */}
      <div style={cardStyle}>
        <div style={shStyle}>Why connect your broker</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: 'ti-download', text: 'Auto-imports all executed trades — live, paper, or demo accounts all work' },
            { icon: 'ti-shield-check', text: 'Earns you a verified trader badge visible on your public profile' },
            { icon: 'ti-map-pin', text: 'Featured in Local Traders discovery as a verified trader' },
            { icon: 'ti-building', text: 'Discoverable by prop firms searching for funded trader candidates' },
            { icon: 'ti-trophy', text: 'Required for real-money H2H challenges in the Compete tab' },
            { icon: 'ti-lock', text: 'Read-only access only — TradeZar can never place or modify trades' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-muted,#6b7280)' }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 14, color: PURPLE, marginTop: 1, flexShrink: 0 }} aria-hidden="true" />
              {item.text}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
