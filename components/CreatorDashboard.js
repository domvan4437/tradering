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

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:'18px 20px' }}>
      <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:26, fontWeight:700, color:accent||C.text, letterSpacing:'-0.5px', fontVariantNumeric:'tabular-nums', marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:C.dim, letterSpacing:'-0.1px' }}>{sub}</div>}
    </div>
  )
}

function GrowthChart({ data }) {
  if (!data || Object.keys(data).length === 0) return (
    <div style={{ height:80, display:'flex', alignItems:'center', justifyContent:'center', color:C.dim, fontSize:12 }}>No growth data yet</div>
  )
  const entries = Object.entries(data).sort(([a],[b])=>a.localeCompare(b)).slice(-6)
  const max = Math.max(...entries.map(([,v])=>v), 1)
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:60 }}>
      {entries.map(([month, count]) => (
        <div key={month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ width:'100%', background:C.accent, borderRadius:'3px 3px 0 0', height:`${Math.max((count/max)*100, 8)}%`, minHeight:4, transition:'height 0.3s' }} />
          <div style={{ fontSize:9, color:C.dim, whiteSpace:'nowrap' }}>{month.slice(5)}</div>
        </div>
      ))}
    </div>
  )
}

function CourseBuilder({ groupId, onCreated, onCancel }) {
  const [form, setForm] = useState({ title:'', description:'', price:0, lessons:[{ title:'', content:'', videoUrl:'' }] })
  const [saving, setSaving] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const setLesson = (i,k,v) => setForm(f=>({ ...f, lessons: f.lessons.map((l,li)=>li===i?{...l,[k]:v}:l) }))
  const addLesson = () => setForm(f=>({...f, lessons:[...f.lessons,{title:'',content:'',videoUrl:''}]}))

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/creator/courses', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ...form, groupId })
    })
    const data = await res.json()
    if (data.course) onCreated(data.course)
    setSaving(false)
  }

  const inp = { background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', width:'100%', letterSpacing:'-0.1px' }

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:20 }}>
      <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px', letterSpacing:'-0.2px' }}>Create Course</h3>
      <div style={{ display:'grid', gap:12 }}>
        <div>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Course Title</label>
          <input style={inp} value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. COT Trading Masterclass" />
        </div>
        <div>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Description</label>
          <textarea style={{...inp,height:70,resize:'none'}} value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What will members learn?" />
        </div>
        <div>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Price (0 = free for group members)</label>
          <input style={inp} type="number" min="0" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0" />
        </div>
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <label style={{ fontSize:11, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Lessons</label>
            <button onClick={addLesson} style={{ background:'transparent', color:C.accent, border:'none', fontSize:12, cursor:'pointer', fontFamily:C.font }}>+ Add Lesson</button>
          </div>
          {form.lessons.map((lesson, i) => (
            <div key={i} style={{ background:C.surface2, borderRadius:'var(--radius-sm)', padding:12, marginBottom:8 }}>
              <div style={{ fontSize:11, color:C.dim, marginBottom:6, fontWeight:600 }}>Lesson {i+1}{i===0?' (Free preview)':''}</div>
              <input style={{...inp,marginBottom:6}} value={lesson.title} onChange={e=>setLesson(i,'title',e.target.value)} placeholder="Lesson title" />
              <textarea style={{...inp,height:60,resize:'none',marginBottom:6}} value={lesson.content} onChange={e=>setLesson(i,'content',e.target.value)} placeholder="Lesson content or description..." />
              <input style={inp} value={lesson.videoUrl} onChange={e=>setLesson(i,'videoUrl',e.target.value)} placeholder="Video URL (optional)" />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginTop:16 }}>
        <button onClick={handleSave} disabled={!form.title||saving} style={{ flex:1, background:form.title?C.accent:C.surface2, color:form.title?'#fff':C.muted, border:'none', padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
          {saving?'Saving...':'Save Course'}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'10px 16px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
      </div>
    </div>
  )
}

function TradeIdeaComposer({ groupId, onPosted, onCancel }) {
  const ASSETS = [
    {label:'Gold',sym:'GC=F'},{label:'Silver',sym:'SI=F'},{label:'Crude Oil',sym:'CL=F'},
    {label:'Nat Gas',sym:'NG=F'},{label:'Corn',sym:'ZC=F'},{label:'Wheat',sym:'ZW=F'},
    {label:'S&P 500',sym:'ES=F'},{label:'Nasdaq',sym:'NQ=F'},{label:'EUR/USD',sym:'EURUSD=X'},
    {label:'GBP/USD',sym:'GBPUSD=X'},{label:'Bitcoin',sym:'BTC-USD'},
  ]
  const [form, setForm] = useState({ asset:'Gold', symbol:'GC=F', direction:'LONG', entryPrice:'', stopPrice:'', targetPrice:'', thesis:'' })
  const [posting, setPosting] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const rr = form.entryPrice && form.stopPrice && form.targetPrice
    ? (Math.abs(parseFloat(form.targetPrice)-parseFloat(form.entryPrice)) / Math.abs(parseFloat(form.entryPrice)-parseFloat(form.stopPrice))).toFixed(1)
    : null

  const handlePost = async () => {
    if (!form.thesis.trim()) return
    setPosting(true)
    const res = await fetch('/api/creator/ideas', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ ...form, groupId })
    })
    const data = await res.json()
    if (data.idea) onPosted(data.idea)
    setPosting(false)
  }

  const inp = { background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', width:'100%' }

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:20 }}>
      <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px', letterSpacing:'-0.2px' }}>Post Trade Idea</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Asset</label>
          <select style={inp} value={form.symbol} onChange={e=>{ const a=ASSETS.find(a=>a.sym===e.target.value); set('symbol',e.target.value); set('asset',a?.label||'') }}>
            {ASSETS.map(a=><option key={a.sym} value={a.sym}>{a.label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Direction</label>
          <div style={{ display:'flex', gap:8 }}>
            {['LONG','SHORT','NEUTRAL'].map(d=>(
              <button key={d} onClick={()=>set('direction',d)}
                style={{ flex:1, background:form.direction===d?(d==='LONG'?C.green:d==='SHORT'?C.red:C.accent):C.surface2, color:form.direction===d?'#fff':C.muted, border:`1px solid ${form.direction===d?(d==='LONG'?C.green:d==='SHORT'?C.red:C.accent):C.border}`, padding:'8px', borderRadius:'var(--radius-sm)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
                {d==='LONG'?'▲ Long':d==='SHORT'?'▼ Short':'— Neutral'}
              </button>
            ))}
          </div>
        </div>
        {[['Entry Price','entryPrice'],['Stop Loss','stopPrice'],['Target Price','targetPrice']].map(([label,key])=>(
          <div key={key}>
            <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</label>
            <input type="number" style={inp} value={form[key]} onChange={e=>set(key,e.target.value)} placeholder="0.00" />
          </div>
        ))}
        {rr && (
          <div style={{ gridColumn:'1/-1', background:parseFloat(rr)>=2?C.greenBg:parseFloat(rr)>=1?C.surface2:C.redBg, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:'10px 14px', display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:C.muted }}>Risk / Reward</span>
            <span style={{ fontSize:14, fontWeight:700, color:parseFloat(rr)>=2?C.green:parseFloat(rr)>=1?C.text:C.red, fontFamily:C.mono }}>1 : {rr}</span>
          </div>
        )}
        <div style={{ gridColumn:'1/-1' }}>
          <label style={{ fontSize:11, color:C.dim, display:'block', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.6px' }}>Analysis & Thesis *</label>
          <textarea style={{...inp,height:80,resize:'none'}} value={form.thesis} onChange={e=>set('thesis',e.target.value)} placeholder="Why this trade? Reference COT data, seasonals, price action..." />
        </div>
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={handlePost} disabled={!form.thesis.trim()||posting} style={{ flex:1, background:form.thesis?C.accent:C.surface2, color:form.thesis?'#fff':C.muted, border:'none', padding:'10px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
          {posting?'Posting...':'Post Idea'}
        </button>
        <button onClick={onCancel} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'10px 16px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
      </div>
    </div>
  )
}

function TradeIdeaCard({ idea }) {
  const dirColor = { LONG:C.green, SHORT:C.red, NEUTRAL:C.muted }
  const dirBg    = { LONG:C.greenBg, SHORT:C.redBg, NEUTRAL:C.surface2 }
  const dirLabel = { LONG:'▲ LONG', SHORT:'▼ SHORT', NEUTRAL:'— NEUTRAL' }
  const statusColor = { open:C.accent, hit_target:C.green, hit_stop:C.red, closed:C.muted }

  const rr = idea.entryPrice && idea.stopPrice && idea.targetPrice
    ? (Math.abs(idea.targetPrice - idea.entryPrice) / Math.abs(idea.entryPrice - idea.stopPrice)).toFixed(1)
    : null

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:18, marginBottom:12 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, background:C.surface2, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>
            {idea.author?.name?.charAt(0)?.toUpperCase()||'T'}
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, letterSpacing:'-0.2px' }}>{idea.author?.name}</div>
            <div style={{ fontSize:11, color:C.dim }}>{new Date(idea.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <span style={{ fontSize:11, fontWeight:700, background:dirBg[idea.direction], color:dirColor[idea.direction], padding:'3px 10px', borderRadius:4 }}>{dirLabel[idea.direction]}</span>
          <span style={{ fontSize:11, fontWeight:700, color:statusColor[idea.status]||C.muted, background:(statusColor[idea.status]||C.muted)+'15', padding:'3px 8px', borderRadius:4 }}>{idea.status?.replace('_',' ').toUpperCase()}</span>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <span style={{ fontSize:16, fontWeight:700, color:C.text, letterSpacing:'-0.3px' }}>{idea.asset}</span>
        {idea.currentPrice && <span style={{ fontSize:13, color:C.muted, fontFamily:C.mono }}>{idea.currentPrice.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>}
      </div>

      {(idea.entryPrice || idea.stopPrice || idea.targetPrice) && (
        <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
          {[['Entry',idea.entryPrice,C.text],['Stop',idea.stopPrice,C.red],['Target',idea.targetPrice,C.green]].filter(([,v])=>v).map(([label,val,color])=>(
            <div key={label} style={{ background:C.surface2, borderRadius:4, padding:'6px 10px', textAlign:'center', minWidth:70 }}>
              <div style={{ fontSize:10, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:12, fontWeight:600, color, fontFamily:C.mono }}>{val?.toFixed(2)}</div>
            </div>
          ))}
          {rr && (
            <div style={{ background:parseFloat(rr)>=2?C.greenBg:C.surface2, borderRadius:4, padding:'6px 10px', textAlign:'center', minWidth:70 }}>
              <div style={{ fontSize:10, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>R/R</div>
              <div style={{ fontSize:12, fontWeight:600, color:parseFloat(rr)>=2?C.green:C.muted, fontFamily:C.mono }}>1:{rr}</div>
            </div>
          )}
        </div>
      )}

      <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, letterSpacing:'-0.1px', margin:0 }}>{idea.thesis}</p>
    </div>
  )
}

export default function CreatorDashboard({ currentUserId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('overview')
  const [showCourseBuilder, setShowCourseBuilder] = useState(false)
  const [showIdeaComposer, setShowIdeaComposer] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [ideas, setIdeas] = useState([])

  useEffect(() => {
    fetch('/api/creator/dashboard').then(r=>r.json()).then(d=>{
      if (!d.error) { setData(d); if (d.groups?.[0]) setSelectedGroup(d.groups[0]) }
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedGroup) return
    fetch(`/api/creator/ideas?groupId=${selectedGroup.id}`).then(r=>r.json()).then(d=>setIdeas(d.ideas||[])).catch(()=>{})
  }, [selectedGroup])

  if (loading) return <div style={{ color:C.muted, padding:24, fontSize:13 }}>Loading creator dashboard...</div>
  if (!data) return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:48, textAlign:'center' }}>
      <div style={{ fontSize:13, color:C.muted, marginBottom:8 }}>Creator dashboard requires the Trader plan.</div>
    </div>
  )

  const { stats, groups, tournaments, courses, growth } = data

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, fontWeight:700, color:C.text, margin:'0 0 4px', letterSpacing:'-0.4px' }}>Creator Studio</h2>
          <p style={{ fontSize:13, color:C.dim, margin:0, letterSpacing:'-0.1px' }}>Manage your communities, courses, trade ideas, and tournament revenue.</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>setShowIdeaComposer(true)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>
            Post Trade Idea
          </button>
          <button onClick={()=>setShowCourseBuilder(true)} style={{ background:C.accent, color:'#fff', border:'none', padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
            + Create Course
          </button>
        </div>
      </div>

      {/* Composers */}
      {showCourseBuilder && (
        <div style={{ marginBottom:20 }}>
          <CourseBuilder groupId={selectedGroup?.id} onCreated={c=>{setData(d=>({...d,courses:[c,...d.courses]}));setShowCourseBuilder(false)}} onCancel={()=>setShowCourseBuilder(false)} />
        </div>
      )}
      {showIdeaComposer && (
        <div style={{ marginBottom:20 }}>
          <TradeIdeaComposer groupId={selectedGroup?.id} onPosted={i=>{setIdeas(prev=>[i,...prev]);setShowIdeaComposer(false)}} onCancel={()=>setShowIdeaComposer(false)} />
        </div>
      )}

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard label="Total Members"    value={stats.totalMembers.toLocaleString()} sub="Across all groups" />
        <StatCard label="Monthly Revenue"  value={`$${stats.monthlyRevenue.toFixed(0)}`} sub="Your 95% share" accent={C.green} />
        <StatCard label="Total Earned"     value={`$${stats.totalEarned.toFixed(0)}`} sub="All time" accent={C.gold} />
        <StatCard label="Active Groups"    value={stats.groupCount} sub="Communities" />
      </div>

      {/* View tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
        {[['overview','Overview'],['groups','Groups'],['courses','Courses'],['ideas','Trade Ideas'],['tournaments','Tournaments']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveView(id)}
            style={{ background:'transparent', color:activeView===id?C.accent:C.muted, border:'none', borderBottom:activeView===id?`2px solid ${C.accent}`:'2px solid transparent', padding:'8px 16px', fontSize:12, fontWeight:activeView===id?600:400, cursor:'pointer', fontFamily:C.font, letterSpacing:'-0.1px' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeView==='overview' && (
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16, letterSpacing:'-0.2px' }}>Member Growth</div>
            <GrowthChart data={growth} />
          </div>
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:16, letterSpacing:'-0.2px' }}>Revenue Split</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Your share', pct:95, color:C.green },
                { label:'TradeRing', pct:5,  color:C.accent },
              ].map(item=>(
                <div key={item.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:C.muted }}>{item.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:item.color }}>{item.pct}%</span>
                  </div>
                  <div style={{ height:6, background:C.surface2, borderRadius:99, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${item.pct}%`, background:item.color, borderRadius:99 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:16, padding:'12px 14px', background:C.greenBg, borderRadius:'var(--radius-sm)', border:`1px solid ${C.green}25` }}>
              <div style={{ fontSize:11, color:C.green, fontWeight:600, marginBottom:3 }}>Tournament Hosting Bonus</div>
              <div style={{ fontSize:12, color:C.muted, lineHeight:1.5 }}>As a Trader subscriber you earn 10% of prize pools from tournaments you host, on top of the 95% membership revenue.</div>
            </div>
          </div>
        </div>
      )}

      {/* Groups */}
      {activeView==='groups' && (
        <div>
          {groups.length===0 ? (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:40, textAlign:'center' }}>
              <div style={{ fontSize:13, color:C.muted }}>No groups yet. Go to the Groups tab to create your first community.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
              {groups.map(g=>(
                <div key={g.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:18 }}>
                  <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:4, letterSpacing:'-0.3px' }}>{g.name}</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:14 }}>{g.isPrivate?'Private':'Public'} · {g.monthlyPrice>0?`$${g.monthlyPrice}/mo`:'Free'}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'Members', value:g.memberCount },
                      { label:'Monthly Rev.', value:`$${g.monthlyRevenue.toFixed(0)}` },
                    ].map(s=>(
                      <div key={s.label} style={{ background:C.surface2, borderRadius:'var(--radius-sm)', padding:'8px 10px' }}>
                        <div style={{ fontSize:10, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{s.label}</div>
                        <div style={{ fontSize:15, fontWeight:700, color:C.text, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Courses */}
      {activeView==='courses' && (
        <div>
          {courses.length===0 ? (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:40, textAlign:'center' }}>
              <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>No courses yet. Courses are a powerful way to earn extra revenue from your community.</div>
              <button onClick={()=>setShowCourseBuilder(true)} style={{ background:C.accent, color:'#fff', border:'none', padding:'9px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Create First Course</button>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {courses.map(c=>(
                <div key={c.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text, letterSpacing:'-0.2px' }}>{c.title}</div>
                    <span style={{ fontSize:11, fontWeight:600, color:c.published?C.green:C.muted, background:c.published?C.greenBg:C.surface2, padding:'2px 8px', borderRadius:4 }}>{c.published?'Live':'Draft'}</span>
                  </div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>{c.enrollments} enrolled · {c.price>0?`$${c.price}`:'Free'}</div>
                  <button onClick={async()=>{ await fetch('/api/creator/courses',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:c.id,published:!c.published})}); setData(d=>({...d,courses:d.courses.map(x=>x.id===c.id?{...x,published:!x.published}:x)})) }}
                    style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border}`, padding:'6px 14px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font, width:'100%' }}>
                    {c.published?'Unpublish':'Publish'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trade Ideas */}
      {activeView==='ideas' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            {groups.map(g=>(
              <button key={g.id} onClick={()=>setSelectedGroup(g)}
                style={{ padding:'4px 12px', borderRadius:4, border:`1px solid ${selectedGroup?.id===g.id?C.accent:C.border2}`, background:selectedGroup?.id===g.id?C.accent:'transparent', color:selectedGroup?.id===g.id?'#fff':C.muted, fontSize:12, cursor:'pointer', fontFamily:C.font }}>
                {g.name}
              </button>
            ))}
          </div>
          {ideas.length===0 ? (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:40, textAlign:'center' }}>
              <div style={{ fontSize:13, color:C.muted, marginBottom:12 }}>No trade ideas posted yet.</div>
              <button onClick={()=>setShowIdeaComposer(true)} style={{ background:C.accent, color:'#fff', border:'none', padding:'9px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Post First Idea</button>
            </div>
          ) : (
            <div>{ideas.map(idea=><TradeIdeaCard key={idea.id} idea={idea} />)}</div>
          )}
        </div>
      )}

      {/* Tournaments */}
      {activeView==='tournaments' && (
        <div>
          <div style={{ background:C.goldBg, border:`1px solid ${C.gold}30`, borderRadius:C.radiusLg, padding:'14px 18px', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.gold, marginBottom:4 }}>Tournament Hosting Revenue</div>
            <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
              As a Trader subscriber, you earn <strong style={{ color:C.text }}>10% of every prize pool</strong> from tournaments you host. TradeRing takes 5%, and the remaining 85% goes to your competitors. The more traders enter your tournaments, the more you earn.
            </div>
          </div>
          {tournaments.length===0 ? (
            <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:40, textAlign:'center' }}>
              <div style={{ fontSize:13, color:C.muted }}>No tournaments yet. Create one from the Compete tab.</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
              {tournaments.map(t=>(
                <div key={t.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:C.radiusLg, padding:18 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text, marginBottom:4, letterSpacing:'-0.2px' }}>{t.name}</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>{t.entries} entries · {t.status}</div>
                  {t.prizePool > 0 && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                      {[
                        { label:'Prize Pool', value:`$${t.prizePool.toFixed(0)}` },
                        { label:'Your Cut (10%)', value:`$${(t.prizePool*0.1).toFixed(0)}`, color:C.gold },
                      ].map(s=>(
                        <div key={s.label} style={{ background:C.surface2, borderRadius:'var(--radius-sm)', padding:'8px 10px' }}>
                          <div style={{ fontSize:10, color:C.dim, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{s.label}</div>
                          <div style={{ fontSize:15, fontWeight:700, color:s.color||C.text, fontVariantNumeric:'tabular-nums' }}>{s.value}</div>
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
    </div>
  )
}
