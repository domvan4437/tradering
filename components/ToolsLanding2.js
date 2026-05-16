"use client";
import React, { useState, useEffect, useRef } from "react";

const PURPLE = '#4B44C8';
const LAST_TOOL_KEY = 'tr_last_tool_v1';

const TOOLS = [
  {
    key: 'Journal',
    title: 'Journal',
    icon: 'ti-notebook',
    color: PURPLE,
    badge: 'Core',
    desc: 'Track every trade with psychology tagging, write daily pre-market plans, run 50+ performance reports, and build your verified public track record — the foundation of your TradeRing profile.',
    features: [
      'Log trades with emotion tags, R-multiple, and rule adherence',
      'Daily pre-market plan + end-of-day discipline review',
      'Win rate by asset, setup, time of day, and emotion state',
      'Playbook — rules, entry criteria, and pre-trade checklist',
      'Trader score — composite of accuracy, R:R, and journal habit',
      'Builds your verified public track record automatically',
    ],
    sections: [
      { icon: 'ti-layout-dashboard', label: 'Dashboard',     sub: 'Score, P&L calendar, stats' },
      { icon: 'ti-list-details',     label: 'Trade log',     sub: 'Entry, exit, emotion, R:R' },
      { icon: 'ti-pencil',           label: 'Daily journal', sub: 'Plans, EOD reviews' },
      { icon: 'ti-chart-bar',        label: 'Reports',       sub: '50+ performance reports' },
      { icon: 'ti-book-2',           label: 'Playbook',      sub: 'Rules & checklists' },
    ],
  },
  {
    key: 'Trade Calc',
    title: 'Trade calculator',
    icon: 'ti-calculator',
    color: PURPLE,
    desc: 'Position sizing, risk/reward, and P&L targets. Auto-calculates as you type across all asset classes.',
    features: [
      'Enter account size and risk % to get exact position size',
      'See max loss in dollar terms before you place the trade',
      'R:R calculator — know your reward before risking',
      'Works for forex, futures, stocks, crypto, and commodities',
    ],
  },
  {
    key: 'Trade Plan Builder',
    title: 'Trade plan builder',
    icon: 'ti-clipboard-list',
    color: '#059669',
    desc: 'AI-assisted trade plans for any asset class. Entry, exit, rationale, and risk — all in one structured document.',
    features: [
      'Covers all asset classes — commodities, forex, stocks, crypto, futures',
      'AI assistance fills in market context and rationale',
      'Entry, stop loss, target, and R:R auto-calculated',
      'Saved plans link to your journal trade log',
    ],
  },
  {
    key: 'COT Alerts',
    title: 'COT alerts',
    icon: 'ti-bell-ringing',
    color: '#d97706',
    desc: 'Automatic alerts when COT positioning hits your thresholds across commodities, forex, and financial futures.',
    features: [
      'Set threshold scores for any market (e.g. alert when Gold > 70)',
      'Covers commodities, forex, and financial futures',
      'Auto-loads new COT data every Friday',
      'Push and email notifications when alerts trigger',
    ],
  },
  {
    key: 'Strategy Backtest',
    title: 'Strategy backtest',
    icon: 'ti-chart-line',
    color: '#7c3aed',
    desc: 'Build strategies with conditions and run them against years of real price data across any market.',
    features: [
      'Build entry and exit conditions with a visual rule builder',
      'Run against historical data back to 2014',
      'See win rate, profit factor, and max drawdown instantly',
      'Supports stocks, forex, futures, crypto, and commodities',
    ],
  },
  {
    key: 'Screener',
    title: 'Custom screener',
    icon: 'ti-filter',
    color: '#0891b2',
    desc: 'Filter assets by COT score, seasonal pattern, technical setup, and price signals. Build and save your own screens.',
    features: [
      'Filter by COT score, seasonal win rate, trend direction',
      'Combine multiple signals — COT + seasonal + price',
      'Save custom screens and run them on demand',
      'Covers commodities, forex, stocks, and crypto',
    ],
  },
  {
    key: 'Import',
    title: 'Import data',
    icon: 'ti-file-import',
    color: '#dc2626',
    desc: 'Bring in notes and data from Notion, Obsidian, Evernote, Bear, OneNote, and 10+ other platforms.',
    features: [
      'Supports Notion, Obsidian, Evernote, Bear, OneNote, Roam',
      'Import CSV trade logs from any broker',
      'Drag and drop ZIP or JSON exports',
      'Notes link automatically to dates in your journal',
    ],
  },
];

// ── Preview content per tool ──────────────────────────────────────────────────
function Preview({ tool }) {
  const { key } = tool;
  const cardStyle = { background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 7, padding: '8px 10px', textAlign: 'center' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '0.5px solid var(--border)' };

  if (key === 'Journal') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: PURPLE }}>—</div>
          <div style={{ fontSize: 7, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>score</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, flex: 1 }}>
          {[{ l: 'Win rate', v: '—', c: 'var(--green)' }, { l: 'Trades', v: '0', c: 'var(--text)' }, { l: 'Avg R:R', v: '—', c: 'var(--text)' }].map(s => (
            <div key={s.l} style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 500, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 8, color: 'var(--text-muted)' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>P&L calendar</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {[1,1,-1,1,1,0,0,1,1,1,-1,1,0,0].map((v, i) => (
            <div key={i} style={{ height: 16, borderRadius: 2, background: v === 1 ? 'rgba(22,163,74,0.25)' : v === -1 ? 'rgba(220,38,38,0.2)' : 'var(--border)' }} />
          ))}
        </div>
      </div>
      <div style={{ background: 'rgba(220,38,38,0.04)', border: '0.5px solid rgba(220,38,38,0.15)', borderRadius: 6, padding: '7px 9px' }}>
        <div style={{ fontSize: 10, color: '#991b1b', fontWeight: 600, marginBottom: 2 }}>FOMO trades cost you -$82 avg</div>
        <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>vs +$244 avg on your planned setups</div>
      </div>
    </div>
  );

  if (key === 'Trade Calc') return (
    <div>
      {[{ l: 'Account size', v: '$10,000' }, { l: 'Risk %', v: '2%' }, { l: 'Position size', v: '3.2 lots', c: PURPLE }, { l: 'Max loss', v: '$200', c: '#dc2626' }, { l: '1:2 R:R target', v: '+$400', c: '#16a34a' }].map((r, i, a) => (
        <div key={r.l} style={{ ...rowStyle, borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
          <span style={{ fontWeight: 500, color: r.c || 'var(--text)' }}>{r.v}</span>
        </div>
      ))}
    </div>
  );

  if (key === 'Trade Plan Builder') return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 8 }}>Gold long · May 15 — sample</div>
      {[{ l: 'Entry', v: '$2,315' }, { l: 'Stop loss', v: '$2,298', c: '#dc2626' }, { l: 'Target', v: '$2,344', c: '#16a34a' }, { l: 'R:R', v: '1:1.7', c: PURPLE }, { l: 'Rationale', v: 'COT Bull 72 + seasonal' }].map((r, i, a) => (
        <div key={r.l} style={{ ...rowStyle, borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
          <span style={{ fontWeight: 500, color: r.c || 'var(--text)' }}>{r.v}</span>
        </div>
      ))}
    </div>
  );

  if (key === 'COT Alerts') return (
    <div>
      {[{ n: 'Gold', s: 72, t: 'bull', alert: true }, { n: 'T-Bond', s: 28, t: 'bear', alert: true }, { n: 'EUR/USD', s: 48, t: 'neut', alert: false }, { n: 'Silver', s: 65, t: 'bull', alert: false }, { n: 'Crude', s: 31, t: 'bear', alert: false }].map((r, i, a) => {
        const bg = r.t === 'bull' ? 'rgba(22,163,74,0.1)' : r.t === 'bear' ? 'rgba(220,38,38,0.09)' : 'rgba(180,83,9,0.1)';
        const col = r.t === 'bull' ? '#15803d' : r.t === 'bear' ? '#991b1b' : '#92400e';
        return (
          <div key={r.n} style={{ ...rowStyle, alignItems: 'center', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
            <span style={{ fontWeight: 500 }}>{r.n}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, background: bg, color: col, fontWeight: 500 }}>{r.t === 'bull' ? 'Bull' : r.t === 'bear' ? 'Bear' : 'Neut'} {r.s}</span>
              {r.alert && <i className="ti ti-bell" style={{ fontSize: 11, color: '#d97706' }} />}
            </div>
          </div>
        );
      })}
    </div>
  );

  if (key === 'Strategy Backtest') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 52 }}>
        {[35, 50, 20, 70, 80, 25, 90, 100].map((h, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', height: `${h}%`, background: h < 30 ? 'rgba(220,38,38,0.2)' : 'rgba(124,58,237,0.25)' }} />
        ))}
      </div>
      {[{ l: 'Win rate', v: '64%', c: '#16a34a' }, { l: 'Profit factor', v: '1.8' }, { l: 'Max drawdown', v: '-8.2%', c: '#dc2626' }, { l: 'Total trades', v: '142' }].map((r, i, a) => (
        <div key={r.l} style={{ ...rowStyle, borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
          <span style={{ fontWeight: 500, color: r.c || 'var(--text)' }}>{r.v}</span>
        </div>
      ))}
    </div>
  );

  if (key === 'Screener') return (
    <div>
      {[{ n: 'Gold', cot: true, seas: true }, { n: 'Silver', cot: true, seas: true }, { n: 'Wheat', cot: true, seas: false }, { n: 'EUR/USD', cot: false, seas: null }, { n: 'Crude', cot: false, seas: false }].map((r, i, a) => (
        <div key={r.n} style={{ ...rowStyle, alignItems: 'center', borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <span style={{ fontWeight: 500 }}>{r.n}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: r.cot ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.09)', color: r.cot ? '#15803d' : '#991b1b' }}>COT {r.cot ? '✓' : '✗'}</span>
            {r.seas !== null && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: r.seas ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.09)', color: r.seas ? '#15803d' : '#991b1b' }}>Seas {r.seas ? '✓' : '✗'}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Supported platforms</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {['Notion', 'Obsidian', 'Evernote', 'Bear', 'OneNote', 'Roam', 'CSV', 'JSON', '+5 more'].map(p => (
          <span key={p} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'var(--surface2)', border: '0.5px solid var(--border)' }}>{p}</span>
        ))}
      </div>
      {[{ l: 'Last import', v: '—' }, { l: 'Notes imported', v: '0' }, { l: 'Linked to journal', v: '0' }].map((r, i, a) => (
        <div key={r.l} style={{ ...rowStyle, borderBottom: i < a.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
          <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
          <span style={{ fontWeight: 500 }}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ToolsLanding2({ onSelect }) {
  const [active, setActive] = useState(TOOLS[0].key);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const last = localStorage.getItem(LAST_TOOL_KEY);
    if (last && TOOLS.find(t => t.key === last)) {
      onSelect(last);
    }
  }, []);

  function openTool(key) {
    localStorage.setItem(LAST_TOOL_KEY, key);
    onSelect(key);
  }

  const tool = TOOLS.find(t => t.key === active) || TOOLS[0];

  return (
    <div style={{ fontFamily: 'var(--font)', display: 'flex', minHeight: 'calc(100vh - 82px)', marginTop: 82 }}>

      {/* ── SIDEBAR ── */}
      <div
        ref={sidebarRef}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
        style={{
          width: sidebarOpen ? 210 : 52,
          minWidth: sidebarOpen ? 210 : 52,
          borderRight: '0.5px solid var(--border)',
          padding: sidebarOpen ? '16px 12px' : '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: 'var(--surface2)',
          transition: 'width 0.18s ease, min-width 0.18s ease, padding 0.18s ease',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}>

        {sidebarOpen && (
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, padding: '0 8px', whiteSpace: 'nowrap' }}>Tools</div>
        )}

        {TOOLS.map(t => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              title={!sidebarOpen ? t.title : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: sidebarOpen ? 8 : 0,
                padding: sidebarOpen ? '8px 10px' : '8px',
                borderRadius: 7,
                background: isActive ? 'rgba(75,68,200,0.12)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                textAlign: 'left',
                width: '100%',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                transition: 'padding 0.18s ease',
              }}>
              <i
                className={`ti ${t.icon}`}
                style={{ fontSize: 16, color: isActive ? t.color : 'var(--text-muted)', flexShrink: 0 }}
                aria-hidden="true"
              />
              {sidebarOpen && (
                <>
                  <span style={{ fontSize: 12, color: isActive ? '#3C3489' : 'var(--text-muted)', fontWeight: isActive ? 500 : 400, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden' }}>{t.title}</span>
                  {t.badge && <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: PURPLE, color: '#fff', textTransform: 'uppercase', flexShrink: 0 }}>{t.badge}</span>}
                </>
              )}
            </button>
          );
        })}

        {/* Stats block — shown only when open */}
        {sidebarOpen && (
          <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Your journal stats</div>
            {[{ l: 'Trades logged', v: '0' }, { l: 'Win rate', v: '—' }, { l: 'Journal entries', v: '0' }, { l: 'Trader score', v: '—' }].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{r.l}</span>
                <span style={{ fontWeight: 500 }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CONTENT PANEL ── */}
      <div style={{ flex: 1, padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <i className={`ti ${tool.icon}`} style={{ fontSize: 26, color: tool.color, marginTop: 3, flexShrink: 0 }} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 500, color: 'var(--text)' }}>{tool.title}</span>
              {tool.badge && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: PURPLE, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {tool.badge} Feature
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 540 }}>{tool.desc}</div>
          </div>
          <button
            onClick={() => openTool(tool.key)}
            style={{ padding: '9px 22px', background: tool.color, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            Open {tool.title.split(' ')[0]} <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>

        {/* Section tabs — Journal only */}
        {tool.sections && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tool.sections.length},1fr)`, gap: 8 }}>
            {tool.sections.map((sec, i) => (
              <div
                key={sec.label}
                style={{
                  border: `0.5px solid ${i === 0 ? PURPLE : 'var(--border)'}`,
                  background: i === 0 ? 'rgba(75,68,200,0.06)' : 'var(--surface2)',
                  borderRadius: 10,
                  padding: '12px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                }}>
                <i className={`ti ${sec.icon}`} style={{ fontSize: 20, color: i === 0 ? PURPLE : 'var(--text-muted)', display: 'block', marginBottom: 6 }} aria-hidden="true" />
                <div style={{ fontSize: 11, fontWeight: 500, color: i === 0 ? '#3C3489' : 'var(--text)', marginBottom: 3 }}>{sec.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', lineHeight: 1.4 }}>{sec.sub}</div>
              </div>
            ))}
          </div>
        )}

        {/* Two-column: features + preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>What's inside</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {tool.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, lineHeight: 1.5 }}>
                  <i className="ti ti-check" style={{ fontSize: 13, color: '#16a34a', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <span style={{ color: 'var(--text)' }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Live preview</div>
            <Preview tool={tool} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const TOOLS_LIST = TOOLS.map(t => ({ key: t.key, title: t.title, icon: t.icon, color: t.color }));
