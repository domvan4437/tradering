'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  font:'var(--font)',mono:'var(--font-mono)',
}

export default function BacktestTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/backtest').then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const fetchFiltered = (commodity) => {
    setLoading(true)
    fetch('/api/backtest'+(commodity?`?commodity=${encodeURIComponent(commodity)}`:''))
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false)}).catch(()=>setLoading(false))
  }

  if (loading) return <div style={{ textAlign:'center', padding:60, color:C.muted }}>Loading your screening history...</div>

  const { summary, commodityStats, stageFails, monthlyTrend, recentScreenings } = data || {}

  const StatCard = ({ label, value, sub, color }) => (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'16px 18px' }}>
      <div style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:color||C.text, fontFamily:C.mono }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>{sub}</div>}
    </div>
  )

  const maxFails = stageFails ? Math.max(...Object.values(stageFails), 1) : 1

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 8px', display:'flex', alignItems:'center', gap:10 }}>
          Screener <span style={{ color:C.gold }}>Backtesting</span>
        </h2>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>Your personal screening performance analytics — win rates, pass rates, and patterns built from every screening you've run.</p>
      </div>

      {!summary || summary.total === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📈</div>
          <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 8px' }}>No Screening Data Yet</h3>
          <p style={{ fontSize:13, color:C.muted, maxWidth:420, margin:'0 auto' }}>Run screenings in the Asset Screener and log outcomes (WIN/LOSS) to build your personal backtesting database. The more you use it, the more accurate your analytics become.</p>
        </div>
      ) : (
        <div>
          {/* Summary stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:28 }}>
            <StatCard label="Total Screenings" value={summary.total} />
            <StatCard label="Pass Rate" value={`${summary.passRate}%`} sub={`${summary.passed} passed`} color={summary.passRate>=30?C.green:C.muted} />
            <StatCard label="Outcomes Logged" value={summary.withOutcome} sub={`${Math.round((summary.withOutcome/summary.total)*100)}% of screenings`} />
            <StatCard label="Overall Win Rate" value={summary.winRate!==null?`${summary.winRate}%`:'—'} sub={`${summary.wins}W / ${summary.losses}L`} color={summary.winRate>=50?C.green:summary.winRate<50?C.red:C.muted} />
          </div>

          {/* By Commodity table */}
          {commodityStats?.length > 0 && (
            <div style={{ marginBottom:28 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:0 }}>Performance by Commodity</h3>
                <div style={{ display:'flex', gap:8 }}>
                  <input value={filter} onChange={e=>{setFilter(e.target.value);fetchFiltered(e.target.value)}} placeholder="Filter commodity..." style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'5px 12px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font, outline:'none' }} />
                </div>
              </div>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                  {['Commodity','Screenings','Passed','Pass Rate','Outcomes','Win Rate'].map(h=>(
                    <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>
                  ))}
                </div>
                {commodityStats.slice(0,20).map((c,i)=>(
                  <div key={c.commodity} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr 1fr', padding:'11px 16px', borderBottom:i<commodityStats.length-1?`1px solid ${C.border}`:'none', alignItems:'center' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{c.commodity}</div>
                    <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{c.total}</div>
                    <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{c.passed}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:c.passRate>=30?C.green:C.muted, fontFamily:C.mono }}>{c.passRate}%</div>
                    <div style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{c.wins+c.losses}</div>
                    <div style={{ background:c.winRate!==null?(c.winRate>=50?'var(--green-bg)':'var(--red-bg)'):'transparent', color:c.winRate!==null?(c.winRate>=50?C.green:C.red):C.dim, padding:'3px 8px', borderRadius:99, fontSize:12, fontWeight:700, width:'fit-content' }}>
                      {c.winRate!==null?`${c.winRate}%`:'—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage failures */}
          {stageFails && Object.keys(stageFails).length > 0 && (
            <div style={{ marginBottom:28 }}>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 14px' }}>Where Screenings Fail Most</h3>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20 }}>
                <div style={{ display:'grid', gap:8 }}>
                  {Object.entries(stageFails).sort((a,b)=>b[1]-a[1]).map(([stage,count])=>(
                    <div key={stage} style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ fontSize:12, color:C.muted, minWidth:140 }}>{stage}</div>
                      <div style={{ flex:1, height:8, background:C.surface2, borderRadius:4 }}>
                        <div style={{ height:'100%', width:`${(count/maxFails)*100}%`, background:C.red, borderRadius:4, opacity:0.7 }} />
                      </div>
                      <div style={{ fontSize:12, fontWeight:600, color:C.text, fontFamily:C.mono, minWidth:30 }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly trend */}
          {monthlyTrend?.length > 1 && (
            <div style={{ marginBottom:28 }}>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 14px' }}>Monthly Activity</h3>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20 }}>
                <div style={{ display:'flex', gap:4, alignItems:'flex-end', height:80 }}>
                  {monthlyTrend.map((m,i)=>{
                    const h = Math.max(4,(m.total/Math.max(...monthlyTrend.map(x=>x.total),1))*76)
                    return (
                      <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }} title={`${m.month}: ${m.total} screenings, ${m.passed} passed`}>
                        <div style={{ width:'100%', height:h, background:C.accent, opacity:0.7, borderRadius:'2px 2px 0 0' }} />
                        <div style={{ fontSize:9, color:C.dim, transform:'rotate(-45deg)', whiteSpace:'nowrap' }}>{m.month}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent screenings */}
          {recentScreenings?.length > 0 && (
            <div>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 14px' }}>Recent Screenings</h3>
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                  {['Commodity','Direction','Result','Outcome','Date'].map(h=>(
                    <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>
                  ))}
                </div>
                {recentScreenings.map((s,i)=>(
                  <div key={s.id} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding:'10px 16px', borderBottom:i<recentScreenings.length-1?`1px solid ${C.border}`:'none', alignItems:'center' }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{s.commodity}</div>
                    <div style={{ fontSize:12, color:C.muted }}>{s.direction||'—'}</div>
                    <div style={{ background:s.passed?'var(--green-bg)':'var(--red-bg)', color:s.passed?C.green:C.red, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, width:'fit-content' }}>{s.passed?'PASSED':'FAILED'}</div>
                    <div style={{ fontSize:12, color:s.outcome==='WIN'?C.green:s.outcome==='LOSS'?C.red:C.dim, fontWeight:s.outcome?600:400 }}>{s.outcome||'Not logged'}</div>
                    <div style={{ fontSize:11, color:C.dim }}>{new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
