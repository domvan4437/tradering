
'use client';
import { useState, useEffect } from 'react';
import { Panel, PanelHeader, Badge, Btn, EmptyState } from './DS';

const OPERATORS = [
  { value: 'gt',           label: '>'    },
  { value: 'gte',          label: '>='   },
  { value: 'lt',           label: '<'    },
  { value: 'lte',          label: '<='   },
  { value: 'equals',       label: '='    },
  { value: 'between',      label: 'between' },
  { value: 'crosses_above',label: 'crosses above' },
  { value: 'crosses_below',label: 'crosses below' },
];

const DATA_SOURCES = [
  { value: 'price',       label: 'Price / Market' },
  { value: 'cot',         label: 'COT Data' },
  { value: 'seasonal',    label: 'Seasonal' },
  { value: 'technical',   label: 'Technical' },
  { value: 'fundamental', label: 'Fundamental' },
  { value: 'custom',      label: 'Custom' },
];

const ASSET_CLASSES = ['any','commodities','forex','futures','stocks'];
const TRADER_STYLES = ['','scalper','daytrader','swing','position','macro'];

const SORT_OPTIONS = [
  { value:'name',      label:'Name'        },
  { value:'recent',    label:'Last Run'    },
  { value:'signals',   label:'Conditions'  },
  { value:'runs',      label:'Most Run'    },
];

const QUICK_METRICS = [
  { label:'COT Commercial Percentile', dataSource:'cot',       metric:'COT commercial percentile',     operator:'gt',  valueA:'60', unit:'pct'  },
  { label:'COT Index Below 20',        dataSource:'cot',       metric:'COT index',                     operator:'lt',  valueA:'20', unit:''     },
  { label:'COT Index Above 80',        dataSource:'cot',       metric:'COT index',                     operator:'gt',  valueA:'80', unit:''     },
  { label:'Price Above 50-day MA',     dataSource:'technical', metric:'price vs 50-day MA',             operator:'gt',  valueA:'0',  unit:''     },
  { label:'Price Above 200-day MA',    dataSource:'technical', metric:'price vs 200-day MA',            operator:'gt',  valueA:'0',  unit:''     },
  { label:'RSI Oversold (<30)',         dataSource:'technical', metric:'RSI 14',                        operator:'lt',  valueA:'30', unit:''     },
  { label:'RSI Overbought (>70)',       dataSource:'technical', metric:'RSI 14',                        operator:'gt',  valueA:'70', unit:''     },
  { label:'Seasonal Positive Month',   dataSource:'seasonal',  metric:'seasonal avg return',            operator:'gt',  valueA:'0',  unit:'%'    },
  { label:'Price Change > 2% (5d)',    dataSource:'price',     metric:'price change % 5 days',          operator:'gt',  valueA:'2',  unit:'%'    },
  { label:'Near 52-week Low (<5%)',    dataSource:'price',     metric:'distance from 52w low',          operator:'lt',  valueA:'5',  unit:'%'    },
  { label:'Volume Spike (1.5×)',       dataSource:'technical', metric:'volume vs 20-day avg',           operator:'gt',  valueA:'1.5',unit:'x'    },
  { label:'Custom Metric',             dataSource:'custom',    metric:'',                               operator:'gt',  valueA:'',   unit:''     },
];

const EMPTY_SIGNAL = {
  dataSource: 'price', metric: '', operator: 'gt',
  valueA: '', valueB: '', unit: '', weight: 1,
  isRequired: false, notes: '',
};

function SignalRow({ signal, index, onChange, onRemove, onMove }) {
  const s = { ...EMPTY_SIGNAL, ...signal };
  const set = (k, v) => onChange(index, { ...s, [k]: v });
  const [showQuick, setShowQuick] = useState(false);

  const inp = {
    background: 'var(--surface3)',
    border: '1px solid var(--border2)',
    borderRadius: 4,
    color: 'var(--text)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    padding: '6px 9px',
    outline: 'none',
  };

  const sel = { ...inp, cursor: 'pointer' };

  return (
    <div style={{
      background: 'var(--surface2)',
      border: s.isRequired ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 8,
      padding: '14px 16px',
      marginBottom: 10,
      position: 'relative',
    }}>
      {/* Required badge */}
      {s.isRequired && (
        <span style={{
          position: 'absolute', top: -9, left: 12,
          background: 'var(--accent)', color: '#000',
          fontFamily: 'var(--font)', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '2px 8px', borderRadius: 3,
        }}>Required</span>
      )}

      {/* Quick metrics picker */}
      <div style={{ marginBottom:8, position:'relative' }}>
        <button onClick={() => setShowQuick(s => !s)}
          style={{ background:'none', border:'1px solid var(--border2)', borderRadius:5, color:'var(--text-muted)', padding:'3px 10px', fontSize:10, cursor:'pointer', fontFamily:'var(--font)', letterSpacing:'0.05em' }}>
          ⚡ Quick fill {showQuick ? '▲' : '▼'}
        </button>
        {showQuick && (
          <div style={{ position:'absolute', top:28, left:0, zIndex:200, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:6, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, width:420 }}>
            {QUICK_METRICS.map(m => (
              <button key={m.label} onClick={() => { onChange(index, { ...s, dataSource:m.dataSource, metric:m.metric, operator:m.operator, valueA:m.valueA, unit:m.unit }); setShowQuick(false); }}
                style={{ padding:'6px 10px', borderRadius:5, border:'none', background:'transparent', cursor:'pointer', textAlign:'left', fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 1: source, metric, operator, values */}
      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 130px 90px 90px', gap: 8, marginBottom: 10 }}>
        <select style={sel} value={s.dataSource} onChange={e => set('dataSource', e.target.value)}>
          {DATA_SOURCES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <input
          style={{ ...inp, width: '100%' }}
          placeholder="Metric name (e.g. COT commercial percentile)"
          value={s.metric}
          onChange={e => set('metric', e.target.value)}
        />

        <select style={sel} value={s.operator} onChange={e => set('operator', e.target.value)}>
          {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <input
          style={{ ...inp, width: '100%' }}
          placeholder={s.operator === 'between' ? 'Min' : 'Value'}
          type="number"
          step="any"
          value={s.valueA}
          onChange={e => set('valueA', e.target.value)}
        />

        {s.operator === 'between' ? (
          <input
            style={{ ...inp, width: '100%' }}
            placeholder="Max"
            type="number"
            step="any"
            value={s.valueB}
            onChange={e => set('valueB', e.target.value)}
          />
        ) : (
          <input
            style={{ ...inp, width: '100%' }}
            placeholder="Unit (%, pct...)"
            value={s.unit}
            onChange={e => set('unit', e.target.value)}
          />
        )}
      </div>

      {/* Row 2: weight, required, notes, controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>Weight</span>
          {[1,2,3,4,5].map(w => (
            <button key={w} onClick={() => set('weight', w)} style={{
              width: 26, height: 26,
              background: s.weight >= w ? 'var(--accent)' : 'var(--surface3)',
              border: 'none', borderRadius: 4,
              color: s.weight >= w ? '#000' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', transition: 'all 0.1s',
            }}>{w}</button>
          ))}
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={s.isRequired}
            onChange={e => set('isRequired', e.target.checked)}
            style={{ width: 'auto' }}
          />
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text-muted)' }}>
            Required (fail if missing)
          </span>
        </label>

        <input
          style={{ ...inp, flex: 1, minWidth: 160 }}
          placeholder="Your notes on this condition (optional)"
          value={s.notes}
          onChange={e => set('notes', e.target.value)}
        />

        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          <button onClick={() => onMove(index, -1)} style={{
            background: 'none', border: '1px solid var(--border2)', borderRadius: 4,
            color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          }}>↑</button>
          <button onClick={() => onMove(index, 1)} style={{
            background: 'none', border: '1px solid var(--border2)', borderRadius: 4,
            color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          }}>↓</button>
          <button onClick={() => onRemove(index)} style={{
            background: 'none', border: '1px solid var(--red-border)', borderRadius: 4,
            color: 'var(--red)', cursor: 'pointer', padding: '4px 8px', fontSize: 11,
          }}>✕</button>
        </div>
      </div>
    </div>
  );
}

function ScreenerForm({ template, onSave, onCancel }) {
  const isNew = !template?.id;
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [assetClass, setAssetClass] = useState(template?.assetClass || 'any');
  const [traderStyle, setTraderStyle] = useState(template?.traderStyle || '');
  const [minScore, setMinScore] = useState(template?.minScore ?? 60);
  const [isPublic, setIsPublic] = useState(template?.isPublic || false);
  const [signals, setSignals] = useState(template?.signals || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addSignal = () => setSignals(s => [...s, { ...EMPTY_SIGNAL }]);

  const updateSignal = (idx, updated) =>
    setSignals(s => s.map((sig, i) => i === idx ? updated : sig));

  const removeSignal = (idx) =>
    setSignals(s => s.filter((_, i) => i !== idx));

  const moveSignal = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= signals.length) return;
    const arr = [...signals];
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    setSignals(arr);
  };

  const save = async () => {
    if (!name.trim()) { setError('Name required'); return; }
    if (signals.length === 0) { setError('Add at least one signal'); return; }
    setSaving(true); setError('');
    try {
      const body = { name, description, assetClass, traderStyle, minScore, isPublic, signals };
      const url = isNew ? '/api/screener-templates' : `/api/screener-templates/${template.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSave(data.template);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = {
    background: 'var(--surface2)', border: '1px solid var(--border2)',
    borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)',
    fontSize: 13, padding: '9px 13px', outline: 'none', width: '100%',
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
            {isNew ? 'New Screener' : 'Edit Screener'}
          </div>
          <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            {isNew ? 'Build Your Protocol' : name}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn ghost onClick={onCancel}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Screener'}</Btn>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Screener Name
          </label>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My COT Swing Setup" />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Description (optional)
          </label>
          <input style={inp} value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this screener look for?" />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Asset Class
          </label>
          <select style={{ ...inp, cursor: 'pointer' }} value={assetClass} onChange={e => setAssetClass(e.target.value)}>
            {ASSET_CLASSES.map(a => <option key={a} value={a}>{a === 'any' ? 'All Markets' : a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Trading Style (optional)
          </label>
          <select style={{ ...inp, cursor: 'pointer' }} value={traderStyle} onChange={e => setTraderStyle(e.target.value)}>
            {TRADER_STYLES.map(s => <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Not specified'}</option>)}
          </select>
        </div>
      </div>

      {/* Min score + public toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, padding: '14px 18px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>Flag asset when score ≥</span>
          <input
            type="number" min="0" max="100"
            style={{ ...inp, width: 70, textAlign: 'center', fontFamily: 'var(--font-mono)' }}
            value={minScore}
            onChange={e => setMinScore(e.target.value)}
          />
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>/ 100</span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ width: 'auto' }} />
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)' }}>
            Publish to community library
          </span>
        </label>
      </div>

      {/* Signals */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              Screening Conditions
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {signals.length === 0
                ? 'Add your exact conditions. No suggestions — your protocol, your numbers.'
                : `${signals.length} condition${signals.length > 1 ? 's' : ''} · Required conditions must pass regardless of score`}
            </div>
          </div>
          <button onClick={addSignal} style={{
            background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
            borderRadius: 6, color: 'var(--accent)', padding: '8px 16px',
            fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>+ Add Condition</button>
        </div>

        {signals.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border2)', borderRadius: 8,
            padding: '40px 24px', textAlign: 'center',
            color: 'var(--text-muted)', fontFamily: 'var(--font)', fontSize: 13,
          }}>
            No conditions yet. Add your first condition above.
          </div>
        ) : (
          signals.map((sig, idx) => (
            <SignalRow
              key={idx}
              signal={sig}
              index={idx}
              onChange={updateSignal}
              onRemove={removeSignal}
              onMove={moveSignal}
            />
          ))
        )}
      </div>

      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 6, padding: '10px 14px', color: 'var(--red)', fontFamily: 'var(--font)', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}
    </div>
  );
}

function RunResults({ results, onClose, onExport }) {
  const flagged = results.filter(r => r.passed);
  const rest = results.filter(r => !r.passed);

  const Row = ({ r }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 20px', borderBottom: '1px solid var(--border)',
      background: r.passed ? 'var(--green-bg)' : 'transparent',
      transition: 'background 0.1s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{r.symbol}</span>
        {r.passed && <Badge type="buy">Flagged</Badge>}
        {r.failedRequired && <Badge type="sell">Required Failed</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {r.price && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{r.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 80, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${r.score}%`, height: '100%', background: r.passed ? 'var(--green)' : r.score > 40 ? 'var(--accent)' : 'var(--text-muted)', borderRadius: 2, transition: 'width 0.5s' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: r.passed ? 'var(--green)' : 'var(--text-muted)', minWidth: 32 }}>{r.score}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            {flagged.length} asset{flagged.length !== 1 ? 's' : ''} flagged
          </span>
          <span style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginLeft: 10 }}>
            of {results.length} scanned
          </span>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {flagged.length > 0 && (
            <button onClick={onExport} style={{ background:'none', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text-muted)', padding:'5px 12px', cursor:'pointer', fontFamily:'var(--font)', fontSize:11, fontWeight:600 }}>
              ↓ Export CSV
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12 }}>← Back</button>
        </div>
      </div>
      {flagged.length === 0 ? (
        <EmptyState icon="◎" title="No assets flagged" subtitle="No assets met your criteria" />
      ) : (
        <>
          {flagged.map(r => <Row key={r.symbol} r={r} />)}
          {rest.length > 0 && (
            <>
              <div style={{ padding: '10px 20px', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                Did not pass
              </div>
              {rest.map(r => <Row key={r.symbol} r={r} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ScreenerBuilder({ user, externalAction, onActionHandled }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | build | edit | run | community
  useEffect(() => { if (externalAction === 'new') { setView('build'); setSelected(null); onActionHandled?.(); } }, [externalAction]);
  const [selected, setSelected] = useState(null);
  const [runResults, setRunResults] = useState(null);
  const [running, setRunning] = useState(null);
  const [communityTemplates, setCommunityTemplates] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [lastRunCache, setLastRunCache] = useState({});

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/screener-templates?mode=mine');
    const data = await res.json();
    setTemplates(data.templates || []);
    setLoading(false);
  };

  const loadCommunity = async () => {
    setCommunityLoading(true);
    const res = await fetch('/api/screener-templates?mode=community');
    const data = await res.json();
    setCommunityTemplates(data.templates || []);
    setCommunityLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (view === 'community') loadCommunity();
  }, [view]);

  const runScreener = async (template) => {
    setRunning(template.id);
    try {
      const res = await fetch(`/api/screener-templates/${template.id}/run`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRunResults(data.results);
      setSelected(template);
      setView('run');
      // Cache last run result
      const flagged = (data.results||[]).filter(r => r.passed).length;
      const now = new Date();
      setLastRunCache(prev => ({ ...prev, [template.id]: { flagged, ago: 'just now', at: now.toISOString() } }));
    } catch (e) { alert(e.message); }
    finally { setRunning(null); }
  };

  const forkTemplate = async (template) => {
    const res = await fetch('/api/screener-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${template.name} (fork)`,
        description: template.description,
        assetClass: template.assetClass,
        traderStyle: template.traderStyle,
        minScore: template.minScore,
        isPublic: false,
        forkedFromId: template.id,
        signals: template.signals.map(s => ({
          dataSource: s.dataSource, metric: s.metric, operator: s.operator,
          valueA: s.valueA, valueB: s.valueB, unit: s.unit,
          weight: s.weight, isRequired: s.isRequired, notes: s.notes,
        })),
      }),
    });
    const data = await res.json();
    if (res.ok) { load(); setView('list'); }
    else alert(data.error);
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Delete this screener?')) return;
    await fetch(`/api/screener-templates/${id}`, { method: 'DELETE' });
    load();
  };

  const duplicateTemplate = async (t) => {
    const res = await fetch('/api/screener-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: t.name + ' (copy)',
        description: t.description,
        assetClass: t.assetClass,
        traderStyle: t.traderStyle,
        minScore: t.minScore,
        isPublic: false,
        signals: t.signals,
      }),
    });
    const data = await res.json();
    if (res.ok) load();
    else alert(data.error);
  };

  const pinTemplate = async (t) => {
    await fetch(`/api/screener-templates/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...t, isPinned: !t.isPinned }),
    });
    load();
  };

  const exportResults = (results, name) => {
    if (!results?.length) return;
    const header = 'Symbol,Score,Passed,Price,Failed Required';
    const rows = results.map(r => [r.symbol, r.score, r.passed, r.price||'', r.failedRequired||false].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download = (name||'screener')+'_results.csv'; a.click();
  };

  const signalComplexity = (count) => {
    if (count <= 3) return { label:'Simple',   color:'var(--green)',  bg:'rgba(34,197,94,0.1)'  };
    if (count <= 6) return { label:'Moderate',  color:'#f59e0b',       bg:'rgba(245,158,11,0.1)' };
    return                 { label:'Complex',   color:'#4f46e5',        bg:'rgba(79,70,229,0.1)'  };
  };

  const sortedTemplates = [...templates].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (sortBy === 'name')    return a.name.localeCompare(b.name);
    if (sortBy === 'signals') return (b.signals?.length||0) - (a.signals?.length||0);
    if (sortBy === 'runs')    return (b._count?.runs||0) - (a._count?.runs||0);
    return new Date(b.updatedAt||0) - new Date(a.updatedAt||0);
  });

  // ── Views ──

  if (view === 'build') {
    return <ScreenerForm template={null} onSave={() => { load(); setView('list'); }} onCancel={() => setView('list')} />;
  }

  if (view === 'edit' && selected) {
    return <ScreenerForm template={selected} onSave={() => { load(); setView('list'); }} onCancel={() => setView('list')} />;
  }

  if (view === 'run' && runResults) {
    return (
      <Panel>
        <RunResults results={runResults} onClose={() => { setView('list'); setRunResults(null); }} onExport={() => exportResults(runResults, selected?.name)} />
      </Panel>
    );
  }

  const filteredCommunity = communityTemplates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchStyle = !styleFilter || t.traderStyle === styleFilter;
    return matchSearch && matchStyle;
  });

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 6 }}>
            Custom Screener
          </div>
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
            Your Screening Protocols
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn ghost onClick={() => setView(view === 'community' ? 'list' : 'community')}>
            {view === 'community' ? 'My Screeners' : 'Community Library'}
          </Btn>
          <Btn onClick={() => setView('build')}>+ New Screener</Btn>
        </div>
      </div>

      {/* Community view */}
      {view === 'community' ? (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, padding: '9px 13px', outline: 'none', flex: 1, minWidth: 200 }}
              placeholder="Search protocols…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 13, padding: '9px 13px', outline: 'none', cursor: 'pointer' }}
              value={styleFilter}
              onChange={e => setStyleFilter(e.target.value)}
            >
              <option value="">All Styles</option>
              {['scalper','daytrader','swing','position','macro'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {communityLoading ? (
            <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font)', color: 'var(--text-muted)' }}>Loading community protocols…</div>
          ) : filteredCommunity.length === 0 ? (
            <EmptyState icon="◎" title="No protocols yet" subtitle="Be the first to publish your screener" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredCommunity.map(t => {
                const creator = t.user?.name || t.user?.email?.split('@')[0] || 'Unknown';
                const consistency = t.user?.consistency?.consistencyScore;
                const winRate = t.user?.consistency?.winRate;
                return (
                  <Panel key={t.id}>
                    <div style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t.name}</span>
                            {t.traderStyle && <Badge type="watch">{t.traderStyle}</Badge>}
                            {t.assetClass && t.assetClass !== 'any' && <Badge type="neutral">{t.assetClass}</Badge>}
                          </div>
                          {t.description && <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{t.description}</p>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                          <Btn ghost onClick={() => forkTemplate(t)}>Fork & Use</Btn>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>By </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{creator}</span>
                        </div>
                        {consistency != null && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Consistency </span>
                            <span style={{ color: consistency >= 60 ? 'var(--green)' : 'var(--text-secondary)' }}>{consistency}/100</span>
                          </div>
                        )}
                        {winRate != null && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Win Rate </span>
                            <span style={{ color: 'var(--text-secondary)' }}>{(winRate * 100).toFixed(0)}%</span>
                          </div>
                        )}
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Used </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.useCount}×</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Forked </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.forkCount}×</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Conditions </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.signals?.length || 0}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Min Score </span>
                          <span style={{ color: 'var(--text-secondary)' }}>{t.minScore}</span>
                        </div>
                      </div>

                      {/* Signal preview */}
                      {t.signals?.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {t.signals.slice(0, 6).map((s, i) => (
                            <span key={i} style={{
                              fontFamily: 'var(--font-mono)', fontSize: 10,
                              background: s.isRequired ? 'var(--accent-bg)' : 'var(--surface2)',
                              border: `1px solid ${s.isRequired ? 'var(--accent-border)' : 'var(--border)'}`,
                              color: s.isRequired ? 'var(--accent)' : 'var(--text-muted)',
                              padding: '3px 8px', borderRadius: 4,
                            }}>
                              {s.metric} {s.operator} {s.valueA}{s.unit ? ' ' + s.unit : ''}
                            </span>
                          ))}
                          {t.signals.length > 6 && (
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', padding: '3px 8px' }}>
                              +{t.signals.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My screeners list */
        loading ? (
          <div style={{ textAlign: 'center', padding: 60, fontFamily: 'var(--font)', color: 'var(--text-muted)' }}>Loading…</div>
        ) : templates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 32, marginBottom: 16, opacity: 0.2 }}>◎</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>No screeners yet</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
              Build your first protocol — your exact conditions, your exact numbers.
            </div>
            <Btn onClick={() => setView('build')}>Build Your First Screener</Btn>
          </div>
        ) : (
          <div>
            {/* Sort bar */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Sort:</span>
              {SORT_OPTIONS.map(o => (
                <button key={o.value} onClick={() => setSortBy(o.value)}
                  style={{ padding:'4px 12px', borderRadius:20, border:'1px solid '+(sortBy===o.value?'#4f46e5':'var(--border)'), background:sortBy===o.value?'rgba(79,70,229,0.1)':'transparent', color:sortBy===o.value?'#4f46e5':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {o.label}
                </button>
              ))}
              <span style={{ marginLeft:'auto', fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{templates.length} screener{templates.length!==1?'s':''}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedTemplates.map(t => {
                const cx = signalComplexity(t.signals?.length || 0);
                const lastRun = lastRunCache[t.id];
                return (
                  <Panel key={t.id}>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          {/* Title row */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap:'wrap' }}>
                            <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.name}</span>
                            {t.isPinned && <Badge type="watch">📌 Pinned</Badge>}
                            {t.isPublic && <Badge type="buy">Public</Badge>}
                            {t.traderStyle && <Badge type="neutral">{t.traderStyle}</Badge>}
                            {/* Complexity badge */}
                            <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:20, background:cx.bg, color:cx.color, border:'1px solid '+cx.color+'44' }}>
                              {cx.label} · {t.signals?.length||0} conditions
                            </span>
                          </div>

                          {t.description && (
                            <div style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{t.description}</div>
                          )}

                          {/* Stats row */}
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems:'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                              Min score: {t.minScore}
                            </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                              Run {t._count?.runs || 0}×
                            </span>
                            {t.assetClass && t.assetClass !== 'any' && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                                {t.assetClass}
                              </span>
                            )}
                            {/* Last run result */}
                            {lastRun && (
                              <span style={{ fontFamily:'var(--font)', fontSize:11, color: lastRun.flagged>0?'var(--green)':'var(--text-muted)', fontWeight: lastRun.flagged>0?700:400 }}>
                                Last run: {lastRun.flagged} flagged · {lastRun.ago}
                              </span>
                            )}
                          </div>

                          {/* Signal preview chips */}
                          {t.signals?.length > 0 && (
                            <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
                              {t.signals.slice(0,4).map((s,i) => (
                                <span key={i} style={{ fontFamily:'var(--font-mono)', fontSize:10, background:s.isRequired?'rgba(79,70,229,0.1)':'var(--surface2)', border:'1px solid '+(s.isRequired?'rgba(79,70,229,0.3)':'var(--border)'), color:s.isRequired?'#4f46e5':'var(--text-muted)', padding:'2px 8px', borderRadius:4 }}>
                                  {s.metric || s.dataSource} {s.operator} {s.valueA}{s.unit?' '+s.unit:''}
                                </span>
                              ))}
                              {t.signals.length > 4 && <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-muted)', padding:'2px 4px' }}>+{t.signals.length-4} more</span>}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems:'flex-start' }}>
                          {/* Pin */}
                          <button onClick={() => pinTemplate(t)} title={t.isPinned?'Unpin':'Pin to top'}
                            style={{ background:'none', border:'1px solid var(--border2)', borderRadius:6, color:t.isPinned?'#4f46e5':'var(--text-muted)', padding:'7px 10px', cursor:'pointer', fontSize:13 }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='#4f46e5'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}>
                            📌
                          </button>
                          {/* Duplicate */}
                          <button onClick={() => duplicateTemplate(t)} title="Duplicate"
                            style={{ background:'none', border:'1px solid var(--border2)', borderRadius:6, color:'var(--text-muted)', padding:'7px 10px', cursor:'pointer', fontSize:11, fontFamily:'var(--font)' }}
                            onMouseEnter={e=>e.currentTarget.style.borderColor='#4f46e5'}
                            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border2)'}>
                            ⧉
                          </button>
                          <Btn ghost onClick={() => { setSelected(t); setView('edit'); }}>Edit</Btn>
                          <button
                            onClick={() => runScreener(t)}
                            disabled={running === t.id}
                            style={{
                              background: running === t.id ? 'var(--surface3)' : 'var(--accent)',
                              color: running === t.id ? 'var(--text-muted)' : '#000',
                              border: 'none', borderRadius: 6, padding: '9px 18px',
                              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                              cursor: running === t.id ? 'not-allowed' : 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            {running === t.id ? 'Running…' : '▶ Run'}
                          </button>
                          <button onClick={() => deleteTemplate(t.id)} style={{
                            background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                            color: 'var(--text-muted)', padding: '9px 12px', cursor: 'pointer', fontSize: 13,
                          }}
                          onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>✕</button>
                        </div>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
