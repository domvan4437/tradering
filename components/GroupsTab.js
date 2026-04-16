'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',font:'var(--font)',mono:'var(--font-mono)',
}

const CATEGORIES = ['All','Futures','Forex','Commodities','Stocks','Crypto','Options','Education','General']

function Avatar({ name, size=32 }) {
  const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const colors = ['#4A6FA5','#059669','#7c3aed','#d97706','#dc2626','#0891b2']
  const bg = colors[(name||'').charCodeAt(0)%colors.length]
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, flexShrink:0 }}>{initials}</div>
}

function GroupCard({ group, onJoin, onOpen, isMember }) {
  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden', transition:'all 0.15s', cursor:'pointer' }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.borderColor=C.accent}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='none';e.currentTarget.style.borderColor=C.border}}>
      {/* Header bar */}
      <div style={{ height:6, background:group.price>0?C.gold:C.green }} />
      <div style={{ padding:'18px 18px 14px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <Avatar name={group.name} size={44} />
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:C.text }}>{group.name}</div>
              <div style={{ fontSize:11, color:C.dim }}>by {group.owner?.name||'Creator'}</div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            {group.price>0 ? (
              <div style={{ fontSize:16, fontWeight:700, color:C.gold }}>${group.price}<span style={{ fontSize:11, color:C.muted }}>/mo</span></div>
            ) : (
              <div style={{ fontSize:12, fontWeight:600, color:C.green, background:'var(--green-bg)', padding:'3px 10px', borderRadius:99 }}>FREE</div>
            )}
          </div>
        </div>
        {group.description && <p style={{ fontSize:13, color:C.muted, margin:'0 0 14px', lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{group.description}</p>}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <span style={{ fontSize:12, color:C.dim }}>👥 {(group._count?.members||group.memberCount)||0} members</span>
          {group.category && <span style={{ fontSize:11, color:C.accent, background:C.accent+'15', padding:'2px 8px', borderRadius:99, fontWeight:500 }}>{group.category}</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {isMember ? (
            <button onClick={()=>onOpen(group)} style={{ flex:1, background:C.accent, color:'#fff', border:'none', padding:'9px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Open Group →</button>
          ) : (
            <button onClick={()=>onJoin(group)} style={{ flex:1, background:group.price>0?C.gold:C.accent, color:'#fff', border:'none', padding:'9px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
              {group.price>0?`Join for $${group.price}/mo`:'Join Free'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupIdeas({ groupId, currentUserId }) {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/creator/ideas?groupId=${groupId}`).then(r=>r.json()).then(d=>{setIdeas(d.ideas||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [groupId])

  const dirColor = { LONG:C.green, SHORT:C.red, NEUTRAL:C.muted }
  const dirBg    = { LONG:'var(--green-bg)', SHORT:'var(--red-bg)', NEUTRAL:C.surface2 }

  if (loading) return <div style={{ color:C.dim, fontSize:12, padding:20 }}>Loading ideas...</div>
  if (ideas.length===0) return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:40, textAlign:'center' }}>
      <div style={{ fontSize:13, color:C.muted }}>No trade ideas posted in this group yet.</div>
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {ideas.map(idea => {
        const rr = idea.entryPrice && idea.stopPrice && idea.targetPrice
          ? (Math.abs(idea.targetPrice-idea.entryPrice)/Math.abs(idea.entryPrice-idea.stopPrice)).toFixed(1) : null
        return (
          <div key={idea.id} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:32, height:32, background:C.surface2, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:C.accent }}>
                {idea.author?.name?.charAt(0)?.toUpperCase()||'T'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, letterSpacing:'-0.2px' }}>{idea.author?.name}</div>
                <div style={{ fontSize:11, color:C.dim }}>{new Date(idea.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <span style={{ fontSize:11, fontWeight:700, background:dirBg[idea.direction], color:dirColor[idea.direction], padding:'3px 10px', borderRadius:4, letterSpacing:'0.2px' }}>
                  {idea.direction==='LONG'?'▲ LONG':idea.direction==='SHORT'?'▼ SHORT':'— NEUTRAL'}
                </span>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, letterSpacing:'-0.2px' }}>{idea.asset}</span>
              </div>
            </div>
            {(idea.entryPrice||idea.stopPrice||idea.targetPrice) && (
              <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                {[['Entry',idea.entryPrice,C.text],['Stop',idea.stopPrice,C.red],['Target',idea.targetPrice,C.green]].filter(([,v])=>v).map(([l,v,color])=>(
                  <div key={l} style={{ background:C.surface2, borderRadius:4, padding:'5px 10px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>{l}</div>
                    <div style={{ fontSize:12, fontWeight:600, color, fontFamily:C.mono }}>{v?.toFixed(2)}</div>
                  </div>
                ))}
                {rr && <div style={{ background:parseFloat(rr)>=2?'var(--green-bg)':C.surface2, borderRadius:4, padding:'5px 10px', textAlign:'center' }}><div style={{ fontSize:9, color:C.dim, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>R/R</div><div style={{ fontSize:12, fontWeight:600, color:parseFloat(rr)>=2?C.green:C.muted, fontFamily:C.mono }}>1:{rr}</div></div>}
              </div>
            )}
            <p style={{ fontSize:13, color:C.muted, lineHeight:1.65, margin:0, letterSpacing:'-0.1px' }}>{idea.thesis}</p>
          </div>
        )
      })}
    </div>
  )
}

function GroupCourses({ groupId, currentUserId }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState(null)
  const [activeLesson, setActiveLesson] = useState(null)

  useEffect(() => {
    fetch(`/api/creator/courses?groupId=${groupId}`).then(r=>r.json()).then(d=>{setCourses(d.courses?.filter(c=>c.published)||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [groupId])

  if (loading) return <div style={{ color:C.dim, fontSize:12, padding:20 }}>Loading courses...</div>
  if (courses.length===0) return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:40, textAlign:'center' }}>
      <div style={{ fontSize:13, color:C.muted }}>No courses available in this group yet.</div>
    </div>
  )

  if (activeCourse && activeLesson) return (
    <div>
      <button onClick={()=>setActiveLesson(null)} style={{ background:C.surface2, color:C.muted, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font, marginBottom:16 }}>← Back to course</button>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:16, letterSpacing:'-0.3px' }}>{activeLesson.title}</h2>
      {activeLesson.videoUrl && <div style={{ background:C.surface2, borderRadius:'var(--radius)', padding:20, marginBottom:16, textAlign:'center' }}><a href={activeLesson.videoUrl} target="_blank" rel="noopener noreferrer" style={{ color:C.accent, fontSize:13 }}>Watch Video →</a></div>}
      <div style={{ fontSize:14, color:C.muted, lineHeight:1.8, whiteSpace:'pre-wrap', letterSpacing:'-0.1px' }}>{activeLesson.content}</div>
    </div>
  )

  if (activeCourse) return (
    <div>
      <button onClick={()=>setActiveCourse(null)} style={{ background:C.surface2, color:C.muted, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font, marginBottom:16 }}>← Back to courses</button>
      <h2 style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:4, letterSpacing:'-0.3px' }}>{activeCourse.title}</h2>
      {activeCourse.description && <p style={{ fontSize:13, color:C.muted, marginBottom:16 }}>{activeCourse.description}</p>}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {activeCourse.lessons?.map((lesson, i) => (
          <div key={lesson.id} onClick={()=>setActiveLesson(lesson)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:12, transition:'border-color 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.accent}
            onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
            <div style={{ width:24, height:24, background:lesson.free?C.greenBg:C.surface2, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:lesson.free?C.green:C.dim, flexShrink:0 }}>{i+1}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:500, color:C.text, letterSpacing:'-0.1px' }}>{lesson.title}</div>
              {lesson.free && <span style={{ fontSize:10, color:C.green, fontWeight:600 }}>FREE PREVIEW</span>}
            </div>
            <span style={{ fontSize:12, color:C.dim }}>→</span>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
      {courses.map(course => (
        <div key={course.id} onClick={()=>setActiveCourse(course)} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20, cursor:'pointer', transition:'all 0.15s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.accent;e.currentTarget.style.boxShadow='var(--shadow-md)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.boxShadow='none'}}>
          <div style={{ fontSize:15, fontWeight:600, color:C.text, marginBottom:6, letterSpacing:'-0.2px' }}>{course.title}</div>
          {course.description && <p style={{ fontSize:12, color:C.muted, margin:'0 0 12px', lineHeight:1.6 }}>{course.description}</p>}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, color:C.dim }}>{course.lessons?.length||0} lessons</span>
            <span style={{ fontSize:13, fontWeight:700, color:course.price>0?C.gold:C.green }}>{course.price>0?`$${course.price}`:'Free'}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function GroupRoom({ group, onBack, currentUserId }) {
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [activeView, setActiveView] = useState('chat')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetch(`/api/groups/channels?groupId=${group.id}`).then(r=>r.json()).then(d=>{
      setChannels(d.channels||[])
      if (d.channels?.length) setActiveChannel(d.channels[0])
    }).catch(()=>{})
  }, [group.id])

  useEffect(() => {
    if (!activeChannel) return
    fetch(`/api/groups/messages?channelId=${activeChannel.id}`).then(r=>r.json()).then(d=>setMessages(d.messages||[])).catch(()=>{})
  }, [activeChannel])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const sendMessage = async () => {
    if (!newMsg.trim()||!activeChannel) return
    setSending(true)
    const res = await fetch('/api/groups/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ channelId:activeChannel.id, content:newMsg }) })
    const data = await res.json()
    if (data.message) { setMessages(prev=>[...prev, data.message]); setNewMsg('') }
    setSending(false)
  }

  const timeAgo = (d) => { const diff=(Date.now()-new Date(d))/1000; if(diff<60)return'Just now'; if(diff<3600)return`${Math.floor(diff/60)}m`; if(diff<86400)return`${Math.floor(diff/3600)}h`; return new Date(d).toLocaleDateString() }

  return (
    <div>
      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={{ background:C.surface2, color:C.muted, border:`1px solid ${C.border}`, padding:'6px 12px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>← Back</button>
        <Avatar name={group.name} size={32} />
        <div>
          <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{group.name}</div>
          <div style={{ fontSize:11, color:C.dim }}>{(group._count?.members||group.memberCount)||0} members</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {['chat','ideas','courses'].map(v=>(
            <button key={v} onClick={()=>setActiveView(v)} style={{ background:activeView===v?C.accent:C.surface2, color:activeView===v?'#fff':C.muted, border:`1px solid ${activeView===v?C.accent:C.border}`, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:C.font, textTransform:'capitalize' }}>{v==='ideas'?'Trade Ideas':v.charAt(0).toUpperCase()+v.slice(1)}</button>
          ))}
        </div>
      </div>

      {activeView==='chat' && (
        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:0, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden', minHeight:500 }}>
          {/* Channel list */}
          <div style={{ borderRight:`1px solid ${C.border}` }}>
            <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.border}`, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.5 }}>Channels</div>
            {channels.map(ch=>(
              <div key={ch.id} onClick={()=>setActiveChannel(ch)} style={{ padding:'9px 14px', cursor:'pointer', background:activeChannel?.id===ch.id?C.surface2:C.surface, borderBottom:`1px solid ${C.border}`, fontSize:13, color:activeChannel?.id===ch.id?C.text:C.muted, display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ color:C.dim, fontSize:12 }}>{ch.type==='announcements'?'📢':'#'}</span>
                {ch.name}
              </div>
            ))}
          </div>

          {/* Messages */}
          <div style={{ display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, fontSize:14, fontWeight:600, color:C.text }}>
              {activeChannel?.type==='announcements'?'📢':' #'} {activeChannel?.name}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12, maxHeight:380 }}>
              {messages.length===0 ? (
                <div style={{ textAlign:'center', color:C.dim, fontSize:13, padding:24 }}>No messages yet. Start the conversation!</div>
              ) : messages.map((m,i)=>{
                const isMe = m.userId===currentUserId
                return (
                  <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <Avatar name={m.user?.name} size={28} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:4 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:isMe?C.accent:C.text }}>{m.user?.name||'Member'}</span>
                        <span style={{ fontSize:11, color:C.dim }}>{timeAgo(m.createdAt)}</span>
                      </div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.6, background:C.surface2, padding:'8px 12px', borderRadius:'2px 12px 12px 12px', display:'inline-block', maxWidth:'80%' }}>{m.content}</div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
            {activeChannel?.type!=='announcements' && (
              <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8 }}>
                <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendMessage()} placeholder={`Message #${activeChannel?.name}`} style={{ flex:1, background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none' }} />
                <button onClick={sendMessage} disabled={!newMsg.trim()||sending} style={{ background:newMsg.trim()?C.accent:C.surface2, color:newMsg.trim()?'#fff':C.muted, border:'none', padding:'8px 16px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>Send</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView==='ideas' && <GroupIdeas groupId={group.id} currentUserId={currentUserId} />}
      {activeView==='courses' && <GroupCourses groupId={group.id} currentUserId={currentUserId} />}
    </div>
  )
}

export default function GroupsTab({ currentUserId }) {
  const [view, setView] = useState('browse')
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState(null)
  const [catFilter, setCatFilter] = useState('All')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name:'', description:'', price:'0', category:'General', isPublic:true })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/groups').then(r=>r.json()),
      fetch('/api/groups?mine=1').then(r=>r.json()),
    ]).then(([all, mine]) => {
      setGroups(all.groups||[])
      setMyGroups(mine.groups||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [])

  const isMember = (groupId) => myGroups.some(g => g.id===groupId)

  const handleJoin = async (group) => {
    if (group.price>0) { alert(`Paid groups ($${group.price}/mo) will require payment integration. Coming soon!`); return }
    const res = await fetch('/api/groups/join', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ groupId:group.id }) })
    const data = await res.json()
    if (data.joined) { setMyGroups(prev=>[...prev, group]); setActiveGroup(group); setView('room') }
  }

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    const res = await fetch('/api/groups', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    const data = await res.json()
    if (data.group) {
      setGroups(prev=>[data.group,...prev])
      setMyGroups(prev=>[data.group,...prev])
      setActiveGroup(data.group)
      setView('room')
      setShowCreate(false)
    }
    setCreating(false)
  }

  const filtered = groups.filter(g => catFilter==='All' || g.category===catFilter)

  if (view==='room' && activeGroup) return <GroupRoom group={activeGroup} onBack={()=>{setView('browse');setActiveGroup(null)}} currentUserId={currentUserId} />

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:28, fontWeight:400, margin:'0 0 6px' }}>Trading <span style={{ color:C.gold }}>Groups</span></h2>
          <p style={{ fontSize:13, color:C.muted, margin:0 }}>Join free or paid groups, access private courses, and trade alongside other serious traders.</p>
        </div>
        <button onClick={()=>setShowCreate(s=>!s)} style={{ background:C.accent, color:'#fff', border:'none', padding:'9px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
          + Create Group
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20, marginBottom:20 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:C.text, margin:'0 0 16px' }}>Create Your Group</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Group Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Gold Futures Mastery" style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Category</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 10px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font }}>
                {CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Description</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="What will members learn or gain from joining your group?" style={{ width:'100%', height:80, background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', resize:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:11, color:C.muted, display:'block', marginBottom:6, fontWeight:600, textTransform:'uppercase' }}>Monthly Price (USD)</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:C.muted, fontSize:13 }}>$</span>
                <input type="number" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} style={{ width:'100%', background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'8px 12px 8px 22px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none', boxSizing:'border-box' }} />
              </div>
              {parseFloat(form.price)>0 && <div style={{ fontSize:11, color:C.dim, marginTop:4 }}>TradeRing keeps 5% · You earn ${(parseFloat(form.price)*0.95).toFixed(2)}/member/mo</div>}
              {parseFloat(form.price)===0 && <div style={{ fontSize:11, color:C.green, marginTop:4 }}>Free group — unlimited members</div>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <label style={{ fontSize:11, color:C.muted, fontWeight:600, textTransform:'uppercase' }}>Public Group</label>
              <input type="checkbox" checked={form.isPublic} onChange={e=>setForm(f=>({...f,isPublic:e.target.checked}))} />
              <span style={{ fontSize:11, color:C.dim }}>Visible in directory</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleCreate} disabled={!form.name.trim()||creating} style={{ background:form.name.trim()?C.accent:C.surface2, color:form.name.trim()?'#fff':C.muted, border:'none', padding:'9px 20px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
              {creating?'Creating...':'Create Group'}
            </button>
            <button onClick={()=>setShowCreate(false)} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'9px 16px', borderRadius:'var(--radius-sm)', fontSize:13, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
          </div>
        </div>
      )}

      {/* My Groups */}
      {myGroups.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:C.text, margin:'0 0 12px' }}>Your Groups</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {myGroups.map(g=><GroupCard key={g.id} group={g} onJoin={handleJoin} onOpen={(g)=>{setActiveGroup(g);setView('room')}} isMember={true} />)}
          </div>
        </div>
      )}

      {/* Browse */}
      <div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Discover Groups</h3>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCatFilter(c)} style={{ background:catFilter===c?C.accent:C.surface2, color:catFilter===c?'#fff':C.muted, border:`1px solid ${catFilter===c?C.accent:C.border}`, padding:'4px 12px', borderRadius:99, fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:C.font }}>{c}</button>
            ))}
          </div>
        </div>
        {loading ? (
          <div style={{ color:C.muted, fontSize:13 }}>Loading groups...</div>
        ) : filtered.length===0 ? (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🏘</div>
            <h3 style={{ fontSize:16, fontWeight:600, color:C.text, margin:'0 0 8px' }}>No Groups Yet</h3>
            <p style={{ fontSize:13, color:C.muted }}>Be the first to create a group and build your trading community.</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
            {filtered.filter(g=>!isMember(g.id)).map(g=><GroupCard key={g.id} group={g} onJoin={handleJoin} onOpen={(g)=>{setActiveGroup(g);setView('room')}} isMember={false} />)}
          </div>
        )}
      </div>
    </div>
  )
}
