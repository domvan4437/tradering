'use client';
import { useState, useEffect } from 'react';

const PURPLE = '#4f46e5';

const PLACEHOLDER = {
  id: 'placeholder',
  name: 'Weekly Trading Competition — Sign Up Now',
  prizePool: 500,
  endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  _count: { entries: 24 },
};

export default function CompetitionBanner({ onNavigate }) {
  const [dismissed, setDismissed] = useState(false);
  const [competitions, setCompetitions] = useState([PLACEHOLDER]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const d = sessionStorage.getItem('tr_banner_dismissed');
    if (d) setDismissed(true);

    fetch('/api/tournaments?status=active&limit=3')
      .then(r => r.json())
      .then(d => {
        if (d.tournaments?.length) setCompetitions(d.tournaments);
      })
      .catch(() => {}); // keep placeholder on error
  }, []);

  useEffect(() => {
    if (competitions.length <= 1) return;
    const interval = setInterval(() => setCurrent(c => (c + 1) % competitions.length), 5000);
    return () => clearInterval(interval);
  }, [competitions]);

  if (dismissed) return <div style={{ height:0, overflow:'hidden' }} />;

  const comp = competitions[current] || PLACEHOLDER;
  const daysLeft = comp.endDate
    ? Math.max(0, Math.ceil((new Date(comp.endDate) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const participants = comp._count?.entries || 0;

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('tr_banner_dismissed', '1');
  };

  return (
    <div style={{
      width: '100%', zIndex: 200, marginTop: 48,
      background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      padding: '8px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: 'var(--font)',
      minHeight: 36,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>🏆</span>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {comp.name}
        </span>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {comp.prizePool > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.15)', padding: '2px 10px', borderRadius: 20, border: '1px solid rgba(251,191,36,0.3)', whiteSpace: 'nowrap' }}>
              {'$' + comp.prizePool.toLocaleString() + ' prize pool'}
            </span>
          )}
          {participants > 0 && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
              {participants + ' traders competing'}
            </span>
          )}
          {daysLeft !== null && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>
              {daysLeft === 0 ? 'Ends today!' : daysLeft + (daysLeft === 1 ? ' day' : ' days') + ' left'}
            </span>
          )}
        </div>
      </div>

      {competitions.length > 1 && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {competitions.map((_, i) => (
            <div key={i} onClick={() => setCurrent(i)}
              style={{ width: 6, height: 6, borderRadius: '50%', background: i === current ? '#fff' : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
        </div>
      )}

      <button
        onClick={() => { onNavigate('compete'); dismiss(); }}
        style={{
          padding: '6px 16px', borderRadius: 20,
          border: '2px solid rgba(255,255,255,0.7)',
          background: 'transparent', color: '#fff',
          fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        Join Now →
      </button>

      <button onClick={dismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 20, padding: '0 4px', flexShrink: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>
        ×
      </button>
    </div>
  );
}
