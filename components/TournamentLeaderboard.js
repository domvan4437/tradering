
'use client';
import { useState, useEffect } from 'react';

const C = {
  surface: '#171b27', surface2: '#1d2130', surface3: '#232839',
  border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.10)',
  accent: '#3b82f6', text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
  green: '#10b981', red: '#f43f5e', gold: '#f59e0b',
};

const STYLE_EMOJI = { scalper: '⚡', daytrader: '📈', swing: '🌊', position: '🏔️', macro: '🌍' };

export default function TournamentLeaderboard({ tournamentId, userId }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('leaderboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/leaderboard?tournamentId=${tournamentId}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [tournamentId]);

  if (loading) return <div style={{ color: C.muted, fontSize: 13, padding: 20 }}>Loading…</div>;
  if (!data) return null;

  const { leaderboard, trades } = data;

  const rankColor = (rank) => {
    if (rank === 1) return C.gold;
    if (rank === 2) return '#94a3b8';
    if (rank === 3) return '#cd7f32';
    return C.dim;
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['leaderboard', 'trades'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? C.accent + '22' : C.surface2,
            border: `1px solid ${tab === t ? C.accent : C.border2}`,
            borderRadius: 8, padding: '6px 16px', color: tab === t ? C.accent : C.muted,
            cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400,
            textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leaderboard.length === 0 && (
            <div style={{ color: C.muted, fontSize: 13, padding: 16 }}>No entries yet.</div>
          )}
          {leaderboard.map(entry => (
            <div key={entry.userId} style={{
              background: entry.userId === userId ? C.accent + '11' : C.surface2,
              border: `1px solid ${entry.userId === userId ? C.accent + '44' : C.border}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', gap: 12
            }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: rankColor(entry.rank), textAlign: 'center' }}>
                {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank-1] : `#${entry.rank}`}
              </div>
              <div>
                <div style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>
                  {entry.name} {entry.userId === userId ? '(You)' : ''}
                  {entry.traderStyle && <span style={{ marginLeft: 6, fontSize: 12 }}>{STYLE_EMOJI[entry.traderStyle]}</span>}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                  {entry.validTrades} trades · {entry.winRate}% win rate
                  {entry.avgRR ? ` · ${entry.avgRR} avg R:R` : ''}
                  {entry.consistencyScore != null ? ` · ${entry.consistencyScore} consistency` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: entry.score >= 0 ? C.green : C.red, fontWeight: 800, fontSize: 18 }}>
                  {entry.score > 0 ? '+' : ''}{entry.score}
                </div>
                <div style={{ color: C.dim, fontSize: 11 }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'trades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {trades.length === 0 && <div style={{ color: C.muted, fontSize: 13, padding: 16 }}>No trades yet.</div>}
          {trades.map(trade => (
            <div key={trade.id} style={{
              background: C.surface2, borderRadius: 8, padding: '10px 14px',
              border: `1px solid ${C.border}`,
              display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 12
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{trade.commodity}</span>
                  <span style={{
                    fontSize: 11, padding: '1px 7px', borderRadius: 4, fontWeight: 700,
                    background: trade.direction === 'LONG' ? C.green + '22' : C.red + '22',
                    color: trade.direction === 'LONG' ? C.green : C.red,
                  }}>{trade.direction}</span>
                  {trade.validationStatus === 'disqualified' && (
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: '#f43f5e22', color: C.red }}>DQ</span>
                  )}
                  {trade.result === 'win' && <span style={{ fontSize: 11, color: C.green }}>✓ Win</span>}
                  {trade.result === 'loss' && <span style={{ fontSize: 11, color: C.red }}>✗ Loss</span>}
                </div>
                <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>
                  {trade.user?.name || 'Unknown'}
                  {trade.riskReward ? ` · R:R ${trade.riskReward}` : ''}
                  {trade.holdHours ? ` · held ${trade.holdHours.toFixed(1)}h` : ''}
                  {trade.disqualReason ? ` · ${trade.disqualReason}` : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', color: trade.pnlPoints > 0 ? C.green : trade.pnlPoints < 0 ? C.red : C.muted, fontWeight: 700 }}>
                {trade.pnlPoints != null ? (trade.pnlPoints > 0 ? `+${trade.pnlPoints}` : trade.pnlPoints) : '—'} pts
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
