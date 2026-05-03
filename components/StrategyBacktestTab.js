'use client'
import { useState, useMemo } from 'react'

const PURPLE = '#4f46e5';

const ASSET_GROUPS = {
  'Commodities': [
    { label:'Gold',         symbol:'GC=F'  },{ label:'Silver',      symbol:'SI=F'  },
    { label:'Crude Oil',    symbol:'CL=F'  },{ label:'Natural Gas', symbol:'NG=F'  },
    { label:'Corn',         symbol:'ZC=F'  },{ label:'Wheat',       symbol:'ZW=F'  },
    { label:'Soybeans',     symbol:'ZS=F'  },{ label:'Coffee',      symbol:'KC=F'  },
    { label:'Sugar',        symbol:'SB=F'  },{ label:'Cotton',      symbol:'CT=F'  },
    { label:'Copper',       symbol:'HG=F'  },{ label:'Platinum',    symbol:'PL=F'  },
  ],
  'Futures': [
    { label:'S&P 500 (ES)', symbol:'ES=F'  },{ label:'Nasdaq (NQ)', symbol:'NQ=F'  },
    { label:'Dow Jones',    symbol:'YM=F'  },{ label:'Russell 2000',symbol:'RTY=F' },
    { label:'10Y Treasury', symbol:'ZN=F'  },{ label:'30Y Bond',    symbol:'ZB=F'  },
  ],
  'Forex': [
    { label:'EUR/USD',  symbol:'EURUSD=X'},{ label:'GBP/USD', symbol:'GBPUSD=X'},
    { label:'USD/JPY',  symbol:'JPY=X'   },{ label:'AUD/USD', symbol:'AUDUSD=X'},
    { label:'USD/CAD',  symbol:'CAD=X'   },{ label:'USD/CHF', symbol:'CHF=X'   },
  ],
  'Stocks': [
    { label:'Apple',    symbol:'AAPL'},{ label:'NVIDIA',   symbol:'NVDA'},
    { label:'Microsoft',symbol:'MSFT'},{ label:'Amazon',   symbol:'AMZN'},
    { label:'Tesla',    symbol:'TSLA'},{ label:'SPY ETF',  symbol:'SPY' },
    { label:'Gold ETF', symbol:'GLD' },{ label:'Oil ETF',  symbol:'USO' },
  ],
  'Crypto': [
    { label:'Bitcoin',  symbol:'BTC-USD'},{ label:'Ethereum',symbol:'ETH-USD'},
    { label:'Solana',   symbol:'SOL-USD'},{ label:'BNB',     symbol:'BNB-USD'},
  ],
};

const CONDITION_TYPES = [
  { value:'price_vs_sma50',   label:'Price vs 50-day MA',      hasOperator:true,  hasValue:false, ops:['above','below'] },
  { value:'price_vs_sma200',  label:'Price vs 200-day MA',     hasOperator:true,  hasValue:false, ops:['above','below'] },
  { value:'sma50_vs_sma200',  label:'50 MA vs 200 MA (Cross)', hasOperator:true,  hasValue:false, ops:['above','below'] },
  { value:'price_change_pct', label:'Price change % (N days)', hasOperator:true,  hasValue:true,  hasPeriod:true, ops:['above','below'], placeholder:'e.g. 2', periodPlaceholder:'days' },
  { value:'rsi',              label:'RSI (14)',                 hasOperator:true,  hasValue:true,  ops:['above','below'], placeholder:'e.g. 50' },
  { value:'rsi_oversold',     label:'RSI Oversold (< 30)',     hasOperator:false, hasValue:false },
  { value:'rsi_overbought',   label:'RSI Overbought (> 70)',   hasOperator:false, hasValue:false },
  { value:'volume_spike',     label:'Volume spike (N× avg)',   hasOperator:false, hasValue:true,  placeholder:'e.g. 1.5' },
  { value:'near_52w_high',    label:'Near 52-week high (%)',   hasOperator:false, hasValue:true,  placeholder:'e.g. 5 (within 5%)' },
  { value:'near_52w_low',     label:'Near 52-week low (%)',    hasOperator:false, hasValue:true,  placeholder:'e.g. 5 (within 5%)' },
  { value:'month_is',         label:'Month of year',           hasOperator:false, hasValue:true,  placeholder:'1=Jan ... 12=Dec' },
  { value:'day_of_week',      label:'Day of week',             hasOperator:false, hasValue:true,  placeholder:'1=Mon ... 5=Fri' },
  { value:'price_above_value',label:'Price above level',       hasOperator:false, hasValue:true,  placeholder:'e.g. 2000' },
  { value:'price_below_value',label:'Price below level',       hasOperator:false, hasValue:true,  placeholder:'e.g. 2000' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function loadSaved() { try { return JSON.parse(localStorage.getItem('tr_strategies_v2')||'[]'); } catch { return []; } }
function saveSaved(s) { try { localStorage.setItem('tr_strategies_v2', JSON.stringify(s)); } catch {} }

function StatBox({ label, value, sub, color, highlight }) {
  return (
    <div style={{ background: highlight ? highlight+'18' : 'var(--surface)', border:'1px solid '+(highlight?highlight+'44':'var(--border)'), borderRadius:10, padding:'12px 14px' }}>
      <div style={{ fontSize:10, color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, color:color||'var(--text)', fontFamily:'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function EquityCurve({ curve, drawdown }) {
  if (!curve?.length) return null;
  const vals = curve.map(c => c.equity);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 800, H = 120, DH = 60;
  const pts = vals.map((v,i) => `${(i/(vals.length-1))*W},${H-((v-min)/range)*H}`);
  const final = vals[vals.length-1];
  const zeroY = H - ((0-min)/range)*H;

  // Drawdown curve
  const ddVals = drawdown || [];
  const ddMin = ddVals.length ? Math.min(...ddVals) : -20;
  const ddPts = ddVals.map((v,i) => `${(i/(ddVals.length-1))*W},${DH-((v-0)/(ddMin-0))*DH}`);

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:16, marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>Equity Curve</span>
        <div style={{ display:'flex', gap:16 }}>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>Start: 100%</span>
          <span style={{ fontSize:12, fontWeight:700, color: final>=0?'var(--green)':'var(--red)' }}>{final>=0?'+':''}{final?.toFixed(1)}% final</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', height:100, display:'block' }}>
        <defs>
          <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={final>=0?'#22c55e':'#ef4444'} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={final>=0?'#22c55e':'#ef4444'} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {zeroY > 0 && zeroY < H && <line x1="0" y1={zeroY} x2={W} y2={zeroY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4"/>}
        <polygon fill="url(#eqFill)" points={`0,${H} ${pts.join(' ')} ${W},${H}`}/>
        <polyline fill="none" stroke={final>=0?'#22c55e':'#ef4444'} strokeWidth="2.5" points={pts.join(' ')}/>
      </svg>
      {ddVals.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginTop:12, marginBottom:4 }}>Drawdown</div>
          <svg viewBox={`0 0 ${W} ${DH}`} style={{ width:'100%', height:50, display:'block' }}>
            <polygon fill="rgba(239,68,68,0.15)" points={`0,0 ${ddPts.join(' ')} ${W},0`}/>
            <polyline fill="none" stroke="#ef4444" strokeWidth="1.5" points={ddPts.join(' ')}/>
          </svg>
        </>
      )}
    </div>
  );
}

export default function StrategyBacktestTab() {
  const [assetGroup, setAssetGroup] = useState('Commodities');
  const [selectedAsset, setSelectedAsset] = useState(ASSET_GROUPS['Commodities'][0]);
  const [customSymbol, setCustomSymbol] = useState('');
  const [direction, setDirection] = useState('LONG');
  const [conditions, setConditions] = useState([{ type:'price_vs_sma50', operator:'above', value:'', period:'5' }]);
  const [stopPct, setStopPct] = useState('3');
  const [targetPct, setTargetPct] = useState('6');
  const [holdingDays, setHoldingDays] = useState('30');
  const [years, setYears] = useState('3');
  const [strategyName, setStrategyName] = useState('');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [savedStrategies, setSavedStrategies] = useState(() => loadSaved());
  const [showSaved, setShowSaved] = useState(false);
  const [loadingStrategy, setLoadingStrategy] = useState(null);

  const addCondition = () => setConditions(p => [...p, { type:'price_vs_sma50', operator:'above', value:'', period:'5' }]);
  const removeCondition = (i) => setConditions(p => p.filter((_,idx) => idx!==i));
  const updateCondition = (i, field, val) => setConditions(p => p.map((c,idx) => idx===i ? {...c,[field]:val} : c));
  const condDef = (type) => CONDITION_TYPES.find(c => c.value===type);

  const rr = parseFloat(targetPct) / parseFloat(stopPct);
  const expValue = useMemo(() => {
    if (!results) return null;
    const wr = results.stats.winRate / 100;
    const ev = (wr * parseFloat(results.stats.avgWin)) - ((1-wr) * Math.abs(parseFloat(results.stats.avgLoss)));
    return ev.toFixed(2);
  }, [results]);

  const saveStrategy = () => {
    const s = {
      id: Date.now()+'',
      name: strategyName || ((customSymbol||selectedAsset.label) + ' ' + direction),
      assetGroup, symbol: customSymbol||selectedAsset.symbol, assetLabel: customSymbol||selectedAsset.label,
      direction, conditions, stopPct, targetPct, holdingDays, years,
      savedAt: new Date().toISOString(),
      lastResult: results ? { winRate: results.stats.winRate, totalReturn: results.stats.totalReturn, trades: results.stats.totalTrades } : null,
    };
    const updated = [s, ...savedStrategies.filter(x=>x.id!==s.id)].slice(0,20);
    setSavedStrategies(updated);
    saveSaved(updated);
  };

  const loadStrategy = (s) => {
    setAssetGroup(s.assetGroup);
    const asset = ASSET_GROUPS[s.assetGroup]?.find(a=>a.symbol===s.symbol);
    if (asset) setSelectedAsset(asset);
    setCustomSymbol(s.customSymbol||'');
    setDirection(s.direction);
    setConditions(s.conditions);
    setStopPct(s.stopPct);
    setTargetPct(s.targetPct);
    setHoldingDays(s.holdingDays);
    setYears(s.years);
    setStrategyName(s.name);
    setShowSaved(false);
    setResults(null);
  };

  const deleteStrategy = (id) => {
    const updated = savedStrategies.filter(s=>s.id!==id);
    setSavedStrategies(updated);
    saveSaved(updated);
  };

  const runBacktest = async () => {
    setRunning(true); setError(''); setResults(null);
    const symbol = customSymbol.trim() || selectedAsset.symbol;
    const name = strategyName || (direction + ' ' + (customSymbol||selectedAsset.label));
    try {
      const res = await fetch('/api/strategy-backtest/run', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ asset:assetGroup, symbol, direction, conditions, stopPct, targetPct, holdingDays, years:parseInt(years), name })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setRunning(false); return; }
      setResults(data);
      setActiveTab('overview');
    } catch { setError('Connection error. Please try again.'); }
    setRunning(false);
  };

  const exportCSV = () => {
    if (!results?.trades) return;
    const header = 'Entry Date,Exit Date,Entry Price,Exit Price,P&L %,Exit Reason,Hold Days';
    const rows = results.trades.map(t =>
      [t.entryDate,t.exitDate,t.entryPrice?.toFixed(2),t.exitPrice?.toFixed(2),t.pnlPct,t.exitReason,t.holdDays||''].join(',')
    );
    const csv = [header,...rows].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download=(strategyName||'backtest')+'_trades.csv'; a.click();
  };

  const inp = { width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', padding:'8px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'var(--font)', boxSizing:'border-box', borderRadius:8, transition:'border-color 0.15s' };
  const focusInp = e => e.target.style.borderColor=PURPLE;
  const blurInp  = e => e.target.style.borderColor='var(--border)';

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Tools</div>
          <h2 style={{ fontSize:24, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Strategy Backtester</h2>
          <p style={{ fontSize:12, color:'var(--text-muted)', margin:0 }}>Build a strategy with conditions, run it against real price data, get professional analysis.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowSaved(s=>!s)}
            style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background: showSaved?PURPLE:'var(--surface2)', color: showSaved?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            💾 Saved ({savedStrategies.length})
          </button>
          {results && (
            <button onClick={exportCSV}
              style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              ↓ Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Saved strategies panel */}
      {showSaved && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Saved Strategies</div>
          {savedStrategies.length === 0 ? (
            <div style={{ fontSize:12, color:'var(--text-muted)', textAlign:'center', padding:'16px 0' }}>No saved strategies yet. Build one and click Save.</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {savedStrategies.map(s => (
                <div key={s.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:10, padding:'10px 14px', background:'var(--surface2)', borderRadius:8, alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{s.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{s.assetLabel} · {s.direction} · {s.conditions.length} condition{s.conditions.length!==1?'s':''}</div>
                  </div>
                  {s.lastResult && (
                    <>
                      <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color: s.lastResult.winRate>=50?'var(--green)':'var(--red)', fontWeight:700 }}>{s.lastResult.winRate}% WR</div>
                      <div style={{ fontSize:12, fontFamily:'var(--font-mono)', color: s.lastResult.totalReturn>=0?'var(--green)':'var(--red)', fontWeight:700 }}>{s.lastResult.totalReturn>=0?'+':''}{s.lastResult.totalReturn}%</div>
                    </>
                  )}
                  <button onClick={() => loadStrategy(s)}
                    style={{ padding:'5px 12px', borderRadius:6, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>Load</button>
                  <button onClick={() => deleteStrategy(s.id)}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18 }}
                    onMouseEnter={e=>e.currentTarget.style.color='var(--red)'}
                    onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main layout — always two column */}
      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:16, alignItems:'start' }}>

        {/* LEFT — Strategy Builder */}
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>Strategy Builder</div>
            <button onClick={saveStrategy}
              style={{ padding:'4px 12px', borderRadius:6, border:'none', background:PURPLE, color:'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
              Save
            </button>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:14 }}>

            {/* Name */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Strategy Name</div>
              <input value={strategyName} onChange={e=>setStrategyName(e.target.value)} placeholder="e.g. Gold SMA Cross Long" style={inp} onFocus={focusInp} onBlur={blurInp}/>
            </div>

            {/* Asset class pills */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Asset Class</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {Object.keys(ASSET_GROUPS).map(g => (
                  <button key={g} onClick={()=>{setAssetGroup(g);setSelectedAsset(ASSET_GROUPS[g][0]);}}
                    style={{ padding:'4px 12px', borderRadius:20, border:'1px solid '+(assetGroup===g?PURPLE:'var(--border)'), background:assetGroup===g?PURPLE:'transparent', color:assetGroup===g?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Asset + custom */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:6 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Asset</div>
                <select value={selectedAsset.symbol} onChange={e=>{const a=ASSET_GROUPS[assetGroup].find(x=>x.symbol===e.target.value);if(a){setSelectedAsset(a);setCustomSymbol('');}}} style={{ ...inp, cursor:'pointer' }} onFocus={focusInp} onBlur={blurInp}>
                  {ASSET_GROUPS[assetGroup].map(a => <option key={a.symbol} value={a.symbol}>{a.label}</option>)}
                </select>
              </div>
              <input value={customSymbol} onChange={e=>setCustomSymbol(e.target.value.toUpperCase())} placeholder="Or type any symbol: AAPL, BTC-USD..." style={inp} onFocus={focusInp} onBlur={blurInp}/>
            </div>

            {/* Direction */}
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Direction</div>
              <div style={{ display:'flex', gap:8 }}>
                {['LONG','SHORT'].map(d => (
                  <button key={d} onClick={()=>setDirection(d)}
                    style={{ flex:1, padding:'9px', borderRadius:8, border:'none', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', background:direction===d?(d==='LONG'?'var(--green)':'var(--red)'):'var(--surface2)', color:direction===d?'#fff':'var(--text-muted)' }}>
                    {d==='LONG'?'▲ Long':'▼ Short'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Entry Conditions</div>
                <button onClick={addCondition}
                  style={{ padding:'3px 10px', borderRadius:6, border:'1px solid '+PURPLE, background:'transparent', color:PURPLE, fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>+ Add</button>
              </div>
              {conditions.map((cond, i) => {
                const def = condDef(cond.type);
                return (
                  <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:10, marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:PURPLE, textTransform:'uppercase', letterSpacing:'0.06em' }}>Condition {i+1}</span>
                      {conditions.length > 1 && <button onClick={()=>removeCondition(i)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:16, cursor:'pointer' }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>}
                    </div>
                    <select value={cond.type} onChange={e=>updateCondition(i,'type',e.target.value)} style={{ ...inp, marginBottom:6, fontSize:12 }} onFocus={focusInp} onBlur={blurInp}>
                      {CONDITION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                    </select>
                    <div style={{ display:'flex', gap:6 }}>
                      {def?.hasOperator && (
                        <select value={cond.operator} onChange={e=>updateCondition(i,'operator',e.target.value)} style={{ ...inp, flex:1, fontSize:12 }} onFocus={focusInp} onBlur={blurInp}>
                          {def.ops.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {def?.hasValue && (
                        <input value={cond.value} onChange={e=>updateCondition(i,'value',e.target.value)} placeholder={def.placeholder||'value'} style={{ ...inp, flex:1, fontSize:12 }} onFocus={focusInp} onBlur={blurInp}/>
                      )}
                      {def?.hasPeriod && (
                        <input value={cond.period} onChange={e=>updateCondition(i,'period',e.target.value)} placeholder="days" style={{ ...inp, width:60, flex:'none', fontSize:12 }} onFocus={focusInp} onBlur={blurInp}/>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Risk params */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                ['Stop Loss %',    stopPct,     setStopPct,     '%'],
                ['Target %',       targetPct,   setTargetPct,   '%'],
                ['Max Hold (days)',holdingDays, setHoldingDays, 'd'],
                ['Lookback (yrs)', years,       setYears,       'yr'],
              ].map(([label, val, setter, unit]) => (
                <div key={label}>
                  <div style={{ fontSize:10, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>{label}</div>
                  <div style={{ position:'relative' }}>
                    <input type="number" value={val} onChange={e=>setter(e.target.value)} style={{ ...inp, paddingRight:24 }} onFocus={focusInp} onBlur={blurInp}/>
                    <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:'var(--text-muted)' }}>{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* R/R + expected value preview */}
            <div style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
                <span style={{ color:'var(--text-muted)' }}>Risk / Reward</span>
                <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:rr>=2?'var(--green)':rr>=1?'#f59e0b':'var(--red)' }}>1 : {rr.toFixed(1)}</span>
              </div>
              {expValue && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                  <span style={{ color:'var(--text-muted)' }}>Expected Value / trade</span>
                  <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, color:parseFloat(expValue)>=0?'var(--green)':'var(--red)' }}>{parseFloat(expValue)>=0?'+':''}{expValue}%</span>
                </div>
              )}
            </div>

            {error && <div style={{ padding:'10px 14px', background:'rgba(255,50,80,0.08)', border:'1px solid rgba(255,50,80,0.2)', borderRadius:8, color:'var(--red)', fontSize:12 }}>⚠️ {error}</div>}

            <button onClick={runBacktest} disabled={running}
              style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', backgroundColor:running?'var(--surface2)':PURPLE, color:running?'var(--text-muted)':'#fff', fontFamily:'var(--font)', fontSize:14, fontWeight:700, cursor:running?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {running ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }}/> Running...</> : '▶ Run Backtest'}
            </button>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div>
          {!results ? (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'60px 24px', textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:14 }}>📈</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:8 }}>Results will appear here</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', maxWidth:320, margin:'0 auto', lineHeight:1.7 }}>
                Configure your strategy on the left and click Run Backtest. You'll get full stats, an equity curve, monthly breakdown, every trade, and AI analysis.
              </div>
            </div>
          ) : (
            <div>
              {/* Result tabs */}
              <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:16 }}>
                {[
                  ['overview',  '📊 Overview'],
                  ['monthly',   '📅 Monthly'],
                  ['yearly',    '📆 Yearly'],
                  ['trades',    '📋 Trades'],
                  ['analysis',  '🤖 AI Analysis'],
                ].map(([t,label]) => (
                  <button key={t} onClick={()=>setActiveTab(t)}
                    style={{ background:'transparent', color:activeTab===t?PURPLE:'var(--text-muted)', border:'none', borderBottom:activeTab===t?`2px solid ${PURPLE}`:'2px solid transparent', padding:'8px 14px', fontSize:12, fontWeight:activeTab===t?700:400, cursor:'pointer', fontFamily:'var(--font)', whiteSpace:'nowrap' }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {activeTab==='overview' && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:14 }}>
                    {results.priceDataPoints} data points · {results.dateRange?.from} → {results.dateRange?.to} · {results.totalTrades} trades
                  </div>

                  {/* Benchmark comparison */}
                  {results.stats.benchmarkReturn !== undefined && (
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'10px 16px', marginBottom:14, display:'flex', gap:24, flexWrap:'wrap', alignItems:'center' }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>vs Buy & Hold</div>
                      <div>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Strategy: </span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:results.stats.totalReturn>=0?'var(--green)':'var(--red)' }}>{results.stats.totalReturn>=0?'+':''}{results.stats.totalReturn}%</span>
                      </div>
                      <div>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Buy & Hold: </span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:results.stats.benchmarkReturn>=0?'var(--green)':'var(--red)' }}>{results.stats.benchmarkReturn>=0?'+':''}{results.stats.benchmarkReturn}%</span>
                      </div>
                      <div>
                        <span style={{ fontSize:11, color:'var(--text-muted)' }}>Alpha: </span>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:(results.stats.totalReturn-results.stats.benchmarkReturn)>=0?'var(--green)':'var(--red)' }}>{(results.stats.totalReturn-results.stats.benchmarkReturn)>=0?'+':''}{(results.stats.totalReturn-results.stats.benchmarkReturn).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {/* Stats grid */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                    <StatBox label="Total Trades"  value={results.stats.totalTrades} sub={results.stats.wins+'W / '+results.stats.losses+'L'} />
                    <StatBox label="Win Rate"      value={results.stats.winRate+'%'} highlight={results.stats.winRate>=50?'#22c55e':'#ef4444'} color={results.stats.winRate>=50?'var(--green)':'var(--red)'} />
                    <StatBox label="Profit Factor" value={results.stats.profitFactor||'—'} color={results.stats.profitFactor>=1.5?'var(--green)':results.stats.profitFactor<1?'var(--red)':'#f59e0b'} sub="wins ÷ losses"/>
                    <StatBox label="Total Return"  value={(results.stats.totalReturn>=0?'+':'')+results.stats.totalReturn+'%'} color={results.stats.totalReturn>=0?'var(--green)':'var(--red)'} highlight={results.stats.totalReturn>=0?'#22c55e':'#ef4444'}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                    <StatBox label="Max Drawdown"  value={'-'+results.stats.maxDrawdown+'%'} color="var(--red)"/>
                    <StatBox label="Avg Hold"      value={results.stats.avgHoldDays+'d'}/>
                    <StatBox label="Avg Win"       value={'+'+results.stats.avgWin+'%'} color="var(--green)"/>
                    <StatBox label="Avg Loss"      value={results.stats.avgLoss+'%'} color="var(--red)"/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
                    <StatBox label="Best Trade"    value={'+'+results.stats.maxWin+'%'} color="var(--green)"/>
                    <StatBox label="Worst Trade"   value={results.stats.maxLoss+'%'} color="var(--red)"/>
                    <StatBox label="Max Win Streak" value={results.stats.maxConsecWins} color="var(--green)"/>
                    <StatBox label="Max Loss Streak" value={results.stats.maxConsecLosses} color="var(--red)"/>
                  </div>

                  {expValue && (
                    <div style={{ background:'var(--surface)', border:`1px solid ${parseFloat(expValue)>=0?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:10, padding:'10px 16px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Expected Value per Trade</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>Win Rate × Avg Win − Loss Rate × Avg Loss</div>
                      </div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:parseFloat(expValue)>=0?'var(--green)':'var(--red)' }}>{parseFloat(expValue)>=0?'+':''}{expValue}%</div>
                    </div>
                  )}

                  <EquityCurve curve={results.stats.equityCurve} drawdown={results.stats.drawdownCurve}/>

                  {/* Exit breakdown */}
                  {results.stats.byExit && (
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:12 }}>Exit Breakdown</div>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                        {Object.entries(results.stats.byExit).map(([reason, count]) => (
                          <div key={reason} style={{ background:'var(--surface2)', borderRadius:8, padding:'10px 16px', textAlign:'center', flex:1, minWidth:100 }}>
                            <div style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:reason==='Target Hit'?'var(--green)':reason==='Stop Hit'?'var(--red)':'var(--text-muted)' }}>{count}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Overfitting warning */}
                  <div style={{ marginTop:14, padding:'10px 14px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:10 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:'#f59e0b', marginBottom:3 }}>⚠️ Backtesting Disclaimer</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.6 }}>Past performance does not guarantee future results. Backtests can be subject to overfitting and survivorship bias. Always validate on out-of-sample data before live trading.</div>
                  </div>
                </div>
              )}

              {/* Monthly */}
              {activeTab==='monthly' && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'80px 70px 80px 100px 1fr', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                    {['Month','Trades','Win Rate','Total P&L','Performance'].map(h => (
                      <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
                    ))}
                  </div>
                  {MONTHS.map((name, idx) => {
                    const m = results.stats.byMonth?.[idx];
                    if (!m) return null;
                    const total = m.wins + m.losses;
                    const wr = total ? Math.round((m.wins/total)*100) : 0;
                    const barW = Math.min(Math.abs(m.pnl/3)*10, 100);
                    return (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'80px 70px 80px 100px 1fr', padding:'10px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{name}</div>
                        <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{total}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:wr>=50?'var(--green)':'var(--red)', fontFamily:'var(--font-mono)' }}>{wr}%</div>
                        <div style={{ fontSize:13, fontWeight:700, color:m.pnl>=0?'var(--green)':'var(--red)', fontFamily:'var(--font-mono)' }}>{m.pnl>=0?'+':''}{m.pnl.toFixed(1)}%</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ width:barW+'%', height:8, background:m.pnl>=0?'var(--green)':'var(--red)', borderRadius:4, opacity:0.7, minWidth:2 }}/>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Yearly */}
              {activeTab==='yearly' && (
                <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'80px 80px 90px 120px', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                    {['Year','Trades','Win Rate','Total P&L'].map(h => (
                      <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
                    ))}
                  </div>
                  {Object.entries(results.stats.byYear||{}).sort((a,b)=>parseInt(b[0])-parseInt(a[0])).map(([year, d]) => {
                    const wr = d.trades ? Math.round((d.wins/d.trades)*100) : 0;
                    return (
                      <div key={year} style={{ display:'grid', gridTemplateColumns:'80px 80px 90px 120px', padding:'12px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{year}</div>
                        <div style={{ fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>{d.trades}</div>
                        <div style={{ fontSize:13, fontWeight:700, color:wr>=50?'var(--green)':'var(--red)' }}>{wr}%</div>
                        <div style={{ display:'inline-flex', background:d.pnl>=0?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:d.pnl>=0?'var(--green)':'var(--red)', padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:700, fontFamily:'var(--font-mono)', width:'fit-content' }}>
                          {d.pnl>=0?'+':''}{d.pnl.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Trades */}
              {activeTab==='trades' && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{results.trades?.length} trades total</div>
                    <button onClick={exportCSV} style={{ padding:'5px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>↓ Export CSV</button>
                  </div>
                  <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'90px 90px 80px 80px 80px 100px', padding:'10px 16px', background:'var(--surface2)', borderBottom:'1px solid var(--border)' }}>
                      {['Entry','Exit','Entry $','Exit $','P&L','Exit Reason'].map(h => (
                        <div key={h} style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{h}</div>
                      ))}
                    </div>
                    <div style={{ maxHeight:500, overflowY:'auto' }}>
                      {results.trades?.map((t,i) => (
                        <div key={i} style={{ display:'grid', gridTemplateColumns:'90px 90px 80px 80px 80px 100px', padding:'9px 16px', borderBottom:'1px solid var(--border)', alignItems:'center' }}>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.entryDate}</div>
                          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.exitDate}</div>
                          <div style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{t.entryPrice?.toFixed(2)}</div>
                          <div style={{ fontSize:12, fontFamily:'var(--font-mono)' }}>{t.exitPrice?.toFixed(2)}</div>
                          <div style={{ display:'inline-flex', background:t.win?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', color:t.win?'var(--green)':'var(--red)', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, fontFamily:'var(--font-mono)', width:'fit-content' }}>
                            {t.pnlPct>0?'+':''}{t.pnlPct}%
                          </div>
                          <div style={{ fontSize:11, color:t.exitReason==='Target Hit'?'var(--green)':t.exitReason==='Stop Hit'?'var(--red)':'var(--text-muted)' }}>{t.exitReason}</div>
                        </div>
                      ))}
                    </div>
                    {results.totalTrades > 100 && <div style={{ padding:'10px 16px', fontSize:11, color:'var(--text-muted)', textAlign:'center' }}>Showing first 100 of {results.totalTrades} trades</div>}
                  </div>
                </div>
              )}

              {/* AI Analysis */}
              {activeTab==='analysis' && (
                <div>
                  {!results.aiAnalysis ? (
                    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'40px 24px', textAlign:'center' }}>
                      <div style={{ fontSize:32, marginBottom:12 }}>🤖</div>
                      <div style={{ fontSize:14, color:'var(--text-muted)' }}>AI analysis not available — check your API key.</div>
                    </div>
                  ) : (
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {results.aiAnalysis.split('\n\n').filter(p=>p.trim()).map((para, i) => (
                        <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px' }}>
                          <p style={{ fontSize:13, color:'var(--text-muted)', margin:0, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{para.replace(/\*\*/g,'')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
