'use client'
import React, { useState, useEffect } from 'react'

const PURPLE = '#4B44C8'
const STORAGE_KEY = 'tr_journal_v3'

// ─── Storage helpers ──────────────────────────────────────────────────────────
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback } catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, style }) {
  return <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 16px', ...style }}>{children}</div>
}
function Card2({ children, style }) {
  return <div style={{ background: 'var(--surface2)', borderRadius: 7, padding: '10px 12px', ...style }}>{children}</div>
}
function SH({ children, color, style }) {
  return <div style={{ fontSize: 10, fontWeight: 600, color: color || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, ...style }}>{children}</div>
}
function BtnP({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '6px 12px', background: PURPLE, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}
function BtnS({ children, onClick, style }) {
  return <button onClick={onClick} style={{ padding: '5px 10px', background: 'transparent', color: 'var(--text-muted)', border: '0.5px solid var(--border2)', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)', ...style }}>{children}</button>
}
function Inp({ value, onChange, placeholder, style, type = 'text' }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box', ...style }} />
}
function Sel({ value, onChange, children, style }) {
  return <select value={value} onChange={onChange}
    style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', ...style }}>
    {children}
  </select>
}
function Textarea({ value, onChange, placeholder, style }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder}
    style={{ width: '100%', padding: '8px 10px', border: '0.5px solid var(--border2)', borderRadius: 6, background: 'var(--surface2)', fontSize: 12, color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', resize: 'vertical', minHeight: 72, boxSizing: 'border-box', ...style }} />
}
function pnlColor(v) { const n = parseFloat(String(v).replace(/[$,%\s]/g, '')); return isNaN(n) ? 'var(--text)' : n > 0 ? 'var(--green)' : n < 0 ? 'var(--red)' : 'var(--text-muted)' }
function pnlNum(v) { return parseFloat(String(v || '0').replace(/[$,%\s]/g, '')) || 0 }
function RepBar({ label, pct, color, note }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 500, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: note ? 3 : 0 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      {note && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{note}</div>}
    </div>
  )
}

const EMOTIONS = ['Confident', 'Calm', 'Focused', 'Patient', 'Neutral', 'Anxious', 'FOMO', 'Revenge', 'Tired', 'Greedy']
const EMOTION_COLOR = { Confident: '#15803d', Calm: '#15803d', Focused: '#15803d', Patient: '#15803d', Neutral: '#3C3489', Anxious: '#991b1b', FOMO: '#991b1b', Revenge: '#991b1b', Tired: '#991b1b', Greedy: '#991b1b' }
const EMOTION_BG = { Confident: 'rgba(22,163,74,0.08)', Calm: 'rgba(22,163,74,0.08)', Focused: 'rgba(22,163,74,0.08)', Patient: 'rgba(22,163,74,0.08)', Neutral: 'rgba(75,68,200,0.08)', Anxious: 'rgba(220,38,38,0.07)', FOMO: 'rgba(220,38,38,0.07)', Revenge: 'rgba(220,38,38,0.07)', Tired: 'rgba(220,38,38,0.07)', Greedy: 'rgba(220,38,38,0.07)' }

const SETUPS = ['COT breakout', 'Seasonal', 'Trend follow', 'Key level bounce', 'News reaction', 'FOMO entry', 'Breakout', 'Reversal', 'Range fade', 'Gap fill']
const ASSETS = ['Gold', 'Silver', 'Copper', 'Crude Oil', 'Natural Gas', 'Wheat', 'Corn', 'Soybeans', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'BTC', 'ETH', 'SOL', 'NVDA', 'AAPL', 'MSFT', 'TSLA', 'S&P 500', 'Nasdaq', 'ES', 'NQ', 'ZB']

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ trades, journals }) {
  const total = trades.length
  const wins = trades.filter(t => pnlNum(t.pnl) > 0).length
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0
  const netPnl = trades.reduce((s, t) => s + pnlNum(t.pnl), 0)
  const avgRR = total > 0 ? (trades.reduce((s, t) => s + (parseFloat(t.r) || 0), 0) / total).toFixed(1) : '—'
  const losses = trades.filter(t => pnlNum(t.pnl) < 0)
  const grossWin = trades.filter(t => pnlNum(t.pnl) > 0).reduce((s, t) => s + pnlNum(t.pnl), 0)
  const grossLoss = Math.abs(losses.reduce((s, t) => s + pnlNum(t.pnl), 0))
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : '—'

  // Trader score (simple composite)
  const score = total === 0 ? 0 : Math.min(100, Math.round(winRate * 0.4 + Math.min(30, (parseFloat(avgRR) || 0) * 15) + Math.min(30, (journals.length / Math.max(total, 1)) * 30)))

  // Calendar: group trades by date
  const byDate = {}
  trades.forEach(t => {
    if (!t.date) return
    if (!byDate[t.date]) byDate[t.date] = 0
    byDate[t.date] += pnlNum(t.pnl)
  })

  const recentTrades = [...trades].reverse().slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Score + stats */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: `4px solid ${score >= 70 ? '#16a34a' : score >= 50 ? PURPLE : '#dc2626'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: score >= 70 ? '#16a34a' : score >= 50 ? PURPLE : '#dc2626' }}>{score}</div>
            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>score</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Trader score</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Win rate · R:R · Journal consistency</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{total} trades logged</div>
          </div>
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, flex: 1 }}>
          {[
            { label: 'Win rate', value: total > 0 ? `${winRate}%` : '—', color: winRate >= 60 ? 'var(--green)' : winRate > 0 ? 'var(--red)' : 'var(--text)' },
            { label: 'Total trades', value: total || '—', color: 'var(--text)' },
            { label: 'Avg R:R', value: avgRR, color: 'var(--text)' },
            { label: 'Net P&L', value: netPnl !== 0 ? `${netPnl > 0 ? '+' : ''}$${netPnl.toFixed(0)}` : '—', color: netPnl > 0 ? 'var(--green)' : netPnl < 0 ? 'var(--red)' : 'var(--text)' },
            { label: 'Profit factor', value: profitFactor, color: 'var(--text)' },
          ].map(s => (
            <Card2 key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 500, color: s.color, marginBottom: 3 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </Card2>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* P&L calendar */}
        <Card>
          <SH>P&L calendar</SH>
          {Object.keys(byDate).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Log trades to see your calendar</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 10).map(([date, pnl]) => (
                <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 5, background: pnl > 0 ? 'rgba(22,163,74,0.08)' : pnl < 0 ? 'rgba(220,38,38,0.07)' : 'rgba(180,83,9,0.07)', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{date}</span>
                  <span style={{ fontWeight: 500, color: pnl > 0 ? 'var(--green)' : pnl < 0 ? 'var(--red)' : '#b45309' }}>{pnl > 0 ? '+' : ''}${pnl.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent trades */}
        <Card>
          <SH>Recent trades</SH>
          {recentTrades.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No trades yet — add your first trade in the Trade Log tab</div>
          ) : (
            <div>
              {recentTrades.map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < recentTrades.length - 1 ? '0.5px solid var(--border)' : 'none', fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 500, width: 40 }}>{t.asset}</span>
                    <span style={{ fontSize: 9, fontWeight: 500, padding: '1px 5px', borderRadius: 3, background: t.direction === 'Long' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: t.direction === 'Long' ? '#15803d' : '#991b1b' }}>{t.direction}</span>
                    {t.setup && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--surface2)', color: 'var(--text-muted)' }}>{t.setup}</span>}
                  </div>
                  <span style={{ fontWeight: 500, color: pnlColor(t.pnl) }}>{t.pnl || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── TRADE LOG ────────────────────────────────────────────────────────────────
function TradeLog({ trades, setTrades }) {
  const empty = { date: '', asset: '', direction: 'Long', entry: '', exit: '', pnl: '', r: '', size: '', setup: '', emotion: '', rules: '', notes: '' }
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(null)

  function addTrade() {
    if (!form.asset || !form.date) return
    const updated = [form, ...trades]
    setTrades(updated)
    save(STORAGE_KEY + '_trades', updated)
    setForm(empty)
    setAdding(false)
  }
  function removeTrade(i) {
    const updated = trades.filter((_, idx) => idx !== i)
    setTrades(updated)
    save(STORAGE_KEY + '_trades', updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <BtnP onClick={() => setAdding(!adding)}>+ Add trade</BtnP>
        <BtnS>Import CSV</BtnS>
        <BtnS>Connect broker</BtnS>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>{trades.length} trades logged</span>
      </div>

      {adding && (
        <Card style={{ border: `0.5px solid ${PURPLE}` }}>
          <SH color={PURPLE}>New trade</SH>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Date</div><Inp type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Asset</div>
              <Sel value={form.asset} onChange={e => setForm(f => ({ ...f, asset: e.target.value }))}>
                <option value="">Select</option>{ASSETS.map(a => <option key={a}>{a}</option>)}
              </Sel>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Direction</div>
              <Sel value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                <option>Long</option><option>Short</option>
              </Sel>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Setup</div>
              <Sel value={form.setup} onChange={e => setForm(f => ({ ...f, setup: e.target.value }))}>
                <option value="">None</option>{SETUPS.map(s => <option key={s}>{s}</option>)}
              </Sel>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Entry</div><Inp value={form.entry} onChange={e => setForm(f => ({ ...f, entry: e.target.value }))} placeholder="0.00" /></div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Exit</div><Inp value={form.exit} onChange={e => setForm(f => ({ ...f, exit: e.target.value }))} placeholder="0.00" /></div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>P&L ($)</div><Inp value={form.pnl} onChange={e => setForm(f => ({ ...f, pnl: e.target.value }))} placeholder="+240" /></div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>R-multiple</div><Inp value={form.r} onChange={e => setForm(f => ({ ...f, r: e.target.value }))} placeholder="+1.8R" /></div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Size</div><Inp value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="2 lots" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Emotion</div>
              <Sel value={form.emotion} onChange={e => setForm(f => ({ ...f, emotion: e.target.value }))}>
                <option value="">Select</option>{EMOTIONS.map(e => <option key={e}>{e}</option>)}
              </Sel>
            </div>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Rules followed (e.g. 4/4)</div><Inp value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} placeholder="4/4" /></div>
          </div>
          <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Notes</div><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Pre-trade rationale, what worked, what didn't..." /></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnP onClick={addTrade}>Save trade</BtnP>
            <BtnS onClick={() => { setAdding(false); setForm(empty) }}>Cancel</BtnS>
          </div>
        </Card>
      )}

      {trades.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No trades logged yet</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>Add your first trade manually, import a CSV, or connect your broker to auto-import.</div>
          <BtnP onClick={() => setAdding(true)}>+ Add your first trade</BtnP>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['Date', 'Asset', 'Side', 'Entry', 'Exit', 'R', 'P&L', 'Setup', 'Emotion', 'Rules', ''].map((h, i) => (
                  <th key={h + i} style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, padding: '6px 8px', textAlign: i > 2 && i < 9 ? 'center' : 'left', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '0.5px solid var(--border)', width: h === '' ? 28 : h === 'Date' ? 80 : h === 'Setup' || h === 'Emotion' ? 100 : undefined }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t, i) => (
                <React.Fragment key={i}>
                  <tr onClick={() => setExpanded(expanded === i ? null : i)} style={{ cursor: 'pointer', background: expanded === i ? 'rgba(75,68,200,0.04)' : 'transparent', borderBottom: '0.5px solid var(--border)' }}
                    onMouseEnter={e => { if (expanded !== i) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = expanded === i ? 'rgba(75,68,200,0.04)' : 'transparent' }}>
                    <td style={{ fontSize: 11, padding: '7px 8px', color: 'var(--text-muted)' }}>{t.date}</td>
                    <td style={{ fontSize: 12, padding: '7px 8px', fontWeight: 500 }}>{t.asset}</td>
                    <td style={{ fontSize: 11, padding: '7px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 5px', borderRadius: 3, background: t.direction === 'Long' ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.08)', color: t.direction === 'Long' ? '#15803d' : '#991b1b' }}>{t.direction}</span>
                    </td>
                    <td style={{ fontSize: 11, padding: '7px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{t.entry}</td>
                    <td style={{ fontSize: 11, padding: '7px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{t.exit}</td>
                    <td style={{ fontSize: 11, padding: '7px 8px', textAlign: 'center', fontWeight: 500, color: pnlColor(t.r) }}>{t.r}</td>
                    <td style={{ fontSize: 12, padding: '7px 8px', textAlign: 'center', fontWeight: 500, color: pnlColor(t.pnl) }}>{t.pnl}</td>
                    <td style={{ fontSize: 10, padding: '7px 8px' }}><span style={{ background: 'var(--surface2)', padding: '2px 5px', borderRadius: 3 }}>{t.setup}</span></td>
                    <td style={{ fontSize: 10, padding: '7px 8px' }}>
                      {t.emotion && <span style={{ padding: '2px 6px', borderRadius: 10, border: '0.5px solid', background: EMOTION_BG[t.emotion] || 'var(--surface2)', color: EMOTION_COLOR[t.emotion] || 'var(--text-muted)', borderColor: 'transparent' }}>{t.emotion}</span>}
                    </td>
                    <td style={{ fontSize: 11, padding: '7px 8px', textAlign: 'center', fontWeight: 500, color: t.rules === '4/4' ? 'var(--green)' : t.rules?.startsWith('2') ? 'var(--red)' : 'var(--text)' }}>{t.rules}</td>
                    <td style={{ padding: '7px 4px', textAlign: 'center' }}>
                      <button onClick={e => { e.stopPropagation(); removeTrade(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1 }}>×</button>
                    </td>
                  </tr>
                  {expanded === i && (
                    <tr>
                      <td colSpan={11} style={{ padding: '10px 14px', background: 'rgba(75,68,200,0.04)', borderBottom: '0.5px solid var(--border)', borderLeft: '2px solid #4B44C8' }}>
                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8 }}>
                          {t.size && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Size</div><div style={{ fontSize: 12, fontWeight: 500 }}>{t.size}</div></div>}
                          {t.emotion && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Emotion</div><div style={{ fontSize: 12, fontWeight: 500 }}>{t.emotion}</div></div>}
                          {t.rules && <div><div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rules followed</div><div style={{ fontSize: 12, fontWeight: 500 }}>{t.rules}</div></div>}
                        </div>
                        {t.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 5, lineHeight: 1.5 }}>{t.notes}</div>}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

// ─── DAILY JOURNAL ────────────────────────────────────────────────────────────
function DailyJournal({ journals, setJournals }) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState(today)
  const [entry, setEntry] = useState({ premarket: '', went_well: '', went_wrong: '', discipline: 5, emotions: [], tags: [] })

  useEffect(() => {
    const existing = journals.find(j => j.date === selectedDate)
    setEntry(existing || { premarket: '', went_well: '', went_wrong: '', discipline: 5, emotions: [], tags: [] })
  }, [selectedDate, journals])

  function saveEntry() {
    const updated = journals.filter(j => j.date !== selectedDate)
    const newEntry = { ...entry, date: selectedDate }
    updated.push(newEntry)
    setJournals(updated)
    save(STORAGE_KEY + '_journals', updated)
  }

  function toggleEmotion(em) {
    setEntry(e => ({ ...e, emotions: e.emotions.includes(em) ? e.emotions.filter(x => x !== em) : [...e.emotions, em] }))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Inp type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 160 }} />
          <BtnP onClick={saveEntry}>Save entry</BtnP>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{journals.length} entries logged</span>
        </div>
        <Card>
          <SH>Pre-market plan</SH>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>What is the market context today? Key levels, bias, setups on watch.</div>
          <Textarea value={entry.premarket} onChange={e => setEntry(en => ({ ...en, premarket: e.target.value }))} placeholder="Today I'm watching Gold above $2,320 for a COT-driven long. DXY weak, seasonal tailwind. Plan: enter on dip to $2,315, SL below $2,300, target $2,340..." style={{ minHeight: 100 }} />
        </Card>
        <Card>
          <SH>End of day review</SH>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>What went well today?</div>
              <Textarea value={entry.went_well} onChange={e => setEntry(en => ({ ...en, went_well: e.target.value }))} placeholder="Followed my plan, waited for confirmation, sized correctly..." />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>What went wrong? What would you do differently?</div>
              <Textarea value={entry.went_wrong} onChange={e => setEntry(en => ({ ...en, went_wrong: e.target.value }))} placeholder="Took a FOMO trade that wasn't in my plan..." style={{ background: 'rgba(220,38,38,0.03)', borderColor: 'rgba(220,38,38,0.2)' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Discipline score: {entry.discipline}/10</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <button key={n} onClick={() => setEntry(en => ({ ...en, discipline: n }))}
                    style={{ width: 28, height: 28, borderRadius: 5, border: 'none', background: n <= entry.discipline ? PURPLE : 'var(--surface2)', color: n <= entry.discipline ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: n <= entry.discipline ? 500 : 400, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Card>
          <SH>Emotion check-in</SH>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {EMOTIONS.map(em => {
              const sel = entry.emotions.includes(em)
              return (
                <button key={em} onClick={() => toggleEmotion(em)}
                  style={{ fontSize: 10, fontWeight: sel ? 500 : 400, padding: '3px 8px', borderRadius: 10, border: `0.5px solid ${sel ? EMOTION_COLOR[em] : 'var(--border2)'}`, background: sel ? EMOTION_BG[em] : 'transparent', color: sel ? EMOTION_COLOR[em] : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  {em}
                </button>
              )
            })}
          </div>
          {entry.emotions.some(e => ['FOMO', 'Revenge', 'Anxious', 'Greedy'].includes(e)) && (
            <div style={{ fontSize: 10, padding: '6px 8px', background: 'rgba(220,38,38,0.05)', border: '0.5px solid rgba(220,38,38,0.2)', borderRadius: 5, color: '#991b1b', lineHeight: 1.4 }}>
              ⚠ Negative emotions detected. Consider reviewing whether these affected your trades today.
            </div>
          )}
        </Card>
        <Card>
          <SH>Recent entries</SH>
          {journals.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No journal entries yet.</div>
          ) : (
            [...journals].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(j => (
              <div key={j.date} onClick={() => setSelectedDate(j.date)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '0.5px solid var(--border)', cursor: 'pointer', fontSize: 11 }}>
                <span style={{ color: j.date === selectedDate ? PURPLE : 'var(--text)' }}>{j.date}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{j.discipline}/10</span>
                  {j.emotions.slice(0, 2).map(em => <span key={em} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: EMOTION_BG[em], color: EMOTION_COLOR[em] }}>{em}</span>)}
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── REPORTS ──────────────────────────────────────────────────────────────────
function Reports({ trades, journals }) {
  if (trades.length === 0) {
    return (
      <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No data yet</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Log at least 5 trades to start seeing your performance reports.</div>
      </Card>
    )
  }

  // By asset
  const byAsset = {}
  trades.forEach(t => {
    if (!byAsset[t.asset]) byAsset[t.asset] = { wins: 0, total: 0, pnl: 0 }
    byAsset[t.asset].total++
    if (pnlNum(t.pnl) > 0) byAsset[t.asset].wins++
    byAsset[t.asset].pnl += pnlNum(t.pnl)
  })
  const assetRows = Object.entries(byAsset).sort((a, b) => b[1].pnl - a[1].pnl)

  // By setup
  const bySetup = {}
  trades.filter(t => t.setup).forEach(t => {
    if (!bySetup[t.setup]) bySetup[t.setup] = { wins: 0, total: 0, pnl: 0 }
    bySetup[t.setup].total++
    if (pnlNum(t.pnl) > 0) bySetup[t.setup].wins++
    bySetup[t.setup].pnl += pnlNum(t.pnl)
  })

  // By emotion
  const byEmotion = {}
  trades.filter(t => t.emotion).forEach(t => {
    if (!byEmotion[t.emotion]) byEmotion[t.emotion] = { wins: 0, total: 0, pnl: 0 }
    byEmotion[t.emotion].total++
    if (pnlNum(t.pnl) > 0) byEmotion[t.emotion].wins++
    byEmotion[t.emotion].pnl += pnlNum(t.pnl)
  })

  // Avg discipline
  const avgDisc = journals.length > 0 ? (journals.reduce((s, j) => s + (j.discipline || 0), 0) / journals.length).toFixed(1) : '—'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {/* By asset */}
        <Card>
          <SH>Win rate by asset</SH>
          {assetRows.slice(0, 6).map(([asset, d]) => {
            const wr = Math.round((d.wins / d.total) * 100)
            return (
              <RepBar key={asset} label={`${asset} (${d.total} trades)`} pct={wr}
                color={wr >= 60 ? '#16a34a' : wr < 50 ? '#dc2626' : '#b45309'}
                note={`${d.pnl > 0 ? '+' : ''}$${d.pnl.toFixed(0)} net P&L`} />
            )
          })}
        </Card>

        {/* By setup */}
        <Card>
          <SH>Performance by setup</SH>
          {Object.entries(bySetup).sort((a, b) => b[1].pnl - a[1].pnl).slice(0, 6).map(([setup, d]) => {
            const wr = Math.round((d.wins / d.total) * 100)
            return (
              <div key={setup} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted)' }}>{setup}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500, color: d.pnl > 0 ? 'var(--green)' : 'var(--red)' }}>{d.pnl > 0 ? '+' : ''}${d.pnl.toFixed(0)}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{wr}% · {d.total} trades</div>
                </div>
              </div>
            )
          })}
          {Object.keys(bySetup).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tag your trades with setups to see this report.</div>}
        </Card>

        {/* By emotion */}
        <Card>
          <SH>Performance by emotion</SH>
          {Object.entries(byEmotion).sort((a, b) => b[1].pnl - a[1].pnl).map(([em, d]) => {
            const wr = Math.round((d.wins / d.total) * 100)
            return (
              <div key={em} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 11 }}>
                <span style={{ padding: '2px 6px', borderRadius: 10, background: EMOTION_BG[em], color: EMOTION_COLOR[em], fontSize: 10 }}>{em}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 500, color: wr >= 60 ? 'var(--green)' : 'var(--red)' }}>{wr}%</div>
                  <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{d.pnl > 0 ? '+' : ''}${d.pnl.toFixed(0)} · {d.total}tr</div>
                </div>
              </div>
            )
          })}
          {Object.keys(byEmotion).length === 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tag emotions on trades to see this report.</div>}
        </Card>
      </div>

      {/* Summary stats */}
      <Card>
        <SH>Discipline & consistency</SH>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <Card2 style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{avgDisc}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg discipline</div>
          </Card2>
          <Card2 style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{journals.length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Journal entries</div>
          </Card2>
          <Card2 style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500 }}>{trades.filter(t => t.rules === '4/4').length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Full rule trades</div>
          </Card2>
          <Card2 style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#dc2626' }}>{trades.filter(t => ['FOMO', 'Revenge'].includes(t.emotion)).length}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Emotional trades</div>
          </Card2>
        </div>
      </Card>
    </div>
  )
}

// ─── PLAYBOOK ─────────────────────────────────────────────────────────────────
function Playbook({ trades }) {
  const defaultSetups = SETUPS.slice(0, 4).map(name => ({
    name, rules: ['', '', ''], exitRules: ['', ''], checklist: ['', '', ''],
  }))
  const [setups, setSetups] = useState(() => load(STORAGE_KEY + '_setups', defaultSetups))
  const [active, setActive] = useState(0)

  function save_() { save(STORAGE_KEY + '_setups', setups) }
  function updateRule(type, idx, val) {
    const s = [...setups]
    s[active] = { ...s[active], [type]: s[active][type].map((r, i) => i === idx ? val : r) }
    setSetups(s)
  }

  const setup = setups[active]
  const setupTrades = trades.filter(t => t.setup === setup?.name)
  const wins = setupTrades.filter(t => pnlNum(t.pnl) > 0).length
  const wr = setupTrades.length > 0 ? Math.round((wins / setupTrades.length) * 100) : null
  const netPnl = setupTrades.reduce((s, t) => s + pnlNum(t.pnl), 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <SH style={{ margin: 0 }}>My setups</SH>
        </div>
        {setups.map((s, i) => {
          const st = trades.filter(t => t.setup === s.name)
          const w = st.filter(t => pnlNum(t.pnl) > 0).length
          return (
            <div key={i} onClick={() => setActive(i)}
              style={{ padding: '8px 10px', borderRadius: 7, border: `0.5px solid ${i === active ? 'rgba(75,68,200,0.3)' : 'var(--border)'}`, background: i === active ? 'rgba(75,68,200,0.06)' : 'var(--surface2)', cursor: 'pointer' }}>
              <div style={{ fontSize: 12, fontWeight: i === active ? 500 : 400, color: i === active ? '#3C3489' : 'var(--text)', marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{st.length} trades{st.length > 0 ? ` · ${Math.round((w / st.length) * 100)}% win` : ''}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{setup?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {setupTrades.length} trades{wr !== null ? ` · ${wr}% win rate` : ''}{netPnl !== 0 ? ` · ${netPnl > 0 ? '+' : ''}$${netPnl.toFixed(0)} net` : ''}
              </div>
            </div>
            <BtnP onClick={save_}>Save</BtnP>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <SH>Entry rules</SH>
              {setup?.rules.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: PURPLE, fontWeight: 500, fontSize: 12 }}>✓</span>
                  <Inp value={r} onChange={e => updateRule('rules', i, e.target.value)} placeholder={`Entry rule ${i + 1}`} />
                </div>
              ))}
            </div>
            <div>
              <SH>Exit rules</SH>
              {setup?.exitRules.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ color: '#b45309', fontWeight: 500, fontSize: 12 }}>→</span>
                  <Inp value={r} onChange={e => updateRule('exitRules', i, e.target.value)} placeholder={`Exit rule ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <SH>Pre-trade checklist</SH>
          {setup?.checklist.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: item ? PURPLE : 'var(--text-muted)' }}>☑</span>
              <Inp value={item} onChange={e => updateRule('checklist', i, e.target.value)} placeholder={`Checklist item ${i + 1} (e.g. COT score above 65?)`} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TradeRingJournal() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [trades, setTrades] = useState(() => load(STORAGE_KEY + '_trades', []))
  const [journals, setJournals] = useState(() => load(STORAGE_KEY + '_journals', []))

  const tabs = [
    { key: 'dashboard',  label: 'Dashboard' },
    { key: 'tradelog',   label: 'Trade Log' },
    { key: 'daily',      label: 'Daily Journal' },
    { key: 'reports',    label: 'Reports' },
    { key: 'playbook',   label: 'Playbook' },
  ]

  return (
    <div style={{ fontFamily: 'var(--font)', paddingTop: 82, minHeight: '100vh' }}>
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', paddingLeft: 24, background: 'var(--surface)', position: 'sticky', top: 82, zIndex: 10 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ fontSize: 12, padding: '8px 14px', color: activeTab === t.key ? PURPLE : 'var(--text-muted)', borderBottom: `2px solid ${activeTab === t.key ? PURPLE : 'transparent'}`, background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.key ? PURPLE : 'transparent'}`, cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '16px 24px' }}>
        {activeTab === 'dashboard' && <Dashboard trades={trades} journals={journals} />}
        {activeTab === 'tradelog'  && <TradeLog trades={trades} setTrades={setTrades} />}
        {activeTab === 'daily'     && <DailyJournal journals={journals} setJournals={setJournals} />}
        {activeTab === 'reports'   && <Reports trades={trades} journals={journals} />}
        {activeTab === 'playbook'  && <Playbook trades={trades} />}
      </div>
    </div>
  )
}
