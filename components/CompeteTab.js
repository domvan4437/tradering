'use client';
import { useState, useEffect, useCallback } from 'react';
import MatchDetailView from './MatchDetailView';
import CompetitionTradingView from './CompetitionTradingView';

// ─── Constants ────────────────────────────────────────────────────────────────
const ASSET_CLASSES = ['Any', 'Forex', 'Commodities', 'Futures', 'Stocks', 'Crypto'];
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
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
function ChallengeCard({ match, onAccept, onOpenProfile }) {
  const [preview, setPreview] = useState(false);
  return (
    <>
      {preview && <H2HPreviewModal match={match} onAccept={onAccept} onClose={() => setPreview(false)} onOpenProfile={onOpenProfile} />}
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

function MatchCard({ match, currentUserId, onClick, onDelete }) {
  const isChallenger = match.challengerId === currentUserId;
  const myScore = isChallenger ? match.challengerScore : match.opponentScore;
  const oppScore = isChallenger ? match.opponentScore : match.challengerScore;
  const oppName = isChallenger ? match.opponentName : match.challengerName;
  const canDelete = isChallenger && match.status !== 'active';
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
          {canDelete && onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(match.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)' }}
              title="Delete match">
              <i className="ti ti-trash" style={{ fontSize: 14 }} />
            </button>
          )}
          <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#534AB7' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>You</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: myScore >= 0 ? '#059669' : '#dc2626' }}>{myScore > 0 ? '+' : ''}${Math.abs(Number(myScore)).toFixed(2)}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{oppName}</div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700, color: oppScore >= 0 ? '#059669' : '#dc2626' }}>{oppScore > 0 ? '+' : ''}${Math.abs(Number(oppScore)).toFixed(2)}</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
        {match.asset} · {match.timeLeft || 'No end date'} · Tap to view &amp; trade
      </div>
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
    teamFormat: 'none',
    teamNameA: 'Team Alpha',
    teamNameB: 'Team Beta',
    teamSizeCustom: '10',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setDur = (patch) => setForm(p => ({ ...p, ...patch }));

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
          teamFormat: finalTeamFormat,
          teamSize: parsedTeamSize,
          teamNameA: form.teamNameA,
          teamNameB: form.teamNameB,
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
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Team names</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={form.teamNameA} onChange={e => set('teamNameA', e.target.value)} placeholder="Team Alpha" style={{ ...S.input, flex: 1 }} />
                <span style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>VS</span>
                <input value={form.teamNameB} onChange={e => set('teamNameB', e.target.value)} placeholder="Team Beta" style={{ ...S.input, flex: 1 }} />
              </div>
              {parsedTeamSize && <div style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{parsedTeamSize} slots per team — players pick their side when joining</div>}
            </div>
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
function H2HTab({ currentUserId, onOpenProfile }) {
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
            filteredOpen.map(m => <ChallengeCard key={m.id} match={m} onAccept={handleAccept} onOpenProfile={onOpenProfile} />)
          )}
        </>
      )}

      {inner === 'mymatches' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.myMatches || []).length === 0 ? (
          <EmptyState icon="ti-shield" title="No active matches" sub="Accept or post a challenge to get started" />
        ) : (
          (data.myMatches || []).map(m => <MatchCard key={m.id} match={m} currentUserId={currentUserId} onClick={() => setSelectedMatchId(m.id)} onDelete={handleDeleteMatch} />)
        )
      )}

      {inner === 'invites' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.invites || []).length === 0 ? (
          <EmptyState icon="ti-bell" title="No invites" sub="When traders challenge you, they appear here" />
        ) : (
          (data.invites || []).map(m => <InviteCard key={m.id} match={m} onAccept={handleAccept} onDecline={handleDecline} onOpenProfile={onOpenProfile} />)
        )
      )}
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
function ContestDetailView({ contest, onBack, currentUserId }) {
  const [tab, setTab] = useState('paper');
  const [detail, setDetail] = useState(null);
  const hasTeamFormat = !!(contest.teamFormat);

  useEffect(() => {
    if (!contest?.id) return;
    fetch(`/api/group-contests/preview?id=${contest.id}`)
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => {});
  }, [contest?.id]);

  const endDate = detail?.endDate || contest.endDate || null;
  const tabs = hasTeamFormat
    ? [['paper', '📊 Trade'], ['battle', '⚔️ Battle'], ['info', 'ℹ️ Info']]
    : [['paper', '📊 Trade'], ['leaderboard', '🏆 Leaderboard'], ['teams', '⚔️ Teams'], ['info', 'ℹ️ Info']];

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
          allowedAsset={contest.asset !== 'Any' ? contest.asset : null}
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

// ─── GROUP TAB ────────────────────────────────────────────────────────────────
function GroupTab({ currentUserId, onOpenProfile }) {
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

  // Show ContestDetailView (paper trading) if a joined contest is selected
  if (selectedContest) {
    return <ContestDetailView contest={selectedContest} onBack={() => { setSelectedContest(null); fetchData(); }} currentUserId={currentUserId} />;
  }

  const handleJoin = async (contestId) => {
    await fetch('/api/group-contests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId }) });
    fetchData();
  };

  const handleDeleteContest = async (contestId) => {
    if (!confirm('Delete this contest? All trades and entries will be removed. This cannot be undone.')) return;
    await fetch('/api/group-contests', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contestId }) });
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
            filteredContests.map(c => (
              <ContestCard key={c.id} contest={c} onJoin={handleJoin} onOpenProfile={onOpenProfile} onDelete={handleDeleteContest} />
            ))
          )}
        </>
      )}

      {inner === 'mycontests' && (
        loading ? (
          <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (data.myContests || []).length === 0 ? (
          <EmptyState icon="ti-layout-list" title="No active contests" sub="Join or create a contest to get started" />
        ) : (
          (data.myContests || []).map(c => (
            <div key={c.id} onClick={() => c.joined && setSelectedContest(c)} style={{ cursor: c.joined ? 'pointer' : 'default' }}>
              <ContestCard contest={c} onJoin={handleJoin} onOpenProfile={onOpenProfile} onDelete={handleDeleteContest} />
            </div>
          ))
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
function openProfile(slug) {
  if (slug && typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}

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
              width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s',
              background: resolvedTab === t.key ? '#EEEDFE' : 'transparent',
              color: resolvedTab === t.key ? '#534AB7' : 'var(--text-muted)',
            }}
          >
            <i className={`ti ${t.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        {meta && (
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{meta.label}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{meta.sub}</div>
          </div>
        )}

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {resolvedTab === 'home'        && <HomeTab setActiveTab={setActiveTab} currentUserId={currentUserId} />}
          {resolvedTab === 'h2h'         && <H2HTab currentUserId={currentUserId} onOpenProfile={openProfile} />}
          {resolvedTab === 'group'       && <GroupTab currentUserId={currentUserId} onOpenProfile={openProfile} />}
          {resolvedTab === 'leaderboard' && <LeaderboardTab currentUserId={currentUserId} />}
          {resolvedTab === 'history'     && <HistoryTab currentUserId={currentUserId} />}
        </div>
      </div>
    </div>
  );
}