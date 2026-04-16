'use client'
import { useState, useEffect } from 'react'

const MOVER_ASSETS = [
  {sym:'GC=F',   label:'GC1!',    name:'Gold',       cat:'Metals'},
  {sym:'SI=F',   label:'SI1!',    name:'Silver',     cat:'Metals'},
  {sym:'CL=F',   label:'CL1!',    name:'Crude Oil',  cat:'Energy'},
  {sym:'NG=F',   label:'NG1!',    name:'Nat Gas',    cat:'Energy'},
  {sym:'ES=F',   label:'ES1!',    name:'S&P 500',    cat:'Index Futures'},
  {sym:'NQ=F',   label:'NQ1!',    name:'Nasdaq',     cat:'Index Futures'},
  {sym:'ZC=F',   label:'ZC1!',    name:'Corn',       cat:'Grains'},
  {sym:'ZW=F',   label:'ZW1!',    name:'Wheat',      cat:'Grains'},
  {sym:'ZS=F',   label:'ZS1!',    name:'Soybeans',   cat:'Grains'},
  {sym:'BTC-USD',label:'BTC',     name:'Bitcoin',    cat:'Crypto'},
  {sym:'ETH-USD',label:'ETH',     name:'Ethereum',   cat:'Crypto'},
  {sym:'EURUSD=X',label:'EUR/USD',name:'Euro',       cat:'Forex'},
  {sym:'GBPUSD=X',label:'GBP/USD',name:'Pound',      cat:'Forex'},
]

const BRIEF_ASSETS = [
  {label:'Gold',      sym:'GC=F'},
  {label:'Crude Oil', sym:'CL=F'},
  {label:'S&P 500',   sym:'ES=F'},
  {label:'EUR/USD',   sym:'EURUSD=X'},
  {label:'Bitcoin',   sym:'BTC-USD'},
  {label:'Nat Gas',   sym:'NG=F'},
  {label:'Corn',      sym:'ZC=F'},
  {label:'Wheat',     sym:'ZW=F'},
  {label:'Silver',    sym:'SI=F'},
]

const FLAG = {US:'🇺🇸',EU:'🇪🇺',GB:'🇬🇧',CA:'🇨🇦',JP:'🇯🇵',AU:'🇦🇺',DE:'🇩🇪',FR:'🇫🇷',CN:'🇨🇳'}

const FALLBACK_EVENTS = [
  {day:'MON',time:'8:30 AM', name:'Core PPI m/m',          impact:'HIGH',  country:'US'},
  {day:'MON',time:'10:00 AM',name:'ISM Manufacturing PMI',  impact:'MED',   country:'US'},
  {day:'TUE',time:'8:30 AM', name:'CPI m/m',               impact:'HIGH',  country:'US'},
  {day:'TUE',time:'8:30 AM', name:'Core CPI m/m',          impact:'HIGH',  country:'US'},
  {day:'WED',time:'10:30 AM',name:'Crude Oil Inventories',  impact:'HIGH',  country:'US'},
  {day:'WED',time:'2:00 PM', name:'FOMC Meeting Minutes',   impact:'HIGH',  country:'US'},
  {day:'THU',time:'7:45 AM', name:'ECB Rate Decision',      impact:'HIGH',  country:'EU'},
  {day:'THU',time:'8:30 AM', name:'Jobless Claims',         impact:'MED',   country:'US'},
  {day:'FRI',time:'8:30 AM', name:'Retail Sales m/m',       impact:'HIGH',  country:'US'},
  {day:'FRI',time:'1:15 PM', name:'BOC Governor Speech',    impact:'MED',   country:'CA'},
]

// Shared style primitives
const s = {
  card:    { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', overflow:'hidden' },
  hdr:     { padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  body:    { padding:'14px 18px' },
  title:   { fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.2px' },
  seeAll:  { fontSize:11, color:'var(--accent)', cursor:'pointer', background:'transparent', border:'none', fontFamily:'var(--font)', letterSpacing:'-0.1px' },
  dayLbl:  { fontSize:10, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.8px', textTransform:'uppercase', padding:'8px 0 4px' },
  subHdr:  { fontSize:10, fontWeight:700, color:'var(--text-dim)', letterSpacing:'0.7px', textTransform:'uppercase', marginBottom:8 },
  actLbl:  { fontSize:12, color:'var(--text-muted)', fontWeight:400, letterSpacing:'-0.1px' },
  actVal:  { fontSize:13, fontWeight:600, color:'var(--text-dim)', fontVariantNumeric:'tabular-nums' },
  divider: { borderBottom:'1px solid var(--border)' },
  briefLbl:{ fontSize:10, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 },
}

function Row({ children, last }) {
  return <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:last?'none':'1px solid var(--border)' }}>{children}</div>
}

function PctBadge({ v }) {
  if (v == null) return <span style={{ color:'var(--text-dim)', fontSize:11 }}>—</span>
  const up = v >= 0
  return (
    <span style={{ fontSize:11, fontWeight:600, color:up?'var(--green)':'var(--red)', background:up?'var(--green-bg)':'var(--red-bg)', padding:'2px 8px', borderRadius:5, fontVariantNumeric:'tabular-nums', display:'inline-block', minWidth:56, textAlign:'right' }}>
      {up?'+':''}{v.toFixed(2)}%
    </span>
  )
}

function FilterPills({ options, value, onChange }) {
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
      {options.map(o => (
        <button key={o} onClick={()=>onChange(o)}
          style={{ padding:'3px 10px', borderRadius:5, border:`1px solid ${value===o?'var(--accent)':'var(--border2)'}`, background:value===o?'var(--accent)':'transparent', color:value===o?'#fff':'var(--text-muted)', fontSize:11, fontWeight:value===o?500:400, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s' }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function EconomicCalendar() {
  const [filter, setFilter] = useState('All')
  const [events] = useState(FALLBACK_EVENTS)

  const impactColor = { HIGH:'var(--red)', MED:'var(--gold)' }
  const impactBg    = { HIGH:'var(--red-bg)', MED:'var(--gold-bg)' }

  const filtered = events.filter(e => {
    if (filter === 'All')    return true
    if (filter === 'High')   return e.impact === 'HIGH'
    if (filter === 'Forex')  return ['EU','GB','JP','AU','CA'].includes(e.country)
    if (filter === 'Futures')return ['Crude','Gold','Corn','Wheat'].some(k=>e.name.includes(k))
    return true
  })

  const grouped = filtered.reduce((acc, e) => { (acc[e.day] = acc[e.day]||[]).push(e); return acc }, {})

  return (
    <div style={s.card}>
      <div style={s.hdr}>
        <span style={s.title}>Economic Calendar</span>
        <button style={s.seeAll}>Full calendar</button>
      </div>
      <div style={s.body}>
        <FilterPills options={['All','High','Forex','Futures']} value={filter} onChange={setFilter} />
        <div style={{ maxHeight:340, overflowY:'auto' }}>
          {Object.entries(grouped).map(([day, evts]) => (
            <div key={day}>
              <div style={s.dayLbl}>{day}</div>
              {evts.map((e, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:13, lineHeight:1 }}>{FLAG[e.country]||'🌐'}</span>
                  <span style={{ fontSize:11, color:'var(--text-dim)', minWidth:56, fontVariantNumeric:'tabular-nums', letterSpacing:'-0.1px' }}>{e.time}</span>
                  <span style={{ flex:1, fontSize:12, color:'var(--text-muted)', fontWeight:450, letterSpacing:'-0.1px' }}>{e.name}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:impactColor[e.impact]||'var(--text-dim)', background:impactBg[e.impact]||'transparent', padding:'2px 6px', borderRadius:4, letterSpacing:'0.3px' }}>{e.impact}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MarketMovers({ prices, loading }) {
  const enriched = MOVER_ASSETS.map(a => ({ ...a, d: prices[a.sym] })).filter(a => a.d?.changePct != null)
  const gainers = [...enriched].sort((a,b) => b.d.changePct - a.d.changePct).slice(0,5)
  const losers  = [...enriched].sort((a,b) => a.d.changePct - b.d.changePct).slice(0,5)

  return (
    <div style={s.card}>
      <div style={s.hdr}>
        <span style={s.title}>Market Movers</span>
        <span style={{ fontSize:11, color:'var(--text-dim)' }}>Today</span>
      </div>
      <div style={s.body}>
        {loading ? (
          <div style={{ color:'var(--text-dim)', fontSize:12, padding:'8px 0' }}>Loading...</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
            {[['Gainers', gainers], ['Losers', losers]].map(([label, list]) => (
              <div key={label}>
                <div style={s.subHdr}>{label}</div>
                {list.map((a, i) => (
                  <Row key={a.sym} last={i===list.length-1}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', letterSpacing:'-0.2px' }}>{a.label}</div>
                      <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:1 }}>{a.cat}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:11, color:'var(--text-muted)', fontVariantNumeric:'tabular-nums', fontFamily:'var(--font-mono)', marginBottom:3, letterSpacing:'-0.2px' }}>
                        {a.d.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}
                      </div>
                      <PctBadge v={a.d.changePct} />
                    </div>
                  </Row>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ActivityPanel({ userInfo }) {
  const items = [
    { label:'Screenings today', value:userInfo ? `${userInfo.screeningsToday} / ${userInfo.limits?.screeningsPerDay||3}` : '—', accent:true },
    { label:'Journal entries',  value:'—' },
    { label:'Open positions',   value:'—' },
    { label:'Watchlist items',  value:'—' },
    { label:'Active competitions', value:'—' },
    { label:'COT alerts set',   value:'—' },
  ]
  return (
    <div style={s.card}>
      <div style={s.hdr}>
        <span style={s.title}>Your Activity</span>
      </div>
      <div style={s.body}>
        {items.map((item, i) => (
          <Row key={i} last={i===items.length-1}>
            <span style={s.actLbl}>{item.label}</span>
            <span style={{ ...s.actVal, color: item.accent && item.value !== '—' ? 'var(--accent)' : 'var(--text-dim)' }}>
              {item.value}
            </span>
          </Row>
        ))}
      </div>
    </div>
  )
}

function DailyBrief() {
  const [selected, setSelected] = useState(BRIEF_ASSETS[0])
  const [brief, setBrief] = useState(null)
  const [loading, setLoading] = useState(false)
  const [genTime, setGenTime] = useState(null)

  const fetchBrief = async (asset) => {
    setLoading(true); setBrief(null)
    try {
      const res = await fetch('/api/brief', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ commodity: asset.label })
      })
      const data = await res.json()
      if (data.brief) { setBrief(data.brief); setGenTime(new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchBrief(BRIEF_ASSETS[0]) }, [])

  const sections = [
    { key:'overview',  label:'Market Overview',  accent:false },
    { key:'catalysts', label:'Catalysts & Risks', accent:false },
    { key:'focus',     label:"Trader's Focus",    accent:true  },
    { key:'cot',       label:'COT Signal',        accent:false },
  ]

  return (
    <div style={s.card}>
      {/* Header */}
      <div style={{ ...s.hdr, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={s.title}>Daily Market Brief</span>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--accent)', letterSpacing:'-0.2px' }}>{selected.label}</span>
          </div>
          {genTime && <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3, letterSpacing:'-0.1px' }}>Generated {genTime} · AI-powered · select a market to refresh</div>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
          {BRIEF_ASSETS.map(a => (
            <button key={a.sym}
              onClick={()=>{ setSelected(a); fetchBrief(a) }}
              style={{ padding:'4px 11px', borderRadius:6, border:`1px solid ${selected.sym===a.sym?'var(--accent)':'var(--border2)'}`, background:selected.sym===a.sym?'var(--accent)':'transparent', color:selected.sym===a.sym?'#fff':'var(--text-muted)', fontSize:11, fontWeight:selected.sym===a.sym?500:400, cursor:'pointer', fontFamily:'var(--font)', transition:'all 0.15s', letterSpacing:'-0.1px' }}>
              {a.label}
            </button>
          ))}
          <button onClick={()=>fetchBrief(selected)} disabled={loading}
            style={{ padding:'4px 12px', borderRadius:6, border:'1px solid var(--border2)', background:'transparent', color:'var(--text-muted)', fontSize:11, cursor:'pointer', fontFamily:'var(--font)', letterSpacing:'-0.1px' }}>
            {loading ? 'Generating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Content grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ padding:'16px 18px', borderRight:i%2===0?'1px solid var(--border)':'none', borderBottom:i<2?'1px solid var(--border)':'none' }}>
              <div style={{ height:9, background:'var(--surface2)', borderRadius:3, marginBottom:10, width:'35%' }} />
              <div style={{ height:8, background:'var(--surface2)', borderRadius:3, marginBottom:5 }} />
              <div style={{ height:8, background:'var(--surface2)', borderRadius:3, marginBottom:5, width:'85%' }} />
              <div style={{ height:8, background:'var(--surface2)', borderRadius:3, width:'65%' }} />
            </div>
          ))}
        </div>
      ) : brief ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
          {sections.map((sec, i) => brief[sec.key] && (
            <div key={sec.key} style={{
              padding:'16px 18px',
              borderRight:i%2===0?'1px solid var(--border)':'none',
              borderBottom:i<2?'1px solid var(--border)':'none',
            }}>
              <div style={{ ...s.briefLbl, color:sec.accent?'var(--accent)':'var(--text-dim)' }}>{sec.label}</div>
              <div style={{ fontSize:12, color:sec.accent?'#93c5fd':'var(--text-muted)', lineHeight:1.75, fontWeight:400, letterSpacing:'-0.1px' }}>
                {brief[sec.key]}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding:'24px 18px', color:'var(--text-dim)', fontSize:12, letterSpacing:'-0.1px' }}>
          No brief available. Click Refresh to generate.
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState(null)

  useEffect(() => {
    const syms = MOVER_ASSETS.map(a=>a.sym).join(',')
    fetch(`/api/prices?symbols=${syms}`).then(r=>r.json()).then(d=>{ setPrices(d); setLoading(false) }).catch(()=>setLoading(false))
    fetch('/api/user').then(r=>r.json()).then(d=>{ if(!d.error) setUserInfo(d) }).catch(()=>{})
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 300px', gap:16, alignItems:'start' }}>
        <EconomicCalendar />
        <MarketMovers prices={prices} loading={loading} />
        <ActivityPanel userInfo={userInfo} />
      </div>
      <DailyBrief />
    </div>
  )
}
