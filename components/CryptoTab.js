'use client'
import React, { useState, useEffect } from 'react'

const TH = { fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '4px 6px', borderBottom: '0.5px solid var(--border)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.04em' }
const TD = { fontSize: 11, padding: '4px 6px', borderBottom: '0.5px solid var(--border)', verticalAlign: 'middle', color: 'var(--text)' }

function usePrices(symbols) {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch(`/api/prices?symbols=${symbols.join(',')}`)
      .then(r => r.json()).then(d => { setPrices(d || {}); setLoading(false) }).catch(() => setLoading(false))
  }, [symbols.join(',')])
  return { prices, loading }
}

const CRYPTO_GROUPS = [
  { name: 'Layer 1', pill: { bg: '#faeeda', color: '#633806' }, coins: [
    { sym: 'BTC-USD', label: 'Bitcoin',   ticker: 'BTC', cap: '$1.35T', onchain: [{ label: 'ETF flows', val: '+$124M', up: true }, { label: 'Hash rate', val: '628 EH/s', up: true }] },
    { sym: 'ETH-USD', label: 'Ethereum',  ticker: 'ETH', cap: '$419B',  onchain: [{ label: 'Staked',   val: '28.4%',  up: true }, { label: 'Gas',       val: '18 gwei', up: null }] },
    { sym: 'SOL-USD', label: 'Solana',    ticker: 'SOL', cap: '$78B',   onchain: [{ label: 'TPS',      val: '4,200',  up: true }, { label: 'Validators',val: '1,900',   up: null }] },
    { sym: 'ADA-USD', label: 'Cardano',   ticker: 'ADA', cap: '$18B',   onchain: [{ label: 'Staked',   val: '62%',    up: null }, { label: 'DApps',     val: '148',     up: null }] },
    { sym: 'AVAX-USD',label: 'Avalanche', ticker: 'AVAX',cap: '$14B',   onchain: [{ label: 'Subnets',  val: '144',    up: true }, { label: 'TPS',       val: '4,500',   up: null }] },
  ]},
  { name: 'DeFi', pill: { bg: '#e1f5ee', color: '#085041' }, coins: [
    { sym: 'UNI-USD', label: 'Uniswap',  ticker: 'UNI', cap: '$5.3B', onchain: [{ label: 'TVL', val: '$6.2B', up: true }] },
    { sym: 'AAVE-USD',label: 'Aave',     ticker: 'AAVE',cap: '$1.7B', onchain: [{ label: 'TVL', val: '$11.4B',up: true }] },
    { sym: 'LINK-USD',label: 'Chainlink',ticker: 'LINK',cap: '$8.8B', onchain: [{ label: 'Feeds',val: '1,200',up: null }] },
  ]},
  { name: 'Large caps', pill: { bg: '#eeedfe', color: '#3C3489' }, coins: [
    { sym: 'BNB-USD', label: 'BNB Chain',ticker: 'BNB', cap: '$83B',  onchain: [{ label: 'TPS', val: '300',   up: null }] },
    { sym: 'XRP-USD', label: 'Ripple',   ticker: 'XRP', cap: '$30B',  onchain: [{ label: 'TPS', val: '1,500', up: null }] },
    { sym: 'DOGE-USD',label: 'Dogecoin', ticker: 'DOGE',cap: '$22B',  onchain: [{ label: 'Tx/day',val: '88K', up: null }] },
    { sym: 'DOT-USD', label: 'Polkadot', ticker: 'DOT', cap: '$12B',  onchain: [{ label: 'Parachains',val: '47',up: null }] },
  ]},
  { name: 'AI / Infrastructure', pill: { bg: '#fcebeb', color: '#791F1F' }, coins: [
    { sym: 'FET-USD',  label: 'Fetch.ai',   ticker: 'FET',  cap: '$3.2B', onchain: [{ label: 'Agents', val: '12K', up: true }] },
    { sym: 'RNDR-USD', label: 'Render',      ticker: 'RNDR', cap: '$4.1B', onchain: [{ label: 'Nodes',  val: '8.4K',up: true }] },
    { sym: 'WLD-USD',  label: 'Worldcoin',   ticker: 'WLD',  cap: '$1.8B', onchain: [{ label: 'Users',  val: '6.2M',up: true }] },
  ]},
]

const ALL_SYMS = CRYPTO_GROUPS.flatMap(g => g.coins.map(c => c.sym))

const ETF_FLOWS = [
  { name: 'BlackRock IBIT',  flows7d: '+$312M', up: true  },
  { name: 'Fidelity FBTC',   flows7d: '+$188M', up: true  },
  { name: 'ARK 21Shares',    flows7d: '+$44M',  up: true  },
  { name: 'Grayscale GBTC',  flows7d: '-$244M', up: false },
  { name: 'Bitwise BITB',    flows7d: '+$88M',  up: true  },
]

const ONCHAIN_BTC = [
  { label: 'Exchange reserves',   val: '▼ Falling',   color: '#16a34a', note: 'Bullish — coins leaving exchanges' },
  { label: 'Long-term holders',   val: '+2.4% / mo',  color: '#16a34a', note: 'Accumulation phase continues' },
  { label: 'Hash rate',           val: '628 EH/s',    color: '#16a34a', note: 'All-time high — network security peak' },
  { label: 'SOPR ratio',          val: '1.02',        color: '#16a34a', note: 'Profitable sells — healthy market' },
  { label: 'Miner revenue',       val: '$44M / day',  color: 'var(--text)',   note: 'Post-halving revenue stabilizing' },
  { label: 'Funding rates',       val: '+0.012%',     color: '#b45309', note: 'Slightly elevated — watch for liquidations' },
]

const CATALYSTS = [
  { name: 'ETH ETF decision',   date: 'May 23', urgency: 'high'   },
  { name: 'BTC options expiry', date: 'May 31', urgency: 'medium' },
  { name: 'SOL validator upgrade',date: 'Jun 4',urgency: 'low'    },
  { name: 'FOMC (crypto impact)',date: 'Jun 12', urgency: 'high'  },
]

export default function CryptoTab() {
  const { prices, loading } = usePrices(ALL_SYMS)
  const [watchlist, setWatchlist] = useState(['BTC-USD', 'ETH-USD', 'SOL-USD'])
  const [selected, setSelected] = useState(null)

  function toggle(sym) { setWatchlist(w => w.includes(sym) ? w.filter(s => s !== sym) : [...w, sym]) }

  const netFlow = ETF_FLOWS.reduce((sum, f) => sum + parseFloat(f.flows7d.replace(/[^-\d.]/g, '')), 0)

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>Crypto</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>BTC · ETH · Alts · DeFi · AI</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Bitcoin',      sym: 'BTC-USD', fallback: '$68,400', fallbackChg: -1.40 },
          { label: 'Ethereum',     sym: 'ETH-USD', fallback: '$3,488',  fallbackChg: -0.88 },
          { label: 'Fear & Greed', sym: null,      fallback: '72',      fallbackChg: null, badge: 'Greed', badgeColor: '#16a34a' },
          { label: 'BTC Dom.',     sym: null,      fallback: '55.4%',   fallbackChg: null },
        ].map(idx => {
          const d = idx.sym ? prices[idx.sym] : null
          const chg = d?.changePct ?? idx.fallbackChg
          const up = chg !== null ? chg >= 0 : null
          return (
            <div key={idx.label} style={{ background: 'var(--surface2)', borderRadius: 7, padding: '8px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{idx.label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: idx.badgeColor || 'var(--text)', marginBottom: 1 }}>
                {d?.price ? `$${d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : idx.fallback}
              </div>
              {up !== null && <div style={{ fontSize: 11, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{chg.toFixed(2)}%</div>}
              {idx.badge && <div style={{ fontSize: 10, color: idx.badgeColor }}>{idx.badge}</div>}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 12, height: 'calc(100vh - 220px)', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', height: '100%' }}>
          {watchlist.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '5px 0 8px', borderBottom: '0.5px solid var(--border)', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Watching</span>
              {watchlist.map(sym => {
                const d = prices[sym]; const up = (d?.changePct || 0) >= 0
                const coin = CRYPTO_GROUPS.flatMap(g => g.coins).find(c => c.sym === sym)
                return (
                  <div key={sym} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, border: '0.5px solid rgba(75,68,200,0.3)', background: 'rgba(75,68,200,0.06)', fontSize: 11 }}>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{coin?.ticker || sym}</span>
                    {d && <span style={{ color: up ? 'var(--green)' : 'var(--red)', fontSize: 10 }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                  </div>
                )
              })}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: 46, ...TH }}>Ticker</th>
                <th style={TH}>Name</th>
                <th style={{ width: 72, ...TH, textAlign: 'center' }}>Price</th>
                <th style={{ width: 58, ...TH, textAlign: 'center' }}>% Chg</th>
                <th style={{ width: 52, ...TH, textAlign: 'center' }}>Mkt Cap</th>
                <th style={{ width: 32, ...TH }}></th>
                <th style={{ width: 190, ...TH, borderLeft: '0.5px solid var(--border2)', paddingLeft: 10 }}>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              {CRYPTO_GROUPS.map(group => (
                <React.Fragment key={group.name}>
                  <tr>
                    <td colSpan={7} style={{ padding: '4px 6px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                      <span style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: group.pill.bg, color: group.pill.color, marginRight: 6 }}>{group.name}</span>
                    </td>
                  </tr>
                  {group.coins.map(coin => {
                    const d = prices[coin.sym]
                    const up = (d?.changePct || 0) >= 0
                    const inWl = watchlist.includes(coin.sym)
                    const isOpen = selected === coin.sym
                    return (
                      <React.Fragment key={coin.sym}>
                        <tr style={{ cursor: 'pointer', background: isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}
                          onClick={() => setSelected(isOpen ? null : coin.sym)}
                          onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'var(--surface2)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isOpen ? 'rgba(75,68,200,0.04)' : 'transparent' }}>
                          <td style={TD}><span style={{ fontWeight: 500 }}>{coin.ticker}</span></td>
                          <td style={{ ...TD, color: 'var(--text-muted)' }}>{coin.label}</td>
                          <td style={{ ...TD, textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                            {loading ? '—' : d?.price ? `$${d.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td style={{ ...TD, textAlign: 'center', fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{d ? `${up ? '+' : ''}${d.changePct?.toFixed(2)}%` : '—'}</td>
                          <td style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>{coin.cap}</td>
                          <td style={{ ...TD, textAlign: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); toggle(coin.sym) }}
                              style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, border: `0.5px solid ${inWl ? 'rgba(75,68,200,0.3)' : 'var(--border2)'}`, background: inWl ? 'rgba(75,68,200,0.1)' : 'transparent', color: inWl ? '#3C3489' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', lineHeight: 1.6 }}>
                              {inWl ? '✓' : '+'}
                            </button>
                          </td>
                          <td style={{ ...TD, borderLeft: '0.5px solid var(--border2)', padding: '4px 10px' }}>
                            {inWl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 5, background: isOpen ? 'rgba(75,68,200,0.08)' : 'var(--surface2)', cursor: 'pointer' }}
                                onClick={e => { e.stopPropagation(); setSelected(isOpen ? null : coin.sym) }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text)' }}>{coin.ticker}</div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{coin.label}</div>
                                </div>
                                {d && <span style={{ fontSize: 10, fontWeight: 500, color: up ? 'var(--green)' : 'var(--red)' }}>{up ? '+' : ''}{d.changePct?.toFixed(2)}%</span>}
                                <button onClick={e => { e.stopPropagation(); toggle(coin.sym) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1 }}>×</button>
                              </div>
                            ) : <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>—</span>}
                          </td>
                        </tr>
                        {isOpen && (
                          <tr>
                            <td colSpan={7} style={{ padding: '10px 14px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{coin.label} · On-chain signals</div>
                              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {coin.onchain.map(oc => (
                                  <div key={oc.label}>
                                    <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{oc.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 500, color: oc.up === true ? 'var(--green)' : oc.up === false ? 'var(--red)' : 'var(--text)' }}>{oc.val}</div>
                                  </div>
                                ))}
                                <div>
                                  <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Market cap</div>
                                  <div style={{ fontSize: 12, fontWeight: 500 }}>{coin.cap}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>On-chain + market intelligence</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>BTC dom: <span style={{ fontWeight: 500 }}>55.4%</span> · ETF net 7d: <span style={{ color: netFlow >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>{netFlow >= 0 ? '+' : ''}${Math.round(netFlow)}M</span></div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#791F1F' }}>BTC on-chain signals</span>
            </div>
            <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
              {ONCHAIN_BTC.map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div style={{ width: 110, flexShrink: 0, fontSize: 10, color: 'var(--text-muted)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: item.color, width: 80, flexShrink: 0 }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', flex: 1, lineHeight: 1.4 }}>{item.note}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3C3489' }}>ETF flows (7-day)</span>
            </div>
            <div style={{ padding: '9px 12px', borderBottom: '0.5px solid var(--border)' }}>
              {ETF_FLOWS.map(f => (
                <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text)' }}>{f.name}</span>
                  <span style={{ fontWeight: 500, color: f.up ? 'var(--green)' : 'var(--red)' }}>{f.flows7d}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0 2px', fontSize: 12 }}>
                <span style={{ fontWeight: 500, color: 'var(--text)' }}>Net 7-day</span>
                <span style={{ fontWeight: 500, color: netFlow >= 0 ? 'var(--green)' : 'var(--red)' }}>{netFlow >= 0 ? '+' : ''}${Math.round(netFlow)}M</span>
              </div>
            </div>
            <div style={{ padding: '5px 12px', background: 'var(--surface2)', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              <span style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Upcoming catalysts</span>
            </div>
            <div style={{ padding: '9px 12px' }}>
              {CATALYSTS.map(c => {
                const bg = c.urgency === 'high' ? 'rgba(220,38,38,0.09)' : c.urgency === 'medium' ? 'rgba(186,117,23,0.1)' : 'var(--surface2)'
                const col = c.urgency === 'high' ? '#791F1F' : c.urgency === 'medium' ? '#633806' : 'var(--text-muted)'
                return (
                  <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                    <span>{c.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 3, background: bg, color: col }}>{c.date}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
