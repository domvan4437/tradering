'use client'
import MarketOverview from './MarketOverview'
import FeedTab from './FeedTab'
import { MarketsLanding, CommunityLanding, ToolsLanding, NewsLanding } from './SectionLanding'
import CryptoTab from './CryptoTab'
import ProfileTab from './ProfileTab'
import GlobalLeaderboard from './GlobalLeaderboard'
// ── TradeRing DS import
import { LiveDot } from './DS';
import { useTheme } from './ThemeProvider'
import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import MarketsSection from './MarketsSection'
import AIAssistant from './AIAssistant'
import { NotesTab, WeeklyReviewTab, PnLCalendar, ThemeSettings } from './RichTools'
import ChartWorkspace from './ChartWorkspace'
import HomePage from './HomePage'
import NavBar from './NavBar'
import TickerStrip from './TickerStrip'
import { UpgradeModal } from './UpgradeModal'
import { ForexOverviewTab, ForexCOTTab, ForexKeyLevelsTab } from './ForexSection'
import AICoachTab from './AICoachTab'
import COTAlertsTab from './COTAlertsTab'
import TradePlanTab from './TradePlanTab'
import BacktestTab from './BacktestTab'
import ScreenerBuilder from './ScreenerBuilder'
import StrategyBacktestTab from './StrategyBacktestTab'
import NewsTab from './NewsTab'
import SocialTab from './SocialTab'
import GroupsTab from './GroupsTab'
import CompeteTab from './CompeteTab'
import CreatorStudioTab from './CreatorStudioTab'
import BrokerTab from './BrokerTab'
import BrokerIntegrationTab from './BrokerIntegrationTab'
import CreatorDashboard from './CreatorDashboard'
import { StocksOverviewTab, StocksSectorsTab, StocksEarningsTab, StocksKeyLevelsTab } from './StocksSection'

const STAGES = [
  { id: 'seasonal', label: 'Stage 1', title: 'Seasonal Tendency',
    question: (c) => `For "${c}", based on the seasonal data provided, is there a current seasonal tendency to buy or sell? Answer YES or NO and reference the avg return and win rate for this month.`,
    passCondition: 'YES', failAction: 'No seasonal tendency. Wait for the next seasonal window.' },
  { id: 'major_market', label: 'Stage 2', title: 'Major Market Analysis',
    question: (c) => `Based on the LIVE USDX and Treasury yield data, are macro markets trending to support a move in "${c}"? Answer YES or NO and cite the actual numbers.`,
    passCondition: 'YES', failAction: 'Macro markets not supportive. Consider short-term trades only.' },
  { id: 'commodity_stock', label: 'Stage 3', title: 'Commodity Trending',
    question: (c) => `Based on the LIVE price data, is "${c}" currently trending? Reference the 4w, 13w, and 26w changes. Answer YES or NO and specify direction.`,
    passCondition: 'YES', failAction: 'Market not trending. Wait.' },
  { id: 'intermarket', label: 'Stage 4', title: 'Intermarket Analysis',
    question: (c) => `Based on LIVE data (USDX, rates, price trend, COT index), are intermarket signals suggesting net BUYING or net SELLING for "${c}"? State BUYING or SELLING.`,
    passCondition: null, failAction: null },
  { id: 'cot', label: 'Stage 5', title: 'COT Hedging Program',
    question: (c) => `The LIVE COT data shows exact commercial positions for "${c}" plus the COT Index (0=max bearish, 100=max bullish). State BUYING or SELLING and cite the net position and index value.`,
    passCondition: null, failAction: null },
  { id: 'correlation', label: 'Stage 6', title: 'Correlation Analysis',
    question: (c) => `Is the USDX currently WEAKENING in a way that supports commodity prices for "${c}"? Answer YES or NO and cite the actual USDX 13-week change.`,
    passCondition: 'YES', failAction: 'Dollar correlation does not support. Wait.' },
  { id: 'commodity_filter', label: 'Stage 7', title: 'Commodity Filter',
    question: (c) => `Based on LIVE price data, is "${c}" rallying, breaking old highs, or rejecting old lows? Reference 52-week proximity and recent changes. Answer YES or NO.`,
    passCondition: 'YES', failAction: 'No price confirmation. Wait.' },
  { id: 'open_interest', label: 'Stage 8', title: 'Open Interest Filter',
    question: (c) => `The LIVE COT data shows open interest for "${c}". Has OI dropped 10-15%+ indicating commercial short covering? Answer YES or NO with the actual numbers.`,
    passCondition: 'YES', failAction: 'Open interest filter not met. Wait.' },
  { id: 'top_down', label: 'Stage 9', title: 'Top-Down Analysis',
    question: (c) => `Using ALL live data (price, USDX, rates, COT index, OI, seasonal), does the complete picture confirm a high-probability setup for "${c}"? Answer YES or NO, summarize key points, and state final direction: BUY or SELL.`,
    passCondition: 'YES', failAction: 'Top-down does not confirm. Wait for full alignment.' },
]

const COMMODITIES = ['Gold','Silver','Copper','Platinum','Palladium','Crude Oil','Natural Gas','Gasoline','Heating Oil','Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle','Lean Hogs','Rice','Oats','Lumber']
const SECTION_TABS = {
  home:        ['Dashboard'],
  markets:     ['Commodities','Futures','Forex','Stocks','Crypto','Charts'],
  community:   ['Feed','Groups','Compete','Leaderboard','Creator Studio'],
  news:        ['All Markets','Forex','Commodities','Futures','Stocks','Crypto'],
  tools:       ['Trade Calc','AI Coach','Trade Plan Builder','COT Alerts','Backtesting','Strategy Backtest','Weekly Review','Personal Calendar','Notes','Reference','Broker','My Profile','Settings'],
  // Sub-sections rendered inside markets tab
  commodities: ['Screener','COT Index','Seasonal','Watchlist','Positions','Journal','Ideas','Economic Calendar','Analytics','Alerts','Checklist'],
  forex:       ['Overview','COT Data','Key Levels','Economic Calendar'],
  stocks:      ['Overview','Sectors','Earnings','Key Levels'],
  crypto:      ['Overview','Watchlist','News'],
  futures:     ['Overview','Financial COT','Yield Curve','Key Levels'],
}
const TABS = SECTION_TABS.commodities
const C = {
  // Hyper-future design tokens (mirrors CSS vars for inline styles)
  bg:       '#04060a',
  bg1:      '#080c12',
  surface:  '#0c1018',
  surface2: '#111720',
  surface3: '#161e2a',
  border:   'rgba(0,212,255,0.08)',
  border2:  'rgba(0,212,255,0.14)',
  accent:   '#00d4ff',
  text:     '#f0f4f8',
  muted:    '#4a6070',
  dim:      '#2a3a48',
  green:    '#00ff88',
  red:      '#ff3355',
  gold:     '#ffaa00',
  mono:     "'Space Mono', monospace",
  display:  "'Syne', sans-serif",
  // Legacy keys kept for backward compat with existing tab components:
  _legacy_surface:  '#0c1018',
  bg:          'var(--bg)',
  bg1:         'var(--bg1)',
  surface:     'var(--surface)',
  surface2:    'var(--surface2)',
  surface3:    'var(--surface3)',
  border:      'var(--border)',
  border2:     'var(--border2)',
  border3:     'var(--border3)',
  accent:      'var(--accent)',
  accentLight: 'var(--accent-bg)',
  gold:        'var(--gold)',
  goldBg:      'var(--gold-bg)',
  text:        'var(--text)',
  muted:       'var(--text-muted)',
  dim:         'var(--text-dim)',
  green:       'var(--green)',
  greenBg:     'var(--green-bg)',
  greenBorder: 'var(--green-border)',
  red:         'var(--red)',
  redBg:       'var(--red-bg)',
  redBorder:   'var(--red-border)',
  yellow:      'var(--gold)',
  blue:        'var(--accent)',
  purple:      'var(--accent)',
  shadow:      'var(--shadow)',
  shadowMd:    'var(--shadow-md)',
  radius:      'var(--radius)',
  radiusLg:    'var(--radius-lg)',
  font:        'var(--font)',
  mono:        'var(--font-mono)',
}

function Label({ children, style }) { return <p style={{ fontSize:11,fontWeight:600,letterSpacing:0.5,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',fontFamily:C.font,...style }}>{children}</p> }
function Card({ children, style }) { return <div style={{ background:C.surface,border:`1px solid ${C.border}`,paddingTop: '100px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px',borderRadius:'var(--radius)',boxShadow:'var(--shadow-sm)',...style }}>{children}</div> }
function InfoTooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position:'relative', display:'inline-flex', alignItems:'center', marginLeft:6 }}>
      <span
        onMouseEnter={()=>setShow(true)}
        onMouseLeave={()=>setShow(false)}
        onClick={()=>setShow(s=>!s)}
        style={{ width:15, height:15, borderRadius:'50%', background:'var(--surface2)', border:'1px solid var(--border2)', color:'var(--text-muted)', fontSize:9, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', userSelect:'none', flexShrink:0 }}>
        ?
      </span>
      {show && (
        <span style={{ position:'absolute', top:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--text-muted)', lineHeight:1.5, width:240, zIndex:999, boxShadow:'var(--shadow-md)', pointerEvents:'none' }}>
          {text}
          <span style={{ position:'absolute', top:-5, left:'50%', transform:'translateX(-50%)', width:8, height:8, background:'var(--surface)', border:'1px solid var(--border2)', borderLeft:'none', borderBottom:'none', transform:'translateX(-50%) rotate(-45deg)' }} />
        </span>
      )}
    </span>
  )
}


function Badge({ color, children }) { return <span style={{ fontSize:10,background:color,color:C.surface,padding:'2px 8px',letterSpacing:1 }}>{children}</span> }
function DataBlock({ label, value, sub1, sub2, color1, valueSmall }) {
  return (
    <div>
      <p style={{ fontSize:9,letterSpacing:2,color:C.muted,margin:'0 0 6px',textTransform:'uppercase' }}>{label}</p>
      <p style={{ fontSize:valueSmall?13:16,color:color1||C.text,margin:'0 0 4px',fontWeight:400,lineHeight:1.3 }}>{value}</p>
      {sub1 && <p style={{ fontSize:11,color:C.muted,margin:'2px 0' }}>{sub1}</p>}
      {sub2 && <p style={{ fontSize:11,color:C.dim,margin:'2px 0' }}>{sub2}</p>}
    </div>
  )
}
function UpgradeGate({ feature, onUpgrade }) {
  return (
    <Card style={{ textAlign:'center',padding:48 }}>
      <p style={{ fontSize:11,letterSpacing:3,color:C.gold,marginBottom:12 }}>PRO FEATURE</p>
      <p style={{ fontSize:20,color:C.text,marginBottom:8 }}>{feature} requires Pro</p>
      <p style={{ fontSize:13,color:C.muted,marginBottom:28 }}>Upgrade for $29/mo — unlimited screenings, watchlist, weekly COT alerts, and more.</p>
      <button onClick={onUpgrade} style={{ background:C.gold,color:C.surface,border:'none',padding:'12px 32px',fontSize:11,letterSpacing:3,cursor:'pointer',fontFamily:C.font }}>UPGRADE TO PRO →</button>
      <p style={{ fontSize:11,color:C.muted,marginTop:12 }}>14-day free trial · Cancel anytime</p>
    </Card>
  )
}



// ── Futures Overview Tab
function FuturesOverviewTab() {
  const FUTURES = [
    { sym:'ES=F',  name:'E-mini S&P 500',   cat:'Financial' },
    { sym:'NQ=F',  name:'E-mini Nasdaq',     cat:'Financial' },
    { sym:'YM=F',  name:'Dow Jones Mini',    cat:'Financial' },
    { sym:'RTY=F', name:'Russell 2000',      cat:'Financial' },
    { sym:'ZB=F',  name:'30-Year T-Bond',    cat:'Rates'     },
    { sym:'ZN=F',  name:'10-Year T-Note',    cat:'Rates'     },
    { sym:'ZF=F',  name:'5-Year T-Note',     cat:'Rates'     },
    { sym:'GC=F',  name:'Gold',              cat:'Metals'    },
    { sym:'SI=F',  name:'Silver',            cat:'Metals'    },
    { sym:'HG=F',  name:'Copper',            cat:'Metals'    },
    { sym:'CL=F',  name:'Crude Oil WTI',     cat:'Energy'    },
    { sym:'NG=F',  name:'Natural Gas',       cat:'Energy'    },
    { sym:'RB=F',  name:'RBOB Gasoline',     cat:'Energy'    },
    { sym:'ZW=F',  name:'Wheat',             cat:'Grains'    },
    { sym:'ZC=F',  name:'Corn',              cat:'Grains'    },
    { sym:'ZS=F',  name:'Soybeans',          cat:'Grains'    },
    { sym:'CT=F',  name:'Cotton',            cat:'Softs'     },
    { sym:'KC=F',  name:'Coffee',            cat:'Softs'     },
    { sym:'SB=F',  name:'Sugar',             cat:'Softs'     },
    { sym:'6E=F',  name:'Euro FX',           cat:'FX Futures'},
    { sym:'6B=F',  name:'British Pound',     cat:'FX Futures'},
    { sym:'6J=F',  name:'Japanese Yen',      cat:'FX Futures'},
  ];

  const [prices, setPrices] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [catFilter, setCatFilter] = React.useState('All');

  React.useEffect(() => {
    const syms = FUTURES.map(f => f.sym).join(',');
    fetch(`/api/prices?symbols=${syms}`)
      .then(r => r.json())
      .then(d => { setPrices(d || {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const cats = ['All', ...new Set(FUTURES.map(f => f.cat))];
  const filtered = catFilter === 'All' ? FUTURES : FUTURES.filter(f => f.cat === catFilter);

  const fmt = (p) => {
    if (!p) return '—';
    if (p >= 1000) return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(2);
    return p.toFixed(4);
  };

  return (
    <div style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>Markets</div>
          <h2 style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>Futures Overview</h2>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding: '5px 14px', borderRadius: 20,
              background: catFilter === c ? 'var(--accent)' : 'var(--surface)',
              color: catFilter === c ? '#fff' : 'var(--text-muted)',
              border: catFilter === c ? 'none' : '1px solid var(--border2)',
              fontFamily: 'var(--font)', fontSize: 12,
              fontWeight: catFilter === c ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 80px', padding: '9px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
          {['Contract','Price','24h Change','Category'].map((h, i) => (
            <span key={h} style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: i > 1 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 80px', padding: '13px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 120, height: 14, background: 'var(--surface3)', borderRadius: 4, opacity: 0.5 }} />
              <div style={{ width: 70, height: 14, background: 'var(--surface3)', borderRadius: 4, opacity: 0.5 }} />
              <div style={{ width: 60, height: 14, background: 'var(--surface3)', borderRadius: 4, opacity: 0.5, marginLeft: 'auto' }} />
              <div style={{ width: 50, height: 14, background: 'var(--surface3)', borderRadius: 4, opacity: 0.5, marginLeft: 'auto' }} />
            </div>
          ))
        ) : filtered.map((f, i) => {
          const d = prices[f.sym];
          const up = (d?.changePct || 0) >= 0;
          return (
            <div key={f.sym} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.12s', cursor: 'pointer',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.2px' }}>{f.name}</span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, background: '#F9FAFB', color: '#374151', border: '0.5px solid #e5e7eb', padding: '2px 8px', borderRadius: 20 }}>{f.cat}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', background: '#F9FAFB', border: '0.5px solid #e5e7eb', padding: '2px 7px', borderRadius: 3 }}>CME</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{f.sym}</span>
                  {d?.high && d?.low && d?.price && d.high !== d.low && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, maxWidth: 180 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmt(d.low)}</span>
                      <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, ((d.price - d.low) / (d.high - d.low)) * 100))}%`, background: up ? '#16a34a' : '#dc2626', borderRadius: 2 }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{fmt(d.high)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 20 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 5 }}>
                  {d?.price ? fmt(d.price) : '—'}
                </div>
                {d?.changePct != null ? (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500, background: up ? 'var(--green-bg)' : 'var(--red-bg)', color: up ? 'var(--green)' : 'var(--red)', padding: '3px 10px', borderRadius: 20 }}>
                    {up ? '▲' : '▼'} {Math.abs(d.changePct).toFixed(2)}%
                  </span>
                ) : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
        {filtered.length} contracts · Prices via Yahoo Finance · Updates every 60s
      </div>
    </div>
  );
}

// ── Markets Layout — must be defined before App()
function MarketsLayout({ tab, setTab, plan, onUpgrade, currentUserId }) {
  const [subTab, setSubTab] = React.useState('Screener');
  const showLanding = !tab || tab === 'Markets';

  React.useEffect(() => {
    // Default to empty subTab so MarketOverview shows first
    setSubTab('');
  }, [tab]);

  const section = (tab || 'commodities').toLowerCase();

  const SUB_TABS = {
    commodities: ['Screener','COT Index','Seasonal','Watchlist','Positions','Journal','Ideas','Economic Calendar','Analytics','Alerts','Checklist'],
    forex:       ['Overview','COT Data','Key Levels','Economic Calendar'],
    stocks:      ['Overview','Sectors','Earnings','Key Levels'],
    crypto:      ['Overview'],
    futures:     ['Overview','Financial COT','Yield Curve','Key Levels'],
    charts:      [],
  };

  const subTabs = SUB_TABS[section] || [];

  if (showLanding) {
    const mkt = (tab || '').toLowerCase();
    if (['commodities','futures','forex','stocks','crypto'].includes(mkt)) {
      return <MarketOverview market={mkt} />;
    }
    return <MarketsLanding onSelect={(t) => setTab(t)} />;
  }

  // Show market overview when no subTab selected
  if (!subTab && section !== 'charts') {
    return <MarketOverview market={section} />;
  }

  return (
    <div>
      {subTabs.length > 0 && (
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 24px', background:'var(--surface)', position:'sticky', top:46, zIndex:50, overflowX:'auto' }}>
          {subTabs.map(t => (
            <button key={t} onClick={() => setSubTab(t)} style={{
              background:'transparent',
              color: subTab===t ? 'var(--accent)' : 'var(--text-muted)',
              border:'none',
              borderBottom: subTab===t ? '2px solid var(--accent)' : '2px solid transparent',
              padding:'0 14px', height:38,
              fontSize:12, fontWeight: subTab===t ? 600 : 400,
              cursor:'pointer', fontFamily:'var(--font)',
              whiteSpace:'nowrap', flexShrink:0,
              transition:'all 0.15s', marginBottom:-1,
            }}>{t}</button>
          ))}
        </div>
      )}
      <div style={{ padding:'20px 24px' }}>
        {section === 'charts' && <ChartWorkspace />}
        {section === 'crypto' && <CryptoTab />}
        {section === 'commodities' && <>
          {subTab==='Screener'          && <ScreenerBuilder user={null} />}
          {subTab==='COT Index'         && <COTIndexTab />}
          {subTab==='Seasonal'          && <SeasonalTab />}
          {subTab==='Watchlist'         && <WatchlistTab plan={plan} onUpgrade={onUpgrade} />}
          {subTab==='Positions'         && <PositionsTab />}
          {subTab==='Journal'           && <JournalTab />}
          {subTab==='Ideas'             && <IdeasTab />}
          {subTab==='Economic Calendar' && <CalendarTab />}
          {subTab==='Analytics'         && <AnalyticsTab />}
          {subTab==='Alerts'            && <AlertsTab plan={plan} onUpgrade={onUpgrade} />}
          {subTab==='Checklist'         && <ChecklistTab />}
        </>}
        {section === 'forex' && <>
          {subTab==='Overview'          && <ForexOverviewTab />}
          {subTab==='COT Data'          && <ForexCOTTab />}
          {subTab==='Key Levels'        && <ForexKeyLevelsTab />}
          {subTab==='Economic Calendar' && <CalendarTab />}
        </>}
        {section === 'stocks' && <>
          {subTab==='Overview'   && <StocksOverviewTab />}
          {subTab==='Sectors'    && <StocksSectorsTab />}
          {subTab==='Earnings'   && <StocksEarningsTab />}
          {subTab==='Key Levels' && <StocksKeyLevelsTab />}
        </>}
        {section === 'futures' && <>
          {subTab==='Overview'      && <FuturesOverviewTab />}
          {subTab==='Financial COT' && <COTIndexTab />}
          {subTab==='Yield Curve'   && <ComingSoonTab section="futures" tab="Yield Curve" />}
          {subTab==='Key Levels'    && <ComingSoonTab section="futures" tab="Key Levels" />}
        </>}
      </div>
    </div>
  );
}

// ── Community Layout
function CommunityLayout({ tab, setTab, currentUserId }) {
  if (!tab || tab === 'Community') {
    return <CommunityLanding onSelect={(t) => setTab(t)} />;
  }
  return (
    <div style={{ padding:'20px 24px' }}>
      {tab==='Feed'    && <FeedTab />}
      {tab==='Groups'  && <GroupsTab currentUserId={currentUserId} />}
      {tab==='Compete'     && <CompeteTab currentUserId={currentUserId} />}
      {tab==='Leaderboard' && <GlobalLeaderboard />}
      {tab==='Creator Studio' && <CreatorStudioTab user={userInfo} />}
    </div>
  );
}


export default function App() {
  const { data: session } = useSession()
  const [tab, setTab] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [showAccount, setShowAccount] = useState(false)
  const [hoveredSection, setHoveredSection] = useState(null)
  const [marketSection, setMarketSection] = useState('commodities') // commodities|forex|stocks|crypto|charts
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const handleUpgrade = (feature) => { setUpgradeFeature(feature||null); setShowUpgrade(true) }
  const { theme, toggle } = useTheme()
  const [section, setSection] = useState('home')

  useEffect(() => {
    if (session) fetch('/api/user').then(r=>r.json()).then(d=>{ if (!d.error) setUserInfo(d) })
  }, [session])

  const plan = userInfo?.plan || session?.user?.plan || 'free'
  const planColor = plan==='trader' ? C.gold : plan==='pro' ? C.green : C.muted


  const handleManageBilling = async () => {
    const res = await fetch('/api/stripe/portal',{method:'POST'})
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  useEffect(()=>{
    
  },[])

  const navItems = [['Home','home'],['Markets','markets'],['News','news'],['Community','community'],['Tools','tools']]

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font)', color:'var(--text)', fontFamily:'var(--font)', fontSize:13 }}>

      {/* ── Navbar — TradingView style ── */}
      <div style={{ background:'var(--bg1)', position:'sticky', top:0, zIndex:300, borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', height:46, padding:'0 16px', gap:0, overflow:'visible' }}>

          {/* Logo with ring */}
          <div style={{ display:'flex', alignItems:'center', gap:7, marginRight:20, flexShrink:0 }}>
            <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <div style={{ width:7, height:7, background:'var(--accent)', borderRadius:'50%' }} />
            </div>
            <span style={{ fontSize:15, fontWeight:700, color:'var(--text)', letterSpacing:'-0.4px' }}>TradeRing</span>
          </div>

          {/* Nav links with hover dropdowns */}
          <div style={{ display:'flex', flex:1, overflow:'visible' }}>
            {navItems.map(([label,sec])=>{
              const tabs = SECTION_TABS[sec] || [];
              const hasDropdown = tabs.length > 1;
              const isActive = section === sec;
              const isHovered = hoveredSection === sec;
              return (
                <div
                  key={sec}
                  style={{ position:'relative', flexShrink:0 }}
                  onMouseEnter={() => setHoveredSection(sec)}
                  onMouseLeave={() => setHoveredSection(null)}
                >
                  <button
                    onClick={() => { setSection(sec); setTab(''); setHoveredSection(null); }}
                    style={{
                      background: isActive ? 'var(--accent-bg)' : 'transparent',
                      color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                      border: 'none',
                      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      padding: '0 12px',
                      height: 46,
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'var(--font)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s',
                      marginBottom: -1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {label}
                    {hasDropdown && (
                      <span style={{ fontSize: 8, opacity: 0.5, marginTop: 1 }}>▾</span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {hasDropdown && isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: 'var(--surface)',
                      border: '1px solid var(--border2)',
                      borderRadius: '0 0 8px 8px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                      zIndex: 500,
                      minWidth: 200,
                      padding: '6px 0',
                      animation: 'tr-fadeUp 0.12s ease both',
                    }}>
                      {tabs.map(t => (
                        <button
                          key={t}
                          onClick={() => { setSection(sec); setTab(t); setHoveredSection(null); }}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            background: tab === t && section === sec ? 'var(--accent-bg)' : 'transparent',
                            color: tab === t && section === sec ? 'var(--accent)' : 'var(--text-secondary)',
                            border: 'none',
                            borderLeft: tab === t && section === sec ? '2px solid var(--accent)' : '2px solid transparent',
                            padding: '9px 16px',
                            fontSize: 13,
                            fontFamily: 'var(--font)',
                            fontWeight: tab === t && section === sec ? 600 : 400,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.1s',
                          }}
                          onMouseEnter={e => {
                            if (!(tab === t && section === sec)) {
                              e.currentTarget.style.background = 'var(--surface2)';
                              e.currentTarget.style.color = 'var(--text)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!(tab === t && section === sec)) {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--text-secondary)';
                            }
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right side */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:8, flexShrink:0 }}>
            {plan==='free' && userInfo && (
              <span style={{ fontSize:11, fontWeight:600, color:'var(--accent)', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', padding:'3px 9px', borderRadius:5 }}>
                FREE · {userInfo.screeningsToday}/{userInfo.limits?.screeningsPerDay}
              </span>
            )}
            {plan==='pro' && <span style={{ fontSize:11, fontWeight:600, color:'var(--green)', background:'var(--green-bg)', padding:'3px 8px', borderRadius:3 }}>PRO</span>}
            {plan==='trader' && <span style={{ fontSize:11, fontWeight:600, color:'var(--gold)', background:'var(--gold-bg)', padding:'3px 8px', borderRadius:3 }}>TRADER</span>}
            {plan==='free' && (
              <button onClick={()=>handleUpgrade()}
                style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'5px 13px', borderRadius:3, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)' }}>
                Upgrade
              </button>
            )}
            <button onClick={toggle}
              style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--text-muted)', width:28, height:28, borderRadius:3, cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {theme==='dark'?'○':'●'}
            </button>
            <div style={{ position:'relative' }}>
              <button onClick={()=>setShowAccount(s=>!s)}
                style={{ background:'var(--surface2)', color:'var(--text)', border:'1px solid var(--border)', padding:'4px 10px', fontSize:12, fontWeight:500, borderRadius:3, cursor:'pointer', fontFamily:'var(--font)', display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:'var(--accent)', color:'#fff', fontSize:9, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {(session?.user?.email?.charAt(0)||'U').toUpperCase()}
                </span>
                {session?.user?.email?.split('@')[0]||'Account'} ▾
              </button>
              {showAccount && (
                <div style={{ position:'absolute', right:0, top:'calc(100% + 4px)', background:'var(--surface)', border:'1px solid var(--border)', minWidth:200, zIndex:999, borderRadius:'var(--radius)', boxShadow:'var(--shadow-lg)' }}>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                    <p style={{ fontSize:12, color:'var(--text)', margin:0, fontWeight:500 }}>{session?.user?.email}</p>
                    <p style={{ fontSize:11, color:'var(--text-muted)', margin:'4px 0 0', textTransform:'uppercase' }}>{plan}</p>
                  </div>
                  <Link href="/pricing" style={{ display:'block', padding:'10px 16px', fontSize:13, color:'var(--text-muted)', textDecoration:'none' }}>Pricing</Link>
                  {plan!=='free' && <button onClick={handleManageBilling} style={{ display:'block', width:'100%', background:'transparent', color:'var(--text-muted)', border:'none', padding:'10px 16px', fontSize:13, textAlign:'left', cursor:'pointer', fontFamily:'var(--font)' }}>Manage Billing</button>}
                  <button onClick={()=>import('next-auth/react').then(m=>m.signOut({callbackUrl:'/'}))} style={{ display:'block', width:'100%', background:'transparent', color:'var(--red)', border:'none', borderTop:'1px solid var(--border)', padding:'10px 16px', fontSize:13, textAlign:'left', cursor:'pointer', fontFamily:'var(--font)' }}>Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>

        
      </div>
      <TickerStrip />


      

      {/* Limit banner */}
      {plan==='free' && userInfo && userInfo.screeningsToday >= userInfo.limits?.screeningsPerDay && (
        <div style={{ background:'var(--gold-bg)', borderBottom:'1px solid var(--gold)', padding:'8px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:12, color:'var(--gold)', fontWeight:500 }}>Daily screening limit reached.</span>
          <button onClick={()=>handleUpgrade()} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'4px 12px', fontSize:12, fontWeight:600, borderRadius:3, cursor:'pointer', fontFamily:'var(--font)' }}>Upgrade to Pro</button>
        </div>
      )}

      {/* Main content — full width, no max-width cap on outer, padding on inner */}
      <div style={{ padding:'20px 24px' }} onClick={()=>setShowAccount(false)}>
        {section==='home' ? (
          <HomePage />
        ) : section==='news' ? (
          <NewsTab initialTab={tab || 'All Markets'} />
        ) : section==='markets' ? (
          <MarketsLayout
            tab={tab}
            setTab={setTab}
            plan={plan}
            onUpgrade={()=>handleUpgrade()}
            currentUserId={session?.user?.id}
          />
        ) : section==='community' ? (
          <CommunityLayout tab={tab} setTab={setTab} currentUserId={session?.user?.id} />
        ) : (
          <>
            {/* Commodities tabs */}
            {tab==='Screener' && <ScreenerBuilder user={userInfo} />}
            {tab==='Watchlist'      && <WatchlistTab plan={plan} onUpgrade={()=>handleUpgrade()} />}
            {tab==='Seasonal'       && <SeasonalTab />}
            {tab==='COT Index'      && <COTIndexTab />}
            {tab==='Positions'      && <PositionsTab />}
            {tab==='Journal'        && <JournalTab />}
            {tab==='Ideas'          && <IdeasTab />}
            {tab==='Economic Calendar'       && <CalendarTab />}
            {tab==='Analytics'      && <AnalyticsTab />}
            {tab==='Alerts'         && <AlertsTab plan={plan} onUpgrade={()=>handleUpgrade()} />}
            {tab==='Checklist'      && <ChecklistTab />}
            {/* Tools tabs */}
            {(!tab || tab === 'Tools') && <ToolsLanding onSelect={(t) => setTab(t)} />}
            {tab==='Trade Calc'     && <TradeCalcTab />}
            {tab==='AI Coach'           && <AICoachTab />}
            {tab==='Trade Plan Builder'  && <TradePlanTab />}
            {tab==='COT Alerts'           && <COTAlertsTab />}
            {tab==='Backtesting'          && <BacktestTab />}
            {tab==='Strategy Backtest'    && <StrategyBacktestTab />}
            {tab==='Weekly Review'  && <WeeklyReviewTab />}
            {tab==='Notes'          && <NotesTab />}
            {tab==='Reference'      && <ReferenceTab />}
            {tab==='Community'      && <CommunityTab />}
            {tab==='Settings'       && <ThemeSettings />}
            {tab==='Creator Studio'  && <CreatorDashboard currentUserId={session?.user?.id} />}
            {tab==='Broker'           && <BrokerIntegrationTab />}
            {tab==='Broker' && <BrokerTab />}
            {tab==='My Profile'       && <ProfileTab user={userInfo} session={session} />}
            {tab==='Personal Calendar' && <PersonalCalendarTab />}
            {/* Forex tabs */}
            {section==='forex' && tab==='Overview'          && <ForexOverviewTab />}
            {section==='forex' && tab==='COT Data'          && <ForexCOTTab />}
            {section==='forex' && tab==='Key Levels'        && <ForexKeyLevelsTab />}
            {section==='forex' && tab==='Economic Calendar' && <CalendarTab />}
            {/* Stocks tabs */}
            {section==='stocks' && tab==='Overview'  && <StocksOverviewTab />}
            {section==='stocks' && tab==='Sectors'   && <StocksSectorsTab />}
            {section==='stocks' && tab==='Earnings'  && <StocksEarningsTab />}
            {section==='stocks' && tab==='Key Levels'&& <StocksKeyLevelsTab />}
          </>
        )}
      </div>
      {showUpgrade && <UpgradeModal onClose={()=>setShowUpgrade(false)} currentPlan={plan} feature={upgradeFeature} />}
    </div>
  )
}

function ComingSoonTab({ section, tab }) {
  return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <div style={{ fontSize:48, marginBottom:16 }}>🚧</div>
      <h2 style={{ fontSize:20, fontWeight:600, color:'var(--text)', marginBottom:8 }}>{tab} — Coming Soon</h2>
      <p style={{ fontSize:14, color:'var(--text-muted)', maxWidth:400, margin:'0 auto' }}>
        The {section.charAt(0).toUpperCase()+section.slice(1)} {tab} section is currently being built. Check back soon.
      </p>
    </div>
  )
}


function PersonalCalendarTab() {
  const today = new Date()
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [notes, setNotes] = useState({})
  const [selectedDay, setSelectedDay] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  // Load notes from DB
  useEffect(() => {
    fetch('/api/calendar-notes').then(r=>r.json()).then(data => {
      if (data && !data.error) {
        const map = {}
        ;(data.notes||[]).forEach(n => { map[n.date] = n.content })
        setNotes(map)
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  const saveNote = async (dateKey, text) => {
    setSaving(true)
    const updated = { ...notes, [dateKey]: text }
    if (!text.trim()) delete updated[dateKey]
    setNotes(updated)
    try {
      await fetch('/api/calendar-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateKey, content: text })
      })
    } catch {}
    setSaving(false)
  }

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay()

  const { year, month } = viewDate
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  const prevMonth = () => setViewDate(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 })
  const nextMonth = () => setViewDate(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 })
  const goToday = () => { setViewDate({ year: today.getFullYear(), month: today.getMonth() }); setSelectedDay(null) }

  const handleDayClick = (day) => {
    const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    setSelectedDay(dateKey)
    setNoteText(notes[dateKey] || '')
  }

  const handleSave = () => {
    if (selectedDay) saveNote(selectedDay, noteText)
  }

  const formatSelected = (dateKey) => {
    if (!dateKey) return ''
    const [y, m, d] = dateKey.split('-')
    return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
  }

  const isToday = (day) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:28, fontWeight:400, margin:0, display:'flex', alignItems:'center', gap:8 }}>
          Personal <span style={{ color:C.gold }}>Calendar</span>
          <InfoTooltip text="Your personal trading calendar. Click any day to add notes — trade plans, reminders, important dates, or anything you want to remember. Notes are saved to your account." />
        </h2>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={goToday} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>Today</button>
          <button onClick={prevMonth} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:14, cursor:'pointer' }}>‹</button>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <select value={month} onChange={e=>setViewDate(v=>({...v,month:+e.target.value}))} style={{ background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, cursor:'pointer' }}>
              {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e=>setViewDate(v=>({...v,year:+e.target.value}))} style={{ background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, cursor:'pointer' }}>
              {Array.from({length:10},(_,i)=>today.getFullYear()-5+i).map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={nextMonth} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:14, cursor:'pointer' }}>›</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selectedDay ? '1fr 320px' : '1fr', gap:20, alignItems:'start' }}>
        {/* Calendar Grid */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
          {/* Month header */}
          <div style={{ padding:'14px 20px', borderBottom:`1px solid ${C.border}`, textAlign:'center' }}>
            <span style={{ fontSize:16, fontWeight:600, color:C.text }}>{MONTHS[month]} {year}</span>
          </div>
          {/* Day headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', borderBottom:`1px solid ${C.border}` }}>
            {DAYS.map(d => <div key={d} style={{ padding:'10px 0', textAlign:'center', fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{d}</div>)}
          </div>
          {/* Day cells */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)' }}>
            {Array.from({length:totalCells},(_,i) => {
              const day = i - firstDay + 1
              const isValid = day >= 1 && day <= daysInMonth
              const dateKey = isValid ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : null
              const hasNote = dateKey && !!notes[dateKey]
              const isSel = dateKey === selectedDay
              const isTod = isValid && isToday(day)
              const isWeekend = i % 7 === 0 || i % 7 === 6
              return (
                <div key={i} onClick={() => isValid && handleDayClick(day)}
                  style={{ minHeight:80, padding:'8px 10px', borderBottom:`1px solid ${C.border}`, borderRight: i%7<6 ? `1px solid ${C.border}` : 'none', cursor:isValid?'pointer':'default', background: isSel ? C.accentLight||'var(--accent-light)' : isWeekend && isValid ? C.surface2 : C.surface, transition:'background 0.1s', position:'relative' }}>
                  {isValid && (
                    <>
                      <div style={{ width:26, height:26, borderRadius:'50%', background:isTod?C.accent:'transparent', color:isTod?'#fff':isWeekend?C.muted:C.text, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:isTod?700:400, marginBottom:4 }}>{day}</div>
                      {hasNote && (
                        <div style={{ fontSize:11, color:C.muted, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:1.4 }}>
                          {notes[dateKey]}
                        </div>
                      )}
                      {hasNote && <div style={{ position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:C.accent }} />}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Day Note Panel */}
        {selectedDay && (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden', position:'sticky', top:80 }}>
            <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{formatSelected(selectedDay)}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Click a day to view or edit notes</div>
              </div>
              <button onClick={() => setSelectedDay(null)} style={{ background:'transparent', border:'none', color:C.dim, fontSize:18, cursor:'pointer', padding:'0 4px' }}>×</button>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder={"Add notes for this day...\n\nIdeas: Trade plan, upcoming events, reminders, post-trade review..."}
                style={{ width:'100%', minHeight:200, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:'var(--radius-sm)', padding:'12px', fontSize:13, color:C.text, fontFamily:C.font, resize:'vertical', outline:'none', lineHeight:1.6 }}
              />
              <div style={{ display:'flex', gap:8, marginTop:10 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex:1, background:C.accent, color:'#fff', border:'none', padding:'9px 0', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:C.font, opacity:saving?0.7:1 }}>
                  {saving ? 'Saving...' : 'Save Note'}
                </button>
                {notes[selectedDay] && (
                  <button onClick={() => { setNoteText(''); saveNote(selectedDay, '') }} style={{ background:C.surface2, color:C.red, border:`1px solid ${C.border}`, padding:'9px 14px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>
                    Clear
                  </button>
                )}
              </div>
              {notes[selectedDay] && noteText === notes[selectedDay] && (
                <p style={{ fontSize:11, color:C.muted, margin:'8px 0 0', textAlign:'center' }}>✓ Saved</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


function ScreenerTab({ plan, onUpgrade }) {
  const [commodity, setCommodity] = useState('')
  const [phase, setPhase] = useState('idle')
  const [marketData, setMarketData] = useState(null)
  const [cotIdx, setCotIdx] = useState(null)
  const [seasonal, setSeasonal] = useState(null)
  const [dataError, setDataError] = useState(null)
  const [limitError, setLimitError] = useState(null)
  const [curStage, setCurStage] = useState(0)
  const [results, setResults] = useState([])
  const [direction, setDirection] = useState(null)
  const [finished, setFinished] = useState(false)
  const [failed, setFailed] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const runStage = async (idx, prev, dir, liveData, cotData, seasData) => {
    const stage = STAGES[idx]
    setCurStage(idx)
    const ctx = liveData ? { ...liveData, cotIndexData: cotData || cotIdx, seasonalInfo: seasData || seasonal } : null
    const res = await fetch('/api/screen', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt: stage.question(commodity), marketContext: ctx, isFirstStage: idx===0 }) })
    if (res.status === 429) { const d=await res.json(); setLimitError(d.error); setPhase('done'); setFinished(true); return }
    const data = await res.json()
    const text = data.text || ''
    const upper = text.toUpperCase()
    let pass = null, det = dir
    if (stage.id==='intermarket'||stage.id==='cot') { det = upper.includes('BUYING')?'BUY':upper.includes('SELLING')?'SELL':dir; pass=true }
    else if (stage.passCondition==='YES') pass = upper.startsWith('YES')
    else pass = true
    const nr = [...prev, { stage, text, pass, direction: det }]
    setResults(nr); setDirection(det)
    if (!pass && stage.failAction) { setFailed({ stage, failAction: stage.failAction }); setFinished(true); setPhase('done'); return }
    if (idx+1 < STAGES.length) await runStage(idx+1, nr, det, liveData, cotData, seasData)
    else { setFinished(true); setPhase('done') }
  }

  const handleStart = async () => {
    if (!commodity.trim()) return
    setPhase('fetching'); setResults([]); setDirection(null); setFinished(false)
    setFailed(null); setDataError(null); setLimitError(null); setMarketData(null)
    setCotIdx(null); setSeasonal(null); setSaved(false)
    let liveData = null
    try {
      const md = await fetch('/api/marketdata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commodity:commodity.trim()})}).then(r=>r.json())
      if (!md.error) {
        liveData = md; setMarketData(md)
        const [cotRes, seasRes] = await Promise.allSettled([
          fetch('/api/cotindex',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cotKeyword:md.cotKeyword})}).then(r=>r.json()),
          fetch('/api/seasonal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:md.priceSymbol})}).then(r=>r.json()),
        ])
        const cotData = cotRes.status==='fulfilled'&&!cotRes.value.error ? cotRes.value : null
        const seasData = seasRes.status==='fulfilled'&&!seasRes.value.error ? seasRes.value : null
        if (cotData) setCotIdx(cotData)
        if (seasData) setSeasonal(seasData)
        // Pass directly to avoid React state async delay
        liveData = { ...liveData, _cotData: cotData, _seasData: seasData }
      } else { setDataError(md.error); liveData=null }
    } catch { setDataError('Could not fetch live data') }
    setPhase('running')
    await runStage(0, [], null, liveData, liveData?._cotData, liveData?._seasData)
  }

  const handleSave = async () => {
    setSaving(true)
    const finalDir = results.find(r=>r.direction)?.direction || direction
    await fetch('/api/screenings',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      commodity, direction:finalDir, passed:!failed,
      stagesFailed:failed?.stage?.title||null, stagesCompleted:results.length,
      price:marketData?.price?.latest, marketData:marketData||{},
      results:results.map(r=>({stage:r.stage.id,pass:r.pass,text:r.text}))
    })})
    setSaved(true); setSaving(false)
  }

  const handleReset = () => {
    setCommodity(''); setPhase('idle'); setResults([]); setDirection(null)
    setFinished(false); setFailed(null); setDataError(null); setLimitError(null)
    setMarketData(null); setCotIdx(null); setSeasonal(null); setSaved(false)
  }

  const finalDir = results.find(r=>r.direction)?.direction || direction

  if (phase==='idle') return (
    <div>
      <h1 style={{ fontSize:'clamp(28px,5vw,48px)',fontWeight:400,letterSpacing:'-1px',lineHeight:1.1,marginBottom:8 }}>Market<br /><span style={{ color:C.gold }}>Screening</span><br />Protocol</h1>
      <p style={{ color:C.muted,fontSize:13,marginBottom:36 }}>Live COT · Price · USDX · Rates · Seasonal — nine-stage analysis</p>
      <Label>COMMODITY / ASSET</Label>
      <input value={commodity} onChange={e=>setCommodity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleStart()} placeholder="Gold, Crude Oil, Corn, Natural Gas..." list="clist"
        style={{ width:'100%',background:'transparent',border:'none',borderBottom:`1px solid ${C.border2}`,padding:'12px 0',fontSize:22,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box',marginBottom:28 }} />
      <datalist id="clist">{COMMODITIES.map(c=><option key={c} value={c} />)}</datalist>
      <button onClick={handleStart} disabled={!commodity.trim()} style={{ background:commodity.trim()?C.gold:'#222',color:commodity.trim()?'#0a0a0a':C.dim,border:'none',padding:'13px 38px',fontSize:11,letterSpacing:3,textTransform:'uppercase',cursor:commodity.trim()?'pointer':'not-allowed',fontFamily:C.font }}>Run Screening →</button>
      <div style={{ marginTop:24,display:'flex',gap:10,flexWrap:'wrap' }}>
        {['Yahoo Finance · Prices','CFTC · COT & OI','USDX · Dollar','10Y · Rates','15yr · Seasonal'].map(s=>(
          <span key={s} style={{ fontSize:10,color:C.green,border:`1px solid ${C.greenBorder}`,padding:'4px 10px' }}>⬤ {s}</span>
        ))}
      </div>
      {plan==='free' && <div style={{ marginTop:24,background:'#0d0a04',border:'1px solid #3d2a10',padding:'14px 18px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}><span style={{ fontSize:12,color:C.gold }}>Free plan: 3 screenings/day</span><button onClick={onUpgrade} style={{ background:'transparent',border:`1px solid ${C.gold}`,color:C.gold,padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>UPGRADE FOR UNLIMITED</button></div>}
      <div style={{ marginTop:36 }}><Label>9 STAGES</Label>{STAGES.map((st,i)=><div key={st.id} style={{ display:'flex',gap:16,padding:'9px 0',borderBottom:'1px solid #111' }}><span style={{ fontSize:10,color:C.dim,width:20 }}>{i+1}</span><span style={{ fontSize:12,color:C.muted }}>{st.title}</span></div>)}</div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <span style={{ fontSize:11,letterSpacing:4,color:C.gold,textTransform:'uppercase' }}>Screening</span>
        <span style={{ fontSize:24 }}>{commodity}</span>
        {phase==='fetching' && <span style={{ fontSize:10,color:C.gold }}>Fetching live data...</span>}
        {marketData && <span style={{ fontSize:10,color:C.green }}>⬤ LIVE</span>}
        {dataError && <span style={{ fontSize:10,color:'#e0a040' }}>⚠ {dataError}</span>}
        <button onClick={handleReset} style={{ marginLeft:'auto',background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'4px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:2 }}>RESET</button>
      </div>
      {limitError && <div style={{ background:C.redBg,border:`1px solid ${C.redBorder}`,padding:'20px 24px',marginBottom:20 }}><p style={{ color:C.red,fontSize:14,margin:'0 0 12px' }}>{limitError}</p><button onClick={onUpgrade} style={{ background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:11,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>UPGRADE TO PRO →</button></div>}
      {marketData && (
        <Card style={{ marginBottom:20 }}>
          <Label>LIVE MARKET DATA</Label>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:20 }}>
            {marketData.price && <DataBlock label={`PRICE · ${marketData.ticker}`} value={marketData.price.latest} sub1={`13w: ${marketData.price.pct13w}% · ${marketData.price.trendDirection}`} sub2={`H: ${marketData.price.high52w} / L: ${marketData.price.low52w}`} color1={parseFloat(marketData.price.pct13w)>=0?C.green:C.red} />}
            {marketData.usdx && <DataBlock label="USDX" value={marketData.usdx.latest} sub1={`${marketData.usdx.direction} · 13w: ${marketData.usdx.pct13w}%`} sub2={marketData.usdx.bearishForCommodities?'✓ Commodity tailwind':'✗ Commodity headwind'} color1={marketData.usdx.bearishForCommodities?C.green:C.red} />}
            {marketData.rates && <DataBlock label="10Y TREASURY" value={`${marketData.rates.latest}%`} sub1={`${marketData.rates.direction} · 13w: ${marketData.rates.pct13w}%`} />}
            {marketData.cot && <DataBlock label={`COT · ${marketData.cot.reportDate}`} value={marketData.cot.commercialBias} sub1={`Net: ${marketData.cot.netCommercial.toLocaleString()}`} sub2={`OI: ${marketData.cot.openInterest.toLocaleString()} (${marketData.cot.openInterestChange}% wk)`} color1={marketData.cot.netCommercial>0?C.green:C.red} valueSmall />}
            {cotIdx && <DataBlock label="COT INDEX (3yr)" value={`${cotIdx.cotIndex} / 100`} sub1={cotIdx.interpretation} color1={cotIdx.cotIndex>=60?C.green:cotIdx.cotIndex<=40?C.red:C.gold} />}
            {seasonal && <DataBlock label={`SEASONAL (${seasonal.currentMonthName})`} value={`${seasonal.currentBias?.avgReturn>0?'+':''}${seasonal.currentBias?.avgReturn}%`} sub1={`Win rate: ${seasonal.currentBias?.winRate}%`} color1={seasonal.currentBias?.avgReturn>0?C.green:C.red} />}
          </div>
        </Card>
      )}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}><Label style={{ margin:0 }}>PROGRESS</Label><span style={{ fontSize:10,color:C.dim }}>{results.length} / {STAGES.length}</span></div>
        <div style={{ height:2,background:C.surface2 }}><div style={{ height:'100%',background:failed?'#8b2020':C.gold,width:`${(results.length/STAGES.length)*100}%`,transition:'width 0.4s' }} /></div>
      </div>
      <div style={{ display:'grid',gap:2,marginBottom:20 }}>
        {results.map(r=>(
          <div key={r.stage.id} style={{ background:r.pass?C.surface:'#110808',border:`1px solid ${r.pass?C.border2:'#2a1010'}`,padding:'16px 20px' }}>
            <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10,flexWrap:'wrap' }}>
              <Badge color={r.pass?C.gold:'#8b2020'}>{r.pass?'PASS':'FAIL'}</Badge>
              <span style={{ fontSize:10,color:C.muted,letterSpacing:2 }}>{r.stage.label}</span>
              <span style={{ fontSize:13,color:C.muted }}>{r.stage.title}</span>
              {(r.stage.id==='intermarket'||r.stage.id==='cot')&&r.direction&&<span style={{ marginLeft:'auto',fontSize:10,color:r.direction==='BUY'?C.green:C.red,border:`1px solid ${r.direction==='BUY'?C.greenBorder:C.redBorder}`,padding:'2px 8px',letterSpacing:2 }}>{r.direction}</span>}
            </div>
            <p style={{ fontSize:13,lineHeight:1.7,color:C.muted,margin:0 }}>{r.text}</p>
          </div>
        ))}
        {phase==='running'&&!finished&&<div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'16px 20px',display:'flex',gap:16,alignItems:'center' }}><span style={{ fontSize:10,color:C.muted,letterSpacing:2 }}>{STAGES[curStage]?.label}</span><span style={{ fontSize:13,color:C.muted }}>{STAGES[curStage]?.title}</span><span style={{ marginLeft:'auto',fontSize:11,color:C.gold }}>Analyzing live data...</span></div>}
      </div>
      {finished&&!limitError&&(
        <div style={{ padding:32,background:failed?C.redBg:finalDir==='BUY'?C.greenBg:C.redBg,border:`1px solid ${failed?C.redBorder:finalDir==='BUY'?C.greenBorder:C.redBorder}`,marginBottom:20 }}>
          {failed?(<><p style={{ fontSize:10,letterSpacing:3,color:'#8b2020',marginBottom:12 }}>SCREENING TERMINATED</p><p style={{ fontSize:14,color:'#cc4444',marginBottom:8 }}>Failed at {failed.stage.title}</p><p style={{ fontSize:12,color:C.muted,margin:0 }}>{failed.failAction}</p></>)
          :(<><p style={{ fontSize:10,letterSpacing:3,color:finalDir==='BUY'?C.green:C.red,marginBottom:16 }}>ALL {results.length} STAGES PASSED</p><div style={{ display:'flex',alignItems:'center',gap:24,flexWrap:'wrap' }}><span style={{ fontSize:36,fontWeight:300 }}>{commodity}</span><span style={{ fontSize:28,color:finalDir==='BUY'?C.green:C.red,letterSpacing:4 }}>{finalDir}</span></div><p style={{ fontSize:12,color:C.muted,margin:'16px 0 0' }}>Proceed to top-down analysis and trade execution</p></>)}
        </div>
      )}
      {finished&&!limitError&&(
        <div style={{ display:'flex',gap:12,flexWrap:'wrap' }}>
          <button onClick={handleReset} style={{ background:'transparent',color:C.muted,border:`1px solid ${C.border2}`,padding:'11px 24px',fontSize:10,letterSpacing:3,textTransform:'uppercase',cursor:'pointer',fontFamily:C.font }}>← Screen Another</button>
          {!saved?<button onClick={handleSave} disabled={saving} style={{ background:saving?'#222':C.gold,color:saving?C.dim:'#0a0a0a',border:'none',padding:'11px 24px',fontSize:10,letterSpacing:3,textTransform:'uppercase',cursor:saving?'not-allowed':'pointer',fontFamily:C.font }}>{saving?'Saving...':'Save to Journal'}</button>:<span style={{ fontSize:11,color:C.green,alignSelf:'center' }}>✓ Saved to Journal</span>}
        </div>
      )}
    </div>
  )
}

function WatchlistTab({ plan, onUpgrade }) {
  const [list, setList] = useState([])
  const [input, setInput] = useState('')
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  useEffect(() => { fetch('/api/watchlist').then(r=>r.json()).then(d=>{if(Array.isArray(d))setList(d)}) }, [])
  if (plan==='free') return <UpgradeGate feature="Watchlist Scanner" onUpgrade={onUpgrade} />
  const addItem = async () => { if(!input.trim()||list.includes(input.trim()))return; const it=input.trim();setInput(''); await fetch('/api/watchlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commodity:it})}); setList(l=>[...l,it]) }
  const removeItem = async (c) => { await fetch('/api/watchlist',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({commodity:c})}); setList(l=>l.filter(x=>x!==c)) }
  const runAll = async () => {
    setRunning(true);setResults({});setProgress(0)
    const nr={}
    for(let i=0;i<list.length;i++){
      const c=list[i]
      try{
        const md=await fetch('/api/marketdata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({commodity:c})}).then(r=>r.json())
        if(md.error){nr[c]={error:md.error};continue}
        const [cotR,seasR]=await Promise.allSettled([fetch('/api/cotindex',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cotKeyword:md.cotKeyword})}).then(r=>r.json()),fetch('/api/seasonal',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({symbol:md.priceSymbol})}).then(r=>r.json())])
        const cot=cotR.status==='fulfilled'&&!cotR.value.error?cotR.value:null
        const seas=seasR.status==='fulfilled'&&!seasR.value.error?seasR.value:null
        let score=0,signals=[]
        if(md.price?.trendDirection==='UP'){score++;signals.push('↑ Trending Up')}
        if(md.usdx?.bearishForCommodities){score++;signals.push('↑ Weak USD')}
        if(md.cot?.netCommercial>0){score++;signals.push('↑ Commercials Long')}
        if(cot?.cotIndex>=60){score++;signals.push(`↑ COT Index ${cot.cotIndex}`)}
        if(seas?.currentBias?.avgReturn>0){score++;signals.push(`↑ Seasonal +${seas.currentBias.avgReturn}%`)}
        if(md.cot?.oiDropped15){score++;signals.push('↑ OI Dropped')}
        nr[c]={score,signals,md}
      }catch{nr[c]={error:'Fetch failed'}}
      setProgress(i+1);setResults({...nr})
    }
    setRunning(false)
  }
  const sorted=Object.entries(results).sort((a,b)=>(b[1].score||0)-(a[1].score||0))
  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Watchlist <span style={{ color:C.gold }}>Screener</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>Screen multiple commodities and rank by signal strength</p>
      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="Add commodity..." list="wlist" style={{ flex:1,minWidth:160,background:'transparent',border:'none',borderBottom:`1px solid ${C.border2}`,padding:'8px 0',fontSize:16,color:C.text,outline:'none',fontFamily:C.font }} />
        <datalist id="wlist">{COMMODITIES.map(c=><option key={c} value={c} />)}</datalist>
        <button onClick={addItem} style={{ background:C.border2,color:C.muted,border:'none',padding:'8px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>ADD</button>
        <button onClick={runAll} disabled={running||!list.length} style={{ background:running?'#222':C.gold,color:running?C.dim:'#0a0a0a',border:'none',padding:'8px 22px',fontSize:10,letterSpacing:2,cursor:running?'not-allowed':'pointer',fontFamily:C.font }}>{running?`SCANNING ${progress}/${list.length}...`:'SCAN ALL →'}</button>
      </div>
      <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:24 }}>
        {list.map(c=><div key={c} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'6px 14px',display:'flex',alignItems:'center',gap:10 }}><span style={{ fontSize:12 }}>{c}</span><button onClick={()=>removeItem(c)} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:14,padding:0,lineHeight:1 }}>×</button></div>)}
        {list.length===0&&<span style={{ fontSize:12,color:C.muted }}>Add commodities above to get started</span>}
      </div>
      {sorted.length>0&&<><Label>RANKED BY SIGNAL STRENGTH</Label><div style={{ display:'grid',gap:2 }}>{sorted.map(([name,r],i)=><div key={name} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'16px 20px' }}>{r.error?<div style={{ display:'flex',alignItems:'center',gap:12 }}><span style={{ fontSize:14 }}>{name}</span><span style={{ fontSize:11,color:C.red,marginLeft:'auto' }}>{r.error}</span></div>:<><div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:8,flexWrap:'wrap' }}><span style={{ fontSize:10,color:C.gold,width:24 }}>#{i+1}</span><span style={{ fontSize:16 }}>{name}</span><span style={{ fontSize:24,fontWeight:300,color:r.score>=5?C.green:r.score>=3?C.gold:C.red,marginLeft:8 }}>{r.score}/6</span>{r.md?.price&&<span style={{ marginLeft:'auto',fontSize:13,color:C.dim }}>{r.md.price.latest}</span>}<span style={{ fontSize:12,color:parseFloat(r.md?.price?.pct13w)>=0?C.green:C.red }}>{r.md?.price?.pct13w}% 13w</span></div><div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>{r.signals.map(s=><span key={s} style={{ fontSize:10,color:C.green,border:`1px solid ${C.greenBorder}`,padding:'2px 8px' }}>{s}</span>)}</div></>}</div>)}</div></>}
    </div>
  )
}

function SeasonalTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [commodity, setCommodity] = useState('')
  const [error, setError] = useState('')

  const fetch_data = async () => {
    if (!commodity.trim()) return
    setLoading(true); setError(''); setData(null)
    try {
      const res = await fetch('/api/seasonal?commodity=' + encodeURIComponent(commodity))
      const json = await res.json()
      if (json.error) setError(json.error)
      else setData(json)
    } catch { setError('Failed to fetch seasonal data') }
    setLoading(false)
  }

  const maxAbs = data ? Math.max(...(data.seasonal||[]).map(function(m){return Math.abs(m.avgReturn)}), 0.1) : 1

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8,display:"flex",alignItems:"center",gap:8 }}>Seasonal <span style={{ color:C.gold }}>Analysis</span><InfoTooltip text="Seasonal analysis looks at 15 years of historical price data to find consistent monthly patterns. If Gold tends to rise in September 80% of years, that's a strong seasonal signal. It doesn't predict the future but highlights historically favorable periods." /></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>15-year average monthly returns and win rates for any commodity.</p>
      <div style={{ display:'flex',gap:10,marginBottom:24,flexWrap:'wrap' }}>
        <input value={commodity} onChange={function(e){setCommodity(e.target.value)}} onKeyDown={function(e){if(e.key==='Enter')fetch_data()}}
          placeholder="Enter commodity (e.g. Gold, Corn, Crude Oil)..."
          style={{ flex:1,minWidth:200,background:'transparent',border:'1px solid '+C.border2,padding:'10px 14px',fontSize:14,color:C.text,outline:'none',fontFamily:C.font }} />
        <button onClick={fetch_data} disabled={!commodity.trim()||loading}
          style={{ background:C.gold,color:C.surface,border:'none',padding:'10px 26px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>
          {loading?'LOADING...':'ANALYZE'}
        </button>
      </div>
      {error && <p style={{ color:C.red,fontSize:13 }}>{error}</p>}
      {data && (
        <div>
          <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
            <Card style={{ flex:1,minWidth:150 }}><Label style={{display:'flex',alignItems:'center'}}>BEST MONTHS<InfoTooltip text="The 3 months with the highest average historical return for this commodity over the past 15 years." /></Label><p style={{ fontSize:15,color:C.green,margin:0 }}>{data.bestMonths ? data.bestMonths.join(' · ') : ''}</p></Card>
            <Card style={{ flex:1,minWidth:150 }}><Label style={{display:'flex',alignItems:'center'}}>WORST MONTHS<InfoTooltip text="The 3 months with the lowest average historical return. These are periods where the commodity has historically struggled most." /></Label><p style={{ fontSize:15,color:C.red,margin:0 }}>{data.worstMonths ? data.worstMonths.join(' · ') : ''}</p></Card>
            <Card style={{ flex:1,minWidth:190 }}><Label>THIS MONTH ({data.currentMonthName})</Label>
              <p style={{ fontSize:15,color:data.currentBias && data.currentBias.avgReturn>0?C.green:C.red,margin:0 }}>
                {data.currentBias ? (data.currentBias.avgReturn>0?'+':'') + data.currentBias.avgReturn + '% avg' : 'N/A'}
              </p>
            </Card>
          </div>
          <Label>AVERAGE MONTHLY RETURN</Label>
          <div style={{ display:'grid',gap:3 }}>
            {(data.seasonal||[]).map(function(m,i) {
              var isCur = i === new Date().getMonth()
              var bw = Math.abs(m.avgReturn)/maxAbs*55
              var isPos = m.avgReturn >= 0
              return (
                <div key={m.month} style={{ display:'flex',alignItems:'center',gap:10,padding:'5px 0',background:isCur?'#111':'transparent' }}>
                  <span style={{ fontSize:11,color:isCur?C.gold:C.muted,width:30,textAlign:'right',flexShrink:0 }}>{m.month}</span>
                  <div style={{ flex:1,display:'flex',alignItems:'center' }}>
                    <div style={{ width:'50%',display:'flex',justifyContent:isPos?'flex-end':'flex-start' }}>
                      <div style={{ width:bw+'%',height:15,background:isPos?C.green:C.red,opacity:0.7 }} />
                    </div>
                    <div style={{ width:'50%' }} />
                  </div>
                  <span style={{ fontSize:11,color:isPos?C.green:C.red,width:50,flexShrink:0 }}>{isPos?'+':''}{m.avgReturn}%</span>
                  <span style={{ fontSize:10,color:C.dim,width:40,flexShrink:0 }} title="Win Rate: percentage of years this month had a positive return">{m.winRate}% W</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}


function COTIndexTab() {
  const [commodity, setCommodity] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const CM = { gold:'GOLD',silver:'SILVER',copper:'COPPER',platinum:'PLATINUM',palladium:'PALLADIUM','crude oil':'CRUDE OIL',oil:'CRUDE OIL','natural gas':'NATURAL GAS',corn:'CORN',wheat:'WHEAT',soybeans:'SOYBEANS',soybean:'SOYBEANS',coffee:'COFFEE',sugar:'SUGAR',cotton:'COTTON',cocoa:'COCOA',cattle:'CATTLE','live cattle':'CATTLE',hogs:'HOGS','lean hogs':'HOGS',lumber:'LUMBER',gasoline:'GASOLINE','heating oil':'HEATING OIL',rice:'RICE',oats:'OATS' }
  const go = async () => { const kw=CM[commodity.toLowerCase().trim()];if(!kw){setError('Unknown commodity');return};setLoading(true);setError(null);setData(null);try{const res=await fetch('/api/cotindex',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cotKeyword:kw})});const j=await res.json();if(j.error)setError(j.error);else setData(j)}catch{setError('Failed')};setLoading(false) }
  const ic = data?(data.cotIndex>=75?C.green:data.cotIndex>=60?'#8bc34a':data.cotIndex>=40?C.gold:data.cotIndex>=25?'#ff8a65':C.red):C.gold
  const mn = data?Math.min(...data.chartData.map(d=>d.net)):0
  const mx = data?Math.max(...data.chartData.map(d=>d.net)):1
  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8,display:"flex",alignItems:"center",gap:8 }}>COT <span style={{ color:C.gold }}>Index</span><InfoTooltip text="The Commitments of Traders (COT) report is published weekly by the CFTC. It shows how large commercial traders (hedgers like producers and processors) are positioned in futures markets. Extremes in positioning often precede major price reversals." /></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>3-year commercial positioning index from CFTC (0=max bearish, 100=max bullish)</p>
      <div style={{ display:'flex',gap:12,marginBottom:24 }}>
        <input value={commodity} onChange={e=>setCommodity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Gold, Crude Oil, Corn..." list="cotlist" style={{ flex:1,background:'transparent',border:'none',borderBottom:`1px solid ${C.border2}`,padding:'10px 0',fontSize:18,color:C.text,outline:'none',fontFamily:C.font }} />
        <datalist id="cotlist">{COMMODITIES.map(c=><option key={c} value={c} />)}</datalist>
        <button onClick={go} disabled={!commodity.trim()||loading} style={{ background:C.gold,color:C.surface,border:'none',padding:'10px 26px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>{loading?'LOADING...':'FETCH →'}</button>
      </div>
      {error&&<p style={{ color:C.red,fontSize:13 }}>{error}</p>}
      {data&&<>
        <Card style={{ marginBottom:20,textAlign:'center' }}>
          <Label style={{ textAlign:'center' }}>COT INDEX — {commodity.toUpperCase()} ({data.weeksOfData} WEEKS)</Label>
          <div style={{ fontSize:80,fontWeight:300,color:ic,lineHeight:1 }}>{data.cotIndex}</div>
          <div style={{ fontSize:14,color:ic,letterSpacing:3,marginTop:8 }}>{data.interpretation}</div>
          <div style={{ height:8,background:C.surface2,borderRadius:4,margin:'20px 0 8px',position:'relative' }}>
            <div style={{ position:'absolute',left:0,top:0,height:'100%',width:'25%',background:'#3d1a1a',borderRadius:'4px 0 0 4px' }} />
            <div style={{ position:'absolute',left:'75%',top:0,height:'100%',width:'25%',background:'#1a3d2a',borderRadius:'0 4px 4px 0' }} />
            <div style={{ position:'absolute',top:-4,left:`${data.cotIndex}%`,transform:'translateX(-50%)',width:16,height:16,background:ic,borderRadius:'50%' }} />
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:C.dim }}><span>0 — MAX BEARISH</span><span>100 — MAX BULLISH</span></div>
        </Card>
        <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
          <Card style={{ flex:1,minWidth:130 }}><Label style={{display:'flex',alignItems:'center'}}>NET COMMERCIAL<InfoTooltip text="Commercial longs minus commercial shorts. Positive = net long (commercials expect prices to rise). Negative = net short (commercials are hedging against falling prices). Extreme readings signal potential turning points." /></Label><p style={{ fontSize:18,color:data.currentNet>0?C.green:C.red,margin:0 }}>{data.currentNet?.toLocaleString()}</p></Card>
          <Card style={{ flex:1,minWidth:130 }}><Label style={{display:'flex',alignItems:'center'}}>3YR RANGE<InfoTooltip text="The minimum and maximum net commercial position over the past 3 years. The COT Index score shows where the current reading falls within this range — 0 is the most bearish extreme, 100 is the most bullish extreme." /></Label><p style={{ fontSize:13,color:C.text,margin:0 }}>{data.minNet?.toLocaleString()} → {data.maxNet?.toLocaleString()}</p></Card>
          <Card style={{ flex:1,minWidth:130 }}><Label style={{display:'flex',alignItems:'center'}}>OI INDEX<InfoTooltip text="Open Interest Index shows where current open interest stands relative to its 3-year range (0-100). High OI means more contracts outstanding than usual — often signals strong trend. Low OI means market is quiet." /></Label><p style={{ fontSize:18,color:C.gold,margin:0 }}>{data.oiIndex}/100</p></Card>
        </div>
        <Label>NET COMMERCIAL — PAST 52 WEEKS</Label>
        <Card style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex',alignItems:'flex-end',gap:2,height:90 }}>
            {data.chartData.map((d,i)=>{const h=Math.max(3,((d.net-mn)/(mx-mn||1))*85);return<div key={i} title={`${d.date}: ${d.net?.toLocaleString()}`} style={{ flex:1,height:`${h}%`,background:d.net>0?C.green:C.red,opacity:0.7,minWidth:2 }} />})}
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:9,color:C.dim }}><span>{data.chartData[0]?.date}</span><span>{data.chartData[data.chartData.length-1]?.date}</span></div>
        </Card>
      </>}
    </div>
  )
}

function TradeCalcTab() {
  const [form, setForm] = useState({ account:'50000',risk:'1',entry:'',stop:'',contractSize:'100',direction:'BUY' })
  const [result, setResult] = useState(null)
  const set = (k,v) => { setForm(f=>({...f,[k]:v}));setResult(null) }
  const calc = async () => { const res=await fetch('/api/risksize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accountSize:parseFloat(form.account),riskPercent:parseFloat(form.risk),entryPrice:parseFloat(form.entry),stopPrice:parseFloat(form.stop),contractSize:parseFloat(form.contractSize)})}); setResult(await res.json()) }
  const inp = { width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'10px 12px',fontSize:14,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box' }
  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8,display:"flex",alignItems:"center",gap:8 }}>Trade <span style={{ color:C.gold }}>Calculator</span><InfoTooltip text="Position sizing calculator that determines how many contracts to trade based on your account size, risk percentage, entry price, and stop loss. Uses the R-multiple framework where 1R = your risk per trade." /></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>Position sizing, risk, 2R/3R targets</p>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:16,marginBottom:20 }}>
        <div><Label>DIRECTION</Label><div style={{ display:'flex',gap:2 }}>{['BUY','SELL'].map(d=><button key={d} onClick={()=>set('direction',d)} style={{ flex:1,background:form.direction===d?(d==='BUY'?C.green:C.red):C.border2,color:form.direction===d?'#0a0a0a':C.muted,border:'none',padding:10,fontSize:11,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>{d}</button>)}</div></div>
        <div><Label>ACCOUNT SIZE ($)</Label><input value={form.account} onChange={e=>set('account',e.target.value)} style={inp} /></div>
        <div><Label>RISK PER TRADE (%)</Label><input value={form.risk} onChange={e=>set('risk',e.target.value)} style={inp} /></div>
        <div><Label>ENTRY PRICE</Label><input value={form.entry} onChange={e=>set('entry',e.target.value)} placeholder="e.g. 2350.00" style={inp} /></div>
        <div><Label>STOP LOSS</Label><input value={form.stop} onChange={e=>set('stop',e.target.value)} placeholder="e.g. 2300.00" style={inp} /></div>
        <div><Label>CONTRACT SIZE</Label><input value={form.contractSize} onChange={e=>set('contractSize',e.target.value)} placeholder="e.g. 100" style={inp} /></div>
      </div>
      <button onClick={calc} disabled={!form.entry||!form.stop} style={{ background:form.entry&&form.stop?C.gold:'#222',color:form.entry&&form.stop?'#0a0a0a':C.dim,border:'none',padding:'13px 38px',fontSize:11,letterSpacing:3,textTransform:'uppercase',cursor:form.entry&&form.stop?'pointer':'not-allowed',fontFamily:C.font,marginBottom:24 }}>CALCULATE</button>
      {result&&<div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginBottom:32 }}>{[['CONTRACTS',result.contracts,C.gold],['RISK ($)',`$${result.riskPerTrade}`,C.text],['ACTUAL RISK',`$${result.actualRisk}`,C.red],['2R TARGET',result.target2R,form.direction==='BUY'?C.green:C.red],['3R TARGET',result.target3R,form.direction==='BUY'?C.green:C.red]].map(([l,v,c])=><Card key={l}><Label>{l}</Label><p style={{ fontSize:22,color:c,margin:0,fontWeight:300 }}>{v}</p></Card>)}</div>}
      <Label>COMMON CONTRACT SIZES</Label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:5 }}>
        {[['Gold (GC)','100 oz'],['Silver (SI)','5,000 oz'],['Crude Oil (CL)','1,000 bbl'],['Natural Gas (NG)','10,000 MMBtu'],['Corn (ZC)','5,000 bu'],['Wheat (ZW)','5,000 bu'],['Soybeans (ZS)','5,000 bu'],['Coffee (KC)','37,500 lbs']].map(([n,s])=><div key={n} style={{ display:'flex',justifyContent:'space-between',padding:'8px 12px',background:C.surface,border:`1px solid ${C.border}` }}><span style={{ fontSize:11,color:C.muted }}>{n}</span><span style={{ fontSize:11,color:C.text }}>{s}</span></div>)}
      </div>
    </div>
  )
}

function JournalTab() {
  const [journal, setJournal] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [editOutcome, setEditOutcome] = useState('')
  const [filter, setFilter] = useState('all')
  useEffect(() => { fetch('/api/screenings').then(r=>r.json()).then(d=>{if(Array.isArray(d))setJournal(d);setLoading(false)}) }, [])
  const update = async (id,upd) => { await fetch('/api/screenings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,...upd})}); setJournal(j=>j.map(e=>e.id===id?{...e,...upd}:e));setEditId(null) }
  const del = async (id) => { await fetch('/api/screenings',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); setJournal(j=>j.filter(e=>e.id!==id)) }
  const exportCSV = () => { const h='Date,Commodity,Direction,Passed,Stage Failed,Price,Outcome,Notes';const rows=journal.map(e=>`${new Date(e.createdAt).toLocaleDateString()},${e.commodity},${e.direction||''},${e.passed},${e.stageFailed||''},${e.price||''},${e.outcome||''},${(e.notes||'').replace(/,/g,';')}`);const blob=new Blob([[h,...rows].join('\n')],{type:'text/csv'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='journal.csv';a.click() }
  const filtered = journal.filter(e=>filter==='all'||(filter==='pass'&&e.passed)||(filter==='fail'&&!e.passed))
  const wins=journal.filter(e=>e.outcome==='WIN').length, losses=journal.filter(e=>e.outcome==='LOSS').length
  if(loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading...</p>
  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:8,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Trade <span style={{ color:C.gold }}>Journal</span></h2>
        <span style={{ fontSize:11,color:C.muted }}>{journal.length} screenings</span>
        {journal.length>0&&<button onClick={exportCSV} style={{ marginLeft:'auto',background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>EXPORT CSV</button>}
      </div>
      <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>Saved when you click "Save to Journal" after a screening.</p>
      {journal.length>0&&<div style={{ marginBottom:24 }}><Label>ACTIVITY HEATMAP</Label><PnLCalendar screenings={journal} /></div>}
      {journal.length>0&&<div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        {[['ALL','all'],['PASSED','pass'],['FAILED','fail']].map(([l,v])=><button key={v} onClick={()=>setFilter(v)} style={{ background:filter===v?C.gold:'transparent',color:filter===v?'#0a0a0a':C.muted,border:`1px solid ${filter===v?C.gold:C.border2}`,padding:'5px 16px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>{l}</button>)}
        {(wins+losses)>0&&<div style={{ marginLeft:'auto',display:'flex',gap:16 }}><span style={{ fontSize:11,color:C.green }}>W: {wins}</span><span style={{ fontSize:11,color:C.red }}>L: {losses}</span><span style={{ fontSize:11,color:C.gold }}>W%: {Math.round(wins/(wins+losses)*100)}%</span></div>}
      </div>}
      {filtered.length===0&&<Card><p style={{ color:C.muted,fontSize:13,margin:0,textAlign:'center' }}>{journal.length===0?'No entries yet. Run a screening and click "Save to Journal".':'No entries match this filter.'}</p></Card>}
      <div style={{ display:'grid',gap:4 }}>
        {filtered.map(e=>(
          <Card key={e.id}>
            <div style={{ display:'flex',alignItems:'flex-start',gap:12,flexWrap:'wrap' }}>
              <div style={{ flex:1,minWidth:200 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap' }}>
                  <span style={{ fontSize:16 }}>{e.commodity}</span>
                  {e.direction&&<span style={{ fontSize:11,color:e.direction==='BUY'?C.green:C.red,border:`1px solid ${e.direction==='BUY'?C.greenBorder:C.redBorder}`,padding:'2px 8px',letterSpacing:2 }}>{e.direction}</span>}
                  <Badge color={e.passed?C.gold:'#8b2020'}>{e.passed?'PASSED':`FAIL · ${e.stageFailed||''}`}</Badge>
                  {e.outcome&&<Badge color={e.outcome==='WIN'?C.green:e.outcome==='LOSS'?C.red:'#555'}>{e.outcome}</Badge>}
                  <span style={{ fontSize:10,color:C.dim,marginLeft:'auto' }}>{new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display:'flex',gap:16,fontSize:11,color:C.muted,marginBottom:8 }}><span>Price: {e.price||'—'}</span><span>Stages: {e.stagesCompleted}/9</span></div>
                {editId===e.id?(
                  <div style={{ display:'grid',gap:10 }}>
                    <textarea value={editNotes} onChange={ev=>setEditNotes(ev.target.value)} placeholder="Add notes..." style={{ width:'100%',background:C.surface2,border:`1px solid ${C.border2}`,color:C.text,padding:10,fontSize:12,fontFamily:C.font,resize:'vertical',minHeight:60,boxSizing:'border-box' }} />
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                      {['WIN','LOSS','PENDING'].map(o=><button key={o} onClick={()=>setEditOutcome(o)} style={{ background:editOutcome===o?(o==='WIN'?C.green:o==='LOSS'?C.red:C.gold):'transparent',color:editOutcome===o?'#0a0a0a':C.muted,border:`1px solid ${C.border2}`,padding:'5px 12px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{o}</button>)}
                      <button onClick={()=>update(e.id,{notes:editNotes,outcome:editOutcome})} style={{ background:C.gold,color:C.surface,border:'none',padding:'5px 16px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font,marginLeft:'auto' }}>SAVE</button>
                      <button onClick={()=>setEditId(null)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>CANCEL</button>
                    </div>
                  </div>
                ):e.notes&&<p style={{ fontSize:12,color:C.muted,margin:0,lineHeight:1.6 }}>{e.notes}</p>}
              </div>
              {editId!==e.id&&<div style={{ display:'flex',gap:8,flexShrink:0 }}>
                <button onClick={()=>{setEditId(e.id);setEditNotes(e.notes||'');setEditOutcome(e.outcome||'')}} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>EDIT</button>
                <button onClick={()=>del(e.id)} style={{ background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>DEL</button>
              </div>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Positions Tab ────────────────────────────────────────────────────────────
function CloseModal({ position, onClose, onConfirm }) {
  const [exitPrice, setExitPrice] = useState('')
  const [err, setErr] = useState('')
  const diff = exitPrice ? (parseFloat(exitPrice) - position.entryPrice) * (position.direction==='LONG'?1:-1) * position.contracts * (position.contractSize||1) : null
  const submit = () => {
    const p = parseFloat(exitPrice)
    if (isNaN(p)||p<=0) { setErr('Enter a valid exit price'); return }
    onConfirm(position.id, p); onClose()
  }
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <p style={{fontSize:15,color:C.text,margin:0}}>Close {position.name||position.symbol}</p>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:20,padding:0}}>×</button>
      </div>
      <div style={{marginBottom:12}}>
        <p style={{fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 4px'}}>ENTRY PRICE</p>
        <p style={{fontSize:18,color:C.text,margin:0,fontFamily:C.font}}>{position.entryPrice}</p>
      </div>
      <div style={{marginBottom:12}}>
        <p style={{fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px'}}>EXIT PRICE</p>
        <input autoFocus value={exitPrice} onChange={e=>{setExitPrice(e.target.value);setErr('')}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Enter exit price..." type="number" style={{width:'100%',background:C.bg,border:`1px solid ${C.border2}`,padding:'10px 14px',fontSize:14,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}} />
        {err && <p style={{fontSize:11,color:C.red,margin:'6px 0 0'}}>{err}</p>}
      </div>
      {diff!=null && !isNaN(diff) && (
        <div style={{background:diff>=0?C.greenBg:C.redBg,border:`1px solid ${diff>=0?C.greenBorder:C.redBorder}`,padding:'12px 16px',marginBottom:16}}>
          <p style={{fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 4px'}}>ESTIMATED P&L</p>
          <p style={{fontSize:22,color:diff>=0?C.green:C.red,margin:0,fontWeight:300}}>{diff>=0?'+':''}${diff.toFixed(2)}</p>
        </div>
      )}
      <div style={{display:'flex',gap:10}}>
        <button onClick={submit} style={{flex:1,background:C.gold,color:C.surface,border:'none',padding:'11px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>CLOSE POSITION</button>
        <button onClick={onClose} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'11px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
      </div>
    </div>
  )
}

function PositionsTab() {
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('open')
  const [form, setForm] = useState({ symbol:'',name:'',direction:'LONG',entryPrice:'',stopPrice:'',targetPrice:'',contracts:'1',contractSize:'1',notes:'' })
  const [closingId, setClosingId] = useState(null)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    fetch('/api/positions').then(r=>r.json()).then(d=>{if(Array.isArray(d))setPositions(d);setLoading(false)})
  }, [])

  const addPosition = async () => {
    if (!form.symbol||!form.entryPrice) return
    const res = await fetch('/api/positions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const pos = await res.json()
    setPositions(p=>[pos,...p]); setShowForm(false)
    setForm({symbol:'',name:'',direction:'LONG',entryPrice:'',stopPrice:'',targetPrice:'',contracts:'1',contractSize:'1',notes:''})
  }

  const closePosition = async (id, exitPrice) => {
    const res = await fetch('/api/positions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'closed',exitPrice})})
    const updated = await res.json()
    setPositions(p=>p.map(x=>x.id===id?updated:x))
  }

  const deletePosition = async (id) => {
    await fetch('/api/positions',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setPositions(p=>p.filter(x=>x.id!==id))
  }

  const filtered = positions.filter(p=>filter==='all'||p.status===filter)
  const closingPosition = closingId ? positions.find(p=>p.id===closingId) : null
  const open = positions.filter(p=>p.status==='open')
  const totalOpenRisk = open.reduce((sum,p)=>{
    if(!p.stopPrice) return sum
    return sum + Math.abs(p.entryPrice-p.stopPrice)*p.contractSize*p.contracts
  },0)
  const closedPnL = positions.filter(p=>p.status==='closed'&&p.pnl!=null).reduce((s,p)=>s+(p.pnl||0),0)

  const inp = {width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading positions...</p>

  return (
    <div>
      {closingPosition && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>setClosingId(null)}>
          <div style={{background:C.surface,border:`1px solid ${C.border2}`,padding:28,width:'100%',maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <CloseModal position={closingPosition} onClose={()=>setClosingId(null)} onConfirm={closePosition} />
          </div>
        </div>
      )}
      <div style={{display:'flex',alignItems:'baseline',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <h2 style={{fontSize:28,fontWeight:400,margin:0}}>Open <span style={{color:C.gold}}>Positions</span></h2>
        <button onClick={()=>setShowForm(s=>!s)} style={{marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>+ ADD POSITION</button>
      </div>

      {/* Risk dashboard */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,marginBottom:24}}>
        <Card><Label>OPEN POSITIONS</Label><p style={{fontSize:24,color:C.gold,margin:0,fontWeight:300}}>{open.length}</p></Card>
        <Card><Label>TOTAL OPEN RISK</Label><p style={{fontSize:18,color:C.red,margin:0}}>${totalOpenRisk.toFixed(0)}</p></Card>
        <Card><Label>REALIZED P&L</Label><p style={{fontSize:18,color:closedPnL>=0?C.green:C.red,margin:0}}>{closedPnL>=0?'+':''}{closedPnL.toFixed(0)}</p></Card>
        <Card><Label>CLOSED TRADES</Label><p style={{fontSize:24,color:C.muted,margin:0,fontWeight:300}}>{positions.filter(p=>p.status==='closed').length}</p></Card>
      </div>

      {/* Add form */}
      {showForm && (
        <Card style={{marginBottom:24}}>
          <Label>NEW POSITION</Label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16}}>
            <div><Label>DIRECTION</Label><div style={{display:'flex',gap:2}}>{['LONG','SHORT'].map(d=><button key={d} onClick={()=>set('direction',d)} style={{flex:1,background:form.direction===d?(d==='LONG'?C.green:C.red):C.border2,color:form.direction===d?'#0a0a0a':C.muted,border:'none',padding:9,fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{d}</button>)}</div></div>
            <div><Label>COMMODITY / SYMBOL</Label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="e.g. Gold, GC=F" style={inp} /></div>
            <div><Label>DISPLAY NAME</Label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Gold Futures" style={inp} /></div>
            <div><Label>ENTRY PRICE</Label><input value={form.entryPrice} onChange={e=>set('entryPrice',e.target.value)} placeholder="2350.00" style={inp} /></div>
            <div><Label>STOP PRICE</Label><input value={form.stopPrice} onChange={e=>set('stopPrice',e.target.value)} placeholder="2300.00" style={inp} /></div>
            <div><Label>TARGET PRICE</Label><input value={form.targetPrice} onChange={e=>set('targetPrice',e.target.value)} placeholder="2450.00" style={inp} /></div>
            <div><Label>CONTRACTS</Label><input value={form.contracts} onChange={e=>set('contracts',e.target.value)} placeholder="1" style={inp} /></div>
            <div><Label>CONTRACT SIZE</Label><input value={form.contractSize} onChange={e=>set('contractSize',e.target.value)} placeholder="100" style={inp} /></div>
          </div>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Notes (optional)" style={{...inp,minHeight:60,resize:'vertical'}} />
          <div style={{display:'flex',gap:10,marginTop:12}}>
            <button onClick={addPosition} style={{background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>ADD POSITION</button>
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
          </div>
        </Card>
      )}

      <div style={{display:'flex',gap:10,marginBottom:20}}>
        {[['OPEN','open'],['CLOSED','closed'],['ALL','all']].map(([l,v])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?C.gold:'transparent',color:filter===v?'#0a0a0a':C.muted,border:`1px solid ${filter===v?C.gold:C.border2}`,padding:'5px 16px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{l}</button>
        ))}
      </div>

      {filtered.length===0 && <Card><p style={{color:C.muted,fontSize:13,margin:0,textAlign:'center'}}>No positions. Click "+ ADD POSITION" to track your first trade.</p></Card>}

      <div style={{display:'grid',gap:4}}>
        {filtered.map(pos=>{
          const riskPerContract = pos.stopPrice ? Math.abs(pos.entryPrice-pos.stopPrice)*pos.contractSize : 0
          const totalRisk = riskPerContract * pos.contracts
          const dirColor = pos.direction==='LONG'?C.green:C.red
          const pnl = pos.pnl
          return (
            <Card key={pos.id}>
              <div style={{display:'flex',alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10,flexWrap:'wrap'}}>
                    <span style={{fontSize:18}}>{pos.name||pos.symbol}</span>
                    <span style={{fontSize:10,color:dirColor,border:`1px solid ${dirColor}`,padding:'2px 8px',letterSpacing:2}}>{pos.direction}</span>
                    <span style={{fontSize:10,color:pos.status==='open'?C.green:C.muted,border:`1px solid ${pos.status==='open'?C.greenBorder:C.border2}`,padding:'2px 8px',letterSpacing:2}}>{pos.status.toUpperCase()}</span>
                    {pnl!=null && <span style={{fontSize:13,color:pnl>=0?C.green:C.red,marginLeft:'auto'}}>{pnl>=0?'+':''}{pnl.toFixed(0)}</span>}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
                    <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>ENTRY</p><p style={{fontSize:13,margin:0}}>{pos.entryPrice}</p></div>
                    {pos.stopPrice && <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>STOP</p><p style={{fontSize:13,color:C.red,margin:0}}>{pos.stopPrice}</p></div>}
                    {pos.targetPrice && <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>TARGET</p><p style={{fontSize:13,color:C.green,margin:0}}>{pos.targetPrice}</p></div>}
                    {pos.exitPrice && <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>EXIT</p><p style={{fontSize:13,margin:0}}>{pos.exitPrice}</p></div>}
                    <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>CONTRACTS</p><p style={{fontSize:13,margin:0}}>{pos.contracts}x{pos.contractSize}</p></div>
                    {pos.status==='open' && totalRisk>0 && <div><p style={{fontSize:9,color:C.muted,margin:'0 0 3px',letterSpacing:2}}>RISK</p><p style={{fontSize:13,color:C.red,margin:0}}>${totalRisk.toFixed(0)}</p></div>}
                  </div>
                  {pos.notes && <p style={{fontSize:12,color:C.muted,margin:'10px 0 0',lineHeight:1.6}}>{pos.notes}</p>}
                  <p style={{fontSize:10,color:C.dim,margin:'8px 0 0'}}>{new Date(pos.openedAt).toLocaleDateString()}</p>
                </div>
                <div style={{display:'flex',gap:8,flexShrink:0,flexDirection:'column'}}>
                  {pos.status==='open' && (
                    <button onClick={()=>setClosingId(pos.id)} style={{background:C.gold,color:C.surface,border:'none',padding:'6px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:1}}>CLOSE</button>
                  )}
                  <button onClick={()=>deletePosition(pos.id)} style={{background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'6px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>DEL</button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Ideas Tab ────────────────────────────────────────────────────────────────
function IdeasTab() {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({title:'',symbol:'',direction:'WATCHING',timeframe:'Daily',status:'watching',thesis:'',entry:'',stop:'',target:'',confidence:'',tags:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{fetch('/api/ideas').then(r=>r.json()).then(d=>{if(Array.isArray(d))setIdeas(d);setLoading(false)})},[])

  const save = async () => {
    const payload = {...form, tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : []}
    if (editing) {
      const res = await fetch('/api/ideas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editing,...payload})})
      const updated = await res.json()
      setIdeas(i=>i.map(x=>x.id===editing?updated:x))
      setEditing(null)
    } else {
      const res = await fetch('/api/ideas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const idea = await res.json()
      setIdeas(i=>[idea,...i])
    }
    setShowForm(false); setForm({title:'',symbol:'',direction:'WATCHING',timeframe:'Daily',status:'watching',thesis:'',entry:'',stop:'',target:'',confidence:'',tags:''})
  }

  const del = async (id) => { await fetch('/api/ideas',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); setIdeas(i=>i.filter(x=>x.id!==id)) }
  const edit = (idea) => { setEditing(idea.id); setForm({...idea,tags:(idea.tags||[]).join(', ')}); setShowForm(true) }
  const updateStatus = async (id,status) => {
    const res = await fetch('/api/ideas',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})})
    const updated = await res.json()
    setIdeas(i=>i.map(x=>x.id===id?updated:x))
  }

  const filtered = ideas.filter(i=>filter==='all'||i.status===filter)
  const statColors = {watching:C.gold,active:C.green,passed:'#8b2020',invalid:C.muted}
  const dirColors = {BUY:C.green,SELL:C.red,WATCHING:C.gold}
  const inp = {width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading ideas...</p>

  return (
    <div>
      <div style={{display:'flex',alignItems:'baseline',gap:16,marginBottom:24,flexWrap:'wrap'}}>
        <h2 style={{fontSize:28,fontWeight:400,margin:0}}>Trade <span style={{color:C.gold}}>Ideas</span></h2>
        <button onClick={()=>{setShowForm(s=>!s);setEditing(null)}} style={{marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>+ NEW IDEA</button>
      </div>

      {showForm && (
        <Card style={{marginBottom:24}}>
          <Label>{editing?'EDIT IDEA':'NEW IDEA'}</Label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16}}>
            <div style={{gridColumn:'1/-1'}}><Label>TITLE</Label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Gold seasonal buy setup" style={inp} /></div>
            <div><Label>SYMBOL</Label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="Gold, CL=F..." style={inp} /></div>
            <div><Label>DIRECTION</Label><div style={{display:'flex',gap:2}}>{['BUY','SELL','WATCHING'].map(d=><button key={d} onClick={()=>set('direction',d)} style={{flex:1,background:form.direction===d?dirColors[d]:C.border2,color:form.direction===d?'#0a0a0a':C.muted,border:'none',padding:8,fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font}}>{d}</button>)}</div></div>
            <div><Label>TIMEFRAME</Label>
              <select value={form.timeframe} onChange={e=>set('timeframe',e.target.value)} style={{...inp}}>
                {['1m','2m','3m','5m','15m','30m','45m','1h','2h','3h','4h','Daily','Weekly','Monthly','Annually','Seasonal'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div><Label>CONFIDENCE (1-10)</Label><input value={form.confidence} onChange={e=>set('confidence',e.target.value)} placeholder="7" style={inp} /></div>
            <div><Label>ENTRY</Label><input value={form.entry} onChange={e=>set('entry',e.target.value)} placeholder="2320-2340" style={inp} /></div>
            <div><Label>STOP</Label><input value={form.stop} onChange={e=>set('stop',e.target.value)} placeholder="2280" style={inp} /></div>
            <div><Label>TARGET</Label><input value={form.target} onChange={e=>set('target',e.target.value)} placeholder="2450" style={inp} /></div>
            <div><Label>TAGS (comma separated)</Label><input value={form.tags} onChange={e=>set('tags',e.target.value)} placeholder="seasonal, COT, breakout" style={inp} /></div>
          </div>
          <Label>THESIS / NOTES</Label>
          <textarea value={form.thesis} onChange={e=>set('thesis',e.target.value)} placeholder="Why does this setup make sense? What are the key signals?" style={{...inp,minHeight:80,resize:'vertical',marginBottom:12}} />
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} style={{background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{editing?'UPDATE':'SAVE IDEA'}</button>
            <button onClick={()=>{setShowForm(false);setEditing(null)}} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
          </div>
        </Card>
      )}

      <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
        {[['ALL','all'],['WATCHING','watching'],['ACTIVE','active'],['PASSED','passed'],['INVALID','invalid']].map(([l,v])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?C.gold:'transparent',color:filter===v?'#0a0a0a':C.muted,border:`1px solid ${filter===v?C.gold:C.border2}`,padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{l} {ideas.filter(i=>v==='all'||i.status===v).length}</button>
        ))}
      </div>

      {filtered.length===0 && <Card><p style={{color:C.muted,fontSize:13,margin:0,textAlign:'center'}}>No ideas yet. Click "+ NEW IDEA" to start tracking setups.</p></Card>}

      <div style={{display:'grid',gap:4}}>
        {filtered.map(idea=>(
          <Card key={idea.id}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                  <span style={{fontSize:16}}>{idea.title}</span>
                  {idea.symbol && <span style={{fontSize:11,color:C.muted}}>{idea.symbol}</span>}
                  {idea.direction!=='WATCHING' && <span style={{fontSize:10,color:dirColors[idea.direction]||C.muted,border:`1px solid ${dirColors[idea.direction]||C.border2}`,padding:'2px 8px',letterSpacing:2}}>{idea.direction}</span>}
                  <span style={{fontSize:10,color:statColors[idea.status]||C.muted,border:`1px solid ${statColors[idea.status]||C.border2}`,padding:'2px 8px',letterSpacing:2}}>{idea.status.toUpperCase()}</span>
                  {idea.confidence && <span style={{fontSize:10,color:C.gold}}>★ {idea.confidence}/10</span>}
                  <span style={{fontSize:10,color:C.dim,marginLeft:'auto'}}>{new Date(idea.createdAt).toLocaleDateString()}</span>
                </div>
                {(idea.entry||idea.stop||idea.target) && (
                  <div style={{display:'flex',gap:20,marginBottom:8,fontSize:12,color:C.muted}}>
                    {idea.entry && <span>Entry: <span style={{color:C.text}}>{idea.entry}</span></span>}
                    {idea.stop && <span>Stop: <span style={{color:C.red}}>{idea.stop}</span></span>}
                    {idea.target && <span>Target: <span style={{color:C.green}}>{idea.target}</span></span>}
                    {idea.timeframe && <span>TF: <span style={{color:C.text}}>{idea.timeframe}</span></span>}
                  </div>
                )}
                {idea.thesis && <p style={{fontSize:13,color:C.muted,margin:'0 0 8px',lineHeight:1.7}}>{idea.thesis}</p>}
                {idea.tags?.length>0 && <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{idea.tags.map(t=><span key={t} style={{fontSize:10,color:C.muted,border:`1px solid ${C.border}`,padding:'2px 7px'}}>{t}</span>)}</div>}
                <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
                  {['watching','active','passed','invalid'].filter(s=>s!==idea.status).map(s=>(
                    <button key={s} onClick={()=>updateStatus(idea.id,s)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'3px 10px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font}}>→ {s}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <button onClick={()=>edit(idea)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>EDIT</button>
                <button onClick={()=>del(idea.id)} style={{background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>DEL</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab() {
  const [events, setEvents] = useState([])
  const [seasonal, setSeasonal] = useState('')
  const [categories, setCategories] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    fetch('/api/calendar').then(r=>r.json()).then(d=>{
      setEvents(d.events||[]); setSeasonal(d.currentSeasonalNote||'')
      setCategories(d.categories||[]); setLoading(false)
    })
  },[])

  const impactColor = {HIGH:C.red,MEDIUM:C.gold,LOW:C.green}
  const categoryColor = {COT:C.gold,Energy:'#4fc3f7',Grains:'#81c784',Livestock:'#ffb74d',Metals:C.gold,Softs:'#ce93d8',Macro:'#e57373'}

  const filtered = events.filter(e=>filter==='All'||e.category===filter)
  const upcoming = filtered.filter(e=>new Date(e.time)>=new Date()).slice(0,20)

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading calendar...</p>

  return (
    <div>
      <h2 style={{fontSize:28,fontWeight:400,marginBottom:8}}>Economic <span style={{color:C.gold}}>Calendar</span></h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:16}}>Commodity-relevant events, reports, and releases</p>

      {seasonal && (
        <div style={{background:'#0d0a04',border:'1px solid #3d2a10',padding:'12px 18px',marginBottom:24}}>
          <p style={{fontSize:11,letterSpacing:2,color:C.gold,margin:'0 0 4px'}}>SEASONAL CONTEXT</p>
          <p style={{fontSize:13,color:C.muted,margin:0}}>{seasonal}</p>
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {categories.map(cat=>(
          <button key={cat} onClick={()=>setFilter(cat)} style={{background:filter===cat?(categoryColor[cat]||C.gold):'transparent',color:filter===cat?'#0a0a0a':C.muted,border:`1px solid ${filter===cat?(categoryColor[cat]||C.gold):C.border2}`,padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{cat}</button>
        ))}
      </div>

      <div style={{display:'grid',gap:3}}>
        {upcoming.map(event=>{
          const eventDate = new Date(event.time)
          const daysUntil = Math.ceil((eventDate-new Date())/(1000*60*60*24))
          const isThisWeek = daysUntil<=7
          return (
            <div key={event.id} style={{background:isThisWeek?'#0d0d0a':C.surface,border:`1px solid ${isThisWeek?'#3d3010':C.border2}`,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <div style={{minWidth:60,textAlign:'center',flexShrink:0}}>
                <p style={{fontSize:11,color:C.muted,margin:'0 0 2px'}}>{eventDate.toLocaleDateString('en-US',{month:'short'})}</p>
                <p style={{fontSize:20,fontWeight:300,color:isThisWeek?C.gold:C.text,margin:0}}>{eventDate.getDate()}</p>
              </div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                  <span style={{fontSize:14,color:isThisWeek?C.text:'#888'}}>{event.title}</span>
                  <span style={{fontSize:9,color:impactColor[event.impact]||C.muted,border:`1px solid ${impactColor[event.impact]||C.border}`,padding:'2px 6px',letterSpacing:1}}>{event.impact}</span>
                  <span style={{fontSize:9,color:categoryColor[event.category]||C.muted,border:`1px solid ${categoryColor[event.category]||C.border}`,padding:'2px 6px',letterSpacing:1}}>{event.category}</span>
                  {isThisWeek && <span style={{fontSize:9,color:C.gold,border:`1px solid ${C.gold}`,padding:'2px 6px',letterSpacing:1}}>THIS WEEK</span>}
                </div>
                <p style={{fontSize:12,color:C.muted,margin:0}}>{event.description}</p>
                <p style={{fontSize:10,color:C.dim,margin:'4px 0 0'}}>{event.recurrence}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <p style={{fontSize:11,color:daysUntil<=3?C.gold:C.muted,margin:'0 0 4px'}}>{daysUntil===0?'TODAY':daysUntil===1?'TOMORROW':`${daysUntil}d`}</p>
                {event.link && <a href={event.link} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:C.gold,textDecoration:'none'}}>source →</a>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=>{fetch('/api/analytics').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})},[])
  if (loading) return <p style={{color:C.muted,fontSize:13}}>Computing analytics...</p>
  if (!data) return <p style={{color:C.muted,fontSize:13}}>No data yet.</p>
  const s = data.screenings, p = data.positions
  const streakColor = s.currentStreak>0?C.green:s.currentStreak<0?C.red:C.muted
  const maxBar = s.monthStats ? Math.max(...s.monthStats.map(m=>m.total),1) : 1

  return (
    <div>
      <h2 style={{fontSize:28,fontWeight:400,marginBottom:24}}>Trade <span style={{color:C.gold}}>Analytics</span></h2>

      {/* Key metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:28}}>
        {[
          ['WIN RATE', `${s.winRate}%`, s.winRate>=50?C.green:C.red],
          ['TOTAL SCREENINGS', s.total, C.text],
          ['PASS RATE', `${s.passRate}%`, C.gold],
          ['CURRENT STREAK', s.currentStreak>0?`+${s.currentStreak}W`:s.currentStreak<0?`${Math.abs(s.currentStreak)}L`:'—', streakColor],
          ['BEST WIN STREAK', s.maxWinStreak, C.green],
          ['WORST LOSS STREAK', s.maxLossStreak, C.red],
          ['OPEN POSITIONS', p.open, C.gold],
          ['REALIZED P&L', p.totalPnL!=null?`${p.totalPnL>=0?'+':''}${p.totalPnL.toFixed(0)}`:'—', p.totalPnL>=0?C.green:C.red],
        ].map(([l,v,c])=><Card key={l}><Label>{l}</Label><p style={{fontSize:20,color:c,margin:0,fontWeight:300}}>{v}</p></Card>)}
      </div>

      {/* Direction breakdown */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28}}>
        <Card>
          <Label>BUY SETUPS</Label>
          <p style={{fontSize:24,color:C.green,margin:'0 0 4px',fontWeight:300}}>{s.byDirection?.buy?.winRate||0}%</p>
          <p style={{fontSize:11,color:C.muted,margin:0}}>{s.byDirection?.buy?.wins}W / {s.byDirection?.buy?.total - s.byDirection?.buy?.wins}L of {s.byDirection?.buy?.total} trades</p>
        </Card>
        <Card>
          <Label>SELL SETUPS</Label>
          <p style={{fontSize:24,color:C.red,margin:'0 0 4px',fontWeight:300}}>{s.byDirection?.sell?.winRate||0}%</p>
          <p style={{fontSize:11,color:C.muted,margin:0}}>{s.byDirection?.sell?.wins}W / {s.byDirection?.sell?.total - s.byDirection?.sell?.wins}L of {s.byDirection?.sell?.total} trades</p>
        </Card>
      </div>

      {/* Monthly win rate */}
      {s.monthStats && s.monthStats.some(m=>m.total>0) && (
        <Card style={{marginBottom:28}}>
          <Label>WIN RATE BY MONTH</Label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:4,alignItems:'flex-end',height:80,marginBottom:8}}>
            {s.monthStats.map(m=>{
              const h = m.total ? Math.max(8, (m.winRate/100)*70) : 4
              const color = m.winRate>=60?C.green:m.winRate>=40?C.gold:m.winRate>0?C.red:C.border2
              return <div key={m.month} title={m.total?`${m.month}: ${m.winRate}% (${m.total} trades)`:m.month} style={{height:`${h}px`,background:color,opacity:m.total?0.8:0.2,alignSelf:'flex-end'}} />
            })}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:4}}>
            {s.monthStats.map(m=><p key={m.month} style={{fontSize:8,color:C.dim,margin:0,textAlign:'center'}}>{m.month.slice(0,1)}</p>)}
          </div>
        </Card>
      )}

      {/* By commodity */}
      {s.commodityStats?.length>0 && (
        <Card style={{marginBottom:28}}>
          <Label>WIN RATE BY COMMODITY</Label>
          <div style={{display:'grid',gap:6}}>
            {s.commodityStats.slice(0,10).map(cs=>(
              <div key={cs.name} style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:12,width:100,flexShrink:0}}>{cs.name}</span>
                <div style={{flex:1,height:6,background:C.border2,borderRadius:3}}>
                  <div style={{height:'100%',width:`${cs.winRate}%`,background:cs.winRate>=60?C.green:cs.winRate>=40?C.gold:C.red,borderRadius:3}} />
                </div>
                <span style={{fontSize:11,color:cs.winRate>=60?C.green:cs.winRate>=40?C.gold:C.red,width:40,textAlign:'right'}}>{cs.winRate}%</span>
                <span style={{fontSize:10,color:C.dim,width:30,textAlign:'right'}}>{cs.total}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stage fail patterns */}
      {s.failPatterns?.length>0 && (
        <Card>
          <Label>MOST COMMON FAILURE POINTS</Label>
          <div style={{display:'grid',gap:8}}>
            {s.failPatterns.map(fp=>(
              <div key={fp.stage} style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:12,flex:1}}>{fp.stage}</span>
                <span style={{fontSize:13,color:C.red}}>{fp.count}x</span>
              </div>
            ))}
          </div>
          <p style={{fontSize:11,color:C.dim,margin:'12px 0 0'}}>These stages eliminate your setups most often — focus your market research here.</p>
        </Card>
      )}

      {s.total===0 && <Card><p style={{color:C.muted,fontSize:13,margin:0,textAlign:'center'}}>No screening data yet. Run screenings and log outcomes to see analytics.</p></Card>}
    </div>
  )
}

// ─── Alerts Tab ───────────────────────────────────────────────────────────────
function AlertsTab({ plan, onUpgrade }) {
  const [alerts, setAlerts] = useState([])
  const [weeklyAlert, setWeeklyAlert] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({symbol:'',name:'',condition:'above',value:'',message:''})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{
    Promise.all([
      fetch('/api/pricealerts').then(r=>r.json()),
      fetch('/api/alerts').then(r=>r.json()),
    ]).then(([pa,wa])=>{
      if(Array.isArray(pa)) setAlerts(pa)
      if(Array.isArray(wa)) setWeeklyAlert(wa.find(a=>a.type==='weekly_cot')?.enabled||false)
      setLoading(false)
    })
  },[])

  if (plan==='free') return <UpgradeGate feature="Alerts" onUpgrade={onUpgrade} />

  const addAlert = async () => {
    if(!form.symbol||!form.condition) return
    const res = await fetch('/api/pricealerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const alert = await res.json()
    setAlerts(a=>[alert,...a]); setShowForm(false)
    setForm({symbol:'',name:'',condition:'above',value:'',message:''})
  }

  const toggleAlert = async (id,enabled) => {
    await fetch('/api/pricealerts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,enabled})})
    setAlerts(a=>a.map(x=>x.id===id?{...x,enabled}:x))
  }

  const deleteAlert = async (id) => {
    await fetch('/api/pricealerts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setAlerts(a=>a.filter(x=>x.id!==id))
  }

  const toggleWeekly = async () => {
    const enabled = !weeklyAlert
    await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'weekly_cot',enabled})})
    setWeeklyAlert(enabled)
  }

  const inp = {width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}
  const conditionLabels = {above:'Price above',below:'Price below',cotIndex_above:'COT Index above',cotIndex_below:'COT Index below'}

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading alerts...</p>

  return (
    <div>
      <h2 style={{fontSize:28,fontWeight:400,marginBottom:8}}>Smart <span style={{color:C.gold}}>Alerts</span></h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Price alerts, COT extreme alerts, and weekly watchlist emails</p>

      {/* Weekly COT alert toggle */}
      <Card style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:13,color:C.text,margin:'0 0 4px'}}>Weekly COT Alert Email</p>
            <p style={{fontSize:12,color:C.muted,margin:0}}>Every Friday after CFTC release — your watchlist screened and emailed to you</p>
          </div>
          <button onClick={toggleWeekly} style={{background:weeklyAlert?C.green:C.border2,color:weeklyAlert?'#0a0a0a':C.muted,border:'none',padding:'8px 20px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font,flexShrink:0}}>
            {weeklyAlert?'✓ ENABLED':'DISABLED'}
          </button>
        </div>
      </Card>

      {/* Price alerts */}
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
        <Label style={{margin:0}}>PRICE & COT ALERTS</Label>
        <button onClick={()=>setShowForm(s=>!s)} style={{background:C.gold,color:C.surface,border:'none',padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>+ ADD ALERT</button>
      </div>

      {showForm && (
        <Card style={{marginBottom:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16}}>
            <div><Label>COMMODITY</Label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="Gold, Crude Oil..." style={inp} /></div>
            <div><Label>DISPLAY NAME</Label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Gold Futures" style={inp} /></div>
            <div><Label>CONDITION</Label>
              <select value={form.condition} onChange={e=>set('condition',e.target.value)} style={inp}>
                {Object.entries(conditionLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><Label>VALUE</Label><input value={form.value} onChange={e=>set('value',e.target.value)} placeholder="2400.00" style={inp} /></div>
            <div style={{gridColumn:'1/-1'}}><Label>MESSAGE (optional)</Label><input value={form.message} onChange={e=>set('message',e.target.value)} placeholder="e.g. Gold at target — check for entry" style={inp} /></div>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={addAlert} style={{background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>SET ALERT</button>
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
          </div>
        </Card>
      )}

      {alerts.length===0 && !showForm && <Card><p style={{color:C.muted,fontSize:13,margin:0,textAlign:'center'}}>No price alerts yet. Click "+ ADD ALERT" to get notified when conditions are met.</p></Card>}

      <div style={{display:'grid',gap:4}}>
        {alerts.map(alert=>(
          <div key={alert.id} style={{background:C.surface,border:`1px solid ${alert.triggered?C.greenBorder:alert.enabled?C.border2:C.border}`,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,opacity:alert.enabled?1:0.5,flexWrap:'wrap'}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                <span style={{fontSize:14}}>{alert.name}</span>
                <span style={{fontSize:11,color:C.muted}}>{conditionLabels[alert.condition]||alert.condition} {alert.value}</span>
                {alert.triggered && <span style={{fontSize:10,color:C.green,border:`1px solid ${C.greenBorder}`,padding:'2px 6px',letterSpacing:1}}>TRIGGERED {new Date(alert.triggeredAt).toLocaleDateString()}</span>}
              </div>
              {alert.message && <p style={{fontSize:12,color:C.muted,margin:0}}>{alert.message}</p>}
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0}}>
              <button onClick={()=>toggleAlert(alert.id,!alert.enabled)} style={{background:alert.enabled?C.green:C.border2,color:alert.enabled?'#0a0a0a':C.muted,border:'none',padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:1}}>{alert.enabled?'ON':'OFF'}</button>
              <button onClick={()=>deleteAlert(alert.id)} style={{background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>DEL</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Checklist Tab ────────────────────────────────────────────────────────────
function ChecklistTab() {
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [formName, setFormName] = useState('')
  const [formItems, setFormItems] = useState([''])
  const [checked, setChecked] = useState({})

  useEffect(()=>{fetch('/api/checklists').then(r=>r.json()).then(d=>{if(Array.isArray(d))setChecklists(d);setLoading(false)})},[])

  const save = async () => {
    const items = formItems.filter(i=>i.trim())
    if(!formName.trim()||!items.length) return
    if(editId) {
      const res = await fetch('/api/checklists',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,name:formName,items})})
      const updated = await res.json()
      setChecklists(c=>c.map(x=>x.id===editId?updated:x))
      setEditId(null)
    } else {
      const res = await fetch('/api/checklists',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:formName,items})})
      const cl = await res.json()
      setChecklists(c=>[...c,cl])
    }
    setShowForm(false); setFormName(''); setFormItems([''])
  }

  const del = async (id) => { await fetch('/api/checklists',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})}); setChecklists(c=>c.filter(x=>x.id!==id)) }
  const edit = (cl) => { setEditId(cl.id); setFormName(cl.name); setFormItems(cl.items.map(i=>i.label)); setShowForm(true) }
  const toggleCheck = (clId,itemId) => { setChecked(c=>({...c,[`${clId}-${itemId}`]:!c[`${clId}-${itemId}`]})) }
  const resetChecklist = (clId) => { setChecked(c=>{const n={...c};Object.keys(n).filter(k=>k.startsWith(clId)).forEach(k=>delete n[k]);return n}) }

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading checklists...</p>

  return (
    <div>
      <div style={{display:'flex',alignItems:'baseline',gap:16,marginBottom:8,flexWrap:'wrap'}}>
        <h2 style={{fontSize:28,fontWeight:400,margin:0}}>Pre-Trade <span style={{color:C.gold}}>Checklists</span></h2>
        <button onClick={()=>{setShowForm(s=>!s);setEditId(null);setFormName('');setFormItems([''])}} style={{marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>+ NEW CHECKLIST</button>
      </div>
      <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Build custom pre-trade checklists on top of the 9-stage framework. Check off every item before entering a trade.</p>

      {showForm && (
        <Card style={{marginBottom:24}}>
          <Label>{editId?'EDIT CHECKLIST':'NEW CHECKLIST'}</Label>
          <input value={formName} onChange={e=>setFormName(e.target.value)} placeholder="Checklist name (e.g. Pre-Trade Entry)" style={{width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:15,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box',marginBottom:16}} />
          <Label>ITEMS</Label>
          {formItems.map((item,i)=>(
            <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
              <input value={item} onChange={e=>{const n=[...formItems];n[i]=e.target.value;setFormItems(n)}} placeholder={`Item ${i+1}`} style={{flex:1,background:'transparent',border:`1px solid ${C.border2}`,padding:'8px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}} />
              <button onClick={()=>setFormItems(f=>f.filter((_,j)=>j!==i))} style={{background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'6px 10px',fontSize:12,cursor:'pointer',fontFamily:C.font}}>×</button>
            </div>
          ))}
          <button onClick={()=>setFormItems(f=>[...f,''])} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'6px 14px',fontSize:10,cursor:'pointer',fontFamily:C.font,marginBottom:16}}>+ ADD ITEM</button>
          <div style={{display:'flex',gap:10}}>
            <button onClick={save} style={{background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{editId?'UPDATE':'SAVE'}</button>
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
          </div>
        </Card>
      )}

      {checklists.length===0 && !showForm && (
        <Card>
          <p style={{color:C.muted,fontSize:13,margin:'0 0 8px',textAlign:'center'}}>No checklists yet. Here are some ideas to get started:</p>
          {[['Pre-Trade Entry',['9-stage screening complete','COT index above 60','Seasonal window is positive','Stop loss placed','Position sized correctly','News risk checked']],['Weekly Review',['Review all open positions','Log outcomes in journal','Check COT updates','Scan watchlist for new setups','Review this week P&L']]].map(([name,items])=>(
            <button key={name} onClick={()=>{setFormName(name);setFormItems(items);setShowForm(true)}} style={{display:'block',width:'100%',background:C.border,color:C.muted,border:`1px solid ${C.border2}`,padding:'10px 16px',fontSize:12,cursor:'pointer',fontFamily:C.font,textAlign:'left',marginTop:8}}>
              Use template: {name} ({items.length} items)
            </button>
          ))}
        </Card>
      )}

      <div style={{display:'grid',gap:16}}>
        {checklists.map(cl=>{
          const completedCount = cl.items.filter(item=>checked[`${cl.id}-${item.id}`]).length
          const allDone = completedCount===cl.items.length && cl.items.length>0
          return (
            <Card key={cl.id} style={{borderColor:allDone?C.greenBorder:C.border2}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                <span style={{fontSize:16}}>{cl.name}</span>
                <span style={{fontSize:11,color:allDone?C.green:C.muted}}>{completedCount}/{cl.items.length}</span>
                {allDone && <span style={{fontSize:10,color:C.green,border:`1px solid ${C.greenBorder}`,padding:'2px 8px',letterSpacing:1}}>✓ COMPLETE</span>}
                <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                  <button onClick={()=>resetChecklist(cl.id)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'4px 10px',fontSize:9,cursor:'pointer',fontFamily:C.font,letterSpacing:1}}>RESET</button>
                  <button onClick={()=>edit(cl)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'4px 10px',fontSize:9,cursor:'pointer',fontFamily:C.font}}>EDIT</button>
                  <button onClick={()=>del(cl.id)} style={{background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'4px 8px',fontSize:9,cursor:'pointer',fontFamily:C.font}}>DEL</button>
                </div>
              </div>
              <div style={{height:3,background:C.border2,marginBottom:16,borderRadius:2}}>
                <div style={{height:'100%',width:`${cl.items.length?(completedCount/cl.items.length)*100:0}%`,background:allDone?C.green:C.gold,borderRadius:2,transition:'width 0.3s'}} />
              </div>
              <div style={{display:'grid',gap:6}}>
                {cl.items.map(item=>{
                  const isChecked = checked[`${cl.id}-${item.id}`]
                  return (
                    <div key={item.id} onClick={()=>toggleCheck(cl.id,item.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:isChecked?'#080d09':C.bg,border:`1px solid ${isChecked?C.greenBorder:C.border}`,cursor:'pointer',transition:'all 0.15s'}}>
                      <div style={{width:16,height:16,border:`1px solid ${isChecked?C.green:C.muted}`,background:isChecked?C.green:'transparent',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                        {isChecked && <span style={{color:C.surface,fontSize:10}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,color:isChecked?C.muted:C.text,textDecoration:isChecked?'line-through':'none'}}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Community Tab ────────────────────────────────────────────────────────────
function CommunityTab() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({symbol:'',direction:'',title:'',body:'',isAnonymous:false})
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(()=>{fetch('/api/community').then(r=>r.json()).then(d=>{if(Array.isArray(d))setPosts(d);setLoading(false)})},[])

  const post = async () => {
    if(!form.symbol||!form.title) return
    const res = await fetch('/api/community',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const newPost = await res.json()
    setPosts(p=>[{...newPost,authorName:form.isAnonymous?'Anonymous':'You'},...p])
    setShowForm(false); setForm({symbol:'',direction:'',title:'',body:'',isAnonymous:false})
  }

  const like = async (id) => {
    await fetch('/api/community',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,action:'like'})})
    setPosts(p=>p.map(x=>x.id===id?{...x,likes:x.likes+1}:x))
  }

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading community...</p>

  return (
    <div>
      <div style={{display:'flex',alignItems:'baseline',gap:16,marginBottom:8,flexWrap:'wrap'}}>
        <h2 style={{fontSize:28,fontWeight:400,margin:0}}>Community <span style={{color:C.gold}}>Feed</span></h2>
        <button onClick={()=>setShowForm(s=>!s)} style={{marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>+ SHARE SETUP</button>
      </div>
      <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Share screened setups with the community. Log outcomes to build credibility.</p>

      {showForm && (
        <Card style={{marginBottom:24}}>
          <Label>SHARE A SETUP</Label>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:16}}>
            <div><Label>COMMODITY</Label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="Gold, Crude Oil..." style={{width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}} /></div>
            <div><Label>DIRECTION</Label><div style={{display:'flex',gap:2}}>{['BUY','SELL','WATCHING'].map(d=><button key={d} onClick={()=>set('direction',d)} style={{flex:1,background:form.direction===d?(d==='BUY'?C.green:d==='SELL'?C.red:C.gold):C.border2,color:form.direction===d?'#0a0a0a':C.muted,border:'none',padding:8,fontSize:9,cursor:'pointer',fontFamily:C.font}}>{d}</button>)}</div></div>
            <div style={{gridColumn:'1/-1'}}><Label>TITLE</Label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. Gold COT extreme — seasonal buy window opening" style={{width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box'}} /></div>
            <div style={{gridColumn:'1/-1'}}><Label>ANALYSIS (optional)</Label><textarea value={form.body} onChange={e=>set('body',e.target.value)} placeholder="Share your reasoning, key data points, entry/stop levels..." style={{width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box',resize:'vertical',minHeight:80}} /></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:16}}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:C.muted}}>
              <input type="checkbox" checked={form.isAnonymous} onChange={e=>set('isAnonymous',e.target.checked)} style={{accentColor:C.gold}} />
              Post anonymously
            </label>
          </div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={post} style={{background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>POST</button>
            <button onClick={()=>setShowForm(false)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font}}>CANCEL</button>
          </div>
        </Card>
      )}

      {posts.length===0 && !showForm && <Card><p style={{color:C.muted,fontSize:13,margin:0,textAlign:'center'}}>No community posts yet. Be the first to share a setup!</p></Card>}

      <div style={{display:'grid',gap:4}}>
        {posts.map(p=>{
          const dirColor = {BUY:C.green,SELL:C.red,WATCHING:C.gold}[p.direction]||C.muted
          return (
            <Card key={p.id}>
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:14}}>{p.title}</span>
                    {p.symbol && <span style={{fontSize:11,color:C.muted}}>{p.symbol}</span>}
                    {p.direction && <span style={{fontSize:10,color:dirColor,border:`1px solid ${dirColor}`,padding:'2px 8px',letterSpacing:2}}>{p.direction}</span>}
                    {p.passed!=null && <span style={{fontSize:10,color:p.passed?C.green:C.red,border:`1px solid ${p.passed?C.greenBorder:C.redBorder}`,padding:'2px 8px'}}>{p.passed?'PASSED':'FAILED'} 9-STAGE</span>}
                    <span style={{fontSize:10,color:C.dim,marginLeft:'auto'}}>{new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  {p.body && <p style={{fontSize:13,color:C.muted,margin:'0 0 8px',lineHeight:1.7}}>{p.body}</p>}
                  <div style={{display:'flex',alignItems:'center',gap:16}}>
                    <span style={{fontSize:11,color:C.muted}}>by {p.authorName}</span>
                    {p.cotIndex!=null && <span style={{fontSize:11,color:C.muted}}>COT: {p.cotIndex}</span>}
                    {p.seasonal!=null && <span style={{fontSize:11,color:p.seasonal>0?C.green:C.red}}>Seasonal: {p.seasonal>0?'+':''}{p.seasonal}%</span>}
                  </div>
                </div>
                <button onClick={()=>like(p.id)} style={{background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'6px 12px',fontSize:11,cursor:'pointer',fontFamily:C.font,flexShrink:0}}>♥ {p.likes}</button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── Reference Tab ────────────────────────────────────────────────────────────
function ReferenceTab() {
  const [section, setSection] = useState('contracts')
  const sections = [['contracts','Contract Specs'],['cot','COT Guide'],['seasonal','Seasonal Guide'],['glossary','Glossary']]

  const contracts = [
    {name:'Gold (GC)',exchange:'COMEX',size:'100 troy oz',tick:'$0.10 = $10',margin:'~$8,000',hours:'Sun-Fri 6pm-5pm ET',category:'Metals'},
    {name:'Silver (SI)',exchange:'COMEX',size:'5,000 troy oz',tick:'$0.005 = $25',margin:'~$7,000',hours:'Sun-Fri 6pm-5pm ET',category:'Metals'},
    {name:'Copper (HG)',exchange:'COMEX',size:'25,000 lbs',tick:'$0.0005 = $12.50',margin:'~$4,000',hours:'Sun-Fri 6pm-5pm ET',category:'Metals'},
    {name:'Crude Oil (CL)',exchange:'NYMEX',size:'1,000 barrels',tick:'$0.01 = $10',margin:'~$5,000',hours:'Sun-Fri 6pm-5pm ET',category:'Energy'},
    {name:'Natural Gas (NG)',exchange:'NYMEX',size:'10,000 MMBtu',tick:'$0.001 = $10',margin:'~$2,000',hours:'Sun-Fri 6pm-5pm ET',category:'Energy'},
    {name:'RBOB Gasoline (RB)',exchange:'NYMEX',size:'42,000 gal',tick:'$0.0001 = $4.20',margin:'~$4,500',hours:'Sun-Fri 6pm-5pm ET',category:'Energy'},
    {name:'Corn (ZC)',exchange:'CBOT',size:'5,000 bushels',tick:'$0.0025 = $12.50',margin:'~$1,200',hours:'Sun-Fri 7pm-7:45am, 8:30am-1:20pm CT',category:'Grains'},
    {name:'Wheat (ZW)',exchange:'CBOT',size:'5,000 bushels',tick:'$0.0025 = $12.50',margin:'~$1,500',hours:'Sun-Fri 7pm-7:45am, 8:30am-1:20pm CT',category:'Grains'},
    {name:'Soybeans (ZS)',exchange:'CBOT',size:'5,000 bushels',tick:'$0.0025 = $12.50',margin:'~$2,000',hours:'Sun-Fri 7pm-7:45am, 8:30am-1:20pm CT',category:'Grains'},
    {name:'Coffee (KC)',exchange:'ICE',size:'37,500 lbs',tick:'$0.0005 = $18.75',margin:'~$3,000',hours:'Mon-Fri 3:15am-1:30pm ET',category:'Softs'},
    {name:'Sugar #11 (SB)',exchange:'ICE',size:'112,000 lbs',tick:'$0.0001 = $11.20',margin:'~$1,500',hours:'Mon-Fri 2:30am-1pm ET',category:'Softs'},
    {name:'Cotton (CT)',exchange:'ICE',size:'50,000 lbs',tick:'$0.0001 = $5',margin:'~$2,000',hours:'Mon-Fri 9:05am-2:25pm ET',category:'Softs'},
    {name:'Live Cattle (LE)',exchange:'CME',size:'40,000 lbs',tick:'$0.00025 = $10',margin:'~$2,000',hours:'Mon-Fri 8:30am-1:05pm CT',category:'Livestock'},
    {name:'Lean Hogs (HE)',exchange:'CME',size:'40,000 lbs',tick:'$0.00025 = $10',margin:'~$1,500',hours:'Mon-Fri 8:30am-1:05pm CT',category:'Livestock'},
  ]

  const glossaryTerms = [
    {term:'COT Report',def:'Commitments of Traders — weekly CFTC report showing how commercial, non-commercial, and small traders are positioned in futures markets.'},
    {term:'Commercials',def:'Hedgers who use futures to offset price risk in their business (e.g. gold miners, oil producers, grain elevators). Their positioning is considered "smart money."'},
    {term:'COT Index',def:'Measures where current commercial positioning sits relative to the past 3 years, on a 0-100 scale. Above 75 = extremely bullish signal. Below 25 = extremely bearish.'},
    {term:'Open Interest',def:'Total number of outstanding futures contracts. Rising OI with price = trend confirmation. Falling OI = weakening trend or short covering.'},
    {term:'Short Covering',def:'When commercials who were net short begin buying to close their positions. Often appears as OI dropping 10-15%+ — a key signal in Stage 8.'},
    {term:'Seasonal Tendency',def:'Historical pattern of a commodity to move in a particular direction during specific months, based on supply/demand cycles.'},
    {term:'USDX',def:'US Dollar Index — measures the dollar against a basket of currencies. Commodities (especially metals and energy) typically move inverse to the dollar.'},
    {term:'Intermarket Analysis',def:'Studying how different markets (bonds, currencies, stocks, commodities) interact and influence each other.'},
    {term:'Net Commercial Position',def:'Commercial longs minus commercial shorts. Positive = net long (bullish). Negative = net short (bearish).'},
    {term:'WASDE',def:'World Agricultural Supply and Demand Estimates — monthly USDA report that moves corn, wheat, and soybean markets significantly.'},
    {term:'EIA',def:'Energy Information Administration — publishes weekly crude oil, gasoline, and natural gas inventory data.'},
    {term:'Contango',def:'When futures prices are higher than spot prices. Normal state for most commodities.'},
    {term:'Backwardation',def:'When spot prices are higher than futures. Often signals tight supply or strong near-term demand.'},
    {term:'Margin',def:'Deposit required to hold a futures position. Much smaller than the contract value — creates leverage.'},
    {term:'Tick',def:'Minimum price movement for a futures contract. Each tick has a defined dollar value.'},
  ]

  const cotLevels = [
    {range:'75-100',label:'Extremely Bullish',desc:'Commercials are more net long than they have been in 3 years. Historically strong buy signal.',color:C.green},
    {range:'60-74',label:'Bullish',desc:'Commercial positioning is bullish relative to recent history. Supports long setups.',color:'#8bc34a'},
    {range:'40-59',label:'Neutral',desc:'No extreme positioning. Wait for clearer signal.',color:C.gold},
    {range:'25-39',label:'Bearish',desc:'Commercial positioning is bearish. Supports short setups.',color:'#ff8a65'},
    {range:'0-24',label:'Extremely Bearish',desc:'Commercials are more net short than they have been in 3 years. Historically strong sell signal.',color:C.red},
  ]

  return (
    <div>
      <h2 style={{fontSize:28,fontWeight:400,marginBottom:8}}>Reference <span style={{color:C.gold}}>Library</span></h2>
      <p style={{color:C.muted,fontSize:13,marginBottom:24}}>Contract specs, COT interpretation guide, seasonal patterns, and glossary</p>

      <div style={{display:'flex',gap:4,marginBottom:28,flexWrap:'wrap'}}>
        {sections.map(([id,label])=>(
          <button key={id} onClick={()=>setSection(id)} style={{background:section===id?C.gold:'transparent',color:section===id?'#0a0a0a':C.muted,border:`1px solid ${section===id?C.gold:C.border2}`,padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font}}>{label.toUpperCase()}</button>
        ))}
      </div>

      {section==='contracts' && (
        <div>
          <Label>FUTURES CONTRACT SPECIFICATIONS</Label>
          {['Metals','Energy','Grains','Softs','Livestock'].map(cat=>(
            <div key={cat} style={{marginBottom:24}}>
              <p style={{fontSize:11,color:C.muted,letterSpacing:3,margin:'0 0 8px'}}>{cat.toUpperCase()}</p>
              <div style={{display:'grid',gap:3}}>
                {contracts.filter(c=>c.category===cat).map(c=>(
                  <div key={c.name} style={{background:C.surface,border:`1px solid ${C.border2}`,padding:'12px 18px',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:12,alignItems:'center'}}>
                    <div><p style={{fontSize:11,color:C.muted,margin:'0 0 2px',letterSpacing:1}}>CONTRACT</p><p style={{fontSize:13,margin:0}}>{c.name}</p></div>
                    <div><p style={{fontSize:11,color:C.muted,margin:'0 0 2px',letterSpacing:1}}>SIZE</p><p style={{fontSize:13,margin:0}}>{c.size}</p></div>
                    <div><p style={{fontSize:11,color:C.muted,margin:'0 0 2px',letterSpacing:1}}>TICK VALUE</p><p style={{fontSize:13,margin:0,color:C.green}}>{c.tick}</p></div>
                    <div><p style={{fontSize:11,color:C.muted,margin:'0 0 2px',letterSpacing:1}}>MARGIN</p><p style={{fontSize:13,margin:0,color:C.gold}}>{c.margin}</p></div>
                    <div><p style={{fontSize:11,color:C.muted,margin:'0 0 2px',letterSpacing:1}}>EXCHANGE</p><p style={{fontSize:12,margin:0,color:C.dim}}>{c.exchange}</p></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p style={{fontSize:11,color:C.dim,marginTop:8}}>Margin requirements are approximate and change with volatility. Check with your broker for current requirements.</p>
        </div>
      )}

      {section==='cot' && (
        <div>
          <Label>READING THE COT INDEX</Label>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:24}}>The COT Index tells you where current commercial positioning sits relative to the past 3 years. It's one of the most powerful tools in commodity trading because commercials (hedgers) are the "smart money" — they trade futures as part of their core business and have the best information about supply and demand.</p>
          <div style={{display:'grid',gap:8,marginBottom:32}}>
            {cotLevels.map(l=>(
              <div key={l.range} style={{background:C.surface,border:`1px solid ${C.border2}`,padding:'16px 20px',display:'flex',gap:16,alignItems:'flex-start'}}>
                <div style={{textAlign:'center',minWidth:60,flexShrink:0}}>
                  <p style={{fontSize:16,fontWeight:300,color:l.color,margin:0}}>{l.range}</p>
                </div>
                <div>
                  <p style={{fontSize:13,color:l.color,margin:'0 0 4px',fontWeight:400}}>{l.label}</p>
                  <p style={{fontSize:12,color:C.muted,margin:0}}>{l.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <Label>HOW COMMERCIALS DIFFER FROM NON-COMMERCIALS</Label>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Card><p style={{fontSize:13,color:C.gold,margin:'0 0 8px'}}>Commercials (Smart Money)</p><p style={{fontSize:12,color:C.muted,lineHeight:1.7,margin:0}}>Gold miners, oil producers, grain elevators. They use futures to hedge their physical exposure. When they're extremely net long, they're buying futures against expected future production — a bullish signal.</p></Card>
            <Card><p style={{fontSize:13,color:C.red,margin:'0 0 8px'}}>Non-Commercials (Speculators)</p><p style={{fontSize:12,color:C.muted,lineHeight:1.7,margin:0}}>Hedge funds, CTAs, managed money. They trade for profit, not hedging. They're often wrong at extremes — when they're most bullish, the top is near. Track commercials, not specs.</p></Card>
          </div>
        </div>
      )}

      {section==='seasonal' && (
        <div>
          <Label>COMMODITY SEASONAL PATTERNS</Label>
          <p style={{fontSize:13,color:C.muted,lineHeight:1.8,marginBottom:24}}>Seasonal tendencies arise from predictable supply and demand cycles. The Seasonal tab gives you exact historical data — use these as general guidelines and always verify with actual numbers.</p>
          {[
            {name:'Gold & Silver',pattern:'Typically weakest in spring (Mar-May), strongest in late summer and fall (Aug-Oct). Year-end demand from India/China for festivals and Lunar New Year.'},
            {name:'Crude Oil',pattern:'Demand peaks in summer (driving season) and winter (heating). Spring refinery maintenance often causes price dips. Watch for OPEC meetings.'},
            {name:'Natural Gas',pattern:'Strong in winter for heating demand (Nov-Feb). Summer cooling demand is secondary. Storage builds through spring/summer.'},
            {name:'Corn',pattern:'Prices often weak at harvest (Sep-Nov) and strengthen through spring planting concerns (Mar-Jun). Watch weather in the Corn Belt.'},
            {name:'Soybeans',pattern:'Similar to corn but influenced by South American harvest (Jan-Apr, which pressures prices) and US planting/growing season.'},
            {name:'Wheat',pattern:'Multiple growing seasons globally create complex seasonals. US winter wheat: harvest pressure in Jun. Spring wheat peaks in Jul-Aug on weather concerns.'},
            {name:'Coffee',pattern:'Brazilian crop cycle dominates. Harvest pressure May-Aug. Weather threats (frost in Brazil July-Aug) can cause explosive rallies.'},
            {name:'Live Cattle',pattern:'Grilling season demand (Memorial Day to Labor Day) supports prices. Holiday demand in Q4. Watch USDA cattle on feed reports.'},
          ].map(c=>(
            <div key={c.name} style={{borderTop:`1px solid ${C.border2}`,padding:'16px 0'}}>
              <p style={{fontSize:14,color:C.gold,margin:'0 0 6px'}}>{c.name}</p>
              <p style={{fontSize:12,color:C.muted,lineHeight:1.7,margin:0}}>{c.pattern}</p>
            </div>
          ))}
        </div>
      )}

      {section==='glossary' && (
        <div>
          <Label>TRADING GLOSSARY</Label>
          <div style={{display:'grid',gap:4}}>
            {glossaryTerms.map(t=>(
              <div key={t.term} style={{borderLeft:`2px solid ${C.gold}`,paddingLeft:16,paddingTop:12,paddingBottom:12}}>
                <p style={{fontSize:13,color:C.gold,margin:'0 0 4px',fontWeight:400}}>{t.term}</p>
                <p style={{fontSize:12,color:C.muted,lineHeight:1.7,margin:0}}>{t.def}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
