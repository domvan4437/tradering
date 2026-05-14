'use client'
import React, { useState, useEffect } from 'react'

// ─── Static Data ────────────────────────────────────────────────────────────

const WATCHLIST = [
  { name: 'Gold',     sym: 'GC=F',      price: '$2,341.20', pct: +0.42,  mock: +0.42  },
  { name: 'Crude Oil',sym: 'CL=F',      price: '$81.06',    pct: -1.07,  mock: -1.07  },
  { name: 'S&P 500',  sym: 'ES=F',      price: '7,477',     pct: +0.68,  mock: +0.68  },
  { name: 'EUR/USD',  sym: 'EURUSD=X',  price: '1.1680',    pct: -0.50,  mock: -0.50  },
  { name: 'Bitcoin',  sym: 'BTC-USD',   price: '$68,400',   pct: +2.20,  mock: +2.20  },
  { name: 'Wheat',    sym: 'ZW=F',      price: '$674.75',   pct: +1.47,  mock: +1.47  },
  { name: 'Nvidia',   sym: 'NVDA',      price: '$874.30',   pct: +3.80,  mock: +3.80  },
  { name: 'NatGas',   sym: 'NG=F',      price: '$2.88',     pct: +0.88,  mock: +0.88  },
]

const SECTORS = [
  { label: 'Commodities', icon: '◈' },
  { label: 'Futures',     icon: '◎' },
  { label: 'Forex',       icon: '$' },
  { label: 'Stocks',      icon: '⊞' },
  { label: 'Crypto',      icon: '₿' },
]

const TRENDING = [
  { rank: 1, sym: 'Gold',    calls: 47, pct: +0.42 },
  { rank: 2, sym: 'BTC',     calls: 52, pct: -1.40 },
  { rank: 3, sym: 'Crude',   calls: 31, pct: -1.07 },
  { rank: 4, sym: 'Nvidia',  calls: 19, pct: +3.80 },
  { rank: 5, sym: 'EUR/USD', calls: 28, pct: -0.50 },
  { rank: 6, sym: 'Wheat',   calls: 21, pct: +1.47 },
  { rank: 7, sym: 'Silver',  calls: 17, pct: +1.10 },
  { rank: 8, sym: 'Tesla',   calls: 14, pct: -2.10 },
]

const LIVE_ACTIVITY = [
  { type: 'buy',   title: 'Long Gold · $2,340.50 · 2 contracts',   sub: '@TraderMike · Weekly Commodities',    time: 'just now' },
  { type: 'alert', title: 'EUR/USD crossed below 1.1700 support',   sub: 'Price alert triggered for 234 users', time: '1m'       },
  { type: 'sell',  title: 'Short Crude · $81.10 · 3 contracts',     sub: '@FXHunter92 · COT confirmation',      time: '3m'       },
  { type: 'news',  title: 'OPEC+ considering additional output cuts',sub: 'WSJ · Crude, NatGas affected',        time: '5m'       },
  { type: 'buy',   title: 'Long Wheat · $675.00 · 1 contract',      sub: '@GrainTrader · Seasonal breakout',    time: '7m'       },
  { type: 'alert', title: 'NFP release in 24h 40m — vol expected',  sub: 'High-impact event · USD pairs, Indices', time: '12m'  },
  { type: 'sell',  title: 'Short EUR/USD · 1.1695 · 5 lots',        sub: '@ForexPulse · H2H Competition',       time: '15m'      },
  { type: 'buy',   title: 'Long Bitcoin · $68,200 · 0.5 BTC',       sub: '@CryptoEdge · ETF inflow signal',     time: '18m'      },
  { type: 'news',  title: 'Nvidia beats Q2 estimates, guides higher',sub: 'CNBC · Tech, Semis affected',         time: '22m'      },
  { type: 'sell',  title: 'Short NatGas · $2.91 · 4 contracts',     sub: '@EnergyDesk · COT bearish signal',    time: '26m'      },
  { type: 'alert', title: 'Gold broke above $2,340 resistance',      sub: 'Breakout alert · 89 users notified',  time: '31m'      },
  { type: 'buy',   title: 'Long Silver · $29.40 · 3 contracts',      sub: '@MetalsTrader · Momentum play',       time: '35m'      },
]

const NET_POSITIONS = [
  { sym: 'Gold',    long: 72, short: 28  },
  { sym: 'Silver',  long: 65, short: 35  },
  { sym: 'S&P 500', long: 61, short: 39  },
  { sym: 'Wheat',   long: 58, short: 42  },
  { sym: 'Bitcoin', long: 54, short: 46  },
  { sym: 'NatGas',  long: 50, short: 50  },
  { sym: 'Nasdaq',  long: 46, short: 54  },
  { sym: 'Coffee',  long: 40, short: 60  },
  { sym: 'EUR/USD', long: 35, short: 65  },
  { sym: 'Crude',   long: 28, short: 72  },
]

const SELECTED_ASSET = {
  name: 'Gold', sub: 'XAUUSD · Spot · CME',
  price: '$2,341.20', pct: +0.42,
  open: '$2,331.40', high: '$2,349.10', low: '$2,328.70',
  high52: '$2,431.50', low52: '$1,984.30', cot: 'Bullish ↑',
  bars: [42, 50, 37, 60, 55, 66, 53, 74, 70, 80, 88, 100],
}

const STATIC_NEWS = [
  { tag: 'Macro',       headline: 'Fed signals no rate cuts until inflation hits 2% target consistently', source: 'Reuters',   time: '12m' },
  { tag: 'Commodities', headline: 'Gold surges to 3-week high as dollar weakens on jobs data miss',       source: 'Bloomberg', time: '34m' },
  { tag: 'Energy',      headline: 'OPEC+ considering additional output cuts amid demand concerns',         source: 'WSJ',       time: '1h'  },
  { tag: 'Forex',       headline: 'EUR/USD breaks above 1.09 resistance on ECB hawkish comments',         source: 'FXStreet',  time: '1h'  },
  { tag: 'Grains',      headline: 'Wheat rallies 2% after Black Sea shipping disruption reports',          source: 'Reuters',   time: '2h'  },
  { tag: 'Stocks',      headline: 'Nvidia beats earnings estimates, guidance raised for Q3',               source: 'CNBC',      time: '2h'  },
  { tag: 'Crypto',      headline: 'Bitcoin holds $68k support as ETF inflows hit weekly high',             source: 'CoinDesk',  time: '3h'  },
  { tag: 'Macro',       headline: 'US jobless claims rise slightly, labor market remains tight',            source: 'AP',        time: '3h'  },
  { tag: 'COT',         headline: 'Silver COT positioning at 18-month extreme — watch for reversal',       source: 'TradeRing', time: '4h'  },
  { tag: 'Grains',      headline: 'Corn planting progress ahead of schedule, bearish for prices',          source: 'USDA',      time: '5h'  },
  { tag: 'Forex',       headline: 'Japanese yen hits fresh lows as BOJ holds ultra-loose policy',          source: 'Reuters',   time: '5h'  },
  { tag: 'Energy',      headline: 'Crude oil inventories draw larger than expected — bullish signal',      source: 'EIA',       time: '6h'  },
  { tag: 'Commodities', headline: 'Copper demand outlook raised on China infrastructure spending',          source: 'Reuters',   time: '7h'  },
  { tag: 'Stocks',      headline: 'S&P 500 approaches record high as earnings season beats estimates',     source: 'CNBC',      time: '8h'  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

const PURPLE      = '#4B44C8'

const TAG_COLORS = {
  Macro: { bg: 'rgba(75,68,200,0.13)', color: '#3D37A8' },
  Commodities: { bg: 'rgba(186,117,23,0.13)', color: '#854F0B' },
  Energy: { bg: 'rgba(22,163,74,0.11)', color: '#15803d' },
  Forex: { bg: 'rgba(14,165,233,0.12)', color: '#0369a1' },
  Grains: { bg: 'rgba(234,152,0,0.12)', color: '#92400e' },
  Stocks: { bg: 'rgba(99,153,34,0.13)', color: '#3B6D11' },
  Crypto: { bg: 'rgba(220,38,38,0.09)', color: '#991b1b' },
  COT: { bg: 'rgba(75,68,200,0.1)', color: '#4B44C8' },
}

const ACTIVITY_ICON = {
  buy:   { bg: 'rgba(22,163,74,0.1)',   color: '#16a34a', symbol: '▲' },
  sell:  { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626', symbol: '▼' },
  alert: { bg: 'rgba(75,68,200,0.12)',  color: PURPLE,    symbol: '!' },
  news:  { bg: 'rgba(14,165,233,0.11)', color: '#0369a1', symbol: '◎' },
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: '0.5px', background: 'var(--border)', margin: '9px 0' }} />
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, ...style,
    }}>
      {children}
    </div>
  )
}

function LeftPanel({ selectedAsset, onSelectAsset, onSelect }) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      borderRight: '0.5px solid var(--border)',
      padding: 11, paddingTop: 14, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', height: '100%',
    }}>
      <SectionLabel>My Watchlist</SectionLabel>
      {WATCHLIST.map(item => (
        <div
          key={item.sym}
          onClick={() => onSelectAsset && onSelectAsset(item)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '4px 6px', borderRadius: 6, marginBottom: 1, cursor: 'pointer',
            background: selectedAsset?.sym === item.sym ? 'rgba(75,68,200,0.1)' : 'transparent',
          }}
          onMouseEnter={e => { if (selectedAsset?.sym !== item.sym) e.currentTarget.style.background = 'var(--surface2)' }}
          onMouseLeave={e => { if (selectedAsset?.sym !== item.sym) e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{item.name}</span>
          <span style={{ fontSize: 11, fontWeight: 500, color: item.pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {item.price}
          </span>
        </div>
      ))}

      <Divider />
      <SectionLabel>Sectors</SectionLabel>
      {SECTORS.map(s => (
        <div
          key={s.label}
          style={{
            display: 'flex', alignItems: 'center', padding: '4px 6px',
            borderRadius: 6, marginBottom: 1, cursor: 'pointer',
            fontSize: 12, color: 'var(--text-muted)',
          }}
          onClick={() => onSelect && onSelect(s.label.toLowerCase())}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ marginRight: 7, fontSize: 13, opacity: 0.7 }}>{s.icon}</span>
          {s.label}
        </div>
      ))}

      <Divider />
      <SectionLabel>Trending now</SectionLabel>
      {TRENDING.map(t => (
        <div key={t.rank} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 6px', borderBottom: '0.5px solid var(--border)',
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 13, flexShrink: 0 }}>{t.rank}</span>
          <span style={{ fontSize: 11, fontWeight: 500, flex: 1, color: 'var(--text)' }}>{t.sym}</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{t.calls} calls</span>
          <span style={{
            fontSize: 11, fontWeight: 500, width: 36, textAlign: 'right', flexShrink: 0,
            color: t.pct >= 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {t.pct >= 0 ? '+' : ''}{t.pct.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  )
}

function MiniChart({ bars }) {
  const max = Math.max(...bars)
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 2, height: 72,
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          borderRadius: '2px 2px 0 0', flex: 1,
          height: `${(h / max) * 100}%`,
          background: i === bars.length - 1 ? PURPLE : `rgba(75,68,200,0.25)`,
        }} />
      ))}
    </div>
  )
}

function StatPill({ label, value, valueColor }) {
  return (
    <div style={{
      background: 'var(--surface2)', borderRadius: 5, padding: '5px 7px',
    }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 500, marginTop: 1, color: valueColor || 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function ActivityIcon({ type }) {
  const cfg = ACTIVITY_ICON[type] || ACTIVITY_ICON.alert
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: cfg.bg, color: cfg.color, fontSize: 10, marginTop: 1,
      fontWeight: 700,
    }}>
      {cfg.symbol}
    </div>
  )
}

function MainPanel({ asset, onOpenChart }) {
  const isUp = asset.pct >= 0
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: 11, paddingTop: 14,
      display: 'flex', flexDirection: 'column', gap: 9,
      borderRight: '0.5px solid var(--border)',
      overflowY: 'auto', overflowX: 'hidden', minHeight: 0, overflowX: 'hidden',
    }}>
      {/* Asset header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{asset.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{asset.sub}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 19, fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)' }}>
            {asset.price}
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, color: isUp ? 'var(--green)' : 'var(--red)', marginTop: 1 }}>
            {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{asset.pct.toFixed(2)}% today
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{
        background: 'var(--surface2)', borderRadius: 7,
        padding: '7px 8px 6px', position: 'relative',
      }}>
        <MiniChart bars={asset.bars} />
        <button
          onClick={() => onOpenChart && onOpenChart(asset)}
          style={{
            position: 'absolute', top: 6, right: 6,
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 4, padding: '2px 6px', fontSize: 9,
            color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1.4,
            fontFamily: 'var(--font)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = PURPLE; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = PURPLE }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          ↗ Full chart
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 5 }}>
        <StatPill label="Open"     value={asset.open} />
        <StatPill label="High"     value={asset.high}   valueColor="var(--green)" />
        <StatPill label="Low"      value={asset.low}    valueColor="var(--red)" />
        <StatPill label="52W High" value={asset.high52} />
        <StatPill label="52W Low"  value={asset.low52} />
        <StatPill label="COT Signal" value={asset.cot} valueColor="var(--green)" />
      </div>

      {/* Live Activity */}
      <div style={{ height: '0.5px', background: 'var(--border)', margin: '3px 0' }} />
      <SectionLabel>Live activity</SectionLabel>
      <div>
        {LIVE_ACTIVITY.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 7,
            padding: '5px 0', borderBottom: i < LIVE_ACTIVITY.length - 1 ? '0.5px solid var(--border)' : 'none',
          }}>
            <ActivityIcon type={item.type} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 500, lineHeight: 1.3,
                color: item.type === 'buy' ? 'var(--green)' : item.type === 'sell' ? 'var(--red)' : 'var(--text)',
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{item.sub}</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {item.time}
            </div>
          </div>
        ))}
      </div>

      {/* Net Positions */}
      <div style={{ height: '0.5px', background: 'var(--border)', margin: '3px 0' }} />
      <SectionLabel>Net positions</SectionLabel>
      <div>
        {NET_POSITIONS.map((p, i) => {
          const net = p.long - p.short
          return (
            <div key={p.sym} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 0', borderBottom: i < NET_POSITIONS.length - 1 ? '0.5px solid var(--border)' : 'none',
            }}>
              <span style={{ fontSize: 11, fontWeight: 500, width: 50, flexShrink: 0, color: 'var(--text)' }}>
                {p.sym}
              </span>
              <div style={{
                flex: 1, height: 5, background: 'var(--border)',
                borderRadius: 3, overflow: 'hidden', display: 'flex',
              }}>
                <div style={{ width: `${p.long}%`, height: '100%', background: '#16a34a' }} />
                <div style={{ width: `${p.short}%`, height: '100%', background: '#dc2626' }} />
              </div>
              <span style={{
                fontSize: 10, width: 32, textAlign: 'right', flexShrink: 0,
                color: net > 0 ? 'var(--green)' : net < 0 ? 'var(--red)' : 'var(--text-muted)',
              }}>
                {net > 0 ? '+' : ''}{net}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NewsSidebar() {
  const [filter, setFilter] = useState('All')
  const [news, setNews] = useState(STATIC_NEWS)

  useEffect(() => {
    fetch('/api/news?category=all&limit=20')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d) && d.length > 0) setNews(d) })
      .catch(() => {})
  }, [])

  const TABS = ['All', 'Macro', 'Commod', 'Forex', 'COT']
  const filterMap = { All: null, Commod: 'Commodities' }
  const filtered = filter === 'All' ? news : news.filter(n => n.tag === (filterMap[filter] || filter))

  return (
    <div style={{
      width: 440, flexShrink: 0, padding: 11, paddingTop: 14,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden', minHeight: 0, overflowX: 'hidden',
    }}>
      <SectionLabel style={{ marginBottom: 7 }}>Market News</SectionLabel>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 9,
        border: '0.5px solid var(--border)', borderRadius: 5, overflow: 'hidden', width: 'fit-content',
      }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              fontSize: 10, padding: '3px 8px', cursor: 'pointer',
              color: filter === t ? '#fff' : 'var(--text-muted)',
              background: filter === t ? PURPLE : 'var(--surface2)',
              fontWeight: filter === t ? 500 : 400,
              border: 'none', fontFamily: 'var(--font)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* News items */}
      {filtered.map((item, i) => {
        const tc = TAG_COLORS[item.tag] || TAG_COLORS.Macro
        return (
          <div key={i} style={{
            padding: '7px 0',
            borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              <span style={{
                fontSize: 9, fontWeight: 500, padding: '1px 5px',
                borderRadius: 3, background: tc.bg, color: tc.color,
              }}>
                {item.tag}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>{item.time}</span>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500, color: 'var(--text)',
              lineHeight: 1.35, marginBottom: 2,
            }}>
              {item.headline}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.source}</div>
          </div>
        )
      })}
    </div>
  )
}


// ─── Root Component ──────────────────────────────────────────────────────────

export default function MarketOverview({ onSelect }) {
  const [selectedAsset, setSelectedAsset] = useState({
    ...WATCHLIST[0],
    sub: 'XAUUSD · Spot · CME',
    open: '$2,331.40', high: '$2,349.10', low: '$2,328.70',
    high52: '$2,431.50', low52: '$1,984.30', cot: 'Bullish ↑',
    bars: [42, 50, 37, 60, 55, 66, 53, 74, 70, 80, 88, 100],
  })

  function handleSelectAsset(item) {
    setSelectedAsset({
      ...item,
      sub: item.sym + ' · Spot',
      open: item.price, high: item.price, low: item.price,
      high52: item.price, low52: item.price,
      cot: item.pct >= 0 ? 'Bullish ↑' : 'Bearish ↓',
      bars: [42, 50, 37, 60, 55, 66, 53, 74, 70, 80, 88, 100].map(
        v => Math.max(20, Math.min(100, v + (Math.random() * 20 - 10)))
      ),
    })
  }

  function handleOpenChart(asset) {
    if (onSelect) onSelect('charts', asset.sym)
  }

  return (
    <div style={{
      fontFamily: 'var(--font)', color: 'var(--text)',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 82px)', overflow: 'hidden', marginTop: 82,
    }}>
      {/* purple ticker removed */}

      {/* 3-column body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <LeftPanel selectedAsset={selectedAsset} onSelectAsset={handleSelectAsset} onSelect={onSelect} />
        <MainPanel asset={selectedAsset} onOpenChart={handleOpenChart} />
        <NewsSidebar />
      </div>
    </div>
  )
}
