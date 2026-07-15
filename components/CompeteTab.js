'use client';
import { useState, useEffect, useCallback } from 'react';
import MatchDetailView from './MatchDetailView';
import CompetitionTradingView from './CompetitionTradingView';

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_CLASSES = ['Any', 'Forex', 'Commodities', 'Futures', 'Stocks', 'Crypto'];
const INSTRUMENTS = {
  Crypto:      [{ sym: 'BTC-USD', label: 'Bitcoin' }, { sym: 'ETH-USD', label: 'Ethereum' }, { sym: 'SOL-USD', label: 'Solana' }, { sym: 'BNB-USD', label: 'BNB' }, { sym: 'XRP-USD', label: 'XRP' }, { sym: 'ADA-USD', label: 'Cardano' }, { sym: 'DOGE-USD', label: 'Dogecoin' }, { sym: 'AVAX-USD', label: 'Avalanche' }, { sym: 'DOT-USD', label: 'Polkadot' }, { sym: 'LINK-USD', label: 'Chainlink' }, { sym: 'LTC-USD', label: 'Litecoin' }, { sym: 'MATIC-USD', label: 'Polygon' }],
  Forex:       [{ sym: 'EURUSD=X', label: 'EUR/USD' }, { sym: 'GBPUSD=X', label: 'GBP/USD' }, { sym: 'USDJPY=X', label: 'USD/JPY' }, { sym: 'AUDUSD=X', label: 'AUD/USD' }, { sym: 'USDCAD=X', label: 'USD/CAD' }, { sym: 'USDCHF=X', label: 'USD/CHF' }, { sym: 'NZDUSD=X', label: 'NZD/USD' }, { sym: 'EURJPY=X', label: 'EUR/JPY' }, { sym: 'GBPJPY=X', label: 'GBP/JPY' }, { sym: 'EURGBP=X', label: 'EUR/GBP' }],
  Futures:     [{ sym: 'NQ=F', label: 'NASDAQ' }, { sym: 'ES=F', label: 'S&P 500' }, { sym: 'YM=F', label: 'Dow Jones' }, { sym: 'RTY=F', label: 'Russell 2000' }, { sym: 'GC=F', label: 'Gold' }, { sym: 'SI=F', label: 'Silver' }, { sym: 'CL=F', label: 'Crude Oil' }, { sym: 'NG=F', label: 'Nat. Gas' }, { sym: 'HG=F', label: 'Copper' }, { sym: 'ZC=F', label: 'Corn' }, { sym: 'ZS=F', label: 'Soybeans' }],
  Commodities: [{ sym: 'GC=F', label: 'Gold' }, { sym: 'SI=F', label: 'Silver' }, { sym: 'CL=F', label: 'Crude Oil' }, { sym: 'NG=F', label: 'Nat. Gas' }, { sym: 'HG=F', label: 'Copper' }, { sym: 'ZC=F', label: 'Corn' }, { sym: 'ZS=F', label: 'Soybeans' }, { sym: 'ZW=F', label: 'Wheat' }],
  Stocks:      [{ sym: 'AAPL', label: 'Apple' }, { sym: 'TSLA', label: 'Tesla' }, { sym: 'NVDA', label: 'Nvidia' }, { sym: 'MSFT', label: 'Microsoft' }, { sym: 'AMZN', label: 'Amazon' }, { sym: 'GOOGL', label: 'Alphabet' }, { sym: 'META', label: 'Meta' }, { sym: 'AMD', label: 'AMD' }, { sym: 'NFLX', label: 'Netflix' }, { sym: 'SPY', label: 'S&P 500 ETF' }, { sym: 'QQQ', label: 'NASDAQ ETF' }],
};
const H2H_DURATION_PRESETS = ['1 Day', '3 Days', '1 Week', '2 Weeks', '1 Month', 'Custom'];
const GROUP_DURATION_PRESETS = ['1 Day', '3 Days', '1 Week', '2 Weeks', '1 Month', '3 Months', 'Custom'];
const PRIZE_STRUCTURES = ['Winner Take All', 'Top 2 Split', 'Top 3 Split', 'Top 5 Split'];
const TEAM_EMOJIS = ['⚡','🔥','🦁','🐯','🦊','🐺','🦅','🦋','🌊','💎','🎯','🚀','💪','🧠','👑','⚔️'];
const TEAM_COLORS = ['#534AB7','#059669','#dc2626','#d97706','#0891b2','#7c3aed','#db2777','#65a30d'];

// ─── Shared style tokens ──────────────────────────────────────────────────────
const S = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'var(--font)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted)',
    display: 'block',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    color: 'var(--text)',
    outline: 'none',
    boxSizing: 'border-box',
  },
  primaryBtn: {
    padding: '8px 18px',
    background: '#534AB7',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'var(--font)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  },
  ghostBtn: {
    padding: '8px 14px',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontFamily: 'var(--font)',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function EmptyState({ icon, title, sub, btnLabel, onBtnClick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 180, textAlign: 'center', padding: '20px 0' }}>
      <i className={`ti ${icon}`} style={{ fontSize: 36, color: '#AFA9EC' }} aria-hidden="true" />
      <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{title}</div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 240, lineHeight: 1.5, opacity: 0.7 }}>{sub}</div>
      {btnLabel && (
        <button onClick={onBtnClick} style={{ ...S.primaryBtn, marginTop: 8 }}>{btnLabel}</button>
      )}
    </div>
  );
}

function InnerTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
      {tabs.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            padding: '8px 14px',
            fontFamily: 'var(--font)',
            fontSize: 12,
            fontWeight: active === key ? 600 : 400,
            color: active === key ? '#534AB7' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: active === key ? '2px solid #534AB7' : '2px solid transparent',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AssetPills({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
      {ASSET_CLASSES.map(a => (
        <button
          key={a}
          onClick={() => onChange(a)}
          style={{
            padding: '4px 11px',
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: active === a ? '#534AB7' : 'transparent',
            color: active === a ? '#fff' : 'var(--text-muted)',
            fontFamily: 'var(--font)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

function SearchBar({ placeholder, value, onChange }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...S.input, flex: 1 }}
    />
  );
}

function TypeToggle({ value, onChange, freeLabel, paidLabel }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 18 }}>
      {[['free', freeLabel || 'Free', 'ti-gift'], ['paid', paidLabel || 'Paid (entry stake)', 'ti-currency-dollar']].map(([type, label, icon]) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          style={{
            padding: '9px 12px',
            background: value === type ? '#534AB7' : 'var(--surface2)',
            color: value === type ? '#fff' : 'var(--text-muted)',
            border: 'none',
            fontFamily: 'var(--font)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <i className={`ti ${icon}`} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

function DurationField({ durationType, durationPreset, durationCustom, durationUnit, onChange, presets }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <select
        value={durationType === 'custom' ? 'Custom' : durationPreset}
        onChange={e => {
          if (e.target.value === 'Custom') onChange({ durationType: 'custom' });
          else onChange({ durationType: 'preset', durationPreset: e.target.value });
        }}
        style={{ ...S.input, flex: durationType === 'custom' ? '0 0 90px' : 1, cursor: 'pointer' }}
      >
        {presets.map(o => <option key={o}>{o}</option>)}
      </select>
      {durationType === 'custom' && (
        <>
          <input
            type="number"
            min="1"
            placeholder="#"
            value={durationCustom}
            onChange={e => onChange({ durationCustom: e.target.value })}
            style={{ ...S.input, width: 60 }}
          />
          <select
            value={durationUnit}
            onChange={e => onChange({ durationUnit: e.target.value })}
            style={{ ...S.input, width: 90, cursor: 'pointer' }}
          >
            {['days', 'weeks', 'months'].map(u => <option key={u}>{u}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

function WarnBox({ children }) {
  return (
    <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#3C3489', lineHeight: 1.6, marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <i className="ti ti-alert-triangle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function Modal({ title, onClose, children, size = 'md' }) {
  const widths = { sm: 420, md: 500, lg: 640, xl: 720 };
  const w = widths[size] || 500;
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: w, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-x" style={{ fontSize: 15 }} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onCancel, onSubmit, submitLabel, disabled, cancelLabel = 'Cancel' }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
      <button onClick={onCancel} style={{ ...S.ghostBtn, flex: 1 }}>{cancelLabel}</button>
      <button
        onClick={onSubmit}
        disabled={disabled}
        style={{
          flex: 2, padding: '9px', borderRadius: 8, border: 'none',
          background: disabled ? 'var(--surface3)' : '#534AB7',
          color: disabled ? 'var(--text-muted)' : '#fff',
          fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600,
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {submitLabel}
      </button>
    </div>
  );
}

// ─── H2H Preview Modal ────────────────────────────────────────────────────────
function H2HPreviewModal({ match, onAccept, onClose, onOpenProfile }) {
  const [loading, setLoading] = useState(false);

  const rows = [
    { label: 'Posted by', value: match.challengerName },
    { label: 'Asset class', value: match.asset || 'Any' },
    { label: 'Duration', value: match.timeLeft || 'Open' },
    { label: 'Buy-in', value: match.buyIn > 0 ? `$${match.buyIn}` : 'Free' },
    { label: 'Posted', value: timeAgo(match.createdAt) },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-swords" style={{ fontSize: 18, color: '#534AB7' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>1v1 Challenge</div>
              {match.challengerSlug ? (
                <button onClick={e => { e.stopPropagation(); onOpenProfile(match.challengerSlug); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, color: '#534AB7', padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                  {match.challengerName} <i className="ti ti-arrow-right" style={{ fontSize: 11 }} />
                </button>
              ) : (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>{match.challengerName}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
        </div>

        {/* Description */}
        {match.description && (
          <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            "{match.description}"
          </div>
        )}

        {/* Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {rows.map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...S.ghostBtn, flex: 1 }}>Cancel</button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onAccept(match.id); onClose(); }}
            style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center' }}
          >
            {loading ? '…' : <><i className="ti ti-swords" /> Accept challenge</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Group Preview Modal ───────────────────────────────────────────────────────
function GroupPreviewModal({ contest, onJoin, onClose, onOpenProfile, onDelete }) {
  const [step, setStep] = useState('info'); // 'info' | 'teams'
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [createForm, setCreateForm] = useState({ show: false, name: '', emoji: '⚡', color: '#534AB7' });

  useEffect(() => {
    setDetailLoading(true);
    fetch(`/api/group-contests/preview?id=${contest.id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  }, [contest.id]);

  const loadTeams = () => {
    setTeamsLoading(true);
    fetch(`/api/group-contests/teams?contestId=${contest.id}`)
      .then(r => r.json())
      .then(d => { setTeams(d.teams || []); setTeamsLoading(false); })
      .catch(() => setTeamsLoading(false));
  };

  const goToTeams = () => { setStep('teams'); loadTeams(); };

  const joinTeam = async (teamId) => {
    setJoining(true);
    await fetch('/api/group-contests/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId: contest.id, teamId }) });
    await onJoin(contest.id);
    onClose();
  };

  const createAndJoinTeam = async () => {
    if (!createForm.name.trim()) return;
    setJoining(true);
    await fetch('/api/group-contests/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', contestId: contest.id, name: createForm.name.trim(), emoji: createForm.emoji, color: createForm.color }) });
    await onJoin(contest.id);
    onClose();
  };

  const joinSolo = async () => {
    setJoining(true);
    await onJoin(contest.id);
    onClose();
  };

  const spotsLeft = detail?.maxParticipants ? detail.maxParticipants - (detail.memberCount || 0) : null;
  const isFull = spotsLeft === 0;

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {step === 'teams' && (
          <button onClick={() => setStep('info')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontSize: 18, padding: '0 4px 0 0', display: 'flex', alignItems: 'center' }}>
            <i className="ti ti-arrow-left" />
          </button>
        )}
        <div style={{ width: 36, height: 36, borderRadius: 9, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-users" style={{ fontSize: 17, color: '#534AB7' }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{contest.name}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>
            {step === 'info' ? (contest.creatorSlug
              ? <button onClick={e => { e.stopPropagation(); onOpenProfile(contest.creatorSlug); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, color: '#534AB7', padding: 0 }}>by {contest.creatorName}</button>
              : `by ${contest.creatorName}`)
            : 'Pick your team'}
          </div>
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
    </div>
  );

  // ── Step 1: Info ──
  if (step === 'info') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {header}

        {contest.description && (
          <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            "{contest.description}"
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: contest.allowedSymbols ? 10 : 16 }}>
          {[
            { label: 'Asset', value: contest.asset || 'Any' },
            { label: 'Buy-in', value: contest.buyIn > 0 ? `$${contest.buyIn}` : 'Free' },
            { label: 'Members', value: detail?.memberCount ?? contest.memberCount },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {contest.allowedSymbols && contest.allowedSymbols.length > 0 && (
          <div style={{ marginBottom: 14, padding: '8px 12px', background: '#EEEDFE', borderRadius: 9, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <i className="ti ti-lock" style={{ fontSize: 13, color: '#534AB7', marginTop: 1, flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: '#534AB7', marginBottom: 4 }}>Allowed instruments only</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {contest.allowedSymbols.map(sym => {
                  const label = Object.values(INSTRUMENTS).flat().find(i => i.sym === sym)?.label || sym;
                  return <span key={sym} style={{ fontFamily: 'var(--font)', fontSize: 11, background: '#fff', color: '#534AB7', border: '1px solid #534AB733', padding: '2px 8px', borderRadius: 12 }}>{label}</span>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Live leaderboard preview */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Leaderboard
          </div>
          {detailLoading ? (
            <div style={{ textAlign: 'center', padding: 16, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
          ) : detail?.teams && detail.teams.length > 0 ? (
            // Team contest — show per-team breakdown
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detail.teams.map(team => (
                <div key={team.id} style={{ border: `1.5px solid ${team.color}44`, borderRadius: 10, overflow: 'hidden' }}>
                  {/* Team header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: team.color + '12' }}>
                    <span style={{ fontSize: 16 }}>{team.emoji}</span>
                    <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.color }}>{team.name}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: team.teamPnl >= 0 ? '#059669' : '#dc2626' }}>
                      {team.teamPnl >= 0 ? '+' : ''}${team.teamPnl.toFixed(2)}
                    </div>
                  </div>
                  {/* Team members */}
                  {team.members.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>No members yet</div>
                  ) : (
                    team.members.map((m, i) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ width: 18, textAlign: 'center', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)' }}>{m.name}</div>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: m.pnl >= 0 ? '#059669' : '#dc2626' }}>
                          {m.pnl >= 0 ? '+' : ''}${Math.abs(m.pnl).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          ) : (detail?.members || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 9 }}>
              No one joined yet — be the first!
            </div>
          ) : (
            // Solo contest — flat leaderboard
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {(detail?.members || []).map((m, i) => {
                const pnl = m.pnl ?? m.score ?? 0;
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 9, padding: '8px 12px' }}>
                    <div style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: i === 0 ? '#d97706' : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: pnl >= 0 ? '#059669' : '#dc2626' }}>
                      {pnl >= 0 ? '+' : '-'}${Math.abs(pnl).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Team slot picker — shown when contest has a fixed team format */}
        {!contest.joined && detail?.teamFormat && (detail?.teams || []).length > 0 && (() => {
          const renderSlot = (team) => {
            const full = !!(detail.teamSize && team.memberCount >= detail.teamSize);
            return (
              <button
                key={team.id}
                disabled={joining || full}
                onClick={() => joinTeam(team.id)}
                style={{
                  background: full ? 'var(--surface2)' : team.color + '14',
                  border: `2px solid ${full ? 'var(--border)' : team.color}`,
                  borderRadius: 14, padding: '16px 10px', cursor: full ? 'not-allowed' : 'pointer',
                  opacity: full ? 0.55 : 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  width: '100%', transition: 'opacity .15s',
                }}
              >
                <span style={{ fontSize: 26 }}>{team.emoji}</span>
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: full ? 'var(--text-muted)' : team.color }}>{team.name}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
                  {team.memberCount}{detail.teamSize ? `/${detail.teamSize}` : ''} joined
                </div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: full ? 'var(--surface3)' : team.color, color: full ? 'var(--text-muted)' : '#fff', borderRadius: 8, padding: '3px 12px' }}>
                  {joining ? '…' : full ? 'Full' : 'Join'}
                </div>
              </button>
            );
          };
          const t = detail.teams;
          return (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Pick your side</div>
              {t.length === 2 ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                  {renderSlot(t[0])}
                  <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 800, color: 'var(--text-muted)', textAlign: 'center' }}>VS</div>
                  {renderSlot(t[1])}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  {t.map(team => renderSlot(team))}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...S.ghostBtn, flex: 1 }}>{contest.joined ? 'Close' : 'Cancel'}</button>
          {contest.joined ? (
            <button onClick={onClose} style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center', background: '#059669' }}>
              ✓ Already joined
            </button>
          ) : isFull ? (
            <button disabled style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center', background: 'var(--surface2)', color: 'var(--text-muted)', cursor: 'not-allowed' }}>
              Contest full
            </button>
          ) : !detail?.teamFormat ? (
            <button onClick={goToTeams} style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center' }}>
              <i className="ti ti-users" /> Join contest →
            </button>
          ) : null}
        </div>
        {contest.isCreator && onDelete && (
          <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              onClick={() => { if (confirm('Delete this contest? All trades and entries will be removed. This cannot be undone.')) { onDelete(contest.id); onClose(); } }}
              style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid #dc2626', borderRadius: 8, color: '#dc2626', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <i className="ti ti-trash" style={{ fontSize: 14 }} /> Delete contest
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ── Step 2: Team Selection ──
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {header}

        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Join an existing team, create your own, or compete solo.
        </div>

        {teamsLoading ? (
          <div style={{ textAlign: 'center', padding: 20, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading teams…</div>
        ) : (
          <>
            {/* Existing teams */}
            {teams.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Existing teams</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {teams.map(team => (
                    <div key={team.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', border: `1px solid ${team.color}33`, borderRadius: 11, padding: '10px 12px' }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, background: team.color + '18', border: `1px solid ${team.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>{team.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.color }}>{team.name}</div>
                        <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</div>
                      </div>
                      <button disabled={joining} onClick={() => joinTeam(team.id)} style={{ padding: '5px 12px', border: `1px solid ${team.color}`, borderRadius: 7, background: 'transparent', color: team.color, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                        {joining ? '…' : 'Join'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Solo option */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, textAlign: 'center' }}>
              <button disabled={joining} onClick={joinSolo} style={{ background: 'none', border: 'none', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}>
                {joining ? '…' : 'Skip — join as individual (no team)'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


// ─── Data cards ───────────────────────────────────────────────────────────────
function H2HAvatar({ userId, name, size = 52 }) {
  const [failed, setFailed] = useState(false);
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  const bg = colors[(name || '?').charCodeAt(0) % colors.length];
  const showImg = userId && !failed;
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background: showImg ? '#e5e7eb' : bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize: size * 0.38, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
      {showImg
        ? <img src={`/api/avatar/${userId}`} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={() => setFailed(true)} />
        : (name || '?')[0].toUpperCase()}
    </div>
  );
}

function ChallengeCard({ match, onAccept, onOpenProfile }) {
  const [preview, setPreview] = useState(false);
  // timeLeft is time until the match ends — show as duration info
  const durationLabel = match.timeLeft && match.timeLeft !== 'Ended' ? `${match.timeLeft} match` : timeAgo(match.createdAt);
  return (
    <>
      {preview && <H2HPreviewModal match={match} onAccept={onAccept} onClose={() => setPreview(false)} onOpenProfile={onOpenProfile} />}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', cursor:'pointer', display:'flex', flexDirection:'column', transition:'box-shadow 0.15s, border-color 0.15s' }}
        onClick={() => setPreview(true)}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#534AB7'; e.currentTarget.style.boxShadow='0 2px 12px rgba(83,74,183,0.10)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
      >
        {/* Top row: market badge + duration */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-muted)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px' }}>
            {(match.asset || 'ANY').toUpperCase()}
          </span>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{durationLabel}</span>
        </div>
        {/* VS row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
            <H2HAvatar userId={match.challengerId} name={match.challengerName} />
            <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:500, color:'var(--text)' }}>{match.challengerName}</span>
          </div>
          <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-muted)', flex:'0 0 auto', padding:'0 12px' }}>VS</span>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, flex:1 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', border:'2px dashed #d1d5db', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'var(--font)', fontSize:22, color:'#d1d5db' }}>?</span>
            </div>
            <span style={{ fontFamily:'var(--font)', fontSize:13, color:'#9ca3af' }}>Open slot</span>
          </div>
        </div>
        {/* Meta row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>P&L %</span>
          <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>{match.buyIn > 0 ? `$${match.buyIn.toLocaleString()} stake` : 'Free'}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); setPreview(true); }}
          style={{ width:'100%', padding:'11px', borderRadius:10, background:'#111827', color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          Accept challenge
        </button>
      </div>
    </>
  );
}

function MatchCard({ match, currentUserId, onClick, onDelete }) {
  const isChallenger = match.challengerId === currentUserId;
  const myScore = Number(isChallenger ? match.challengerScore : match.opponentScore) || 0;
  const oppScore = Number(isChallenger ? match.opponentScore : match.challengerScore) || 0;
  const myName = isChallenger ? match.challengerName : match.opponentName;
  const oppName = isChallenger ? match.opponentName : match.challengerName;
  const myId = isChallenger ? match.challengerId : match.opponentId;
  const oppId = isChallenger ? match.opponentId : match.challengerId;
  const canDelete = isChallenger && match.status === 'waiting';
  const isLive = match.status === 'active';
  const isWaiting = match.status === 'waiting';
  const fmtPnl = (v) => `${v >= 0 ? '+' : ''}$${Math.abs(v).toFixed(2)}`;

  return (
    <div onClick={onClick} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', cursor:'pointer', display:'flex', flexDirection:'column', transition:'box-shadow 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#534AB7'; e.currentTarget.style.boxShadow='0 2px 12px rgba(83,74,183,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.boxShadow='none'; }}
    >
      {/* Top row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'var(--text-muted)', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:6, padding:'3px 8px' }}>
          {(match.asset || 'ANY').toUpperCase()}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {isLive && <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'#059669' }}>● Live</span>}
          {isWaiting && <span style={{ fontFamily:'var(--font)', fontSize:12, color:'#d97706', fontWeight:600 }}>⏳ Waiting</span>}
          {canDelete && onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(match.id); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px' }} title="Delete">
              <i className="ti ti-trash" style={{ fontSize:14 }} />
            </button>
          )}
        </div>
      </div>

      {/* VS row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        {/* Me */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
          <H2HAvatar userId={myId} name={myName} />
          <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:500, color:'var(--text)' }}>{myName}</span>
          {isLive && (
            <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: myScore >= 0 ? '#059669' : '#dc2626' }}>
              {fmtPnl(myScore)}
            </span>
          )}
        </div>

        <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-muted)', flex:'0 0 auto', padding:'0 12px' }}>VS</span>

        {/* Opponent */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
          {isWaiting ? (
            <>
              <div style={{ width:52, height:52, borderRadius:'50%', border:'2px dashed #d1d5db', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'var(--font)', fontSize:22, color:'#d1d5db' }}>?</span>
              </div>
              <span style={{ fontFamily:'var(--font)', fontSize:13, color:'#9ca3af' }}>Open slot</span>
            </>
          ) : (
            <>
              <H2HAvatar userId={oppId} name={oppName} />
              <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:500, color:'var(--text)' }}>{oppName}</span>
              {isLive && (
                <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: oppScore >= 0 ? '#059669' : '#dc2626' }}>
                  {fmtPnl(oppScore)}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
          {match.timeLeft && match.timeLeft !== 'Ended' ? `Ends in ${match.timeLeft}` : (match.timeLeft || 'Ongoing')}
        </span>
        <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>
          {match.buyIn > 0 ? `$${match.buyIn.toLocaleString()} stake` : 'Free'}
        </span>
      </div>

      {/* Action button */}
      <button onClick={e => { e.stopPropagation(); onClick(); }}
        style={{ width:'100%', padding:'11px', borderRadius:10, background: isWaiting ? 'transparent' : 'transparent', color:'var(--text)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
        {isWaiting ? 'View challenge' : 'Watch match'}
      </button>
    </div>
  );
}

function InviteCard({ match, onAccept, onDecline, onOpenProfile }) {
  const [preview, setPreview] = useState(false);
  const [declining, setDeclining] = useState(false);
  return (
    <>
      {preview && <H2HPreviewModal match={match} onAccept={onAccept} onClose={() => setPreview(false)} onOpenProfile={onOpenProfile} />}
      <div style={{ ...S.card, cursor: 'pointer' }}
        onClick={() => setPreview(true)}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            Challenge from {match.challengerName}
            {match.buyIn > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#EEEDFE', color: '#3C3489', padding: '2px 7px', borderRadius: 10 }}>${match.buyIn} stake</span>}
          </div>
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(match.createdAt)}</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
          {match.asset} · {match.timeLeft}
          {match.description && ` · "${match.description}"`}
        </div>
        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          <button onClick={async () => { setDeclining(true); await onDecline(match.id); setDeclining(false); }} disabled={declining} style={{ ...S.ghostBtn, flex: 1 }}>{declining ? '…' : 'Decline'}</button>
          <button onClick={() => setPreview(true)} style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center' }}>
            View &amp; Accept
          </button>
        </div>
      </div>
    </>
  );
}

// ─── helpers used by GroupContestCard ────────────────────────────────────────
function teamInitials(name) {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + (words[1][0] || '')).toUpperCase();
}
function contestTiming(contest) {
  if (!contest.endDate) return 'Open';
  const diff = new Date(contest.endDate) - Date.now();
  if (diff <= 0) return 'Ended';
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `Ends in ${d}d ${h}h` : `Ends in ${h}h`;
}

// team avatar circle used in cards
function TeamAvatar({ name, color, size = 44 }) {
  const colors = ['#534AB7','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#db2777'];
  const bg = color || colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.22), background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>
      {teamInitials(name)}
    </div>
  );
}

// Profile picture with letter fallback
function MemberAvatar({ name, image, size = 28 }) {
  const [err, setErr] = useState(false);
  if (image && !err) {
    return (
      <img
        src={image}
        alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.43), fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {(name || '?')[0].toUpperCase()}
    </div>
  );
}

function GroupContestCard({ contest, onJoin, onOpenProfile, onDelete, onEnter }) {
  const [showModal, setShowModal] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`/api/group-contests/preview?id=${contest.id}`)
      .then(r => r.json())
      .then(d => setPreview(d))
      .catch(() => {});
  }, [contest.id]);

  const isLive    = contest.status === 'active';
  const isTeam    = !!contest.teamFormat && contest.teamFormat !== 'none';
  const teams     = preview?.teams || [];
  const members   = preview?.members || [];
  const timing    = contestTiming(contest);

  // For non-team contests: group members by their teamName field (or treat all as flat list)
  // For team contests: use teams array from preview

  // Determine display mode: 2-slot (≤2 teams expected) vs ranked list (3+)
  const maxTeams  = contest.maxTeams || (isTeam ? 2 : null);
  // Use actual team count when preview loaded; fall back to maxTeams config
  const is2Slot   = isTeam && (
    teams.length === 2 ||
    (teams.length === 0 && maxTeams === 2) ||
    (teams.length === 1 && maxTeams === 2)
  );
  const teamA     = teams[0] || null;
  const teamB     = teams[1] || null;
  const hasOpenSlot = isTeam && teams.length < (maxTeams || 2);

  const canJoin   = !contest.joined && (isTeam ? hasOpenSlot : true);
  const stakeLabel = contest.buyIn > 0
    ? `$${(contest.buyIn).toLocaleString()} stake${isTeam ? ' / team' : ''}`
    : 'Free entry';

  const pnlColor = v => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : 'var(--text-muted)';
  const pnlFmt   = v => v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

  const openPreview = () => setShowModal(true);

  return (
    <>
      {showModal && (
        <GroupPreviewModal
          contest={contest}
          onJoin={onJoin}
          onClose={() => setShowModal(false)}
          onOpenProfile={onOpenProfile}
          onDelete={onDelete}
        />
      )}
      {showInvite && <ContestInviteModal contest={contest} onClose={() => setShowInvite(false)} />}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Card top */}
        <div style={{ padding: '16px 18px 14px' }}>
          {/* Row 1: asset badge + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font)', color: 'var(--text-muted)', background: 'var(--surface2)', border: '1px solid var(--border)', padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {contest.asset || 'Any'}
            </span>
            {isLive ? (
              <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                ● Live{teams.length > 0 && !is2Slot ? ` · ${teams.length} teams` : ''}
              </span>
            ) : (
              <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>
                {timing}{teams.length > 1 && !is2Slot ? ` · ${teams.length} teams` : ''}
              </span>
            )}
          </div>

          {/* Card body */}
          {is2Slot ? (
            /* ── 2-slot: name VS name (no avatars) ── */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              {/* Team A */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                {teamA ? (
                  <>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{teamA.name}</div>
                    {teamA.memberCount > 0 && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{teamA.memberCount} member{teamA.memberCount !== 1 ? 's' : ''}</div>}
                    {isLive && <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: pnlColor(teamA.pnl) }}>{pnlFmt(teamA.pnl)}</div>}
                  </>
                ) : (
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Open slot</div>
                )}
              </div>

              <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, padding: '0 12px', flexShrink: 0 }}>VS</div>

              {/* Team B */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                {teamB ? (
                  <>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>{teamB.name}</div>
                    {teamB.memberCount > 0 && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{teamB.memberCount} member{teamB.memberCount !== 1 ? 's' : ''}</div>}
                    {isLive && <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: pnlColor(teamB.pnl) }}>{pnlFmt(teamB.pnl)}</div>}
                  </>
                ) : (
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Open slot</div>
                )}
              </div>
            </div>
          ) : (
            /* ── Multi-team: ranked list ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {teams.slice(0, 4).map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{t.name}</span>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{t.memberCount} member{t.memberCount !== 1 ? 's' : ''}</span>
                  {isLive && <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: pnlColor(t.teamPnl) }}>{pnlFmt(t.teamPnl)}</span>}
                </div>
              ))}
              {teams.length > 4 && (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', paddingLeft: 24 }}>+{teams.length - 4} more teams</div>
              )}
              {hasOpenSlot && (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', paddingLeft: 24, marginTop: 2 }}>
                  {maxTeams ? `${maxTeams - teams.length} slot${maxTeams - teams.length !== 1 ? 's' : ''} open` : 'Open to join'}
                </div>
              )}
              {teams.length === 0 && !preview && (
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                  {contest.memberCount > 0 ? `${contest.memberCount} member${contest.memberCount !== 1 ? 's' : ''} joined` : 'No teams yet — be the first'}
                </div>
              )}
            </div>
          )}
          {/* ── Individual (non-team) contest: member list ── */}
          {!isTeam && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {(preview?.members || []).slice(0, 4).map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                  <MemberAvatar name={m.name} image={m.image} size={28} />
                  <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{m.name}</span>
                  {isLive && <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: pnlColor(m.pnl) }}>{pnlFmt(m.pnl)}</span>}
                </div>
              ))}
              {!(preview?.members?.length) && (
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                  {contest.memberCount > 0 ? `${contest.memberCount} trader${contest.memberCount !== 1 ? 's' : ''} joined` : 'No members yet — be the first!'}
                </div>
              )}
            </div>
          )}

          {/* Footer meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>
              {contestTiming(contest) || `by ${contest.creatorName}`}
            </span>
            <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{stakeLabel}</span>
          </div>
        </div>

        {/* Action button */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 18px', display: 'flex', gap: 8 }}>
          {contest.joined ? (
            <button onClick={() => onEnter?.(contest)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
              Watch contest
            </button>
          ) : (
            <button onClick={openPreview} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#111827', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Join with your team
            </button>
          )}
          {/* Invite button — visible when you've joined or are the creator */}
          {(contest.joined || contest.isCreator) && (
            <button onClick={e => { e.stopPropagation(); setShowInvite(true); }}
              title="Invite to this contest"
              style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
              <i className="ti ti-user-plus" style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// Keep old ContestCard name as alias (used in GroupPreviewModal etc.)
function ContestCard({ contest, onJoin, onOpenProfile, onDelete }) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      {preview && <GroupPreviewModal contest={contest} onJoin={onJoin} onClose={() => setPreview(false)} onOpenProfile={onOpenProfile} onDelete={onDelete} />}
      <div onClick={() => setPreview(true)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-users" style={{ fontSize: 18, color: '#534AB7' }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {contest.name}
            {contest.buyIn > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#EEEDFE', color: '#3C3489', padding: '2px 7px', borderRadius: 10 }}>${contest.buyIn} entry</span>}
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
            {contest.memberCount} member{contest.memberCount !== 1 ? 's' : ''} · {contest.asset} · by {contest.creatorName}
          </div>
        </div>
        <i className="ti ti-chevron-right" style={{ fontSize: 16, color: contest.joined ? '#059669' : '#534AB7', flexShrink: 0 }} />
      </div>
    </>
  );
}

function HistoryCard({ match, currentUserId, onClick }) {
  const won = match.winnerId === currentUserId;
  const isTie = match.winnerId === null;
  const isChallenger = match.challengerId === currentUserId;
  const oppName = isChallenger ? match.opponentName : match.challengerName;
  return (
    <div onClick={onClick} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ width: 38, height: 38, borderRadius: 8, background: isTie ? 'var(--surface2)' : won ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={`ti ${isTie ? 'ti-minus' : won ? 'ti-trophy' : 'ti-x'}`} style={{ fontSize: 18, color: isTie ? 'var(--text-muted)' : won ? '#059669' : '#dc2626' }} aria-hidden="true" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
          vs {oppName}
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: isTie ? 'var(--text-muted)' : won ? '#059669' : '#dc2626' }}>
            {isTie ? 'Tie' : won ? 'Won' : 'Lost'}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
          {match.asset} · {timeAgo(match.createdAt)}
          {match.buyIn > 0 && ` · $${match.buyIn} stake`}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {isChallenger ? match.challengerScore : match.opponentScore} – {isChallenger ? match.opponentScore : match.challengerScore}
        </div>
      </div>
    </div>
  );
}

// ─── Post Challenge Modal ─────────────────────────────────────────────────────
function PostChallengeModal({ onClose, onSuccess }) {
  const [type, setType] = useState('free');
  const [visibility, setVisibility] = useState('public'); // 'public' | 'private'
  const [privateMode, setPrivateMode] = useState('person'); // 'person' | 'group'
  const [form, setForm] = useState({
    asset: 'Any',
    durationType: 'preset',
    durationPreset: '1 Week',
    durationCustom: '',
    durationUnit: 'days',
    stake: '',
    maxAccepts: 1,
    description: '',
  });
  // Selected invitee (set by either person-search or group-member pick)
  const [invitedUser, setInvitedUser] = useState(null); // { id, name, username }
  // Person search state
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteResults, setInviteResults] = useState([]);
  const [inviteSearching, setInviteSearching] = useState(false);
  const [friends, setFriends] = useState([]); // people the user follows
  // Group state
  const [groups, setGroups] = useState([]);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [groupMembers, setGroupMembers] = useState({}); // groupId → members[]
  const [membersLoading, setMembersLoading] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setDur = (patch) => setForm(p => ({ ...p, ...patch }));

  // Load friends + groups on mount
  useEffect(() => {
    fetch('/api/social/follow?list=true').then(r => r.json()).then(d => setFriends(d.following || [])).catch(() => {});
    fetch('/api/groups?mine=true').then(r => r.json()).then(d => setGroups(d.groups || [])).catch(() => {});
  }, []);

  // Debounced user search (leaderboard)
  useEffect(() => {
    if (!inviteQuery.trim()) { setInviteResults([]); return; }
    setInviteSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/social/leaderboard?search=${encodeURIComponent(inviteQuery)}&limit=8`);
        const d = await res.json();
        const friendIds = new Set(friends.map(f => f.id));
        const results = (d.leaderboard || []).map(u => ({ ...u, isFriend: friendIds.has(u.id) }));
        results.sort((a, b) => (b.isFriend ? 1 : 0) - (a.isFriend ? 1 : 0));
        setInviteResults(results);
      } catch {}
      setInviteSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [inviteQuery, friends]);

  const loadGroupMembers = async (groupId) => {
    if (groupMembers[groupId]) { setExpandedGroupId(groupId); return; }
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/groups/members?groupId=${groupId}`);
      const d = await res.json();
      setGroupMembers(prev => ({ ...prev, [groupId]: d.members || [] }));
    } catch {}
    setExpandedGroupId(groupId);
    setMembersLoading(false);
  };

  const selectUser = (u) => {
    setInvitedUser({ id: u.id, name: u.name || u.displayName || 'Trader', username: u.username || '' });
    setInviteQuery('');
    setInviteResults([]);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const duration = form.durationType === 'custom'
        ? `${form.durationCustom} ${form.durationUnit}`
        : form.durationPreset;
      const body = {
        type,
        asset: form.asset,
        duration,
        stake: form.stake,
        description: form.description,
        isPublic: visibility === 'public',
      };
      if (visibility === 'private' && invitedUser) body.inviteUserId = invitedUser.id;
      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to post challenge'); setLoading(false); return; }
      onSuccess?.();
      onClose();
    } catch { setError('Network error — try again'); }
    setLoading(false);
  };

  const valid = form.description.trim().length > 0 && !loading &&
    (visibility === 'public' || (visibility === 'private' && invitedUser));

  const visOpts = [
    { key: 'public',  icon: 'ti-world', label: 'Public',  sub: 'Anyone can find & accept in Browse' },
    { key: 'private', icon: 'ti-lock',  label: 'Private', sub: 'Only the person you invite can accept' },
  ];

  // Shared user row used in both search results and group member list
  const UserRow = ({ u, isLast }) => (
    <div onClick={() => selectUser(u)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'background .12s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <H2HAvatar userId={u.id} name={u.name || u.displayName} size={30} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.name || u.displayName || 'Trader'}</div>
        {u.username && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>}
      </div>
      {u.isFriend && <span style={{ fontSize: 10, fontFamily: 'var(--font)', fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: 20 }}>Following</span>}
    </div>
  );

  const SelectedChip = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: '1.5px solid #534AB7', background: '#EEEDFE' }}>
      <H2HAvatar userId={invitedUser.id} name={invitedUser.name} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: '#534AB7' }}>{invitedUser.name}</div>
        {invitedUser.username && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: '#7c3aed' }}>@{invitedUser.username}</div>}
      </div>
      <button onClick={() => setInvitedUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontSize: 20, lineHeight: 1, padding: '0 2px' }}>×</button>
    </div>
  );

  return (
    <Modal title="Post a challenge" onClose={onClose}>
      <TypeToggle value={type} onChange={setType} />

      {/* Visibility toggle */}
      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Visibility</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {visOpts.map(v => (
            <button key={v.key} onClick={() => { setVisibility(v.key); setInvitedUser(null); setInviteQuery(''); setExpandedGroupId(null); }}
              style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${visibility === v.key ? '#534AB7' : 'var(--border)'}`, background: visibility === v.key ? '#EEEDFE' : 'var(--surface2)', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <i className={`ti ${v.icon}`} style={{ fontSize: 13, color: visibility === v.key ? '#534AB7' : 'var(--text-muted)' }} />
                <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: visibility === v.key ? '#534AB7' : 'var(--text)' }}>{v.label}</span>
              </div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.3 }}>{v.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Private invite section */}
      {visibility === 'private' && (
        <div style={{ marginBottom: 14 }}>
          {/* Sub-mode tabs: By person / By group */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {[{ key: 'person', label: '👤 By person' }, { key: 'group', label: '👥 From a group' }].map((m, i) => (
              <button key={m.key} onClick={() => { setPrivateMode(m.key); setInvitedUser(null); setInviteQuery(''); setExpandedGroupId(null); }}
                style={{ flex: 1, padding: '8px 0', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', background: privateMode === m.key ? '#534AB7' : 'var(--surface2)', color: privateMode === m.key ? '#fff' : 'var(--text-muted)', transition: 'all .15s' }}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Already selected someone */}
          {invitedUser ? (
            <SelectedChip />
          ) : privateMode === 'person' ? (
            /* ── By person: search with friends-first default ── */
            <div style={{ position: 'relative' }}>
              <input
                value={inviteQuery}
                onChange={e => setInviteQuery(e.target.value)}
                placeholder="Search by name or @username…"
                style={{ ...S.input, width: '100%', boxSizing: 'border-box' }}
                autoFocus
              />
              {/* Dropdown: search results or friends list */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginTop: 6, maxHeight: 220, overflowY: 'auto', background: 'var(--surface)' }}>
                {inviteQuery.trim() ? (
                  inviteSearching
                    ? <div style={{ padding: 12, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Searching…</div>
                    : inviteResults.length === 0
                    ? <div style={{ padding: 12, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>No users found</div>
                    : inviteResults.map((u, i) => <UserRow key={u.id} u={u} isLast={i === inviteResults.length - 1} />)
                ) : (
                  <>
                    {friends.length > 0 && (
                      <div style={{ padding: '6px 14px 4px', fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', background: 'var(--surface2)' }}>Following</div>
                    )}
                    {friends.length === 0
                      ? <div style={{ padding: 12, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Search for a trader above, or follow people to see them here</div>
                      : friends.map((u, i) => <UserRow key={u.id} u={{ ...u, isFriend: true }} isLast={i === friends.length - 1} />)
                    }
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── By group: pick a group → pick a member ── */
            <div>
              {groups.length === 0
                ? <div style={{ padding: '12px 0', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>You're not in any groups yet.</div>
                : groups.map(g => {
                  const isOpen = expandedGroupId === g.id;
                  const members = groupMembers[g.id] || [];
                  return (
                    <div key={g.id} style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6, overflow: 'hidden' }}>
                      <button onClick={() => isOpen ? setExpandedGroupId(null) : loadGroupMembers(g.id)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: isOpen ? '#EEEDFE' : 'var(--surface)', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#534AB7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                          {g.emoji || '👥'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: isOpen ? '#534AB7' : 'var(--text)' }}>{g.name}</div>
                          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{g._count?.members || 0} members</div>
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform .15s' }}>▼</span>
                      </button>
                      {isOpen && (
                        <div style={{ maxHeight: 180, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
                          {membersLoading && !members.length
                            ? <div style={{ padding: 12, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading members…</div>
                            : members.map((m, i) => <UserRow key={m.id} u={m} isLast={i === members.length - 1} />)
                          }
                        </div>
                      )}
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={S.label}>Asset class</label>
          <select value={form.asset} onChange={e => set('asset', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
            {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Duration</label>
          <DurationField
            durationType={form.durationType}
            durationPreset={form.durationPreset}
            durationCustom={form.durationCustom}
            durationUnit={form.durationUnit}
            onChange={setDur}
            presets={H2H_DURATION_PRESETS}
          />
        </div>
        {type === 'paid' && (
          <div>
            <label style={S.label}>Entry stake</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '8px 10px', background: 'var(--surface3)', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', borderRight: '1px solid var(--border)' }}>$</span>
              <input type="number" min="1" placeholder="e.g. 25" value={form.stake} onChange={e => set('stake', e.target.value)} style={{ ...S.input, borderRadius: 0, border: 'none', flex: 1 }} />
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Held in escrow until match ends</div>
          </div>
        )}
        {visibility === 'public' && (
          <div>
            <label style={S.label}>Max challengers</label>
            <input type="number" min="1" max="10" value={form.maxAccepts} onChange={e => set('maxAccepts', parseInt(e.target.value) || 1)} style={S.input} />
          </div>
        )}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Challenge rules & description *</label>
        <textarea
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Describe your challenge rules, asset restrictions, trading style requirements..."
          rows={3}
          style={{ ...S.input, resize: 'none' }}
        />
      </div>

      {error && <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{error}</div>}

      <WarnBox>
        {visibility === 'private'
          ? "Private challenge — only the invited trader can see and accept it. Won't appear in Browse."
          : type === 'paid'
          ? 'Matched to your league tier (±1 league). Entry stakes held in escrow until match completion. Verified broker required.'
          : 'Posted publicly to Browse. Anyone in your league tier (±1) can accept.'}
      </WarnBox>

      <ModalFooter
        onCancel={onClose}
        onSubmit={handleSubmit}
        submitLabel={loading ? 'Posting…' : visibility === 'private' ? 'Send invite' : 'Post challenge'}
        disabled={!valid}
      />
    </Modal>
  );
}

// ─── Create Group Contest Modal ───────────────────────────────────────────────
function CreateGroupModal({ onClose, onSuccess }) {
  const [type, setType] = useState('free');
  const [form, setForm] = useState({
    name: '',
    asset: 'Any',
    allowedSymbols: [],
    durationType: 'preset',
    durationPreset: '1 Month',
    durationCustom: '',
    durationUnit: 'days',
    fee: '',
    structure: 'Top 3 Split',
    minTrades: 10,
    desc: '',
    teamFormat: 'none',
    teamNameA: 'Team Alpha',
    teamNameB: 'Team Beta',
    teamSizeCustom: '10',
    maxTeams: '2',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Invite step state
  const [step, setStep] = useState('form'); // 'form' | 'invite'
  const [createdContest, setCreatedContest] = useState(null); // { id, name, asset, buyIn }
  const [inviteMode, setInviteMode] = useState('group'); // 'group' | 'person'
  const [inviteGroups, setInviteGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupChannels, setGroupChannels] = useState({});
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [personSearching, setPersonSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setDur = (patch) => setForm(p => ({ ...p, ...patch }));

  // Load groups when invite step opens (DB groups + local groups merged)
  useEffect(() => {
    if (step === 'invite') {
      fetch('/api/groups?mine=true').then(r => r.json()).then(d => {
        const dbGroups = d.groups || [];
        try {
          const local = JSON.parse(localStorage.getItem('tr_groups') || '[]');
          const localOnly = local.filter(lg => !dbGroups.find(dg => dg.id === lg.id));
          const merged = dbGroups.map(dg => {
            const match = local.find(l => l.id === dg.id);
            return (match?.profileImg || match?.grad) ? { ...dg, profileImg: match.profileImg, grad: match.grad } : dg;
          });
          setInviteGroups([...merged, ...localOnly]);
        } catch { setInviteGroups(dbGroups); }
      }).catch(() => {
        try { setInviteGroups(JSON.parse(localStorage.getItem('tr_groups') || '[]')); } catch {}
      });
    }
  }, [step]);

  // Debounced person search for invite
  useEffect(() => {
    if (step !== 'invite' || inviteMode !== 'person' || !personQuery.trim()) { setPersonResults([]); return; }
    setPersonSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/social/leaderboard?search=${encodeURIComponent(personQuery)}&limit=8`);
        const d = await res.json();
        setPersonResults(d.leaderboard || []);
      } catch {}
      setPersonSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [personQuery, step, inviteMode]);

  const TEAM_FORMAT_OPTS = [
    { v: 'none', l: 'None (free-for-all)' },
    { v: '5v5', l: '5v5' },
    { v: '10v10', l: '10v10' },
    { v: '20v20', l: '20v20' },
    { v: 'custom', l: 'Custom' },
  ];
  const parsedTeamSize = form.teamFormat === 'none' ? null
    : form.teamFormat === 'custom' ? (parseInt(form.teamSizeCustom) || 10)
    : parseInt(form.teamFormat.split('v')[0]);
  const finalTeamFormat = parsedTeamSize ? `${parsedTeamSize}v${parsedTeamSize}` : null;

  const feeNum = parseInt(form.fee) || 0;

  const getGeneralChannel = async (groupId) => {
    if (groupChannels[groupId]) return groupChannels[groupId];
    const res = await fetch(`/api/groups/channels?groupId=${groupId}`);
    const d = await res.json();
    const ch = (d.channels || []).find(c => c.name === 'general') || (d.channels || [])[0];
    if (ch) { setGroupChannels(prev => ({ ...prev, [groupId]: ch.id })); return ch.id; }
    return null;
  };

  const sendInviteToGroup = async () => {
    if (!selectedGroupId) return;
    setInviteSending(true); setInviteError('');
    try {
      const c = createdContest;
      const msg = `__CONTEST_INVITE__${JSON.stringify({ id: c.id, name: c.name, asset: c.asset || 'Any', buyIn: c.buyIn || 0, memberCount: c.memberCount || 1 })}`;
      const isLocalGroup = inviteGroups.find(g => g.id === selectedGroupId && !g.slug);
      if (isLocalGroup) {
        // Write directly to localStorage chat for local groups
        const chatKey = `tr_chat_${selectedGroupId}`;
        const existing = JSON.parse(localStorage.getItem(chatKey) || '[]');
        const newMsg = { id: Date.now(), user: 'you', avatar: 'Y', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: msg, type: 'contest_invite' };
        localStorage.setItem(chatKey, JSON.stringify([...existing, newMsg]));
      } else {
        const channelId = await getGeneralChannel(selectedGroupId);
        if (!channelId) { setInviteError('Could not find a channel in that group'); setInviteSending(false); return; }
        const postRes = await fetch('/api/groups/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelId, content: msg }) });
        if (!postRes.ok) { const d = await postRes.json().catch(() => ({})); setInviteError(d.error || 'Failed to post invite to group'); setInviteSending(false); return; }
      }
      setInviteSent(true);
    } catch { setInviteError('Failed to send — try again'); }
    setInviteSending(false);
  };

  const sendInviteToPerson = async () => {
    if (!selectedPerson) return;
    setInviteSending(true); setInviteError('');
    try {
      const c = createdContest;
      const msg = `__CONTEST_INVITE__${JSON.stringify({ id: c.id, name: c.name, asset: c.asset || 'Any', buyIn: c.buyIn || 0, memberCount: c.memberCount || 1 })}`;
      const res = await fetch('/api/social/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: selectedPerson.id, content: msg }) });
      if (!res.ok) { const d = await res.json(); setInviteError(d.error || 'Failed to send'); setInviteSending(false); return; }
      setInviteSent(true);
    } catch { setInviteError('Failed to send — try again'); }
    setInviteSending(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Contest name is required'); return; }
    setLoading(true); setError('');
    try {
      const duration = form.durationType === 'custom'
        ? `${form.durationCustom} ${form.durationUnit}`
        : form.durationPreset;

      const payload = {
        action: 'create',
        name: form.name.trim(),
        description: form.desc,
        asset: form.asset,
        allowedSymbols: form.allowedSymbols.length > 0 ? form.allowedSymbols : null,
        duration,
        buyIn: type === 'paid' ? form.fee : '0',
        teamFormat: finalTeamFormat,
        teamSize: parsedTeamSize,
        maxTeams: parsedTeamSize ? (parseInt(form.maxTeams) || 2) : null,
        teamNameA: form.teamNameA,
        teamNameB: form.teamNameB,
      };

      const res = await fetch('/api/group-contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) {
        const msg = data.error || `Server error ${res.status}`;
        console.error('[CreateGroupModal] error:', msg, data);
        setError(msg);
        setLoading(false);
        return;
      }
      // Contest created — notify parent and move to invite step
      onSuccess?.();
      setCreatedContest({ id: data.contestId, name: form.name.trim(), asset: form.asset, buyIn: type === 'paid' ? (parseFloat(form.fee) || 0) : 0 });
      setStep('invite');
    } catch (err) {
      console.error('[CreateGroupModal] network error:', err);
      setError('Network error — check your connection and try again');
    }
    setLoading(false);
  };

  const valid = form.name.trim().length > 0 && !loading;

  // ── Invite step (shown after contest is created) ──
  if (step === 'invite') {
    if (inviteSent) {
      return (
        <Modal title="Invite sent!" onClose={onClose} size="lg">
          <div style={{ textAlign: 'center', padding: '28px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
              {inviteMode === 'person' ? `DM sent to ${selectedPerson?.name}` : 'Invite posted to group'}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              {inviteMode === 'person' ? "They'll see it in their direct messages." : 'Members will see it in their group chat and can join from Browse.'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => { setInviteSent(false); setSelectedGroupId(''); setSelectedPerson(null); setPersonQuery(''); }} style={{ ...S.ghostBtn }}>Send another</button>
              <button onClick={onClose} style={{ ...S.primaryBtn }}>Done</button>
            </div>
          </div>
        </Modal>
      );
    }
    return (
      <Modal title={`Invite others to: ${createdContest?.name}`} onClose={onClose} size="lg">
        <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#059669', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
          🎉 Contest created! Invite people to join, or skip for now.
        </div>
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
          {[{ key: 'group', label: '👥 Send to a group' }, { key: 'person', label: '👤 Invite a person' }].map((m, i) => (
            <button key={m.key} onClick={() => { setInviteMode(m.key); setInviteError(''); setSelectedPerson(null); setPersonQuery(''); setSelectedGroupId(''); }}
              style={{ flex: 1, padding: '10px 0', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', background: inviteMode === m.key ? '#534AB7' : 'var(--surface2)', color: inviteMode === m.key ? '#fff' : 'var(--text-muted)' }}>
              {m.label}
            </button>
          ))}
        </div>

        {inviteMode === 'group' ? (
          <div>
            <label style={S.label}>Choose a group</label>
            {inviteGroups.length === 0
              ? <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>You're not in any groups yet.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 280, overflowY: 'auto' }}>
                {inviteGroups.map(g => (
                  <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${selectedGroupId === g.id ? '#534AB7' : 'var(--border)'}`, background: selectedGroupId === g.id ? '#EEEDFE' : 'var(--surface2)', cursor: 'pointer', textAlign: 'left' }}>
                    <GroupAvatar group={g} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: selectedGroupId === g.id ? '#534AB7' : 'var(--text)' }}>{g.name}</div>
                      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{g._count?.members || 0} members</div>
                    </div>
                    {selectedGroupId === g.id && <i className="ti ti-check" style={{ color: '#534AB7', fontSize: 16 }} />}
                  </button>
                ))}
              </div>
            }
            <WarnBox>The invite will be posted in the group's general channel.</WarnBox>
            {inviteError && <div style={{ margin: '8px 0', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{inviteError}</div>}
            <ModalFooter onCancel={onClose} cancelLabel="Skip" onSubmit={sendInviteToGroup} submitLabel={inviteSending ? 'Sending…' : 'Send invite'} disabled={!selectedGroupId || inviteSending} />
          </div>
        ) : (
          <div>
            <label style={S.label}>Search for a trader</label>
            {!selectedPerson ? (
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <input value={personQuery} onChange={e => setPersonQuery(e.target.value)}
                  placeholder="Name or @username…"
                  style={{ ...S.input, width: '100%', boxSizing: 'border-box' }}
                  autoFocus />
                {(personResults.length > 0 || personSearching) && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 999, marginTop: 4 }}>
                    {personSearching
                      ? <div style={{ padding: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Searching…</div>
                      : personResults.map((u, i) => (
                        <div key={u.id} onClick={() => { setSelectedPerson(u); setPersonQuery(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: i < personResults.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <H2HAvatar userId={u.id} name={u.name} size={36} />
                          <div>
                            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                            {u.username && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #534AB7', background: '#EEEDFE', marginBottom: 20 }}>
                <H2HAvatar userId={selectedPerson.id} name={selectedPerson.name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: '#534AB7' }}>{selectedPerson.name}</div>
                  {selectedPerson.username && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#7c3aed' }}>@{selectedPerson.username}</div>}
                </div>
                <button onClick={() => setSelectedPerson(null)} style={{ background: 'none', border: '1px solid #534AB7', borderRadius: 6, cursor: 'pointer', color: '#534AB7', fontSize: 12, fontFamily: 'var(--font)', padding: '4px 10px' }}>Change</button>
              </div>
            )}
            {selectedPerson && <WarnBox>A direct message with the contest details will be sent to {selectedPerson.name}.</WarnBox>}
            {inviteError && <div style={{ margin: '8px 0', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{inviteError}</div>}
            {selectedPerson && (
              <ModalFooter onCancel={onClose} cancelLabel="Skip" onSubmit={sendInviteToPerson} submitLabel={inviteSending ? 'Sending…' : 'Send DM invite'} disabled={!selectedPerson || inviteSending} />
            )}
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Create a group contest" onClose={onClose}>
      <TypeToggle value={type} onChange={setType} freeLabel="Free contest" paidLabel="Paid contest" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>Contest name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. COT Monthly Commodities Cup" style={S.input} />
        </div>
        <div>
          <label style={S.label}>Asset class</label>
          <select value={form.asset} onChange={e => { set('asset', e.target.value); set('allowedSymbols', []); }} style={{ ...S.input, cursor: 'pointer' }}>
            {ASSET_CLASSES.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        {form.asset !== 'Any' && INSTRUMENTS[form.asset] && (
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={S.label}>
              Allowed instruments
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: 'var(--text-muted)' }}>
                — leave blank to allow any {form.asset}
              </span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {INSTRUMENTS[form.asset].map(({ sym, label }) => {
                const selected = form.allowedSymbols.includes(sym);
                return (
                  <button key={sym} type="button"
                    onClick={() => set('allowedSymbols', selected ? form.allowedSymbols.filter(s => s !== sym) : [...form.allowedSymbols, sym])}
                    style={{ padding: '5px 12px', borderRadius: 20, cursor: 'pointer', border: `1.5px solid ${selected ? '#534AB7' : 'var(--border)'}`, background: selected ? '#EEEDFE' : 'transparent', color: selected ? '#534AB7' : 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 12, fontWeight: selected ? 600 : 400 }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {form.allowedSymbols.length > 0 && (
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: '#534AB7', marginTop: 6 }}>
                {form.allowedSymbols.length} instrument{form.allowedSymbols.length !== 1 ? 's' : ''} selected — only these can be traded
              </div>
            )}
          </div>
        )}
        <div>
          <label style={S.label}>Duration</label>
          <DurationField
            durationType={form.durationType}
            durationPreset={form.durationPreset}
            durationCustom={form.durationCustom}
            durationUnit={form.durationUnit}
            onChange={setDur}
            presets={GROUP_DURATION_PRESETS}
          />
        </div>
        {type === 'paid' && (
          <div>
            <label style={S.label}>Entry fee / group</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <span style={{ padding: '8px 10px', background: 'var(--surface3)', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font)', borderRight: '1px solid var(--border)' }}>$</span>
              <input type="number" min="1" placeholder="e.g. 50" value={form.fee} onChange={e => set('fee', e.target.value)} style={{ ...S.input, borderRadius: 0, border: 'none', flex: 1 }} />
            </div>
          </div>
        )}
        {type === 'paid' && (
          <div>
            <label style={S.label}>Prize structure</label>
            <select value={form.structure} onChange={e => set('structure', e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
              {PRIZE_STRUCTURES.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        )}
        <div>
          <label style={S.label}>Min trades required</label>
          <input type="number" min="1" value={form.minTrades} onChange={e => set('minTrades', parseInt(e.target.value) || 1)} style={S.input} />
        </div>

        {/* Team format */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>Team format</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TEAM_FORMAT_OPTS.map(({ v, l }) => (
              <button key={v} type="button" onClick={() => set('teamFormat', v)} style={{
                padding: '5px 13px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${form.teamFormat === v ? '#534AB7' : 'var(--border)'}`,
                background: form.teamFormat === v ? '#EEEDFE' : 'transparent',
                color: form.teamFormat === v ? '#534AB7' : 'var(--text-muted)',
                fontFamily: 'var(--font)', fontSize: 12, fontWeight: form.teamFormat === v ? 600 : 400,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {form.teamFormat !== 'none' && (
          <>
            {form.teamFormat === 'custom' && (
              <div>
                <label style={S.label}>Players per team</label>
                <input type="number" min={2} max={50} value={form.teamSizeCustom} onChange={e => set('teamSizeCustom', e.target.value)} style={S.input} />
              </div>
            )}
            <div>
              <label style={S.label}>Number of teams</label>
              <input type="number" min={2} max={16} value={form.maxTeams} onChange={e => set('maxTeams', e.target.value)} style={S.input} placeholder="2" />
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>How many teams can join this contest</div>
            </div>
            {parseInt(form.maxTeams) <= 2 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Team names</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input value={form.teamNameA} onChange={e => set('teamNameA', e.target.value)} placeholder="Team Alpha" style={{ ...S.input, flex: 1 }} />
                  <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>VS</span>
                  <input value={form.teamNameB} onChange={e => set('teamNameB', e.target.value)} placeholder="Team Beta" style={{ ...S.input, flex: 1 }} />
                </div>
                {parsedTeamSize && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{parsedTeamSize} slots per team — players pick their side when joining</div>}
              </div>
            )}
            {parseInt(form.maxTeams) > 2 && parsedTeamSize && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{parseInt(form.maxTeams)} teams × {parsedTeamSize} players — teams are auto-named Team 1, Team 2, etc.</div>
              </div>
            )}
          </>
        )}

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>Rules / description</label>
          <textarea
            value={form.desc}
            onChange={e => set('desc', e.target.value)}
            rows={3}
            placeholder="Describe rules, allowed assets, and any special conditions..."
            style={{ ...S.input, resize: 'none' }}
          />
        </div>
      </div>

      {error && <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{error}</div>}

      <WarnBox>
        {type === 'paid'
          ? 'Entry fees held in escrow. Paid contest results appear on the paid leaderboard.'
          : 'Free contest — no entry fee. Results appear on the free leaderboard.'}
      </WarnBox>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={loading ? 'Creating…' : 'Create contest'} disabled={!valid} />
    </Modal>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
// ─── H2H TAB ──────────────────────────────────────────────────────────────────
function H2HTab({ currentUserId, onOpenProfile, onSwitchToGroup }) {
  const [inner, setInner] = useState('browse');
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('Any');
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState({ open: [], myMatches: [], invites: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/challenges')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When a match is selected, render it full-width (no H2H sidebar)
  if (selectedMatchId) {
    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <MatchDetailView
          matchId={selectedMatchId}
          onBack={() => { setSelectedMatchId(null); fetchData(); }}
          onDelete={() => { setSelectedMatchId(null); fetchData(); }}
        />
      </div>
    );
  }

  const handleAccept = async (matchId) => {
    await fetch('/api/challenges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, action: 'accept' }) });
    fetchData();
  };

  const handleDecline = async (matchId) => {
    await fetch('/api/challenges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, action: 'decline' }) });
    fetchData();
  };

  const handleDeleteMatch = async (matchId) => {
    if (!confirm('Delete this match? This cannot be undone.')) return;
    await fetch('/api/challenges', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId }) });
    fetchData();
  };

  const filteredOpen = (data.open || []).filter(m => {
    const matchAsset = assetFilter === 'Any' || m.asset === assetFilter || m.asset === 'Any';
    const matchSearch = !search || m.challengerName.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    return matchAsset && matchSearch;
  });

  const ASSETS = ['Any', 'Forex', 'Commodities', 'Futures', 'Stocks', 'Crypto'];
  const inviteCount = (data.invites || []).length;
  const myMatchCount = (data.myMatches || []).length;

  const sidebarNav = [
    { key: 'browse', label: 'Browse', badge: null },
    { key: 'mymatches', label: 'My matches', badge: myMatchCount > 0 ? myMatchCount : null },
    { key: 'invites', label: 'Invites', badge: inviteCount > 0 ? inviteCount : null },
    { key: 'leaderboard', label: 'Leaderboard', badge: null },
    { key: 'history', label: 'History', badge: null },
  ];

  const renderGrid = (items, emptyTitle = 'No open challenges', emptySub = 'Be the first — post a challenge above') => (
    loading ? (
      <div style={{ textAlign:'center', padding:'60px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Loading…</div>
    ) : items.length === 0 ? (
      <EmptyState icon="ti-swords" title={emptyTitle} sub={emptySub} btnLabel="Post challenge" onBtnClick={() => setShowModal(true)} />
    ) : (
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {items}
      </div>
    )
  );

  return (
    <div style={{ display:'flex', flex:1, minHeight:0, width:'100%' }}>
      {showModal && <PostChallengeModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}

      {/* ── Sidebar ── */}
      <div style={{ width:220, flexShrink:0, borderRight:'1px solid var(--border)', padding:'20px 16px', display:'flex', flexDirection:'column', gap:0, overflowY:'auto' }}>
        {/* Mode pill */}
        <div style={{ display:'flex', background:'var(--surface2)', borderRadius:8, padding:3, gap:2, marginBottom:16 }}>
          <button style={{ flex:1, padding:'5px 0', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'default' }}>Singles</button>
          <button onClick={onSwitchToGroup} style={{ flex:1, padding:'5px 0', borderRadius:6, border:'none', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:400, cursor:'pointer' }}>Group</button>
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Singles</div>
        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Challenge traders 1v1</div>

        <button onClick={() => setShowModal(true)}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, background:'#111827', color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <i className="ti ti-plus" aria-hidden="true" /> Post challenge
        </button>

        {/* Nav items */}
        <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:8 }}>
          {sidebarNav.map((item, idx) => item === null
            ? <div key={idx} style={{ height:1, background:'var(--border)', margin:'6px 0' }} />
            : <button key={item.key} onClick={() => setInner(item.key)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', borderRadius:8, border:'none', background: inner===item.key ? 'var(--surface2)' : 'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight: inner===item.key ? 600 : 400, color: inner===item.key ? 'var(--text)' : 'var(--text-muted)', cursor:'pointer', textAlign:'left' }}>
                {item.label}
                {item.badge && (
                  <span style={{ background: item.key === 'invites' ? '#ef4444' : '#534AB7', color:'#fff', borderRadius:20, minWidth:20, height:20, padding:'0 5px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{item.badge}</span>
                )}
              </button>
          )}
        </div>

        {inner === 'browse' && (<>
          <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:8, marginTop:8 }}>Market</div>
          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {ASSETS.map(a => (
              <button key={a} onClick={() => setAssetFilter(a)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'none', background: assetFilter===a ? 'var(--surface2)' : 'transparent', fontFamily:'var(--font)', fontSize:13, fontWeight: assetFilter===a ? 500 : 400, color: 'var(--text)', cursor:'pointer', textAlign:'left' }}>
                {a}
              </button>
            ))}
          </div>
        </>)}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, overflowY:'auto', padding: (inner==='leaderboard'||inner==='history') ? 0 : '20px 24px' }}>
        {inner !== 'leaderboard' && inner !== 'history' && (
          <div style={{ marginBottom:20 }}>
            <SearchBar placeholder="Search by trader name or @username..." value={search} onChange={setSearch} />
          </div>
        )}

        {inner === 'browse' && renderGrid(
          filteredOpen.map(m => <ChallengeCard key={m.id} match={m} onAccept={handleAccept} onOpenProfile={onOpenProfile} />)
        )}

        {inner === 'mymatches' && (() => {
          if (loading) return <div style={{ textAlign:'center', padding:'60px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Loading…</div>;
          const live    = (data.myMatches || []).filter(m => m.status === 'active');
          const pending = (data.myMatches || []).filter(m => m.status === 'waiting');
          if (live.length === 0 && pending.length === 0)
            return <EmptyState icon="ti-shield" title="No matches yet" sub="Post or accept a challenge to get started" btnLabel="Post challenge" onBtnClick={() => setShowModal(true)} />;
          const SectionLabel = ({ text }) => (
            <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'4px 0 12px' }}>{text}</div>
          );
          return (
            <>
              {live.length > 0 && (
                <>
                  <SectionLabel text="Live matches" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom: pending.length > 0 ? 24 : 0 }}>
                    {live.map(m => <MatchCard key={m.id} match={m} currentUserId={currentUserId} onClick={() => setSelectedMatchId(m.id)} onDelete={handleDeleteMatch} />)}
                  </div>
                </>
              )}
              {pending.length > 0 && (
                <>
                  <SectionLabel text="Pending challenges" />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {pending.map(m => <MatchCard key={m.id} match={m} currentUserId={currentUserId} onClick={() => setSelectedMatchId(m.id)} onDelete={handleDeleteMatch} />)}
                  </div>
                </>
              )}
            </>
          );
        })()}

        {inner === 'invites' && (
          loading ? (
            <div style={{ textAlign:'center', padding:'60px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Loading…</div>
          ) : (data.invites || []).length === 0 ? (
            <EmptyState icon="ti-bell" title="No invites" sub="When traders challenge you, they appear here" />
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {(data.invites || []).map(m => <InviteCard key={m.id} match={m} onAccept={handleAccept} onDecline={handleDecline} onOpenProfile={onOpenProfile} />)}
            </div>
          )
        )}
        {inner === 'leaderboard' && <LeaderboardTab currentUserId={currentUserId} onOpenProfile={onOpenProfile} />}
        {inner === 'history' && <HistoryTab currentUserId={currentUserId} />}
      </div>
    </div>
  );
}


// ─── Create / Edit Team Modal ────────────────────────────────────────────────
function CreateTeamModal({ contestId, existingTeam, onClose, onSuccess }) {
  const isEdit = !!existingTeam;
  const [form, setForm] = useState({
    name: existingTeam?.name || '',
    emoji: existingTeam?.emoji || '⚡',
    color: existingTeam?.color || '#534AB7',
    description: existingTeam?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Team name is required'); return; }
    setLoading(true); setError('');
    try {
      let res;
      if (isEdit) {
        res = await fetch('/api/group-contests/teams', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId: existingTeam.id, ...form }) });
      } else {
        res = await fetch('/api/group-contests/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', contestId, ...form }) });
      }
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed'); setLoading(false); return; }
      onSuccess?.();
      onClose();
    } catch { setError('Network error'); }
    setLoading(false);
  };

  return (
    <Modal title={isEdit ? 'Edit team' : 'Create a team'} onClose={onClose}>
      {/* Live preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 11, background: form.color + '22', border: `2px solid ${form.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {form.emoji}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: form.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.name || 'Your team name'}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.description || 'Team description'}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Team name *</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. The Alpha Bears" style={S.input} maxLength={30} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Team emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TEAM_EMOJIS.map(em => (
            <button key={em} onClick={() => set('emoji', em)} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.emoji === em ? form.color : 'var(--border)'}`, background: form.emoji === em ? form.color + '18' : 'var(--surface2)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{em}</button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={S.label}>Team color</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TEAM_COLORS.map(c => (
            <button key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? 'var(--text)' : 'transparent'}`, cursor: 'pointer', flexShrink: 0 }} />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={S.label}>Description (optional)</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What's your team about?" rows={2} style={{ ...S.input, resize: 'none' }} maxLength={120} />
      </div>

      {error && <div style={{ marginBottom: 10, padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{error}</div>}
      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={loading ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create team')} disabled={!form.name.trim() || loading} />
    </Modal>
  );
}

// ─── Teams View ───────────────────────────────────────────────────────────────
function TeamsView({ contestId, currentUserId }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState(null);

  const fetchTeams = useCallback(() => {
    setLoading(true);
    fetch(`/api/group-contests/teams?contestId=${contestId}`)
      .then(r => r.json())
      .then(d => { setTeams(d.teams || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [contestId]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const myTeam = teams.find(t => t.isMyTeam);
  const hasTeam = !!myTeam;

  const handleJoin = async (teamId) => {
    await fetch('/api/group-contests/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId, teamId }) });
    fetchTeams();
  };

  const handleLeave = async () => {
    if (!confirm('Leave your team?')) return;
    await fetch('/api/group-contests/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'leave', contestId }) });
    fetchTeams();
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Delete this team? All members will be unlinked.')) return;
    await fetch('/api/group-contests/teams', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teamId }) });
    fetchTeams();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading teams…</div>;

  return (
    <div style={{ padding: '14px 18px' }}>
      {(showCreate || editTeam) && (
        <CreateTeamModal
          contestId={contestId}
          existingTeam={editTeam}
          onClose={() => { setShowCreate(false); setEditTeam(null); }}
          onSuccess={() => { fetchTeams(); setShowCreate(false); setEditTeam(null); }}
        />
      )}

      {/* My team banner */}
      {myTeam && (
        <div style={{ background: myTeam.color + '12', border: `1px solid ${myTeam.color}44`, borderRadius: 11, padding: '12px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 26 }}>{myTeam.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: myTeam.color }}>{myTeam.name}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>Your team · {myTeam.memberCount} member{myTeam.memberCount !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {myTeam.isCaptain && (
              <button onClick={() => setEditTeam(myTeam)} style={{ padding: '5px 10px', border: `1px solid ${myTeam.color}`, borderRadius: 7, background: 'transparent', color: myTeam.color, fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                <i className="ti ti-settings" /> Edit
              </button>
            )}
            <button onClick={handleLeave} style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'transparent', color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer' }}>Leave</button>
          </div>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Teams ({teams.length})
        </div>
      </div>

      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No teams yet</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>Teams will appear here once the contest has started</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {teams.map((team, i) => {
            const isExpanded = expanded === team.id;
            const pnlColor = team.teamPnl > 0 ? '#059669' : team.teamPnl < 0 ? '#dc2626' : 'var(--text-muted)';
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
            return (
              <div key={team.id} style={{ background: 'var(--surface)', border: `1px solid ${team.isMyTeam ? team.color + '55' : 'var(--border)'}`, borderRadius: 11, overflow: 'hidden' }}>
                {/* Header row */}
                <div onClick={() => setExpanded(isExpanded ? null : team.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer' }}>
                  <div style={{ width: 22, textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, flexShrink: 0 }}>{medal || <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</span>}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: team.color + '18', border: `1px solid ${team.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{team.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {team.name}
                      {team.isMyTeam && <span style={{ fontSize: 10, background: team.color + '18', color: team.color, padding: '1px 6px', borderRadius: 10 }}>YOU</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''} · Cap: {team.captainName}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: pnlColor }}>{team.teamPnl >= 0 ? '+' : '-'}${Math.abs(team.teamPnl).toFixed(2)}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)' }}>team P&L</div>
                  </div>
                  <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
                </div>

                {/* Expanded: members + actions */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '10px 14px' }}>
                    {team.description && (
                      <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>"{team.description}"</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                      {team.members.length === 0 ? (
                        <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>No members yet — join to be first!</div>
                      ) : team.members.map((m, mi) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: m.id === currentUserId ? team.color + '10' : 'var(--surface2)', borderRadius: 8 }}>
                          <div style={{ width: 20, fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>{mi + 1}</div>
                          <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
                            {m.name}{m.isCaptain && <span style={{ marginLeft: 4, fontSize: 11 }}>👑</span>}
                          </div>
                          <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: m.pnl >= 0 ? '#059669' : '#dc2626' }}>
                            {m.pnl >= 0 ? '+' : '-'}${Math.abs(m.pnl).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!hasTeam && (
                        <button onClick={() => handleJoin(team.id)} style={{ ...S.primaryBtn, flex: 1, justifyContent: 'center', padding: '7px' }}>Join this team</button>
                      )}
                      {team.isCaptain && (
                        <>
                          <button onClick={() => setEditTeam(team)} style={{ flex: 1, padding: '7px', border: `1px solid ${team.color}`, borderRadius: 8, background: 'transparent', color: team.color, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            <i className="ti ti-settings" /> Edit team
                          </button>
                          <button onClick={() => handleDeleteTeam(team.id)} style={{ padding: '7px 10px', border: '1px solid #fca5a5', borderRadius: 8, background: 'transparent', color: '#dc2626', fontFamily: 'var(--font)', fontSize: 12, cursor: 'pointer' }}>
                            <i className="ti ti-trash" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// ─── Contest Leaderboard (live P&L from paper trading) ───────────────────────
function ContestLeaderboard({ contestId, currentUserId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    fetch(`/api/group-contests/preview?id=${contestId}`)
      .then(r => r.json())
      .then(d => { setMembers(d.members || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [contestId]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading leaderboard…</div>;

  if (members.length === 0) return (
    <div style={{ textAlign: 'center', padding: '36px 18px' }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No trades yet</div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Place your first trade to appear on the leaderboard</div>
    </div>
  );

  return (
    <div style={{ padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Individual standings — live P&L
        </div>
        <button onClick={fetchLeaderboard} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontFamily: 'var(--font)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="ti ti-refresh" /> Refresh
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((m, i) => {
          const isMe = m.id === currentUserId;
          const pnlColor = m.pnl > 0 ? '#059669' : m.pnl < 0 ? '#dc2626' : 'var(--text-muted)';
          return (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: isMe ? 'rgba(83,74,183,0.06)' : 'var(--surface2)', border: isMe ? '1px solid #534AB733' : '1px solid transparent', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ width: 26, textAlign: 'center', fontFamily: 'var(--font)', fontSize: 14, flexShrink: 0 }}>
                {medals[i] || <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: isMe ? 700 : 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {m.name}
                  {isMe && <span style={{ fontSize: 10, background: '#534AB718', color: '#534AB7', padding: '1px 6px', borderRadius: 10 }}>YOU</span>}
                </div>
                {m.teamName && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{m.teamName}</div>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: pnlColor }}>
                  {m.pnl >= 0 ? '+' : '-'}${Math.abs(m.pnl).toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contest Detail View (Group Paper Trading) ────────────────────────────────
// ─── TEAM BATTLE VIEW ─────────────────────────────────────────────────────────
function TeamBattleView({ contestId, currentUserId, teamSize: propTeamSize }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/group-contests/preview?id=${contestId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [contestId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
  );

  const teams = data?.teams || [];
  const teamSize = data?.teamSize || propTeamSize || null;
  const fmtPnl = v => `${v >= 0 ? '+' : '-'}$${Math.abs(v).toFixed(2)}`;

  if (teams.length === 0) return (
    <div style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
      No teams found for this contest.
    </div>
  );

  return (
    <div style={{ padding: 18 }}>
      {/* Team summary header */}
      {teams.length === 2 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          {[teams[0], null, teams[1]].map((team, i) =>
            team === null ? (
              <div key="vs" style={{ textAlign: 'center', fontFamily: 'var(--font)', fontSize: 16, fontWeight: 800, color: 'var(--text-muted)' }}>VS</div>
            ) : (
              <div key={team.id} style={{ background: team.color + '12', border: `1.5px solid ${team.color}55`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{team.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.teamPnl >= 0 ? '#059669' : '#dc2626' }}>{fmtPnl(team.teamPnl)}</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{team.memberCount}{teamSize ? `/${teamSize}` : ''} players</div>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${teams.length}, 1fr)`, gap: 10, marginBottom: 16 }}>
          {teams.map(team => (
            <div key={team.id} style={{ background: team.color + '12', border: `1.5px solid ${team.color}55`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{team.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.color }}>{team.name}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: team.teamPnl >= 0 ? '#059669' : '#dc2626' }}>{fmtPnl(team.teamPnl)}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{team.memberCount}{teamSize ? `/${teamSize}` : ''} players</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column member rankings */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(teams.length, 2)}, 1fr)`, gap: 10 }}>
        {teams.map(team => {
          const emptySlots = teamSize ? Math.max(0, teamSize - team.memberCount) : 0;
          return (
            <div key={team.id} style={{ background: 'var(--surface)', border: `1.5px solid ${team.color}30`, borderRadius: 12, overflow: 'hidden' }}>
              {/* Column header */}
              <div style={{ background: team.color + '18', borderBottom: `1px solid ${team.color}30`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>{team.emoji}</span>
                <span style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: team.color, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{team.memberCount}{teamSize ? `/${teamSize}` : ''}</span>
              </div>

              {/* Ranked members */}
              {team.members.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No members yet</div>
              ) : (
                team.members.map((m, i) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--border)', background: m.id === currentUserId ? team.color + '0A' : 'transparent' }}>
                    <div style={{ width: 18, fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700, color: i === 0 ? team.color : 'var(--text-muted)', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text)', fontWeight: m.id === currentUserId ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name}
                      {m.id === currentUserId && <span style={{ marginLeft: 5, fontSize: 9, background: team.color, color: '#fff', padding: '1px 5px', borderRadius: 6 }}>YOU</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: m.pnl >= 0 ? '#059669' : '#dc2626', flexShrink: 0 }}>{fmtPnl(m.pnl)}</div>
                  </div>
                ))
              )}

              {/* Open slots */}
              {emptySlots > 0 && Array.from({ length: Math.min(emptySlots, 3) }).map((_, i) => (
                <div key={`slot-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderBottom: '1px solid var(--border)', opacity: 0.35 }}>
                  <div style={{ width: 18, fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{team.memberCount + i + 1}</div>
                  <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Open slot</div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>—</div>
                </div>
              ))}
              {emptySlots > 3 && (
                <div style={{ padding: '7px 12px', fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>+{emptySlots - 3} more open slots</div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={load} style={{ marginTop: 14, ...S.ghostBtn, width: '100%', justifyContent: 'center' }}>
        <i className="ti ti-refresh" /> Refresh standings
      </button>
    </div>
  );
}

// ─── CONTEST DETAIL VIEW ───────────────────────────────────────────────────────
function ContestDetailView({ contest, onBack, onDelete, currentUserId }) {
  const hasTeamFormat = !!(contest.teamFormat);
  const [tab, setTab] = useState(hasTeamFormat ? 'battle' : 'leaderboard');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!contest?.id) return;
    fetch(`/api/group-contests/preview?id=${contest.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {});
  }, [contest?.id]);

  const endDate = detail?.endDate || contest.endDate || null;
  const tabs = hasTeamFormat
    ? [['battle', '⚔️ Battle'], ['paper', '📊 Trade'], ['info', 'ℹ️ Info']]
    : [['leaderboard', '🏆 Leaderboard'], ['paper', '📊 Trade'], ['teams', '⚔️ Teams'], ['info', 'ℹ️ Info']];

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 10px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#534AB7', fontFamily: 'var(--font)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}>
          <i className="ti ti-arrow-left" /> Back
        </button>
        <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {contest.name}
          {hasTeamFormat && <span style={{ marginLeft: 8, fontSize: 11, background: '#EEEDFE', color: '#534AB7', padding: '2px 7px', borderRadius: 10, fontWeight: 500 }}>{contest.teamFormat}</span>}
        </div>
        {endDate && (
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
            {new Date(endDate) > Date.now() ? `ends ${new Date(endDate).toLocaleDateString()}` : 'Ended'}
          </div>
        )}
        {contest.isCreator && (
          <button
            onClick={async () => {
              if (!confirm('Delete this contest? All entries and trades will be permanently removed.')) return;
              await onDelete?.(contest.id);
              onBack();
            }}
            style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', color: '#dc2626', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <i className="ti ti-trash" style={{ fontSize: 14 }} /> Delete
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 0, paddingLeft: 18 }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 14px', fontFamily: 'var(--font)', fontSize: 12,
            fontWeight: tab === k ? 600 : 400,
            color: tab === k ? '#534AB7' : 'var(--text-muted)',
            background: 'none', border: 'none',
            borderBottom: tab === k ? '2px solid #534AB7' : '2px solid transparent',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'paper' && (
        <CompetitionTradingView
          competitionId={contest.id}
          competitionType="group"
          endDate={endDate}
          title={contest.name}
          allowedAsset={!contest.allowedSymbols && contest.asset !== 'Any' ? contest.asset : null}
          allowedSymbols={contest.allowedSymbols || null}
        />
      )}

      {tab === 'battle' && hasTeamFormat && (
        <TeamBattleView contestId={contest.id} currentUserId={currentUserId} teamSize={contest.teamSize} />
      )}

      {tab === 'teams' && !hasTeamFormat && (
        <TeamsView contestId={contest.id} currentUserId={currentUserId} />
      )}

      {tab === 'leaderboard' && !hasTeamFormat && (
        <ContestLeaderboard contestId={contest.id} currentUserId={currentUserId} />
      )}

      {tab === 'info' && (
        <div style={{ padding: '14px 18px' }}>
          {contest.description && (
            <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
              {contest.description}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Asset', v: contest.asset || 'Any' },
              { l: 'Members', v: detail?.memberCount ?? contest.memberCount },
              { l: 'Buy-in', v: contest.buyIn > 0 ? `$${contest.buyIn}` : 'Free' },
              { l: 'Prize', v: detail?.prizeStructure || 'Winner Takes All' },
            ].map(({ l, v }) => (
              <div key={l} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px' }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{l}</div>
                <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Group avatar helper ──────────────────────────────────────────────────────
function GroupAvatar({ group, size = 36 }) {
  const [imgOk, setImgOk] = useState(true);
  const src = group.imageUrl || group.profileImg || null;
  if (src && imgOk) {
    return (
      <img src={src} onError={() => setImgOk(false)} alt=""
        style={{ width: size, height: size, borderRadius: size * 0.25, objectFit: 'cover', flexShrink: 0 }} />
    );
  }
  const _colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  const letter = (group.name || '?')[0].toUpperCase();
  const bg = group.grad || _colors[letter.charCodeAt(0) % _colors.length];
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.25, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
      {letter}
    </div>
  );
}

// ─── Contest Invite Modal ─────────────────────────────────────────────────────
function ContestInviteModal({ contest, onClose }) {
  const [mode, setMode] = useState('group'); // 'group' | 'person'
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupChannels, setGroupChannels] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMode, setSentMode] = useState('group');
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [personSearching, setPersonSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/groups?mine=true').then(r => r.json()).then(d => {
      const dbGroups = d.groups || [];
      try {
        const local = JSON.parse(localStorage.getItem('tr_groups') || '[]');
        const localOnly = local.filter(lg => !dbGroups.find(dg => dg.id === lg.id));
        const merged = dbGroups.map(dg => {
          const match = local.find(l => l.id === dg.id);
          return (match?.profileImg || match?.grad) ? { ...dg, profileImg: match.profileImg, grad: match.grad } : dg;
        });
        setGroups([...merged, ...localOnly]);
      } catch { setGroups(dbGroups); }
    }).catch(() => {
      try { setGroups(JSON.parse(localStorage.getItem('tr_groups') || '[]')); } catch {}
    });
  }, []);

  useEffect(() => {
    if (mode !== 'person' || !personQuery.trim()) { setPersonResults([]); return; }
    setPersonSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/social/leaderboard?search=${encodeURIComponent(personQuery)}&limit=8`);
        const d = await res.json();
        setPersonResults(d.leaderboard || []);
      } catch {}
      setPersonSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [personQuery, mode]);

  const getGeneralChannel = async (groupId) => {
    if (groupChannels[groupId]) return groupChannels[groupId];
    const res = await fetch(`/api/groups/channels?groupId=${groupId}`);
    const d = await res.json();
    const ch = (d.channels || []).find(c => c.name === 'general') || (d.channels || [])[0];
    if (ch) { setGroupChannels(prev => ({ ...prev, [groupId]: ch.id })); return ch.id; }
    return null;
  };

  const handleSendToGroup = async () => {
    if (!selectedGroupId) return;
    setSending(true); setError('');
    try {
      const msg = `__CONTEST_INVITE__${JSON.stringify({ id: contest.id, name: contest.name, asset: contest.asset || 'Any', buyIn: contest.buyIn || 0, memberCount: contest.memberCount || 1 })}`;
      const isLocalGroup = groups.find(g => g.id === selectedGroupId && !g.slug);
      if (isLocalGroup) {
        const chatKey = `tr_chat_${selectedGroupId}`;
        const existing = JSON.parse(localStorage.getItem(chatKey) || '[]');
        const newMsg = { id: Date.now(), user: 'you', avatar: 'Y', grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: msg, type: 'contest_invite' };
        localStorage.setItem(chatKey, JSON.stringify([...existing, newMsg]));
      } else {
        const channelId = await getGeneralChannel(selectedGroupId);
        if (!channelId) { setError('Could not find a channel in that group'); setSending(false); return; }
        const postRes = await fetch('/api/groups/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelId, content: msg }) });
        if (!postRes.ok) { const d = await postRes.json().catch(() => ({})); setError(d.error || 'Failed to post invite to group'); setSending(false); return; }
      }
      setSentMode('group'); setSent(true);
    } catch { setError('Failed to send — try again'); }
    setSending(false);
  };

  const handleSendToPerson = async () => {
    if (!selectedPerson) return;
    setSending(true); setError('');
    try {
      const msg = `__CONTEST_INVITE__${JSON.stringify({ id: contest.id, name: contest.name, asset: contest.asset || 'Any', buyIn: contest.buyIn || 0, memberCount: contest.memberCount || 1 })}`;
      const res = await fetch('/api/social/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiverId: selectedPerson.id, content: msg }) });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed to send'); setSending(false); return; }
      setSentMode('person'); setSent(true);
    } catch { setError('Failed to send — try again'); }
    setSending(false);
  };

  if (sent) {
    return (
      <Modal title="Invite sent!" onClose={onClose} size="lg">
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
            {sentMode === 'person' ? `DM sent to ${selectedPerson?.name}` : 'Invite posted to group'}
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
            {sentMode === 'person' ? "They'll see it in their direct messages." : 'Members will see it in their group chat and can join from Browse.'}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => { setSent(false); setSelectedPerson(null); setPersonQuery(''); setSelectedGroupId(''); }} style={{ ...S.ghostBtn }}>Send another</button>
            <button onClick={onClose} style={{ ...S.primaryBtn }}>Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Invite to: ${contest.name}`} onClose={onClose} size="lg">
      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, border: '1px solid var(--border)', borderRadius: 9, overflow: 'hidden' }}>
        {[{ key: 'group', label: '👥 Send to a group' }, { key: 'person', label: '👤 Invite a person' }].map((m, i) => (
          <button key={m.key} onClick={() => { setMode(m.key); setError(''); setSelectedPerson(null); setPersonQuery(''); setSelectedGroupId(''); }}
            style={{ flex: 1, padding: '10px 0', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', background: mode === m.key ? '#534AB7' : 'var(--surface2)', color: mode === m.key ? '#fff' : 'var(--text-muted)' }}>
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'group' ? (
        <div>
          <label style={S.label}>Choose a group</label>
          {groups.length === 0
            ? <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>You're not in any groups yet.</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 300, overflowY: 'auto' }}>
              {groups.map(g => (
                <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${selectedGroupId === g.id ? '#534AB7' : 'var(--border)'}`, background: selectedGroupId === g.id ? '#EEEDFE' : 'var(--surface2)', cursor: 'pointer', textAlign: 'left' }}>
                  <GroupAvatar group={g} size={38} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: selectedGroupId === g.id ? '#534AB7' : 'var(--text)' }}>{g.name}</div>
                    <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>{g._count?.members || 0} members</div>
                  </div>
                  {selectedGroupId === g.id && <i className="ti ti-check" style={{ color: '#534AB7', fontSize: 16 }} />}
                </button>
              ))}
            </div>
          }
          <WarnBox>The invite will be posted in the group's general channel. Members can join from Compete → Group → Browse.</WarnBox>
          {error && <div style={{ margin: '8px 0', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{error}</div>}
          <ModalFooter onCancel={onClose} onSubmit={handleSendToGroup} submitLabel={sending ? 'Sending…' : 'Send invite'} disabled={!selectedGroupId || sending} />
        </div>
      ) : (
        <div>
          <label style={S.label}>Search for a trader</label>
          {!selectedPerson ? (
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <input value={personQuery} onChange={e => setPersonQuery(e.target.value)}
                placeholder="Name or @username…"
                style={{ ...S.input, width: '100%', boxSizing: 'border-box' }}
                autoFocus />
              {(personResults.length > 0 || personSearching) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 999, marginTop: 4 }}>
                  {personSearching
                    ? <div style={{ padding: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Searching…</div>
                    : personResults.map((u, i) => (
                      <div key={u.id} onClick={() => { setSelectedPerson(u); setPersonQuery(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: i < personResults.length - 1 ? '1px solid var(--border)' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <H2HAvatar userId={u.id} name={u.name} size={36} />
                        <div>
                          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                          {u.username && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>}
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1.5px solid #534AB7', background: '#EEEDFE', marginBottom: 20 }}>
              <H2HAvatar userId={selectedPerson.id} name={selectedPerson.name} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: '#534AB7' }}>{selectedPerson.name}</div>
                {selectedPerson.username && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#7c3aed' }}>@{selectedPerson.username}</div>}
              </div>
              <button onClick={() => setSelectedPerson(null)} style={{ background: 'none', border: '1px solid #534AB7', borderRadius: 6, cursor: 'pointer', color: '#534AB7', fontSize: 12, fontFamily: 'var(--font)', padding: '4px 10px' }}>Change</button>
            </div>
          )}

          {selectedPerson && (
            <WarnBox>A direct message with the contest details will be sent to {selectedPerson.name}.</WarnBox>
          )}
          {error && <div style={{ margin: '8px 0', padding: '8px 12px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: 'var(--font)' }}>{error}</div>}
          {selectedPerson && (
            <ModalFooter onCancel={onClose} onSubmit={handleSendToPerson} submitLabel={sending ? 'Sending…' : 'Send DM invite'} disabled={!selectedPerson || sending} />
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── GROUP TAB ────────────────────────────────────────────────────────────────
function GroupTab({ currentUserId, onOpenProfile, onSwitchToSingles }) {
  const [inner, setInner] = useState('browse');
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('Any');
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState({ contests: [], myContests: [] });
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/group-contests')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleJoin = async (contestId) => {
    await fetch('/api/group-contests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId }) });
    fetchData();
  };

  const handleDeleteContest = async (contestId) => {
    if (!confirm('Delete this contest? All trades and entries will be removed. This cannot be undone.')) return;
    await fetch('/api/group-contests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contestId }) });
    fetchData();
  };

  // Show ContestDetailView (paper trading) if a joined contest is selected
  if (selectedContest) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <ContestDetailView contest={selectedContest} onBack={() => { setSelectedContest(null); fetchData(); }} onDelete={handleDeleteContest} currentUserId={currentUserId} />
      </div>
    );
  }

  const ASSETS = ['Any', 'Forex', 'Commodities', 'Futures', 'Stocks', 'Crypto'];
  const myContestCount = (data.myContests || []).length;

  const filteredBrowse = (data.contests || []).filter(c => {
    const matchAsset = assetFilter === 'Any' || c.asset === assetFilter || c.asset === 'Any';
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.creatorName.toLowerCase().includes(search.toLowerCase());
    return matchAsset && matchSearch;
  });

  const filteredMine = (() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const assetOk = c => assetFilter === 'Any' || c.asset === assetFilter || c.asset === 'Any';
    const searchOk = c => !search || c.name.toLowerCase().includes(search.toLowerCase());
    return {
      active: (data.myContests || []).filter(c => (!c.endDate || new Date(c.endDate).getTime() > cutoff) && assetOk(c) && searchOk(c)),
      ended:  (data.myContests || []).filter(c => c.endDate && new Date(c.endDate).getTime() <= cutoff && assetOk(c) && searchOk(c)),
    };
  })();

  const sidebarNav = [
    { key: 'browse',     label: 'Browse',      badge: null },
    { key: 'mycontests', label: 'My contests',  badge: myContestCount > 0 ? myContestCount : null },
    { key: 'invites',    label: 'Invites',      badge: null },
    { key: 'leaderboard', label: 'Leaderboard', badge: null },
    { key: 'history',     label: 'History',     badge: null },
  ];

  const renderGrid = (items, emptyIcon, emptyTitle, emptySub) => (
    loading ? (
      <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
    ) : items.length === 0 ? (
      <EmptyState icon={emptyIcon} title={emptyTitle} sub={emptySub} btnLabel="Create contest" onBtnClick={() => setShowModal(true)} />
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {items.map(c => (
          <GroupContestCard
            key={c.id}
            contest={c}
            onJoin={handleJoin}
            onOpenProfile={onOpenProfile}
            onDelete={handleDeleteContest}
            onEnter={c.joined ? setSelectedContest : null}
          />
        ))}
      </div>
    )
  );

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%' }}>
      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onSuccess={() => { fetchData(); setInner('mycontests'); }} />}

      {/* ── Sidebar ── */}
      <div style={{ width: 220, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto' }}>
        {/* Mode pill */}
        <div style={{ display:'flex', background:'var(--surface2)', borderRadius:8, padding:3, gap:2, marginBottom:16 }}>
          <button onClick={onSwitchToSingles} style={{ flex:1, padding:'5px 0', borderRadius:6, border:'none', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:400, cursor:'pointer' }}>Singles</button>
          <button style={{ flex:1, padding:'5px 0', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'default' }}>Group</button>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>Group Contest</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Compete with a group</div>

        <button onClick={() => setShowModal(true)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#111827', color: '#fff', border: 'none', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <i className="ti ti-plus" /> Create contest
        </button>

        {/* Nav items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
          {sidebarNav.map((item, idx) => item === null
            ? <div key={idx} style={{ height:1, background:'var(--border)', margin:'6px 0' }} />
            : <button key={item.key} onClick={() => setInner(item.key)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, border: 'none', background: inner === item.key ? 'var(--surface2)' : 'transparent', fontFamily: 'var(--font)', fontSize: 13, fontWeight: inner === item.key ? 600 : 400, color: inner === item.key ? 'var(--text)' : 'var(--text-muted)', cursor: 'pointer', textAlign: 'left' }}>
                {item.label}
                {item.badge && (
                  <span style={{ background: '#534AB7', color: '#fff', borderRadius: 20, minWidth: 20, height: 20, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{item.badge}</span>
                )}
              </button>
          )}
        </div>

        {inner === 'browse' && <>
        {/* Market filter */}
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>Market</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ASSETS.map(a => (
            <button key={a} onClick={() => setAssetFilter(a)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', textAlign: 'left', fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer', background: assetFilter === a ? 'var(--surface2)' : 'transparent', color: 'var(--text)', fontWeight: assetFilter === a ? 500 : 400 }}>
              {a}
            </button>
          ))}
        </div>
        </>}
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: (inner==='leaderboard'||inner==='history') ? 0 : '20px 24px' }}>
        {inner !== 'leaderboard' && inner !== 'history' && (
          <div style={{ marginBottom: 20 }}>
            <SearchBar placeholder="Search by contest name or @creator..." value={search} onChange={setSearch} />
          </div>
        )}

        {inner === 'browse' && renderGrid(
          filteredBrowse,
          'ti-users', 'No open contests', 'Create one or wait for others to post'
        )}

        {inner === 'mycontests' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
          ) : filteredMine.active.length === 0 && filteredMine.ended.length === 0 ? (
            <EmptyState icon="ti-layout-list" title="No active contests" sub="Join or create a contest to get started" />
          ) : (
            <>
              {filteredMine.active.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {filteredMine.active.map(c => (
                    <GroupContestCard key={c.id} contest={c} onJoin={handleJoin} onOpenProfile={onOpenProfile} onDelete={handleDeleteContest} onEnter={c.joined ? setSelectedContest : null} />
                  ))}
                </div>
              )}
              {filteredMine.ended.length > 0 && (
                <>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '20px 0 10px' }}>Recently ended</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, opacity: 0.55, pointerEvents: 'none' }}>
                    {filteredMine.ended.map(c => (
                      <GroupContestCard key={c.id} contest={c} onJoin={handleJoin} onOpenProfile={onOpenProfile} onDelete={handleDeleteContest} />
                    ))}
                  </div>
                </>
              )}
            </>
          )
        )}

        {inner === 'invites' && (
          <EmptyState icon="ti-mail" title="No invites" sub="When someone invites you to a private contest, it'll appear here" />
        )}
        {inner === 'leaderboard' && <LeaderboardTab currentUserId={currentUserId} onOpenProfile={onOpenProfile} />}
        {inner === 'history' && <HistoryTab currentUserId={currentUserId} />}
      </div>
    </div>
  );
}

// ─── LEADERBOARD TAB ──────────────────────────────────────────────────────────
function LeaderboardTab({ currentUserId, onOpenProfile }) {
  const [timePeriod, setTimePeriod] = useState('month');
  const [metric, setMetric] = useState('pnl');
  const [freeBoard, setFreeBoard] = useState([]);
  const [paidBoard, setPaidBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/leaderboard?period=${timePeriod}&type=free&metric=${metric}`).then(r => r.json()),
      fetch(`/api/leaderboard?period=${timePeriod}&type=paid&metric=${metric}`).then(r => r.json()),
    ]).then(([free, paid]) => {
      setFreeBoard(free.leaderboard || []);
      setPaidBoard(paid.leaderboard || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timePeriod, metric]);

  const colHeader = metric === 'winrate' ? 'Win Rate' : 'P&L';
  const colValue = (e) => {
    if (metric === 'winrate') {
      const color = e.winRate >= 50 ? '#22c55e' : '#ef4444';
      return <span style={{ color, fontWeight: 600 }}>{e.winRate}%</span>;
    }
    const pnl = e.totalPnl || 0;
    const color = pnl > 0 ? '#22c55e' : pnl < 0 ? '#ef4444' : 'var(--text-muted)';
    return <span style={{ color, fontWeight: 600 }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>;
  };

  const renderBoard = (board, label, color, emptyIcon, emptyMsg) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        <span style={{ background: color.bg, color: color.text, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>{color.label}</span>
      </div>
      <div style={{ display: 'flex', padding: '6px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 24, fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>#</div>
        <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trader</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{colHeader}</div>
      </div>
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
      ) : board.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 14px', textAlign: 'center' }}>
          <i className={`ti ${emptyIcon}`} style={{ fontSize: 26, color: '#AFA9EC' }} aria-hidden="true" />
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>{emptyMsg}</div>
        </div>
      ) : (
        board.slice(0, 10).map((e, i) => (
          <div
            key={e.id}
            onClick={() => !e.isMe && e.profileSlug && onOpenProfile(e.profileSlug)}
            style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: e.isMe ? '#EEEDFE' : 'transparent', cursor: e.isMe ? 'default' : 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={ev => { if (!e.isMe) ev.currentTarget.style.background = '#F5F4FE'; }}
            onMouseLeave={ev => { ev.currentTarget.style.background = e.isMe ? '#EEEDFE' : 'transparent'; }}
          >
            <div style={{ width: 24, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: i < 3 ? '#534AB7' : 'var(--text-muted)' }}>{e.rank}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 13, color: e.isMe ? '#534AB7' : 'var(--text)', fontWeight: e.isMe ? 600 : 400 }}>
              {e.name}
              {e.isMe && <span style={{ marginLeft: 6, fontSize: 10, color: '#534AB7', fontWeight: 500 }}>you</span>}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13 }}>
              {colValue(e)}
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select value={timePeriod} onChange={e => setTimePeriod(e.target.value)} style={{ ...S.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">All time</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>
        <select value={metric} onChange={e => setMetric(e.target.value)} style={{ ...S.input, width: 'auto', cursor: 'pointer' }}>
          <option value="pnl">P&L</option>
          <option value="winrate">Win rate</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {renderBoard(freeBoard, 'Free leaderboard', { bg: 'var(--green-bg, #EAF3DE)', text: 'var(--green, #27500A)', label: 'Free' }, 'ti-gift', 'No free matches yet')}
        {renderBoard(paidBoard, 'Paid leaderboard', { bg: '#EEEDFE', text: '#3C3489', label: 'Paid' }, 'ti-currency-dollar', 'No paid matches yet')}
      </div>

      <div style={{ marginTop: 14, padding: '11px 14px', background: '#EEEDFE', borderRadius: 8, fontFamily: 'var(--font)', fontSize: 13, color: '#3C3489', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="ti ti-info-circle" style={{ fontSize: 16, flexShrink: 0 }} aria-hidden="true" />
        Free and paid matches have separate rankings. Rankings update in real time.
      </div>
    </div>
  );
}

// ─── HISTORY TAB ──────────────────────────────────────────────────────────────
function HistoryTab({ currentUserId }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [paidFilter, setPaidFilter] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then(d => { setHistory(d.history || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (selectedMatchId) {
    return (
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
        <MatchDetailView matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />
      </div>
    );
  }

  const filtered = history.filter(m => {
    if (outcomeFilter === 'win' && !m.won) return false;
    if (outcomeFilter === 'loss' && (m.won || m.winnerId === null)) return false;
    if (paidFilter === 'free' && m.buyIn > 0) return false;
    if (paidFilter === 'paid' && m.buyIn === 0) return false;
    return true;
  });

  const wins = history.filter(m => m.won).length;
  const winRate = history.length ? Math.round(wins / history.length * 100) : null;

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ ...S.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">All types</option>
          <option value="h2h">H2H</option>
          <option value="group">Group</option>
        </select>
        <select value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)} style={{ ...S.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">All outcomes</option>
          <option value="win">Wins</option>
          <option value="loss">Losses</option>
        </select>
        <select value={paidFilter} onChange={e => setPaidFilter(e.target.value)} style={{ ...S.input, width: 'auto', cursor: 'pointer' }}>
          <option value="all">Free & paid</option>
          <option value="free">Free only</option>
          <option value="paid">Paid only</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <StatCard label="Matches played" value={history.length || '0'} />
        <StatCard label="Wins" value={wins || '0'} />
        <StatCard label="Win rate" value={winRate !== null ? `${winRate}%` : '—'} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="ti-history" title="No match history" sub="Complete your first challenge to see your history here" />
      ) : (
        filtered.map(m => <HistoryCard key={m.id} match={m} currentUserId={currentUserId} onClick={() => setSelectedMatchId(m.id)} />)
      )}
    </div>
  );
}

// ─── RANKINGS TAB ─────────────────────────────────────────────────────────────
function RankingsTab({ currentUserId, onOpenProfile }) {
  const [view, setView] = useState('leaderboard');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', padding: '0 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        {[['leaderboard', '🏆 Leaderboard'], ['history', '🕐 History']].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{
            padding: '11px 14px', background: 'none', border: 'none',
            borderBottom: view === key ? '2px solid #534AB7' : '2px solid transparent',
            color: view === key ? '#534AB7' : 'var(--text-muted)',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: view === key ? 600 : 400,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {view === 'leaderboard' && <LeaderboardTab currentUserId={currentUserId} onOpenProfile={onOpenProfile} />}
        {view === 'history'     && <HistoryTab currentUserId={currentUserId} />}
      </div>
    </div>
  );
}


// ─── SIDEBAR ICONS ────────────────────────────────────────────────────────────
// ─── COMPETE WRAPPER ──────────────────────────────────────────────────────────
function CompeteWrapper({ currentUserId, onOpenProfile }) {
  const [mode, setMode] = useState('h2h');
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {mode === 'h2h'   && <H2HTab currentUserId={currentUserId} onOpenProfile={onOpenProfile} onSwitchToGroup={() => setMode('group')} />}
      {mode === 'group' && <GroupTab currentUserId={currentUserId} onOpenProfile={onOpenProfile} onSwitchToSingles={() => setMode('h2h')} />}
    </div>
  );
}


const SIDEBAR_TABS = [
  { key: 'compete',  icon: 'ti-swords',  label: 'Compete' },
  { key: 'rankings', icon: 'ti-trophy',  label: 'Rankings' },
];

const TAB_META = {
  compete:  { label: 'Compete',   sub: 'Singles & Group Contests' },
  rankings: { label: 'Rankings',  sub: 'Leaderboard & match history' },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
function openProfile(slug) {
  if (slug && typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}

export default function CompeteTab({ currentUserId, externalTab }) {
  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font)' }}>
      <CompeteWrapper currentUserId={currentUserId} onOpenProfile={openProfile} />
    </div>
  );
}
