'use client'
import { useState, useEffect, useCallback } from 'react'

const PURPLE = '#4f46e5';

const COT_MARKETS = {
  'Commodities': [
    'Gold','Silver','Copper','Crude Oil','Natural Gas','Corn','Wheat','Soybeans',
    'Coffee','Sugar','Cotton','Cocoa','Live Cattle','Lean Hogs','Platinum','Gasoline','Heating Oil'
  ],
  'Forex': [
    'Euro (EUR)','British Pound (GBP)','Japanese Yen (JPY)','Swiss Franc (CHF)',
    'Canadian Dollar (CAD)','Australian Dollar (AUD)','New Zealand Dollar (NZD)'
  ],
  'Financials': [
    'S&P 500','Nasdaq 100','Dow Jones','Russell 2000',
    '10-Year T-Note','30-Year T-Bond','2-Year T-Note'
  ],
};

const COT_KEYWORDS = {
  'Gold':'GOLD','Silver':'SILVER','Copper':'COPPER','Crude Oil':'CRUDE OIL',
  'Natural Gas':'NATURAL GAS','Corn':'CORN','Wheat':'WHEAT','Soybeans':'SOYBEANS',
  'Coffee':'COFFEE','Sugar':'SUGAR','Cotton':'COTTON','Cocoa':'COCOA',
  'Live Cattle':'CATTLE','Lean Hogs':'HOGS','Platinum':'PLATINUM',
  'Gasoline':'GASOLINE','Heating Oil':'HEATING OIL',
  'Euro (EUR)':'EURO FX','British Pound (GBP)':'BRITISH POUND',
  'Japanese Yen (JPY)':'JAPANESE YEN','Swiss Franc (CHF)':'SWISS FRANC',
  'Canadian Dollar (CAD)':'CANADIAN DOLLAR','Australian Dollar (AUD)':'AUSTRALIAN DOLLAR',
  'New Zealand Dollar (NZD)':'NEW ZEALAND DOLLAR',
  'S&P 500':'S&P 500','Nasdaq 100':'NASDAQ','Dow Jones':'DOW JONES',
  'Russell 2000':'RUSSELL','10-Year T-Note':'10-YEAR T-NOTE',
  '30-Year T-Bond':'30-YEAR T-BOND','2-Year T-Note':'2-YEAR T-NOTE',
};

const QUICK_PRESETS = [
  { label:'Gold Extreme Bearish',   commodity:'Gold',        condition:'below', threshold:20 },
  { label:'Gold Extreme Bullish',   commodity:'Gold',        condition:'above', threshold:80 },
  { label:'Crude Oil Oversold',     commodity:'Crude Oil',   condition:'below', threshold:20 },
  { label:'Corn Extreme Bullish',   commodity:'Corn',        condition:'above', threshold:80 },
  { label:'Silver Extreme Bearish', commodity:'Silver',      condition:'below', threshold:15 },
  { label:'EUR/USD Extreme Long',   commodity:'Euro (EUR)',  condition:'above', threshold:80 },
  { label:'S&P 500 Extreme Long',   commodity:'S&P 500',     condition:'above', threshold:85 },
  { label:'T-Bond Extreme Short',   commodity:'30-Year T-Bond', condition:'below', threshold:20 },
];

function loadAlerts() { try { return JSON.parse(localStorage.getItem('tr_cot_alerts_v2')||'[]'); } catch { return []; } }
function saveAlerts(a) { try { localStorage.setItem('tr_cot_alerts_v2', JSON.stringify(a)); } catch {} }
function loadHistory() { try { return JSON.parse(localStorage.getItem('tr_cot_history')||'[]'); } catch { return []; } }
function saveHistory(h) { try { localStorage.setItem('tr_cot_history', JSON.stringify(h)); } catch {} }

function COTBar({ value, threshold, condition }) {
  if (value === undefined || value === null) return null;
  const pct = Math.max(0, Math.min(100, value));
  const triggered = condition === 'below' ? value <= threshold : value >= threshold;
  const barColor = value <= 20 ? 'var(--green)' : value >= 80 ? 'var(--red)' : PURPLE;

  return (
    <div style={{ width:'100%' }}>
      <div style={{ position:'relative', height:8, background:'var(--surface2)', borderRadius:4, overflow:'visible', marginBottom:4 }}>
        <div style={{ position:'absolute', left:0, top:0, width:pct+'%', height:'100%', background:barColor, borderRadius:4, transition:'width 0.5s ease' }}/>
        {threshold !== undefined && (
          <div style={{ position:'absolute', top:-3, left:threshold+'%', width:2, height:14, background: triggered?'#f59e0b':'var(--text-muted)', borderRadius:1, transform:'translateX(-50%)' }}/>
        )}
        <div style={{ position:'absolute', top:-3, left:pct+'%', width:10, height:10, borderRadius:'50%', background:barColor, border:'2px solid var(--surface)', transform:'translateX(-50%)', boxShadow:'0 0 6px '+barColor+'88' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--text-muted)' }}>
        <span>0 — Extreme Bearish</span>
        <span>50 — Neutral</span>
        <span>Extreme Bullish — 100</span>
      </div>
    </div>
  );
}

export default function COTAlertsTab({ externalGroup, onGroupChange }) {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'alerts'
  const [alerts, setAlerts] = useState(() => loadAlerts());
  const [history, setHistory] = useState(() => loadHistory());
  const [showForm, setShowForm] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState({});
  const [dashboardData, setDashboardData] = useState({});
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedGroup, setSelectedGroupInternal] = useState(externalGroup || 'Commodities');
  function setSelectedGroup(g) { setSelectedGroupInternal(g); onGroupChange?.(g); }
  React.useEffect(() => { if (externalGroup) setSelectedGroupInternal(externalGroup); }, [externalGroup]);
  const [form, setForm] = useState({ commodity:'Gold', condition:'below', threshold:25, label:'' });
  const setF = (k,v) => setForm(p => ({...p,[k]:v}));

  useEffect(() => { saveAlerts(alerts); }, [alerts]);

  // Auto-load dashboard on mount and when group changes
  useEffect(() => {
    if (!dashboardData[selectedGroup]) {
      loadDashboard();
    }
  }, [selectedGroup]);

  const fetchCOT = async (market) => {
    const kw = COT_KEYWORDS[market] || market.toUpperCase();
    const res = await fetch('/api/cotindex', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cotKeyword:kw}) });
    return res.json();
  };

  const loadDashboard = async () => {
    setDashboardLoading(true);
    const markets = COT_MARKETS[selectedGroup] || [];
    const results = {};
    await Promise.all(markets.map(async m => {
      try {
        const data = await fetchCOT(m);
        if (data.cotIndex !== undefined) results[m] = data;
      } catch {}
    }));
    setDashboardData(prev => ({...prev, [selectedGroup]: results}));
    setDashboardLoading(false);
  };

  const checkAlerts = async () => {
    setChecking(true);
    const enabled = alerts.filter(a => a.enabled);
    const results = {};
    const newHistory = [];
    await Promise.all(enabled.map(async a => {
      try {
        const data = await fetchCOT(a.commodity);
        if (data.cotIndex !== undefined) {
          const triggered = a.condition === 'below' ? data.cotIndex <= a.threshold : data.cotIndex >= a.threshold;
          results[a.id] = { cotIndex: data.cotIndex, triggered, interpretation: data.interpretation, checkedAt: new Date().toISOString() };
          if (triggered) {
            newHistory.push({ id: Date.now()+Math.random(), alertId: a.id, label: a.label || (a.commodity + ' COT ' + a.condition + ' ' + a.threshold), cotIndex: data.cotIndex, triggeredAt: new Date().toISOString() });
          }
          // Update lastChecked on alert
          setAlerts(prev => prev.map(x => x.id===a.id ? {...x, lastChecked: new Date().toISOString(), lastValue: data.cotIndex} : x));
        }
      } catch {}
    }));
    setCheckResults(results);
    if (newHistory.length) {
      const updated = [...newHistory, ...history].slice(0, 50);
      setHistory(updated);
      saveHistory(updated);
    }
    setChecking(false);
  };

  const createAlert = () => {
    const alert = { id: Date.now()+'', ...form, enabled:true, createdAt: new Date().toISOString(), lastChecked:null, lastValue:null };
    setAlerts(prev => [alert, ...prev]);
    setShowForm(false);
    setForm({ commodity:'Gold', condition:'below', threshold:25, label:'' });
  };

  const addPreset = (preset) => {
    const alert = { id: Date.now()+'', ...preset, enabled:true, createdAt: new Date().toISOString(), lastChecked:null, lastValue:null };
    setAlerts(prev => {
      const exists = prev.find(a => a.commodity===preset.commodity && a.condition===preset.condition && a.threshold===preset.threshold);
      if (exists) return prev;
      return [alert, ...prev];
    });
  };

  const deleteAlert = (id) => {
    if (!window.confirm('Delete this alert?')) return;
    setAlerts(prev => prev.filter(a => a.id!==id));
  };

  const toggleAlert = (id) => setAlerts(prev => prev.map(a => a.id===id ? {...a, enabled:!a.enabled} : a));

  const inp = { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', boxSizing:'border-box', borderRadius:8, transition:'border-color 0.15s' };
  const focusInp = e => e.target.style.borderColor=PURPLE;
  const blurInp  = e => e.target.style.borderColor='var(--border)';

  const triggeredCount = Object.values(checkResults).filter(r => r.triggered).length;

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Tools</div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>COT Alerts</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Monitor Commitments of Traders positioning across commodities, forex, and financials.</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {triggeredCount > 0 && (
            <div style={{ padding:'5px 12px', borderRadius:20, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', fontSize:12, fontWeight:700, color:'#f59e0b' }}>
              ⚡ {triggeredCount} triggered
            </div>
          )}
          <button onClick={checkAlerts} disabled={checking || alerts.filter(a=>a.enabled).length===0}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {checking ? '⏳ Checking...' : '↻ Check Alerts'}
          </button>
          <button onClick={() => setShowForm(s=>!s)}
            style={{ padding:'7px 16px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            + New Alert
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display:'flex', gap:4, background:'var(--surface2)', borderRadius:10, padding:3, marginBottom:20, width:'fit-content' }}>
        {[['dashboard','📊 Dashboard'],['alerts','🔔 My Alerts ('+alerts.length+')'],['history','🕐 Trigger History']].map(([v,label]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ padding:'6px 16px', borderRadius:7, border:'none', background:view===v?PURPLE:'transparent', color:view===v?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* New alert form */}
      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:14 }}>Create Alert</div>

          {/* Market group */}
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Market</div>
            <div style={{ display:'flex', gap:5 }}>
              {Object.keys(COT_MARKETS).map(g => (
                <button key={g} onClick={() => { setSelectedGroup(g); setF('commodity', COT_MARKETS[g][0]); }}
                  style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(selectedGroup===g?PURPLE:'var(--border)'), background:selectedGroup===g?PURPLE:'transparent', color:selectedGroup===g?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Asset</div>
              <select value={form.commodity} onChange={e=>setF('commodity',e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                {(COT_MARKETS[selectedGroup]||[]).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Condition</div>
              <select value={form.condition} onChange={e=>setF('condition',e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                <option value="below">COT Index falls below</option>
                <option value="above">COT Index rises above</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Threshold (0–100)</div>
              <input type="number" min={0} max={100} value={form.threshold} onChange={e=>setF('threshold',+e.target.value)} style={inp} onFocus={focusInp} onBlur={blurInp}/>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Label (optional)</div>
            <input value={form.label} onChange={e=>setF('label',e.target.value)} placeholder="e.g. Gold extreme bearish setup" style={inp} onFocus={focusInp} onBlur={blurInp}/>
          </div>

          {/* Threshold guidance */}
          <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
            <strong style={{ color:'var(--text)' }}>Guidance:</strong> Below 20 = extreme bearish commercials (potential buy signal). Above 80 = extreme bullish commercials (potential sell signal). The most reliable signals come at extremes below 10 or above 90.
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={createAlert} style={{ flex:2, padding:'10px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>Create Alert</button>
            <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:'10px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── DASHBOARD VIEW ── */}
      {view === 'dashboard' && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:5 }}>
              {Object.keys(COT_MARKETS).map(g => (
                <button key={g} onClick={() => setSelectedGroup(g)}
                  style={{ padding:'5px 14px', borderRadius:20, border:'1px solid '+(selectedGroup===g?PURPLE:'var(--border)'), background:selectedGroup===g?PURPLE:'transparent', color:selectedGroup===g?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
            <button onClick={loadDashboard} disabled={dashboardLoading}
              style={{ padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              {dashboardLoading ? '⏳ Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {/* COT explanation */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { range:'0–20', label:'Extreme Bearish', color:'var(--green)', desc:'Commercials maximally short — often a contrarian buy signal' },
              { range:'40–60', label:'Neutral Zone', color:'var(--text-muted)', desc:'No strong positioning signal — wait for extremes' },
              { range:'80–100', label:'Extreme Bullish', color:'var(--red)', desc:'Commercials maximally long — often a contrarian sell signal' },
            ].map(item => (
              <div key={item.range} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:item.color, marginBottom:3 }}>{item.range}</div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{item.label}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', lineHeight:1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {dashboardLoading && !dashboardData[selectedGroup] ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[...Array(6)].map((_,i) => (
                <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', opacity: 1 - i*0.12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ height:14, background:'var(--surface2)', borderRadius:6, width:'40%', marginBottom:6 }}/>
                      <div style={{ height:10, background:'var(--surface2)', borderRadius:4, width:'60%' }}/>
                    </div>
                    <div style={{ height:28, width:40, background:'var(--surface2)', borderRadius:6 }}/>
                  </div>
                  <div style={{ height:8, background:'var(--surface2)', borderRadius:4 }}/>
                </div>
              ))}
            </div>
          ) : !dashboardData[selectedGroup] ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:8 }}>Loading COT data...</div>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {Object.entries(dashboardData[selectedGroup]).sort(([,a],[,b]) => (a.cotIndex||50)-(b.cotIndex||50)).map(([market, data]) => {
                const idx = data.cotIndex;
                const isExtremeLow  = idx <= 20;
                const isExtremeHigh = idx >= 80;
                const highlight = isExtremeLow ? 'rgba(34,197,94,0.08)' : isExtremeHigh ? 'rgba(239,68,68,0.08)' : 'transparent';
                const borderColor = isExtremeLow ? 'rgba(34,197,94,0.3)' : isExtremeHigh ? 'rgba(239,68,68,0.3)' : 'var(--border)';
                return (
                  <div key={market} style={{ background: highlight||'var(--surface)', border:'1px solid '+borderColor, borderRadius:12, padding:'14px 18px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{market}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{data.interpretation || ''}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color: isExtremeLow?'var(--green)':isExtremeHigh?'var(--red)':PURPLE }}>{idx}</div>
                        <div style={{ fontSize:10, fontWeight:700, color: isExtremeLow?'var(--green)':isExtremeHigh?'var(--red)':'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          {isExtremeLow ? '⚡ Extreme Low' : isExtremeHigh ? '⚡ Extreme High' : 'Neutral'}
                        </div>
                      </div>
                      <button onClick={() => addPreset({ label:market+' Alert', commodity:market, condition: idx<=50?'below':'above', threshold: idx<=50?25:75 })}
                        style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.color=PURPLE;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)';}}>
                        + Alert
                      </button>
                    </div>
                    <COTBar value={idx} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ALERTS VIEW ── */}
      {view === 'alerts' && (
        <div>
          {/* Quick presets */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Quick Preset Alerts</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {QUICK_PRESETS.map(p => {
                const exists = alerts.find(a => a.commodity===p.commodity && a.condition===p.condition && a.threshold===p.threshold);
                return (
                  <button key={p.label} onClick={() => addPreset(p)} disabled={!!exists}
                    style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(exists?'var(--border)':PURPLE), background:exists?'var(--surface2)':'rgba(79,70,229,0.08)', color:exists?'var(--text-muted)':PURPLE, fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:exists?'not-allowed':'pointer', opacity:exists?0.5:1 }}>
                    {exists ? '✓ ' : '+ '}{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🔔</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No COT Alerts Yet</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Create alerts or use a quick preset above to get started.</div>
              <button onClick={() => setShowForm(true)}
                style={{ padding:'9px 20px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                + Create First Alert
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {alerts.map(a => {
                const result = checkResults[a.id];
                const triggered = result?.triggered;
                return (
                  <div key={a.id} style={{ background:'var(--surface)', border:'1px solid '+(triggered?'rgba(245,158,11,0.4)':'var(--border)'), borderRadius:12, padding:'14px 18px', transition:'border-color 0.2s' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom: result ? 12 : 0 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:a.enabled?(triggered?'#f59e0b':'var(--green)'):'var(--text-muted)', flexShrink:0, marginTop:4 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{a.label || (a.commodity + ' COT ' + a.condition + ' ' + a.threshold)}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>
                          {a.commodity} · COT Index {a.condition} {a.threshold}
                          {a.lastChecked && ' · Last checked '+new Date(a.lastChecked).toLocaleDateString()}
                          {a.lastValue !== null && a.lastValue !== undefined && ' · Last value: '+a.lastValue}
                        </div>
                      </div>
                      {triggered && (
                        <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', fontSize:11, fontWeight:700, color:'#f59e0b', flexShrink:0 }}>
                          ⚡ TRIGGERED
                        </div>
                      )}
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        <button onClick={() => toggleAlert(a.id)}
                          style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background: a.enabled?'var(--surface2)':PURPLE, color:a.enabled?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                          {a.enabled ? 'Pause' : 'Enable'}
                        </button>
                        <button onClick={() => deleteAlert(a.id)}
                          style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}
                          onMouseEnter={e=>{e.currentTarget.style.color='var(--red)';e.currentTarget.style.borderColor='var(--red)';}}
                          onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border)';}}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {result && (
                      <div style={{ paddingLeft:22 }}>
                        <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>
                          Current reading: <strong style={{ fontFamily:'var(--font-mono)', color: result.cotIndex<=20?'var(--green)':result.cotIndex>=80?'var(--red)':PURPLE }}>{result.cotIndex}</strong>
                          {result.interpretation && <span style={{ marginLeft:8 }}>{result.interpretation}</span>}
                        </div>
                        <COTBar value={result.cotIndex} threshold={a.threshold} condition={a.condition}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>🕐</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No trigger history yet</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>When your alerts trigger, they'll be logged here.</div>
            </div>
          ) : (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 120px', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                {['Alert','COT Index','Triggered At'].map(h => (
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
                ))}
              </div>
              {history.map((h, i) => (
                <div key={h.id} style={{ display:'grid', gridTemplateColumns:'1fr 80px 120px', padding:'11px 16px', borderBottom:i<history.length-1?'1px solid var(--border)':'none', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{h.label}</div>
                  </div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color: h.cotIndex<=20?'var(--green)':h.cotIndex>=80?'var(--red)':PURPLE }}>{h.cotIndex}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{new Date(h.triggeredAt).toLocaleString([],{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <button onClick={() => { if(window.confirm('Clear all history?')){setHistory([]);saveHistory([]);} }}
              style={{ marginTop:12, padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, cursor:'pointer' }}>
              Clear History
            </button>
          )}
        </div>
      )}
    </div>
  );
}
