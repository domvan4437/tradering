'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',font:'var(--font)',mono:'var(--font-mono)',
}

const ASSET_OPTIONS = [
  {label:'Gold',symbol:'GC=F'},{label:'Silver',symbol:'SI=F'},{label:'Crude Oil',symbol:'CL=F'},
  {label:'Natural Gas',symbol:'NG=F'},{label:'Corn',symbol:'ZC=F'},{label:'Wheat',symbol:'ZW=F'},
  {label:'S&P 500',symbol:'ES=F'},{label:'Nasdaq',symbol:'NQ=F'},{label:'EUR/USD',symbol:'EURUSD=X'},
  {label:'GBP/USD',symbol:'GBPUSD=X'},{label:'Bitcoin',symbol:'BTC-USD'},{label:'Ethereum',symbol:'ETH-USD'},
  {label:'Apple',symbol:'AAPL'},{label:'NVIDIA',symbol:'NVDA'},{label:'Tesla',symbol:'TSLA'},
]

function timeLeft(endDate) {
  const diff = new Date(endDate) - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff/86400000)
  const h = Math.floor((diff%86400000)/3600000)
  const m = Math.floor((diff%3600000)/60000)
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function statusBadge(status) {
  const map = { open:{label:'Open',color:'#059669',bg:'var(--green-bg)'}, active:{label:'Live',color:'#dc2626',bg:'var(--red-bg)'}, completed:{label:'Ended',color:C.dim,bg:C.surface2}, cancelled:{label:'Cancelled',color:C.dim,bg:C.surface2} }
  const s = map[status] || map.open
  return <span style={{ fontSize:11, fontWeight:700, color:s.color, background:s.bg, padding:'2px 9px', borderRadius:99 }}>{s.label}</span>
}

function TournamentCard({ tournament, onEnter, onOpen, myEntry }) {
  const isH2H = tournament.type === 'h2h'
  const entryCount = tournament._count?.entries || tournament.entries?.length || 0
  const accentColor = isH2H ? '#7c3aed' : C.gold

  return (
    <div style={{ background:C.surface, border:`2px solid ${myEntry?accentColor:C.border}`, borderRadius:'var(--radius)', overflow:'hidden', transition:'all 0.15s', cursor:'pointer' }}
      onMouseEnter={e=>{ if(!myEntry){e.currentTarget.style.borderColor=accentColor;e.currentTarget.style.boxShadow='var(--shadow-md)'} }}
      onMouseLeave={e=>{ if(!myEntry){e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'} }}>
      {/* Top accent bar */}
      <div style={{ height:4, background:`linear-gradient(90deg, ${accentColor}, ${accentColor}88)` }} />
      <div style={{ padding:'18px 20px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:20 }}>{isH2H?'⚔️':'🏆'}</span>
              <span style={{ fontSize:15, fontWeight:700, color:C.text }}>{tournament.name}</span>
            </div>
            <div style={{ fontSize:11, color:C.dim }}>by {tournament.creator?.name||'TradeRing'}</div>
          </div>
          <div style={{ textAlign:'right', display:'flex', flexDirection:'column', gap:4, alignItems:'flex-end' }}>
            {statusBadge(tournament.status)}
            {myEntry && <span style={{ fontSize:10, fontWeight:700, color:accentColor }}>✓ ENTERED</span>}
          </div>
        </div>

        {/* Description */}
        {tournament.description && <p style={{ fontSize:13, color:C.muted, margin:'0 0 14px', lineHeight:1.6 }}>{tournament.description}</p>}

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
          {[
            { label:'Teams', value:entryCount + (tournament.maxTeams?` / ${tournament.maxTeams}`:'') },
            { label:'Duration', value:timeLeft(tournament.endDate) },
            { label:'Calls/Day', value:`${tournament.maxCallsPerDay} max` },
            { label:'Buy-in', value:tournament.buyIn>0?`$${tournament.buyIn}`:'Free' },
          ].map((s,i)=>(
            <div key={i} style={{ background:C.surface2, borderRadius:6, padding:'8px 10px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:C.dim, marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Prize pool */}
        {tournament.prizePool > 0 && (
          <div style={{ background:`${accentColor}10`, border:`1px solid ${accentColor}30`, borderRadius:8, padding:'10px 14px', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:13, color:C.muted }}>Prize Pool</span>
            <span style={{ fontSize:20, fontWeight:800, color:accentColor, fontFamily:C.mono }}>${tournament.prizePool.toFixed(0)}</span>
          </div>
        )}

        {/* Assets allowed */}
        {tournament.assetClasses?.length > 0 && (
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
            {(tournament.assetClasses.includes('any')?['Any Asset']:tournament.assetClasses).map(a=>(
              <span key={a} style={{ fontSize:11, color:C.accent, background:C.accent+'15', padding:'2px 8px', borderRadius:99, fontWeight:500 }}>{a}</span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:8 }}>
          {myEntry ? (
            <button onClick={()=>onOpen(tournament, myEntry)} style={{ flex:1, background:accentColor, color:'#fff', border:'none', padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:C.font }}>
              {isH2H?'⚔️ View Battle':'🏆 View Tournament'} →
            </button>
          ) : (
            <button onClick={()=>onEnter(tournament)} style={{ flex:1, background:tournament.buyIn>0?accentColor:C.accent, color:'#fff', border:'none', padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:C.font }}>
              {isH2H?'⚔️ Accept Challenge':'🏆 Enter Tournament'} {tournament.buyIn>0?`— $${tournament.buyIn}`:'Free'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TournamentRoom({ tournament, entry, onBack, currentUserId }) {
  const [calls, setCalls] = useState([])
  const [allCalls, setAllCalls] = useState([])
  const [entries, setEntries] = useState(tournament.entries||[])
  const [view, setView] = useState('leaderboard')
  const [resolving, setResolving] = useState(false)
  const [resolveResult, setResolveResult] = useState(null)
  // Call form
  const [selectedAsset, setSelectedAsset] = useState(ASSET_OPTIONS[0])
  const [direction, setDirection] = useState('LONG')
  const [entryPrice, setEntryPrice] = useState('')
  const [stopPrice, setStopPrice] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [callError, setCallError] = useState('')
  const [callSuccess, setCallSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/tournaments/calls?tournamentId=${tournament.id}`).then(r=>r.json()).then(d=>setAllCalls(d.calls||[])).catch(()=>{})
    if (entry) fetch(`/api/tournaments/calls?tournamentId=${tournament.id}&entryId=${entry.id}`).then(r=>r.json()).then(d=>setCalls(d.calls||[])).catch(()=>{})
  }, [tournament.id, entry?.id])

  const [brokerSyncOn, setBrokerSyncOn] = useState(entry?.autoBrokerSync || false)
  const [savingSync, setSavingSync] = useState(false)

  const toggleBrokerSync = async (val) => {
    setBrokerSyncOn(val)
    setSavingSync(true)
    await fetch('/api/tournaments/enter', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId: entry?.id, autoBrokerSync: val })
    }).catch(() => {})
    setSavingSync(false)
  }

  const submitCall = async () => {
    if (!entryPrice||!stopPrice||!targetPrice) { setCallError('Fill in all price fields'); return }
    setSubmitting(true); setCallError(''); setCallSuccess('')
    const res = await fetch('/api/tournaments/calls', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tournamentId:tournament.id, asset:selectedAsset.label, symbol:selectedAsset.symbol, direction, entryPrice:parseFloat(entryPrice), stopPrice:parseFloat(stopPrice), targetPrice:parseFloat(targetPrice) })
    })
    const data = await res.json()
    if (data.error) { setCallError(data.error) }
    else { setCalls(prev=>[data.call,...prev]); setCallSuccess('Call submitted!'); setEntryPrice(''); setStopPrice(''); setTargetPrice('') }
    setSubmitting(false)
  }

  const resolveAll = async () => {
    setResolving(true)
    const res = await fetch('/api/tournaments/resolve', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tournamentId:tournament.id}) })
    const data = await res.json()
    setResolveResult(data)
    // Refresh calls
    fetch(`/api/tournaments/calls?tournamentId=${tournament.id}`).then(r=>r.json()).then(d=>setAllCalls(d.calls||[])).catch(()=>{})
    setResolving(false)
  }

  const rr = entryPrice && stopPrice && targetPrice
    ? (Math.abs(parseFloat(targetPrice)-parseFloat(entryPrice)) / Math.abs(parseFloat(entryPrice)-parseFloat(stopPrice))).toFixed(1)
    : null

  const statusColor = { won:C.green, lost:C.red, expired:C.muted, open:C.accent }
  const isH2H = tournament.type === 'h2h'

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ background:C.surface2, color:C.muted, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>← Back</button>
        <span style={{ fontSize:22 }}>{isH2H?'⚔️':'🏆'}</span>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{tournament.name}</div>
          <div style={{ fontSize:12, color:C.dim }}>{timeLeft(tournament.endDate)} · {tournament.maxCallsPerDay} calls/day max</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={resolveAll} disabled={resolving} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>
            {resolving?'Checking...':'↻ Update Scores'}
          </button>
        </div>
      </div>

      {resolveResult && <div style={{ background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:'var(--radius-sm)', padding:'10px 16px', marginBottom:16, fontSize:13, color:C.green }}>✓ Resolved {resolveResult.resolved} of {resolveResult.total} open calls</div>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        {[['leaderboard','🏅 Leaderboard'],['submit','📤 Submit Call'],['mycalls','My Calls'],['allcalls','All Calls']].map(([id,label])=>(
          <button key={id} onClick={()=>setView(id)} style={{ background:'transparent', color:view===id?C.accent:C.muted, border:'none', borderBottom:view===id?`2px solid ${C.accent}`:'2px solid transparent', padding:'8px 16px', fontSize:12, fontWeight:view===id?600:400, cursor:'pointer', fontFamily:C.font }}>{label}</button>
        ))}
      </div>

      {/* Leaderboard */}
      {view==='leaderboard' && (
        <div>
          {entries.length===0 ? (
            <div style={{ textAlign:'center', padding:48, color:C.muted, fontSize:13 }}>No entries yet. Be the first to enter!</div>
          ) : (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr', padding:'10px 18px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                {['Rank','Trader / Team','Score','Calls Today','Prize'].map(h=><div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>)}
              </div>
              {entries.map((e,i)=>{
                const medals = ['🥇','🥈','🥉']
                const isMe = e.userId===currentUserId
                const payout = tournament.payoutStructure?.[i]
                return (
                  <div key={e.userId||i} style={{ display:'grid', gridTemplateColumns:'60px 1fr 1fr 1fr 1fr', padding:'13px 18px', borderBottom:`1px solid ${C.border}`, alignItems:'center', background:isMe?C.accent+'08':C.surface }}>
                    <div style={{ fontSize:i<3?20:14, color:i<3?C.text:C.dim, fontWeight:700 }}>{medals[i]||i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:isMe?C.accent:C.text }}>{e.teamName||e.user?.name||'Trader'}{isMe?' (You)':''}</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:800, color:C.gold, fontFamily:C.mono }}>{(e.score||0).toFixed(1)} pts</div>
                    <div style={{ fontSize:12, color:C.muted }}>—</div>
                    <div style={{ fontSize:12, color:payout?C.green:C.dim, fontWeight:payout?600:400 }}>
                      {payout?`${payout.pct}% of pool`:'—'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {tournament.prizePool>0 && (
            <div style={{ marginTop:16, background:C.gold+'10', border:`1px solid ${C.gold}30`, borderRadius:'var(--radius)', padding:'14px 18px' }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.muted, marginBottom:8 }}>PAYOUT STRUCTURE</div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {(tournament.payoutStructure||[]).map((p,i)=>(
                  <div key={i} style={{ background:C.surface, borderRadius:8, padding:'10px 16px', textAlign:'center' }}>
                    <div style={{ fontSize:11, color:C.dim }}>{['🥇 1st','🥈 2nd','🥉 3rd'][i]||`#${p.place}`}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:C.gold }}>${(tournament.prizePool*(p.pct/100)).toFixed(0)}</div>
                    <div style={{ fontSize:11, color:C.dim }}>{p.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Call */}
      {view==='submit' && (
        <div style={{ maxWidth:520 }}>
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'12px 16px', marginBottom:16 }}>
            <p style={{ fontSize:13, color:C.muted, margin:0, lineHeight:1.7 }}>
              <strong style={{ color:C.text }}>How calls work:</strong> Submit your trade call with entry, stop, and target prices. The system tracks price against your levels using live market data. If price hits your target, you win points. If it hits your stop, you lose. Calls resolve automatically.
            </p>
          </div>
          {/* Broker auto-sync toggle for this competition */}
          <div style={{ background:brokerSyncOn?C.accent+'08':C.surface2, border:`1px solid ${brokerSyncOn?C.accent+'40':C.border}`, borderRadius:'var(--radius)', padding:'14px 18px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>
                  🔗 Auto-sync from Broker
                </div>
                <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>
                  When enabled, real trades from your connected broker accounts that match this competition's asset rules will automatically be entered as calls. Trade your normal account and compete at the same time.
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                {savingSync && <span style={{ fontSize:11, color:C.dim }}>Saving...</span>}
                <div onClick={()=>toggleBrokerSync(!brokerSyncOn)} style={{ width:44, height:24, borderRadius:12, background:brokerSyncOn?C.accent:C.surface3||C.border, cursor:'pointer', position:'relative', transition:'background 0.2s' }}>
                  <div style={{ position:'absolute', top:3, left:brokerSyncOn?22:3, width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                </div>
              </div>
            </div>
            {brokerSyncOn && (
              <div style={{ marginTop:10, padding:'8px 12px', background:C.accent+'10', borderRadius:6, fontSize:12, color:C.accent }}>
                ✓ Active — trades from your connected brokers will auto-enter this competition
              </div>
            )}
          </div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px' }}>Submit Trade Call</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Asset</label>
                <select value={selectedAsset.symbol} onChange={e=>setSelectedAsset(ASSET_OPTIONS.find(a=>a.symbol===e.target.value)||ASSET_OPTIONS[0])} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
                  {ASSET_OPTIONS.map(a=><option key={a.symbol} value={a.symbol}>{a.label}</option>)}
                </select>
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Direction</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['LONG','SHORT'].map(d=>(
                    <button key={d} onClick={()=>setDirection(d)} style={{ flex:1, background:direction===d?(d==='LONG'?C.green:C.red):C.surface2, color:direction===d?'#fff':C.muted, border:`1px solid ${direction===d?(d==='LONG'?C.green:C.red):C.border}`, padding:'9px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
                      {d==='LONG'?'▲ Long':'▼ Short'}
                    </button>
                  ))}
                </div>
              </div>
              {[['Entry Price', entryPrice, setEntryPrice],['Stop Loss', stopPrice, setStopPrice],['Target Price', targetPrice, setTargetPrice]].map(([label,val,setter])=>(
                <div key={label}>
                  <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>{label}</label>
                  <input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder="0.00" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
                </div>
              ))}
              {rr && (
                <div style={{ gridColumn:'1/-1', background:parseFloat(rr)>=2?'var(--green-bg)':parseFloat(rr)>=1?C.surface2:'var(--red-bg)', border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:'10px 14px', display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:C.muted }}>Risk/Reward Ratio</span>
                  <span style={{ fontSize:14, fontWeight:700, color:parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.text:C.red, fontFamily:C.mono }}>1 : {rr}</span>
                </div>
              )}
            </div>
            {callError && <div style={{ color:C.red, fontSize:12, marginBottom:10 }}>⚠️ {callError}</div>}
            {callSuccess && <div style={{ color:C.green, fontSize:12, marginBottom:10 }}>✓ {callSuccess}</div>}
            <button onClick={submitCall} disabled={submitting} style={{ width:'100%', background:C.accent, color:'#fff', border:'none', padding:'11px', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:C.font }}>
              {submitting?'Submitting...':'📤 Submit Call'}
            </button>
          </div>
        </div>
      )}

      {/* My Calls */}
      {view==='mycalls' && <CallsTable calls={calls} statusColor={statusColor} />}
      {view==='allcalls' && <CallsTable calls={allCalls} statusColor={statusColor} showTrader />}
    </div>
  )
}

function CallsTable({ calls, statusColor, showTrader }) {
  if (!calls.length) return <div style={{ textAlign:'center', padding:48, color:C.muted, fontSize:13 }}>No calls submitted yet.</div>
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:showTrader?'1fr 1fr 1fr 1fr 1fr 1fr 1fr':'1fr 1fr 1fr 1fr 1fr 1fr', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
        {[showTrader&&'Trader','Asset','Dir','Entry','Stop','Target','Status'].filter(Boolean).map(h=>(
          <div key={h} style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>{h}</div>
        ))}
      </div>
      {calls.map((c,i)=>(
        <div key={c.id} style={{ display:'grid', gridTemplateColumns:showTrader?'1fr 1fr 1fr 1fr 1fr 1fr 1fr':'1fr 1fr 1fr 1fr 1fr 1fr', padding:'11px 16px', borderBottom:i<calls.length-1?`1px solid ${C.border}`:'none', alignItems:'center' }}>
          {showTrader && <div style={{ fontSize:12, fontWeight:600, color:C.text }}>{c.user?.name||'Trader'}</div>}
          <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{c.asset}</div>
          <div style={{ fontSize:12, fontWeight:700, color:c.direction==='LONG'?C.green:C.red }}>{c.direction==='LONG'?'▲':'▼'} {c.direction}</div>
          <div style={{ fontSize:12, fontFamily:C.mono }}>{c.entryPrice?.toFixed(2)}</div>
          <div style={{ fontSize:12, fontFamily:C.mono, color:C.red }}>{c.stopPrice?.toFixed(2)}</div>
          <div style={{ fontSize:12, fontFamily:C.mono, color:C.green }}>{c.targetPrice?.toFixed(2)}</div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, fontWeight:700, color:statusColor[c.status]||C.muted, background:(statusColor[c.status]||C.muted)+'15', padding:'2px 8px', borderRadius:99 }}>{c.status?.toUpperCase()}</span>
            {c.points>0 && <span style={{ fontSize:11, color:C.gold, fontWeight:700 }}>+{c.points.toFixed(1)}pt</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function CreateTournamentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ name:'', description:'', type:'tournament', assetClasses:['any'], maxCallsPerDay:3, startDate:'', endDate:'', buyIn:0, maxTeams:'', minTeams:2, payoutStructure:[{place:1,pct:50},{place:2,pct:30},{place:3,pct:20}] })
  const [creating, setCreating] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  // Default dates
  useEffect(() => {
    const now = new Date()
    const start = new Date(now); start.setHours(now.getHours()+1,0,0,0)
    const end = new Date(now); end.setDate(now.getDate()+7)
    set('startDate', start.toISOString().slice(0,16))
    set('endDate', end.toISOString().slice(0,16))
  }, [])

  const handleCreate = async () => {
    if (!form.name||!form.startDate||!form.endDate) return
    setCreating(true)
    const res = await fetch('/api/tournaments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await res.json()
    if (data.tournament) onCreated(data.tournament)
    setCreating(false)
  }

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:24 }}>
      <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 20px' }}>Create Competition</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Type */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:8, fontWeight:600, textTransform:'uppercase' }}>Competition Type</label>
          <div style={{ display:'flex', gap:10 }}>
            {[['tournament','🏆 Tournament','Multiple teams, prize pool'],['h2h','⚔️ Head-to-Head','Challenge another group directly']].map(([val,label,desc])=>(
              <div key={val} onClick={()=>set('type',val)} style={{ flex:1, border:`2px solid ${form.type===val?C.accent:C.border}`, borderRadius:'var(--radius-sm)', padding:'12px 14px', cursor:'pointer', background:form.type===val?C.accent+'08':C.surface }}>
                <div style={{ fontSize:14, fontWeight:600, color:form.type===val?C.accent:C.text }}>{label}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Name */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Name *</label>
          <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Gold Futures Championship" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'9px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Description */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Description</label>
          <textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Rules, scoring notes, what you're competing on..." style={{ width:'100%', height:70, background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'9px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', resize:'none', boxSizing:'border-box' }} />
        </div>
        {/* Dates */}
        {[['Start Date', 'startDate'],['End Date','endDate']].map(([label,key])=>(
          <div key={key}>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>{label} *</label>
            <input type="datetime-local" value={form[key]} onChange={e=>set(key,e.target.value)} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
        {/* Calls per day */}
        <div>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Max Calls Per Day</label>
          <select value={form.maxCallsPerDay} onChange={e=>set('maxCallsPerDay',parseInt(e.target.value))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
            {[1,2,3,5,10].map(n=><option key={n} value={n}>{n} call{n>1?'s':''}/day</option>)}
          </select>
        </div>
        {/* Max teams */}
        <div>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Max Teams (optional)</label>
          <input type="number" value={form.maxTeams} onChange={e=>set('maxTeams',e.target.value)} placeholder="Unlimited" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
        </div>
        {/* Buy-in */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Buy-in (0 = free, paid coming soon)</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.dim }}>$</span>
            <input type="number" min="0" value={form.buyIn} onChange={e=>set('buyIn',parseFloat(e.target.value)||0)} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px 8px 22px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
          </div>
          {form.buyIn>0 && <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>TradeRing keeps 5% · Prize pool grows with each entry</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:20 }}>
        <button onClick={handleCreate} disabled={!form.name||!form.startDate||!form.endDate||creating} style={{ flex:1, background:form.name?C.accent:C.surface2, color:form.name?'#fff':C.muted, border:'none', padding:'11px', borderRadius:'var(--radius-sm)', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:C.font }}>
          {creating?'Creating...':'Create Competition'}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'11px 20px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
      </div>
    </div>
  )
}

export default function CompetitionsTab({ currentUserId }) {
  const [view, setView] = useState('browse')
  const [tournaments, setTournaments] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [activeRoom, setActiveRoom] = useState(null)
  const [activeEntry, setActiveEntry] = useState(null)
  const [enteringId, setEnteringId] = useState(null)
  const [teamName, setTeamName] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/tournaments').then(r=>r.json()),
      fetch('/api/tournaments?type=mine').then(r=>r.json()),
    ]).then(([all, mine]) => {
      setTournaments(all.tournaments||[])
      setMyTournaments(mine.tournaments||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const getMyEntry = (t) => myTournaments.find(m=>m.id===t.id)?.myEntry

  const handleEnter = (tournament) => {
    setEnteringId(tournament.id)
    setTeamName('')
  }

  const confirmEnter = async (tournament) => {
    const res = await fetch('/api/tournaments/enter', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tournamentId:tournament.id, teamName}) })
    const data = await res.json()
    if (data.entry) {
      setMyTournaments(prev=>[...prev, {...tournament, myEntry:data.entry}])
      setEnteringId(null)
      setActiveRoom(tournament)
      setActiveEntry(data.entry)
    }
  }

  const handleOpen = (tournament, entry) => {
    setActiveRoom(tournament)
    setActiveEntry(entry)
  }

  if (activeRoom) return <TournamentRoom tournament={activeRoom} entry={activeEntry} onBack={()=>{setActiveRoom(null);setActiveEntry(null)}} currentUserId={currentUserId} />

  const filtered = typeFilter==='all' ? tournaments : tournaments.filter(t=>t.type===typeFilter)

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 6px' }}>
            Trading <span style={{ color:C.gold }}>Competitions</span>
          </h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>
            Submit trade calls, track performance against live prices, and compete against other traders and groups for points and prizes.
          </p>
        </div>
        <button onClick={()=>setShowCreate(s=>!s)} style={{ background:C.accent, color:'#fff', border:'none', padding:'9px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
          + Create Competition
        </button>
      </div>

      {/* How it works */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { icon:'📤', title:'Submit Calls', desc:'Enter your trade with entry, stop, and target price levels' },
          { icon:'📊', title:'Live Tracking', desc:'System checks prices automatically and resolves your calls' },
          { icon:'🏆', title:'Score Points', desc:'Hit targets to earn points. Higher R/R = more points' },
          { icon:'💰', title:'Win Prizes', desc:'Top scorers split the prize pool based on payout structure' },
        ].map((s,i)=>(
          <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
            <span style={{ fontSize:24 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:4 }}>{s.title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && <div style={{ marginBottom:24 }}><CreateTournamentForm onCreated={t=>{setTournaments(prev=>[t,...prev]);setShowCreate(false)}} onCancel={()=>setShowCreate(false)} /></div>}

      {/* Enter modal */}
      {enteringId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setEnteringId(null)}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:28, width:380, maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 16px' }}>Enter Competition</h3>
            <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Team Name (optional)</label>
            <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Leave blank to use your name" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'9px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box', marginBottom:16 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>confirmEnter(tournaments.find(t=>t.id===enteringId))} style={{ flex:1, background:C.accent, color:'#fff', border:'none', padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Confirm Entry</button>
              <button onClick={()=>setEnteringId(null)} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'10px 16px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['all','All'],['tournament','🏆 Tournaments'],['h2h','⚔️ Head-to-Head']].map(([val,label])=>(
          <button key={val} onClick={()=>setTypeFilter(val)} style={{ background:typeFilter===val?C.accent:C.surface2, color:typeFilter===val?'#fff':C.muted, border:`1px solid ${typeFilter===val?C.accent:C.border}`, padding:'7px 16px', borderRadius:99, fontSize:12, fontWeight:typeFilter===val?600:400, cursor:'pointer', fontFamily:C.font }}>{label}</button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {['browse','mine'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?C.surface2:C.surface, color:view===v?C.text:C.muted, border:`1px solid ${view===v?C.border2:C.border}`, padding:'7px 14px', borderRadius:99, fontSize:12, cursor:'pointer', fontFamily:C.font, textTransform:'capitalize' }}>{v==='mine'?'My Competitions':v}</button>
          ))}
        </div>
      </div>

      {/* Tournament grid */}
      {loading ? (
        <div style={{ color:C.muted, fontSize:13, padding:24 }}>Loading competitions...</div>
      ) : (
        <div>
          {view==='mine' && myTournaments.length===0 ? (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>⚔️</div>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 8px' }}>No Competitions Yet</h3>
              <p style={{ fontSize:13, color:C.muted }}>Create a competition or enter an existing one to get started.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
              {(view==='mine'?myTournaments:filtered).map(t=>(
                <TournamentCard key={t.id} tournament={t} myEntry={getMyEntry(t)} onEnter={handleEnter} onOpen={handleOpen} />
              ))}
            </div>
          )}
          {view==='browse' && filtered.length===0 && !showCreate && (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🏆</div>
              <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 8px' }}>No Active Competitions</h3>
              <p style={{ fontSize:13, color:C.muted }}>Be the first to create a tournament or head-to-head challenge.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
