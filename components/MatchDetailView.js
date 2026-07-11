'use client'
import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import CompetitionTradingView from './CompetitionTradingView'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeLeft(end) {
  if (!end) return 'No end date'
  const diff = new Date(end) - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

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

function pnlColor(v) {
  if (!v && v !== 0) return 'var(--text-muted)'
  return v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : 'var(--text-muted)'
}

function pnlLabel(v, prefix = '$') {
  if (v === null || v === undefined) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${prefix}${Math.abs(v).toFixed(2)}`
}

function brokerIcon(broker) {
  const icons = {
    plaid: 'ti-building-bank',
    webhook: 'ti-webhook',
    tradingview: 'ti-chart-candle',
    robinhood: 'ti-feather',
    coinbase: 'ti-currency-bitcoin',
    tradovate: 'ti-chart-line',
  }
  return icons[broker?.toLowerCase()] || 'ti-plug-connected'
}

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ myPnL, theirPnL, theirName }) {
  const my = myPnL || 0
  const their = theirPnL || 0
  const winning = my > their
  // Shift both scores so the lower one = 0, giving a fair proportional bar
  const min = Math.min(my, their, 0)
  const myAdj = my - min
  const theirAdj = their - min
  const adjTotal = myAdj + theirAdj
  const myPct = adjTotal > 0 ? Math.min(95, Math.max(5, Math.round((myAdj / adjTotal) * 100))) : 50

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>YOU</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 700, color: pnlColor(myPnL) }}>
            {pnlLabel(myPnL)}
          </div>
        </div>
        <div style={{ alignSelf: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>vs</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{theirName || 'Opponent'}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 32, fontWeight: 700, color: pnlColor(theirPnL) }}>
            {pnlLabel(theirPnL)}
          </div>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${myPct}%`,
          background: winning ? '#22c55e' : '#ef4444',
          borderRadius: 99,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>{myPct}%</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>{100 - myPct}%</div>
      </div>
    </div>
  )
}

// ─── Paid Connection Panel ─────────────────────────────────────────────────────
// Only shown on paid (buyIn > 0) matches. Plaid for real brokers only.
function PaidConnectionPanel({ connections, onSynced }) {
  const [linkToken, setLinkToken] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const plaidConn = connections?.find(c => !['webhook','demo'].includes(c.broker) && c.broker?.length > 10)

  useEffect(() => {
    fetch('/api/plaid/create-link-token', { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.link_token) setLinkToken(d.link_token) })
      .catch(() => {})
  }, [])

  const onPlaidSuccess = useCallback(async (public_token, metadata) => {
    setConnecting(true)
    try {
      const res = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          public_token,
          institution_name: metadata.institution?.name,
          institution_id: metadata.institution?.institution_id,
          accounts: metadata.accounts,
        }),
      })
      const data = await res.json()
      if (data.success) onSynced?.()
      else alert('Connection failed: ' + (data.error || 'Unknown'))
    } catch (e) { alert('Connection failed: ' + e.message) }
    setConnecting(false)
  }, [onSynced])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({ token: linkToken, onSuccess: onPlaidSuccess })

  const syncPlaid = async () => {
    setSyncing(true)
    try { await fetch('/api/plaid/sync', { method: 'POST' }); onSynced?.() } catch {}
    setSyncing(false)
  }

  return (
    <div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Verified Broker Connection
      </div>
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontFamily: 'var(--font)', fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
        <i className="ti ti-shield-check" style={{ marginRight: 6 }} />
        Paid challenges require a real broker connection. Trades are pulled directly from your account — no manual entry, no cheating.
      </div>

      {/* Plaid */}
      <div style={{ background: 'var(--surface2)', border: `1px solid ${plaidConn ? '#534AB744' : 'var(--border)'}`, borderRadius: 11, padding: '12px 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#534AB718', border: '1px solid #534AB733', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-building-bank" style={{ fontSize: 18, color: '#534AB7' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              Real Broker Account
              {plaidConn && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Connected</span>}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              {plaidConn ? `Last sync: ${timeAgo(plaidConn.lastSynced)}` : 'Coinbase · Robinhood · Fidelity · Schwab & more'}
            </div>
          </div>
          {plaidConn ? (
            <button onClick={syncPlaid} disabled={syncing} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>
              <i className={`ti ti-refresh${syncing ? ' animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
          ) : (
            <button onClick={() => openPlaid()} disabled={!plaidReady || connecting}
              style={{ padding: '6px 14px', background: (!plaidReady || connecting) ? 'var(--surface2)' : '#534AB7', color: (!plaidReady || connecting) ? 'var(--text-muted)' : '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <i className="ti ti-plug-connected" />
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* TradingView Webhook */}
      <div style={{ background: 'var(--surface2)', border: `1px solid ${webhookConn ? '#10b98144' : 'var(--border)'}`, borderRadius: 11, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#10b98118', border: '1px solid #10b98133', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-chart-candle" style={{ fontSize: 18, color: '#10b981' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
              TradingView Webhook
              {webhookConn && <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>● Active</span>}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Auto-log live trades from TradingView strategy alerts</div>
          </div>
          {!webhookData ? (
            <button onClick={loadWebhook} disabled={webhookLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>
              {webhookLoading ? '…' : 'Get URL'}
            </button>
          ) : (
            <button onClick={copyWebhook}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', background: copied ? '#10b981' : 'transparent', color: copied ? '#fff' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              <i className={`ti ti-${copied ? 'check' : 'copy'}`} />
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          )}
        </div>
        {webhookData && (
          <>
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'monospace', fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>
              {webhookData.webhookUrl}
            </div>
            <div style={{ marginTop: 6, fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              In TradingView → Strategy → Alerts → Webhook URL. Message body must include{' '}
              <code style={{ background: 'var(--surface)', padding: '1px 4px', borderRadius: 4 }}>
                {`{"symbol":"{{ticker}}","action":"{{strategy.order.action}}","price":"{{close}}","key":"${webhookData.key}"}`}
              </code>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


// ─── Trade Card ───────────────────────────────────────────────────────────────
function TradeCard({ trade }) {
  const isOpen = trade.status === 'open'
  const pnl = isOpen ? trade.unrealizedPnL : trade.realizedPnL
  const won = (pnl || 0) > 0

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${isOpen ? 'var(--border)' : won ? '#22c55e33' : '#ef444433'}`,
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        {/* Direction badge */}
        <span style={{
          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
          background: trade.direction === 'long' ? '#dcfce7' : '#fee2e2',
          color: trade.direction === 'long' ? '#16a34a' : '#dc2626',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <i className={`ti ti-trend-${trade.direction === 'long' ? 'up' : 'down'}-2`} />
          {trade.direction.toUpperCase()}
        </span>

        <span style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{trade.symbol}</span>

        {isOpen ? (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', background: '#ede9fe', color: '#7c3aed' }}>
            OPEN
          </span>
        ) : (
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', background: won ? '#dcfce7' : '#fee2e2', color: won ? '#16a34a' : '#dc2626' }}>
            {won ? '▲ WIN' : '▼ LOSS'}
          </span>
        )}

        {/* Platform badge */}
        {trade.connection?.broker && (
          <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontFamily: 'var(--font)', background: 'var(--surface2)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <i className={`ti ${brokerIcon(trade.connection.broker)}`} style={{ marginRight: 3 }} />
            {trade.connection.label || trade.connection.broker}
          </span>
        )}

        <span style={{ fontFamily: 'var(--font)', fontSize: 17, fontWeight: 700, color: pnlColor(pnl), marginLeft: trade.connection?.broker ? 0 : 'auto' }}>
          {pnlLabel(pnl)}{isOpen ? ' unreal.' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Entry', val: trade.entryPrice },
          trade.exitPrice ? { label: 'Exit', val: trade.exitPrice } : null,
          trade.currentPrice ? { label: 'Current', val: trade.currentPrice } : null,
          { label: 'Qty', val: trade.quantity },
        ].filter(Boolean).map(({ label, val }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              {label === 'Qty' ? val : (typeof val === 'number' ? (val < 10 ? val.toFixed(5) : val.toFixed(2)) : val)}
            </div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{isOpen ? 'Opened' : 'Closed'}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>{timeAgo(isOpen ? trade.openedAt : trade.closedAt)}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────
function AnalyticsPanel({ analytics, label }) {
  if (!analytics) return null
  const stats = [
    { l: 'Total P&L', v: pnlLabel(analytics.totalPnL), c: pnlColor(analytics.totalPnL) },
    { l: 'Realized', v: pnlLabel(analytics.realizedPnL), c: pnlColor(analytics.realizedPnL) },
    { l: 'Unrealized', v: pnlLabel(analytics.unrealizedPnL), c: pnlColor(analytics.unrealizedPnL) },
    { l: 'Trades', v: analytics.totalTrades },
    { l: 'Win Rate', v: `${analytics.winRate}%` },
    { l: 'W / L', v: `${analytics.wins} / ${analytics.losses}` },
    { l: 'Avg P&L', v: pnlLabel(analytics.avgPnL), c: pnlColor(analytics.avgPnL) },
    { l: 'Best', v: pnlLabel(analytics.bestTrade), c: pnlColor(analytics.bestTrade) },
    { l: 'Worst', v: pnlLabel(analytics.worstTrade), c: pnlColor(analytics.worstTrade) },
  ]
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 12, padding: '16px 20px', marginBottom: 14 }}>
      {label && <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {stats.map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: c || 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MatchDetailView({ matchId, onBack, onDelete }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('mine')

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/challenges/${matchId}`)
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Failed to load match'); setLoading(false); return }
      setData(d)
    } catch { setError('Network error') }
    setLoading(false)
  }, [matchId])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
      <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading match…</div>
    </div>
  )

  if (error) return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontFamily: 'var(--font)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className="ti ti-arrow-left" /> Back
      </button>
      <div style={{ color: '#dc2626', fontFamily: 'var(--font)', fontSize: 14 }}>{error}</div>
    </div>
  )

  const { match, me, opponent, myTrades, theirTrades, myConnections } = data
  const isPaid = (match.buyIn || 0) > 0
  const matchActive = match.status === 'active'
  const matchWaiting = match.status === 'waiting'
  const opponentName = opponent?.displayName || opponent?.name || opponent?.username || 'Waiting…'
  const myPnL = me?.analytics?.totalPnL ?? 0
  const theirPnL = opponent?.analytics?.totalPnL ?? 0

  return (
    <div style={{ paddingBottom: 32, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* Back + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 28px 12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontFamily: 'var(--font)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
          <i className="ti ti-arrow-left" /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={fetchData} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }} title="Refresh">
          <i className="ti ti-refresh" />
        </button>
        {match.isChallenger && onDelete && (
          <button
            onClick={async () => {
              if (!confirm('Delete this challenge? This cannot be undone.')) return;
              const res = await fetch('/api/challenges', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId }) });
              const d = await res.json();
              if (!res.ok) { alert(d.error || 'Failed to delete'); return; }
              onDelete();
            }}
            style={{ background: 'none', border: '1px solid #ef444444', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', color: '#ef4444', fontSize: 13 }}
            title="Delete challenge"
          >
            <i className="ti ti-trash" />
          </button>
        )}
      </div>

      <div style={{ padding: '0 28px' }}>
        {/* Match header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>
                {match.asset !== 'Any' ? `${match.asset} Challenge` : 'Open Challenge'}
                {match.buyIn > 0 && <span style={{ marginLeft: 10, fontSize: 14, color: '#f59e0b', fontWeight: 500 }}>${match.buyIn} stake</span>}
              </div>
              {match.description && <div style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{match.description}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 20,
                background: matchActive ? '#dcfce7' : matchWaiting ? '#fef9c3' : 'var(--surface2)',
                color: matchActive ? '#16a34a' : matchWaiting ? '#ca8a04' : 'var(--text-muted)',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, marginBottom: 5,
              }}>
                <i className={`ti ti-${matchActive ? 'player-play' : matchWaiting ? 'clock' : 'check'}`} />
                {matchActive ? 'LIVE' : matchWaiting ? 'WAITING' : 'ENDED'}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>{timeLeft(match.endDate)}</div>
            </div>
          </div>

          {!matchWaiting && (
            <>
              <ScoreBar myPnL={myPnL} theirPnL={theirPnL} theirName={opponentName} />
              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
                    YOU · {me?.analytics?.wins ?? 0}W {me?.analytics?.losses ?? 0}L · {me?.analytics?.winRate ?? 0}% WR
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    {me?.analytics?.openTrades > 0 && <span style={{ color: '#7c3aed' }}>{me.analytics.openTrades} open · </span>}
                    {me?.analytics?.closedTrades ?? 0} closed
                  </div>
                </div>
                <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
                    {opponentName} · {opponent?.analytics?.wins ?? 0}W {opponent?.analytics?.losses ?? 0}L · {opponent?.analytics?.winRate ?? 0}% WR
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                    {opponent?.analytics?.openTrades > 0 && <span style={{ color: '#7c3aed' }}>{opponent.analytics.openTrades} open · </span>}
                    {opponent?.analytics?.closedTrades ?? 0} closed
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Waiting state notice */}
        {matchWaiting && (
          <div style={{ padding: '14px 18px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, marginBottom: 16, fontFamily: 'var(--font)', fontSize: 14, color: '#854d0e' }}>
            <i className="ti ti-clock" style={{ marginRight: 6 }} />
            Waiting for an opponent to accept. Once the match goes live, {isPaid ? 'your verified broker trades will count toward the score.' : 'paper trades will count toward the score.'}
          </div>
        )}

        {/* ── FREE MATCH: only paper trading ── */}
        {!isPaid && (
          <CompetitionTradingView
            competitionId={matchId}
            competitionType="h2h"
            endDate={match.endDate}
            title={match.asset !== 'Any' ? `${match.asset} Challenge` : 'Open Challenge'}
            allowedAsset={match.asset !== 'Any' ? match.asset : null}
          />
        )}

        {/* ── PAID MATCH: verified broker trades ── */}
        {isPaid && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16, overflowX: 'auto' }}>
              {[
                ['mine', `My Trades${myTrades?.length ? ` (${myTrades.length})` : ''}`],
                ['theirs', opponent ? `${opponentName.split(' ')[0]}'s Trades${theirTrades?.length ? ` (${theirTrades.length})` : ''}` : 'Opponent'],
                ['analytics', 'Analytics'],
              ].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)} style={{
                  padding: '10px 18px',
                  fontFamily: 'var(--font)', fontSize: 14,
                  fontWeight: tab === key ? 600 : 400,
                  color: tab === key ? '#534AB7' : 'var(--text-muted)',
                  background: 'none', border: 'none',
                  borderBottom: tab === key ? '2px solid #534AB7' : '2px solid transparent',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {label}
                </button>
              ))}
            </div>

            {/* My verified trades */}
            {tab === 'mine' && (
              myTrades?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px' }}>
                  <i className="ti ti-plug-connected" style={{ fontSize: 30, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }} />
                  <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>No verified trades yet</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>
                    Connect your broker below. Every real trade you place will auto-sync here.
                  </div>
                </div>
              ) : (
                myTrades.map(t => <TradeCard key={t.id} trade={t} />)
              )
            )}

            {/* Opponent trades */}
            {tab === 'theirs' && (
              !opponent ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
                  <i className="ti ti-user-question" style={{ fontSize: 30, display: 'block', marginBottom: 10 }} />
                  No opponent yet — challenge is open
                </div>
              ) : theirTrades?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
                  <i className="ti ti-chart-candle" style={{ fontSize: 30, display: 'block', marginBottom: 10 }} />
                  {match.status === 'completed'
                    ? `${opponentName} had no verified trades in this challenge`
                    : `${opponentName}'s closed trades will appear here`}
                </div>
              ) : (
                theirTrades.map(t => <TradeCard key={t.id} trade={t} />)
              )
            )}

            {/* Analytics */}
            {tab === 'analytics' && (
              <div>
                <AnalyticsPanel analytics={me?.analytics} label="Your Performance" />
                {opponent
                  ? <AnalyticsPanel analytics={opponent?.analytics} label={`${opponentName}'s Performance`} />
                  : <div style={{ textAlign: 'center', padding: 20, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Opponent analytics appear once someone joins</div>
                }
              </div>
            )}

            {/* Broker connection panel — paid only */}
            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <PaidConnectionPanel connections={myConnections} onSynced={fetchData} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
