'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from './ThemeProvider'

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

const NOTE_COLORS = ['none','#1a2a1a','#2a1a1a','#1a1a2a','#2a2a1a','#2a1a2a']
const NOTE_COLOR_LABELS = ['Default','Green','Red','Blue','Yellow','Purple']

function Label({ children, style }) { return <p style={{ fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',...style }}>{children}</p> }
function Card({ children, style }) { return <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'18px 22px',...style }}>{children}</div> }

// ─── Notes / Research Scratchpad ──────────────────────────────────────────────
export function NotesTab() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = list view, id = editing
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editColor, setEditColor] = useState('none')
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const autoSaveRef = useRef(null)

  useEffect(() => {
    fetch('/api/notes').then(r=>r.json()).then(d=>{if(Array.isArray(d))setNotes(d);setLoading(false)})
  }, [])

  const newNote = async () => {
    const res = await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:'Untitled Note',content:'',tags:[],color:null})})
    const note = await res.json()
    setNotes(n=>[note,...n])
    openEditor(note)
  }

  const openEditor = (note) => {
    setEditing(note.id)
    setEditTitle(note.title)
    setEditContent(note.content||'')
    setEditTags((note.tags||[]).join(', '))
    setEditColor(note.color||'none')
  }

  const saveNote = useCallback(async (id, title, content, tags, color) => {
    const tagArr = tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : []
    await fetch('/api/notes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      id, title, content, tags: tagArr, color: color==='none'?null:color
    })})
    setNotes(n=>n.map(x=>x.id===id?{...x,title,content,tags:tagArr,color:color==='none'?null:color}:x))
  }, [])

  // Auto-save every 2s while editing
  useEffect(() => {
    if (!editing) return
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => {
      saveNote(editing, editTitle, editContent, editTags, editColor)
    }, 2000)
    return () => clearTimeout(autoSaveRef.current)
  }, [editTitle, editContent, editTags, editColor, editing, saveNote])

  const deleteNote = async (id) => {
    await fetch('/api/notes',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setNotes(n=>n.filter(x=>x.id!==id))
    if(editing===id) setEditing(null)
  }

  const togglePin = async (note) => {
    await fetch('/api/notes',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:note.id,isPinned:!note.isPinned})})
    setNotes(n=>n.map(x=>x.id===note.id?{...x,isPinned:!x.isPinned}:x))
  }

  const allTags = [...new Set(notes.flatMap(n=>n.tags||[]))]
  const filtered = notes.filter(n=>{
    const matchTag = !filter || (n.tags||[]).includes(filter)
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.content||'').toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  if (editing) {
    const wordCount = editContent.trim().split(/\s+/).filter(Boolean).length
    return (
      <div style={{ display:'flex',flexDirection:'column',height:'calc(100vh - 200px)' }}>
        {/* Editor toolbar */}
        <div style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:`1px solid ${C.border}`,marginBottom:16,flexWrap:'wrap' }}>
          <button onClick={()=>{saveNote(editing,editTitle,editContent,editTags,editColor);setEditing(null)}} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:2 }}>← NOTES</button>
          <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{ flex:1,background:'transparent',border:'none',fontSize:18,color:C.text,outline:'none',fontFamily:C.font,minWidth:100 }} placeholder="Note title..." />
          <span style={{ fontSize:10,color:C.dim }}>{wordCount} words · auto-saving</span>
          <div style={{ display:'flex',gap:4 }}>
            {NOTE_COLORS.map((col,i)=>(
              <button key={col} onClick={()=>setEditColor(col)} title={NOTE_COLOR_LABELS[i]} style={{ width:16,height:16,background:col==='none'?C.border2:col,border:`2px solid ${editColor===col?C.gold:'transparent'}`,cursor:'pointer',borderRadius:2 }} />
            ))}
          </div>
          <button onClick={()=>deleteNote(editing)} style={{ background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>DELETE</button>
        </div>
        <div style={{ marginBottom:12,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap' }}>
          <Label style={{ margin:0 }}>TAGS:</Label>
          <input value={editTags} onChange={e=>setEditTags(e.target.value)} placeholder="comma, separated, tags" style={{ background:'transparent',border:`1px solid ${C.border2}`,padding:'5px 10px',fontSize:12,color:C.text,outline:'none',fontFamily:C.font,flex:1,minWidth:160 }} />
        </div>
        <textarea
          value={editContent}
          onChange={e=>setEditContent(e.target.value)}
          placeholder={'Start writing your notes, research, or analysis...\n\nTips:\n- Use this for commodity research, webinar notes, book highlights\n- Add tags to organize by topic or instrument\n- Auto-saves every 2 seconds'}
          style={{ flex:1,background:editColor!=='none'?editColor:C.bg,border:`1px solid ${C.border2}`,padding:'20px',fontSize:14,color:C.text,outline:'none',fontFamily:C.font,resize:'none',lineHeight:1.8 }}
        />
      </div>
    )
  }

  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:20,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Research <span style={{ color:C.gold }}>Scratchpad</span></h2>
        <button onClick={newNote} style={{ marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>+ NEW NOTE</button>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..." style={{ flex:1,minWidth:160,background:'transparent',border:`1px solid ${C.border2}`,padding:'8px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font }} />
        {allTags.length>0 && (
          <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
            <button onClick={()=>setFilter('')} style={{ background:!filter?C.gold:'transparent',color:!filter?'#0a0a0a':C.muted,border:`1px solid ${!filter?C.gold:C.border2}`,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>ALL</button>
            {allTags.map(t=><button key={t} onClick={()=>setFilter(t===filter?'':t)} style={{ background:filter===t?C.gold:'transparent',color:filter===t?'#0a0a0a':C.muted,border:`1px solid ${filter===t?C.gold:C.border2}`,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>{t}</button>)}
          </div>
        )}
      </div>

      {loading && <p style={{ color:C.muted,fontSize:13 }}>Loading notes...</p>}

      {!loading && filtered.length===0 && (
        <Card>
          <p style={{ color:C.muted,fontSize:13,margin:'0 0 12px',textAlign:'center' }}>No notes yet. Great uses for the scratchpad:</p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:8 }}>
            {['Commodity research and analysis','Webinar and course notes','Trading rules and reminders','Market observations','Book highlights','Pre-trade thesis drafts'].map(u=>(
              <div key={u} style={{ background:C.bg,border:`1px solid ${C.border}`,padding:'10px 12px',fontSize:12,color:C.muted }}>{u}</div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:10 }}>
        {filtered.map(note=>(
          <div key={note.id} onClick={()=>openEditor(note)} style={{ background:note.color||C.surface,border:`1px solid ${note.isPinned?C.gold:C.border2}`,padding:'16px 18px',cursor:'pointer',minHeight:120,display:'flex',flexDirection:'column',gap:8,position:'relative' }}>
            {note.isPinned && <span style={{ position:'absolute',top:8,right:8,fontSize:12,color:C.gold }}>📌</span>}
            <p style={{ fontSize:14,color:C.text,margin:0,paddingRight:20,fontWeight:400 }}>{note.title}</p>
            <p style={{ fontSize:12,color:C.muted,margin:0,flex:1,lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' }}>
              {note.content || <span style={{ color:C.dim,fontStyle:'italic' }}>Empty note</span>}
            </p>
            {note.tags?.length>0 && (
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                {note.tags.map(t=><span key={t} style={{ fontSize:9,color:C.muted,border:`1px solid ${C.border}`,padding:'1px 6px',letterSpacing:1 }}>{t}</span>)}
              </div>
            )}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
              <span style={{ fontSize:10,color:C.dim }}>{new Date(note.updatedAt).toLocaleDateString()}</span>
              <div style={{ display:'flex',gap:6 }}>
                <button onClick={e=>{e.stopPropagation();togglePin(note)}} style={{ background:'none',border:'none',color:note.isPinned?C.gold:C.muted,cursor:'pointer',fontSize:12,padding:0 }}>📌</button>
                <button onClick={e=>{e.stopPropagation();deleteNote(note.id)}} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:13,padding:0 }}>×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Weekly Review Tab ────────────────────────────────────────────────────────
export function WeeklyReviewTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ weekOf:'', whatWorked:'', whatDidnt:'', biggestLesson:'', nextWeekFocus:'', mentalState:'', rulesFollowed:'', totalTrades:'', pnl:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  useEffect(() => {
    fetch('/api/reviews').then(r=>r.json()).then(d=>{if(Array.isArray(d))setReviews(d);setLoading(false)})
  }, [])

  const getWeekStart = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day===0?-6:1)
    const monday = new Date(d.setDate(diff))
    return monday.toISOString().split('T')[0]
  }

  const openNew = () => {
    setEditing('new')
    setForm({ weekOf: getWeekStart(), whatWorked:'', whatDidnt:'', biggestLesson:'', nextWeekFocus:'', mentalState:'great', rulesFollowed:'', totalTrades:'', pnl:'' })
  }

  const openExisting = (review) => {
    setEditing(review.id)
    setForm({
      weekOf: review.weekOf?.split('T')[0]||'',
      whatWorked: review.whatWorked||'',
      whatDidnt: review.whatDidnt||'',
      biggestLesson: review.biggestLesson||'',
      nextWeekFocus: review.nextWeekFocus||'',
      mentalState: review.mentalState||'',
      rulesFollowed: review.rulesFollowed?.toString()||'',
      totalTrades: review.totalTrades?.toString()||'',
      pnl: review.pnl?.toString()||'',
    })
  }

  const save = async () => {
    const res = await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form, id: editing!=='new'?editing:undefined})})
    const review = await res.json()
    setReviews(r=>{
      const exists = r.find(x=>x.id===review.id)
      return exists ? r.map(x=>x.id===review.id?review:x) : [review,...r]
    })
    setEditing(null)
  }


  const del = async (id) => {
    await fetch('/api/reviews',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    setReviews(r=>r.filter(x=>x.id!==id))
  }

  const ta = { width:'100%',background:C.bg,border:`1px solid ${C.border2}`,padding:'10px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,resize:'vertical',minHeight:80,boxSizing:'border-box',lineHeight:1.7 }
  const inp = { width:'100%',background:'transparent',border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box' }
  const mentalStates = ['great','good','neutral','off','poor']
  const mentalColor = { great:C.green, good:'#8bc34a', neutral:C.gold, off:'#ff8a65', poor:C.red }

  if (editing) return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <button onClick={()=>setEditing(null)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:2 }}>← REVIEWS</button>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:20 }}>
        <div><Label>WEEK OF</Label><input type="date" value={form.weekOf} onChange={e=>set('weekOf',e.target.value)} style={inp} /></div>
        <div><Label>TOTAL TRADES</Label><input value={form.totalTrades} onChange={e=>set('totalTrades',e.target.value)} placeholder="0" style={inp} /></div>
        <div><Label>NET P&L ($)</Label><input value={form.pnl} onChange={e=>set('pnl',e.target.value)} placeholder="0.00" style={inp} /></div>
        <div><Label>RULES FOLLOWED (0-10)</Label><input value={form.rulesFollowed} onChange={e=>set('rulesFollowed',e.target.value)} placeholder="8" style={inp} /></div>
      </div>

      <div style={{ marginBottom:16 }}>
        <Label>MENTAL STATE THIS WEEK</Label>
        <div style={{ display:'flex',gap:8 }}>
          {mentalStates.map(s=><button key={s} onClick={()=>set('mentalState',s)} style={{ flex:1,background:form.mentalState===s?mentalColor[s]:C.border2,color:form.mentalState===s?'#0a0a0a':C.muted,border:'none',padding:'8px',fontSize:10,letterSpacing:1,cursor:'pointer',fontFamily:C.font,textTransform:'uppercase' }}>{s}</button>)}
        </div>
      </div>

      {[['whatWorked','WHAT WORKED THIS WEEK?','Be specific — what setups, decisions, or behaviors led to good outcomes?'],
        ['whatDidnt','WHAT DIDN\'T WORK?','What mistakes did you make? What would you do differently?'],
        ['biggestLesson','BIGGEST LESSON','What is the single most important thing you learned or were reminded of?'],
        ['nextWeekFocus','FOCUS FOR NEXT WEEK','What is the one thing you will work on or watch closely next week?'],
      ].map(([key, label, placeholder])=>(
        <div key={key} style={{ marginBottom:16 }}>
          <Label>{label}</Label>
          <textarea value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={placeholder} style={ta} />
        </div>
      ))}

      <div style={{ display:'flex',gap:10 }}>
        <button onClick={save} style={{ background:C.gold,color:C.surface,border:'none',padding:'12px 32px',fontSize:10,letterSpacing:3,cursor:'pointer',fontFamily:C.font }}>SAVE REVIEW</button>
        <button onClick={()=>setEditing(null)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'12px 20px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>CANCEL</button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex',alignItems:'baseline',gap:16,marginBottom:24,flexWrap:'wrap' }}>
        <h2 style={{ fontSize:28,fontWeight:400,margin:0 }}>Weekly <span style={{ color:C.gold }}>Reviews</span></h2>
        <button onClick={openNew} style={{ marginLeft:'auto',background:C.gold,color:C.surface,border:'none',padding:'7px 18px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>+ THIS WEEK</button>
      </div>

      {loading && <p style={{ color:C.muted,fontSize:13 }}>Loading reviews...</p>}
      {!loading && reviews.length===0 && (
        <Card>
          <p style={{ color:C.muted,fontSize:13,margin:'0 0 8px',textAlign:'center' }}>No reviews yet.</p>
          <p style={{ fontSize:12,color:C.dim,margin:0,textAlign:'center',lineHeight:1.7 }}>Weekly reviews are the single best habit for improving as a trader. The AI can auto-generate a draft based on your journal data.</p>
        </Card>
      )}
      <div style={{ display:'grid',gap:8 }}>
        {reviews.map(r=>{
          const mc = mentalColor[r.mentalState]||C.muted
          return (
            <div key={r.id} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'16px 20px',cursor:'pointer' }} onClick={()=>openExisting(r)}>
              <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:r.whatWorked?10:0,flexWrap:'wrap' }}>
                <span style={{ fontSize:14,color:C.text }}>Week of {new Date(r.weekOf).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                {r.mentalState && <span style={{ fontSize:10,color:mc,border:`1px solid ${mc}`,padding:'2px 8px',letterSpacing:1 }}>{r.mentalState.toUpperCase()}</span>}
                {r.pnl!=null && <span style={{ fontSize:12,color:r.pnl>=0?C.green:C.red,marginLeft:'auto' }}>{r.pnl>=0?'+':''}${r.pnl.toFixed(0)}</span>}
                {r.totalTrades && <span style={{ fontSize:11,color:C.muted }}>{r.totalTrades} trades</span>}
                {r.rulesFollowed!=null && <span style={{ fontSize:11,color:C.gold }}>{r.rulesFollowed}/10 rules</span>}
                <button onClick={e=>{e.stopPropagation();del(r.id)}} style={{ background:'transparent',border:`1px solid ${C.redBorder}`,color:C.red,padding:'3px 8px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>DEL</button>
              </div>
              {r.biggestLesson && <p style={{ fontSize:12,color:C.muted,margin:0,lineHeight:1.6 }}>💡 {r.biggestLesson}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── P&L Calendar Heatmap ──────────────────────────────────────────────────────
export function PnLCalendar({ screenings }) {
  // Build a map of date -> outcome
  const dateMap = {}
  ;(screenings||[]).forEach(s => {
    if (!s.outcome || !s.createdAt) return
    const date = new Date(s.createdAt).toISOString().split('T')[0]
    if (!dateMap[date]) dateMap[date] = { wins:0, losses:0 }
    if (s.outcome==='WIN') dateMap[date].wins++
    else if (s.outcome==='LOSS') dateMap[date].losses++
  })

  // Build last 52 weeks grid
  const weeks = []
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 364)
  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  let current = new Date(startDate)
  while (current <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      const data = dateMap[dateStr]
      week.push({ date: dateStr, data })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const cellColor = (data) => {
    if (!data) return C.border
    if (data.wins > 0 && data.losses === 0) return C.green
    if (data.losses > 0 && data.wins === 0) return C.red
    if (data.wins > 0 && data.losses > 0) return C.gold
    return C.border
  }

  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const DAY_LABELS = ['S','M','T','W','T','F','S']

  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'flex',gap:2,marginBottom:4 }}>
        <div style={{ width:14,flexShrink:0 }} />
        {weeks.map((week,i)=>{
          const firstOfMonth = week.find(d=>d.date.endsWith('-01'))
          return <div key={i} style={{ width:10,flexShrink:0,fontSize:7,color:C.dim,overflow:'hidden' }}>{firstOfMonth?MONTH_LABELS[parseInt(firstOfMonth.date.split('-')[1])-1]:''}</div>
        })}
      </div>
      <div style={{ display:'flex',gap:2 }}>
        <div style={{ display:'flex',flexDirection:'column',gap:1,marginRight:2 }}>
          {DAY_LABELS.map((d,i)=><div key={i} style={{ height:10,fontSize:7,color:C.dim,lineHeight:'10px' }}>{i%2===1?d:''}</div>)}
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} style={{ display:'flex',flexDirection:'column',gap:1 }}>
            {week.map((day,di)=>(
              <div key={di} title={day.date+(day.data?`: ${day.data.wins}W ${day.data.losses}L`:'')} style={{ width:10,height:10,background:cellColor(day.data),opacity:day.data?1:0.3,cursor:'default',borderRadius:1 }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex',gap:12,marginTop:8,fontSize:10,color:C.muted,alignItems:'center' }}>
        <span>Less</span>
        {[C.border,C.green,C.gold,C.red].map(c=><div key={c} style={{ width:10,height:10,background:c,borderRadius:1 }} />)}
        <span>More</span>
        <span style={{ marginLeft:8 }}>■ Green = all wins · ■ Gold = mixed · ■ Red = all losses</span>
      </div>
    </div>
  )
}

// ─── Themes / Settings ────────────────────────────────────────────────────────
export function ThemeSettings() {
  const { theme, set } = useTheme()
  return (
    <div style={{ maxWidth: 520 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Appearance</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Choose how the platform looks and feels.</p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {[
          { id: 'light', label: 'Light', desc: 'Clean white interface, great for daytime' },
          { id: 'dark', label: 'Dark', desc: 'Easy on the eyes in low-light environments' }
        ].map(t => (
          <div key={t.id} onClick={() => set(t.id)} style={{
            flex: 1, cursor: 'pointer',
            border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border2)'}`,
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: theme === t.id ? '0 0 0 3px var(--accent-light)' : 'none',
          }}>
            <div style={{
              height: 96, padding: 16,
              background: t.id === 'light' ? '#f8f9fb' : '#0f1117',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.id === 'light' ? '#4A6FA5' : '#6b8fc4' }} />
                <div style={{ height: 6, width: 40, background: t.id === 'light' ? '#4A6FA5' : '#6b8fc4', borderRadius: 3 }} />
              </div>
              <div style={{ height: 5, width: '85%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
              <div style={{ height: 5, width: '70%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
              <div style={{ height: 5, width: '55%', background: t.id === 'light' ? '#e2e6ed' : '#2e3347', borderRadius: 3 }} />
            </div>
            <div style={{
              padding: '12px 16px',
              background: t.id === 'light' ? '#ffffff' : '#1a1d27',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: t.id === 'light' ? '#111827' : '#f1f3f9', margin: 0 }}>{t.label}</p>
                <p style={{ fontSize: 11, color: t.id === 'light' ? '#6b7280' : '#8b92a8', margin: '2px 0 0' }}>{t.desc}</p>
              </div>
              {theme === t.id && (
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 10 }}>✓</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '14px 16px', background: 'var(--accent-light)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          Your preference is saved automatically and persists across sessions.
        </p>
      </div>
    </div>
  )
}
