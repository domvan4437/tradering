'use client'
import React, { useState, useEffect } from 'react'

const STATIC_EVENTS = [
  { label:'CPI', time:'8:30am', impact:'HIGH', countdown: 43 },
  { label:'Jobless Claims', time:'8:30am', impact:'MED', countdown: 43 },
  { label:'Fed Speak', time:'2:00pm', impact:'LOW', countdown: 330 },
  { label:'NFP', time:'8:30am', impact:'HIGH', countdown: 1480 },
]

const MARKETS = [
  {
    key: 'commodities', label: 'Commodities', sub: 'Metals · Energy · Grains',
    cotScore: 28, cotLabel: 'COT BULLISH', cotColor: '#16a34a',
    assets: [
      { name:'Gold',      sym:'GC=F',     mock: +0.40 },
      { name:'Crude Oil', sym:'CL=F',     mock: -1.27 },
      { name:'Nat Gas',   sym:'NG=F',     mock: +3.21 },
      { name:'Wheat',     sym:'ZW=F',     mock: -0.17 },
      { name:'Silver',    sym:'SI=F',     mock: +1.10 },
    ],
    trending: 'Gold · 47 calls',
  },
  {
    key: 'futures', label: 'Futures', sub: 'Index · Rates · FX',
    cotScore: 62, cotLabel: 'COT NEUTRAL', cotColor: '#d97706',
    assets: [
      { name:'S&P 500', sym:'ES=F',  mock: +0.31 },
      { name:'Nasdaq',  sym:'NQ=F',  mock: +0.44 },
      { name:'T-Bond',  sym:'ZB=F',  mock: +0.12 },
      { name:'Russell', sym:'RTY=F', mock: -0.08 },
      { name:'Dow',     sym:'YM=F',  mock: +0.18 },
    ],
    trending: 'ES · 31 calls',
  },
  {
    key: 'forex', label: 'Forex', sub: 'Majors · Crosses',
    cotScore: 82, cotLabel: 'COT BEARISH', cotColor: '#dc2626',
    assets: [
      { name:'EUR/USD', sym:'EURUSD=X', mock: +0.39 },
      { name:'GBP/USD', sym:'GBPUSD=X', mock: +0.31 },
      { name:'USD/JPY', sym:'USDJPY=X', mock: -0.44 },
      { name:'AUD/USD', sym:'AUDUSD=X', mock: +0.21 },
      { name:'USD/CAD', sym:'USDCAD=X', mock: -0.09 },
    ],
    trending: 'EUR/USD · 28 calls',
  },
  {
    key: 'stocks', label: 'Stocks', sub: 'NYSE · NASDAQ',
    cotScore: 51, cotLabel: 'COT NEUTRAL', cotColor: '#d97706',
    assets: [
      { name:'Apple',  sym:'AAPL', mock: +1.24 },
      { name:'Nvidia', sym:'NVDA', mock: +3.84 },
      { name:'MSFT',   sym:'MSFT', mock: +0.62 },
      { name:'JPM',    sym:'JPM',  mock: -0.38 },
      { name:'Tesla',  sym:'TSLA', mock: -2.11 },
    ],
    trending: 'Nvidia · 19 calls',
  },
  {
    key: 'crypto', label: 'Crypto', sub: 'BTC · ETH · Alts',
    cotScore: 74, cotLabel: 'COT NEUTRAL', cotColor: '#d97706',
    assets: [
      { name:'Bitcoin',  sym:'BTC-USD', mock: +2.18 },
      { name:'Ethereum', sym:'ETH-USD', mock: +1.74 },
      { name:'Solana',   sym:'SOL-USD', mock: +1.32 },
      { name:'BNB',      sym:'BNB-USD', mock: -0.55 },
      { name:'XRP',      sym:'XRP-USD', mock: +0.91 },
    ],
    trending: 'BTC · 52 calls',
  },
]

const HEAT_ASSETS = [
  { name:'Gold',    pct:+0.4 }, { name:'Crude',   pct:-1.3 },
  { name:'NatGas',  pct:+3.2 }, { name:'Wheat',   pct:-0.2 },
  { name:'Silver',  pct:+1.1 }, { name:'S&P',     pct:+0.3 },
  { name:'Bitcoin', pct:+2.2 }, { name:'Nasdaq',  pct:+0.4 },
  { name:'EUR/USD', pct:+0.4 }, { name:'USD/JPY', pct:-0.4 },
  { name:'Tesla',   pct:-2.1 }, { name:'Nvidia',  pct:+3.8 },
  { name:'Corn',    pct:+0.6 }, { name:'Coffee',  pct:-0.8 },
]

const STATIC_NEWS = [
  { headline:'Fed signals no rate cuts until inflation hits 2% target consistently', source:'Reuters', time:'12m ago', impact:'HIGH', tag:'Macro' },
  { headline:'Gold surges to 3-week high as dollar weakens on jobs data miss', source:'Bloomberg', time:'34m ago', impact:'HIGH', tag:'Commodities' },
  { headline:'OPEC+ considering additional output cuts amid demand concerns', source:'WSJ', time:'1h ago', impact:'HIGH', tag:'Energy' },
  { headline:'EUR/USD breaks above 1.09 resistance on ECB hawkish comments', source:'FXStreet', time:'1h ago', impact:'MED', tag:'Forex' },
  { headline:'Wheat rallies 2% after Black Sea shipping disruption reports', source:'Reuters', time:'2h ago', impact:'MED', tag:'Grains' },
  { headline:'Nvidia beats earnings estimates, guidance raised for Q3', source:'CNBC', time:'2h ago', impact:'MED', tag:'Stocks' },
  { headline:'Bitcoin holds $68k support as ETF inflows hit weekly high', source:'CoinDesk', time:'3h ago', impact:'LOW', tag:'Crypto' },
  { headline:'US jobless claims rise slightly, labor market remains tight', source:'AP', time:'3h ago', impact:'MED', tag:'Macro' },
  { headline:'Silver COT positioning at 18-month extreme — watch for reversal', source:'TradeRing', time:'4h ago', impact:'HIGH', tag:'COT' },
  { headline:'Corn planting progress ahead of schedule, bearish for prices', source:'USDA', time:'5h ago', impact:'MED', tag:'Grains' },
  { headline:'Japanese yen hits fresh lows as BOJ holds ultra-loose policy', source:'Reuters', time:'5h ago', impact:'MED', tag:'Forex' },
  { headline:'Crude oil inventories draw larger than expected — bullish signal', source:'EIA', time:'6h ago', impact:'HIGH', tag:'Energy' },
  { headline:'Copper demand outlook raised on China infrastructure spending', source:'Reuters', time:'7h ago', impact:'MED', tag:'Commodities' },
  { headline:'S&P 500 approaches record high as earnings season beats estimates', source:'CNBC', time:'8h ago', impact:'MED', tag:'Stocks' },
]

function heatColor(pct) {
  if (pct > 2)    return '#14532d'
  if (pct > 0.5)  return '#166534'
  if (pct > 0)    return '#16a34a'
  if (pct > -0.5) return '#b91c1c'
  if (pct > -2)   return '#991b1b'
  return '#7f1d1d'
}

function fmtCountdown(mins) {
  if (mins < 60) return mins + 'm'
  const h = Math.floor(mins / 60), m = mins % 60
  return h + 'h' + (m ? ' ' + m + 'm' : '')
}

function impactColor(impact) {
  if (impact === 'HIGH') return '#dc2626'
  if (impact === 'MED')  return '#d97706'
  return '#6b7280'
}

function tagColor(tag) {
  const map = {
    Macro:'#6366f1', Commodities:'#d97706', Energy:'#0ea5e9',
    Forex:'#8b5cf6', Grains:'#16a34a', Stocks:'#ec4899',
    Crypto:'#f59e0b', COT:'#14b8a6',
  }
  return map[tag] || '#6b7280'
}

function WeekBars({ bars }) {
  return (
    <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:14 }}>
      {bars.map((v,i) => (
        <div key={i} style={{ width:4, height: v > 0 ? 9 : 5, borderRadius:1, background: v > 0 ? '#16a34a' : '#dc2626', opacity:0.85 }} />
      ))}
    </div>
  )
}

function COTBar({ score, label, color }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3, minWidth:90 }}>
      <div style={{ height:3, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ width: score + '%', height:'100%', background:color, borderRadius:2 }} />
      </div>
      <span style={{ fontSize:9, fontWeight:700, color, letterSpacing:'0.08em' }}>{label}</span>
    </div>
  )
}

function AssetChip({ asset, livePrices }) {
  const live = livePrices && livePrices[asset.sym]
  const pct  = (live && live.changePct != null) ? live.changePct : asset.mock
  const up   = pct >= 0
  const bars = [up?1:-1, up?1:-1, up?-1:1, up?1:-1, up?1:1]
  return (
    <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'6px 9px', minWidth:72, flexShrink:0 }}>
      <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{asset.name}</div>
      <div style={{ fontSize:12, fontWeight:700, color: up ? 'var(--green)' : 'var(--red)', fontFamily:'var(--font-mono)' }}>
        {up ? '+' : ''}{pct.toFixed(2)}%
      </div>
      <div style={{ marginTop:3 }}><WeekBars bars={bars} /></div>
    </div>
  )
}

function MarketRow({ market, onSelect, livePrices }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={() => onSelect && onSelect(market.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--surface2)' : 'var(--surface)',
        border:'1px solid var(--border)', borderRadius:12,
        padding:'13px 15px', cursor:'pointer',
        transition:'background 0.15s',
        display:'flex', alignItems:'center', gap:14,
      }}
    >
      <div style={{ minWidth:115, flexShrink:0 }}>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{market.label}</div>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:7 }}>{market.sub}</div>
        <COTBar score={market.cotScore} label={market.cotLabel} color={market.cotColor} />
      </div>
      <div style={{ display:'flex', gap:5, flex:1, overflowX:'auto', paddingBottom:2 }}>
        {market.assets.map(a => <AssetChip key={a.sym} asset={a} livePrices={livePrices} />)}
      </div>
      <div style={{ flexShrink:0, textAlign:'right', minWidth:95 }}>
        <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:2 }}>Trending</div>
        <div style={{ fontSize:11, fontWeight:600, color:'var(--accent)', marginBottom:4 }}>{market.trending}</div>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontWeight:600 }}>Open →</span>
      </div>
    </div>
  )
}

function NewsSidebar({ news }) {
  const [filter, setFilter] = useState('All')
  const tags = ['All','Macro','Commodities','Energy','Forex','Grains','Stocks','Crypto','COT']
  const filtered = filter === 'All' ? news : news.filter(n => n.tag === filter)
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', height:'100%' }}>
      {/* sticky header inside sidebar */}
      <div style={{ padding:'12px 14px 8px', borderBottom:'1px solid var(--border)', flexShrink:0, position:'sticky', top:0, background:'var(--surface)', zIndex:10 }}>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:8 }}>Market News</div>
        <div style={{ display:'flex', gap:4, overflowX:'auto', paddingBottom:2 }}>
          {tags.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding:'3px 8px', borderRadius:20, flexShrink:0,
              border: filter===t ? 'none' : '1px solid var(--border)',
              background: filter===t ? tagColor(t==='All' ? 'Macro' : t) : 'transparent',
              color: filter===t ? '#fff' : 'var(--text-muted)',
              fontSize:10, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)',
            }}>{t}</button>
          ))}
        </div>
      </div>
      {/* scrollable news list */}
      <div style={{ overflowY:'auto', flex:1 }}>
        {filtered.map((item, i) => (
          <div key={i}
            style={{ padding:'11px 14px', borderBottom:'1px solid var(--border)', borderLeft: item.impact==='HIGH' ? '3px solid #dc2626' : '3px solid transparent', cursor:'pointer', transition:'background 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
              <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3, background: tagColor(item.tag) + '22', color: tagColor(item.tag), letterSpacing:'0.06em' }}>{item.tag}</span>
              <span style={{ fontSize:10, color:'var(--text-dim)', marginLeft:'auto' }}>{item.time}</span>
            </div>
            <div style={{ fontSize:12, color:'var(--text)', lineHeight:1.5, marginBottom:3 }}>{item.headline}</div>
            <div style={{ fontSize:10, color:'var(--text-muted)' }}>{item.source}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MarketOverview({ onSelect }) {
  const [livePrices, setLivePrices] = useState(null)
  const [news, setNews] = useState(STATIC_NEWS)

  useEffect(() => {
    const all = MARKETS.flatMap(m => m.assets.map(a => a.sym)).join(',')
    fetch('/api/prices?symbols=' + all)
      .then(r => r.json()).then(d => setLivePrices(d)).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/news?category=all&limit=20')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setNews(d) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ fontFamily:'var(--font)', color:'var(--text)', display:'flex', gap:20, height:'calc(100vh - 110px)', overflow:'hidden' }}>

      {/* LEFT 65% — independently scrollable */}
      <div style={{ flex:'0 0 65%', minWidth:0, overflowY:'auto', paddingRight:4, paddingBottom:40 }}>

        {/* Economic calendar strip */}
        <div style={{ display:'flex', overflowX:'auto', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, marginBottom:18 }}>
          <div style={{ padding:'10px 14px', fontSize:10, fontWeight:700, letterSpacing:'0.12em', color:'var(--text-muted)', flexShrink:0, display:'flex', alignItems:'center' }}>TODAY</div>
          {STATIC_EVENTS.map((ev, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 14px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4, background: impactColor(ev.impact) + '22', color: impactColor(ev.impact), letterSpacing:'0.08em' }}>{ev.impact}</span>
              <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{ev.label}</span>
              <span style={{ fontSize:11, color:'var(--text-muted)' }}>— {ev.time}</span>
              <span style={{ fontSize:11, fontWeight:700, color: ev.impact==='HIGH' ? '#dc2626' : 'var(--text-muted)' }}>{fmtCountdown(ev.countdown)}</span>
            </div>
          ))}
        </div>

        {/* Heat map */}
        <div style={{ marginBottom:18 }}>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase' }}>Today's Heat Map</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 }}>
            {HEAT_ASSETS.map(a => (
              <div key={a.name} style={{ background: heatColor(a.pct), borderRadius:8, padding:'9px 6px', textAlign:'center', cursor:'pointer' }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#fff', marginBottom:2 }}>{a.name}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'#fff', fontFamily:'var(--font-mono)' }}>{a.pct > 0 ? '+' : ''}{a.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Market rows */}
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.14em', color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase' }}>Markets</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {MARKETS.map(m => <MarketRow key={m.key} market={m} onSelect={onSelect} livePrices={livePrices} />)}
        </div>
      </div>

      {/* RIGHT 35% — independently scrollable */}
      <div style={{ flex:'0 0 35%', minWidth:0, overflowY:'auto' }}>
        <NewsSidebar news={news} />
      </div>

    </div>
  )
}
