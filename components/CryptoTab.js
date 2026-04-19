
'use client';
import { useState, useEffect, useCallback } from 'react';

// Top 50 crypto assets — Yahoo Finance format (symbol + -USD)
// Your fetchPrices already handles -USD suffix as crypto type
const CRYPTO_ASSETS = [
  { sym: 'BTC-USD',  name: 'Bitcoin',          cat: 'Layer 1' },
  { sym: 'ETH-USD',  name: 'Ethereum',          cat: 'Layer 1' },
  { sym: 'BNB-USD',  name: 'BNB',               cat: 'Exchange' },
  { sym: 'SOL-USD',  name: 'Solana',            cat: 'Layer 1' },
  { sym: 'XRP-USD',  name: 'XRP',               cat: 'Payments' },
  { sym: 'USDC-USD', name: 'USD Coin',           cat: 'Stablecoin' },
  { sym: 'ADA-USD',  name: 'Cardano',           cat: 'Layer 1' },
  { sym: 'AVAX-USD', name: 'Avalanche',          cat: 'Layer 1' },
  { sym: 'DOGE-USD', name: 'Dogecoin',           cat: 'Meme' },
  { sym: 'TRX-USD',  name: 'TRON',              cat: 'Layer 1' },
  { sym: 'TON-USD',  name: 'Toncoin',           cat: 'Layer 1' },
  { sym: 'LINK-USD', name: 'Chainlink',          cat: 'Oracle' },
  { sym: 'MATIC-USD',name: 'Polygon',           cat: 'Layer 2' },
  { sym: 'DOT-USD',  name: 'Polkadot',          cat: 'Layer 0' },
  { sym: 'SHIB-USD', name: 'Shiba Inu',          cat: 'Meme' },
  { sym: 'LTC-USD',  name: 'Litecoin',          cat: 'Payments' },
  { sym: 'BCH-USD',  name: 'Bitcoin Cash',       cat: 'Payments' },
  { sym: 'UNI-USD',  name: 'Uniswap',           cat: 'DeFi' },
  { sym: 'XLM-USD',  name: 'Stellar',           cat: 'Payments' },
  { sym: 'ATOM-USD', name: 'Cosmos',             cat: 'Layer 0' },
  { sym: 'XMR-USD',  name: 'Monero',            cat: 'Privacy' },
  { sym: 'ETC-USD',  name: 'Ethereum Classic',   cat: 'Layer 1' },
  { sym: 'FIL-USD',  name: 'Filecoin',          cat: 'Storage' },
  { sym: 'APT-USD',  name: 'Aptos',             cat: 'Layer 1' },
  { sym: 'ARB-USD',  name: 'Arbitrum',          cat: 'Layer 2' },
  { sym: 'OP-USD',   name: 'Optimism',          cat: 'Layer 2' },
  { sym: 'INJ-USD',  name: 'Injective',         cat: 'DeFi' },
  { sym: 'IMX-USD',  name: 'Immutable X',        cat: 'Layer 2' },
  { sym: 'ALGO-USD', name: 'Algorand',           cat: 'Layer 1' },
  { sym: 'VET-USD',  name: 'VeChain',           cat: 'Enterprise' },
  { sym: 'MKR-USD',  name: 'Maker',             cat: 'DeFi' },
  { sym: 'AAVE-USD', name: 'Aave',              cat: 'DeFi' },
  { sym: 'GRT-USD',  name: 'The Graph',          cat: 'Infrastructure' },
  { sym: 'SAND-USD', name: 'The Sandbox',        cat: 'Gaming' },
  { sym: 'AXS-USD',  name: 'Axie Infinity',      cat: 'Gaming' },
  { sym: 'MANA-USD', name: 'Decentraland',       cat: 'Gaming' },
  { sym: 'FTM-USD',  name: 'Fantom',            cat: 'Layer 1' },
  { sym: 'NEAR-USD', name: 'NEAR Protocol',      cat: 'Layer 1' },
  { sym: 'HBAR-USD', name: 'Hedera',            cat: 'Layer 1' },
  { sym: 'QNT-USD',  name: 'Quant',             cat: 'Interoperability' },
  { sym: 'EGLD-USD', name: 'MultiversX',         cat: 'Layer 1' },
  { sym: 'FLOW-USD', name: 'Flow',              cat: 'Layer 1' },
  { sym: 'XTZ-USD',  name: 'Tezos',             cat: 'Layer 1' },
  { sym: 'EOS-USD',  name: 'EOS',              cat: 'Layer 1' },
  { sym: 'THETA-USD',name: 'Theta Network',      cat: 'Infrastructure' },
  { sym: 'KLAY-USD', name: 'Klaytn',            cat: 'Layer 1' },
  { sym: 'ZEC-USD',  name: 'Zcash',             cat: 'Privacy' },
  { sym: 'DASH-USD', name: 'Dash',              cat: 'Payments' },
  { sym: 'COMP-USD', name: 'Compound',          cat: 'DeFi' },
  { sym: 'SNX-USD',  name: 'Synthetix',         cat: 'DeFi' },
];

const CATEGORIES = ['All', 'Layer 1', 'Layer 2', 'DeFi', 'Payments', 'Meme', 'Gaming', 'Privacy', 'Exchange', 'Infrastructure', 'Stablecoin', 'Oracle', 'Storage', 'Layer 0', 'Enterprise', 'Interoperability'];

// Fetch in batches of 10 (your API limit)
async function fetchBatch(symbols) {
  try {
    const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
    const data = await res.json();
    return data.prices || {};
  } catch { return {}; }
}

function formatPrice(p) {
  if (!p || p === 0) return '—';
  if (p >= 1000)  return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (p >= 1)     return p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  if (p >= 0.01)  return p.toFixed(4);
  return p.toFixed(8);
}

function MiniBar({ pct }) {
  const up = pct >= 0;
  const width = Math.min(Math.abs(pct) * 6, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 80 }}>
      <div style={{ flex: 1, height: 3, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`,
          background: up ? 'var(--green)' : 'var(--red)',
          borderRadius: 2,
          marginLeft: up ? 'auto' : 0,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  );
}

export default function CryptoTab() {
  const [prices, setPrices]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [sortBy, setSortBy]         = useState('default'); // default | price | change | name
  const [sortDir, setSortDir]       = useState('desc');
  const [watchlist, setWatchlist]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('cryptoWatchlist') || '[]'); } catch { return []; }
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);

  const loadPrices = useCallback(async () => {
    const allSyms = CRYPTO_ASSETS.map(a => a.sym);
    // Fetch in batches of 10
    const batches = [];
    for (let i = 0; i < allSyms.length; i += 10) {
      batches.push(allSyms.slice(i, i + 10));
    }
    const results = {};
    await Promise.all(batches.map(async batch => {
      const data = await fetchBatch(batch);
      Object.assign(results, data);
    }));
    setPrices(results);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [loadPrices]);

  const toggleWatchlist = (sym) => {
    setWatchlist(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      try { localStorage.setItem('cryptoWatchlist', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  // Filter
  let assets = CRYPTO_ASSETS.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.sym.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || a.cat === category;
    const matchWatch = !showWatchlistOnly || watchlist.includes(a.sym);
    return matchSearch && matchCat && matchWatch;
  });

  // Sort
  assets = [...assets].sort((a, b) => {
    const pa = prices[a.sym], pb = prices[b.sym];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'price') return ((pa?.price || 0) - (pb?.price || 0)) * dir;
    if (sortBy === 'change') return ((pa?.changePercent || 0) - (pb?.changePercent || 0)) * dir;
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    return 0; // default: original order
  });

  // Stats for top bar
  const loaded = CRYPTO_ASSETS.filter(a => prices[a.sym]?.price).length;
  const gainers = CRYPTO_ASSETS.filter(a => (prices[a.sym]?.changePercent || 0) > 0).length;
  const losers  = CRYPTO_ASSETS.filter(a => (prices[a.sym]?.changePercent || 0) < 0).length;
  const btcChange = prices['BTC-USD']?.changePercent;
  const ethChange = prices['ETH-USD']?.changePercent;

  const thStyle = (col) => ({
    fontFamily: 'var(--font)',
    fontSize: 11, fontWeight: 500,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: sortBy === col ? 'var(--accent)' : 'var(--text-muted)',
    padding: '10px 16px',
    textAlign: col === 'price' || col === 'change' ? 'right' : 'left',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top stat strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 12, padding: '20px 24px 0',
      }}>
        {[
          { label: 'Assets tracked', value: `${CRYPTO_ASSETS.length}`, color: 'var(--accent)' },
          { label: 'Prices loaded', value: loading ? '…' : `${loaded}/${CRYPTO_ASSETS.length}`, color: 'var(--text)' },
          { label: 'Gaining', value: loading ? '…' : gainers, color: 'var(--green)' },
          { label: 'Losing', value: loading ? '…' : losers, color: 'var(--red)' },
          { label: 'BTC / ETH', value: loading ? '…' : `${btcChange != null ? (btcChange >= 0 ? '+' : '') + btcChange.toFixed(2) + '%' : '—'} / ${ethChange != null ? (ethChange >= 0 ? '+' : '') + ethChange.toFixed(2) + '%' : '—'}`, color: btcChange >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '14px 16px',
          }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ padding: '16px 24px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search asset or symbol…"
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border2)',
            borderRadius: 6, color: 'var(--text)',
            fontFamily: 'var(--font)', fontSize: 13, padding: '8px 13px',
            outline: 'none', width: 220,
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {['All', 'Layer 1', 'Layer 2', 'DeFi', 'Meme', 'Payments', 'Gaming', 'Privacy'].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              background: category === cat ? 'var(--accent-bg)' : 'transparent',
              border: `1px solid ${category === cat ? 'var(--accent-border)' : 'var(--border2)'}`,
              borderRadius: 5, padding: '5px 12px',
              color: category === cat ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer',
              transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}>{cat}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <button onClick={() => setShowWatchlistOnly(w => !w)} style={{
            background: showWatchlistOnly ? 'var(--accent-bg)' : 'transparent',
            border: `1px solid ${showWatchlistOnly ? 'var(--accent-border)' : 'var(--border2)'}`,
            borderRadius: 5, padding: '5px 12px',
            color: showWatchlistOnly ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer',
          }}>★ Watchlist</button>
          <button onClick={loadPrices} style={{
            background: 'transparent', border: '1px solid var(--border2)',
            borderRadius: 5, padding: '5px 12px',
            color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer',
          }}>↻ Refresh</button>
        </div>
      </div>

      {lastUpdated && (
        <div style={{ padding: '0 24px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
          Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 60s
        </div>
      )}

      {/* ── Table ── */}
      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle(''), width: 40, cursor: 'default' }}>#</th>
                <th style={thStyle('name')} onClick={() => handleSort('name')}>
                  Asset {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ ...thStyle(''), cursor: 'default' }}>Category</th>
                <th style={{ ...thStyle('price'), textAlign: 'right' }} onClick={() => handleSort('price')}>
                  Price {sortBy === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ ...thStyle('change'), textAlign: 'right' }} onClick={() => handleSort('change')}>
                  24h {sortBy === 'change' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th style={{ ...thStyle(''), cursor: 'default', textAlign: 'center' }}>Trend</th>
                <th style={{ ...thStyle(''), cursor: 'default', width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && assets.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ height: 14, background: 'var(--surface2)', borderRadius: 3, width: j === 1 ? 120 : 60, opacity: 0.5 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>
                    No assets match your filters
                  </td>
                </tr>
              ) : (
                assets.map((asset, idx) => {
                  const pd = prices[asset.sym];
                  const price = pd?.price;
                  const change = pd?.changePercent;
                  const up = (change || 0) >= 0;
                  const inWatch = watchlist.includes(asset.sym);

                  return (
                    <tr
                      key={asset.sym}
                      style={{ transition: 'background 0.1s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Rank */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>
                        {CRYPTO_ASSETS.findIndex(a => a.sym === asset.sym) + 1}
                      </td>

                      {/* Name + symbol */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{asset.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                          {asset.sym.replace('-USD', '')}
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                        <span style={{
                          fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          background: 'var(--surface2)', border: '1px solid var(--border)',
                          color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4,
                        }}>{asset.cat}</span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)', textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: price ? 'var(--text)' : 'var(--text-dim)' }}>
                          {price ? `$${formatPrice(price)}` : loading ? '…' : '—'}
                        </span>
                      </td>

                      {/* 24h change */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)', textAlign: 'right' }}>
                        {change != null ? (
                          <span style={{
                            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
                            color: up ? 'var(--green)' : 'var(--red)',
                            background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                            border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
                            padding: '2px 8px', borderRadius: 4,
                          }}>
                            {up ? '+' : ''}{change.toFixed(2)}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>—</span>
                        )}
                      </td>

                      {/* Mini trend bar */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)', textAlign: 'center' }}>
                        <MiniBar pct={change || 0} />
                      </td>

                      {/* Watchlist star */}
                      <td style={{ padding: '13px 16px', borderBottom: '1px solid rgba(0,212,255,0.04)', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleWatchlist(asset.sym)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 15, lineHeight: 1, padding: 4,
                            color: inWatch ? 'var(--accent)' : 'var(--text-dim)',
                            transition: 'color 0.15s',
                          }}
                          title={inWatch ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          {inWatch ? '★' : '☆'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
          Prices via Yahoo Finance fallback · Upgrade to Polygon.io for real-time data · {CRYPTO_ASSETS.length} assets tracked
        </div>
      </div>
    </div>
  );
}
