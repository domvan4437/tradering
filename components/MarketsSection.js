'use client'
import { useState, useEffect, useCallback } from 'react'

const C = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border: 'var(--border)',
  border2: 'var(--border2)',
  accent: 'var(--accent)',
  accentLight: 'var(--accent-light)',
  gold: 'var(--accent)',
  text: 'var(--text)',
  muted: 'var(--text-muted)',
  dim: 'var(--text-dim)',
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  greenBorder: 'var(--green-border)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  redBorder: 'var(--red-border)',
  yellow: 'var(--yellow)',
  blue: 'var(--blue)',
  purple: 'var(--purple)',
  shadow: 'var(--shadow)',
  shadowMd: 'var(--shadow-md)',
  radius: 'var(--radius)',
  font: 'var(--font)',
  mono: 'var(--font-mono)',
}

const MARKET_TABS = ['Dashboard','COT (Financial)','Sectors','Options & VIX','Yield Curve','Earnings','Key Levels']

function Label({ children, style }) { return <p style={{ fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',...style }}>{children}</p> }
function Card({ children, style }) { return <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'18px 22px',...style }}>{children}</div> }

function Sparkline({ data, color, height=40 }) {
  if (!data?.length) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const w = 80, h = height
  const points = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/range)*h}`).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow:'visible' }}>
      <polyline points={points} fill="none" stroke={color||C.green} strokeWidth="1.5" />
    </svg>
  )
}

function ChangeTag({ value, suffix='%' }) {
  if (value == null) return null
  const n = parseFloat(value)
  const color = n > 0 ? C.green : n < 0 ? C.red : C.muted
  return <span style={{ fontSize:11,color,marginLeft:6 }}>{n>0?'+':''}{value}{suffix}</span>
}

function RegimeBadge({ regime }) {
  const color = regime==='RISK ON' ? C.green : regime==='RISK OFF' ? C.red : C.gold
  return <span style={{ fontSize:10,color,border:`1px solid ${color}`,padding:'3px 10px',letterSpacing:2 }}>{regime}</span>
}

export default function MarketsSection() {
  const [tab, setTab] = useState('Dashboard')
  return (
    <div>
      <div style={{ display:'flex',gap:2,flexWrap:'wrap',marginBottom:28 }}>
        {MARKET_TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ background:tab===t?C.blue:'transparent',color:tab===t?'#0a0a0a':C.muted,border:'none',padding:'6px 13px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font,textTransform:'uppercase' }}>{t}</button>
        ))}
      </div>
      {tab==='Dashboard'        && <DashboardTab />}
      {tab==='COT (Financial)'  && <FinancialCOTTab />}
      {tab==='Sectors'          && <SectorsTab />}
      {tab==='Options & VIX'    && <OptionsTab />}
      {tab==='Yield Curve'      && <YieldCurveTab />}
      {tab==='Earnings'         && <EarningsTab />}
      {tab==='Key Levels'       && <KeyLevelsTab />}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardTab() {
  const [data, setData] = useState(null)
  const [breadth, setBreadth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/markets/indices').then(r=>r.json()),
      fetch('/api/markets/breadth').then(r=>r.json()),
    ]).then(([idx, br]) => {
      setData(idx); setBreadth(br); setLoading(false)
    })
  }, [])

  if (loading) return <p style={{color:C.muted,fontSize:13}}>Loading market data...</p>

  const indices = ['ES=F','NQ=F','YM=F','RTY=F'].map(s=>data?.quotes?.[s]).filter(Boolean)
  const vix = data?.quotes?.['^VIX']
  const dxy = data?.quotes?.['DX-Y.NYB']
  const tny = data?.quotes?.['^TNX']

  const trendColor = t => t==='UPTREND'?C.green:t==='DOWNTREND'?C.red:C.gold

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Markets <span style={{ color:C.blue }}>Dashboard</span></h2>
        {data?.regime && <RegimeBadge regime={data.regime} />}
        <span style={{ fontSize:10,color:C.dim,marginLeft:'auto' }}>Updated {new Date(data?.updatedAt||Date.now()).toLocaleTimeString()}</span>
      </div>

      {/* Index futures grid */}
      <Label>INDEX FUTURES</Label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:10,marginBottom:28 }}>
        {indices.map(q=>(
          <Card key={q.symbol} style={{ borderColor: parseFloat(q.change1d)>=0?C.greenBorder:C.redBorder }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
              <div>
                <p style={{ fontSize:11,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>{q.short}</p>
                <p style={{ fontSize:22,fontWeight:300,margin:0 }}>{parseFloat(q.price).toLocaleString()}</p>
              </div>
              <Sparkline data={q.sparkline} color={parseFloat(q.change1d)>=0?C.green:C.red} height={36} />
            </div>
            <div style={{ display:'flex',gap:16,fontSize:11 }}>
              <span style={{ color:parseFloat(q.change1d)>=0?C.green:C.red }}>{q.change1d>0?'+':''}{q.change1d}% 1d</span>
              <span style={{ color:parseFloat(q.change5d)>=0?C.green:C.red }}>{q.change5d>0?'+':''}{q.change5d}% 5d</span>
            </div>
            <div style={{ marginTop:8,display:'flex',gap:8,flexWrap:'wrap' }}>
              <span style={{ fontSize:9,color:trendColor(q.trend),border:`1px solid ${trendColor(q.trend)}`,padding:'2px 7px',letterSpacing:1 }}>{q.trend}</span>
              <span style={{ fontSize:9,color:q.aboveMa20?C.green:C.red,border:`1px solid ${C.border2}`,padding:'2px 7px' }}>MA20: {q.aboveMa20?'▲':'▼'}</span>
              <span style={{ fontSize:9,color:q.aboveMa50?C.green:C.red,border:`1px solid ${C.border2}`,padding:'2px 7px' }}>MA50: {q.aboveMa50?'▲':'▼'}</span>
            </div>
            <p style={{ fontSize:10,color:C.dim,margin:'8px 0 0' }}>52w: {parseFloat(q.low52).toLocaleString()} — {parseFloat(q.high52).toLocaleString()} ({q.pctFrom52High}% from high)</p>
          </Card>
        ))}
      </div>

      {/* VIX + DXY + Rates row */}
      <Label>KEY MACRO LEVELS</Label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:28 }}>
        {vix && (
          <Card>
            <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>VIX</p>
            <p style={{ fontSize:24,fontWeight:300,color:parseFloat(vix.price)<20?C.green:parseFloat(vix.price)<30?C.gold:C.red,margin:'0 0 4px' }}>{vix.price}</p>
            <p style={{ fontSize:11,color:C.muted,margin:0 }}>{parseFloat(vix.price)<15?'COMPLACENT':parseFloat(vix.price)<20?'CALM':parseFloat(vix.price)<30?'ELEVATED':'FEAR MODE'}</p>
            <Sparkline data={vix.sparkline} color={C.red} height={30} />
          </Card>
        )}
        {dxy && (
          <Card>
            <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>DXY (Dollar Index)</p>
            <p style={{ fontSize:24,fontWeight:300,margin:'0 0 4px' }}>{dxy.price}</p>
            <span style={{ fontSize:10,color:trendColor(dxy.trend),border:`1px solid ${trendColor(dxy.trend)}`,padding:'2px 7px',letterSpacing:1 }}>{dxy.trend}</span>
            <p style={{ fontSize:11,color:C.muted,margin:'6px 0 0' }}>{parseFloat(dxy.change20d)>0?'+':''}{dxy.change20d}% 20d</p>
          </Card>
        )}
        {tny && (
          <Card>
            <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>10Y Treasury Yield</p>
            <p style={{ fontSize:24,fontWeight:300,margin:'0 0 4px' }}>{tny.price}%</p>
            <span style={{ fontSize:10,color:trendColor(tny.trend),border:`1px solid ${trendColor(tny.trend)}`,padding:'2px 7px',letterSpacing:1 }}>{tny.trend}</span>
            <p style={{ fontSize:11,color:C.muted,margin:'6px 0 0' }}>{parseFloat(tny.change20d)>0?'+':''}{tny.change20d}% 20d</p>
          </Card>
        )}
        {breadth?.fearGreed && (
          <Card>
            <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>Fear & Greed</p>
            <p style={{ fontSize:40,fontWeight:300,color:breadth.fearGreed.score>=65?C.red:breadth.fearGreed.score>=45?C.gold:C.green,margin:'0 0 4px',lineHeight:1 }}>{breadth.fearGreed.score}</p>
            <p style={{ fontSize:11,color:C.muted,margin:0 }}>{breadth.fearGreed.label}</p>
          </Card>
        )}
      </div>

      {/* Breadth indicators */}
      {breadth && (
        <>
          <Label>MARKET BREADTH</Label>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10 }}>
            {breadth.vix && (
              <Card>
                <Label>VIX DETAIL</Label>
                <p style={{ fontSize:13,color:C.text,margin:'0 0 4px' }}>Current: <span style={{ color:C.red }}>{breadth.vix.current}</span> | 20d avg: {breadth.vix.avg20}</p>
                <p style={{ fontSize:12,color:C.muted,margin:'0 0 8px' }}>6mo percentile: {breadth.vix.percentile6m}%</p>
                <Sparkline data={breadth.vix.sparkline} color={C.red} height={35} />
              </Card>
            )}
            {breadth.putCall && (
              <Card>
                <Label>PUT/CALL RATIO</Label>
                <p style={{ fontSize:22,fontWeight:300,color:parseFloat(breadth.putCall.total)>1.1?C.green:parseFloat(breadth.putCall.total)<0.75?C.red:C.gold,margin:'0 0 4px' }}>{breadth.putCall.total}</p>
                <p style={{ fontSize:12,color:C.muted,margin:'0 0 8px' }}>{breadth.putCall.signal}</p>
                <Sparkline data={breadth.putCall.sparkline} color={C.purple} height={35} />
              </Card>
            )}
            {breadth.breadth && (
              <Card>
                <Label>MARKET BREADTH (RSP/SPY)</Label>
                <p style={{ fontSize:13,color:breadth.breadth.expanding?C.green:C.red,margin:'0 0 8px' }}>{breadth.breadth.expanding?'↑ EXPANDING':'↓ NARROWING'}</p>
                <p style={{ fontSize:12,color:C.muted,margin:0,lineHeight:1.6 }}>{breadth.breadth.signal}</p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Financial COT Tab ────────────────────────────────────────────────────────
function FinancialCOTTab() {
  const [market, setMarket] = useState('ES')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const markets = [
    {sym:'ES',label:'S&P 500 (ES)'},
    {sym:'NQ',label:'Nasdaq (NQ)'},
    {sym:'YM',label:'Dow (YM)'},
    {sym:'RTY',label:'Russell (RTY)'},
    {sym:'ZN',label:'10Y T-Note (ZN)'},
    {sym:'ZB',label:'30Y T-Bond (ZB)'},
    {sym:'6E',label:'Euro (6E)'},
    {sym:'6J',label:'Yen (6J)'},
    {sym:'6B',label:'GBP (6B)'},
  ]

  const fetchData = useCallback(async (sym) => {
    setLoading(true); setError(null); setData(null)
    try {
      const res = await fetch(`/api/markets/financial-cot?market=${sym}`)
      const json = await res.json()
      if (json.error) setError(json.error); else setData(json)
    } catch { setError('Failed to fetch') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData(market) }, [market])

  const cotColor = idx => idx>=70?C.green:idx>=55?'#8bc34a':idx>=40?C.gold:idx>=25?'#ff8a65':C.red
  const minD = data ? Math.min(...data.chartData.map(d=>Math.min(d.dealer,d.asset,d.lev))) : 0
  const maxD = data ? Math.max(...data.chartData.map(d=>Math.max(d.dealer,d.asset,d.lev))) : 1

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Financial Futures <span style={{ color:C.blue }}>COT</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>CFTC Traders in Financial Futures (TFF) report — Dealer, Asset Manager, and Leveraged Fund positioning</p>

      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:24 }}>
        {markets.map(m=>(
          <button key={m.sym} onClick={()=>setMarket(m.sym)} style={{ background:market===m.sym?C.blue:'transparent',color:market===m.sym?'#0a0a0a':C.muted,border:`1px solid ${market===m.sym?C.blue:C.border2}`,padding:'6px 14px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{m.label}</button>
        ))}
      </div>

      {loading && <p style={{ color:C.muted,fontSize:13 }}>Loading CFTC data...</p>}
      {error && <p style={{ color:C.red,fontSize:13 }}>{error}</p>}

      {data && (
        <>
          <p style={{ fontSize:11,color:C.dim,marginBottom:20 }}>As of {data.reportDate} · {data.marketName} · {data.weeksOfData} weeks of data · OI: {data.openInterest?.toLocaleString()}</p>

          {/* Three positioning panels */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12,marginBottom:24 }}>
            {[
              { label:'DEALER / INTERMEDIARY', d:data.dealer, note:'Usually hedging client long equity — net short = bullish', invertBullish:true },
              { label:'ASSET MANAGER / INSTITUTIONAL', d:data.assetManager, note:'Real money — pension funds, mutual funds. Net long = institutions buying', invertBullish:false },
              { label:'LEVERAGED FUNDS (HEDGE FUNDS)', d:data.leveraged, note:'Trend followers. Extreme readings are contrarian signals', invertBullish:false, contrarian:true },
            ].map(({ label, d, note, invertBullish, contrarian }) => {
              const bulletish = invertBullish ? d.cotIndex <= 30 : d.cotIndex >= 65
              const bgColor = bulletish ? C.greenBg : d.cotIndex >= 70 && contrarian ? '#0d0808' : C.surface
              const ic = cotColor(invertBullish ? 100 - d.cotIndex : d.cotIndex)
              return (
                <div key={label} style={{ background:bgColor,border:`1px solid ${C.border2}`,padding:'18px 22px' }}>
                  <Label>{label}</Label>
                  <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:10 }}>
                    <div>
                      <p style={{ fontSize:28,fontWeight:300,color:ic,margin:0,lineHeight:1 }}>{invertBullish ? 100-d.cotIndex : d.cotIndex}</p>
                      <p style={{ fontSize:9,color:C.dim,margin:'2px 0 0',letterSpacing:1 }}>INDEX / 100</p>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ height:6,background:C.border2,borderRadius:3,marginBottom:6 }}>
                        <div style={{ height:'100%',width:`${invertBullish?100-d.cotIndex:d.cotIndex}%`,background:ic,borderRadius:3 }} />
                      </div>
                      <p style={{ fontSize:11,color:C.muted,margin:0 }}>Net: {d.net>=0?'+':''}{d.net?.toLocaleString()}</p>
                    </div>
                  </div>
                  <p style={{ fontSize:11,color:C.muted,margin:'0 0 6px',lineHeight:1.6 }}>{d.signal}</p>
                  <p style={{ fontSize:10,color:C.dim,margin:0,borderTop:`1px solid ${C.border}`,paddingTop:8 }}>{note}</p>
                </div>
              )
            })}
          </div>

          {/* Chart */}
          <Label>NET POSITIONING — LAST 26 WEEKS</Label>
          <Card style={{ padding:'16px 20px' }}>
            <div style={{ display:'flex',gap:16,marginBottom:10 }}>
              {[{label:'Dealer',color:C.blue},{label:'Asset Mgr',color:C.green},{label:'Leveraged',color:C.red}].map(l=>(
                <div key={l.label} style={{ display:'flex',alignItems:'center',gap:6 }}>
                  <div style={{ width:12,height:3,background:l.color }} />
                  <span style={{ fontSize:10,color:C.muted }}>{l.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex',alignItems:'flex-end',gap:3,height:100 }}>
              {data.chartData.map((d,i) => {
                const range = maxD-minD||1
                const dh = Math.max(3,((d.dealer-minD)/range)*90)
                const ah = Math.max(3,((d.asset-minD)/range)*90)
                const lh = Math.max(3,((d.lev-minD)/range)*90)
                return (
                  <div key={i} style={{ flex:1,display:'flex',gap:1,alignItems:'flex-end',minWidth:4 }} title={d.date}>
                    <div style={{ flex:1,height:`${dh}%`,background:d.dealer>=0?C.blue:'#2a4060',opacity:0.8 }} />
                    <div style={{ flex:1,height:`${ah}%`,background:d.asset>=0?C.green:C.red,opacity:0.7 }} />
                    <div style={{ flex:1,height:`${lh}%`,background:d.lev>=0?'#ce93d8':'#5d2070',opacity:0.7 }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',marginTop:6,fontSize:9,color:C.dim }}>
              <span>{data.chartData[0]?.date}</span><span>{data.chartData[data.chartData.length-1]?.date}</span>
            </div>
          </Card>

          {/* Interpretation guide */}
          <Card style={{ marginTop:16 }}>
            <Label>HOW TO READ FINANCIAL FUTURES COT</Label>
            <div style={{ display:'grid',gap:8 }}>
              {[
                {title:'Dealer extremely short (index low)', desc:'Dealers are hedging massive client equity exposure. When dealers are very net short, they have lots of client long positions to hedge. This is structurally bullish — client demand is strong.'},
                {title:'Asset managers net long (index high)', desc:'Real money (pensions, mutual funds) is accumulating. This is the most reliable bullish signal — patient, long-term capital moving in.'},
                {title:'Leveraged funds extremely long (index high)', desc:'Contrarian warning. Hedge funds are trend followers — when they are all-in long, the move may be near exhaustion. Watch for reversals.'},
                {title:'Leveraged funds extremely short (index low)', desc:'Contrarian bullish. If specs are max short, a short-covering rally becomes more likely. Often seen near market lows.'},
              ].map(g=>(
                <div key={g.title} style={{ borderLeft:`2px solid ${C.blue}`,paddingLeft:12,paddingTop:6,paddingBottom:6 }}>
                  <p style={{ fontSize:12,color:C.blue,margin:'0 0 4px' }}>{g.title}</p>
                  <p style={{ fontSize:11,color:C.muted,margin:0,lineHeight:1.6 }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ─── Sectors Tab ─────────────────────────────────────────────────────────────
function SectorsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('change20d')
  const periodLabels = { change1d:'1 Day', change5d:'5 Day', change20d:'20 Day', change60d:'60 Day' }

  useEffect(() => {
    fetch('/api/markets/sectors').then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
  }, [])

  if (loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading sector data...</p>

  const sectors = [...(data?.sectors||[])].sort((a,b)=>b[period]-a[period])
  const etfsOnly = sectors.filter(s=>['QQQ','SPY','IWM','GLD','TLT'].includes(s.symbol))
  const sectorOnly = sectors.filter(s=>!['QQQ','SPY','IWM','GLD','TLT'].includes(s.symbol))
  const maxAbs = Math.max(...sectorOnly.map(s=>Math.abs(s[period])), 0.01)

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Sector <span style={{ color:C.blue }}>Rotation</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>Which sectors are leading and lagging — a key signal for risk-on/off environment</p>

      {data?.rotationSignal && (
        <div style={{ display:'flex',gap:16,alignItems:'center',marginBottom:20,flexWrap:'wrap' }}>
          <RegimeBadge regime={data.rotationSignal} />
          <span style={{ fontSize:12,color:C.muted }}>Leaders: <span style={{ color:C.text }}>{data.leaders?.join(' · ')}</span></span>
          <span style={{ fontSize:12,color:C.muted }}>Laggards: <span style={{ color:C.red }}>{data.laggards?.join(' · ')}</span></span>
        </div>
      )}

      <div style={{ display:'flex',gap:8,marginBottom:24 }}>
        {Object.entries(periodLabels).map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} style={{ background:period===k?C.blue:'transparent',color:period===k?'#0a0a0a':C.muted,border:`1px solid ${period===k?C.blue:C.border2}`,padding:'5px 14px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>{l}</button>
        ))}
      </div>

      {/* Reference ETFs */}
      <Label>REFERENCE</Label>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:8,marginBottom:24 }}>
        {etfsOnly.map(s=>(
          <Card key={s.symbol} style={{ padding:'12px 16px' }}>
            <p style={{ fontSize:9,color:C.muted,margin:'0 0 2px',letterSpacing:2 }}>{s.symbol}</p>
            <p style={{ fontSize:13,color:C.text,margin:'0 0 4px' }}>{s.price}</p>
            <p style={{ fontSize:12,color:s[period]>=0?C.green:C.red,margin:0 }}>{s[period]>=0?'+':''}{s[period]}%</p>
          </Card>
        ))}
      </div>

      {/* Sector heatmap bars */}
      <Label>S&P 500 SECTORS — RANKED BY {periodLabels[period].toUpperCase()}</Label>
      <div style={{ display:'grid',gap:4 }}>
        {sectorOnly.map((s,i)=>{
          const pct = s[period]
          const barW = Math.abs(pct)/maxAbs*50
          const color = pct>=3?'#1b5e20':pct>=1?C.green:pct>=0?'#a5d6a7':pct>=-1?'#ef9a9a':pct>=-3?C.red:'#7f0000'
          return (
            <div key={s.symbol} style={{ display:'flex',alignItems:'center',gap:12,padding:'8px 12px',background:i===0?'#0d1008':i===sectorOnly.length-1?'#0d0808':C.surface,border:`1px solid ${C.border2}` }}>
              <span style={{ fontSize:10,color:C.dim,width:18,textAlign:'right',flexShrink:0 }}>#{i+1}</span>
              <span style={{ fontSize:11,color:C.text,width:130,flexShrink:0 }}>{s.name}</span>
              <span style={{ fontSize:9,color:C.dim,width:35,flexShrink:0 }}>{s.symbol}</span>
              <div style={{ flex:1,display:'flex',alignItems:'center',gap:8 }}>
                {pct>=0
                  ? <><div style={{ width:'50%',display:'flex',justifyContent:'flex-end' }}><div style={{ width:`${barW}%`,height:14,background:color,borderRadius:1 }} /></div><div style={{ width:'50%' }} /></>
                  : <><div style={{ width:'50%' }} /><div style={{ width:'50%' }}><div style={{ width:`${barW}%`,height:14,background:color,borderRadius:1 }} /></div></>
                }
              </div>
              <span style={{ fontSize:12,color:pct>=0?C.green:C.red,width:55,textAlign:'right',flexShrink:0 }}>{pct>=0?'+':''}{pct}%</span>
              <Sparkline data={s.sparkline} color={pct>=0?C.green:C.red} height={24} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Options & VIX Tab ────────────────────────────────────────────────────────
function OptionsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/markets/options-sentiment').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }, [])
  if (loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading options data...</p>

  const vixLevel = parseFloat(data?.vix?.current||20)
  const vixColor = vixLevel<15?C.green:vixLevel<20?'#8bc34a':vixLevel<30?C.gold:C.red

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Options <span style={{ color:C.blue }}>Sentiment</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>VIX term structure, put/call ratios, and options market fear/greed signals</p>

      {/* VIX big display */}
      <Card style={{ marginBottom:20,textAlign:'center' }}>
        <Label style={{ textAlign:'center' }}>CBOE VIX — VOLATILITY INDEX</Label>
        <div style={{ fontSize:80,fontWeight:300,color:vixColor,lineHeight:1 }}>{data?.vix?.current}</div>
        <p style={{ fontSize:16,color:vixColor,letterSpacing:3,margin:'8px 0 16px' }}>{data?.vix?.signal}</p>
        <div style={{ display:'flex',justifyContent:'center',gap:24,fontSize:12,color:C.muted,marginBottom:16 }}>
          <span>20d avg: {data?.vix?.avg20}</span>
          <span>50d avg: {data?.vix?.avg50}</span>
          <span>6mo percentile: {data?.vix?.percentile6m}%</span>
        </div>
        <div style={{ display:'flex',justifyContent:'center' }}>
          <Sparkline data={data?.vix?.sparkline} color={C.red} height={50} />
        </div>
        <div style={{ height:8,background:C.surface2,borderRadius:4,margin:'16px auto 8px',maxWidth:400,position:'relative' }}>
          <div style={{ position:'absolute',left:0,top:0,height:'100%',width:'25%',background:C.green,opacity:0.3,borderRadius:'4px 0 0 4px' }} />
          <div style={{ position:'absolute',left:'25%',top:0,height:'100%',width:'25%',background:C.gold,opacity:0.3 }} />
          <div style={{ position:'absolute',left:'50%',top:0,height:'100%',width:'25%',background:C.red,opacity:0.3 }} />
          <div style={{ position:'absolute',left:'75%',top:0,height:'100%',width:'25%',background:'#8b0000',opacity:0.3,borderRadius:'0 4px 4px 0' }} />
          <div style={{ position:'absolute',top:-4,left:`${Math.min(Math.max((vixLevel-10)/50*100,0),100)}%`,transform:'translateX(-50%)',width:14,height:14,background:vixColor,borderRadius:'50%' }} />
        </div>
        <div style={{ display:'flex',justifyContent:'space-around',fontSize:9,color:C.dim,maxWidth:420,margin:'0 auto' }}>
          <span>10 CALM</span><span>20 ELEVATED</span><span>30 FEAR</span><span>40+ PANIC</span>
        </div>
      </Card>

      {/* Term structure */}
      {data?.termStructure?.length > 0 && (
        <Card style={{ marginBottom:20 }}>
          <Label>VIX TERM STRUCTURE</Label>
          <div style={{ display:'flex',gap:24,alignItems:'flex-end',marginBottom:16 }}>
            {data.termStructure.map(t=>(
              <div key={t.label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:9,color:C.muted,margin:'0 0 6px',letterSpacing:2 }}>{t.label}</p>
                <div style={{ height:Math.max(20,t.value*3),background:t.value>=data.termStructure[0]?.value?C.green:C.red,opacity:0.7,width:40,margin:'0 auto',borderRadius:2 }} />
                <p style={{ fontSize:13,color:C.text,margin:'6px 0 0' }}>{t.value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12,color:C.muted,margin:0,lineHeight:1.6 }}>{data.termStructureSignal}</p>
        </Card>
      )}

      {/* Put/Call */}
      {data?.putCall && (
        <Card style={{ marginBottom:20 }}>
          <Label>PUT/CALL RATIOS</Label>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:16 }}>
            <div>
              <p style={{ fontSize:11,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>TOTAL P/C RATIO</p>
              <p style={{ fontSize:32,fontWeight:300,color:parseFloat(data.putCall.total)>1.1?C.green:parseFloat(data.putCall.total)<0.75?C.red:C.gold,margin:0 }}>{data.putCall.total}</p>
              <p style={{ fontSize:11,color:C.muted,margin:'4px 0 0' }}>20d avg: {data.putCall.avg20}</p>
            </div>
            <div>
              <p style={{ fontSize:11,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>EQUITY P/C RATIO</p>
              <p style={{ fontSize:32,fontWeight:300,color:C.text,margin:0 }}>{data.putCall.equity}</p>
            </div>
          </div>
          <p style={{ fontSize:12,color:C.muted,margin:'0 0 12px',lineHeight:1.6 }}>{data.putCall.signal}</p>
          <Sparkline data={data.putCall.sparkline} color={C.purple} height={40} />
          <div style={{ marginTop:12,fontSize:11,color:C.dim,borderTop:`1px solid ${C.border}`,paddingTop:10 }}>
            P/C above 1.2 = extreme fear, often near short-term lows. Below 0.7 = extreme greed, often near short-term tops.
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Yield Curve Tab ──────────────────────────────────────────────────────────
function YieldCurveTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/markets/yield-curve').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }, [])
  if (loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading yield data...</p>

  const tenors = ['3M','5Y','10Y','30Y']
  const yields = data?.yields || {}
  const maxYield = Math.max(...tenors.map(t=>yields[t]?.current||0),0.01)
  const inverted = data?.isInverted

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Yield <span style={{ color:C.blue }}>Curve</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>Treasury yields across the curve — inversion is one of the most reliable recession indicators</p>

      {/* Signal banner */}
      <div style={{ background:inverted?C.redBg:'#080d09',border:`1px solid ${inverted?C.redBorder:C.greenBorder}`,padding:'14px 20px',marginBottom:24 }}>
        <p style={{ fontSize:11,letterSpacing:3,color:inverted?C.red:C.green,margin:'0 0 6px' }}>{inverted?'⚠ YIELD CURVE INVERTED':'✓ YIELD CURVE NORMAL'}</p>
        <p style={{ fontSize:13,color:C.muted,margin:0,lineHeight:1.6 }}>{data?.signal}</p>
      </div>

      {/* Visual curve */}
      <Card style={{ marginBottom:24 }}>
        <Label>TREASURY YIELD CURVE</Label>
        <div style={{ display:'flex',gap:4,alignItems:'flex-end',height:120,marginBottom:12 }}>
          {tenors.map(t=>{
            const y = yields[t]?.current
            if (!y) return null
            const h = Math.max(8,(y/maxYield)*100)
            return (
              <div key={t} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6 }}>
                <span style={{ fontSize:11,color:C.text }}>{y}%</span>
                <div style={{ width:'100%',height:`${h}%`,background:inverted&&t==='3M'&&y>yields['10Y']?.current?C.red:C.blue,opacity:0.8,borderRadius:2 }} />
                <span style={{ fontSize:10,color:C.muted }}>{t}</span>
              </div>
            )
          })}
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
          {data?.spreads?.['2s10s']!=null && (
            <div>
              <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>3M/10Y SPREAD</p>
              <p style={{ fontSize:20,color:data.spreads['2s10s']<0?C.red:C.green,margin:0 }}>{data.spreads['2s10s']>0?'+':''}{data.spreads['2s10s']}%</p>
              <p style={{ fontSize:11,color:C.muted,margin:'4px 0 0' }}>{data.spreads['2s10s']<0?'INVERTED':'POSITIVE'}</p>
            </div>
          )}
          {data?.spreads?.['5s30s']!=null && (
            <div>
              <p style={{ fontSize:10,color:C.muted,margin:'0 0 4px',letterSpacing:2 }}>5Y/30Y SPREAD</p>
              <p style={{ fontSize:20,color:data.spreads['5s30s']<0?C.red:C.green,margin:0 }}>{data.spreads['5s30s']>0?'+':''}{data.spreads['5s30s']}%</p>
            </div>
          )}
        </div>
      </Card>

      {/* Yield change table */}
      <Label>YIELD CHANGES</Label>
      <div style={{ display:'grid',gap:3 }}>
        {tenors.map(t=>{
          const y = yields[t]
          if (!y) return null
          return (
            <div key={t} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:20,flexWrap:'wrap' }}>
              <span style={{ fontSize:14,width:40,flexShrink:0,color:C.text }}>{t}</span>
              <span style={{ fontSize:18,fontWeight:300,color:C.text,width:70 }}>{y.current}%</span>
              <span style={{ fontSize:12,color:y.change30d>=0?C.red:C.green }}>30d: {y.change30d>=0?'+':''}{y.change30d}%</span>
              <span style={{ fontSize:12,color:y.change90d>=0?C.red:C.green }}>90d: {y.change90d>=0?'+':''}{y.change90d}%</span>
              <div style={{ flex:1,minWidth:100 }}>
                <Sparkline data={y.history?.slice(-26)} color={C.blue} height={28} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Trading implications */}
      <Card style={{ marginTop:20 }}>
        <Label>TRADING IMPLICATIONS</Label>
        <div style={{ display:'grid',gap:8 }}>
          {[
            {scenario:'Curve inverting (short rates > long rates)',impact:'Hawkish Fed. Typically bearish for growth stocks (NQ). Historically precedes recession 12-24 months.'},
            {scenario:'Curve steepening (long rates rising faster)',impact:'Growth expectations rising. Risk-on. Typically bullish for cyclicals, banks, commodities, bearish for bonds (TLT).'},
            {scenario:'Bull steepener (short rates falling)',impact:'Fed cutting rates. Early cycle. Very bullish for growth stocks and commodities.'},
            {scenario:'10Y yield rising sharply (>4.5%)',impact:'Equity multiple compression. NQ/growth stocks typically hurt most. Watch ratio of rate change vs equity move.'},
          ].map(r=>(
            <div key={r.scenario} style={{ borderLeft:`2px solid ${C.blue}`,paddingLeft:12,paddingTop:8,paddingBottom:8 }}>
              <p style={{ fontSize:12,color:C.blue,margin:'0 0 4px' }}>{r.scenario}</p>
              <p style={{ fontSize:11,color:C.muted,margin:0,lineHeight:1.6 }}>{r.impact}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Earnings Tab ─────────────────────────────────────────────────────────────
function EarningsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  useEffect(() => { fetch('/api/markets/earnings').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}) }, [])
  if (loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading earnings data...</p>

  const impactColor = { EXTREME:C.red, HIGH:C.gold, MEDIUM:C.green }
  const sectors = ['All',...new Set((data?.companies||[]).map(c=>c.sector))]
  const filtered = (data?.companies||[]).filter(c=>filter==='All'||c.sector===filter)

  return (
    <div>
      <h2 style={{ fontSize:28,fontWeight:400,marginBottom:8 }}>Earnings <span style={{ color:C.blue }}>Calendar</span></h2>
      <p style={{ color:C.muted,fontSize:13,marginBottom:16 }}>Index-moving earnings — these move ES, NQ, and sector ETFs significantly</p>

      {data?.nextEarningsSeason && (
        <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'14px 20px',marginBottom:20 }}>
          <p style={{ fontSize:11,letterSpacing:3,color:C.blue,margin:'0 0 6px' }}>NEXT EARNINGS SEASON</p>
          <p style={{ fontSize:16,color:C.text,margin:'0 0 4px' }}>{data.nextEarningsSeason.month} — ~{data.nextEarningsSeason.weeksAway} weeks away</p>
          <p style={{ fontSize:11,color:C.muted,margin:0 }}>{data.nextEarningsSeason.note}</p>
        </div>
      )}

      <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:20 }}>
        {sectors.map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{ background:filter===s?C.blue:'transparent',color:filter===s?'#0a0a0a':C.muted,border:`1px solid ${filter===s?C.blue:C.border2}`,padding:'5px 14px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{s}</button>
        ))}
      </div>

      <div style={{ display:'grid',gap:4,marginBottom:24 }}>
        {filtered.map(c=>(
          <div key={c.ticker} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
            <div style={{ minWidth:50,flexShrink:0 }}>
              <p style={{ fontSize:13,color:C.text,margin:'0 0 2px',fontWeight:400 }}>{c.ticker}</p>
              <p style={{ fontSize:9,color:C.muted,margin:0,letterSpacing:1 }}>{c.sector}</p>
            </div>
            <div style={{ flex:1,minWidth:150 }}>
              <p style={{ fontSize:14,color:C.text,margin:'0 0 4px' }}>{c.name}</p>
              <p style={{ fontSize:11,color:C.muted,margin:0,lineHeight:1.5 }}>{c.notes}</p>
            </div>
            <div style={{ textAlign:'right',flexShrink:0 }}>
              <span style={{ fontSize:10,color:impactColor[c.indexImpact]||C.muted,border:`1px solid ${impactColor[c.indexImpact]||C.border2}`,padding:'3px 8px',letterSpacing:1,display:'block',marginBottom:4 }}>{c.indexImpact} IMPACT</span>
              <span style={{ fontSize:11,color:C.muted }}>{c.typicalMove}</span>
            </div>
          </div>
        ))}
      </div>

      {data?.tradingNotes && (
        <Card>
          <Label>TRADING NOTES</Label>
          {data.tradingNotes.map((note,i)=>(
            <p key={i} style={{ fontSize:12,color:C.muted,margin:'0 0 8px',lineHeight:1.6,paddingLeft:12,borderLeft:`2px solid ${C.blue}` }}>{note}</p>
          ))}
        </Card>
      )}
    </div>
  )
}

// ─── Key Levels Tab ───────────────────────────────────────────────────────────
function KeyLevelsTab() {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ symbol:'',name:'',type:'SUPPORT',price:'',notes:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    fetch('/api/markets/keylevels').then(r=>r.json()).then(d=>{if(Array.isArray(d))setLevels(d);setLoading(false)})
  }, [])

  const addLevel = async () => {
    if (!form.symbol||!form.price) return
    const res = await fetch('/api/markets/keylevels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    const level = await res.json()
    setLevels(l=>[level,...l]); setShowForm(false)
    setForm({symbol:'',name:'',type:'SUPPORT',price:'',notes:''})
  }

  const del = async (id) => {
    await fetch('/api/markets/keylevels',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setLevels(l=>l.filter(x=>x.id!==id))
  }

  const typeColor = { SUPPORT:C.green, RESISTANCE:C.red, PIVOT:C.blue }
  const grouped = {}
  levels.forEach(l => { if (!grouped[l.symbol]) grouped[l.symbol]=[]; grouped[l.symbol].push(l) })

  if (loading) return <p style={{ color:C.muted,fontSize:13 }}>Loading key levels...</p>

  const inp = { width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box' }

  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:8,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Key <span style={{ color:C.blue }}>Levels</span></h2>
        <button onClick={()=>setShowForm(s=>!s)} style={{ marginLeft:'auto',background:C.blue,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>+ ADD LEVEL</button>
      </div>
      <p style={{ color:C.muted,fontSize:13,marginBottom:24 }}>Mark your support, resistance, and pivot levels for ES, NQ, and any instrument. Get a clean map of levels across all your instruments.</p>

      {showForm && (
        <Card style={{ marginBottom:24 }}>
          <Label>NEW KEY LEVEL</Label>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:12,marginBottom:16 }}>
            <div><Label>TYPE</Label><div style={{ display:'flex',gap:2 }}>{['SUPPORT','RESISTANCE','PIVOT'].map(t=><button key={t} onClick={()=>set('type',t)} style={{ flex:1,background:form.type===t?typeColor[t]:C.border2,color:form.type===t?'#0a0a0a':C.muted,border:'none',padding:'7px 4px',fontSize:8,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{t}</button>)}</div></div>
            <div><Label>SYMBOL / INSTRUMENT</Label><input value={form.symbol} onChange={e=>set('symbol',e.target.value)} placeholder="ES, NQ, AAPL..." style={inp} /></div>
            <div><Label>LEVEL NAME</Label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Feb highs, ATH, VWAP" style={inp} /></div>
            <div><Label>PRICE</Label><input value={form.price} onChange={e=>set('price',e.target.value)} placeholder="5250.00" type="number" style={inp} /></div>
            <div style={{ gridColumn:'1/-1' }}><Label>NOTES</Label><input value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Why this level matters..." style={inp} /></div>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={addLevel} style={{ background:C.blue,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>ADD LEVEL</button>
            <button onClick={()=>setShowForm(false)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>CANCEL</button>
          </div>
        </Card>
      )}

      {levels.length===0 && !showForm && (
        <Card>
          <p style={{ color:C.muted,fontSize:13,margin:'0 0 12px',textAlign:'center' }}>No key levels yet. Add support, resistance, and pivot levels for your instruments.</p>
          <div style={{ display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap' }}>
            {[['ES','5200','SUPPORT'],['NQ','18500','RESISTANCE'],['ES','5350','PIVOT']].map(([sym,price,type])=>(
              <button key={sym+price} onClick={()=>{setForm({symbol:sym,name:`${sym} ${type} ${price}`,type,price,notes:''});setShowForm(true)}} style={{ background:C.border2,color:C.muted,border:'none',padding:'6px 14px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>
                + {sym} {type} {price}
              </button>
            ))}
          </div>
        </Card>
      )}

      {Object.entries(grouped).map(([symbol, symLevels]) => {
        const sorted = [...symLevels].sort((a,b)=>b.price-a.price)
        return (
          <div key={symbol} style={{ marginBottom:20 }}>
            <p style={{ fontSize:11,color:C.blue,letterSpacing:3,margin:'0 0 8px' }}>{symbol}</p>
            <div style={{ display:'grid',gap:3 }}>
              {sorted.map(level=>(
                <div key={level.id} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'12px 20px',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                  <span style={{ fontSize:10,color:typeColor[level.type]||C.muted,border:`1px solid ${typeColor[level.type]||C.border2}`,padding:'2px 8px',letterSpacing:1,flexShrink:0 }}>{level.type}</span>
                  <span style={{ fontSize:18,fontWeight:300,color:C.text }}>{parseFloat(level.price).toLocaleString()}</span>
                  <span style={{ fontSize:13,color:C.muted }}>{level.name}</span>
                  {level.notes && <span style={{ fontSize:12,color:C.dim }}>{level.notes}</span>}
                  <button onClick={()=>del(level.id)} style={{ marginLeft:'auto',background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'4px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font,flexShrink:0 }}>DEL</button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
