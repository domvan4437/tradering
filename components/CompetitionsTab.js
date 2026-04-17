
'use client';
import { useState, useEffect } from 'react';

const TRADER_STYLES = {
  scalper:    { label: 'Scalper',         emoji: '⚡', description: 'Under 1 hour holds', color: '#f59e0b' },
  daytrader:  { label: 'Day Trader',      emoji: '📈', description: 'Same-session trades', color: '#3b82f6' },
  swing:      { label: 'Swing Trader',    emoji: '🌊', description: '2–10 day holds', color: '#10b981' },
  position:   { label: 'Position Trader', emoji: '🏔️', description: '2–8 week holds', color: '#8b5cf6' },
  macro:      { label: 'Macro Trader',    emoji: '🌍', description: '2+ month holds', color: '#ec4899' },
};

const C = {
  bg: '#0b0e17', surface: '#171b27', surface2: '#1d2130', surface3: '#232839',
  border: 'rgba(255,255,255,0.06)', border2: 'rgba(255,255,255,0.10)',
  accent: '#3b82f6', text: '#f8fafc', muted: '#94a3b8', dim: '#475569',
  green: '#10b981', red: '#f43f5e', gold: '#f59e0b',
};

function StyleBadge({ style }) {
  const s = TRADER_STYLES[style];
  if (!s) return null;
  return (
    <span style={{
      background: s.color + '22', color: s.color, border: `1px solid ${s.color}44`,
      borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600
    }}>
      {s.emoji} {s.label}
    </span>
  );
}

function RulePill({ label }) {
  return (
    <span style={{
      background: '#ffffff08', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 6, padding: '2px 8px', fontSize: 11, color: C.muted
    }}>{label}</span>
  );
}

function TournamentRules({ t }) {
  const rules = [];
  if (t.minHoldHours || t.maxHoldHours) {
    const min = t.minHoldHours ? `${t.minHoldHours}h` : '0h';
    const max = t.maxHoldHours ? `${t.maxHoldHours}h` : '∞';
    rules.push(`Hold: ${min}–${max}`);
  }
  if (t.maxTradesPerWeek) rules.push(`Max ${t.maxTradesPerWeek} trades/week`);
  if (t.minRiskReward) rules.push(`Min R:R ${t.minRiskReward}`);
  if (t.maxRiskPct) rules.push(`Max risk ${t.maxRiskPct}%`);
  if (t.requireStopLoss) rules.push('Stop loss required');
  if (t.requireTarget) rules.push('Target required');
  if (t.allowedAssets) {
    const assets = JSON.parse(t.allowedAssets);
    if (assets.length) rules.push(`Assets: ${assets.join(', ')}`);
  }

  if (!rules.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
      {rules.map(r => <RulePill key={r} label={r} />)}
    </div>
  );
}

function CreateTournamentModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', description: '', type: 'tournament', prizePool: '',
    entryFee: '', startDate: '', endDate: '',
    traderStyle: '', minHoldHours: '', maxHoldHours: '',
    maxTradesPerWeek: '', minRiskReward: '', maxRiskPct: '',
    allowedAssets: '', requireStopLoss: true, requireTarget: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStyleSelect = (style) => {
    const defaults = {
      scalper:    { minHoldHours: '0',   maxHoldHours: '1'    },
      daytrader:  { minHoldHours: '1',   maxHoldHours: '24'   },
      swing:      { minHoldHours: '48',  maxHoldHours: '240'  },
      position:   { minHoldHours: '240', maxHoldHours: '1344' },
      macro:      { minHoldHours: '1344',maxHoldHours: ''     },
    };
    const d = defaults[style] || {};
    setForm(f => ({ ...f, traderStyle: style, ...d }));
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const assets = form.allowedAssets
        ? form.allowedAssets.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, allowedAssets: assets }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data.tournament);
      onClose();
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8,
    color: C.text, padding: '10px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: 12, color: C.muted, marginBottom: 4, display: 'block' };
  const rowStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: C.surface, borderRadius: 16, padding: 32, width: 600,
        maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${C.border2}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: C.text, margin: 0, fontSize: 20 }}>Create Competition</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Basic info */}
          <div>
            <label style={labelStyle}>Competition Name</label>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Swing Trader Championship" />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Type</label>
              <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="tournament">Tournament</option>
                <option value="h2h">Head to Head</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Entry Fee ($)</label>
              <input style={inputStyle} type="number" value={form.entryFee} onChange={e => set('entryFee', e.target.value)} placeholder="0 = free" />
            </div>
          </div>
          <div style={rowStyle}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input style={inputStyle} type="datetime-local" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input style={inputStyle} type="datetime-local" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Trader Style Selector */}
          <div>
            <label style={labelStyle}>Trader Style (auto-fills hold times)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(TRADER_STYLES).map(([key, s]) => (
                <button key={key} onClick={() => handleStyleSelect(key)} style={{
                  background: form.traderStyle === key ? s.color + '33' : C.surface2,
                  border: `1px solid ${form.traderStyle === key ? s.color : C.border2}`,
                  borderRadius: 8, padding: '8px 14px', color: form.traderStyle === key ? s.color : C.muted,
                  cursor: 'pointer', fontSize: 13, fontWeight: form.traderStyle === key ? 700 : 400,
                  transition: 'all 0.15s',
                }}>
                  {s.emoji} {s.label}
                  <div style={{ fontSize: 10, opacity: 0.7 }}>{s.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Hold time rules */}
          <div style={{ background: C.surface2, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 12 }}>⏱ Trade Duration Rules</div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Min Hold Time (hours)</label>
                <input style={inputStyle} type="number" value={form.minHoldHours} onChange={e => set('minHoldHours', e.target.value)} placeholder="e.g. 48" />
              </div>
              <div>
                <label style={labelStyle}>Max Hold Time (hours)</label>
                <input style={inputStyle} type="number" value={form.maxHoldHours} onChange={e => set('maxHoldHours', e.target.value)} placeholder="e.g. 240 (10 days)" />
              </div>
            </div>
          </div>

          {/* Risk rules */}
          <div style={{ background: C.surface2, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
            <div style={{ color: C.text, fontWeight: 600, fontSize: 13, marginBottom: 12 }}>🛡 Risk & Quality Rules</div>
            <div style={rowStyle}>
              <div>
                <label style={labelStyle}>Min R:R Ratio</label>
                <input style={inputStyle} type="number" step="0.1" value={form.minRiskReward} onChange={e => set('minRiskReward', e.target.value)} placeholder="e.g. 1.5" />
              </div>
              <div>
                <label style={labelStyle}>Max Risk Per Trade (%)</label>
                <input style={inputStyle} type="number" step="0.5" value={form.maxRiskPct} onChange={e => set('maxRiskPct', e.target.value)} placeholder="e.g. 3" />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Max Trades Per Week</label>
              <input style={{ ...inputStyle, width: '50%' }} type="number" value={form.maxTradesPerWeek} onChange={e => set('maxTradesPerWeek', e.target.value)} placeholder="e.g. 5 (blank = unlimited)" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.requireStopLoss} onChange={e => set('requireStopLoss', e.target.checked)} />
                Require stop loss
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: C.muted, fontSize: 13, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.requireTarget} onChange={e => set('requireTarget', e.target.checked)} />
                Require take profit
              </label>
            </div>
          </div>

          {/* Asset whitelist */}
          <div>
            <label style={labelStyle}>Allowed Assets (comma separated, blank = all)</label>
            <input style={inputStyle} value={form.allowedAssets} onChange={e => set('allowedAssets', e.target.value)} placeholder="e.g. GC=F, CL=F, EURUSD=X" />
          </div>

          {error && <div style={{ color: C.red, fontSize: 13, background: C.red + '11', padding: '10px 14px', borderRadius: 8 }}>{error}</div>}

          <button
            onClick={submit}
            disabled={loading || !form.name || !form.startDate || !form.endDate}
            style={{
              background: loading ? C.dim : C.accent, color: '#fff', border: 'none',
              borderRadius: 10, padding: '14px 0', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', width: '100%'
            }}
          >
            {loading ? 'Creating…' : 'Create Competition'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmitTradeModal({ tournament, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    commodity: '', direction: 'LONG', entryPrice: '', stopLoss: '', takeProfit: '', riskPct: '', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Live R:R calculation
  const rr = (() => {
    const e = parseFloat(form.entryPrice), s = parseFloat(form.stopLoss), t = parseFloat(form.takeProfit);
    if (!e || !s || !t) return null;
    const risk = Math.abs(e - s), reward = Math.abs(t - e);
    if (risk === 0) return null;
    return (reward / risk).toFixed(2);
  })();

  // Hold time guidance
  const holdGuide = (() => {
    if (!tournament.minHoldHours && !tournament.maxHoldHours) return null;
    const min = tournament.minHoldHours ? `${tournament.minHoldHours}h` : '0h';
    const max = tournament.maxHoldHours ? `${tournament.maxHoldHours}h` : '∞';
    return `This competition requires trades to be held ${min} – ${max}`;
  })();

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/tournaments/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: tournament.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSubmitted();
      onClose();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    background: '#1d2130', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    color: '#f8fafc', padding: '10px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box'
  };
  const labelStyle = { fontSize: 12, color: '#94a3b8', marginBottom: 4, display: 'block' };

  const allowedAssets = tournament.allowedAssets ? JSON.parse(tournament.allowedAssets) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
      <div style={{ background: C.surface, borderRadius: 16, padding: 28, width: 480, border: `1px solid ${C.border2}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: C.text, margin: 0 }}>Submit Trade Call</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Competition rules reminder */}
        <div style={{ background: C.surface2, borderRadius: 10, padding: 12, marginBottom: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 600 }}>Competition Rules</div>
          <TournamentRules t={tournament} />
          {holdGuide && <div style={{ fontSize: 12, color: C.gold, marginTop: 8 }}>⏱ {holdGuide}</div>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Asset</label>
              {allowedAssets.length > 0 ? (
                <select style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)}>
                  <option value="">Select asset…</option>
                  {allowedAssets.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <input style={inputStyle} value={form.commodity} onChange={e => set('commodity', e.target.value)} placeholder="e.g. GC=F" />
              )}
            </div>
            <div>
              <label style={labelStyle}>Direction</label>
              <select style={inputStyle} value={form.direction} onChange={e => set('direction', e.target.value)}>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Entry Price</label>
              <input style={inputStyle} type="number" step="any" value={form.entryPrice} onChange={e => set('entryPrice', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Stop Loss {tournament.requireStopLoss ? '*' : ''}</label>
              <input style={inputStyle} type="number" step="any" value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Take Profit {tournament.requireTarget ? '*' : ''}</label>
              <input style={inputStyle} type="number" step="any" value={form.takeProfit} onChange={e => set('takeProfit', e.target.value)} />
            </div>
          </div>

          {/* Live R:R display */}
          {rr && (
            <div style={{
              background: parseFloat(rr) >= (tournament.minRiskReward || 0) ? '#10b98111' : '#f43f5e11',
              border: `1px solid ${parseFloat(rr) >= (tournament.minRiskReward || 0) ? '#10b981' : '#f43f5e'}44`,
              borderRadius: 8, padding: '10px 14px',
              color: parseFloat(rr) >= (tournament.minRiskReward || 0) ? C.green : C.red,
              fontSize: 13, fontWeight: 600
            }}>
              R:R {rr} {tournament.minRiskReward && parseFloat(rr) < tournament.minRiskReward ? `— below minimum ${tournament.minRiskReward}` : '✓'}
            </div>
          )}

          <div>
            <label style={labelStyle}>Risk % of Account</label>
            <input style={inputStyle} type="number" step="0.1" value={form.riskPct} onChange={e => set('riskPct', e.target.value)} placeholder="e.g. 2" />
          </div>
          <div>
            <label style={labelStyle}>Notes / Thesis</label>
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Why are you taking this trade?" />
          </div>

          {error && <div style={{ color: C.red, fontSize: 13, background: C.red + '11', padding: 10, borderRadius: 8 }}>{error}</div>}

          <button onClick={submit} disabled={loading}
            style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            {loading ? 'Submitting…' : 'Submit Trade Call'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompetitionsTab({ user }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showSubmitTrade, setShowSubmitTrade] = useState(null);
  const [filterStyle, setFilterStyle] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/tournaments');
    const data = await res.json();
    setTournaments(data.tournaments || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filterStyle ? tournaments.filter(t => t.traderStyle === filterStyle) : tournaments;
  const isPro = user?.plan === 'pro' || user?.plan === 'trader';

  return (
    <div style={{ padding: '24px', maxWidth: 1100, margin: '0 auto' }}>
      {showCreate && <CreateTournamentModal onClose={() => setShowCreate(false)} onCreated={t => { setTournaments(p => [t, ...p]); }} />}
      {showSubmitTrade && (
        <SubmitTradeModal
          tournament={showSubmitTrade}
          onClose={() => setShowSubmitTrade(null)}
          onSubmitted={load}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: C.text, margin: 0, fontSize: 22, fontWeight: 700 }}>Competitions</h1>
          <p style={{ color: C.muted, margin: '4px 0 0', fontSize: 13 }}>Style-matched trading competitions. Find your tier.</p>
        </div>
        {isPro && (
          <button onClick={() => setShowCreate(true)} style={{
            background: C.accent, color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14
          }}>+ Create Competition</button>
        )}
      </div>

      {/* Style filter bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterStyle('')} style={{
          background: !filterStyle ? C.accent + '22' : C.surface2,
          border: `1px solid ${!filterStyle ? C.accent : C.border2}`,
          borderRadius: 8, padding: '7px 16px', color: !filterStyle ? C.accent : C.muted,
          cursor: 'pointer', fontSize: 13, fontWeight: !filterStyle ? 700 : 400
        }}>All Styles</button>
        {Object.entries(TRADER_STYLES).map(([key, s]) => (
          <button key={key} onClick={() => setFilterStyle(key === filterStyle ? '' : key)} style={{
            background: filterStyle === key ? s.color + '22' : C.surface2,
            border: `1px solid ${filterStyle === key ? s.color : C.border2}`,
            borderRadius: 8, padding: '7px 16px', color: filterStyle === key ? s.color : C.muted,
            cursor: 'pointer', fontSize: 13, fontWeight: filterStyle === key ? 700 : 400
          }}>{s.emoji} {s.label}</button>
        ))}
      </div>

      {/* Tournament list */}
      {loading ? (
        <div style={{ color: C.muted, textAlign: 'center', padding: 60 }}>Loading competitions…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No competitions yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Be the first to create one for your trading style.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(t => {
            const now = new Date();
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            const isActive = now >= start && now <= end;
            const isUpcoming = now < start;
            const statusColor = isActive ? C.green : isUpcoming ? C.gold : C.dim;
            const statusLabel = isActive ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'ENDED';

            return (
              <div key={t.id} style={{
                background: C.surface, borderRadius: 14, padding: 20,
                border: `1px solid ${C.border2}`, cursor: 'pointer',
                transition: 'border-color 0.15s',
              }} onClick={() => setSelectedTournament(t === selectedTournament ? null : t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{t.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusColor + '20', padding: '2px 8px', borderRadius: 5 }}>{statusLabel}</span>
                      {t.traderStyle && <StyleBadge style={t.traderStyle} />}
                      {t.type === 'h2h' && <span style={{ fontSize: 11, background: '#8b5cf622', color: '#8b5cf6', border: '1px solid #8b5cf644', borderRadius: 5, padding: '2px 8px' }}>H2H</span>}
                    </div>
                    {t.description && <div style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>{t.description}</div>}
                    <TournamentRules t={t} />
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 20, flexShrink: 0 }}>
                    {t.prizePool && <div style={{ color: C.gold, fontWeight: 700, fontSize: 18 }}>${t.prizePool.toLocaleString()}</div>}
                    <div style={{ color: C.muted, fontSize: 12 }}>{t._count?.entries || 0} entries</div>
                    <div style={{ color: C.dim, fontSize: 11, marginTop: 4 }}>
                      {start.toLocaleDateString()} – {end.toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Expanded view */}
                {selectedTournament?.id === t.id && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {isActive && (
                        <button onClick={e => { e.stopPropagation(); setShowSubmitTrade(t); }} style={{
                          background: C.accent, color: '#fff', border: 'none',
                          borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13
                        }}>Submit Trade Call</button>
                      )}
                      {isActive && (
                        <button onClick={async e => {
                          e.stopPropagation();
                          await fetch('/api/tournaments/resolve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tournamentId: t.id }) });
                          load();
                        }} style={{
                          background: C.surface2, color: C.text, border: `1px solid ${C.border2}`,
                          borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13
                        }}>Update Scores</button>
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
