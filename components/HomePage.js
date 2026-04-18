
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, StatCard, Badge, LiveDot, SectionTitle, Btn, EmptyState } from './DS';

const PRIORITY_COLOR = {
  High:   'var(--accent)',
  Medium: 'var(--green)',
  Low:    'var(--text-muted)',
};

export default function HomePage({ user }) {
  const [brief, setBrief]       = useState(null);
  const [movers, setMovers]     = useState([]);
  const [activity, setActivity] = useState([]);
  const [positions, setPos]     = useState([]);
  const [alerts, setAlerts]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/brief').then(r => r.json()).catch(() => ({})),
      fetch('/api/prices').then(r => r.json()).catch(() => ({})),
      fetch('/api/screenings?limit=6').then(r => r.json()).catch(() => ({})),
      fetch('/api/positions').then(r => r.json()).catch(() => ({})),
      fetch('/api/alerts').then(r => r.json()).catch(() => ({})),
    ]).then(([b, p, a, pos, al]) => {
      setBrief(b.brief || b.text || null);
      setMovers(p.prices
        ? Object.entries(p.prices)
            .map(([sym, d]) => ({ sym, ...d }))
            .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
            .slice(0, 8)
        : []);
      setActivity(a.screenings || []);
      setPos(pos.positions || []);
      setAlerts(al.alerts || []);
      setLoading(false);
    });
  }, []);

  const hour = new Date().getHours();
  const session = hour < 6 ? 'Asian Session' : hour < 12 ? 'London Session' : hour < 17 ? 'New York Session' : 'After Hours';

  const openPnl = positions.reduce((s, p) => s + (p.unrealizedPnl || 0), 0);
  const pnlUp   = openPnl >= 0;

  // Economic calendar — static scaffold (replace with /api/calendar when ready)
  const calendar = [
    { event: 'FOMC Minutes',          time: 'Wed 14:00', priority: 'High' },
    { event: 'CPI Data Release',      time: 'Thu 08:30', priority: 'High' },
    { event: 'EIA Crude Inventories', time: 'Wed 10:30', priority: 'Medium' },
    { event: 'Initial Jobless Claims', time: 'Thu 08:30', priority: 'Medium' },
    { event: 'Retail Sales',          time: 'Fri 08:30', priority: 'Low' },
  ];

  return (
    <div style={{ padding: '20px 24px 40px', maxWidth: 1240, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)',
      }}>
        <div>
          <SectionTitle style={{ marginBottom: 8 }}>dashboard_overview</SectionTitle>
          <div style={{ fontFamily:'var(--font-display)', fontSize:30, fontWeight:800, color:'var(--text)', letterSpacing:'-0.03em', lineHeight:1 }}>
            Market{' '}
            <span style={{ color:'transparent', WebkitTextStroke:'1px rgba(240,244,248,0.2)' }}>Intelligence</span>
          </div>
        </div>
        <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>
          <div><LiveDot />LIVE · {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</div>
          <div style={{ marginTop:4, color:'var(--text-dim)' }}>{session}</div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
        <StatCard
          label="open positions"
          value={positions.length || 0}
          delta={positions.length > 0 ? `${pnlUp ? '+' : ''}$${Math.abs(openPnl).toFixed(0)} unrealized` : 'No open trades'}
          deltaUp={pnlUp}
          sparkPoints="0,35 60,30 120,26 180,20 240,15 280,10"
        />
        <StatCard
          label="screenings today"
          value={activity.length || 0}
          delta="AI analyses run"
          deltaUp
          sparkPoints="0,38 60,34 120,28 180,22 240,16 280,12"
        />
        <StatCard
          label="active alerts"
          value={alerts.length || 0}
          delta={alerts.length > 0 ? 'Monitoring markets' : 'Set price alerts'}
          deltaUp={alerts.length > 0}
          sparkPoints="0,32 80,28 160,22 240,16 280,12"
        />
        <StatCard
          label="session"
          value={<span style={{ fontSize:15, fontFamily:'var(--font-mono)' }}>{session.split(' ')[0]}</span>}
          delta={session}
          deltaUp
        />
      </div>

      {/* ── Row 1: Movers + Brief ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>

        {/* Market movers */}
        <Panel>
          <PanelHeader title="market_movers" />
          {loading ? (
            <div style={{ padding:40, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>
              Fetching live data…
            </div>
          ) : movers.length === 0 ? (
            <EmptyState icon="◎" title="No data" subtitle="market_data_unavailable" />
          ) : (
            <table className="tr-table">
              <thead><tr><th>Asset</th><th>Price</th><th>Change</th><th>Signal</th></tr></thead>
              <tbody>
                {movers.map(m => {
                  const up = (m.changePercent || 0) >= 0;
                  return (
                    <tr key={m.sym}>
                      <td style={{ color:'var(--text)', fontWeight:700, fontFamily:'var(--font-display)', fontSize:13 }}>{m.sym}</td>
                      <td className="tr-num" style={{ color:'var(--text-secondary)' }}>
                        {m.price ? m.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : '—'}
                      </td>
                      <td className="tr-num" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                        {m.changePercent != null ? `${up?'+':''}${m.changePercent.toFixed(2)}%` : '—'}
                      </td>
                      <td><Badge type={up ? 'buy' : 'sell'}>{up ? 'Bull' : 'Bear'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* AI Daily Brief */}
        <Panel>
          <PanelHeader title="ai_daily_brief" />
          <div style={{ padding:16 }}>
            {loading ? (
              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>Generating brief…</div>
            ) : brief ? (
              <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.75 }}>{brief}</div>
            ) : (
              <EmptyState icon="◎" title="No brief yet" subtitle="run_a_screening_first" />
            )}
          </div>
          {activity.length > 0 && (
            <>
              <div style={{ borderTop:'1px solid var(--border)', padding:'10px 16px 4px' }}>
                <span className="tr-label">Recent screenings</span>
              </div>
              {activity.slice(0,5).map((s,i) => (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'8px 16px', borderBottom:'1px solid var(--border)',
                }}>
                  <span style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--text)' }}>
                    {s.commodity}
                  </span>
                  <Badge type={
                    s.overallSignal?.toLowerCase().includes('buy')  ? 'buy'  :
                    s.overallSignal?.toLowerCase().includes('sell') ? 'sell' : 'neutral'
                  }>
                    {s.overallSignal || 'Analyzed'}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </Panel>
      </div>

      {/* ── Row 2: Positions + Calendar + Quick Actions ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 220px', gap:14, marginBottom:14 }}>

        {/* Open positions */}
        <Panel>
          <PanelHeader title="open_positions" action="View All →" />
          {loading ? (
            <div style={{ padding:30, textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>Loading…</div>
          ) : positions.length === 0 ? (
            <EmptyState icon="◎" title="No open positions" subtitle="go_to_commodities_→_positions" />
          ) : (
            <table className="tr-table">
              <thead><tr><th>Asset</th><th>Dir</th><th>Entry</th><th>P&L</th></tr></thead>
              <tbody>
                {positions.slice(0,5).map((p,i) => {
                  const up = (p.unrealizedPnl || 0) >= 0;
                  return (
                    <tr key={i}>
                      <td style={{ color:'var(--text)', fontWeight:700 }}>{p.commodity || p.symbol}</td>
                      <td><Badge type={p.direction === 'LONG' ? 'buy' : 'sell'}>{p.direction}</Badge></td>
                      <td className="tr-num" style={{ color:'var(--text-muted)' }}>{p.entryPrice?.toFixed(2) || '—'}</td>
                      <td className="tr-num" style={{ color: up ? 'var(--green)' : 'var(--red)', fontWeight:700 }}>
                        {p.unrealizedPnl != null ? `${up?'+':''}$${p.unrealizedPnl.toFixed(0)}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* Economic calendar */}
        <Panel>
          <PanelHeader title="economic_calendar" />
          <div style={{ padding:'4px 0' }}>
            {calendar.map((e,i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 18px',
                borderBottom: i < calendar.length-1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{e.event}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{e.time}</div>
                </div>
                <span style={{
                  fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700,
                  letterSpacing:'0.1em', textTransform:'uppercase',
                  color: PRIORITY_COLOR[e.priority] || 'var(--text-muted)',
                  border: `1px solid ${PRIORITY_COLOR[e.priority] || 'var(--border2)'}44`,
                  background: `${PRIORITY_COLOR[e.priority] || 'var(--border2)'}11`,
                  padding:'3px 8px', borderRadius:3,
                }}>{e.priority}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Quick actions */}
        <Panel>
          <PanelHeader title="quick_actions" />
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            <Btn>Run Screener</Btn>
            <Btn ghost>AI Coach</Btn>
            <Btn ghost>Trade Plan</Btn>
            <Btn ghost>Competitions</Btn>
            <Btn ghost>Journal</Btn>
          </div>
        </Panel>
      </div>

      {/* ── Row 3: Active alerts ── */}
      {alerts.length > 0 && (
        <Panel>
          <PanelHeader title="active_alerts" action="Manage →" />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:0 }}>
            {alerts.slice(0,6).map((a,i) => (
              <div key={i} style={{
                padding:'12px 18px',
                borderRight: (i+1) % 3 !== 0 ? '1px solid var(--border)' : 'none',
                borderBottom:'1px solid var(--border)',
              }}>
                <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>
                  {a.commodity}
                </div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>
                  {a.condition} {a.targetPrice}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
