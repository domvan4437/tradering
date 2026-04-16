'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',surface3:'var(--surface3)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  greenBg:'var(--green-bg)',redBg:'var(--red-bg)',font:'var(--font)',mono:'var(--font-mono)',
}

const ASSET_TAGS = ['Gold','Silver','Crude Oil','Natural Gas','Corn','Wheat','EUR/USD','GBP/USD','USD/JPY','S&P 500','Nasdaq','Bitcoin','Ethereum','General']

function Avatar({ name, size=32, color }) {
  const initials = (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
  const colors = ['#4A6FA5','#059669','#7c3aed','#d97706','#dc2626','#0891b2']
  const bg = color || colors[(name||'').charCodeAt(0)%colors.length]
  return <div style={{ width:size, height:size, borderRadius:'50%', background:bg, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.38, fontWeight:700, flexShrink:0 }}>{initials}</div>
}

function PostCard({ post, currentUserId, onLike, onDelete }) {
  const [showShare, setShowShare] = useState(false)
  const isOwn = post.userId === currentUserId
  const dirColor = post.direction==='LONG'?C.green:post.direction==='SHORT'?C.red:C.muted
  const timeAgo = (d) => { const diff=(Date.now()-new Date(d))/1000; if(diff<60)return'Just now'; if(diff<3600)return`${Math.floor(diff/60)}m`; if(diff<86400)return`${Math.floor(diff/3600)}h`; return`${Math.floor(diff/86400)}d` }
  const shareUrl = typeof window!=='undefined'?`${window.location.origin}/post/${post.id}`:''
  const shareText = `${post.user?.name||'Trader'} on TradeRing: ${post.content.slice(0,100)}...`

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:'16px 18px', transition:'border-color 0.15s' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:12 }}>
        <Avatar name={post.user?.name} size={36} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{post.user?.name||'Trader'}</span>
            {post.user?.username && <span style={{ fontSize:12, color:C.dim }}>@{post.user.username}</span>}
            <span style={{ fontSize:11, color:C.dim }}>· {timeAgo(post.createdAt)}</span>
            {post.assetTag && <span style={{ fontSize:11, fontWeight:600, color:C.accent, background:C.accent+'15', padding:'1px 8px', borderRadius:99 }}>#{post.assetTag}</span>}
            {post.direction && <span style={{ fontSize:11, fontWeight:700, color:dirColor, background:dirColor+'15', padding:'1px 8px', borderRadius:99 }}>{post.direction}</span>}
          </div>
        </div>
        {isOwn && <button onClick={()=>onDelete(post.id)} style={{ background:'transparent', color:C.dim, border:'none', cursor:'pointer', fontSize:16, padding:'0 4px' }}>×</button>}
      </div>
      {/* Content */}
      <p style={{ fontSize:14, color:C.text, lineHeight:1.7, margin:'0 0 14px', whiteSpace:'pre-wrap' }}>{post.content}</p>
      {/* Actions */}
      <div style={{ display:'flex', alignItems:'center', gap:16, borderTop:`1px solid ${C.border}`, paddingTop:12 }}>
        <button onClick={()=>onLike(post.id)} style={{ background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:5, color:post.likedByMe?C.red:C.muted, fontSize:13, fontFamily:C.font, padding:0 }}>
          {post.likedByMe?'❤️':'🤍'} {post.likesCount||0}
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:5, color:C.muted, fontSize:13 }}>
          💬 {post.commentsCount||0}
        </div>
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <button onClick={()=>setShowShare(s=>!s)} style={{ background:'transparent', border:'none', cursor:'pointer', color:C.muted, fontSize:13, fontFamily:C.font, display:'flex', alignItems:'center', gap:4, padding:0 }}>
            ↗ Share
          </button>
          {showShare && (
            <div style={{ position:'absolute', right:0, bottom:'100%', background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:8, zIndex:100, minWidth:160, boxShadow:'var(--shadow-md)', marginBottom:4 }}>
              <button onClick={()=>{window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,'_blank');setShowShare(false)}} style={{ display:'block', width:'100%', background:'transparent', color:C.text, border:'none', padding:'7px 12px', textAlign:'left', fontSize:13, cursor:'pointer', fontFamily:C.font, borderRadius:4 }}>𝕏 Post to X</button>
              <button onClick={()=>{navigator.clipboard?.writeText(shareUrl);setShowShare(false)}} style={{ display:'block', width:'100%', background:'transparent', color:C.text, border:'none', padding:'7px 12px', textAlign:'left', fontSize:13, cursor:'pointer', fontFamily:C.font, borderRadius:4 }}>🔗 Copy Link</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Feed({ currentUserId }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [assetFilter, setAssetFilter] = useState('')
  const [content, setContent] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [direction, setDirection] = useState('')
  const [posting, setPosting] = useState(false)
  const [showCompose, setShowCompose] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    const params = new URLSearchParams({ filter })
    if (assetFilter) params.set('asset', assetFilter)
    const res = await fetch(`/api/social/posts?${params}`)
    const data = await res.json()
    setPosts(data.posts||[])
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [filter, assetFilter])

  const submitPost = async () => {
    if (!content.trim()) return
    setPosting(true)
    const res = await fetch('/api/social/posts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ content, assetTag, direction }) })
    const data = await res.json()
    if (data.post) { setPosts(prev=>[{ ...data.post, likesCount:0, commentsCount:0, likedByMe:false }, ...prev]); setContent(''); setAssetTag(''); setDirection(''); setShowCompose(false) }
    setPosting(false)
  }

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p => p.id===postId ? { ...p, likedByMe:!p.likedByMe, likesCount:(p.likesCount||0)+(p.likedByMe?-1:1) } : p))
    await fetch('/api/social/posts/like', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ postId }) })
  }

  const handleDelete = async (postId) => {
    setPosts(prev => prev.filter(p => p.id!==postId))
    await fetch('/api/social/posts', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:postId }) })
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:20, alignItems:'start' }}>
      <div>
        {/* Compose */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:16, marginBottom:16 }}>
          {!showCompose ? (
            <button onClick={()=>setShowCompose(true)} style={{ width:'100%', background:C.surface2, border:`1px solid ${C.border}`, borderRadius:'var(--radius-sm)', padding:'12px 16px', textAlign:'left', color:C.dim, fontSize:14, cursor:'text', fontFamily:C.font }}>
              Share a trade idea, market view, or insight...
            </button>
          ) : (
            <div>
              <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="What's your market view? Share a setup, insight, or analysis..." autoFocus
                style={{ width:'100%', minHeight:100, background:C.surface2, border:`1px solid ${C.border2}`, borderRadius:'var(--radius-sm)', padding:12, fontSize:14, color:C.text, fontFamily:C.font, resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6 }} />
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap', alignItems:'center' }}>
                <select value={assetTag} onChange={e=>setAssetTag(e.target.value)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 10px', borderRadius:'var(--radius-sm)', fontSize:12, fontFamily:C.font }}>
                  <option value="">No asset tag</option>
                  {ASSET_TAGS.map(a=><option key={a} value={a}>{a}</option>)}
                </select>
                <div style={{ display:'flex', gap:6 }}>
                  {['','LONG','SHORT'].map(d=>(
                    <button key={d} onClick={()=>setDirection(d)} style={{ background:direction===d?(d==='LONG'?C.green:d==='SHORT'?C.red:C.surface):C.surface2, color:direction===d?'#fff':C.muted, border:`1px solid ${direction===d?(d==='LONG'?C.green:d==='SHORT'?C.red:C.border):C.border}`, padding:'5px 10px', borderRadius:99, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:C.font }}>
                      {d||'Neutral'}
                    </button>
                  ))}
                </div>
                <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                  <button onClick={()=>{setShowCompose(false);setContent('');setAssetTag('');setDirection('')}} style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'7px 14px', borderRadius:'var(--radius-sm)', fontSize:12, cursor:'pointer', fontFamily:C.font }}>Cancel</button>
                  <button onClick={submitPost} disabled={!content.trim()||posting} style={{ background:content.trim()?C.accent:C.surface2, color:content.trim()?'#fff':C.muted, border:'none', padding:'7px 18px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:content.trim()?'pointer':'not-allowed', fontFamily:C.font }}>
                    {posting?'Posting...':'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter bar */}
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          {[['all','All'],['following','Following']].map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)} style={{ background:filter===val?C.accent:C.surface2, color:filter===val?'#fff':C.muted, border:`1px solid ${filter===val?C.accent:C.border}`, padding:'6px 14px', borderRadius:99, fontSize:12, fontWeight:filter===val?600:400, cursor:'pointer', fontFamily:C.font }}>
              {label}
            </button>
          ))}
          <select value={assetFilter} onChange={e=>setAssetFilter(e.target.value)} style={{ background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'6px 10px', borderRadius:99, fontSize:12, fontFamily:C.font, marginLeft:'auto' }}>
            <option value="">All Assets</option>
            {ASSET_TAGS.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Posts */}
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(4)].map((_,i)=>(
              <div key={i} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:20 }}>
                <div style={{ display:'flex', gap:10, marginBottom:12 }}><div style={{ width:36, height:36, borderRadius:'50%', background:C.surface2 }} /><div style={{ flex:1 }}><div style={{ height:12, background:C.surface2, borderRadius:4, width:'40%', marginBottom:8 }} /><div style={{ height:10, background:C.surface2, borderRadius:4, width:'20%' }} /></div></div>
                <div style={{ height:14, background:C.surface2, borderRadius:4, marginBottom:6 }} /><div style={{ height:14, background:C.surface2, borderRadius:4, width:'70%' }} />
              </div>
            ))}
          </div>
        ) : posts.length===0 ? (
          <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', padding:48, textAlign:'center' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📢</div>
            <div style={{ fontSize:14, color:C.muted }}>No posts yet. Be the first to share a trade idea!</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {posts.map(p=><PostCard key={p.id} post={p} currentUserId={currentUserId} onLike={handleLike} onDelete={handleDelete} />)}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Leaderboard />
      </div>
    </div>
  )
}

function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/social/leaderboard').then(r=>r.json()).then(d=>{setData(d.leaderboard||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const medals = ['🥇','🥈','🥉']

  return (
    <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:16 }}>🏆</span>
        <span style={{ fontSize:14, fontWeight:600, color:C.text }}>Leaderboard</span>
      </div>
      {loading ? <div style={{ padding:20, color:C.dim, fontSize:13 }}>Loading...</div> : data.length===0 ? (
        <div style={{ padding:20, color:C.dim, fontSize:13 }}>No ranked traders yet.</div>
      ) : (
        <div>
          {data.slice(0,10).map((trader,i)=>(
            <div key={trader.id} style={{ padding:'10px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, background:trader.isMe?C.accent+'08':C.surface }}>
              <div style={{ width:22, textAlign:'center', fontSize:i<3?16:12, color:i<3?C.text:C.dim }}>{medals[i]||i+1}</div>
              <Avatar name={trader.name} size={28} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, color:trader.isMe?C.accent:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{trader.name}{trader.isMe?' (You)':''}</div>
                <div style={{ fontSize:10, color:C.dim }}>{trader.totalScreenings} screenings{trader.winRate!==null?` · ${trader.winRate}% WR`:''}</div>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:C.gold, fontFamily:C.mono }}>{trader.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Messages({ currentUserId }) {
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageData, setImageData] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const pollRef = useRef(null)

  useEffect(() => {
    fetch('/api/social/messages').then(r=>r.json()).then(d=>{setConversations(d.conversations||[]);setLoading(false)}).catch(()=>setLoading(false))
  }, [])

  const loadMessages = async (userId) => {
    const res = await fetch(`/api/social/messages?userId=${userId}`)
    const data = await res.json()
    setMessages(data.messages||[])
  }

  useEffect(() => {
    if (!activeConv) return
    loadMessages(activeConv.user.id)
    // Poll every 5 seconds for new messages
    pollRef.current = setInterval(() => loadMessages(activeConv.user.id), 5000)
    return () => clearInterval(pollRef.current)
  }, [activeConv])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const handleFileSelect = (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageData(e.target.result)
      if (file.type.startsWith('image/')) setImagePreview(e.target.result)
      else setImagePreview(null)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const sendMessage = async () => {
    if ((!newMsg.trim() && !imageData) || !activeConv) return
    setSending(true)
    const res = await fetch('/api/social/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ toUserId:activeConv.user.id, content:newMsg, imageData })
    })
    const data = await res.json()
    if (data.message) {
      setMessages(prev=>[...prev, data.message])
      setNewMsg(''); setImageData(null); setImagePreview(null)
    }
    setSending(false)
  }

  const timeStr = (d) => new Date(d).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
  const dateStr = (d) => { const diff=(Date.now()-new Date(d))/86400000; return diff<1?'Today':diff<2?'Yesterday':new Date(d).toLocaleDateString() }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:0, background:C.surface, border:`1px solid ${C.border}`, borderRadius:'var(--radius)', overflow:'hidden', minHeight:600 }}>
      {/* Conversations */}
      <div style={{ borderRight:`1px solid ${C.border}`, display:'flex', flexDirection:'column' }}>
        <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.border}`, fontSize:14, fontWeight:700, color:C.text }}>
          💬 Messages
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? <div style={{ padding:20, color:C.dim, fontSize:13 }}>Loading...</div>
          : conversations.length===0 ? (
            <div style={{ padding:24, textAlign:'center', color:C.muted, fontSize:13, lineHeight:1.6 }}>
              No conversations yet.<br/>Find traders in the feed and start a chat.
            </div>
          ) : conversations.map((conv,i)=>(
            <div key={i} onClick={()=>setActiveConv(conv)}
              style={{ padding:'12px 16px', borderBottom:`1px solid ${C.border}`, cursor:'pointer', background:activeConv?.user.id===conv.user.id?C.surface2:C.surface, display:'flex', alignItems:'center', gap:10, transition:'background 0.1s' }}>
              <Avatar name={conv.user.name} size={36} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{conv.user.name}</div>
                <div style={{ fontSize:11, color:C.dim, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {conv.lastMessage?.imageUrl ? '📎 Image' : conv.lastMessage?.content?.slice(0,28)||''}
                </div>
              </div>
              {conv.unread>0 && <div style={{ background:C.accent, color:'#fff', borderRadius:99, fontSize:10, fontWeight:700, padding:'2px 7px', minWidth:18, textAlign:'center' }}>{conv.unread}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      {!activeConv ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:C.muted, gap:12, padding:40 }}>
          <div style={{ fontSize:40 }}>💬</div>
          <div style={{ fontSize:14 }}>Select a conversation to start messaging</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column' }}
          onDragOver={e=>{e.preventDefault();setDragOver(true)}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}>
          {/* Chat header */}
          <div style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:10, background:C.surface2 }}>
            <Avatar name={activeConv.user.name} size={32} />
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{activeConv.user.name}</div>
              {activeConv.user.username && <div style={{ fontSize:11, color:C.dim }}>@{activeConv.user.username}</div>}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'16px 18px', display:'flex', flexDirection:'column', gap:4, maxHeight:420, background:dragOver?C.accent+'08':C.bg, transition:'background 0.15s' }}>
            {dragOver && <div style={{ position:'absolute', inset:0, border:`2px dashed ${C.accent}`, borderRadius:'var(--radius)', display:'flex', alignItems:'center', justifyContent:'center', background:C.accent+'10', zIndex:10, fontSize:14, color:C.accent, fontWeight:600 }}>Drop file to send</div>}
            {messages.map((m,i) => {
              const isMe = m.fromUserId===currentUserId
              const showDate = i===0 || dateStr(messages[i-1]?.createdAt)!==dateStr(m.createdAt)
              return (
                <div key={i}>
                  {showDate && <div style={{ textAlign:'center', fontSize:11, color:C.dim, margin:'10px 0 4px' }}>{dateStr(m.createdAt)}</div>}
                  <div style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', gap:8, alignItems:'flex-end', marginBottom:2 }}>
                    {!isMe && <Avatar name={m.fromUser?.name} size={24} />}
                    <div style={{ maxWidth:'65%' }}>
                      {m.imageUrl && (
                        <div style={{ marginBottom:4 }}>
                          <img src={m.imageUrl} alt="Shared" style={{ maxWidth:'100%', maxHeight:200, borderRadius:8, display:'block', cursor:'pointer' }} onClick={()=>window.open(m.imageUrl,'_blank')} />
                        </div>
                      )}
                      {m.content && (
                        <div style={{ background:isMe?C.accent:C.surface2, color:isMe?'#fff':C.text, padding:'9px 13px', borderRadius:isMe?'14px 14px 3px 14px':'14px 14px 14px 3px', fontSize:13, lineHeight:1.55, display:'inline-block', maxWidth:'100%', wordBreak:'break-word' }}>
                          {m.content}
                        </div>
                      )}
                      <div style={{ fontSize:10, color:C.dim, textAlign:isMe?'right':'left', marginTop:2, paddingLeft:isMe?0:4 }}>{timeStr(m.createdAt)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div style={{ padding:'8px 18px', borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8, background:C.surface2 }}>
              <img src={imagePreview} alt="Preview" style={{ height:48, width:48, objectFit:'cover', borderRadius:6 }} />
              <span style={{ fontSize:12, color:C.muted, flex:1 }}>Image ready to send</span>
              <button onClick={()=>{setImagePreview(null);setImageData(null)}} style={{ background:'transparent', color:C.red, border:'none', fontSize:16, cursor:'pointer' }}>×</button>
            </div>
          )}
          {imageData && !imagePreview && (
            <div style={{ padding:'8px 18px', borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:8, background:C.surface2 }}>
              <span style={{ fontSize:18 }}>📎</span>
              <span style={{ fontSize:12, color:C.muted, flex:1 }}>File ready to send</span>
              <button onClick={()=>setImageData(null)} style={{ background:'transparent', color:C.red, border:'none', fontSize:16, cursor:'pointer' }}>×</button>
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding:'12px 18px', borderTop:`1px solid ${C.border}`, display:'flex', gap:8, alignItems:'center' }}>
            <input type="file" ref={fileInputRef} onChange={e=>handleFileSelect(e.target.files[0])} accept="image/*,.pdf,.txt" style={{ display:'none' }} />
            <button onClick={()=>fileInputRef.current?.click()} title="Attach file" style={{ background:'transparent', color:C.muted, border:`1px solid ${C.border}`, padding:'7px 10px', borderRadius:'var(--radius-sm)', fontSize:16, cursor:'pointer', flexShrink:0 }}>📎</button>
            <input value={newMsg} onChange={e=>setNewMsg(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&(e.preventDefault(),sendMessage())}
              placeholder="Type a message... (Enter to send)"
              style={{ flex:1, background:C.surface2, color:C.text, border:`1px solid ${C.border2}`, padding:'9px 13px', borderRadius:'var(--radius-sm)', fontSize:13, fontFamily:C.font, outline:'none' }} />
            <button onClick={sendMessage} disabled={(!newMsg.trim()&&!imageData)||sending}
              style={{ background:(newMsg.trim()||imageData)?C.accent:C.surface2, color:(newMsg.trim()||imageData)?'#fff':C.muted, border:'none', padding:'9px 18px', borderRadius:'var(--radius-sm)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:C.font, flexShrink:0 }}>
              {sending?'...':'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SocialTab({ currentUserId }) {
  const [activeView, setActiveView] = useState('feed')

  const views = [
    { id:'feed',     label:'📢 Feed' },
    { id:'messages', label:'💬 Messages' },
  ]

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <h2 style={{ fontSize:28, fontWeight:400, margin:0 }}>Community <span style={{ color:C.gold }}>Feed</span></h2>
        <div style={{ display:'flex', gap:8 }}>
          {views.map(v=>(
            <button key={v.id} onClick={()=>setActiveView(v.id)} style={{ background:activeView===v.id?C.accent:C.surface2, color:activeView===v.id?'#fff':C.muted, border:`1px solid ${activeView===v.id?C.accent:C.border}`, padding:'7px 16px', borderRadius:99, fontSize:13, fontWeight:activeView===v.id?600:400, cursor:'pointer', fontFamily:C.font }}>{v.label}</button>
          ))}
        </div>
      </div>
      {activeView==='feed'     && <Feed currentUserId={currentUserId} />}
      {activeView==='messages' && <Messages currentUserId={currentUserId} />}
    </div>
  )
}
