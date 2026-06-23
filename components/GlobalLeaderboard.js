
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Badge } from './DS';

const ASSET_CLASSES = [
  { value: 'overall',     label: 'Overall' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'forex',       label: 'Forex' },
  { value: 'stocks',      label: 'Stocks' },
  { value: 'crypto',      label: 'Crypto' },
];

const STYLE_LABELS = { scalper:'Scalper', daytrader:'Day Trader', swing:'Swing', position:'Position', macro:'Macro' };

export default function GlobalLeaderboard() {
  const [assetClass, setAssetClass] = useState('overall');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?assetClass=${assetClass}`)
      .then(r => r.json())
      .then(d => { setData(d.leaderboard || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [assetClass]);

  const rankColor = (r) => r === 1 ? 'var(--gold)' : r === 2 ? 'var(--text-secondary)' : r === 3 ? '#cd7f32' : 'var(--text-dim)';
  const rankLabel = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>Global Rankings</div>
        <h1 style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>Verified Trader Leaderboard</h1>
        <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Rankings based on verified, tamper-proof trade records. Public profiles only.
        </p>
      </div>

      {/* Asset class filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {ASSET_CLASSES.map(ac => (
          <button key={ac.value} onClick={() => setAssetClass(ac.value)} style={{
            background: assetClass === ac.value ? 'var(--accent-bg)' : 'var(--surface)',
            border: `1px solid ${assetClass === ac.value ? 'var(--accent-border)' : 'var(--border2)'}`,
            borderRadius: 6, padding: '7px 16px',
            color: assetClass === ac.value ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: assetClass === ac.value ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.12s',
          }}>{ac.label}</button>
        ))}
      </div>

      <Panel>
        <PanelHeader title={`${ASSET_CLASSES.find(a => a.value === assetClass)?.label} leaderboard`} />
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font)', color: 'var(--text-muted)' }}>Loading rankings…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', fontFamily: 'var(--font)', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.2 }}>◎</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No public profiles yet</div>
            <div style={{ fontSize: 12 }}>Be the first to go public and claim the top spot.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Rank','Trader','Style','Trades','Win Rate','Avg R:R','Score'].map(h => (
                  <th key={h} style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 16px', textAlign: h === 'Rank' ? 'center' : 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(entry => (
                <tr key={entry.userId} style={{ transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => entry.profileSlug && window.__goToProfile && window.__goToProfile(entry.profileSlug)}
                >
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: rankColor(entry.rank) }}>
                    {rankLabel(entry.rank)}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{entry.displayName}</div>
                      {entry.verifiedBadge && <span title="Verified Trader" style={{ color: 'var(--accent)', fontSize: 13 }}>✓</span>}
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                    {entry.tradingStyle ? <Badge type="neutral">{STYLE_LABELS[entry.tradingStyle] || entry.tradingStyle}</Badge> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {entry.totalTrades || '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: entry.winRate >= 0.5 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                    {entry.winRate != null ? `${(entry.winRate * 100).toFixed(1)}%` : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {entry.avgRR != null ? entry.avgRR.toFixed(2) : '—'}
                  </td>
                  <td style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                    {entry.points != null ? Math.round(entry.points) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
