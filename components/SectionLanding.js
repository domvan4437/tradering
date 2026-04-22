
'use client';
import React, { useState } from 'react';

// ── UI Thumbnail previews — adapt to current theme via CSS vars
function UiThumb({ children, label }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 14px',
      height: 80,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {label && (
        <div style={{
          position: 'absolute', top: 7, right: 10,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--accent)', letterSpacing: '0.1em',
          textTransform: 'uppercase', opacity: 0.7,
        }}>{label}</div>
      )}
      {children}
      {/* Fade out bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 24,
        background: 'linear-gradient(transparent, var(--surface2))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// Mini table row
function ThumbRow({ sym, val, up, wide }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: wide ? 52 : 36, height: 7, borderRadius: 2,
        background: 'var(--surface3)', flexShrink: 0,
      }} />
      <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
      <div style={{
        width: 28, height: 5, borderRadius: 2,
        background: up ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
        flexShrink: 0,
      }} />
    </div>
  );
}

// Mini bar chart
function ThumbBars({ vals }) {
  const max = Math.max(...vals.map(v => Math.abs(v)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48, marginTop: 4 }}>
      {vals.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(Math.abs(v) / max) * 100}%`,
          borderRadius: '2px 2px 0 0',
          background: v >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${v >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
        }} />
      ))}
    </div>
  );
}

// Mini sparkline
function ThumbSpark({ points, up }) {
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={points.split(' ').pop().split(',')[0]}
        cy={points.split(' ').pop().split(',')[1]}
        r="2.5"
        fill={up ? 'var(--green)' : 'var(--red)'}
      />
    </svg>
  );
}

// Mini leaderboard row
function ThumbRankRow({ rank, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, opacity: 0.5, flexShrink: 0 }} />
      <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
      <div style={{ width: 22, height: 5, borderRadius: 2, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', flexShrink: 0 }} />
    </div>
  );
}

// Mini signal card
function ThumbSignal({ pct, up }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 30, height: 6, borderRadius: 2, background: 'var(--surface3)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: up ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
      </div>
      <div style={{
        width: 20, height: 14, borderRadius: 2, flexShrink: 0,
        background: up ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
      }} />
    </div>
  );
}

// Mini card blocks for tools
function ThumbToolBlock({ accent }) {
  return (
    <div style={{
      background: 'var(--surface3)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '5px 8px',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ width: 40, height: 5, borderRadius: 2, background: accent || 'var(--accent-bg)', opacity: 0.6 }} />
      <div style={{ width: 56, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
    </div>
  );
}

// ── Shared landing card
function LandingCard({ title, description, icon, accent, onClick, wide, preview }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? (accent || 'var(--accent)') : 'var(--border)'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.18s',
        gridColumn: wide ? 'span 2' : 'span 1',
        overflow: 'hidden',
        boxShadow: hovered ? `0 0 20px ${accent || 'rgba(0,212,255,0.1)'}` : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hover top glow */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accent || 'var(--accent)'}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.18s',
        flexShrink: 0,
      }} />

      {/* UI Thumbnail preview */}
      {preview && (
        <div style={{ flexShrink: 0 }}>
          {preview}
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
            color: hovered ? (accent || 'var(--accent)') : 'var(--text)',
            marginBottom: 6, letterSpacing: '-0.2px',
            transition: 'color 0.18s',
          }}>{title}</div>
          <div style={{
            fontFamily: 'var(--font)', fontSize: 12,
            color: 'var(--text-muted)', lineHeight: 1.6,
          }}>{description}</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: hovered ? (accent || 'var(--accent)') : 'var(--text-dim)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginTop: 12, transition: 'color 0.18s',
        }}>Open →</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MARKETS LANDING
// ─────────────────────────────────────────────────────
export function MarketsLanding({ onSelect }) {
  const CARDS = [
    {
      title: 'Commodities',
      tab: 'Commodities',
      accent: '#d97706',
      tags: ['Metals', 'Energy', 'Grains', 'Softs'],
      description: 'COT commercial positioning, seasonal windows, and AI screening across metals, energy, grains, and softs.',
      pills: ['COT Index', 'Seasonal', 'Screener'],
      pillColors: ['#6366f1', '#16a34a', '#d97706'],
      prices: [
        { name: 'Gold',    pct: +0.40, up: true  },
        { name: 'Crude',   pct: -1.27, up: false },
        { name: 'NatGas',  pct: +3.21, up: true  },
        { name: 'Wheat',   pct: -0.17, up: false },
      ],
    },
    {
      title: 'Futures',
      tab: 'Futures',
      accent: '#6366f1',
      tags: ['Equity Index', 'Rates', 'FX Futures'],
      description: 'Financial, equity index, rates, and FX futures. Live prices across all major CME and CBOT contracts.',
      pills: ['CME', 'CBOT', 'COT'],
      pillColors: ['#6366f1', '#0891b2', '#7c3aed'],
      prices: [
        { name: 'S&P 500', pct: +0.31, up: true },
        { name: 'Nasdaq',  pct: +0.44, up: true },
        { name: 'T-Bond',  pct: +0.12, up: true },
        { name: 'T-Note',  pct: +0.08, up: true },
      ],
    },
    {
      title: 'Forex',
      tab: 'Forex',
      accent: '#0891b2',
      tags: ['Majors', 'Crosses'],
      description: 'Currency pair analysis with COT positioning, key support levels, and economic calendar integration.',
      pills: ['COT Data', 'Key Levels', '8 Pairs'],
      pillColors: ['#6366f1', '#0891b2', '#10b981'],
      prices: [
        { name: 'EUR/USD', pct: +0.39, up: true  },
        { name: 'GBP/USD', pct: +0.31, up: true  },
        { name: 'USD/JPY', pct: -0.44, up: false },
        { name: 'AUD/USD', pct: +0.21, up: true  },
      ],
    },
    {
      title: 'Stocks',
      tab: 'Stocks',
      accent: '#10b981',
      tags: ['Tech', 'Finance', 'Energy'],
      description: 'Sector rotation, earnings calendar, and key price levels across major US and global equities.',
      pills: ['NASDAQ', 'NYSE', 'Earnings'],
      pillColors: ['#6366f1', '#0891b2', '#10b981'],
      prices: [
        { name: 'Apple',  pct: +1.24, up: true  },
        { name: 'Nvidia', pct: +3.84, up: true  },
        { name: 'MSFT',   pct: +0.62, up: true  },
        { name: 'JPM',    pct: -0.38, up: false },
      ],
    },
    {
      title: 'Crypto',
      tab: 'Crypto',
      accent: '#f59e0b',
      tags: ['Layer 1', 'DeFi', 'Payments'],
      description: 'Live prices for 50 top digital assets. Filter by category, sort by performance, track your watchlist.',
      pills: ['50 Assets', 'Live Prices', 'Watchlist'],
      pillColors: ['#f59e0b', '#16a34a', '#6366f1'],
      prices: [
        { name: 'Bitcoin',  pct: +0.14, up: true  },
        { name: 'Ethereum', pct: +1.82, up: true  },
        { name: 'Solana',   pct: -0.62, up: false },
        { name: 'BNB',      pct: +0.44, up: true  },
      ],
    },
    {
      title: 'Charts',
      tab: 'Charts',
      accent: '#7c3aed',
      tags: ['Candlesticks', 'Indicators'],
      description: 'Full charting workspace with candlestick charts, 50+ technical indicators, and drawing tools across all markets.',
      pills: ['Candlesticks', '50+ Indicators', 'All Markets'],
      pillColors: ['#6366f1', '#7c3aed', '#10b981'],
      isChart: true,
    },
  ];

  const [hovered, setHovered] = React.useState(null);

  return (
    <div style={{ padding: '28px 24px 48px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Markets</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.8px', marginBottom: 8 }}>One platform. Every market.</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.6 }}>COT intelligence, seasonal data, and live prices across every major asset class — all verified, all in one place.</div>
      </div>

      {/* Card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {CARDS.map(card => {
          const isHov = hovered === card.title;
          return (
            <div
              key={card.title}
              onClick={() => onSelect && onSelect(card.tab)}
              onMouseEnter={() => setHovered(card.title)}
              onMouseLeave={() => setHovered(null)}
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isHov ? card.accent : 'var(--border)'}`,
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.18s',
                boxShadow: isHov ? `0 6px 24px ${card.accent}22` : 'none',
                transform: isHov ? 'translateY(-2px)' : 'none',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                height: 96, background: card.isChart ? '#0f172a' : 'var(--surface2)',
                borderBottom: '1px solid var(--border)', padding: '12px 16px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${card.accent}, transparent)` }} />
                {card.isChart ? (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(139,92,246,0.8)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>GC=F · Gold · 1D</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
                      {[{h:10,b:14,u:true},{h:6,b:10,u:false},{h:8,b:12,u:true},{h:5,b:18,u:true},{h:7,b:11,u:false},{h:6,b:22,u:true},{h:8,b:15,u:false},{h:5,b:20,u:true}].map((c,i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <div style={{ width: 1, height: c.h * 0.4, background: c.u ? '#22c55e' : '#ef4444', opacity: 0.5 }} />
                          <div style={{ width: 7, height: c.b * 0.55 + 5, background: c.u ? '#22c55e' : '#ef4444', borderRadius: 1, opacity: 0.9 }} />
                          <div style={{ width: 1, height: c.h * 0.3, background: c.u ? '#22c55e' : '#ef4444', opacity: 0.5 }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ position: 'absolute', top: 14, right: 12, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#4ade80' }}>4,848</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: card.accent, marginBottom: 8, opacity: 0.9 }}>
                      {card.tags.slice(0, 2).join(' · ')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {card.prices.map(p => (
                        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>{p.name}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: p.up ? 'var(--green)' : 'var(--red)' }}>{p.up ? '+' : ''}{p.pct.toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '14px 18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>{card.title}</span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 9, fontWeight: 500, color: card.accent, background: `${card.accent}15`, padding: '2px 8px', borderRadius: 20, border: `0.5px solid ${card.accent}30` }}>
                    {card.tags.join(' · ')}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>{card.description}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {card.pills.map((pill, i) => (
                      <span key={pill} style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, color: card.pillColors[i] || 'var(--accent)', background: `${card.pillColors[i]}12`, padding: '2px 9px', borderRadius: 20, border: `0.5px solid ${card.pillColors[i]}25` }}>{pill}</span>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: isHov ? card.accent : 'var(--text-muted)', transition: 'color 0.15s', whiteSpace: 'nowrap', marginLeft: 8 }}>Open →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommunityLanding({ onSelect }) {
  const [now] = React.useState(new Date());
  const hour = now.getHours();

  const NAV_CARDS = [
    { tab:'Feed',           icon:'📰', color:'#6366f1', stat:'142 posts today',    desc:'Ideas, calls & updates from verified traders.' },
    { tab:'Groups',         icon:'👥', color:'#16a34a', stat:'24 active groups',   desc:'Join communities built around your market & style.' },
    { tab:'Compete',        icon:'⚔️',  color:'#dc2626', stat:'3 live contests',   desc:'H2H challenges and tournaments with real prize pools.' },
    { tab:'Leaderboard',    icon:'🏆', color:'#d97706', stat:'847 ranked traders', desc:'Verified track records ranked by asset class.' },
    { tab:'Creator Studio', icon:'🎙', color:'#7c3aed', stat:'Start earning →',    desc:'Publish screeners, run paid groups, monetize your edge.' },
  ];

  const TOP_CALLS = [
    { user:'commodityking', avatar:'C', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', verified:true,  style:'Swing', dir:'Long',  asset:'Gold',    body:'COT commercials hit 85th percentile. Seasonal tailwind April. Price coiling above key support at 4,780.', cot:82, cotUp:true,  likes:142, comments:31, time:'2h ago' },
    { user:'fxpro_trader',  avatar:'F', grad:'linear-gradient(135deg,#0891b2,#0e7490)', verified:false, style:'Day',   dir:'Short', asset:'EUR/USD', body:'DXY bouncing off support. EUR rejected 1.0850. Large specs reducing longs 3rd consecutive week. Target 1.0750.', cot:null, cotUp:null, likes:89,  comments:18, time:'3h ago' },
    { user:'energydesk',    avatar:'E', grad:'linear-gradient(135deg,#ef4444,#dc2626)', verified:false, style:'Pos',   dir:'Short', asset:'Crude',   body:'Crude rejected 200-day MA twice. EIA showed large inventory build. COT commercials net short. Monthly seasonal bearish through May.', cot:31, cotUp:false, likes:76, comments:22, time:'4h ago' },
  ];

  const LEADERS = [
    { rank:1, user:'seasonaltrader', avatar:'S', grad:'linear-gradient(135deg,#16a34a,#15803d)', pct:'+18.4%', style:'Swing' },
    { rank:2, user:'commodityking',  avatar:'C', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', pct:'+14.2%', style:'Swing' },
    { rank:3, user:'energydesk',     avatar:'E', grad:'linear-gradient(135deg,#ef4444,#dc2626)', pct:'+11.8%', style:'Pos'   },
  ];

  const GROUPS = [
    { name:'COT Traders',        members:847, ago:'2m ago',  accent:'#6366f1' },
    { name:'Grain Swing Traders',members:312, ago:'8m ago',  accent:'#16a34a' },
    { name:'FX Macro Club',      members:204, ago:'14m ago', accent:'#0891b2' },
  ];

  const rankColors = { 1:'#d97706', 2:'#9ca3af', 3:'#cd7f32' };

  return (
    <div style={{ fontFamily:'var(--font)' }}>

      {/* ── Header ── */}
      <div style={{ padding:'22px 26px 18px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8 }}>Community</div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:24, fontWeight:700, color:'var(--text)', letterSpacing:'-0.6px' }}>What's happening today</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', marginTop:4 }}>
              {now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · 847 traders active
            </div>
          </div>
          <div style={{ display:'flex', gap:24, textAlign:'center' }}>
            {[{val:'142',label:'Ideas today',color:'var(--accent)'},{val:'89',label:'Long calls',color:'var(--green)'},{val:'53',label:'Short calls',color:'var(--red)'}].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:700, color:s.color, letterSpacing:'-0.5px' }}>{s.val}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main body: trade calls + sidebar ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', borderBottom:'1px solid var(--border)' }}>

        {/* Trade calls */}
        <div style={{ borderRight:'1px solid var(--border)' }}>
          <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>🔥 Top Trade Calls Today</span>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }} onClick={() => onSelect('Feed')}>View all →</span>
          </div>
          {TOP_CALLS.map((c, i) => (
            <div key={i}
              style={{ padding:'14px 20px', borderBottom: i < TOP_CALLS.length-1 ? '1px solid var(--border)' : 'none', display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer', transition:'background 0.1s' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <div style={{ width:30, height:30, borderRadius:'50%', background:c.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{c.avatar}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.user}</span>
                  {c.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
                  <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background: c.dir==='Long' ? 'var(--green-bg)' : 'var(--red-bg)', color: c.dir==='Long' ? 'var(--green)' : 'var(--red)', padding:'2px 8px', borderRadius:20 }}>{c.dir} · {c.asset}</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-dim)', marginLeft:'auto' }}>{c.time}</span>
                </div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.55, marginBottom:6 }}>{c.body}</div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {c.cot != null && (
                    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ width:50, height:4, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ width:`${c.cot}%`, height:'100%', background: c.cotUp ? 'linear-gradient(90deg,#bbf7d0,#16a34a)' : 'linear-gradient(90deg,#fca5a5,#dc2626)', borderRadius:2 }} />
                      </div>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color: c.cotUp ? 'var(--green)' : 'var(--red)' }}>COT {c.cot}%</span>
                    </div>
                  )}
                  <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>♥ {c.likes} · 💬 {c.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar: leaderboard + groups */}
        <div>
          {/* Leaderboard */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>🏆 Live Leaderboard</span>
              <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }} onClick={() => onSelect('Leaderboard')}>Full →</span>
            </div>
          </div>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:10 }}>
            {LEADERS.map(l => (
              <div key={l.rank} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:rankColors[l.rank], minWidth:16 }}>{l.rank}</span>
                <div style={{ width:24, height:24, borderRadius:'50%', background:l.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{l.avatar}</div>
                <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', flex:1 }}>{l.user}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--green)' }}>{l.pct}</span>
              </div>
            ))}
          </div>

          {/* Active groups */}
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>⚡ Active Groups</span>
              <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }} onClick={() => onSelect('Groups')}>All →</span>
            </div>
          </div>
          <div style={{ padding:'8px 16px', display:'flex', flexDirection:'column', gap:2 }}>
            {GROUPS.map((g, i) => (
              <div key={i}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 10px', borderRadius:8, cursor:'pointer', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:g.accent, flexShrink:0 }} />
                  <div>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{g.name}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.members.toLocaleString()} members · {g.ago}</div>
                  </div>
                </div>
                <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, background:'var(--accent-bg)', color:'var(--accent)', padding:'2px 9px', borderRadius:20, border:'1px solid var(--accent-border)', flexShrink:0 }}>Join</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── B-style icon nav cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, padding:'16px 20px' }}>
        {NAV_CARDS.map(card => (
          <div key={card.tab}
            onClick={() => onSelect(card.tab)}
            style={{ border:'1px solid var(--border)', borderRadius:12, padding:'18px 16px', cursor:'pointer', transition:'all 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=card.color; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 6px 20px ${card.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
          >
            <div style={{ fontSize:22, marginBottom:10 }}>{card.icon}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{card.tab}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', lineHeight:1.5, marginBottom:10 }}>{card.desc}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:600, color:card.color }}>{card.stat}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ToolsLanding({ onSelect }) {
  const cards = [
    {
      title: 'Trade Calculator',
      description: 'Position sizing, risk/reward, and P&L calculation for any market.',
      accent: 'var(--accent)', tab: 'Trade Calc',
      preview: (
        <UiThumb label="calculator">
          {['Entry', 'Stop', 'Target', 'Size'].map((l, i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 40, height: 7, borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border2)' }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'AI Coach',
      description: 'Personalized coaching based on your trade history and journal entries.',
      accent: 'var(--green)', tab: 'AI Coach',
      preview: (
        <UiThumb label="ai coach">
          {[1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === 1 ? 'var(--accent-bg)' : 'var(--surface3)', border: `1px solid ${i === 1 ? 'var(--accent-border)' : 'var(--border)'}`, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'var(--surface3)' }} />
                <div style={{ width: '60%', height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
              </div>
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Trade Plan Builder',
      description: 'Build a complete structured trade plan before you press the button.',
      accent: 'var(--accent)', tab: 'Trade Plan Builder',
      preview: (
        <UiThumb label="trade plan">
          <ThumbRow sym="Entry" up={true} />
          <ThumbRow sym="Stop" up={false} />
          <ThumbRow sym="Target" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'COT Alerts',
      description: 'Get notified when COT positioning reaches your defined thresholds.',
      accent: 'var(--gold)', tab: 'COT Alerts',
      preview: (
        <UiThumb label="alerts">
          <ThumbSignal pct={88} up={true} />
          <ThumbSignal pct={72} up={true} />
          <ThumbSignal pct={45} up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Backtesting',
      description: 'Analyze historical performance of your screener signals.',
      accent: 'var(--accent)', tab: 'Backtesting',
      preview: (
        <UiThumb label="backtest">
          <ThumbBars vals={[2.1, 3.4, -1.2, 4.2, 2.8, -0.8, 5.1]} />
        </UiThumb>
      ),
    },
    {
      title: 'Strategy Backtest',
      description: 'Full strategy backtesting with custom entry/exit rules.',
      accent: '#a78bfa', tab: 'Strategy Backtest',
      preview: (
        <UiThumb label="strategy">
          <ThumbSpark points="0,30 20,26 40,20 60,22 80,14 100,10 120,12" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'Weekly Review',
      description: 'Structured weekly performance review every trading week.',
      accent: 'var(--green)', tab: 'Weekly Review',
      preview: (
        <UiThumb label="review">
          {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 20, height: 5, borderRadius: 2, background: 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface2)', overflow: 'hidden' }}>
                <div style={{ width: `${[60,80,40,90,70][i]}%`, height: '100%', background: [1,1,0,1,1][i] ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Notes',
      description: 'Quick notes tied to markets or dates. Research and observations.',
      accent: 'var(--accent)', tab: 'Notes',
      preview: (
        <UiThumb label="notes">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: `${[70,90,55][i-1]}px`, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: `${[100,80,120][i-1]}px`, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Creator Studio',
      description: 'Publish groups, create courses, host tournaments. Trader plan.',
      accent: 'var(--gold)', tab: 'Creator Studio',
      preview: (
        <UiThumb label="creator">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 4 }}>
            <ThumbToolBlock accent="var(--gold-bg)" />
            <ThumbToolBlock accent="var(--accent-bg)" />
          </div>
        </UiThumb>
      ),
    },
    {
      title: 'Broker',
      description: 'Connect your brokerage to sync real trades automatically.',
      accent: 'var(--accent)', tab: 'Broker',
      preview: (
        <UiThumb label="broker sync">
          {['Tradovate','Alpaca','IBKR'].map((b, i) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--green)' : 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 28, height: 12, borderRadius: 3, background: i === 0 ? 'var(--green-bg)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'var(--green-border)' : 'var(--border2)'}`, flexShrink: 0 }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'My Profile',
      description: 'Set your visibility, earn your verified badge, and apply to prop firms with your track record.',
      accent: 'var(--accent)', tab: 'My Profile',
      preview: (
        <UiThumb label="profile">
          {['Private','Invite Only','Public'].map((v, i) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 5, borderRadius: 2, background: i === 2 ? 'var(--accent-bg)' : 'var(--surface3)', border: i === 2 ? '1px solid var(--accent-border)' : 'none' }} />
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: i === 2 ? 'var(--accent-bg)' : 'var(--surface3)', border: `1px solid ${i === 2 ? 'var(--accent-border)' : 'var(--border2)'}` }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Settings',
      description: 'Theme, notifications, display preferences, and account management.',
      accent: 'var(--text-muted)', tab: 'Settings',
      preview: (
        <UiThumb label="settings">
          {['Theme','Notifications','Account','Display'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: `${[40,70,48,52][i]}px`, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 24, height: 12, borderRadius: 6, background: i === 0 ? 'var(--accent-bg)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border2)'}` }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Tools</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Your trading cockpit.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>Everything in one place.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          Plan trades, review performance, set alerts, and connect your broker.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cards.map(c => <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// NEWS LANDING
// ─────────────────────────────────────────────────────
export function NewsLanding({ onSelect }) {
  const cards = [
    {
      title: 'All Markets',
      description: 'Every major market-moving headline in one feed with AI sentiment scoring.',
      accent: 'var(--accent)', tab: 'All Markets', wide: true,
      preview: (
        <UiThumb label="news feed">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ width: '85%', height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
                <div style={{ width: '65%', height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
              </div>
              <div style={{ width: 22, height: 14, borderRadius: 3, background: [1,0,1][i-1] ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${[1,0,1][i-1] ? 'var(--green-border)' : 'var(--red-border)'}`, flexShrink: 0 }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Forex',
      description: 'Central bank decisions and currency-specific news with sentiment.',
      accent: 'var(--accent)', tab: 'Forex',
      preview: (
        <UiThumb label="forex news">
          <ThumbSignal pct={75} up={false} />
          <ThumbSignal pct={60} up={true} />
          <ThumbSignal pct={85} up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Commodities',
      description: 'Supply, weather, geopolitical shifts, and inventory data.',
      accent: 'var(--green)', tab: 'Commodities',
      preview: (
        <UiThumb label="commodities news">
          <ThumbRow sym="GC" up={true} />
          <ThumbRow sym="CL" up={false} />
          <ThumbRow sym="NG" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'Stocks',
      description: 'Earnings, analyst ratings, and sector-moving events.',
      accent: '#a78bfa', tab: 'Stocks',
      preview: (
        <UiThumb label="stocks news">
          <ThumbBars vals={[2.4, -1.1, 3.2, -0.8, 1.9]} />
        </UiThumb>
      ),
    },
    {
      title: 'Crypto',
      description: 'On-chain data, regulatory updates, and digital asset news.',
      accent: '#f59e0b', tab: 'Crypto',
      preview: (
        <UiThumb label="crypto news">
          <ThumbSpark points="0,28 20,22 40,18 60,24 80,14 100,10 120,16" up={true} />
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>News</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Market intelligence.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>Signal over noise.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          Market-moving news filtered by asset class with AI sentiment on every headline.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map(c => <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />)}
      </div>
    </div>
  );
}
