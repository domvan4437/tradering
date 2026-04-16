'use client'
import { useState, useEffect } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',goldBg:'var(--gold-bg)',
  font:'var(--font)',mono:'var(--font-mono)',radius:'var(--radius)',radiusLg:'var(--radius-lg)',
}

const ASSETS = [
  {label:'Gold',      symbol:'GC=F',  cat:'Metals'},
  {label:'Silver',    symbol:'SI=F',  cat:'Metals'},
  {label:'Crude Oil', symbol:'CL=F',  cat:'Energy'},
  {label:'Nat Gas',   symbol:'NG=F',  cat:'Energy'},
  {label:'Corn',      symbol:'ZC=F',  cat:'Grains'},
  {label:'Wheat',     symbol:'ZW=F',  cat:'Grains'},
  {label:'Soybeans',  symbol:'ZS=F',  cat:'Grains'},
  {label:'S&P 500',   symbol:'ES=F',  cat:'Index'},
  {label:'Nasdaq',    symbol:'NQ=F',  cat:'Index'},
  {label:'EUR/USD',   symbol:'EURUSD=X', cat:'Forex'},
  {label:'GBP/USD',   symbol:'GBPUSD=X', cat:'Forex'},
  {label:'Bitcoin',   symbol:'BTC-USD',  cat:'Crypto'},
  {label:'Ethereum',  symbol:'ETH-USD',  cat:'Crypto'},
  {label:'Apple',     symbol:'AAPL', cat:'Stocks'},
  {label:'NVIDIA',    symbol:'NVDA', cat:'Stocks'},
]

function timeLeft(endDate) {
  const diff = new Date(endDate) - Date.now()
  if (diff <= 0) return 'Ended'
  const d = Math.floor(diff/86400000)
  const h = Math.floor((diff%86400000)/3600000)
  const m = Math.floor((diff%3600000)/60000)
  if (d > 1) return `${d}d left`
  if (d === 1) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

function StatusPill({ status }) {
  const map = {
    open:      { label:'Open',      color:C.green, bg:C.greenBg },
    active:    { label:'Live',      color:C.red,   bg:C.redBg },
    completed: { label:'Ended',     color:C.dim,   bg:C.surface2 },
    cancelled: { label:'Cancelled', color:C.dim,   bg:C.surface2 },
  }
  const s = map[status] || map.open
  return <span style={{ fontSize:11, fontWeight:600, color:s.color, background:s.bg, padding:'2px 8px', borderRadius:4, letterSpacing:'0.2px' }}>{s.label}</span>
}

// ── Tournament card on the browse screen ──────────────────────
function TournamentCard({ t, onEnter, onView, isEntered }) {
  const isH2H = t.type === 'h2h'
  const entries = t._count?.entries || t.entries?.length || 0
  const accent = isH2H ? '#8b5cf6' : C.gold

  return (
    <div style={{ background:C.surface, border:`1px solid ${isEntered ? accent+'60' : C.border}`, borderRadius:C.radiusLg, overflow:'hidden', transition:'border-color 0.15s, box-shadow 0.15s', cursor:'pointer' }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=accent+'80'; e.currentTarget.style.boxShadow='var(--shadow-md)' }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=isEntered?accent+'60':C.border; e.currentTarget.style.boxShadow='none' }}>
      <div style={{ height:3, background:accent }} />
      <div style={{ padding:'16px 18px' }}>
        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ flex:1, minWidth:0, marginRight:10 }}>
            <div style={{ fontSize:14, fontWeight:600, color:C.text, letterSpacing:'-0.2px', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.name}</div>
            <div style={{ fontSize:11, color:C.dim }}>by {t.creator?.name || 'TradeRing'}</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4, flexShrink:0 }}>
            <StatusPill status={t.status} />
            {isEntered && <span style={{ fontSize:10, fontWeight:700, color:accent }}>ENTERED</span>}
          </div>
        </div>

        {t.description && <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.6, letterSpacing:'-0.1px' }}>{t.description}</p>}

        {/* Stats grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {[
            { label:'Teams',     value: entries + (t.maxTeams ? ` / ${t.maxTeams}` : '') },
            { label:'Time Left', value: timeLeft(t.endDate) },
            { label:'Calls/Day', value: `${t.maxCallsPerDay} max` },
            { label:'Buy-in',    value: t.buyIn > 0 ? `$${t.buyIn}` : 'Free' },
          ].map((s,i) => (
            <div key={i} style={{ background:C.surface2, borderRadius:5, padding:'7px 8px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{s.label}</div>
              <div style={{ fontSize:12, fontWeight:600, color:C.text, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Prize pool */}
        {t.prizePool > 0 && (
          <div style={{ background:C.goldBg, border:`1px solid ${C.gold}25`, borderRadius:6, padding:'8px 12px', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:C.muted, letterSpacing:'-0.1px' }}>Prize Pool</span>
            <span style={{ fontSize:18, fontWeight:700, color:C.gold, fontFamily:C.mono, letterSpacing:'-0.3px' }}>${t.prizePool.toLocaleString()}</span>
          </div>
        )}

        {/* Assets */}
        {t.assetClasses?.length > 0 && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:12 }}>
            {(t.assetClasses.includes('any') ? ['Any Asset'] : t.assetClasses).map(a => (
              <span key={a} style={{ fontSize:11, color:C.accent, background:C.accent+'12', padding:'2px 8px', borderRadius:4, fontWeight:500 }}>{a}</span>
            ))}
          </div>
        )}

        {/* CTA */}
        {isEntered ? (
          <button onClick={()=>onView(t)} style={{ width:'100%', background:accent, color:'#fff', border:'none', padding:'9px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
            {isH2H ? '⚔ View Battle' : 'View Tournament'} →
          </button>
        ) : (
          <button onClick={()=>onEnter(t)} style={{ width:'100%', background:t.buyIn>0?accent:C.accent, color:'#fff', border:'none', padding:'9px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
            {isH2H ? 'Accept Challenge' : 'Enter Tournament'} {t.buyIn>0?`— $${t.buyIn}`:'— Free'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Inside a tournament room ──────────────────────────────────
function TournamentRoom({ tournament, entry, onBack, currentUserId }) {
  const [view, setView] = useState('leaderboard')
  const [allCalls, setAllCalls] = useState([])
  const [myCalls, setMyCalls] = useState([])
  const [entries, setEntries] = useState(tournament.entries || [])
  const [resolving, setResolving] = useState(false)
  const [resolveMsg, setResolveMsg] = useState(null)
  const [brokerSync, setBrokerSync] = useState(entry?.autoBrokerSync || false)
  const [savingSync, setSavingSync] = useState(false)
  // Call form
  const [asset, setAsset] = useState(ASSETS[0])
  const [direction, setDirection] = useState('LONG')
  const [ep, setEp] = useState('')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [callMsg, setCallMsg] = useState(null)

  useEffect(() => {
    fetch(`/api/tournaments/calls?tournamentId=${tournament.id}`).then(r=>r.json()).then(d=>setAllCalls(d.calls||[])).catch(()=>{})
    if (entry) fetch(`/api/tournaments/calls?tournamentId=${tournament.id}&entryId=${entry.id}`).then(r=>r.json()).then(d=>setMyCalls(d.calls||[])).catch(()=>{})
  }, [tournament.id, entry?.id])

  const rr = ep && sl && tp
    ? (Math.abs(parseFloat(tp)-parseFloat(ep)) / Math.abs(parseFloat(ep)-parseFloat(sl))).toFixed(1)
    : null

  const submitCall = async () => {
    if (!ep||!sl||!tp) { setCallMsg({type:'error',text:'Fill in all price fields'}); return }
    setSubmitting(true); setCallMsg(null)
    const res = await fetch('/api/tournaments/calls', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tournamentId:tournament.id, asset:asset.label, symbol:asset.symbol, direction, entryPrice:parseFloat(ep), stopPrice:parseFloat(sl), targetPrice:parseFloat(tp) })
    })
    const data = await res.json()
    if (data.error) setCallMsg({type:'error',text:data.error})
    else {
      setMyCalls(p=>[data.call,...p])
      setCallMsg({type:'success',text:`Call submitted! Risk: $${data.dollarRisk?.toFixed(0)||'—'} · Target: $${data.dollarTarget?.toFixed(0)||'—'}`})
      setEp(''); setSl(''); setTp('')
    }
    setSubmitting(false)
  }

  const resolveScores = async () => {
    setResolving(true); setResolveMsg(null)
    const res = await fetch('/api/tournaments/resolve', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tournamentId:tournament.id}) })
    const data = await res.json()
    setResolveMsg(`Resolved ${data.resolved} of ${data.total} open calls`)
    fetch(`/api/tournaments/calls?tournamentId=${tournament.id}`).then(r=>r.json()).then(d=>setAllCalls(d.calls||[])).catch(()=>{})
    setResolving(false)
  }

  const toggleBrokerSync = async (val) => {
    setBrokerSync(val); setSavingSync(true)
    await fetch('/api/tournaments/enter', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({entryId:entry?.id, autoBrokerSync:val}) }).catch(()=>{})
    setSavingSync(false)
  }

  const statusColor = { won:C.green, lost:C.red, expired:C.muted, open:C.accent }

  const inp = { background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:6, fontSize:13, fontFamily:C.font, outline:'none', width:'100%', letterSpacing:'-0.1px' }

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ background:C.surface2, color:C.muted, border:`1px solid ${C.border}`, padding:'5px 12px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:C.font }}>← Back</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:700, color:C.text, letterSpacing:'-0.3px' }}>{tournament.name}</div>
          <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{timeLeft(tournament.endDate)} · {tournament.maxCallsPerDay} calls/day · {tournament.type === 'h2h' ? 'Head-to-Head' : 'Tournament'}</div>
        </div>
        <button onClick={resolveScores} disabled={resolving} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 14px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:C.font }}>
          {resolving ? 'Updating...' : '↻ Update Scores'}
        </button>
      </div>

      {resolveMsg && <div style={{ background:C.greenBg, border:`1px solid ${C.green}25`, borderRadius:6, padding:'8px 14px', marginBottom:14, fontSize:12, color:C.green }}>✓ {resolveMsg}</div>}

      {/* View tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        {[['leaderboard','Leaderboard'],['submit','Submit Call'],['mycalls','My Calls'],['allcalls','All Calls']].map(([id,label]) => (
          <button key={id} onClick={()=>setView(id)}
            style={{ background:'transparent', color:view===id?C.accent:C.muted, border:'none', borderBottom:view===id?`2px solid ${C.accent}`:'2px solid transparent', padding:'8px 16px', fontSize:12, fontWeight:view===id?600:400, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD ── */}
      {view==='leaderboard' && (
        <div>
          {entries.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:C.dim, fontSize:13 }}>No entries yet.</div>
          ) : (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'52px 1fr 1fr 1fr 1fr', padding:'10px 18px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
                {['Rank','Trader / Team','Score','Dollar P&L','Prize'].map(h => (
                  <div key={h} style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:'uppercase', letterSpacing:'0.6px' }}>{h}</div>
                ))}
              </div>
              {entries.map((e,i) => {
                const medals = ['🥇','🥈','🥉']
                const isMe = e.userId === currentUserId
                const payout = tournament.payoutStructure?.[i]
                return (
                  <div key={e.userId||i} style={{ display:'grid', gridTemplateColumns:'52px 1fr 1fr 1fr 1fr', padding:'12px 18px', borderBottom:`1px solid ${C.border}`, alignItems:'center', background:isMe?C.accent+'06':C.surface }}>
                    <div style={{ fontSize:i<3?20:14, fontWeight:700 }}>{medals[i]||i+1}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:isMe?C.accent:C.text, letterSpacing:'-0.2px' }}>{e.teamName||e.user?.name||'Trader'}{isMe?' (You)':''}</div>
                    </div>
                    <div style={{ fontSize:15, fontWeight:700, color:C.gold, fontFamily:C.mono, letterSpacing:'-0.3px' }}>{(e.score||0).toFixed(1)} pts</div>
                    <div style={{ fontSize:13, fontWeight:600, color:(e.totalDollarPnL||0)>=0?C.green:C.red, fontFamily:C.mono }}>
                      {e.totalDollarPnL != null ? `${e.totalDollarPnL>=0?'+':''}$${Math.abs(e.totalDollarPnL).toFixed(0)}` : '—'}
                    </div>
                    <div style={{ fontSize:12, color:payout?C.green:C.dim, fontWeight:payout?600:400 }}>
                      {payout ? `${payout.pct}%` : '—'}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tournament.prizePool > 0 && (
            <div style={{ marginTop:16, background:C.goldBg, border:`1px solid ${C.gold}25`, borderRadius:C.radiusLg, padding:'16px 20px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:12 }}>Payout Structure</div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                {(tournament.payoutStructure||[]).map((p,i) => (
                  <div key={i} style={{ background:C.surface, borderRadius:8, padding:'10px 16px', textAlign:'center', minWidth:90 }}>
                    <div style={{ fontSize:11, color:C.dim, marginBottom:4 }}>{['🥇 1st','🥈 2nd','🥉 3rd'][i]||`#${p.place}`}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:C.gold, letterSpacing:'-0.4px', fontFamily:C.mono }}>${(tournament.prizePool*(p.pct/100)).toFixed(0)}</div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{p.pct}% of pool</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT CALL ── */}
      {view==='submit' && (
        <div style={{ maxWidth:500 }}>
          {/* Broker sync toggle */}
          <div style={{ background:brokerSync?C.accent+'08':C.surface, border:`1px solid ${brokerSync?C.accent+'30':C.border}`, borderRadius:C.radiusLg, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3, letterSpacing:'-0.2px' }}>Auto-sync from Broker</div>
                <div style={{ fontSize:11, color:C.muted, lineHeight:1.5 }}>Trades from your connected broker matching this competition's asset rules will auto-enter as calls.</div>
              </div>
              <div onClick={()=>toggleBrokerSync(!brokerSync)}
                style={{ width:40, height:22, borderRadius:11, background:brokerSync?C.accent:C.surface2, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                <div style={{ position:'absolute', top:3, left:brokerSync?20:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
            {savingSync && <div style={{ fontSize:11, color:C.dim, marginTop:8 }}>Saving...</div>}
            {brokerSync && <div style={{ fontSize:11, color:C.accent, marginTop:8, fontWeight:500 }}>✓ Active — broker trades will auto-enter this competition</div>}
          </div>

          {/* How it works */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:'12px 16px', marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:6 }}>How scoring works</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.7, letterSpacing:'-0.1px' }}>
              Submit a call with your entry, stop, and target price. The system tracks price against your levels using live market data. Hit your target = points + dollar P&L tracked. Hit your stop = 0 points. Higher R/R ratios earn bonus points — rewarding disciplined trade planning, not gambling.
            </div>
          </div>

          {/* Call form */}
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:18 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16, letterSpacing:'-0.2px' }}>Submit Trade Call</div>
            <div style={{ display:'grid', gap:12 }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Asset</label>
                <select value={asset.symbol} onChange={e=>setAsset(ASSETS.find(a=>a.symbol===e.target.value)||ASSETS[0])} style={inp}>
                  {ASSETS.map(a => <option key={a.symbol} value={a.symbol}>{a.label} ({a.cat})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Direction</label>
                <div style={{ display:'flex', gap:8 }}>
                  {['LONG','SHORT'].map(d => (
                    <button key={d} onClick={()=>setDirection(d)}
                      style={{ flex:1, background:direction===d?(d==='LONG'?C.green:C.red):C.surface2, color:direction===d?'#fff':C.muted, border:`1px solid ${direction===d?(d==='LONG'?C.green:C.red):C.border}`, padding:'9px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
                      {d==='LONG'?'▲ Long':'▼ Short'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                {[['Entry Price',ep,setEp],['Stop Loss',sl,setSl],['Target Price',tp,setTp]].map(([label,val,setter]) => (
                  <div key={label}>
                    <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</label>
                    <input type="number" value={val} onChange={e=>setter(e.target.value)} placeholder="0.00" style={inp} />
                  </div>
                ))}
              </div>
              {rr && (
                <div style={{ background:parseFloat(rr)>=2?C.greenBg:parseFloat(rr)>=1?C.surface2:C.redBg, border:`1px solid ${C.border}`, borderRadius:6, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:11, color:C.muted }}>Risk / Reward</div>
                    {parseFloat(rr) >= 2 && <div style={{ fontSize:11, color:C.green, marginTop:2 }}>Strong setup</div>}
                    {parseFloat(rr) >= 1 && parseFloat(rr) < 2 && <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>Acceptable</div>}
                    {parseFloat(rr) < 1 && <div style={{ fontSize:11, color:C.red, marginTop:2 }}>Poor R/R — risky</div>}
                  </div>
                  <div style={{ fontSize:22, fontWeight:700, color:parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.text:C.red, fontFamily:C.mono, letterSpacing:'-0.4px' }}>1:{rr}</div>
                </div>
              )}
            </div>
            {callMsg && (
              <div style={{ background:callMsg.type==='error'?C.redBg:C.greenBg, border:`1px solid ${callMsg.type==='error'?C.red+'25':C.green+'25'}`, borderRadius:6, padding:'8px 12px', marginTop:12, fontSize:12, color:callMsg.type==='error'?C.red:C.green }}>
                {callMsg.type==='error'?'⚠ ':' ✓ '}{callMsg.text}
              </div>
            )}
            <button onClick={submitCall} disabled={!ep||!sl||!tp||submitting}
              style={{ width:'100%', background:ep&&sl&&tp?C.accent:C.surface2, color:ep&&sl&&tp?'#fff':C.muted, border:'none', padding:'11px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, marginTop:14, letterSpacing:'-0.1px' }}>
              {submitting ? 'Submitting...' : 'Submit Call'}
            </button>
          </div>
        </div>
      )}

      {/* ── CALLS TABLE ── */}
      {(view==='mycalls' || view==='allcalls') && (
        <CallsTable calls={view==='mycalls'?myCalls:allCalls} showTrader={view==='allcalls'} statusColor={statusColor} />
      )}
    </div>
  )
}

function CallsTable({ calls, showTrader, statusColor }) {
  if (!calls.length) return <div style={{ textAlign:'center', padding:40, color:C.dim, fontSize:13 }}>No calls yet.</div>
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:showTrader?'1fr 1fr 60px 80px 80px 80px 100px':'1fr 60px 80px 80px 80px 100px', padding:'10px 16px', background:C.surface2, borderBottom:`1px solid ${C.border}` }}>
        {[showTrader&&'Trader','Asset','Dir','Entry','Stop','Target','Status'].filter(Boolean).map(h => (
          <div key={h} style={{ fontSize:10, fontWeight:700, color:C.dim, textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</div>
        ))}
      </div>
      <div style={{ maxHeight:420, overflowY:'auto' }}>
        {calls.map((c,i) => (
          <div key={c.id} style={{ display:'grid', gridTemplateColumns:showTrader?'1fr 1fr 60px 80px 80px 80px 100px':'1fr 60px 80px 80px 80px 100px', padding:'10px 16px', borderBottom:i<calls.length-1?`1px solid ${C.border}`:'none', alignItems:'center' }}>
            {showTrader && <div style={{ fontSize:12, fontWeight:600, color:C.text, letterSpacing:'-0.2px' }}>{c.user?.name||'Trader'}</div>}
            <div style={{ fontSize:13, fontWeight:600, color:C.text, letterSpacing:'-0.2px' }}>{c.asset}</div>
            <div style={{ fontSize:12, fontWeight:700, color:c.direction==='LONG'?C.green:C.red }}>{c.direction==='LONG'?'▲':'▼'}</div>
            <div style={{ fontSize:12, fontFamily:C.mono, fontVariantNumeric:'tabular-nums' }}>{c.entryPrice?.toFixed(2)}</div>
            <div style={{ fontSize:12, fontFamily:C.mono, color:C.red, fontVariantNumeric:'tabular-nums' }}>{c.stopPrice?.toFixed(2)}</div>
            <div style={{ fontSize:12, fontFamily:C.mono, color:C.green, fontVariantNumeric:'tabular-nums' }}>{c.targetPrice?.toFixed(2)}</div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:10, fontWeight:700, color:statusColor[c.status]||C.muted, background:(statusColor[c.status]||C.muted)+'15', padding:'2px 7px', borderRadius:4, letterSpacing:'0.2px' }}>
                {c.status?.toUpperCase()}
              </span>
              {c.points > 0 && <span style={{ fontSize:11, color:C.gold, fontWeight:700 }}>+{c.points.toFixed(1)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Create tournament form ─────────────────────────────────────
function CreateForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    name:'', description:'', type:'tournament',
    assetClasses:['any'], maxCallsPerDay:3,
    startDate:'', endDate:'', buyIn:0, maxTeams:'', minTeams:2,
    payoutStructure:[{place:1,pct:50},{place:2,pct:30},{place:3,pct:20}]
  })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    const now = new Date()
    const start = new Date(now); start.setHours(now.getHours()+1,0,0,0)
    const end = new Date(now); end.setDate(now.getDate()+7)
    set('startDate', start.toISOString().slice(0,16))
    set('endDate', end.toISOString().slice(0,16))
  }, [])

  const handleCreate = async () => {
    if (!form.name || !form.startDate || !form.endDate) return
    setSaving(true)
    const res = await fetch('/api/tournaments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await res.json()
    if (data.tournament) onCreated(data.tournament)
    setSaving(false)
  }

  const inp = { background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:6, fontSize:13, fontFamily:C.font, outline:'none', width:'100%', letterSpacing:'-0.1px' }

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:20, marginBottom:20 }}>
      <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:18, letterSpacing:'-0.2px' }}>Create Competition</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

        {/* Type */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.6px' }}>Type</label>
          <div style={{ display:'flex', gap:10 }}>
            {[['tournament','Tournament','Multiple teams compete for the prize pool'],['h2h','Head-to-Head','Two groups challenge each other directly']].map(([val,label,desc]) => (
              <div key={val} onClick={()=>set('type',val)}
                style={{ flex:1, border:`1px solid ${form.type===val?C.accent:C.border}`, borderRadius:8, padding:'11px 14px', cursor:'pointer', background:form.type===val?C.accent+'08':C.surface2, transition:'all 0.15s' }}>
                <div style={{ fontSize:13, fontWeight:600, color:form.type===val?C.accent:C.text, letterSpacing:'-0.2px' }}>{label}</div>
                <div style={{ fontSize:11, color:C.dim, marginTop:2 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Name *</label>
          <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Gold Futures Championship Q2 2026" />
        </div>

        {/* Description */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Description</label>
          <textarea style={{...inp,height:64,resize:'none'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the rules, what traders are competing on, asset focus..." />
        </div>

        {/* Dates */}
        {[['Start Date','startDate'],['End Date','endDate']].map(([label,key]) => (
          <div key={key}>
            <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>{label} *</label>
            <input type="datetime-local" style={inp} value={form[key]} onChange={e=>set(key,e.target.value)} />
          </div>
        ))}

        {/* Calls per day */}
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Max Calls / Day</label>
          <select style={inp} value={form.maxCallsPerDay} onChange={e=>set('maxCallsPerDay',parseInt(e.target.value))}>
            {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} call{n>1?'s':''} per day</option>)}
          </select>
        </div>

        {/* Max teams */}
        <div>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Max Teams (optional)</label>
          <input type="number" style={inp} value={form.maxTeams} onChange={e=>set('maxTeams',e.target.value)} placeholder="Unlimited" />
        </div>

        {/* Buy-in */}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.6px' }}>Buy-in</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.dim, fontSize:13 }}>$</span>
            <input type="number" min="0" style={{...inp,paddingLeft:22}} value={form.buyIn} onChange={e=>set('buyIn',parseFloat(e.target.value)||0)} placeholder="0 = free" />
          </div>
          {form.buyIn > 0 && <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>TradeRing keeps 5% · creator earns 10% hosting fee · 85% goes to winners</div>}
          {form.buyIn === 0 && <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>Free entry — points and bragging rights only</div>}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:18 }}>
        <button onClick={handleCreate} disabled={!form.name||!form.startDate||!form.endDate||saving}
          style={{ flex:1, background:form.name?C.accent:C.surface2, color:form.name?'#fff':C.muted, border:'none', padding:'10px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
          {saving ? 'Creating...' : 'Create Competition'}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'10px 18px', borderRadius:6, fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
      </div>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────
export default function CompetitionsTab({ currentUserId }) {
  const [tournaments, setTournaments] = useState([])
  const [myTournaments, setMyTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('browse')
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

  const handleEnter = (t) => { setEnteringId(t.id); setTeamName('') }

  const confirmEnter = async (t) => {
    const res = await fetch('/api/tournaments/enter', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({tournamentId:t.id, teamName}) })
    const data = await res.json()
    if (data.entry) {
      setMyTournaments(p=>[...p, {...t, myEntry:data.entry}])
      setEnteringId(null)
      setActiveRoom(t)
      setActiveEntry(data.entry)
    }
  }

  if (activeRoom) return (
    <TournamentRoom
      tournament={activeRoom} entry={activeEntry}
      onBack={()=>{setActiveRoom(null);setActiveEntry(null)}}
      currentUserId={currentUserId}
    />
  )

  const filtered = typeFilter==='all' ? tournaments : tournaments.filter(t=>t.type===typeFilter)
  const display = view==='mine' ? myTournaments : filtered

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:C.text, margin:'0 0 6px', letterSpacing:'-0.4px' }}>Trading Competitions</h2>
          <p style={{ fontSize:13, color:C.dim, margin:0, letterSpacing:'-0.1px' }}>
            Submit trade calls, track performance against live prices, compete for points and prizes.
          </p>
        </div>
        <button onClick={()=>setShowCreate(s=>!s)}
          style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 18px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
          + Create Competition
        </button>
      </div>

      {/* How it works */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
        {[
          { step:'1', title:'Submit a Call',    desc:'Enter your trade with entry, stop, and target price levels' },
          { step:'2', title:'System Tracks It', desc:'Live prices resolve your call automatically — no manual tracking' },
          { step:'3', title:'Earn Points',      desc:'Hit targets to score. Higher R/R = more points per win' },
          { step:'4', title:'Win Prizes',       desc:'Top scorers split the prize pool. Dollar P&L tracked on every call' },
        ].map(s => (
          <div key={s.step} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:'14px 16px', display:'flex', gap:12 }}>
            <div style={{ width:24, height:24, background:C.accent+'15', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>{s.step}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:3, letterSpacing:'-0.2px' }}>{s.title}</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.5, letterSpacing:'-0.1px' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showCreate && <CreateForm onCreated={t=>{setTournaments(p=>[t,...p]);setShowCreate(false)}} onCancel={()=>setShowCreate(false)} />}

      {/* Enter modal */}
      {enteringId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setEnteringId(null)}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:24, width:360, maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:16, letterSpacing:'-0.3px' }}>Enter Competition</div>
            <label style={{ fontSize:10, fontWeight:700, color:C.dim, display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.6px' }}>Team Name (optional)</label>
            <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Leave blank to use your name"
              style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:6, fontSize:13, fontFamily:C.font, outline:'none', marginBottom:16 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>confirmEnter(tournaments.find(t=>t.id===enteringId))}
                style={{ flex:1, background:C.accent, color:'#fff', border:'none', padding:'10px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Confirm Entry</button>
              <button onClick={()=>setEnteringId(null)}
                style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'10px 16px', borderRadius:6, fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:4 }}>
          {[['all','All'],['tournament','Tournaments'],['h2h','Head-to-Head']].map(([val,label]) => (
            <button key={val} onClick={()=>setTypeFilter(val)}
              style={{ background:typeFilter===val?C.accent:C.surface2, color:typeFilter===val?'#fff':C.muted, border:`1px solid ${typeFilter===val?C.accent:C.border}`, padding:'6px 14px', borderRadius:5, fontSize:12, fontWeight:typeFilter===val?600:400, cursor:'pointer', fontFamily:C.font }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
          {[['browse','Browse'],['mine','My Competitions']].map(([v,label]) => (
            <button key={v} onClick={()=>setView(v)}
              style={{ background:view===v?C.surface2:C.surface, color:view===v?C.text:C.muted, border:`1px solid ${view===v?C.border2:C.border}`, padding:'6px 14px', borderRadius:5, fontSize:12, cursor:'pointer', fontFamily:C.font }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ color:C.dim, fontSize:13, padding:20 }}>Loading competitions...</div>
      ) : display.length === 0 ? (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>
            {view==='mine' ? "You haven't entered any competitions yet." : "No competitions available right now."}
          </div>
          {view==='mine' && <button onClick={()=>setView('browse')} style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Browse Competitions</button>}
          {view==='browse' && <button onClick={()=>setShowCreate(true)} style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 20px', borderRadius:6, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Create First Competition</button>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
          {display.map(t => (
            <TournamentCard key={t.id} tournament={t} myEntry={getMyEntry(t)} isEntered={!!getMyEntry(t)} onEnter={handleEnter} onView={(t)=>{setActiveRoom(t);setActiveEntry(getMyEntry(t))}} />
          ))}
        </div>
      )}
    </div>
  )
}
