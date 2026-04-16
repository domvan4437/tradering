'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  font:'var(--font)',mono:'var(--font-mono)',
}

const COMMODITIES = ['Gold','Silver','Copper','Crude Oil','Natural Gas','Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle','Lean Hogs','Platinum','Palladium','Rice','Oats','Lumber','Gasoline','Heating Oil']

export default function TradePlanTab() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [commodity, setCommodity] = useState('Gold')
  const [currentPlan, setCurrentPlan] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [cotData, setCotData] = useState(null)
  const [seasonalData, setSeasonalData] = useState(null)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    fetch('/api/trade-plans').then(r=>r.json()).then(d=>{setPlans(d.plans||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const fetchContext = async (comm) => {
    setFetching(true)
    const CM = {'gold':'GOLD','silver':'SILVER','crude oil':'CRUDE OIL','natural gas':'NATURAL GAS','corn':'CORN','wheat':'WHEAT','soybeans':'SOYBEANS','coffee':'COFFEE','sugar':'SUGAR','cotton':'COTTON','cocoa':'COCOA','live cattle':'CATTLE','lean hogs':'HOGS','copper':'COPPER','platinum':'PLATINUM','palladium':'PALLADIUM','gasoline':'GASOLINE','heating oil':'HEATING OIL'}
    const kw = CM[comm.toLowerCase()] || comm.toUpperCase()
    try {
      const [cotRes, seasonalRes] = await Promise.all([
        fetch('/api/cotindex', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cotKeyword:kw})}),
        fetch('/api/seasonal?commodity='+encodeURIComponent(comm))
      ])
      const [cot, seasonal] = await Promise.all([cotRes.json(), seasonalRes.json()])
      if (!cot.error) setCotData(cot)
      if (!seasonal.error) setSeasonalData(seasonal)
    } catch {}
    setFetching(false)
  }

  const handleCommodityChange = (val) => {
    setCommodity(val)
    setCotData(null)
    setSeasonalData(null)
    setCurrentPlan(null)
  }

  const generatePlan = async () => {
    if (!cotData || !seasonalData) await fetchContext(commodity)
    setGenerating(true); setError('')
    try {
      const res = await fetch('/api/trade-plans/generate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ commodity, cotData, seasonalData })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setCurrentPlan(data.plan)
    } catch { setError('Generation failed. Please try again.') }
    setGenerating(false)
  }

  const savePlan = async () => {
    if (!currentPlan) return
    const res = await fetch('/api/trade-plans', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ commodity, ...currentPlan, cotContext:currentPlan.cotContext, seasonalContext:currentPlan.seasonalContext })
    })
    const data = await res.json()
    if (data.plan) { setPlans(prev=>[data.plan,...prev]); setCurrentPlan(null) }
  }

  const deletePlan = async (id) => {
    await fetch('/api/trade-plans', {method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setPlans(prev=>prev.filter(p=>p.id!==id))
    if (selectedPlan?.id===id) setSelectedPlan(null)
  }

  const dirColor = (d) => d==='LONG'?C.green:d==='SHORT'?C.red:C.muted

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 8px', display:'flex', alignItems:'center', gap:10 }}>
          Trade <span style={{ color:C.gold }}>Plan Builder</span>
        </h2>
        <p style={{ fontSize:13, color:C.muted, margin:0 }}>AI generates a structured trade plan by pulling live COT data and seasonal analysis for any commodity. Review, edit, and save it to your plan library.</p>
      </div>

      {/* Builder */}
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:24, marginBottom:28 }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px' }}>Generate New Plan</h3>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end', flexWrap:'wrap', marginBottom:16 }}>
          <div>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Commodity</label>
            <select value={commodity} onChange={e=>handleCommodityChange(e.target.value)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 14px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, minWidth:160 }}>
              {COMMODITIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <button onClick={()=>fetchContext(commodity)} disabled={fetching} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>
            {fetching?'Fetching...':'Load COT + Seasonal Data'}
          </button>
          <button onClick={generatePlan} disabled={generating} style={{ background:generating?C.surface2:C.accent, color:generating?C.muted:'#fff', border:'none', padding:'8px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:generating?'not-allowed':'pointer', fontFamily:C.font }}>
            {generating?'⏳ Generating...':'✦ Generate Plan'}
          </button>
        </div>

        {/* Context preview */}
        {(cotData||seasonalData) && (
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {cotData && <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 14px', fontSize:12 }}>
              <span style={{ color:C.muted }}>COT Index: </span><span style={{ color:cotData.cotIndex>=60?C.green:cotData.cotIndex<=40?C.red:C.gold, fontWeight:700 }}>{cotData.cotIndex}/100</span>
              <span style={{ color:C.muted, marginLeft:8 }}>{cotData.interpretation}</span>
            </div>}
            {seasonalData && <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:6, padding:'8px 14px', fontSize:12 }}>
              <span style={{ color:C.muted }}>Seasonal ({seasonalData.currentMonthName}): </span>
              <span style={{ color:seasonalData.currentBias?.avgReturn>0?C.green:C.red, fontWeight:700 }}>{seasonalData.currentBias?.avgReturn>0?'+':''}{seasonalData.currentBias?.avgReturn}% avg</span>
            </div>}
          </div>
        )}

        {error && <div style={{ marginTop:12, color:C.red, fontSize:13 }}>⚠️ {error}</div>}

        {/* Generated plan preview */}
        {currentPlan && (
          <div style={{ marginTop:20, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', overflow:'hidden' }}>
            <div style={{ background:dirColor(currentPlan.direction)+'15', padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontWeight:700, color:dirColor(currentPlan.direction), fontSize:14 }}>{currentPlan.direction}</span>
                <span style={{ fontSize:14, color:C.text, fontWeight:600 }}>{commodity}</span>
                <span style={{ fontSize:12, color:C.muted }}>R/R: {currentPlan.riskReward}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={savePlan} style={{ background:C.accent, color:'#fff', border:'none', padding:'6px 16px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Save to Library</button>
                <button onClick={()=>setCurrentPlan(null)} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer' }}>Discard</button>
              </div>
            </div>
            <div style={{ padding:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ gridColumn:'1/-1', background:C.surface2, borderRadius:6, padding:'12px 14px' }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', marginBottom:6 }}>Trade Thesis</div>
                <p style={{ fontSize:13, color:C.text, margin:0, lineHeight:1.7 }}>{currentPlan.thesis}</p>
              </div>
              {[['Entry', currentPlan.entry, C.accent], ['Stop Loss', currentPlan.stop, C.red], ['Target', currentPlan.target, C.green], ['Timing', currentPlan.timing, C.text]].map(([label,val,color])=>(
                <div key={label} style={{ background:C.surface2, borderRadius:6, padding:'10px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:'uppercase', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13, color, fontWeight:600 }}>{val}</div>
                </div>
              ))}
              <div style={{ gridColumn:'1/-1', background:C.surface2, borderRadius:6, padding:'10px 14px' }}>
                <div style={{ fontSize:10, fontWeight:600, color:C.muted, textTransform:'uppercase', marginBottom:4 }}>Key Risks</div>
                <div style={{ fontSize:13, color:C.muted }}>{currentPlan.keyRisks}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Saved plans */}
      <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 14px' }}>Saved Plans ({plans.length})</h3>
      {loading ? <div style={{ color:C.muted }}>Loading...</div> : plans.length===0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:32, textAlign:'center', color:C.muted, fontSize:13 }}>
          No saved plans yet. Generate your first plan above.
        </div>
      ) : (
        <div style={{ display:'grid', gap:10 }}>
          {plans.map(p=>(
            <div key={p.id} style={{ background:C.surface, border:`1px solid ${selectedPlan?.id===p.id?C.accent:C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
              <div onClick={()=>setSelectedPlan(selectedPlan?.id===p.id?null:p)} style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
                <span style={{ fontWeight:700, color:dirColor(p.direction), fontSize:13, minWidth:44 }}>{p.direction}</span>
                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{p.commodity}</span>
                <span style={{ fontSize:12, color:C.muted, flex:1 }}>{p.thesis?.slice(0,80)}...</span>
                <span style={{ fontSize:11, color:C.dim }}>{new Date(p.createdAt).toLocaleDateString()}</span>
                <span style={{ background:p.status==='active'?C.green+'18':C.surface2, color:p.status==='active'?C.green:C.muted, padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:500 }}>{p.status}</span>
                <button onClick={(e)=>{e.stopPropagation();deletePlan(p.id)}} style={{ background:'transparent', color:C.red, border:'none', fontSize:16, cursor:'pointer', padding:'0 4px' }}>×</button>
              </div>
              {selectedPlan?.id===p.id && (
                <div style={{ padding:'0 18px 18px', borderTop:`1px solid ${C.border}` }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10, marginTop:14 }}>
                    {[['Entry', p.entry, C.accent], ['Stop', p.stop, C.red], ['Target', p.target, C.green], ['R/R', p.riskReward, C.text]].map(([l,v,c])=>v&&(
                      <div key={l} style={{ background:C.surface2, borderRadius:6, padding:'10px 14px' }}>
                        <div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>{l}</div>
                        <div style={{ fontSize:14, color:c, fontWeight:600 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {p.keyRisks && <div style={{ marginTop:10, background:C.surface2, borderRadius:6, padding:'10px 14px' }}><div style={{ fontSize:10, color:C.muted, fontWeight:600, textTransform:'uppercase', marginBottom:4 }}>Key Risks</div><div style={{ fontSize:13, color:C.muted }}>{p.keyRisks}</div></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
