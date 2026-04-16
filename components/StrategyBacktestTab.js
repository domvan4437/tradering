'use client'
import { useState } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',
  font:'var(--font)',mono:'var(--font-mono)',
}

// ── Asset library ─────────────────────────────────────────────────
const ASSET_GROUPS = {
  'Commodities': [
    { label:'Gold',         symbol:'GC=F'  },{ label:'Silver',      symbol:'SI=F'  },
    { label:'Crude Oil',    symbol:'CL=F'  },{ label:'Natural Gas', symbol:'NG=F'  },
    { label:'Corn',         symbol:'ZC=F'  },{ label:'Wheat',       symbol:'ZW=F'  },
    { label:'Soybeans',     symbol:'ZS=F'  },{ label:'Coffee',      symbol:'KC=F'  },
    { label:'Sugar',        symbol:'SB=F'  },{ label:'Cotton',      symbol:'CT=F'  },
    { label:'Copper',       symbol:'HG=F'  },{ label:'Platinum',    symbol:'PL=F'  },
  ],
  'Futures / Indices': [
    { label:'S&P 500 (ES)', symbol:'ES=F'  },{ label:'Nasdaq (NQ)', symbol:'NQ=F'  },
    { label:'Dow Jones',    symbol:'YM=F'  },{ label:'Russell 2000',symbol:'RTY=F' },
    { label:'10Y Treasury', symbol:'ZN=F'  },{ label:'30Y Bond',    symbol:'ZB=F'  },
  ],
  'Forex': [
    { label:'EUR/USD',      symbol:'EURUSD=X'},{ label:'GBP/USD',   symbol:'GBPUSD=X'},
    { label:'USD/JPY',      symbol:'JPY=X'   },{ label:'AUD/USD',   symbol:'AUDUSD=X'},
    { label:'USD/CAD',      symbol:'CAD=X'   },{ label:'USD/CHF',   symbol:'CHF=X'   },
  ],
  'Stocks': [
    { label:'Apple (AAPL)', symbol:'AAPL' },{ label:'NVIDIA (NVDA)',symbol:'NVDA' },
    { label:'Microsoft',    symbol:'MSFT' },{ label:'Amazon',       symbol:'AMZN' },
    { label:'Tesla',        symbol:'TSLA' },{ label:'S&P ETF (SPY)',symbol:'SPY'  },
    { label:'Gold ETF (GLD)',symbol:'GLD' },{ label:'Oil ETF (USO)', symbol:'USO' },
  ],
}

const CONDITION_TYPES = [
  { value:'price_vs_sma50',    label:'Price vs 50-day MA',        hasOperator:true,  hasValue:false, operatorOptions:['above','below'] },
  { value:'price_vs_sma200',   label:'Price vs 200-day MA',       hasOperator:true,  hasValue:false, operatorOptions:['above','below'] },
  { value:'price_change_pct',  label:'Price change % (N days)',   hasOperator:true,  hasValue:true,  hasPeriod:true, operatorOptions:['above','below'], placeholder:'e.g. 2', periodPlaceholder:'days' },
  { value:'month_is',          label:'Month of year',             hasOperator:false, hasValue:true,  placeholder:'0=Jan,1=Feb...11=Dec' },
  { value:'day_of_week',       label:'Day of week',               hasOperator:false, hasValue:true,  placeholder:'1=Mon,2=Tue...5=Fri' },
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parseAnalysisSections(text) {
  const defs = [
    { title:'Overall Assessment',       icon:'📊' },
    { title:"What's Working",           icon:'✅' },
    { title:"What's Not Working",       icon:'⚠️' },
    { title:'Risk Profile',             icon:'🛡' },
    { title:'Optimization Suggestions', icon:'⚡' },
    { title:'Live Trading Readiness',   icon:'🚀' },
  ]
  return defs.map(({ title, icon }) => {
    const marker = '**' + title + '**'
    const idx = text.indexOf(marker)
    if (idx === -1) return null
    const start = idx + marker.length
    const nextIdx = text.indexOf('\n**', start)
    const content = (nextIdx === -1 ? text.slice(start) : text.slice(start, nextIdx)).trim()
    return content ? { title, icon, content } : null
  }).filter(Boolean)
}

function StatBox({ label, value, sub, color, bg }) {
  return (
    <div style={{ background: bg || C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'14px 16px' }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:color||C.text, fontFamily:C.mono }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.dim, marginTop:3 }}>{sub}</div>}
    </div>
  )
}

export default function StrategyBacktestTab() {
  const [assetGroup, setAssetGroup] = useState('Commodities')
  const [selectedAsset, setSelectedAsset] = useState(ASSET_GROUPS['Commodities'][0])
  const [customSymbol, setCustomSymbol] = useState('')
  const [direction, setDirection] = useState('LONG')
  const [conditions, setConditions] = useState([{ type:'price_vs_sma50', operator:'above', value:'', period:'5' }])
  const [stopPct, setStopPct] = useState('3')
  const [targetPct, setTargetPct] = useState('6')
  const [holdingDays, setHoldingDays] = useState('30')
  const [years, setYears] = useState('3')
  const [strategyName, setStrategyName] = useState('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const addCondition = () => setConditions(prev => [...prev, { type:'price_vs_sma50', operator:'above', value:'', period:'5' }])
  const removeCondition = (i) => setConditions(prev => prev.filter((_,idx) => idx !== i))
  const updateCondition = (i, field, val) => setConditions(prev => prev.map((c,idx) => idx===i ? {...c,[field]:val} : c))

  const runBacktest = async () => {
    setRunning(true); setError(''); setResults(null)
    const symbol = customSymbol.trim() || selectedAsset.symbol
    const name = strategyName || `${direction} ${selectedAsset.label}`
    try {
      const res = await fetch('/api/strategy-backtest/run', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ asset:assetGroup, symbol, direction, conditions, stopPct, targetPct, holdingDays, years:parseInt(years), name })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setRunning(false); return }
      setResults(data)
      setActiveTab('overview')
    } catch (e) { setError('Connection error. Please try again.') }
    setRunning(false)
  }

  const condDef = (type) => CONDITION_TYPES.find(c => c.value === type)
  const rr = parseFloat(targetPct) / parseFloat(stopPct)

  // Equity curve mini-chart
  const renderEquityCurve = (curve) => {
    if (!curve?.length) return null
    const vals = curve.map(c => c.equity)
    const min = Math.min(...vals), max = Math.max(...vals)
    const range = max - min || 1
    const w = 600, h = 120
    const pts = vals.map((v, i) => `${(i / (vals.length-1)) * w},${h - ((v - min) / range) * h}`)
    const final = vals[vals.length-1]
    return (
      <div style={{ background:C.surface2, borderRadius:'var(--radius-sm)', padding:16, marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.text }}>Equity Curve</span>
          <span style={{ fontSize:12, color:final>=0?C.green:C.red, fontWeight:600 }}>{final>=0?'+':''}{final?.toFixed(1)}% total</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:100 }}>
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={final>=0?'#059669':'#dc2626'} stopOpacity="0.3"/>
              <stop offset="100%" stopColor={final>=0?'#059669':'#dc2626'} stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polyline fill="none" stroke={final>=0?C.green:C.red} strokeWidth="2" points={pts.join(' ')} />
          <polygon fill="url(#eq)" points={`0,${h} ${pts.join(' ')} ${w},${h}`} />
          <line x1="0" y1={h - ((0-min)/range)*h} x2={w} y2={h - ((0-min)/range)*h} stroke={C.border} strokeWidth="1" strokeDasharray="4"/>
        </svg>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 8px' }}>Strategy <span style={{ color:C.gold }}>Backtester</span></h2>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>Build a strategy using conditions, run it against years of real price data, and get a full professional analysis — automatically.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: results ? '380px 1fr' : '1fr', gap:24, alignItems:'start' }}>
        {/* ── Strategy Builder ── */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:`1px solid ${C.border}`, background:C.surface2 }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Strategy Builder</div>
          </div>
          <div style={{ padding:18, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Name */}
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Strategy Name</label>
              <input value={strategyName} onChange={e=>setStrategyName(e.target.value)} placeholder="e.g. Gold COT Reversal" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
            </div>

            {/* Asset Group */}
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Asset Class</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {Object.keys(ASSET_GROUPS).map(g => (
                  <button key={g} onClick={()=>{setAssetGroup(g);setSelectedAsset(ASSET_GROUPS[g][0])}} style={{ background:assetGroup===g?C.accent:C.surface2, color:assetGroup===g?'#fff':C.muted, border:`1px solid ${assetGroup===g?C.accent:C.border}`, padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>{g}</button>
                ))}
              </div>
            </div>

            {/* Asset Select */}
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Asset</label>
              <select value={selectedAsset.symbol} onChange={e=>{const a=ASSET_GROUPS[assetGroup].find(x=>x.symbol===e.target.value);if(a)setSelectedAsset(a)}} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
                {ASSET_GROUPS[assetGroup].map(a => <option key={a.symbol} value={a.symbol}>{a.label}</option>)}
              </select>
              <input value={customSymbol} onChange={e=>setCustomSymbol(e.target.value.toUpperCase())} placeholder="Or type any symbol: AAPL, BTC-USD..." style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'7px 10px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, outline:'none', marginTop:6, boxSizing:'border-box' }} />
            </div>

            {/* Direction */}
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Direction</label>
              <div style={{ display:'flex', gap:8 }}>
                {['LONG','SHORT'].map(d => (
                  <button key={d} onClick={()=>setDirection(d)} style={{ flex:1, background:direction===d?(d==='LONG'?C.green:C.red):C.surface2, color:direction===d?'#fff':C.muted, border:`1px solid ${direction===d?(d==='LONG'?C.green:C.red):C.border}`, padding:'8px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>{d==='LONG'?'▲ Long':'▼ Short'}</button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase' }}>Entry Conditions</label>
                <button onClick={addCondition} style={{ background:'transparent', color:C.accent, border:`1px solid ${C.accent}`, padding:'3px 10px', borderRadius:99, fontSize:11, cursor:'pointer', fontFamily:C.font }}>+ Add</button>
              </div>
              {conditions.map((cond, i) => {
                const def = condDef(cond.type)
                return (
                  <div key={i} style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:12, marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:11, fontWeight:600, color:C.muted }}>Condition {i+1}</span>
                      {conditions.length > 1 && <button onClick={()=>removeCondition(i)} style={{ background:'transparent', color:C.red, border:'none', fontSize:14, cursor:'pointer' }}>×</button>}
                    </div>
                    <select value={cond.type} onChange={e=>updateCondition(i,'type',e.target.value)} style={{ width:'100%', background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 8px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, marginBottom:6 }}>
                      {CONDITION_TYPES.map(ct => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
                    </select>
                    <div style={{ display:'flex', gap:6 }}>
                      {def?.hasOperator && (
                        <select value={cond.operator} onChange={e=>updateCondition(i,'operator',e.target.value)} style={{ flex:1, background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 8px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font }}>
                          {def.operatorOptions.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      )}
                      {def?.hasValue && (
                        <input value={cond.value} onChange={e=>updateCondition(i,'value',e.target.value)} placeholder={def.placeholder||'value'} style={{ flex:1, background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 8px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, outline:'none' }} />
                      )}
                      {def?.hasPeriod && (
                        <input value={cond.period} onChange={e=>updateCondition(i,'period',e.target.value)} placeholder="days" style={{ width:60, background:C.surface, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 8px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, outline:'none' }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Risk params */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Stop Loss %', stopPct, setStopPct],['Target %', targetPct, setTargetPct]].map(([label, val, setter]) => (
                <div key={label}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>{label}</label>
                  <input type="number" value={val} onChange={e=>setter(e.target.value)} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              {[['Max Hold (days)', holdingDays, setHoldingDays],['Lookback (years)', years, setYears]].map(([label, val, setter]) => (
                <div key={label}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>{label}</label>
                  <input type="number" value={val} onChange={e=>setter(e.target.value)} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
            </div>

            {/* R/R preview */}
            <div style={{ background:C.surface2, borderRadius:'var(--radius-sm)', padding:'10px 14px', display:'flex', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ color:C.muted }}>Risk/Reward Ratio</span>
              <span style={{ color:rr>=2?C.green:rr>=1?C.gold:C.red, fontWeight:700 }}>1 : {rr.toFixed(1)}</span>
            </div>

            {error && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:'var(--radius-sm)', padding:'10px 14px', color:C.red, fontSize:12 }}>⚠️ {error}</div>}

            <button onClick={runBacktest} disabled={running} style={{ background:running?C.surface2:C.accent, color:running?C.muted:'#fff', border:'none', padding:'12px', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:700, cursor:running?'not-allowed':'pointer', fontFamily:C.font, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {running ? <><span style={{ width:14, height:14, border:`2px solid ${C.muted}`, borderTopColor:C.accent, borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} /> Running Backtest...</> : '▶ Run Backtest'}
            </button>
          </div>
        </div>

        {/* ── Results Panel ── */}
        {results && (
          <div>
            {/* Result tabs */}
            <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
              {['overview','monthly','yearly','trades','analysis'].map(t => (
                <button key={t} onClick={()=>setActiveTab(t)} style={{ background:'transparent', color:activeTab===t?C.accent:C.muted, border:'none', borderBottom:activeTab===t?`2px solid ${C.accent}`:'2px solid transparent', padding:'8px 16px', fontSize:12, fontWeight:activeTab===t?600:400, cursor:'pointer', fontFamily:C.font, textTransform:'capitalize' }}>{t}</button>
              ))}
            </div>

            {activeTab==='overview' && (
              <div>
                <div style={{ fontSize:12, color:C.dim, marginBottom:16 }}>
                  {results.priceDataPoints} data points · {results.dateRange?.from} → {results.dateRange?.to} · {results.totalTrades} trades generated
                </div>

                {/* Key stats grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:20 }}>
                  <StatBox label="Total Trades" value={results.stats.totalTrades} />
                  <StatBox label="Win Rate" value={`${results.stats.winRate}%`} sub={`${results.stats.wins}W / ${results.stats.losses}L`} color={results.stats.winRate>=50?C.green:C.red} bg={results.stats.winRate>=50?'var(--green-bg)':undefined} />
                  <StatBox label="Profit Factor" value={results.stats.profitFactor||'—'} sub="wins÷losses" color={results.stats.profitFactor>=1.5?C.green:results.stats.profitFactor<1?C.red:C.gold} />
                  <StatBox label="Total Return" value={`${results.stats.totalReturn>0?'+':''}${results.stats.totalReturn}%`} color={results.stats.totalReturn>0?C.green:C.red} />
                  <StatBox label="Max Drawdown" value={`-${results.stats.maxDrawdown}%`} color={C.red} />
                  <StatBox label="Avg Hold" value={`${results.stats.avgHoldDays}d`} />
                  <StatBox label="Avg Win" value={`+${results.stats.avgWin}%`} color={C.green} />
                  <StatBox label="Avg Loss" value={`${results.stats.avgLoss}%`} color={C.red} />
                  <StatBox label="Best Trade" value={`+${results.stats.maxWin}%`} color={C.green} />
                  <StatBox label="Worst Trade" value={`${results.stats.maxLoss}%`} color={C.red} />
                  <StatBox label="Max Consec W" value={results.stats.maxConsecWins} color={C.green} />
                  <StatBox label="Max Consec L" value={results.stats.maxConsecLosses} color={C.red} />
                </div>

                {renderEquityCurve(results.stats.equityCurve)}

                {/* Exit breakdown */}
                {results.stats.byExit && (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:16 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:12 }}>Exit Breakdown</div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                      {Object.entries(results.stats.byExit).map(([reason, count]) => (
                        <div key={reason} style={{ background:C.surface2, borderRadius:6, padding:'8px 14px', textAlign:'center' }}>
                          <div style={{ fontSize:18, fontWeight:700, color:reason==='Target Hit'?C.green:reason==='Stop Hit'?C.red:C.muted, fontFamily:C.mono }}>{count}</div>
                          <div style={{ fontSize:11, color:C.muted }}>{reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab==='monthly' && (
              <div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                    {['Month','Trades','Win Rate','Total P&L','Best/Worst'].map(h => <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>)}
                  </div>
                  {MONTHS.map((name, idx) => {
                    const m = results.stats.byMonth[idx]
                    if (!m) return null
                    const total = m.wins + m.losses
                    const wr = total ? Math.round((m.wins/total)*100) : 0
                    return (
                      <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr', padding:'11px 16px', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{name}</div>
                        <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{total}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:wr>=50?C.green:C.red, fontFamily:C.mono }}>{wr}%</div>
                        <div style={{ fontSize:13, fontWeight:600, color:m.pnl>=0?C.green:C.red, fontFamily:C.mono }}>{m.pnl>=0?'+':''}{m.pnl.toFixed(1)}%</div>
                        <div style={{ width:`${Math.min(Math.abs(m.pnl/3)*10,100)}%`, height:8, background:m.pnl>=0?C.green:C.red, borderRadius:4, opacity:0.7 }} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab==='yearly' && (
              <div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                    {['Year','Trades','Win Rate','Total P&L'].map(h => <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>)}
                  </div>
                  {Object.entries(results.stats.byYear).sort((a,b)=>parseInt(b[0])-parseInt(a[0])).map(([year, d]) => {
                    const wr = d.trades ? Math.round((d.wins/d.trades)*100) : 0
                    return (
                      <div key={year} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', padding:'13px 16px', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{year}</div>
                        <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{d.trades}</div>
                        <div style={{ fontSize:13, fontWeight:600, color:wr>=50?C.green:C.red }}>{wr}%</div>
                        <div style={{ background:d.pnl>=0?'var(--green-bg)':'var(--red-bg)', color:d.pnl>=0?C.green:C.red, padding:'4px 10px', borderRadius:99, fontSize:13, fontWeight:700, width:'fit-content', fontFamily:C.mono }}>{d.pnl>=0?'+':''}{d.pnl.toFixed(1)}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab==='trades' && (
              <div>
                <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                    {['Entry','Exit','Entry $','Exit $','P&L','Exit Reason'].map(h => <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>)}
                  </div>
                  <div style={{ maxHeight:500, overflowY:'auto' }}>
                    {results.trades.map((t, i) => (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 16px', borderBottom:`1px solid ${C.border}`, alignItems:'center' }}>
                        <div style={{ fontSize:12, color:C.muted }}>{t.entryDate}</div>
                        <div style={{ fontSize:12, color:C.muted }}>{t.exitDate}</div>
                        <div style={{ fontSize:12, fontFamily:C.mono }}>{t.entryPrice?.toFixed(2)}</div>
                        <div style={{ fontSize:12, fontFamily:C.mono }}>{t.exitPrice?.toFixed(2)}</div>
                        <div style={{ background:t.win?'var(--green-bg)':'var(--red-bg)', color:t.win?C.green:C.red, padding:'3px 8px', borderRadius:99, fontSize:12, fontWeight:700, width:'fit-content', fontFamily:C.mono }}>{t.pnlPct>0?'+':''}{t.pnlPct}%</div>
                        <div style={{ fontSize:11, color:t.exitReason==='Target Hit'?C.green:t.exitReason==='Stop Hit'?C.red:C.muted }}>{t.exitReason}</div>
                      </div>
                    ))}
                  </div>
                  {results.totalTrades > 100 && <div style={{ padding:'10px 16px', fontSize:11, color:C.dim, textAlign:'center' }}>Showing first 100 of {results.totalTrades} trades</div>}
                </div>
              </div>
            )}

            {activeTab==='analysis' && (
              <div>
                {!results.aiAnalysis ? (
                  <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:32, textAlign:'center', color:C.muted }}>AI analysis not available — check API key.</div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {parseAnalysisSections(results.aiAnalysis).map((s,i) => (
                      <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:18, gridColumn:(s.title==='Overall Assessment'||s.title==='Optimization Suggestions')?'1/-1':'auto' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                          <span style={{ fontSize:18 }}>{s.icon}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:C.text, textTransform:'uppercase', letterSpacing:0.5 }}>{s.title}</span>
                        </div>
                        <p style={{ fontSize:13, color:C.muted, margin:0, lineHeight:1.8, whiteSpace:'pre-wrap' }}>{s.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
