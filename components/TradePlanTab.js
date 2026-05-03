'use client'
import { useState, useEffect, useRef } from 'react'

const PURPLE = '#4f46e5';

const ASSET_CLASSES = ['Commodities','Forex','Stocks','Crypto','Futures','Options'];

const ASSETS = {
  Commodities: ['Gold','Silver','Copper','Crude Oil','Natural Gas','Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle','Lean Hogs','Platinum','Palladium','Gasoline','Heating Oil'],
  Forex: ['EUR/USD','GBP/USD','USD/JPY','AUD/USD','USD/CAD','NZD/USD','USD/CHF','EUR/GBP','EUR/JPY','GBP/JPY'],
  Stocks: ['AAPL','MSFT','NVDA','GOOGL','AMZN','META','TSLA','JPM','BRK.B','XOM','SPY','QQQ','IWM'],
  Crypto: ['BTC/USD','ETH/USD','SOL/USD','BNB/USD','XRP/USD','ADA/USD','AVAX/USD','DOT/USD'],
  Futures: ['ES (E-mini S&P)','NQ (E-mini Nasdaq)','YM (Dow)','RTY (Russell)','ZB (T-Bond)','ZN (10-Yr Note)','CL (Crude Oil)','GC (Gold)'],
  Options: ['SPY Calls','SPY Puts','QQQ Calls','QQQ Puts','VIX Calls','Custom'],
};

const TRADE_TYPES = ['Swing Trade','Day Trade','Position Trade','Scalp','Long-term Investment'];
const BIASES = ['Bullish','Bearish','Neutral — Waiting','Contrarian'];
const TIMEFRAMES = ['1 min','5 min','15 min','1 hour','4 hour','Daily','Weekly','Monthly'];

const DEFAULT_SECTIONS = [
  { id:'thesis',     label:'Trade Thesis',       icon:'💡', enabled:true,  content:'' },
  { id:'entry',      label:'Entry Criteria',     icon:'🎯', enabled:true,  content:'' },
  { id:'stop',       label:'Stop Loss',          icon:'🛑', enabled:true,  content:'' },
  { id:'targets',    label:'Profit Targets',     icon:'✅', enabled:true,  content:'' },
  { id:'risk',       label:'Risk Management',    icon:'⚖️', enabled:true,  content:'' },
  { id:'context',    label:'Market Context',     icon:'🌍', enabled:true,  content:'' },
  { id:'cot',        label:'COT Analysis',       icon:'📊', enabled:false, content:'' },
  { id:'seasonal',   label:'Seasonal Bias',      icon:'📅', enabled:false, content:'' },
  { id:'keylevels',  label:'Key Levels',         icon:'📐', enabled:true,  content:'' },
  { id:'catalysts',  label:'News & Catalysts',   icon:'📰', enabled:false, content:'' },
  { id:'checklist',  label:'Pre-Trade Checklist',icon:'☑️', enabled:true,  content:'' },
  { id:'notes',      label:'Additional Notes',   icon:'📝', enabled:false, content:'' },
];

function loadPlans() { try { return JSON.parse(localStorage.getItem('tr_trade_plans_v2')||'[]'); } catch { return []; } }
function savePlans(p) { try { localStorage.setItem('tr_trade_plans_v2', JSON.stringify(p)); } catch {} }
function loadTemplate() { try { return JSON.parse(localStorage.getItem('tr_plan_template')||'null'); } catch { return null; } }
function saveTemplate(t) { try { localStorage.setItem('tr_plan_template', JSON.stringify(t)); } catch {} }

export default function TradePlanTab() {
  const [view, setView] = useState('builder'); // 'builder' | 'library' | 'template'
  const [plans, setPlans] = useState(() => loadPlans());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [showSaveMsg, setShowSaveMsg] = useState(false);

  // Form state
  const [assetClass, setAssetClass] = useState('Commodities');
  const [asset, setAsset] = useState('Gold');
  const [customAsset, setCustomAsset] = useState('');
  const [tradeType, setTradeType] = useState('Swing Trade');
  const [bias, setBias] = useState('Bullish');
  const [timeframe, setTimeframe] = useState('Daily');
  const [entryZone, setEntryZone] = useState('');
  const [stopZone, setStopZone] = useState('');
  const [targetZone, setTargetZone] = useState('');
  const [thesis, setThesis] = useState('');
  const [sections, setSections] = useState(() => loadTemplate() || DEFAULT_SECTIONS);
  const [planName, setPlanName] = useState('');

  // Generated plan sections (editable)
  const [generatedSections, setGeneratedSections] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  useEffect(() => { savePlans(plans); }, [plans]);

  const enabledSections = sections.filter(s => s.enabled);

  const toggleSection = (id) => setSections(prev => prev.map(s => s.id===id ? {...s, enabled:!s.enabled} : s));

  const generatePlan = async () => {
    setGenerating(true); setError(''); setGeneratedSections(null);
    const finalAsset = customAsset || asset;
    const prompt = `You are a professional trading analyst. Generate a detailed, structured trade plan for the following setup:

Asset Class: ${assetClass}
Asset: ${finalAsset}
Trade Type: ${tradeType}
Bias: ${bias}
Timeframe: ${timeframe}
Entry Zone: ${entryZone || 'Not specified'}
Stop Loss Zone: ${stopZone || 'Not specified'}
Target Zone: ${targetZone || 'Not specified'}
Trader Thesis: ${thesis || 'Not specified'}

Generate content for each of these sections: ${enabledSections.map(s=>s.label).join(', ')}.

Respond ONLY with a valid JSON object where each key is the section id and the value is a detailed string for that section. Section ids: ${enabledSections.map(s=>'"'+s.id+'"').join(', ')}.
Be specific, professional, and actionable. Include specific price levels where entry/stop/target zones are provided.
Do not include any text outside the JSON object.`;

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await res.json();
      const text = data.content || data.message || data.response || '';
      const clean = text.replace(/```json|\n|```/g, '').trim();
      const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
      if (start === -1) throw new Error('No JSON found');
      const parsed = JSON.parse(clean.slice(start, end+1));
      setGeneratedSections(parsed);
      setPlanName((customAsset||asset) + ' ' + tradeType + ' — ' + new Date().toLocaleDateString());
    } catch (e) {
      setError('Generation failed. Check your API key or try again.');
    }
    setGenerating(false);
  };

  const savePlan = () => {
    if (!generatedSections) return;
    const finalAsset = customAsset || asset;
    const plan = {
      id: Date.now()+'',
      name: planName || (finalAsset + ' ' + tradeType),
      assetClass, asset: finalAsset, tradeType, bias, timeframe,
      entryZone, stopZone, targetZone, thesis,
      sections: enabledSections.map(s => ({ ...s, content: generatedSections[s.id] || '' })),
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    setPlans(prev => [plan, ...prev]);
    setGeneratedSections(null);
    setShowSaveMsg(true);
    setTimeout(() => setShowSaveMsg(false), 2500);
  };

  const deletePlan = (id) => {
    if (!window.confirm('Delete this plan?')) return;
    setPlans(prev => prev.filter(p => p.id !== id));
    if (selectedPlan?.id === id) setSelectedPlan(null);
  };

  const saveAsTemplate = () => {
    saveTemplate(sections);
    alert('Template saved! Future plans will use these sections by default.');
  };

  const resetTemplate = () => {
    setSections(DEFAULT_SECTIONS);
    saveTemplate(null);
  };

  const inp = { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', boxSizing:'border-box', borderRadius:8, transition:'border-color 0.15s' };
  const focusInp = (e) => e.target.style.borderColor = PURPLE;
  const blurInp  = (e) => e.target.style.borderColor = 'var(--border)';

  const biasColor = bias === 'Bullish' ? 'var(--green)' : bias === 'Bearish' ? 'var(--red)' : bias === 'Neutral — Waiting' ? '#f59e0b' : '#8b5cf6';

  const filteredPlans = plans
    .filter(p => filterClass === 'All' || p.assetClass === filterClass)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.asset.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Tools</div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Trade Plan Builder</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Build structured, AI-assisted trade plans for any asset class. Fully customizable to your process.</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {['builder','library','template'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'7px 14px', borderRadius:8, border:'1px solid '+(view===v?PURPLE:'var(--border)'), background: view===v?PURPLE:'transparent', color: view===v?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
              {v === 'builder' ? '✦ Builder' : v === 'library' ? '📋 Library ('+plans.length+')' : '⚙ Template'}
            </button>
          ))}
        </div>
      </div>

      {showSaveMsg && (
        <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)', borderRadius:10, padding:'10px 16px', marginBottom:14, fontSize:13, color:'var(--green)', fontWeight:600 }}>
          ✅ Plan saved to your library!
        </div>
      )}

      {/* ── BUILDER VIEW ── */}
      {view === 'builder' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>

          {/* Left — inputs */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

            {/* Asset setup */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Asset Setup</div>

              {/* Asset class */}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Asset Class</div>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {ASSET_CLASSES.map(ac => (
                    <button key={ac} onClick={() => { setAssetClass(ac); setAsset(ASSETS[ac][0]); setCustomAsset(''); }}
                      style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(assetClass===ac?PURPLE:'var(--border)'), background: assetClass===ac?PURPLE:'transparent', color: assetClass===ac?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                      {ac}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asset */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Asset</div>
                  <select value={asset} onChange={e => { setAsset(e.target.value); setCustomAsset(''); }}
                    style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                    {(ASSETS[assetClass]||[]).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Custom Asset</div>
                  <input value={customAsset} onChange={e => setCustomAsset(e.target.value)} placeholder="Override with any ticker..." style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>
              </div>

              {/* Trade type + timeframe */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Trade Type</div>
                  <select value={tradeType} onChange={e => setTradeType(e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                    {TRADE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Timeframe</div>
                  <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                    {TIMEFRAMES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Bias */}
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Market Bias</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {BIASES.map(b => (
                    <button key={b} onClick={() => setBias(b)}
                      style={{ padding:'6px 14px', borderRadius:20, border:'1px solid '+(bias===b?biasColor:'var(--border)'), background: bias===b?biasColor+'22':'transparent', color: bias===b?biasColor:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Price levels */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14 }}>Price Levels (optional)</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Entry Zone</div>
                  <input value={entryZone} onChange={e => setEntryZone(e.target.value)} placeholder="e.g. 2340 - 2350" style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Stop Loss Zone</div>
                  <input value={stopZone} onChange={e => setStopZone(e.target.value)} placeholder="e.g. below 2300" style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Target Zone</div>
                  <input value={targetZone} onChange={e => setTargetZone(e.target.value)} placeholder="e.g. 2420 - 2450" style={inp} onFocus={focusInp} onBlur={blurInp} />
                </div>
              </div>
            </div>

            {/* Thesis */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>Your Thesis (optional)</div>
              <textarea value={thesis} onChange={e => setThesis(e.target.value)} placeholder="Briefly describe your trade idea. The AI will expand on it..." rows={4}
                style={{ ...inp, resize:'none', lineHeight:1.7 }} onFocus={focusInp} onBlur={blurInp} />
            </div>

            {/* Sections to include */}
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Plan Sections</div>
                <span style={{ fontSize:11, color:'var(--text-muted)' }}>{enabledSections.length} selected</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {sections.map(s => (
                  <button key={s.id} onClick={() => toggleSection(s.id)}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'1px solid '+(s.enabled?PURPLE:'var(--border)'), background: s.enabled?'rgba(79,70,229,0.08)':'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                    <span style={{ fontSize:13 }}>{s.icon}</span>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color: s.enabled?PURPLE:'var(--text-muted)' }}>{s.label}</span>
                    {s.enabled && <span style={{ marginLeft:'auto', fontSize:10, color:PURPLE }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button onClick={generatePlan} disabled={generating}
              style={{ width:'100%', padding:'13px', borderRadius:10, border:'none', backgroundColor: generating?'var(--surface2)':PURPLE, color: generating?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor: generating?'not-allowed':'pointer', transition:'all 0.15s' }}>
              {generating ? '⏳ Generating your plan...' : '✦ Generate Trade Plan'}
            </button>
            {error && <div style={{ padding:'10px 14px', background:'rgba(255,50,80,0.08)', border:'1px solid rgba(255,50,80,0.25)', borderRadius:8, fontSize:13, color:'var(--red)' }}>{error}</div>}
          </div>

          {/* Right — generated plan */}
          <div>
            {!generatedSections ? (
              <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
                <div style={{ fontSize:36, marginBottom:14 }}>✦</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Your plan will appear here</div>
                <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.7, maxWidth:300, margin:'0 auto' }}>
                  Fill in your setup on the left and click Generate. Every section is editable after generation.
                </div>
              </div>
            ) : (
              <div>
                {/* Plan header */}
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'16px 20px', marginBottom:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <input value={planName} onChange={e => setPlanName(e.target.value)}
                        style={{ ...inp, fontSize:15, fontWeight:700, padding:'6px 10px' }} onFocus={focusInp} onBlur={blurInp} />
                    </div>
                    <button onClick={savePlan}
                      style={{ padding:'8px 18px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                      Save to Library
                    </button>
                    <button onClick={() => setGeneratedSections(null)}
                      style={{ padding:'8px 14px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, cursor:'pointer' }}>
                      Discard
                    </button>
                  </div>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {[
                      { label: customAsset||asset,  color: PURPLE                                        },
                      { label: assetClass,           color: 'var(--text-muted)'                          },
                      { label: tradeType,            color: 'var(--text-muted)'                          },
                      { label: bias,                 color: biasColor                                    },
                      { label: timeframe,            color: 'var(--text-muted)'                          },
                    ].map(tag => (
                      <span key={tag.label} style={{ padding:'3px 10px', borderRadius:20, background:'var(--surface2)', border:'1px solid var(--border)', fontSize:11, fontWeight:600, color:tag.color }}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Editable sections */}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {enabledSections.map(s => (
                    <div key={s.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--surface2)', borderBottom: editingSection===s.id?'1px solid var(--border)':'none', cursor:'pointer' }}
                        onClick={() => setEditingSection(editingSection===s.id ? null : s.id)}>
                        <span style={{ fontSize:14 }}>{s.icon}</span>
                        <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)', flex:1 }}>{s.label}</span>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>{editingSection===s.id ? '▲' : '▼'}</span>
                      </div>
                      {editingSection === s.id ? (
                        <div style={{ padding:12 }}>
                          <textarea
                            value={generatedSections[s.id] || ''}
                            onChange={e => setGeneratedSections(prev => ({ ...prev, [s.id]: e.target.value }))}
                            rows={6}
                            style={{ ...inp, resize:'vertical', lineHeight:1.7, fontSize:13 }}
                            onFocus={focusInp} onBlur={blurInp}
                          />
                        </div>
                      ) : (
                        <div style={{ padding:'10px 14px' }}>
                          <p style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', lineHeight:1.7, margin:0 }}>
                            {generatedSections[s.id] || <span style={{ fontStyle:'italic' }}>No content generated</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LIBRARY VIEW ── */}
      {view === 'library' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plans..."
              style={{ flex:1, minWidth:160, ...inp }} onFocus={focusInp} onBlur={blurInp} />
            <div style={{ display:'flex', gap:4 }}>
              {['All',...ASSET_CLASSES].map(ac => (
                <button key={ac} onClick={() => setFilterClass(ac)}
                  style={{ padding:'5px 12px', borderRadius:20, border:'1px solid '+(filterClass===ac?PURPLE:'var(--border)'), background: filterClass===ac?PURPLE:'transparent', color: filterClass===ac?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  {ac}
                </button>
              ))}
            </div>
          </div>

          {filteredPlans.length === 0 ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No plans yet</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>Generate and save your first trade plan in the Builder.</div>
              <button onClick={() => setView('builder')}
                style={{ padding:'8px 20px', borderRadius:8, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Go to Builder
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filteredPlans.map(p => (
                <div key={p.id} style={{ background:'var(--surface)', border:'1px solid '+(selectedPlan?.id===p.id?PURPLE:'var(--border)'), borderRadius:12, overflow:'hidden', transition:'border-color 0.15s' }}>
                  <div onClick={() => setSelectedPlan(selectedPlan?.id===p.id ? null : p)}
                    style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        {[p.assetClass, p.tradeType, p.timeframe].map(tag => (
                          <span key={tag} style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', background:'var(--surface2)', border:'1px solid var(--border)', padding:'1px 7px', borderRadius:20 }}>{tag}</span>
                        ))}
                        <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, color: p.bias==='Bullish'?'var(--green)':p.bias==='Bearish'?'var(--red)':'#f59e0b', background:'var(--surface2)', border:'1px solid var(--border)', padding:'1px 7px', borderRadius:20 }}>{p.bias}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                    <button onClick={e => { e.stopPropagation(); deletePlan(p.id); }}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, padding:'0 4px' }}
                      onMouseEnter={e => e.currentTarget.style.color='var(--red)'}
                      onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>×</button>
                  </div>

                  {selectedPlan?.id === p.id && (
                    <div style={{ borderTop:'1px solid var(--border)', padding:'14px 18px' }}>
                      {p.entryZone && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
                          {[['Entry Zone',p.entryZone,PURPLE],['Stop Zone',p.stopZone,'var(--red)'],['Target Zone',p.targetZone,'var(--green)']].filter(x=>x[1]).map(([l,v,c])=>(
                            <div key={l} style={{ background:'var(--surface2)', borderRadius:8, padding:'8px 12px' }}>
                              <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>{l}</div>
                              <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:c }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {p.sections?.map(s => s.content && (
                        <div key={s.id} style={{ marginBottom:10 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{s.icon} {s.label}</div>
                          <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7 }}>{s.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TEMPLATE VIEW ── */}
      {view === 'template' && (
        <div style={{ maxWidth:600 }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'20px 24px', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:6 }}>Plan Template</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20, lineHeight:1.6 }}>
              Choose which sections appear in your plans by default. Save as your template so every new plan starts with your preferred structure.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:20 }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => toggleSection(s.id)}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, border:'1px solid '+(s.enabled?PURPLE:'var(--border)'), background: s.enabled?'rgba(79,70,229,0.08)':'var(--surface2)', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                  <span style={{ fontSize:16 }}>{s.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color: s.enabled?PURPLE:'var(--text)' }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:1 }}>{s.enabled ? 'Included' : 'Not included'}</div>
                  </div>
                  <div style={{ width:18, height:18, borderRadius:4, border:'1px solid '+(s.enabled?PURPLE:'var(--border)'), background: s.enabled?PURPLE:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {s.enabled && <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>✓</span>}
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={saveAsTemplate}
                style={{ flex:2, padding:'10px', borderRadius:10, border:'none', backgroundColor:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                Save as My Template
              </button>
              <button onClick={resetTemplate}
                style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer' }}>
                Reset to Default
              </button>
            </div>
          </div>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Tips</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                'Day traders: focus on Entry Criteria, Key Levels, and Checklist',
                'Swing traders: include Market Context, COT Analysis, and Seasonal Bias',
                'Position traders: include all fundamental sections',
                'Scalpers: keep it minimal — Entry, Stop, and Checklist only',
              ].map(tip => (
                <div key={tip} style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', display:'flex', gap:8, alignItems:'flex-start' }}>
                  <span style={{ color:PURPLE, flexShrink:0 }}>→</span>{tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
