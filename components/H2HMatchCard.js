
'use client';
import { useState, useEffect } from 'react';

const C = {
  bg: '#0b0e17', surface: '#171b27', surface2: '#1d2130', surface3: '#232839',
  border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.10)',
  accent: '#3b82f6', text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
  green: '#10b981', red: '#f43f5e', gold: '#f59e0b', purple: '#8b5cf6',
};

export default function H2HMatchCard({ tournament, userId, onEnterQueue }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queuing, setQueuing] = useState(false);
  const [message, setMessage] = useState('');

  const loadMatch = async () => {
    const res = await fetch(`/api/tournaments/h2h/queue?tournamentId=${tournament.id}`);
    const data = await res.json();
    setMatch(data.match);
    setLoading(false);
  };

  useEffect(() => { loadMatch(); }, []);

  // Poll every 5s while waiting for opponent
  useEffect(() => {
    if (match?.status !== 'waiting') return;
    const t = setInterval(loadMatch, 5000);
    return () => clearInterval(t);
  }, [match?.status]);

  const joinQueue = async () => {
    setQueuing(true);
    const res = await fetch('/api/tournaments/h2h/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: tournament.id }),
    });
    const data = await res.json();
    if (!res.ok) { setMessage(data.error); setQueuing(false); return; }
    setMatch(data.match);
    setMessage(data.message || '');
    setQueuing(false);
  };

  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Loading match status…</div>;

  const isChallenger = match?.challengerId === userId;
  const myScore = match ? (isChallenger ? match.challengerScore : match.opponentScore) : 0;
  const theirScore = match ? (isChallenger ? match.opponentScore : match.challengerScore) : 0;
  const opponent = match ? (isChallenger ? match.opponent : match.challenger) : null;
  const winning = myScore >= theirScore;

  if (!match) {
    return (
      <div style={{ background: C.surface2, borderRadius: 12, padding: 20, border: `1px solid ${C.border2}` }}>
        <div style={{ color: C.text, fontWeight: 700, fontSize: 15, marginBottom: 8 }}>⚔️ Head to Head</div>
        <p style={{ color: C.muted, fontSize: 13, margin: '0 0 16px' }}>
          Enter the queue and get randomly matched against a trader of similar style.
          You won't know who you're facing until the match starts.
        </p>
        {message && <div style={{ color: C.red, fontSize: 13, marginBottom: 12 }}>{message}</div>}
        <button onClick={joinQueue} disabled={queuing} style={{
          background: C.purple, color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13
        }}>
          {queuing ? 'Joining…' : 'Enter Queue'}
        </button>
      </div>
    );
  }

  if (match.status === 'waiting') {
    return (
      <div style={{ background: C.surface2, borderRadius: 12, padding: 20, border: `1px solid ${C.gold}44` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.gold, animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: C.gold, fontWeight: 700 }}>In Queue — Searching for opponent…</span>
        </div>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
          You'll be randomly matched with another trader. This prevents cheating — you cannot choose your opponent.
          Sit tight, this usually takes a few minutes.
        </p>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: C.surface2, borderRadius: 12, padding: 20, border: `1px solid ${match.status === 'completed' ? C.border : C.accent + '44'}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ color: C.text, fontWeight: 700 }}>⚔️ H2H Match</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 5,
          background: match.status === 'completed' ? C.dim + '33' : C.green + '22',
          color: match.status === 'completed' ? C.muted : C.green,
        }}>
          {match.status === 'completed' ? 'COMPLETED' : 'LIVE'}
        </span>
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div style={{ textAlign: 'center', padding: 16, background: C.surface3, borderRadius: 10, border: `2px solid ${winning ? C.green : C.border}` }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>YOU</div>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 28 }}>{myScore}</div>
          <div style={{ fontSize: 11, color: winning ? C.green : C.muted }}>pts</div>
        </div>
        <div style={{ color: C.dim, fontWeight: 700, fontSize: 18 }}>VS</div>
        <div style={{ textAlign: 'center', padding: 16, background: C.surface3, borderRadius: 10, border: `2px solid ${!winning ? C.red : C.border}` }}>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 4 }}>{opponent?.name || 'Opponent'}</div>
          <div style={{ color: C.text, fontWeight: 800, fontSize: 28 }}>{theirScore}</div>
          <div style={{ fontSize: 11, color: !winning ? C.red : C.muted }}>pts</div>
        </div>
      </div>

      {match.status === 'completed' && (
        <div style={{
          textAlign: 'center', padding: 12, borderRadius: 10,
          background: match.winnerId === userId ? C.green + '22' : C.red + '22',
          color: match.winnerId === userId ? C.green : C.red,
          fontWeight: 700, fontSize: 15,
        }}>
          {match.winnerId === userId ? '🏆 You Won!' : '💀 You Lost'}
        </div>
      )}

      {match.endDate && match.status === 'active' && (
        <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 10 }}>
          Ends {new Date(match.endDate).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
