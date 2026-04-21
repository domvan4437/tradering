
'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Config per market
const MARKET_CONFIG = {
  commodities: {
    title: 'Commodities',
    subtitle: 'Metals, Energy, Grains & Softs',
    heroGrad: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #a855f7 100%)',
    cotAsset: 'GC=F',
    cotLabel: 'Gold COT',
    nextEvent: { label: 'EIA Crude Report', time: 'Wed 10:30 ET' },
    sectors: [
      {
        name: 'Precious Metals', exchange: 'COMEX', color: '#d97706',
        assets: [
          { sym:'GC=F', name:'Gold',    unit:'$/troy oz' },
          { sym:'SI=F', name:'Silver',  unit:'$/troy oz' },
          { sym:'HG=F', name:'Copper',  unit:'$/lb'      },
          { sym:'PL=F', name:'Platinum',unit:'$/troy oz' },
        ],
      },
      {
        name: 'Energy', exchange: 'NYMEX', color: '#ef4444',
        assets: [
          { sym:'CL=F', name:'Crude Oil WTI', unit:'$/barrel' },
          { sym:'NG=F', name:'Natural Gas',   unit:'$/MMBtu'  },
          { sym:'RB=F', name:'RBOB Gasoline', unit:'$/gallon' },
          { sym:'HO=F', name:'Heating Oil',   unit:'$/gallon' },
        ],
      },
      {
        name: 'Grains', exchange: 'CBOT', color: '#16a34a',
        assets: [
          { sym:'ZW=F', name:'Wheat',    unit:'¢/bu' },
          { sym:'ZC=F', name:'Corn',     unit:'¢/bu' },
          { sym:'ZS=F', name:'Soybeans', unit:'¢/bu' },
          { sym:'ZO=F', name:'Oats',     unit:'¢/bu' },
        ],
      },
      {
        name: 'Softs', exchange: 'ICE', color: '#8b5cf6',
        assets: [
          { sym:'CT=F', name:'Cotton', unit:'¢/lb'  },
          { sym:'KC=F', name:'Coffee', unit:'¢/lb'  },
          { sym:'SB=F', name:'Sugar',  unit:'¢/lb'  },
          { sym:'CC=F', name:'Cocoa',  unit:'$/ton' },
        ],
      },
    ],
    news: [
      { tag:'Metals',  headline:'Gold surges to record as dollar weakens on Fed pause expectations', source:'Reuters', time:'12m ago', up:true },
      { tag:'Energy',  headline:'Crude falls after surprise EIA inventory build', source:'Bloomberg', time:'34m ago', up:false },
      { tag:'Grains',  headline:'Wheat rallies on Black Sea supply disruption fears', source:'Reuters', time:'2h ago', up:true },
      { tag:'Energy',  headline:'Natural gas spikes 3% on cold snap forecast', source:'MarketWatch', time:'3h ago', up:true },
      { tag:'Softs',   headline:'Coffee hits 10-year high as Brazil drought concerns mount', source:'FT', time:'4h ago', up:true },
    ],
    faq: [
      { q:'What are commodity futures?', a:'Standardized contracts to buy or sell a physical commodity at a set price on a future date. Traded on CME, NYMEX, CBOT, and ICE.' },
      { q:'How does COT data work?', a:'The weekly Commitment of Traders report shows how commercial hedgers (smart money) are positioned. Extremes above 80% or below 20% often precede major reversals.' },
      { q:'What is contango vs backwardation?', a:'Contango: futures price above spot (normal). Backwardation: futures below spot — signals tight supply or strong near-term demand.' },
    ],
  },
  futures: {
    title: 'Futures',
    subtitle: 'Financial, Rates & FX Futures',
    heroGrad: 'linear-gradient(135deg, #1e40af 0%, #4f46e5 55%, #7c3aed 100%)',
    cotAsset: 'ES=F',
    cotLabel: 'S&P COT',
    nextEvent: { label: 'FOMC Minutes', time: 'Wed 14:00 ET' },
    sectors: [
      {
        name: 'Equity Index', exchange: 'CME', color: '#6366f1',
        assets: [
          { sym:'ES=F',  name:'E-mini S&P 500', unit:'pts' },
          { sym:'NQ=F',  name:'Nasdaq 100',     unit:'pts' },
          { sym:'YM=F',  name:'Dow Jones',      unit:'pts' },
          { sym:'RTY=F', name:'Russell 2000',   unit:'pts' },
        ],
      },
      {
        name: 'Interest Rates', exchange: 'CBOT', color: '#0ea5e9',
        assets: [
          { sym:'ZB=F', name:'T-Bond 30Y',  unit:'pts' },
          { sym:'ZN=F', name:'T-Note 10Y',  unit:'pts' },
          { sym:'ZF=F', name:'T-Note 5Y',   unit:'pts' },
          { sym:'ZT=F', name:'T-Note 2Y',   unit:'pts' },
        ],
      },
      {
        name: 'FX Futures', exchange: 'CME', color: '#10b981',
        assets: [
          { sym:'6E=F', name:'Euro FX',        unit:'$/EUR' },
          { sym:'6B=F', name:'British Pound',   unit:'$/GBP' },
          { sym:'6J=F', name:'Japanese Yen',    unit:'$/JPY' },
          { sym:'6A=F', name:'Australian Dollar',unit:'$/AUD' },
        ],
      },
    ],
    news: [
      { tag:'Rates',   headline:'Fed minutes signal patience on rate cuts, yields fall', source:'WSJ', time:'1h ago', up:false },
      { tag:'Indices', headline:'S&P 500 futures hold gains as earnings season kicks off', source:'Bloomberg', time:'2h ago', up:true },
      { tag:'FX',      headline:'Dollar weakens broadly as EUR/USD pushes above 1.09', source:'FXStreet', time:'3h ago', up:false },
      { tag:'Rates',   headline:'10-year yield drops below 4.3% on soft jobs data', source:'Reuters', time:'4h ago', up:false },
    ],
    faq: [
      { q:'What are financial futures?', a:'Contracts based on financial instruments like stock indices, government bonds, and currencies. Used for hedging portfolios or directional speculation.' },
      { q:'What is open interest?', a:'Total outstanding contracts not yet settled. Rising OI with rising price confirms trend strength. Falling OI suggests a weakening trend.' },
      { q:'How do equity index futures work?', a:'ES=F tracks the S&P 500 and is one of the most liquid markets in the world. One ES contract represents $50 × the S&P 500 index value.' },
    ],
  },
  forex: {
    title: 'Forex',
    subtitle: 'Major, Minor & Exotic Currency Pairs',
    heroGrad: 'linear-gradient(135deg, #0f766e 0%, #0891b2 55%, #4f46e5 100%)',
    cotAsset: 'EURUSD=X',
    cotLabel: 'EUR COT',
    nextEvent: { label: 'ECB Rate Decision', time: 'Thu 08:15 ET' },
    sectors: [
      {
        name: 'Majors', exchange: 'SPOT', color: '#0891b2',
        assets: [
          { sym:'EURUSD=X', name:'EUR/USD', unit:'per EUR' },
          { sym:'GBPUSD=X', name:'GBP/USD', unit:'per GBP' },
          { sym:'USDJPY=X', name:'USD/JPY', unit:'per USD' },
          { sym:'AUDUSD=X', name:'AUD/USD', unit:'per AUD' },
          { sym:'USDCAD=X', name:'USD/CAD', unit:'per USD' },
          { sym:'USDCHF=X', name:'USD/CHF', unit:'per USD' },
          { sym:'NZDUSD=X', name:'NZD/USD', unit:'per NZD' },
        ],
      },
      {
        name: 'Crosses', exchange: 'SPOT', color: '#6366f1',
        assets: [
          { sym:'EURGBP=X', name:'EUR/GBP', unit:'cross' },
          { sym:'EURJPY=X', name:'EUR/JPY', unit:'cross' },
          { sym:'GBPJPY=X', name:'GBP/JPY', unit:'cross' },
          { sym:'AUDJPY=X', name:'AUD/JPY', unit:'cross' },
        ],
      },
    ],
    news: [
      { tag:'EUR',  headline:'EUR/USD holds above 1.08 ahead of ECB rate decision', source:'FXStreet', time:'1h ago', up:true },
      { tag:'GBP',  headline:'Sterling rises on stronger-than-expected UK inflation data', source:'Reuters', time:'2h ago', up:true },
      { tag:'JPY',  headline:'Yen weakens to 152 as BoJ holds rates steady', source:'Bloomberg', time:'3h ago', up:false },
      { tag:'USD',  headline:'Dollar index slips as Fed officials signal fewer hikes ahead', source:'WSJ', time:'4h ago', up:false },
    ],
    faq: [
      { q:'What drives forex markets?', a:'Interest rate differentials, economic data releases (CPI, NFP, GDP), central bank policy, and geopolitical events are the primary drivers of currency prices.' },
      { q:'What is the COT report for forex?', a:'Shows how large speculators and commercial hedgers are positioned in currency futures on the CME. Extreme positioning often precedes reversals.' },
      { q:'What are pips?', a:'A pip is the smallest price move in a currency pair. For most pairs, 1 pip = 0.0001. For USD/JPY, 1 pip = 0.01. A standard lot (100,000 units) = $10 per pip for majors.' },
    ],
  },
  stocks: {
    title: 'Stocks',
    subtitle: 'Equities, Sectors & Market Leaders',
    heroGrad: 'linear-gradient(135deg, #065f46 0%, #0f766e 55%, #0891b2 100%)',
    cotAsset: 'ES=F',
    cotLabel: 'S&P COT',
    nextEvent: { label: 'Earnings Season', time: 'Ongoing' },
    sectors: [
      {
        name: 'Technology', exchange: 'NASDAQ', color: '#6366f1',
        assets: [
          { sym:'AAPL',  name:'Apple',    unit:'USD' },
          { sym:'MSFT',  name:'Microsoft',unit:'USD' },
          { sym:'NVDA',  name:'Nvidia',   unit:'USD' },
          { sym:'GOOGL', name:'Alphabet', unit:'USD' },
          { sym:'META',  name:'Meta',     unit:'USD' },
          { sym:'AMZN',  name:'Amazon',   unit:'USD' },
        ],
      },
      {
        name: 'Finance', exchange: 'NYSE', color: '#0891b2',
        assets: [
          { sym:'JPM',   name:'JPMorgan',  unit:'USD' },
          { sym:'BAC',   name:'Bank of America', unit:'USD' },
          { sym:'GS',    name:'Goldman Sachs',   unit:'USD' },
          { sym:'BRK-B', name:'Berkshire',  unit:'USD' },
        ],
      },
      {
        name: 'Energy', exchange: 'NYSE', color: '#ef4444',
        assets: [
          { sym:'XOM',  name:'ExxonMobil',  unit:'USD' },
          { sym:'CVX',  name:'Chevron',     unit:'USD' },
          { sym:'COP',  name:'ConocoPhillips', unit:'USD' },
        ],
      },
    ],
    news: [
      { tag:'Tech',    headline:'Nvidia surges 4% after announcing new AI chip architecture', source:'Bloomberg', time:'1h ago', up:true },
      { tag:'Finance', headline:'JPMorgan beats earnings estimates on strong trading revenue', source:'WSJ', time:'2h ago', up:true },
      { tag:'Energy',  headline:'ExxonMobil raises dividend as oil profits remain elevated', source:'Reuters', time:'3h ago', up:true },
      { tag:'Tech',    headline:'Apple faces regulatory scrutiny over App Store fees in EU', source:'FT', time:'5h ago', up:false },
    ],
    faq: [
      { q:'What moves individual stocks?', a:'Earnings reports, analyst upgrades/downgrades, sector rotation, macro conditions (rates, inflation), and company-specific news are the primary drivers.' },
      { q:'What is earnings season?', a:'Four times a year, public companies report quarterly results. Markets often move significantly on beats or misses vs. analyst expectations.' },
      { q:'How does the S&P 500 COT apply to stocks?', a:'When large speculators are heavily net long S&P futures, it often signals near-term exhaustion. COT extremes in index futures help time market tops and bottoms.' },
    ],
  },
  crypto: {
    title: 'Crypto',
    subtitle: 'Digital Assets & Token Markets',
    heroGrad: 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #d97706 100%)',
    cotAsset: 'BTC-USD',
    cotLabel: 'BTC Sentiment',
    nextEvent: { label: 'Bitcoin Halving', time: 'Apr 2028' },
    sectors: [
      {
        name: 'Layer 1', exchange: 'CRYPTO', color: '#f59e0b',
        assets: [
          { sym:'BTC-USD', name:'Bitcoin',  unit:'USD' },
          { sym:'ETH-USD', name:'Ethereum', unit:'USD' },
          { sym:'SOL-USD', name:'Solana',   unit:'USD' },
          { sym:'ADA-USD', name:'Cardano',  unit:'USD' },
          { sym:'AVAX-USD',name:'Avalanche',unit:'USD' },
        ],
      },
      {
        name: 'DeFi & Exchange', exchange: 'CRYPTO', color: '#8b5cf6',
        assets: [
          { sym:'BNB-USD',  name:'BNB',      unit:'USD' },
          { sym:'UNI-USD',  name:'Uniswap',  unit:'USD' },
          { sym:'LINK-USD', name:'Chainlink',unit:'USD' },
          { sym:'AAVE-USD', name:'Aave',     unit:'USD' },
        ],
      },
      {
        name: 'Payments', exchange: 'CRYPTO', color: '#0891b2',
        assets: [
          { sym:'XRP-USD',  name:'XRP',      unit:'USD' },
          { sym:'LTC-USD',  name:'Litecoin', unit:'USD' },
          { sym:'DOGE-USD', name:'Dogecoin', unit:'USD' },
        ],
      },
    ],
    news: [
      { tag:'BTC',    headline:'Bitcoin reclaims $75K as institutional inflows accelerate', source:'CoinDesk', time:'1h ago', up:true },
      { tag:'ETH',    headline:'Ethereum staking yields rise as network activity surges', source:'Decrypt', time:'2h ago', up:true },
      { tag:'Macro',  headline:'SEC approves additional spot Bitcoin ETF products', source:'Reuters', time:'3h ago', up:true },
      { tag:'DeFi',   headline:'Uniswap v4 launch drives surge in DEX trading volume', source:'The Block', time:'5h ago', up:true },
    ],
    faq: [
      { q:'What drives crypto prices?', a:'Supply/demand dynamics, regulatory news, on-chain metrics (active addresses, hash rate), macro risk appetite, and Bitcoin halving cycles.' },
      { q:'What is a halving?', a:"Every ~4 years, Bitcoin's block reward is cut in half, reducing new supply. Historically this has preceded major bull runs as supply shock meets sustained demand." },
      { q:'How liquid is crypto vs futures?', a:'Major crypto pairs like BTC and ETH trade 24/7 with high liquidity. However, futures markets on CME offer regulated exposure with better institutional depth.' },
    ],
  },
};

const TAG_COLORS = {
  Metals:{bg:'#FFF7ED',color:'#92400e'}, Energy:{bg:'#FEF3C7',color:'#78350f'},
  Grains:{bg:'#F0FDF4',color:'#166534'}, Softs:{bg:'#FDF4FF',color:'#6b21a8'},
  Rates:{bg:'#EFF6FF',color:'#1e40af'}, Indices:{bg:'#EEF2FF',color:'#3730a3'},
  FX:{bg:'#F0FDF4',color:'#065f46'}, EUR:{bg:'#EFF6FF',color:'#1e40af'},
  GBP:{bg:'#FDF4FF',color:'#6b21a8'}, JPY:{bg:'#FEF3C7',color:'#78350f'},
  USD:{bg:'#F9FAFB',color:'#374151'}, Tech:{bg:'#EEF2FF',color:'#3730a3'},
  Finance:{bg:'#F0F9FF',color:'#075985'}, BTC:{bg:'#FFFBEB',color:'#92400e'},
  ETH:{bg:'#EDE9FE',color:'#5b21b6'}, Macro:{bg:'#F9FAFB',color:'#374151'},
  DeFi:{bg:'#FDF4FF',color:'#6b21a8'},
};

function fmtPrice(p, sym) {
  if (p == null) return '—';
  if (sym?.includes('-USD')) {
    if (p >= 10000) return p.toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0});
    if (p >= 1000)  return p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (p >= 1)     return p.toFixed(4);
    return p.toFixed(6);
  }
  if (p >= 10000) return p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (p >= 1000)  return p.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
  if (p >= 100)   return p.toFixed(2);
  if (p >= 10)    return p.toFixed(2);
  if (p >= 1)     return p.toFixed(4);
  return p.toFixed(5);
}

// Mocked COT data — replace with real API when available
const MOCK_COT = {
  'GC=F':82, 'SI=F':54, 'CL=F':31, 'NG=F':78, 'ES=F':61,
  'EURUSD=X':44, 'BTC-USD':71,
};

function cotLabel(pct) {
  if (pct == null) return null;
  if (pct >= 80) return { label:'Bull extreme', color:'#16a34a' };
  if (pct >= 60) return { label:'Bullish', color:'#16a34a' };
  if (pct >= 40) return { label:'Neutral', color:'#6b7280' };
  if (pct >= 20) return { label:'Bearish', color:'#dc2626' };
  return { label:'Bear extreme', color:'#dc2626' };
}

function cotBarColor(pct) {
  if (pct >= 60) return 'linear-gradient(90deg,#bbf7d0,#16a34a)';
  if (pct >= 40) return 'linear-gradient(90deg,#e5e7eb,#9ca3af)';
  return 'linear-gradient(90deg,#fca5a5,#dc2626)';
}

export default function MarketOverview({ market }) {
  const cfg = MARKET_CONFIG[market] || MARKET_CONFIG.commodities;
  const allSyms = cfg.sectors.flatMap(s => s.assets.map(a => a.sym));

  const [prices,  setPrices]  = useState({});
  const [loading, setLoading] = useState(true);
  const [now,     setNow]     = useState(new Date());

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/prices?symbols=${allSyms.join(',')}`);
      const data = await res.json();
      setPrices(data || {});
    } catch {} finally { setLoading(false); }
  }, [market]);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  // Stats for hero
  const allPrices = allSyms.map(s => ({ sym:s, ...prices[s] })).filter(p => p.changePct != null);
  const advancing = allPrices.filter(p => p.changePct >= 0).length;
  const declining = allPrices.filter(p => p.changePct < 0).length;
  const best  = allPrices.sort((a,b) => b.changePct - a.changePct)[0];
  const worst = allPrices.sort((a,b) => a.changePct - b.changePct)[0];
  const cotPct = MOCK_COT[cfg.cotAsset];
  const cotInfo = cotLabel(cotPct);

  const hour = now.getHours();
  const session = hour < 6 ? 'Asian' : hour < 12 ? 'London' : hour < 17 ? 'New York' : 'After Hours';

  // Sector avg
  const sectorAvg = (sector) => {
    const vals = sector.assets.map(a => prices[a.sym]?.changePct).filter(v => v != null);
    if (!vals.length) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  return (
    <div>
      {/* ══ HERO ══ */}
      <div style={{ background: cfg.heroGrad, padding:'22px 26px 20px' }}>
        {/* top row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.55)', marginBottom:7 }}>
              TradeRing · {cfg.title} Market
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, color:'rgba(255,255,255,0.75)' }}>
              {now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · {session} Session · {allSyms.length} contracts
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, background:'rgba(134,239,172,0.18)', color:'#86efac', padding:'4px 14px', borderRadius:20, border:'0.5px solid rgba(134,239,172,0.25)' }}>
              {loading ? '—' : advancing} ▲
            </span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, background:'rgba(252,165,165,0.18)', color:'#fca5a5', padding:'4px 14px', borderRadius:20, border:'0.5px solid rgba(252,165,165,0.25)' }}>
              {loading ? '—' : declining} ▼
            </span>
          </div>
        </div>

        {/* 4 stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {/* Best */}
          <div style={{ background:'rgba(255,255,255,0.10)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Top Performer</div>
            <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.2px', marginBottom:3 }}>
              {loading || !best ? '—' : best.sym.replace('=F','').replace('-USD','').replace('USD=X','')}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:19, fontWeight:500, color:'#86efac' }}>
              {loading || !best ? '—' : `▲ ${Math.abs(best.changePct).toFixed(2)}%`}
            </div>
            {best && <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:4, fontFamily:'var(--font-mono)' }}>${fmtPrice(best.price, best.sym)}</div>}
          </div>

          {/* Worst */}
          <div style={{ background:'rgba(255,255,255,0.10)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Worst Performer</div>
            <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.2px', marginBottom:3 }}>
              {loading || !worst ? '—' : worst.sym.replace('=F','').replace('-USD','').replace('USD=X','')}
            </div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:19, fontWeight:500, color:'#fca5a5' }}>
              {loading || !worst ? '—' : `▼ ${Math.abs(worst.changePct).toFixed(2)}%`}
            </div>
            {worst && <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:4, fontFamily:'var(--font-mono)' }}>${fmtPrice(worst.price, worst.sym)}</div>}
          </div>

          {/* COT */}
          <div style={{ background:'rgba(255,255,255,0.10)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>{cfg.cotLabel}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.2px', marginBottom:3 }}>
              {cotPct != null ? `${cotPct}th pct` : 'No data'}
            </div>
            {cotInfo && <div style={{ fontSize:12, color: cotPct >= 60 ? '#86efac' : cotPct >= 40 ? '#a5b4fc' : '#fca5a5', fontWeight:600, marginBottom:3 }}>{cotInfo.label}</div>}
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-mono)' }}>Weekly CFTC data</div>
          </div>

          {/* Next event */}
          <div style={{ background:'rgba(255,255,255,0.10)', border:'0.5px solid rgba(255,255,255,0.15)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:9, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>Next Key Event</div>
            <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600, color:'#f1f5f9', letterSpacing:'-0.2px', marginBottom:3, lineHeight:1.3 }}>{cfg.nextEvent.label}</div>
            <div style={{ fontSize:12, color:'#fde68a', fontWeight:600 }}>{cfg.nextEvent.time}</div>
          </div>
        </div>
      </div>

      {/* ══ MAIN BODY ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px' }}>

        {/* Left: scorecard table */}
        <div style={{ borderRight:'1px solid var(--border)' }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 130px 110px 80px', padding:'9px 22px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
            {['Contract','Price','COT Signal','Day Range','24h'].map((h,i) => (
              <div key={h} style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {/* Sectors */}
          {cfg.sectors.map(sector => {
            const avg = sectorAvg(sector);
            const avgUp = (avg || 0) >= 0;
            return (
              <div key={sector.name}>
                {/* Sector header */}
                <div style={{ padding:'9px 22px 6px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:`linear-gradient(90deg, ${sector.color}12, transparent)` }}>
                  <div style={{ width:10, height:10, borderRadius:2, background:sector.color, flexShrink:0 }} />
                  <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)' }}>{sector.name}</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{sector.exchange}</span>
                  {avg != null && (
                    <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:10, fontWeight:600, background: avgUp ? 'var(--green-bg)' : 'var(--red-bg)', color: avgUp ? 'var(--green)' : 'var(--red)', padding:'2px 9px', borderRadius:20 }}>
                      {avgUp?'▲':'▼'} avg {Math.abs(avg).toFixed(2)}%
                    </span>
                  )}
                </div>

                {/* Asset rows */}
                {sector.assets.map((asset, idx) => {
                  const d = prices[asset.sym];
                  const up = (d?.changePct || 0) >= 0;
                  const cot = MOCK_COT[asset.sym];
                  const cl = cotLabel(cot);
                  const rangePos = d?.high && d?.low && d?.price && d.high !== d.low
                    ? Math.min(100, Math.max(0, ((d.price - d.low) / (d.high - d.low)) * 100)) : null;

                  return (
                    <div key={asset.sym}
                      style={{ display:'grid', gridTemplateColumns:'1fr 110px 130px 110px 80px', padding:'12px 22px', borderBottom:'1px solid var(--border)', alignItems:'center', transition:'background 0.1s', cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name */}
                      <div>
                        <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:500, color:'var(--text)' }}>
                          {asset.name} <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', fontWeight:400 }}>{asset.sym}</span>
                        </div>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{asset.unit}</div>
                      </div>

                      {/* Price */}
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:500, color:'var(--text)', textAlign:'center' }}>
                        {loading ? '…' : fmtPrice(d?.price, asset.sym)}
                      </div>

                      {/* COT bar */}
                      <div style={{ padding:'0 10px' }}>
                        {cot != null ? (
                          <>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <div style={{ flex:1, height:5, background:'var(--surface3)', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ width:`${cot}%`, height:'100%', background:cotBarColor(cot), borderRadius:3 }} />
                              </div>
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:cl?.color, minWidth:24, textAlign:'right' }}>{cot}%</span>
                            </div>
                            <div style={{ fontFamily:'var(--font)', fontSize:9, color:cl?.color, fontWeight:500, marginTop:2, textAlign:'center' }}>{cl?.label}</div>
                          </>
                        ) : (
                          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-dim)', textAlign:'center' }}>—</div>
                        )}
                      </div>

                      {/* Day range */}
                      <div style={{ padding:'0 8px' }}>
                        {rangePos != null ? (
                          <>
                            <div style={{ height:3, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ width:`${rangePos}%`, height:'100%', background: up ? 'var(--green)' : 'var(--red)', borderRadius:2 }} />
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)' }}>{fmtPrice(d?.low, asset.sym)}</span>
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:8, color:'var(--text-muted)' }}>{fmtPrice(d?.high, asset.sym)}</span>
                            </div>
                          </>
                        ) : <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-dim)', textAlign:'center' }}>—</div>}
                      </div>

                      {/* Change */}
                      <div style={{ textAlign:'center' }}>
                        {d?.changePct != null ? (
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600, background: up ? 'var(--green-bg)' : 'var(--red-bg)', color: up ? 'var(--green)' : 'var(--red)', padding:'3px 9px', borderRadius:20, whiteSpace:'nowrap' }}>
                            {up ? '▲' : '▼'} {Math.abs(d.changePct).toFixed(2)}%
                          </span>
                        ) : <span style={{ color:'var(--text-dim)', fontFamily:'var(--font-mono)', fontSize:11 }}>—</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Right: News feed */}
        <div>
          <div style={{ padding:'11px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-secondary)' }}>{cfg.title} News</span>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--accent)', cursor:'pointer' }}>All →</span>
          </div>

          {/* Featured story */}
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}
          >
            <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:8 }}>
              {(() => { const tc = TAG_COLORS[cfg.news[0]?.tag] || {bg:'#F9FAFB',color:'#374151'}; return (
                <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, background:tc.bg, color:tc.color, padding:'2px 9px', borderRadius:20 }}>{cfg.news[0]?.tag}</span>
              ); })()}
              <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)' }}>{cfg.news[0]?.time}</span>
              <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--accent)', background:'var(--accent-bg)', padding:'1px 7px', borderRadius:3 }}>Top Story</span>
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', lineHeight:1.5 }}>{cfg.news[0]?.headline}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginTop:5 }}>{cfg.news[0]?.source}</div>
          </div>

          {/* Rest of news */}
          {cfg.news.slice(1).map((item, i) => {
            const tc = TAG_COLORS[item.tag] || {bg:'#F9FAFB',color:'#374151'};
            return (
              <div key={i} style={{ padding:'11px 18px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display:'flex', gap:6, marginBottom:4 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:500, background:tc.bg, color:tc.color, padding:'1px 7px', borderRadius:20 }}>{item.tag}</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-dim)' }}>{item.time}</span>
                </div>
                <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:500, color:'var(--text)', lineHeight:1.5 }}>{item.headline}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{item.source}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ FAQ ══ */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'18px 24px', background:'var(--surface2)', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24 }}>
        {cfg.faq.map((item, i) => (
          <div key={i}>
            <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:5 }}>{item.q}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-secondary)', lineHeight:1.6 }}>{item.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
