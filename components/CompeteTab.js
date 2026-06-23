'use client';
import { useState, useEffect, useCallback } from 'react';
import MatchDetailView from './MatchDetailView';

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_CLASSES = ['Any', 'Forex', 'Commodities', 'Futures', 'Stocks', 'Crypto'];
const H2H_DURATION_PRESETS = ['1 Day', '3 Days', '1 Week', '2 Weeks', '1 Month', 'Custom'];
const GROUP_DURATION_PRESETS = ['1 Day', '3 Days', '1 Week', '2 Weeks', '1 Month', '3 Months', 'Custom'];
const PRIZE_STRUCTURES = ['Winner Take All', 'Top 2 Split', 'Top 3 Split', 'Top 5 Split'];

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
      {[['free', freeLabel || 'Free (bragging rights)', 'ti-gift'], ['paid', paidLabel || 'Paid (entry stake)', 'ti-currency-dollar']].map(([type, label, icon]) => (
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

function Modal({ title, onClose, children }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
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

function ModalFooter({ onCancel, onSubmit, submitLabel, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
      <button onClick={onCancel} style={{ ...S.ghostBtn, flex: 1 }}>Cancel</button>
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
function H2HPreviewModal({ match, onAccept, onClose }) {
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
              {match.challengerUsername ? (
                <a href={`/p/${match.challengerUsername}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#534AB7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  {match.challengerName} <i className="ti ti-external-link" style={{ fontSize: 11 }} />
                </a>
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
function GroupPreviewModal({ contest, onJoin, onClose }) {
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/group-contests/preview?id=${contest.id}`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [contest.id]);

  const spotsLeft = detail?.maxParticipants
    ? detail.maxParticipants - (detail.memberCount || 0)
    : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 420, padding: 24, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-users" style={{ fontSize: 18, color: '#534AB7' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{contest.name}</div>
              {contest.creatorUsername ? (
                <a href={`/p/${contest.creatorUsername}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#534AB7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                  by {contest.creatorName} <i className="ti ti-external-link" style={{ fontSize: 11 }} />
                </a>
              ) : (
                <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>by {contest.creatorName}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
        </div>

        {/* Description */}
        {contest.description && (
          <div style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            "{contest.description}"
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Asset', value: contest.asset || 'Any' },
            { label: 'Buy-in', value: contest.buyIn > 0 ? `$${contest.buyIn}` : 'Free' },
            { label: 'Prize', value: detail?.prizeStructure || 'Winner Takes All' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--surface2)', borderRadius: 9, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Members */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Joined ({detail?.memberCount ?? contest.memberCount})
            </div>
            {spotsLeft !== null && (
              <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: spotsLeft === 0 ? '#ef4444' : '#059669', fontWeight: 600 }}>
                {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading members…</div>
          ) : detail?.members?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 9 }}>
              No one joined yet — be the first!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(detail?.members || []).map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface2)', borderRadius: 9, padding: '9px 12px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#534AB7', flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{m.name}</div>
                  {m.score != null && m.score !== 0 && (
                    <div style={{ fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: m.score >= 0 ? '#059669' : '#dc2626' }}>
                      {m.score > 0 ? '+' : ''}{Number(m.score).toFixed(1)}R
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ ...S.ghostBtn, flex: 1 }}>Cancel</button>
          <button
            disabled={joining || contest.joined || spotsLeft === 0}
            onClick={async () => { setJoining(true); await onJoin(contest.id); onClose(); }}
            style={{ ...S.primaryBtn, flex: 2, justifyContent: 'center', background: contest.joined ? '#059669' : spotsLeft === 0 ? 'var(--surface2)' : '#534AB7', color: spotsLeft === 0 && !contest.joined ? 'var(--text-muted)' : '#fff' }}
          >
            {joining ? '…' : contest.joined ? '✓ Already joined' : spotsLeft === 0 ? 'Contest full' : <><i className="ti ti-users" /> Join contest</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Data cards ───────────────────────────────────────────────────────────────
function ChallengeCard({ match, onAccept }) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      {preview && <H2HPreviewModal match={match} onAccept={onAccept} onClose={() => setPreview(false)} />}
      <div onClick={() => setPreview(true)} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-swords" style={{ fontSize: 18, color: '#534AB7' }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>
            {match.challengerName}
            {match.buyIn > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#EEEDFE', color: '#3C3489', padding: '2px 7px', borderRadius: 10, fontWeight: 500 }}>${match.buyIn} stake</span>}
          </div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
            {match.asset} · {match.timeLeft || 'Open'} · {timeAgo(match.createdAt)}
          </div>
          {match.description && <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.description}</div>}
        </div>
        <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#534AB7', flexShrink: 0 }} />
      </div>
    </>
  );
}

function MatchCard({ match, currentUserId, onClick }) {
  const isChallenger = match.challengerId === currentUserId;
  const myScore = isChallenger ? match.challengerScore : match.opponentScore;
  const oppScore = isChallenger ? match.opponentScore : match.challengerScore;
  const oppName = isChallenger ? match.opponentName : match.challengerName;
  return (
    <div onClick={onClick} style={{ ...S.card, cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#534AB7'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          vs {oppName}
          {match.buyIn > 0 && <span style={{ marginLeft: 6, fontSize: 11, background: '#EEEDFE', color: '#3C3489', padding: '2px 7px', borderRadius: 10 }}>${match.buyIn} stake</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: match.status === 'active' ? '#059669' : '#d97706', fontWeight: 600 }}>
            {match.status === 'active' ? '● Live' : '⏳ Waiting'}
          </span>
          <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#534AB7' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>You</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: myScore >= 0 ? '#059669' : '#dc2626' }}>{myScore > 0 ? '+' : ''}{Number(myScore).toFixed(1)}R</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{oppName}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: oppScore >= 0 ? '#059669' : '#dc2626' }}>{oppScore > 0 ? '+' : ''}{Number(oppScore).toFixed(1)}R</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
        {match.asset} · {match.timeLeft || 'No end date'} · Tap to view &amp; trade
      </div>
    </div>
  );
}

function InviteCard({ match, onAccept, onDecline }) {
  const [preview, setPreview] = useState(false);
  const [declining, setDeclining] = useState(false);
  return (
    <>
      {preview && <H2HPreviewModal match={match} onAccept={onAccept} onClose={() => setPreview(false)} />}
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

function ContestCard({ contest, onJoin }) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      {preview && <GroupPreviewModal contest={contest} onJoin={onJoin} onClose={() => setPreview(false)} />}
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setDur = (patch) => setForm(p => ({ ...p, ...patch }));

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const duration = form.durationType === 'custom'
        ? `${form.durationCustom} ${form.durationUnit}`
        : form.durationPreset;

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          asset: form.asset,
          duration,
          stake: form.stake,
          description: form.description,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to post challenge'); setLoading(false); return; }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Network error — try again');
    }
    setLoading(false);
  };

  const valid = form.description.trim().length > 0 && !loading;

  return (
    <Modal title="Post a challenge" onClose={onClose}>
      <TypeToggle value={type} onChange={setType} />

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
        <div>
          <label style={S.label}>Max challengers</label>
          <input type="number" min="1" max="10" value={form.maxAccepts} onChange={e => set('maxAccepts', parseInt(e.target.value) || 1)} style={S.input} />
        </div>
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
        {type === 'paid'
          ? 'Matched to your league tier (±1 league). Entry stakes held in escrow until match completion. Verified broker required.'
          : 'Matched to your league tier (±1 league). Results count toward the free leaderboard.'}
      </WarnBox>

      <ModalFooter onCancel={onClose} onSubmit={handleSubmit} submitLabel={loading ? 'Posting…' : 'Post challenge'} disabled={!valid} />
    </Modal>
  );
}

// ─── Create Group Contest Modal ───────────────────────────────────────────────
function CreateGroupModal({ onClose, onSuccess }) {
  const [type, setType] = useState('free');
  const [form, setForm] = useState({
    name: '',
    asset: 'Any',
    durationType: 'preset',
    durationPreset: '1 Month',
    durationCustom: '',
    durationUnit: 'days',
    fee: '',
    maxGroups: 10,
    structure: 'Top 3 Split',
    minTrades: 10,
    desc: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setDur = (patch) => setForm(p => ({ ...p, ...patch }));

  const feeNum = parseInt(form.fee) || 0;
  const estimatedPool = feeNum * form.maxGroups;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const duration = form.durationType === 'custom'
        ? `${form.durationCustom} ${form.durationUnit}`
        : form.durationPreset;

      const res = await fetch('/api/group-contests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: form.name,
          description: form.desc,
          asset: form.asset,
          duration,
          buyIn: type === 'paid' ? form.fee : '0',
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create contest'); setLoading(false); return; }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Network error — try again');
    }
    setLoading(false);
  };

  const valid = form.name.trim().length > 0 && !loading;

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
          <label style={S.label}>Max groups</label>
          <input type="number" min="2" value={form.maxGroups} onChange={e => set('maxGroups', parseInt(e.target.value) || 2)} style={S.input} />
        </div>
        <div>
          <label style={S.label}>Min trades required</label>
          <input type="number" min="1" value={form.minTrades} onChange={e => set('minTrades', parseInt(e.target.value) || 1)} style={S.input} />
        </div>
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

      {type === 'paid' && (
        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>
          Estimated prize pool: <strong style={{ color: 'var(--text)' }}>${estimatedPool.toLocaleString()}</strong> ({form.maxGroups} groups × ${feeNum})
        </div>
      )}

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
function HomeTab({ setActiveTab, currentUserId }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/challenges')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  const activeMatches = data?.myMatches?.length ?? 0;
  const history = data?.history ?? [];
  const wins = history.filter(m => m.won).length;
  const winRate = history.length ? Math.round(wins / history.length * 100) : null;

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
        <StatCard label="Active matches" value={activeMatches} sub={activeMatches === 0 ? 'Start your first challenge' : `${activeMatches} ongoing`} />
        <StatCard label="Win rate" value={winRate !== null ? `${winRate}%` : '—'} sub={history.length ? `${wins}W / ${history.length - wins}L` : 'No matches yet'} />
        <StatCard label="Total matches" value={history.length || '—'} sub={history.length ? 'All time' : 'Connect broker to track'} />
      </div>

      <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>Quick actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
        {[
          ['ti-swords',  'Challenge someone',   'Start a 1v1 match',       'h2h'],
          ['ti-users',   'Join a group contest', 'Compete with a group',    'group'],
          ['ti-trophy',  'View leaderboard',     'See top traders',         'leaderboard'],
          ['ti-history', 'Match history',        'Review past trades',      'history'],
        ].map(([icon, title, sub, tab]) => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#7F77DD'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEEDFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className={`ti ${icon}`} style={{ fontSize: 18, color: '#534AB7' }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 10 }}>Recent activity</div>
      {history.length === 0
        ? <EmptyState icon="ti-activity" title="No activity yet" sub="Your matches and results will appear here" />
        : history.slice(0, 3).map(m => <HistoryCard key={m.id} match={m} currentUserId={currentUserId} />)
      }
    </div>
  );
}

// ─── H2H TAB ──────────────────────────────────────────────────────────────────
function H2HTab({ currentUserId }) {
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

  // Show match detail view if one is selected
  if (selectedMatchId) {
    return <MatchDetailView matchId={selectedMatchId} onBack={() => { setSelectedMatchId(null); fetchData(); }} />;
  }

  const handleAccept = async (matchId) => {
    await fetch('/api/challenges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, action: 'accept' }) });
    fetchData();
  };

  const handleDecline = async (matchId) => {
    await fetch('/api/challenges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ matchId, action: 'decline' }) });
    fetchData();
  };

  const filteredOpen = (data.open || []).filter(m => {
    const matchAsset = assetFilter === 'Any' || m.asset === assetFilter || m.asset === 'Any';
    const matchSearch = !search || m.challengerName.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase());
    return matchAsset && matchSearch;
  });

  return (
    <div style={{ padding: 18 }}>
      {showModal && <PostChallengeModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <SearchBar placeholder="Search by trader name or @username..." value={search} onChange={setSearch} />
        <button onClick={() => setShowModal(true)} style={S.primaryBtn}>
          <i className="ti ti-plus" aria-hidden="true" /> Post challenge
        </button>
      </div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Search by trader name or @username</div>

      <InnerTabs
        tabs={[['browse', `Browse${data.open?.length ? ` (${data.open.length})` : ''}`], ['mymatches', `My matches${data.myMatches?.length ? ` (${data.myMatches.length})` : ''}`], ['invites', `Invites${data.invites?.length ? ` (${data.invites.length})` : ''}`]]}
        active={inner}
        onChange={setInner}
      />

      {inner === 'browse' && (
        <>
          <AssetPills active={assetFilter} onChange={setAssetFilter} />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
          ) : filteredOpen.length === 0 ? (
            <EmptyState icon="ti-swords" title="No open challenges" sub="Be the first — post a challenge above" btnLabel="Post challenge" onBtnClick={() => setShowModal(true)} />
          ) : (
            filteredOpen.map(m => <ChallengeCard key={m.id} match={m} onAccept={handleAccept} />)
          )}
        </>
      )}

      {inner === 'mymatches' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.myMatches || []).length === 0 ? (
          <EmptyState icon="ti-shield" title="No active matches" sub="Accept or post a challenge to get started" />
        ) : (
          (data.myMatches || []).map(m => <MatchCard key={m.id} match={m} currentUserId={currentUserId} onClick={() => setSelectedMatchId(m.id)} />)
        )
      )}

      {inner === 'invites' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.invites || []).length === 0 ? (
          <EmptyState icon="ti-bell" title="No invites" sub="When traders challenge you, they appear here" />
        ) : (
          (data.invites || []).map(m => <InviteCard key={m.id} match={m} onAccept={handleAccept} onDecline={handleDecline} />)
        )
      )}
    </div>
  );
}

// ─── GROUP TAB ────────────────────────────────────────────────────────────────
function GroupTab({ currentUserId }) {
  const [inner, setInner] = useState('browse');
  const [search, setSearch] = useState('');
  const [assetFilter, setAssetFilter] = useState('Any');
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState({ contests: [], myContests: [] });
  const [loading, setLoading] = useState(true);

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

  const filteredContests = (data.contests || []).filter(c => {
    const matchAsset = assetFilter === 'Any' || c.asset === assetFilter || c.asset === 'Any';
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.creatorName.toLowerCase().includes(search.toLowerCase());
    return matchAsset && matchSearch;
  });

  return (
    <div style={{ padding: 18 }}>
      {showModal && <CreateGroupModal onClose={() => setShowModal(false)} onSuccess={fetchData} />}

      <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
        <SearchBar placeholder="Search by contest name or @creator..." value={search} onChange={setSearch} />
        <button onClick={() => setShowModal(true)} style={S.primaryBtn}>
          <i className="ti ti-plus" aria-hidden="true" /> Create contest
        </button>
      </div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Search by contest name or @creator username</div>

      <InnerTabs
        tabs={[['browse', `Browse${data.contests?.length ? ` (${data.contests.length})` : ''}`], ['mycontests', `My contests${data.myContests?.length ? ` (${data.myContests.length})` : ''}`]]}
        active={inner}
        onChange={setInner}
      />

      {inner === 'browse' && (
        <>
          <AssetPills active={assetFilter} onChange={setAssetFilter} />
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
          ) : filteredContests.length === 0 ? (
            <EmptyState icon="ti-users" title="No open contests" sub="Create one or wait for others to post" btnLabel="Create contest" onBtnClick={() => setShowModal(true)} />
          ) : (
            filteredContests.map(c => <ContestCard key={c.id} contest={c} onJoin={handleJoin} />)
          )}
        </>
      )}

      {inner === 'mycontests' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.myContests || []).length === 0 ? (
          <EmptyState icon="ti-layout-list" title="No active contests" sub="Join or create a contest to get started" />
        ) : (
          (data.myContests || []).map(c => <ContestCard key={c.id} contest={c} onJoin={handleJoin} />)
        )
      )}
    </div>
  );
}

// ─── LEADERBOARD TAB ──────────────────────────────────────────────────────────
function LeaderboardTab({ currentUserId }) {
  const [timePeriod, setTimePeriod] = useState('month');
  const [metric, setMetric] = useState('pnl');
  const [freeBoard, setFreeBoard] = useState([]);
  const [paidBoard, setPaidBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/leaderboard?period=${timePeriod}&type=free`).then(r => r.json()),
      fetch(`/api/leaderboard?period=${timePeriod}&type=paid`).then(r => r.json()),
    ]).then(([free, paid]) => {
      setFreeBoard(free.leaderboard || []);
      setPaidBoard(paid.leaderboard || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [timePeriod]);

  const renderBoard = (board, label, color, emptyIcon, emptyMsg) => (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
        <span style={{ background: color.bg, color: color.text, fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>{color.label}</span>
      </div>
      <div style={{ display: 'flex', padding: '6px 14px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 24, fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>#</div>
        <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trader</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>W/L</div>
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
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: e.isMe ? '#EEEDFE' : 'transparent' }}>
            <div style={{ width: 24, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: i < 3 ? '#534AB7' : 'var(--text-muted)' }}>{e.rank}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)', fontWeight: e.isMe ? 600 : 400 }}>
              {e.name}
              {e.isMe && <span style={{ marginLeft: 6, fontSize: 10, color: '#534AB7', fontWeight: 500 }}>you</span>}
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {e.wins}W / {e.losses}L
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
          <option value="pnl">P&L %</option>
          <option value="winrate">Win rate</option>
          <option value="trades">Total trades</option>
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
    return <MatchDetailView matchId={selectedMatchId} onBack={() => setSelectedMatchId(null)} />;
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

// ─── SIDEBAR ICONS ────────────────────────────────────────────────────────────
const SIDEBAR_TABS = [
  { key: 'home',        icon: 'ti-home',    label: 'Home' },
  { key: 'h2h',         icon: 'ti-swords',  label: 'Head to Head' },
  { key: 'group',       icon: 'ti-users',   label: 'Group Contest' },
  { key: 'leaderboard', icon: 'ti-trophy',  label: 'Leaderboard' },
  { key: 'history',     icon: 'ti-history', label: 'History' },
];

const TAB_META = {
  home:        { label: 'Home',          sub: 'Your competitive overview' },
  h2h:         { label: 'Head to Head',  sub: 'Challenge traders 1v1' },
  group:       { label: 'Group Contest', sub: 'Compete with a group' },
  leaderboard: { label: 'Leaderboard',   sub: 'Top performers' },
  history:     { label: 'History',       sub: 'Your past matches' },
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export default function CompeteTab({ currentUserId, externalTab }) {
  const [activeTab, setActiveTab] = useState(externalTab || 'home');
  const resolvedTab = externalTab || activeTab;
  const meta = TAB_META[resolvedTab];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: 'var(--font)' }}>
      {/* Sidebar */}
      <div style={{ width: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 4, borderRight: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        {SIDEBAR_TABS.map(t => (
          <div
            key={t.key}
            title={t.label}
            onClick={() => setActiveTab(t.key)}
            style={{
              width: 38, height: 38,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              background: resolvedTab === t.key ? '#534AB7' : 'transparent',
              color: resolvedTab === t.key ? '#fff' : 'var(--text-muted)',
              fontSize: 19,
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (resolvedTab !== t.key) { e.currentTarget.style.background = '#EEEDFE'; e.currentTarget.style.color = '#534AB7'; } }}
            onMouseLeave={e => { if (resolvedTab !== t.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Purple accent topbar */}
        <div style={{ background: '#534AB7', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className={`ti ${SIDEBAR_TABS.find(t => t.key === resolvedTab)?.icon}`} style={{ fontSize: 17, color: '#fff' }} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, color: '#fff' }}>{meta.label}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: '#CECBF6', marginTop: 1 }}>{meta.sub}</div>
          </div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {resolvedTab === 'home'        && <HomeTab setActiveTab={setActiveTab} currentUserId={currentUserId} />}
          {resolvedTab === 'h2h'         && <H2HTab currentUserId={currentUserId} />}
          {resolvedTab === 'group'       && <GroupTab currentUserId={currentUserId} />}
          {resolvedTab === 'leaderboard' && <LeaderboardTab currentUserId={currentUserId} />}
          {resolvedTab === 'history'     && <HistoryTab currentUserId={currentUserId} />}
        </div>
      </div>
    </div>
  );
}
