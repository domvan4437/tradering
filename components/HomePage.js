
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Badge, LiveDot, Btn, HeroCard, StatCard } from './DS';

// ── Market assets by class
const MARKET_TABS = [
  { label: 'All', syms: [
    { sym:'GC=F',     name:'Gold',        cat:'Metals'  },
    { sym:'CL=F',     name:'Crude Oil',   cat:'Energy'  },
    { sym:'ES=F',     name:'S&P 500',     cat:'Index'   },
    { sym:'EURUSD=X', name:'EUR/USD',     cat:'Forex'   },
    { sym:'BTC-USD',  name:'Bitcoin',     cat:'Crypto'  },
    { sym:'ZW=F',     name:'Wheat',       cat:'Grains'  },
    { sym:'SI=F',     name:'Silver',      cat:'Metals'  },
    { sym:'NG=F',     name:'Nat Gas',     cat:'Energy'  },
    { sym:'NQ=F',     name:'Nasdaq',      cat:'Index'   },
    { sym:'GBPUSD=X', name:'GBP/USD',     cat:'Forex'   },
    { sym:'ETH-USD',  name:'Ethereum',    cat:'Crypto'  },
    { sym:'ZC=F',     name:'Corn',        cat:'Grains'  },
  ]},
  { label: 'Commodities', syms: [
    { sym:'GC=F',  name:'Gold',      cat:'Metals'  },
    { sym:'SI=F',  name:'Silver',    cat:'Metals'  },
    { sym:'HG=F',  name:'Copper',    cat:'Metals'  },
    { sym:'CL=F',  name:'Crude Oil', cat:'Energy'  },
    { sym:'NG=F',  name:'Nat Gas',   cat:'Energy'  },
    { sym:'RB=F',  name:'RBOB Gas',  cat:'Energy'  },
    { sym:'ZW=F',  name:'Wheat',     cat:'Grains'  },
    { sym:'ZC=F',  name:'Corn',      cat:'Grains'  },
    { sym:'ZS=F',  name:'Soybeans',  cat:'Grains'  },
    { sym:'CT=F',  name:'Cotton',    cat:'Softs'   },
    { sym:'KC=F',  name:'Coffee',    cat:'Softs'   },
    { sym:'SB=F',  name:'Sugar',     cat:'Softs'   },
  ]},
  { label: 'Futures', syms: [
    { sym:'ES=F',  name:'E-mini S&P 500', cat:'Index'   },
    { sym:'NQ=F',  name:'Nasdaq 100',     cat:'Index'   },
    { sym:'YM=F',  name:'Dow Jones',      cat:'Index'   },
    { sym:'RTY=F', name:'Russell 2000',   cat:'Index'   },
    { sym:'ZB=F',  name:'T-Bond 30Y',     cat:'Rates'   },
    { sym:'ZN=F',  name:'T-Note 10Y',     cat:'Rates'   },
    { sym:'GC=F',  name:'Gold',           cat:'Metals'  },
    { sym:'CL=F',  name:'Crude Oil',      cat:'Energy'  },
  ]},
  { label: 'Forex', syms: [
    { sym:'EURUSD=X', name:'EUR/USD', cat:'Forex' },
    { sym:'GBPUSD=X', name:'GBP/USD', cat:'Forex' },
    { sym:'USDJPY=X', name:'USD/JPY', cat:'Forex' },
    { sym:'AUDUSD=X', name:'AUD/USD', cat:'Forex' },
    { sym:'USDCAD=X', name:'USD/CAD', cat:'Forex' },
    { sym:'NZDUSD=X', name:'NZD/USD', cat:'Forex' },
    { sym:'USDCHF=X', name:'USD/CHF', cat:'Forex' },
    { sym:'EURGBP=X', name:'EUR/GBP', cat:'Forex' },
  ]},
  { label: 'Crypto', syms: [
    { sym:'BTC-USD', name:'Bitcoin',  cat:'Crypto' },
    { sym:'ETH-USD', name:'Ethereum', cat:'Crypto' },
    { sym:'SOL-USD', name:'Solana',   cat:'Crypto' },
    { sym:'BNB-USD', name:'BNB',      cat:'Crypto' },
    { sym:'XRP-USD', name:'XRP',      cat:'Crypto' },
    { sym:'ADA-USD', name:'Cardano',  cat:'Crypto' },
  ]},
  { label: 'Stocks', syms: [
    { sym:'AAPL',  name:'Apple',      cat:'Tech'    },
    { sym:'MSFT',  name:'Microsoft',  cat:'Tech'    },
    { sym:'GOOGL', name:'Alphabet',   cat:'Tech'    },
    { sym:'NVDA',  name:'Nvidia',     cat:'Tech'    },
    { sym:'AMZN',  name:'Amazon',     cat:'Tech'    },
    { sym:'META',  name:'Meta',       cat:'Tech'    },
    { sym:'TSLA',  name:'Tesla',      cat:'Auto'    },
    { sym:'JPM',   name:'JPMorgan',   cat:'Finance' },
    { sym:'BRK-B', name:'Berkshire',  cat:'Finance' },
    { sym:'XOM',   name:'ExxonMobil', cat:'Energy'  },
  ]},
];

// ── News (static placeholders — replace with real API later)
const NEWS_ITEMS = [
  { headline: 'Gold surges past $2,400 as dollar weakens on Fed pause expectations', source: 'Reuters', time: '12m ago', tag: 'Metals', up: true },
  { headline: 'Crude oil falls 1.2% after surprise inventory build in EIA report', source: 'Bloomberg', time: '34m ago', tag: 'Energy', up: false },
  { headline: 'EUR/USD holds above 1.08 ahead of ECB rate decision Thursday', source: 'FXStreet', time: '1h ago', tag: 'Forex', up: true },
  { headline: 'S&P 500 futures flat as markets digest mixed earnings from big banks', source: 'WSJ', time: '1h ago', tag: 'Indices', up: false },
  { headline: 'Natural gas spikes 3% on unexpected cold snap forecast for northeast', source: 'MarketWatch', time: '2h ago', tag: 'Energy', up: true },
  { headline: 'Bitcoin reclaims $68K level as institutional inflows accelerate', source: 'CoinDesk', time: '2h ago', tag: 'Crypto', up: true },
  { headline: 'Wheat prices rise on Black Sea supply concerns after new sanctions', source: 'Reuters', time: '3h ago', tag: 'Grains', up: true },
  { headline: 'Fed minutes signal patience on rate cuts, dollar rebounds', source: 'CNBC', time: '4h ago', tag: 'Macro', up: false },
];

// ── Community items (mix of posts, screeners, strategies)
const COMMUNITY_ITEMS = [
  { type: 'idea', user: 'commodityking', avatar: 'C', style: 'Swing', asset: 'Gold', direction: 'Long', body: 'COT commercials hit 85th percentile this week. Seasonal tailwind starting in April. Price coiling above key support. Watching for the weekly close above 2,340 to confirm entry.', likes: 142, comments: 31, time: '2h ago', verified: true },
  { type: 'screener', user: 'cotmaster', avatar: 'C', style: 'Position', name: 'COT Extreme Setup', description: 'Flags assets when commercial positioning hits 80th+ percentile AND seasonal score exceeds 70. Currently flagging 3 assets.', uses: 847, forks: 124, time: '5h ago', verified: true },
  { type: 'idea', user: 'fxpro_trader', avatar: 'F', style: 'Day Trader', asset: 'EUR/USD', direction: 'Short', body: 'DXY bouncing off major support while EUR/USD rejected from 1.0850 resistance. COT shows large specs reducing longs for 3rd consecutive week. Targeting 1.0750.', likes: 89, comments: 18, time: '3h ago', verified: false },
  { type: 'strategy', user: 'seasonaltrader', avatar: 'S', style: 'Swing', name: 'Spring Grain Seasonal', description: 'Captures the April-June seasonal window in corn and soybeans. Uses COT confirmation + price action entry. 67% win rate over 8 years of backtesting.', likes: 203, forks: 67, time: '1d ago', verified: true },
  { type: 'idea', user: 'energydesk', avatar: 'E', style: 'Position', asset: 'Crude Oil', direction: 'Short', body: 'Crude rejected the 200-day MA for the second time this month. EIA showed a large inventory build. COT commercials are net short. Monthly seasonal is bearish through May. Multiple confluences aligning for a short.', likes: 76, comments: 22, time: '4h ago', verified: false },
  { type: 'screener', user: 'alpharesearch', avatar: 'A', style: 'Macro', name: 'Multi-Timeframe COT Divergence', description: 'Identifies markets where the 13-week and 26-week COT trends diverge — often precedes large directional moves. Advanced protocol for serious traders.', uses: 412, forks: 89, time: '2d ago', verified: true },
];

const fmt = (p) => {
  if (!p) return '—';
  if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1) return p.toFixed(4);
  return p.toFixed(5);
};

// ── Helpers
const CAT_COLORS = {
  Metals:   { bg:'#FFF7ED', color:'#92400e' },
  Energy:   { bg:'#FEF3C7', color:'#92400e' },
  Grains:   { bg:'#F0FDF4', color:'#166534' },
  Softs:    { bg:'#FDF4FF', color:'#6b21a8' },
  Forex:    { bg:'#EFF6FF', color:'#1e40af' },
  Index:    { bg:'#EEF2FF', color:'#3730a3' },
  Indices:  { bg:'#EEF2FF', color:'#3730a3' },
  Futures:  { bg:'#F0F9FF', color:'#075985' },
  Rates:    { bg:'#F0FDF4', color:'#14532d' },
  Crypto:   { bg:'#FFFBEB', color:'#92400e' },
  'FX Futures': { bg:'#EFF6FF', color:'#1e40af' },
  Tech:     { bg:'#EFF6FF', color:'#1e40af' },
  Auto:     { bg:'#F0FDF4', color:'#166534' },
  Finance:  { bg:'#FDF4FF', color:'#6b21a8' },
  default:  { bg:'#F9FAFB', color:'#374151' },
};

const EXCHANGES = {
  'GC=F':'CME', 'SI=F':'CME', 'HG=F':'CME', 'PL=F':'CME',
  'CL=F':'NYMEX', 'NG=F':'NYMEX', 'RB=F':'NYMEX', 'HO=F':'NYMEX',
  'ZW=F':'CBOT', 'ZC=F':'CBOT', 'ZS=F':'CBOT', 'ZO=F':'CBOT',
  'CT=F':'ICE', 'KC=F':'ICE', 'SB=F':'ICE', 'CC=F':'ICE',
  'ES=F':'CME', 'NQ=F':'CME', 'YM=F':'CBOT', 'RTY=F':'CME',
  'ZB=F':'CBOT', 'ZN=F':'CBOT', 'ZF=F':'CBOT',
  'EURUSD=X':'FOREX', 'GBPUSD=X':'FOREX', 'USDJPY=X':'FOREX',
  'AUDUSD=X':'FOREX', 'USDCAD=X':'FOREX', 'NZDUSD=X':'FOREX',
  'BTC-USD':'CRYPTO', 'ETH-USD':'CRYPTO', 'SOL-USD':'CRYPTO',
  'AAPL':'NASDAQ', 'MSFT':'NASDAQ', 'GOOGL':'NASDAQ', 'NVDA':'NASDAQ',
  'AMZN':'NASDAQ', 'META':'NASDAQ', 'TSLA':'NASDAQ',
  'JPM':'NYSE', 'BRK-B':'NYSE', 'XOM':'NYSE',
};

const UNITS = {
  'GC=F':'$/troy oz', 'SI=F':'$/troy oz', 'CL=F':'$/barrel',
  'NG=F':'$/MMBtu', 'ZW=F':'¢/bu', 'ZC=F':'¢/bu', 'ZS=F':'¢/bu',
  'ES=F':'index pts', 'NQ=F':'index pts', 'EURUSD=X':'USD per EUR',
  'GBPUSD=X':'USD per GBP', 'BTC-USD':'USD', 'ETH-USD':'USD',
};

function MktRow({ name, sym, cat, price, changePct, high, low }) {
  const up = (changePct || 0) >= 0;
  const catStyle = CAT_COLORS[cat] || CAT_COLORS.default;
  const exchange = EXCHANGES[sym] || '';
  const unit = UNITS[sym] || '';

  // Day range progress (0-100%)
  const rangePos = (high && low && price && high !== low)
    ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100))
    : null;

  const fmt = (p) => {
    if (!p) return '—';
    if (p >= 10000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1000)  return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1)     return p.toFixed(4);
    return p.toFixed(5);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.12s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Left — name, tags, symbol */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500,
            color: 'var(--text)', letterSpacing: '-0.2px',
          }}>{name}</span>
          {cat && (
            <span style={{
              fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500,
              background: catStyle.bg, color: catStyle.color,
              padding: '2px 8px', borderRadius: 20,
              letterSpacing: '0.02em',
            }}>{cat}</span>
          )}
          {exchange && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#6b7280', background: '#F9FAFB',
              border: '0.5px solid #e5e7eb',
              padding: '2px 7px', borderRadius: 3,
            }}>{exchange}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-secondary)', letterSpacing: '0.04em', fontWeight: 500,
          }}>{sym}{unit ? ' · ' + unit : ''}</span>
          {/* Day range bar */}
          {rangePos !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, maxWidth: 160 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {fmt(low)}
              </span>
              <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${rangePos}%`,
                  background: `linear-gradient(90deg, ${up ? '#bbf7d0' : '#fecaca'}, ${up ? '#16a34a' : '#dc2626'})`,
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {fmt(high)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right — price + change pill */}
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500,
          color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5,
        }}>{fmt(price)}</div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500,
          background: up ? 'var(--green-bg)' : 'var(--red-bg)',
          color: up ? 'var(--green)' : 'var(--red)',
          padding: '3px 10px', borderRadius: 20,
          display: 'inline-block',
        }}>
          {changePct != null
            ? `${up ? '▲' : '▼'} ${Math.abs(changePct).toFixed(2)}%`
            : '—'}
        </span>
      </div>
    </div>
  );
}

function NewsItem({ item }) {
  const tagColors = {
    Metals:'var(--accent-bg)', Energy:'rgba(234,179,8,0.1)',
    Forex:'rgba(16,163,74,0.1)', Indices:'rgba(99,102,241,0.08)',
    Crypto:'rgba(245,158,11,0.1)', Grains:'rgba(22,163,74,0.1)', Macro:'var(--surface3)',
  };
  const tagTextColors = {
    Metals:'var(--accent)', Energy:'#92400e', Forex:'var(--green)',
    Indices:'var(--accent)', Crypto:'#92400e', Grains:'var(--green)', Macro:'var(--text-muted)',
  };
  return (
    <div style={{
      padding:'12px 18px', borderBottom:'1px solid var(--border)',
      cursor:'pointer', transition:'background 0.1s',
    }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--accent-bg)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:6 }}>
        <span style={{
          fontFamily:'var(--font)', fontSize:10, fontWeight:600,
          background: tagColors[item.tag] || 'var(--surface3)',
          color: tagTextColors[item.tag] || 'var(--text-muted)',
          padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap', flexShrink:0,
        }}>{item.tag}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-dim)', flexShrink:0, marginTop:1 }}>
          {item.up ? '▲' : '▼'} {item.time}
        </span>
      </div>
      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:500, color:'var(--text)', lineHeight:1.5 }}>
        {item.headline}
      </div>
      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{item.source}</div>
    </div>
  );
}

function CommunityCard({ item }) {
  const isIdea     = item.type === 'idea';
  const isScreener = item.type === 'screener';
  const isStrategy = item.type === 'strategy';

  const typeLabel = isIdea ? 'Trade Idea' : isScreener ? 'Screener' : 'Strategy';
  const typeBg    = isIdea ? 'var(--accent-bg)' : isScreener ? 'var(--green-bg)' : 'rgba(167,139,250,0.1)';
  const typeColor = isIdea ? 'var(--accent)' : isScreener ? 'var(--green)' : '#7c3aed';
  const dirUp     = item.direction === 'Long';

  return (
    <div style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:12, padding:'18px 20px', cursor:'pointer',
      transition:'all 0.15s', display:'flex', flexDirection:'column', gap:12,
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent-border)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(99,102,241,0.08)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none';}}
    >
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:32, height:32, borderRadius:'50%',
            background:'linear-gradient(135deg, var(--grad-start), var(--grad-mid))',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0,
          }}>{item.avatar}</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.user}</span>
              {item.verified && <span title="Verified Trader" style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{item.style} · {item.time}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:typeBg, color:typeColor, padding:'3px 10px', borderRadius:20 }}>{typeLabel}</span>
          {isIdea && (
            <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background: dirUp ? 'var(--green-bg)' : 'var(--red-bg)', color: dirUp ? 'var(--green)' : 'var(--red)', padding:'3px 10px', borderRadius:20 }}>
              {item.direction} · {item.asset}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {isIdea && (
        <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, margin:0 }}>
          {item.body}
        </p>
      )}
      {(isScreener || isStrategy) && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:5 }}>{item.name}</div>
          <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, margin:0 }}>{item.description}</p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', gap:20, alignItems:'center', paddingTop:8, borderTop:'1px solid var(--border)' }}>
        {isIdea ? (
          <>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>♥ {item.likes}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>💬 {item.comments}</span>
          </>
        ) : (
          <>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>↳ Used {item.uses}×</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>⑂ Forked {item.forks}×</span>
          </>
        )}
        <span style={{ marginLeft:'auto', fontFamily:'var(--font)', fontSize:11, color:'var(--accent)' }}>View →</span>
      </div>
    </div>
  );
}

// ── Main component
export default function HomePage({ user }) {
  const [mktTab,   setMktTab]   = useState('All');
  const [prices,   setPrices]   = useState({});
  const [loadingP, setLoadingP] = useState(true);

  const currentTab = MARKET_TABS.find(t => t.label === mktTab);
  const allSyms = MARKET_TABS.flatMap(t => t.syms.map(s => s.sym));

  useEffect(() => {
    const load = async () => {
      try {
        const syms = allSyms.join(',');
        const res  = await fetch(`/api/prices?symbols=${syms}`);
        const data = await res.json();
        setPrices(data || {});
      } catch {} finally { setLoadingP(false); }
    };
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const hour = new Date().getHours();
  const session = hour < 6 ? 'Asian Session' : hour < 12 ? 'London Session' : hour < 17 ? 'New York Session' : 'After Hours';

  return (
    <div style={{ padding:'20px 24px 60px', maxWidth:1280, margin:'0 auto' }}>

      {/* ══ 1. DASHBOARD HERO ══ */}
      <HeroCard style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.65)', marginBottom:6 }}>
              Dashboard Overview
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:30, fontWeight:300, color:'#fff', letterSpacing:'-1.5px', lineHeight:1, marginBottom:6 }}>
              Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}{user?.name ? ', ' + user.name.split(' ')[0] : ''}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'rgba(255,255,255,0.75)', marginBottom:14 }}>
              <LiveDot />{session} · {new Date().toLocaleDateString('en-US',{weekday:'long', month:'long', day:'numeric'})}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label: user?.plan ? user.plan.charAt(0).toUpperCase() + user.plan.slice(1) + ' Plan' : 'Free Plan', show: true },
                { label: session, show: true },
              ].filter(p => p.show).map(p => (
                <div key={p.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 12px', fontSize:11, color:'#fff', fontWeight:500 }}>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', marginBottom:4 }}>Markets</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:600, color:'#fff' }}>
              {loadingP ? '—' : Object.keys(prices).length + ' live'}
            </div>
          </div>
        </div>
      </HeroCard>

      {/* ══ 2. MARKET SUMMARY + NEWS ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, marginBottom:24 }}>

        {/* Market Summary — left, tabbed */}
        <Panel>
          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 0 0 0' }}>
            <div style={{ padding:'0 18px', display:'flex', alignItems:'center', borderRight:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>Markets</span>
            </div>
            {MARKET_TABS.map(t => (
              <button key={t.label} onClick={() => setMktTab(t.label)} style={{
                background:'none', border:'none',
                borderBottom: mktTab === t.label ? '2px solid var(--accent)' : '2px solid transparent',
                padding:'11px 16px', marginBottom:-1,
                fontFamily:'var(--font)', fontSize:13,
                fontWeight: mktTab === t.label ? 600 : 400,
                color: mktTab === t.label ? 'var(--accent)' : 'var(--text-muted)',
                cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
              }}>{t.label}</button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', padding:'0 16px' }}>
              <LiveDot />
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>Live</span>
            </div>
          </div>



          {/* Rows */}
          {loadingP ? (
            Array.from({length: 8}).map((_, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 90px', padding:'10px 18px', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:90, height:14, background:'var(--surface3)', borderRadius:4, opacity:0.5 }} />
                <div style={{ width:60, height:14, background:'var(--surface3)', borderRadius:4, opacity:0.5 }} />
                <div style={{ width:50, height:14, background:'var(--surface3)', borderRadius:4, opacity:0.5, marginLeft:'auto' }} />
              </div>
            ))
          ) : (
            currentTab?.syms.map(s => {
              const d = prices[s.sym];
              return <MktRow
                key={s.sym}
                name={s.name}
                sym={s.sym}
                cat={s.cat}
                price={d?.price}
                changePct={d?.changePct}
                high={d?.high}
                low={d?.low}
              />;
            })
          )}
        </Panel>

        {/* News — right column */}
        <Panel>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>Latest News</span>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }}>All news →</span>
          </div>
          <div style={{ overflowY:'auto', maxHeight:480 }}>
            {NEWS_ITEMS.map((item, i) => <NewsItem key={i} item={item} />)}
          </div>
        </Panel>
      </div>

      {/* ══ 3. COMMUNITY DISCOVER ══ */}
      <div>
        {/* Section header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:5 }}>Community</div>
            <h2 style={{ fontFamily:'var(--font)', fontSize:20, fontWeight:700, color:'var(--text)', margin:0, letterSpacing:'-0.3px' }}>
              Discover — Ideas, Screeners & Strategies
            </h2>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Ideas','Screeners','Strategies'].map(f => (
              <button key={f} style={{
                padding:'5px 14px', borderRadius:20,
                background: f === 'All' ? 'var(--accent)' : 'var(--surface)',
                color: f === 'All' ? '#fff' : 'var(--text-muted)',
                border: f === 'All' ? 'none' : '1px solid var(--border2)',
                fontFamily:'var(--font)', fontSize:12, fontWeight: f === 'All' ? 600 : 400,
                cursor:'pointer', transition:'all 0.15s',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Community grid — 3 columns */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
          {COMMUNITY_ITEMS.map((item, i) => <CommunityCard key={i} item={item} />)}
        </div>

        {/* Load more */}
        <div style={{ textAlign:'center', marginTop:24 }}>
          <Btn ghost>Load more from the community</Btn>
        </div>
      </div>
    </div>
  );
}
