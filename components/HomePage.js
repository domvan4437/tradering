
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, StatCard, Badge, LiveDot, SectionTitle, Btn, EmptyState, HeroCard } from './DS';

const PRIORITY_COLOR = { High:'var(--accent)', Medium:'var(--green)', Low:'var(--text-muted)' };

export default function HomePage({ user }) {
  const [movers, setMovers]     = useState([]);
  const [activity, setActivity] = useState([]);
  const [positions, setPos]     = useState([]);
  const [brief, setBrief]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/prices').then(r=>r.json()).catch(()=>({})),
      fetch('/api/screenings?limit=6').then(r=>r.json()).catch(()=>({})),
      fetch('/api/positions').then(r=>r.json()).catch(()=>({})),
      fetch('/api/brief').then(r=>r.json()).catch(()=>({})),
    ]).then(([p, a, pos, b]) => {
      setMovers(p.prices ? Object.entries(p.prices).map(([sym,d])=>({sym,...d})).sort((a,b)=>Math.abs(b.changePercent||0)-Math.abs(a.changePercent||0)).slice(0,8) : []);
      setActivity(a.screenings || []);
      setPos(pos.positions || []);
      setBrief(b.brief || b.text || null);
      setLoading(false);
    });
  }, []);

  const hour = new Date().getHours();
  const session = hour < 6 ? 'Asian Session' : hour < 12 ? 'London Session' : hour < 17 ? 'New York Session' : 'After Hours';
  const openPnl = positions.reduce((s,p) => s + (p.unrealizedPnl||0), 0);
  const pnlUp   = openPnl >= 0;

  const calendar = [
    { event:'FOMC Minutes',          time:'Wed 14:00', priority:'High' },
    { event:'CPI Data Release',      time:'Thu 08:30', priority:'High' },
    { event:'EIA Crude Inventories', time:'Wed 10:30', priority:'Medium' },
    { event:'Initial Jobless Claims', time:'Thu 08:30', priority:'Medium' },
    { event:'Retail Sales',          time:'Fri 08:30', priority:'Low' },
  ];

  return (
    <div style={{ padding:'20px 24px 40px', maxWidth:1240, margin:'0 auto' }}>

      {/* ── Hero Card (D gradient) ── */}
      <HeroCard style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.65)', marginBottom:6 }}>
              Dashboard Overview
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:30, fontWeight:300, color:'#fff', letterSpacing:'-1.5px', lineHeight:1, marginBottom:6 }}>
              {loading ? '—' : `$${(24841).toLocaleString()}`}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'rgba(255,255,255,0.75)', marginBottom:14 }}>
              <LiveDot />{session} · {new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label: user?.plan ? `${user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan` : 'Free Plan', show: true },
                { label: `${activity.length} Screenings Today`, show: activity.length > 0 },
                { label: `${positions.length} Open Positions`, show: positions.length > 0 },
                { label: session, show: true },
              ].filter(p => p.show).map(p => (
                <div key={p.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'#fff', fontWeight:500 }}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:4 }}>Session P&L</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:600, color:'#fff' }}>
              {pnlUp ? '+' : ''}${Math.abs(openPnl).toFixed(0)}
            </div>
          </div>
        </div>
      </HeroCard>

      {/* ── Stat strip (B minimal) ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        <StatCard label="Open Positions" value={positions.length || 0} delta={positions.length > 0 ? `${pnlUp?'+':''}$${Math.abs(openPnl).toFixed(0)} unrealized` : 'No open trades'} deltaUp={pnlUp} sparkPoints="0,30 60,26 120,20 180,16 240,12 280,8" />
        <StatCard label="Screenings Today" value={activity.length || 0} delta="AI analyses run" deltaUp sparkPoints="0,34 80,28 160,20 240,14 280,10" />
        <StatCard label="Win Rate" value={<span style={{fontFamily:'var(--font-mono)'}}>68%</span>} delta="Last 30 days" deltaUp sparkPoints="0,28 80,24 160,18 240,14 280,10" />
        <StatCard label="Consistency" value={74} delta="Swing Trader" deltaUp sparkPoints="0,32 80,26 160,20 240,16 280,12" />
      </div>

      {/* ── Main grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16, marginBottom:16 }}>

        {/* Market movers table (B) */}
        <Panel>
          <PanelHeader title="Market Movers" action="View all →" />
          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text-muted)', fontFamily:'var(--font)' }}>Fetching live data…</div>
          ) : movers.length === 0 ? (
            <EmptyState icon="◎" title="No data" subtitle="Market data unavailable" />
          ) : (
            <table className="tr-table">
              <thead><tr><th>Asset</th><th>Price</th><th>24h</th><th>Signal</th></tr></thead>
              <tbody>
                {movers.map(m => {
                  const up = (m.changePercent||0) >= 0;
                  return (
                    <tr key={m.sym}>
                      <td style={{ fontWeight:600, color:'var(--text)' }}>{m.sym}</td>
                      <td className="tr-num" style={{ color:'var(--text-secondary)' }}>
                        {m.price ? m.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:4}) : '—'}
                      </td>
                      <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color: up ? 'var(--green)' : 'var(--red)' }}>
                        {m.changePercent != null ? `${up?'+':''}${m.changePercent.toFixed(2)}%` : '—'}
                      </td>
                      <td><Badge type={up?'buy':'sell'}>{up?'Bull':'Bear'}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>

        {/* AI Brief + recent screenings */}
        <Panel>
          <PanelHeader title="AI Daily Brief" />
          <div style={{ padding:16 }}>
            {loading ? (
              <div style={{ color:'var(--text-muted)', fontSize:13 }}>Generating brief…</div>
            ) : brief ? (
              <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.7 }}>{brief}</div>
            ) : (
              <EmptyState icon="◎" title="No brief yet" subtitle="Run a screening to generate" />
            )}
          </div>
          {activity.length > 0 && (
            <>
              <div style={{ borderTop:'1px solid var(--border)', padding:'10px 16px 4px' }}>
                <span className="tr-label">Recent Screenings</span>
              </div>
              {activity.slice(0,5).map((s,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 16px', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.commodity}</span>
                  <Badge type={s.overallSignal?.toLowerCase().includes('buy')?'buy':s.overallSignal?.toLowerCase().includes('sell')?'sell':'neutral'}>
                    {s.overallSignal || 'Analyzed'}
                  </Badge>
                </div>
              ))}
            </>
          )}
        </Panel>
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 200px', gap:16 }}>

        {/* Positions */}
        <Panel>
          <PanelHeader title="Open Positions" action="View All →" />
          {positions.length === 0 ? (
            <EmptyState icon="◎" title="No open positions" subtitle="Go to Markets → Positions" />
          ) : (
            <table className="tr-table">
              <thead><tr><th>Asset</th><th>Dir</th><th>Entry</th><th>P&L</th></tr></thead>
              <tbody>
                {positions.slice(0,4).map((p,i) => {
                  const up = (p.unrealizedPnl||0) >= 0;
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight:600, color:'var(--text)' }}>{p.commodity||p.symbol}</td>
                      <td><Badge type={p.direction==='LONG'?'buy':'sell'}>{p.direction}</Badge></td>
                      <td className="tr-num" style={{ color:'var(--text-muted)' }}>{p.entryPrice?.toFixed(2)||'—'}</td>
                      <td style={{ fontFamily:'var(--font-mono)', fontWeight:600, color:up?'var(--green)':'var(--red)' }}>
                        {p.unrealizedPnl!=null?`${up?'+':''}$${p.unrealizedPnl.toFixed(0)}`:'—'}
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
          <PanelHeader title="Economic Calendar" />
          <div style={{ padding:'4px 0' }}>
            {calendar.map((e,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', borderBottom: i < calendar.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{e.event}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{e.time}</div>
                </div>
                <span style={{
                  fontFamily:'var(--font)', fontSize:11, fontWeight:600,
                  color: PRIORITY_COLOR[e.priority],
                  background: e.priority==='High' ? 'var(--accent-bg)' : e.priority==='Medium' ? 'var(--green-bg)' : 'var(--surface3)',
                  padding:'3px 10px', borderRadius:20,
                }}>{e.priority}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Quick actions — D pill buttons */}
        <Panel>
          <PanelHeader title="Quick Actions" />
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            <Btn>Run Screener</Btn>
            <Btn ghost>AI Coach</Btn>
            <Btn ghost>Trade Plan</Btn>
            <Btn ghost>Competitions</Btn>
          </div>
        </Panel>
      </div>
    </div>
  );
}
