'use client'
import { useState, useEffect, useCallback } from 'react'

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
  const total = Math.abs(myPnL || 0) + Math.abs(theirPnL || 0)
  const myPct = total > 0 ? Math.round((Math.abs(myPnL) / total) * 100) : 50
  const winning = (myPnL || 0) > (theirPnL || 0)

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>YOU</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: pnlColor(myPnL) }}>
            {pnlLabel(myPnL)}
          </div>
        </div>
        <div style={{ alignSelf: 'center', fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>vs</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{theirName || 'Opponent'}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: pnlColor(theirPnL) }}>
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

// ─── Connection Panel ─────────────────────────────────────────────────────────
function ConnectionPanel({ connections, matchId, onSynced }) {
  const [webhook, setWebhook] = useState(null)
  const [showGuide, setShowGuide] = useState(false)
  const [copied, setCopied] = useState(false)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetch('/api/broker/webhook/setup')
      .then(r => r.json())
      .then(d => setWebhook(d))
      .catch(() => {})
  }, [])

  const copyUrl = () => {
    if (!webhook?.webhookUrl) return
    navigator.clipboard.writeText(webhook.webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const syncPlaid = async () => {
    setSyncing(true)
    try {
      await fetch('/api/broker/sync', { method: 'POST' })
      onSynced?.()
    } catch {}
    setSyncing(false)
  }

  const hasPlaid = connections?.some(c => c.broker === 'plaid')
  const hasWebhook = connections?.some(c => c.broker === 'webhook')
  const webhookConn = connections?.find(c => c.broker === 'webhook')

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
        Trade Sources
      </div>

      {/* Plaid / real broker row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 12px', background: 'var(--surface)', borderRadius: 9, border: '1px solid var(--border)' }}>
        <i className="ti ti-building-bank" style={{ fontSize: 18, color: hasPlaid ? '#22c55e' : 'var(--text-muted)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Real Broker (Plaid)
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
            {hasPlaid ? `Connected · last synced ${timeAgo(connections.find(c=>c.broker==='plaid')?.lastSynced)}` : 'Robinhood, Fidelity, Schwab, Coinbase & more'}
          </div>
        </div>
        {hasPlaid ? (
          <button
            onClick={syncPlaid}
            disabled={syncing}
            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <i className={`ti ti-refresh${syncing ? ' animate-spin' : ''}`} /> {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        ) : (
          <a href="/app?section=account&tab=broker" style={{ padding: '6px 12px', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            Connect
          </a>
        )}
      </div>

      {/* TradingView / Webhook row */}
      <div style={{ background: 'var(--surface)', borderRadius: 9, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <i className="ti ti-chart-candle" style={{ fontSize: 18, color: '#2962FF', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              TradingView / Any Platform
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
              {webhookConn ? `Active · last trade ${timeAgo(webhookConn.lastSynced)}` : 'Paper trades, TradingView alerts, custom scripts'}
            </div>
          </div>
          <button
            onClick={() => setShowGuide(g => !g)}
            style={{ padding: '6px 12px', background: showGuide ? '#534AB7' : 'transparent', color: showGuide ? '#fff' : 'var(--text)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer' }}
          >
            {showGuide ? 'Hide guide' : 'Setup guide'}
          </button>
        </div>

        {showGuide && webhook && (
          <div style={{ padding: '0 12px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', marginTop: 12, marginBottom: 10, fontWeight: 600 }}>
              Your Webhook URL
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'monospace', fontSize: 11, color: 'var(--text)', wordBreak: 'break-all' }}>
                {webhook.webhookUrl}
              </div>
              <button onClick={copyUrl} style={{ padding: '8px 12px', background: copied ? '#22c55e' : '#534AB7', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              TradingView Setup (3 steps)
            </div>
            {[
              ['1', 'Open TradingView → Alerts → Create Alert'],
              ['2', 'In the "Notifications" tab, check "Webhook URL" and paste the URL above'],
              ['3', 'Set the alert message to:'],
            ].map(([n, text]) => (
              <div key={n} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#534AB7', color: '#fff', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{text}</div>
              </div>
            ))}

            {/* Alert message examples */}
            <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontFamily: 'monospace', fontSize: 11, color: '#94a3b8', lineHeight: 1.7 }}>
              <div style={{ color: '#64748b', marginBottom: 4 }}>{'// For strategy-based alerts:'}</div>
              <div>{`{"symbol":"{{ticker}}","action":"{{strategy.order.action}}","price":"{{strategy.order.price}}","qty":"{{strategy.order.contracts}}"}`}</div>
              <div style={{ color: '#64748b', marginTop: 8, marginBottom: 4 }}>{'// For manual alerts (fill in your values):'}</div>
              <div>{`{"symbol":"AAPL","action":"buy","price":"195.20","qty":"10"}`}</div>
              <div style={{ color: '#64748b', marginTop: 8, marginBottom: 4 }}>{'// To close a position:'}</div>
              <div>{`{"symbol":"AAPL","action":"sell","price":"200.00","qty":"10"}`}</div>
            </div>

            <div style={{ padding: '8px 12px', background: '#EEEDFE', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 11, color: '#3C3489' }}>
              <strong>Works with any platform</strong> that supports webhooks or HTTP POST — TradingView, ThinkOrSwim, NinjaTrader scripts, or custom bots.
            </div>
          </div>
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
      borderRadius: 10,
      padding: '12px 14px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* Direction badge */}
        <span style={{
          padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font)',
          background: trade.direction === 'long' ? '#dcfce7' : '#fee2e2',
          color: trade.direction === 'long' ? '#16a34a' : '#dc2626',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <i className={`ti ti-trend-${trade.direction === 'long' ? 'up' : 'down'}-2`} />
          {trade.direction.toUpperCase()}
        </span>

        <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{trade.symbol}</span>

        {isOpen ? (
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', background: '#ede9fe', color: '#7c3aed' }}>
            OPEN
          </span>
        ) : (
          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', background: won ? '#dcfce7' : '#fee2e2', color: won ? '#16a34a' : '#dc2626' }}>
            {won ? '▲ WIN' : '▼ LOSS'}
          </span>
        )}

        {/* Platform badge */}
        {trade.connection?.broker && (
          <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontFamily: 'var(--font)', background: 'var(--surface2)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <i className={`ti ${brokerIcon(trade.connection.broker)}`} style={{ marginRight: 3 }} />
            {trade.connection.label || trade.connection.broker}
          </span>
        )}

        <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: pnlColor(pnl), marginLeft: trade.connection?.broker ? 0 : 'auto' }}>
          {pnlLabel(pnl)}{isOpen ? ' unreal.' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Entry', val: trade.entryPrice },
          trade.exitPrice ? { label: 'Exit', val: trade.exitPrice } : null,
          trade.currentPrice ? { label: 'Current', val: trade.currentPrice } : null,
          { label: 'Qty', val: trade.quantity },
        ].filter(Boolean).map(({ label, val }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              {label === 'Qty' ? val : (typeof val === 'number' ? (val < 10 ? val.toFixed(5) : val.toFixed(2)) : val)}
            </div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{isOpen ? 'Opened' : 'Closed'}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(isOpen ? trade.openedAt : trade.closedAt)}</div>
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
    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 16px', marginBottom: 12 }}>
      {label && <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{label}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {stats.map(({ l, v, c }) => (
          <div key={l}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: c || 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MatchDetailView({ matchId, onBack }) {
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
  const matchActive = match.status === 'active'
  const matchWaiting = match.status === 'waiting'
  const opponentName = opponent?.displayName || opponent?.name || opponent?.username || 'Waiting…'
  const myPnL = me?.analytics?.totalPnL ?? 0
  const theirPnL = opponent?.analytics?.totalPnL ?? 0

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Back + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 10px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontFamily: 'var(--font)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
          <i className="ti ti-arrow-left" /> Back
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={fetchData} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }} title="Refresh">
          <i className="ti ti-refresh" />
        </button>
      </div>

      <div style={{ padding: '0 18px' }}>
        {/* Match header */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {match.asset !== 'Any' ? `${match.asset} Challenge` : 'Open Challenge'}
                {match.buyIn > 0 && <span style={{ marginLeft: 8, fontSize: 12, color: '#f59e0b', fontWeight: 500 }}>${match.buyIn} stake</span>}
              </div>
              {match.description && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{match.description}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20,
                background: matchActive ? '#dcfce7' : matchWaiting ? '#fef9c3' : 'var(--surface2)',
                color: matchActive ? '#16a34a' : matchWaiting ? '#ca8a04' : 'var(--text-muted)',
                fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, marginBottom: 4,
              }}>
                <i className={`ti ti-${matchActive ? 'player-play' : matchWaiting ? 'clock' : 'check'}`} />
                {matchActive ? 'LIVE' : matchWaiting ? 'WAITING' : 'ENDED'}
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{timeLeft(match.endDate)}</div>
            </div>
          </div>

          <ScoreBar myPnL={myPnL} theirPnL={theirPnL} theirName={opponentName} />

          {/* Quick stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
                YOU · {me?.analytics?.wins ?? 0}W {me?.analytics?.losses ?? 0}L · {me?.analytics?.winRate ?? 0}% WR
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {me?.analytics?.openTrades > 0 && <span style={{ color: '#7c3aed' }}>{me.analytics.openTrades} open · </span>}
                {me?.analytics?.closedTrades ?? 0} closed
              </div>
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
                {opponentName} · {opponent?.analytics?.wins ?? 0}W {opponent?.analytics?.losses ?? 0}L · {opponent?.analytics?.winRate ?? 0}% WR
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {opponent?.analytics?.openTrades > 0 && <span style={{ color: '#7c3aed' }}>{opponent.analytics.openTrades} open · </span>}
                {opponent?.analytics?.closedTrades ?? 0} closed
              </div>
            </div>
          </div>
        </div>

        {/* Waiting state notice */}
        {matchWaiting && (
          <div style={{ padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: '#854d0e' }}>
            <i className="ti ti-clock" style={{ marginRight: 6 }} />
            Waiting for an opponent to accept. Once the match goes live, your synced trades will count toward the score.
          </div>
        )}

        {/* Connection panel */}
        <ConnectionPanel connections={myConnections} matchId={matchId} onSynced={fetchData} />

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
          {[
            ['mine', `My Trades${myTrades?.length ? ` (${myTrades.length})` : ''}`],
            ['theirs', opponent ? `${opponentName.split(' ')[0]}'s Trades${theirTrades?.length ? ` (${theirTrades.length})` : ''}` : 'Opponent'],
            ['analytics', 'Analytics'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '8px 14px',
              fontFamily: 'var(--font)', fontSize: 12,
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

        {/* My trades */}
        {tab === 'mine' && (
          myTrades?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <i className="ti ti-plug-connected" style={{ fontSize: 30, color: 'var(--text-muted)', display: 'block', marginBottom: 10 }} />
              <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>No trades synced yet</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', maxWidth: 260, margin: '0 auto', lineHeight: 1.5 }}>
                Connect your broker via Plaid or set up the TradingView webhook above. Trades you place on your platform will appear here automatically.
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
                ? `${opponentName} had no trades in this challenge`
                : `${opponentName}'s closed trades will appear here during the match`}
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
      </div>
    </div>
  )
}
