
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Panel, PanelHeader, Badge, LiveDot, Btn, HeroCard } from './DS';

// ── Asset definitions
const MARKET_TABS = [
  { label: 'All', syms: [
    { sym:'GC=F',     name:'Gold',      cat:'Metals'  },
    { sym:'CL=F',     name:'Crude Oil', cat:'Energy'  },
    { sym:'ES=F',     name:'S&P 500',   cat:'Index'   },
    { sym:'EURUSD=X', name:'EUR/USD',   cat:'Forex'   },
    { sym:'BTC-USD',  name:'Bitcoin',   cat:'Crypto'  },
    { sym:'ZW=F',     name:'Wheat',     cat:'Grains'  },
    { sym:'SI=F',     name:'Silver',    cat:'Metals'  },
    { sym:'NG=F',     name:'Nat Gas',   cat:'Energy'  },
    { sym:'NQ=F',     name:'Nasdaq',    cat:'Index'   },
    { sym:'GBPUSD=X', name:'GBP/USD',   cat:'Forex'   },
    { sym:'ETH-USD',  name:'Ethereum',  cat:'Crypto'  },
    { sym:'ZC=F',     name:'Corn',      cat:'Grains'  },
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
    { sym:'NVDA',  name:'Nvidia',     cat:'Tech'    },
    { sym:'GOOGL', name:'Alphabet',   cat:'Tech'    },
    { sym:'AMZN',  name:'Amazon',     cat:'Tech'    },
    { sym:'META',  name:'Meta',       cat:'Tech'    },
    { sym:'TSLA',  name:'Tesla',      cat:'Auto'    },
    { sym:'JPM',   name:'JPMorgan',   cat:'Finance' },
    { sym:'BRK-B', name:'Berkshire',  cat:'Finance' },
    { sym:'XOM',   name:'ExxonMobil', cat:'Energy'  },
  ]},
];

const CAT_COLORS = {
  Metals:   { bg:'#FFF7ED', color:'#92400e' },
  Energy:   { bg:'#FEF3C7', color:'#78350f' },
  Grains:   { bg:'#F0FDF4', color:'#166534' },
  Softs:    { bg:'#FDF4FF', color:'#6b21a8' },
  Forex:    { bg:'#EFF6FF', color:'#1e40af' },
  Index:    { bg:'#EEF2FF', color:'#3730a3' },
  Indices:  { bg:'#EEF2FF', color:'#3730a3' },
  Futures:  { bg:'#F0F9FF', color:'#075985' },
  Rates:    { bg:'#F0FDF4', color:'#14532d' },
  Crypto:   { bg:'#FFFBEB', color:'#92400e' },
  Tech:     { bg:'#EFF6FF', color:'#1e40af' },
  Auto:     { bg:'#F0FDF4', color:'#166534' },
  Finance:  { bg:'#FDF4FF', color:'#6b21a8' },
  default:  { bg:'#F9FAFB', color:'#374151' },
};

const EXCHANGES = {
  'GC=F':'CME','SI=F':'CME','HG=F':'CME','CL=F':'NYMEX','NG=F':'NYMEX',
  'RB=F':'NYMEX','ZW=F':'CBOT','ZC=F':'CBOT','ZS=F':'CBOT','CT=F':'ICE',
  'KC=F':'ICE','SB=F':'ICE','ES=F':'CME','NQ=F':'CME','YM=F':'CBOT',
  'RTY=F':'CME','ZB=F':'CBOT','ZN=F':'CBOT',
  'EURUSD=X':'FOREX','GBPUSD=X':'FOREX','USDJPY=X':'FOREX','AUDUSD=X':'FOREX',
  'USDCAD=X':'FOREX','NZDUSD=X':'FOREX','USDCHF=X':'FOREX','EURGBP=X':'FOREX',
  'BTC-USD':'CRYPTO','ETH-USD':'CRYPTO','SOL-USD':'CRYPTO','BNB-USD':'CRYPTO',
  'XRP-USD':'CRYPTO','ADA-USD':'CRYPTO',
  'AAPL':'NASDAQ','MSFT':'NASDAQ','NVDA':'NASDAQ','GOOGL':'NASDAQ',
  'AMZN':'NASDAQ','META':'NASDAQ','TSLA':'NASDAQ','JPM':'NYSE',
  'BRK-B':'NYSE','XOM':'NYSE',
};

const UNITS = {
  'GC=F':'$/troy oz','SI=F':'$/troy oz','CL=F':'$/barrel',
  'NG=F':'$/MMBtu','ZW=F':'¢/bu','ZC=F':'¢/bu','ZS=F':'¢/bu',
  'ES=F':'pts','NQ=F':'pts','EURUSD=X':'per EUR','GBPUSD=X':'per GBP',
  'BTC-USD':'USD','ETH-USD':'USD',
};

// ── Smart price formatter — no trailing zeros
function fmtPrice(p) {
  if (p == null || p === 0) return '—';
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1000)  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 100)   return p.toFixed(2);
  if (p >= 10)    return p.toFixed(2);
  if (p >= 1)     return p.toFixed(4);
  return p.toFixed(5);
}

// ── News data
const NEWS = [
  { headline:'Gold surges to record highs as dollar weakens on Fed pause expectations — commercials hit 3-year extreme', source:'Reuters', time:'12m ago', tag:'Metals', up:true, featured:true },
  { headline:'Crude oil falls after surprise inventory build in EIA report', source:'Bloomberg', time:'34m ago', tag:'Energy', up:false },
  { headline:'EUR/USD holds above 1.08 ahead of ECB rate decision Thursday', source:'FXStreet', time:'1h ago', tag:'Forex', up:true },
  { headline:'S&P 500 futures flat as markets digest mixed bank earnings', source:'WSJ', time:'1h ago', tag:'Indices', up:false },
  { headline:'Natural gas spikes on unexpected cold snap forecast', source:'MarketWatch', time:'2h ago', tag:'Energy', up:true },
  { headline:'Bitcoin reclaims $75K as institutional inflows accelerate', source:'CoinDesk', time:'2h ago', tag:'Crypto', up:true },
  { headline:'Wheat prices rise on Black Sea supply concerns after new sanctions', source:'Reuters', time:'3h ago', tag:'Grains', up:true },
];

// ── Community data
const COMMUNITY = [
  { type:'idea', user:'commodityking', avatar:'C', style:'Swing', asset:'Gold', dir:'Long', body:'COT commercials hit 85th percentile this week. Seasonal tailwind starting in April. Price coiling above key support. Watching for the weekly close above 2,340 to confirm entry.', likes:142, comments:31, time:'2h ago', verified:true },
  { type:'screener', user:'cotmaster', avatar:'C', style:'Position', name:'COT Extreme Setup', desc:'Flags assets when commercial positioning hits 80th+ percentile AND seasonal score exceeds 70. Currently flagging 3 assets.', uses:847, forks:124, time:'5h ago', verified:true },
  { type:'idea', user:'fxpro_trader', avatar:'F', style:'Day Trader', asset:'EUR/USD', dir:'Short', body:'DXY bouncing off major support while EUR/USD rejected from 1.0850 resistance. COT shows large specs reducing longs for 3rd consecutive week. Targeting 1.0750.', likes:89, comments:18, time:'3h ago', verified:false },
  { type:'strategy', user:'seasonaltrader', avatar:'S', style:'Swing', name:'Spring Grain Seasonal', desc:'Captures the April-June seasonal window in corn and soybeans. Uses COT confirmation + price action entry. 67% win rate over 8 years.', likes:203, forks:67, time:'1d ago', verified:true },
  { type:'idea', user:'energydesk', avatar:'E', style:'Position', asset:'Crude Oil', dir:'Short', body:'Crude rejected the 200-day MA twice this month. EIA showed a large inventory build. COT commercials net short. Monthly seasonal is bearish through May.', likes:76, comments:22, time:'4h ago', verified:false },
  { type:'screener', user:'alpharesearch', avatar:'A', style:'Macro', name:'Multi-Timeframe COT Divergence', desc:'Identifies markets where the 13-week and 26-week COT trends diverge — often precedes large directional moves.', uses:412, forks:89, time:'2d ago', verified:true },
];

const TRENDING = [
  { name:'COT Extreme Setup', uses:847, style:'Position', verified:true },
  { name:'Spring Grain Seasonal', uses:412, style:'Swing', verified:true },
  { name:'Multi-TF COT Divergence', uses:389, style:'Macro', verified:true },
  { name:'Breakout + COT Confirm', uses:276, style:'Day Trader', verified:false },
  { name:'Seasonal Energy Window', uses:244, style:'Swing', verified:true },
  { name:'Dollar Strength Filter', uses:198, style:'Position', verified:false },
];

const CALENDAR = [
  { event:'FOMC Meeting Minutes', time:'Wed 14:00 ET', priority:'High', impact:'USD, Equities' },
  { event:'CPI Data Release', time:'Thu 08:30 ET', priority:'High', impact:'USD, Gold' },
  { event:'EIA Crude Inventories', time:'Wed 10:30 ET', priority:'High', impact:'Crude Oil' },
  { event:'Initial Jobless Claims', time:'Thu 08:30 ET', priority:'Medium', impact:'USD' },
  { event:'Retail Sales MoM', time:'Fri 08:30 ET', priority:'Medium', impact:'USD, Equities' },
];

const TYPE_BORDER = { idea:'#6366f1', screener:'#16a34a', strategy:'#7c3aed' };
const TYPE_LABEL  = { idea:'Trade Idea', screener:'Screener', strategy:'Strategy' };
const TYPE_BG     = { idea:'var(--accent-bg)', screener:'var(--green-bg)', strategy:'rgba(124,58,237,0.08)' };
const TYPE_COLOR  = { idea:'var(--accent)', screener:'var(--green)', strategy:'#7c3aed' };

// ── Sub-components

function MktRow({ name, sym, cat, price, changePct, high, low }) {
  const up = (changePct || 0) >= 0;
  const cs = CAT_COLORS[cat] || CAT_COLORS.default;
  const exch = EXCHANGES[sym] || '';
  const unit = UNITS[sym] || '';
  const rangePos = (high && low && price && high !== low)
    ? Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100)) : null;

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderBottom:'1px solid var(--border)', transition:'background 0.12s', cursor:'pointer' }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--accent-bg)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:500, color:'var(--text)', letterSpacing:'-0.2px' }}>{name}</span>
          {cat && <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, background:cs.bg, color:cs.color, padding:'2px 8px', borderRadius:20 }}>{cat}</span>}
          {exch && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:500, letterSpacing:'0.12em', color:'#6b7280', background:'#F9FAFB', border:'0.5px solid #e5e7eb', padding:'2px 7px', borderRadius:3 }}>{exch}</span>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)', letterSpacing:'0.04em', fontWeight:500 }}>
            {sym}{unit ? ' · ' + unit : ''}
          </span>
          {rangePos !== null && (
            <div style={{ display:'flex', alignItems:'center', gap:5, flex:1, maxWidth:180 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtPrice(low)}</span>
              <div style={{ flex:1, height:3, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${rangePos}%`, background:up?'#16a34a':'#dc2626', borderRadius:2, transition:'width 0.5s' }} />
              </div>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{fmtPrice(high)}</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0, marginLeft:20 }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:500, color:'var(--text)', letterSpacing:'-0.5px', marginBottom:5 }}>{fmtPrice(price)}</div>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:500, background:up?'var(--green-bg)':'var(--red-bg)', color:up?'var(--green)':'var(--red)', padding:'3px 10px', borderRadius:20 }}>
          {changePct != null ? `${up?'▲':'▼'} ${Math.abs(changePct).toFixed(2)}%` : '—'}
        </span>
      </div>
    </div>
  );
}

function SentimentTile({ label, value, sub, up, neutral }) {
  const color = neutral ? 'var(--text-muted)' : up ? 'var(--green)' : 'var(--red)';
  return (
    <div style={{ flex:1, padding:'14px 16px', borderRight:'1px solid var(--border)', lastChild:{borderRight:'none'} }}>
      <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:500, color, letterSpacing:'-0.5px', marginBottom:3 }}>{value}</div>
      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function NewsItem({ item, featured }) {
  const tagColors = {
    Metals:{bg:'#FFF7ED',color:'#92400e'}, Energy:{bg:'#FEF3C7',color:'#78350f'},
    Forex:{bg:'#EFF6FF',color:'#1e40af'}, Indices:{bg:'#EEF2FF',color:'#3730a3'},
    Crypto:{bg:'#FFFBEB',color:'#92400e'}, Grains:{bg:'#F0FDF4',color:'#166534'},
  };
  const tc = tagColors[item.tag] || { bg:'#F9FAFB', color:'#374151' };

  if (featured) {
    return (
      <div style={{ padding:'16px 18px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:'var(--surface2)' }}
        onMouseEnter={e=>e.currentTarget.style.background='var(--accent-bg)'}
        onMouseLeave={e=>e.currentTarget.style.background='var(--surface2)'}
      >
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:tc.bg, color:tc.color, padding:'2px 9px', borderRadius:20 }}>{item.tag}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-dim)' }}>{item.time}</span>
          <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 7px', borderRadius:3 }}>Top Story</span>
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', lineHeight:1.5, marginBottom:6 }}>{item.headline}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{item.source}</div>
      </div>
    );
  }

  return (
    <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
      onMouseEnter={e=>e.currentTarget.style.background='var(--accent-bg)'}
      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
    >
      <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:500, background:tc.bg, color:tc.color, padding:'1px 7px', borderRadius:20 }}>{item.tag}</span>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)' }}>{item.time}</span>
      </div>
      <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:500, color:'var(--text)', lineHeight:1.5 }}>{item.headline}</div>
      <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{item.source}</div>
    </div>
  );
}

function CommunityCard({ item }) {
  const dirUp = item.dir === 'Long';
  const borderColor = TYPE_BORDER[item.type] || '#6366f1';
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:`3px solid ${borderColor}`, borderRadius:12, padding:'16px 18px', cursor:'pointer', transition:'all 0.15s', display:'flex', flexDirection:'column', gap:10 }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=borderColor; e.currentTarget.style.boxShadow=`0 4px 16px ${borderColor}18`; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.borderLeftColor=borderColor; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg, var(--grad-start), var(--grad-mid))`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{item.avatar}</div>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{item.user}</span>
              {item.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{item.style} · {item.time}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:TYPE_BG[item.type], color:TYPE_COLOR[item.type], padding:'2px 9px', borderRadius:20 }}>{TYPE_LABEL[item.type]}</span>
          {item.dir && <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:dirUp?'var(--green-bg)':'var(--red-bg)', color:dirUp?'var(--green)':'var(--red)', padding:'2px 9px', borderRadius:20 }}>{item.dir} · {item.asset}</span>}
        </div>
      </div>
      {item.body && <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-secondary)', lineHeight:1.65, margin:0 }}>{item.body}</p>}
      {item.name && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{item.name}</div>
          <p style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.6, margin:0 }}>{item.desc}</p>
        </div>
      )}
      <div style={{ display:'flex', gap:16, alignItems:'center', paddingTop:8, borderTop:'1px solid var(--border)' }}>
        {item.likes != null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>♥ {item.likes}</span>}
        {item.comments != null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>💬 {item.comments}</span>}
        {item.uses != null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>↳ {item.uses}× used</span>}
        {item.forks != null && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>⑂ {item.forks}× forked</span>}
        <span style={{ marginLeft:'auto', fontFamily:'var(--font)', fontSize:11, color:'var(--accent)' }}>View →</span>
      </div>
    </div>
  );
}

// ── Main Component
export default function HomePage({ user }) {
  const [mktTab,    setMktTab]    = useState('All');
  const [prices,    setPrices]    = useState({});
  const [loadingP,  setLoadingP]  = useState(true);
  const [communityFilter, setFilter] = useState('All');
  const [now, setNow] = useState(new Date());

  const currentTab = MARKET_TABS.find(t => t.label === mktTab);
  const allSyms = [...new Set(MARKET_TABS.flatMap(t => t.syms.map(s => s.sym)))];

  const loadPrices = useCallback(async () => {
    try {
      const res  = await fetch(`/api/prices?symbols=${allSyms.join(',')}`);
      const data = await res.json();
      setPrices(data || {});
    } catch {} finally { setLoadingP(false); }
  }, []);

  useEffect(() => { loadPrices(); const t = setInterval(loadPrices, 60000); return () => clearInterval(t); }, [loadPrices]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  // ── Derived values
  const hour = now.getHours();
  const session = hour < 6 ? 'Asian Session' : hour < 12 ? 'London Session' : hour < 17 ? 'New York Session' : 'After Hours';
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Biggest mover
  const movers = Object.entries(prices)
    .map(([sym, d]) => ({ sym, ...d }))
    .filter(d => d.changePct != null)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  const bigMover = movers[0];

  // Next calendar event countdown
  const nextEvent = CALENDAR[0];
  const nextEventTime = 'in 2h 14m'; // placeholder — would compute from real date

  // Market sentiment (derived from prices)
  const goldPct = prices['GC=F']?.changePct;
  const dxyUp   = (prices['EURUSD=X']?.changePct || 0) < 0; // inverse
  const oilPct  = prices['CL=F']?.changePct;
  const btcPct  = prices['BTC-USD']?.changePct;
  const spxPct  = prices['ES=F']?.changePct;

  const riskOn = (spxPct || 0) > 0 && (btcPct || 0) > 0;

  const filteredCommunity = communityFilter === 'All' ? COMMUNITY
    : COMMUNITY.filter(c => {
        if (communityFilter === 'Ideas') return c.type === 'idea';
        if (communityFilter === 'Screeners') return c.type === 'screener';
        if (communityFilter === 'Strategies') return c.type === 'strategy';
        return true;
      });

  const priorityColor = { High:'var(--accent)', Medium:'var(--green)', Low:'var(--text-muted)' };
  const priorityBg    = { High:'var(--accent-bg)', Medium:'var(--green-bg)', Low:'var(--surface3)' };

  return (
    <div style={{ padding:'20px 24px 60px', maxWidth:1320, margin:'0 auto' }}>

      {/* ══ 1. HERO ══ */}
      <HeroCard style={{ marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:24, alignItems:'flex-start' }}>
          {/* Left — greeting + status */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>
              Dashboard Overview
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:28, fontWeight:300, color:'#fff', letterSpacing:'-1px', lineHeight:1.1, marginBottom:6 }}>
              {greeting}{user?.name ? ', ' + user.name.split(' ')[0] : ''}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'rgba(255,255,255,0.7)', marginBottom:14 }}>
              <LiveDot />{session} · {now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · {now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label: user?.plan ? user.plan.charAt(0).toUpperCase()+user.plan.slice(1)+' Plan' : 'Free Plan', show:true },
                { label: riskOn ? '📈 Risk-On Environment' : '📉 Risk-Off Environment', show: spxPct != null },
              ].filter(p=>p.show).map(p=>(
                <div key={p.label} style={{ background:'rgba(255,255,255,0.15)', borderRadius:20, padding:'4px 13px', fontSize:11, color:'#fff', fontWeight:500 }}>{p.label}</div>
              ))}
            </div>
          </div>

          {/* Center — biggest mover */}
          {bigMover && (
            <div style={{ textAlign:'center', background:'rgba(255,255,255,0.10)', borderRadius:12, padding:'14px 20px', minWidth:140 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Top Mover</div>
              <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:600, color:'#fff', marginBottom:4 }}>{bigMover.sym.replace('=F','').replace('-USD','').replace('USD=X','')}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:18, fontWeight:500, color: (bigMover.changePct||0)>=0 ? '#86efac' : '#fca5a5' }}>
                {(bigMover.changePct||0)>=0?'▲':'▼'} {Math.abs(bigMover.changePct||0).toFixed(2)}%
              </div>
            </div>
          )}

          {/* Right — next event */}
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.10)', borderRadius:12, padding:'14px 20px', minWidth:160 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', color:'rgba(255,255,255,0.6)', marginBottom:6 }}>Next Event</div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'#fff', marginBottom:4, lineHeight:1.3 }}>{nextEvent.event}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'#fbbf24' }}>{nextEventTime}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>{nextEvent.impact}</div>
          </div>
        </div>
      </HeroCard>

      {/* ══ 2. MARKET SENTIMENT STRIP ══ */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, display:'flex', marginBottom:18, overflow:'hidden' }}>
        <SentimentTile label="Dollar Index" value={dxyUp ? 'Strong' : 'Weak'} sub={prices['EURUSD=X']?.changePct != null ? `EUR/USD ${(prices['EURUSD=X'].changePct||0)>=0?'+':''}${(prices['EURUSD=X'].changePct||0).toFixed(2)}%` : 'Loading…'} up={dxyUp} />
        <SentimentTile label="Gold Momentum" value={goldPct != null ? `${goldPct>=0?'+':''}${goldPct.toFixed(2)}%` : '—'} sub={goldPct != null ? (goldPct > 0.5 ? 'Bullish breakout' : goldPct < -0.5 ? 'Bearish pressure' : 'Consolidating') : 'Loading…'} up={goldPct > 0} neutral={goldPct == null} />
        <SentimentTile label="Oil Trend" value={oilPct != null ? `${oilPct>=0?'+':''}${oilPct.toFixed(2)}%` : '—'} sub={oilPct != null ? (oilPct > 0 ? 'Demand holding' : 'Supply pressure') : 'Loading…'} up={oilPct > 0} neutral={oilPct == null} />
        <SentimentTile label="Crypto Sentiment" value={btcPct != null ? `${btcPct>=0?'+':''}${btcPct.toFixed(2)}%` : '—'} sub={btcPct != null ? (btcPct > 1 ? 'Risk appetite high' : btcPct < -1 ? 'Risk-off' : 'Neutral') : 'Loading…'} up={btcPct > 0} neutral={btcPct == null} />
        <SentimentTile label="Equities" value={spxPct != null ? `${spxPct>=0?'+':''}${spxPct.toFixed(2)}%` : '—'} sub={spxPct != null ? (spxPct > 0 ? 'Bid intact' : 'Selling pressure') : 'Loading…'} up={spxPct > 0} neutral={spxPct == null} />
      </div>

      {/* ══ 3. YOUR ACTIVITY STRIP ══ */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, display:'flex', alignItems:'center', padding:'12px 20px', gap:32, marginBottom:18, overflowX:'auto' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', flexShrink:0 }}>Your Activity</div>
        {[
          { label:'Plan', value: user?.plan ? user.plan.toUpperCase() : 'FREE', accent:true },
          { label:'Open Positions', value:'—' },
          { label:'Competition Rank', value:'—' },
          { label:'Screeners', value:'0 today' },
          { label:'Alerts Firing', value:'0 active' },
          { label:'Win Rate', value:'—' },
        ].map(item => (
          <div key={item.label} style={{ flexShrink:0 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginBottom:3, letterSpacing:'0.06em' }}>{item.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:600, color: item.accent ? 'var(--accent)' : 'var(--text)' }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* ══ 4. MARKET SUMMARY + NEWS ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:16, marginBottom:24 }}>

        {/* Market table */}
        <Panel>
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            <div style={{ padding:'0 18px', display:'flex', alignItems:'center', borderRight:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>Markets</span>
            </div>
            {MARKET_TABS.map(t => (
              <button key={t.label} onClick={() => setMktTab(t.label)} style={{
                background:'none', border:'none',
                borderBottom: mktTab===t.label ? '2px solid var(--accent)' : '2px solid transparent',
                padding:'11px 14px', marginBottom:-1,
                fontFamily:'var(--font)', fontSize:12,
                fontWeight: mktTab===t.label ? 600 : 400,
                color: mktTab===t.label ? 'var(--accent)' : 'var(--text-muted)',
                cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap',
              }}>{t.label}</button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', padding:'0 16px', gap:6, flexShrink:0 }}>
              <LiveDot />
              <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>Live</span>
            </div>
          </div>
          {loadingP
            ? Array.from({length:8}).map((_,i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ width:120, height:14, background:'var(--surface3)', borderRadius:4, opacity:0.5 }} />
                    <div style={{ width:180, height:10, background:'var(--surface3)', borderRadius:4, opacity:0.3 }} />
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
                    <div style={{ width:80, height:16, background:'var(--surface3)', borderRadius:4, opacity:0.5 }} />
                    <div style={{ width:60, height:20, background:'var(--surface3)', borderRadius:20, opacity:0.4 }} />
                  </div>
                </div>
              ))
            : currentTab?.syms.map(s => {
                const d = prices[s.sym];
                return <MktRow key={s.sym} name={s.name} sym={s.sym} cat={s.cat} price={d?.price} changePct={d?.changePct} high={d?.high} low={d?.low} />;
              })
          }
        </Panel>

        {/* News — featured + small */}
        <Panel>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 18px', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>Latest News</span>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }}>All news →</span>
          </div>
          <NewsItem item={NEWS[0]} featured />
          <div style={{ overflowY:'auto', maxHeight:400 }}>
            {NEWS.slice(1).map((item,i) => <NewsItem key={i} item={item} />)}
          </div>
        </Panel>
      </div>

      {/* ══ 5. ECONOMIC CALENDAR ══ */}
      <Panel style={{ marginBottom:24 }}>
        <PanelHeader title="Economic Calendar — This Week" action="Full calendar →" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:0 }}>
          {CALENDAR.map((e,i) => (
            <div key={i} style={{ padding:'14px 18px', borderRight: i<4 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:priorityBg[e.priority], color:priorityColor[e.priority], padding:'2px 9px', borderRadius:20 }}>{e.priority}</span>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{e.time.split(' ')[0]}</span>
              </div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:5, lineHeight:1.35 }}>{e.event}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)' }}>{e.time.split(' ').slice(1).join(' ')}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-dim)', marginTop:4 }}>Impacts: {e.impact}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ══ 6. TRENDING SCREENERS ══ */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>🔥 Trending Screeners</span>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--accent)', cursor:'pointer' }}>View all →</span>
        </div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
          {TRENDING.map((t,i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', flexShrink:0, cursor:'pointer', transition:'all 0.15s', minWidth:200 }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--accent-border)'; e.currentTarget.style.background='var(--accent-bg)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='var(--surface)'; }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{t.name}</span>
                {t.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)' }}>↳ {t.uses}×</span>
                <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', background:'var(--surface3)', padding:'1px 7px', borderRadius:20 }}>{t.style}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ 7. COMMUNITY DISCOVER ══ */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:5 }}>Community</div>
            <h2 style={{ fontFamily:'var(--font)', fontSize:20, fontWeight:700, color:'var(--text)', margin:0, letterSpacing:'-0.3px' }}>Discover — Ideas, Screeners & Strategies</h2>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            {['All','Ideas','Screeners','Strategies'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'5px 14px', borderRadius:20,
                background: f===communityFilter ? 'var(--accent)' : 'var(--surface)',
                color: f===communityFilter ? '#fff' : 'var(--text-muted)',
                border: f===communityFilter ? 'none' : '1px solid var(--border2)',
                fontFamily:'var(--font)', fontSize:12, fontWeight: f===communityFilter?600:400,
                cursor:'pointer', transition:'all 0.15s',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          {filteredCommunity.map((item,i) => <CommunityCard key={i} item={item} />)}
        </div>
        <div style={{ textAlign:'center', marginTop:24 }}>
          <Btn ghost>Load more from the community</Btn>
        </div>
      </div>
    </div>
  );
}
