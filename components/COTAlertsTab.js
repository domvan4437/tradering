'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  font:'var(--font)',mono:'var(--font-mono)',
}

const COMMODITIES = ['Gold','Silver','Copper','Crude Oil','Natural Gas','Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle','Lean Hogs','Platinum','Gasoline','Heating Oil']

export default function COTAlertsTab() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkResults, setCheckResults] = useState({})
  const [form, setForm] = useState({ commodity:'Gold', condition:'below', threshold:25, label:'' })

  useEffect(() => {
    fetch('/api/cot-alerts').then(r=>r.json()).then(d => { setAlerts(d.alerts||[]); setLoading(false) }).catch(()=>setLoading(false))
  }, [])

  const createAlert = async () => {
    const res = await fetch('/api/cot-alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await res.json()
    if (data.alert) { setAlerts(prev=>[data.alert,...prev]); setShowForm(false); setForm({ commodity:'Gold', condition:'below', threshold:25, label:'' }) }
  }

  const deleteAlert = async (id) => {
    await fetch('/api/cot-alerts', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    setAlerts(prev=>prev.filter(a=>a.id!==id))
  }

  const toggleAlert = async (id, enabled) => {
    await fetch('/api/cot-alerts', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,enabled:!enabled}) })
    setAlerts(prev=>prev.map(a=>a.id===id?{...a,enabled:!enabled}:a))
  }

  const checkAlerts = async () => {
    setChecking(true)
    const results = {}
    for (const alert of alerts.filter(a=>a.enabled)) {
      try {
        const CM = { 'gold':'GOLD','silver':'SILVER','crude oil':'CRUDE OIL','natural gas':'NATURAL GAS','corn':'CORN','wheat':'WHEAT','soybeans':'SOYBEANS','coffee':'COFFEE','sugar':'SUGAR','cotton':'COTTON','cocoa':'COCOA','live cattle':'CATTLE','lean hogs':'HOGS','copper':'COPPER','platinum':'PLATINUM','gasoline':'GASOLINE','heating oil':'HEATING OIL' }
        const kw = CM[alert.commodity.toLowerCase()] || alert.commodity.toUpperCase()
        const res = await fetch('/api/cotindex', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({cotKeyword:kw}) })
        const data = await res.json()
        if (data.cotIndex !== undefined) {
          const triggered = alert.condition==='below' ? data.cotIndex<=alert.threshold : data.cotIndex>=alert.threshold
          results[alert.id] = { cotIndex: data.cotIndex, triggered, interpretation: data.interpretation }
        }
      } catch {}
    }
    setCheckResults(results)
    setChecking(false)
  }

  const conditionLabel = (a) => `COT Index ${a.condition} ${a.threshold}`

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, gap:12, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 8px', display:'flex', alignItems:'center', gap:10 }}>
            COT <span style={{ color:C.gold }}>Alerts</span>
          </h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>Get notified when a commodity's COT Index hits an extreme reading. Set thresholds and check them instantly.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {alerts.length > 0 && (
            <button onClick={checkAlerts} disabled={checking} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
              {checking ? '⏳ Checking...' : '↻ Check Now'}
            </button>
          )}
          <button onClick={()=>setShowForm(s=>!s)} style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 18px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
            + New Alert
          </button>
        </div>
      </div>

      {/* Info card */}
      <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:24 }}>
        <p style={{ fontSize:13, color:C.muted, margin:0, lineHeight:1.7 }}>
          <strong style={{ color:C.text }}>How COT Alerts work:</strong> The COT Index ranges from 0 (maximum bearish commercial positioning) to 100 (maximum bullish). Readings below 20 or above 80 often mark major turning points. Set an alert at your preferred threshold and check it anytime — or we'll notify you when it triggers.
        </p>
      </div>

      {/* New alert form */}
      {showForm && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20, marginBottom:24 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px' }}>Create New Alert</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:12, marginBottom:16 }}>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Commodity</label>
              <select value={form.commodity} onChange={e=>setForm(f=>({...f,commodity:e.target.value}))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
                {COMMODITIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Condition</label>
              <select value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
                <option value="below">COT Index falls below</option>
                <option value="above">COT Index rises above</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Threshold (0-100)</label>
              <input type="number" min={0} max={100} value={form.threshold} onChange={e=>setForm(f=>({...f,threshold:+e.target.value}))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }} />
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Label (optional)</label>
              <input value={form.label} onChange={e=>setForm(f=>({...f,label:e.target.value}))} placeholder="e.g. Gold extreme bearish" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createAlert} style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Create Alert</button>
            <button onClick={()=>setShowForm(false)} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {loading ? <div style={{ textAlign:'center', padding:40, color:C.muted }}>Loading alerts...</div> : alerts.length === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
          <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 8px' }}>No COT Alerts Yet</h3>
          <p style={{ fontSize:13, color:C.muted }}>Create alerts for extreme COT readings. Popular setups: Gold below 20, Corn above 80, Crude Oil below 15.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {alerts.map(a => {
            const result = checkResults[a.id]
            const triggered = result?.triggered
            return (
              <div key={a.id} style={{ background:C.surface, border:`1px solid ${triggered?C.gold:C.border}`, borderRadius:'var(--radius)', padding:'16px 20px', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:a.enabled?(triggered?C.gold:C.green):C.muted, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{a.label || `${a.commodity} — ${conditionLabel(a)}`}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{a.commodity} · {conditionLabel(a)}</div>
                </div>
                {result && (
                  <div style={{ background:triggered?C.gold+'18':C.surface2, border:`1px solid ${triggered?C.gold:C.border}`, borderRadius:6, padding:'6px 14px', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:C.muted }}>Current COT</div>
                    <div style={{ fontSize:18, fontWeight:700, color:triggered?C.gold:C.text, fontFamily:C.mono }}>{result.cotIndex}</div>
                    {triggered && <div style={{ fontSize:10, color:C.gold, fontWeight:600 }}>⚡ TRIGGERED</div>}
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={()=>toggleAlert(a.id,a.enabled)} style={{ background:a.enabled?C.surface2:C.accent, color:a.enabled?C.muted:'#fff', border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:11, cursor:'pointer', fontFamily:C.font }}>
                    {a.enabled?'Pause':'Enable'}
                  </button>
                  <button onClick={()=>deleteAlert(a.id)} style={{ background:'transparent', color:C.red, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:11, cursor:'pointer', fontFamily:C.font }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
