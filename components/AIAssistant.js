'use client'
import { useState, useEffect, useRef } from 'react'

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

function Label({ children, style }) {
  return <p style={{ fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',...style }}>{children}</p>
}
function Card({ children, style }) {
  return <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'18px 22px',...style }}>{children}</div>
}

const QUICK_PROMPTS = [
  { label: 'Analyze my journal', prompt: 'Analyze my last 20 trades. What patterns do you see? What are my biggest strengths and weaknesses?' },
  { label: 'Review open positions', prompt: 'Review my current open positions. Are there any risk concerns I should be aware of? Is my portfolio balanced?' },
  { label: 'Weekly coaching', prompt: 'Give me a coaching session based on my recent trading performance. Be honest about what I need to improve.' },
  { label: 'Best setups today', prompt: 'Based on my watchlist and the 9-stage framework, which commodities look closest to setting up right now?' },
  { label: 'Win rate analysis', prompt: 'Break down my win rate by commodity, direction (long vs short), and month. Where am I most and least profitable?' },
  { label: 'Am I overtrading?', prompt: 'Look at my trading frequency and performance. Am I overtrading? Is trade quality declining over time?' },
  { label: 'Mistake patterns', prompt: 'What are my most common mistakes based on my journal? Which stage of the framework do I fail most often?' },
  { label: 'Position sizing review', prompt: 'Review how I am sizing my positions relative to my account and risk tolerance. Am I being consistent?' },
]

export default function AIAssistant() {
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [includeContext, setIncludeContext] = useState(true)
  const [showSidebar, setShowSidebar] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetch('/api/ai/conversations').then(r=>r.json()).then(d=>{
      if(Array.isArray(d)) setConversations(d)
      setLoadingConvos(false)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const newConversation = async () => {
    const res = await fetch('/api/ai/conversations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title:'New Conversation' }) })
    const convo = await res.json()
    setConversations(c=>[convo,...c])
    setActiveConvo(convo)
    setMessages([])
    inputRef.current?.focus()
  }

  const loadConversation = async (convo) => {
    setActiveConvo(convo)
    // Load messages from DB
    try {
      const res = await fetch(`/api/ai/conversations?id=${convo.id}`)
      // For now load from local state since we don't have a per-convo endpoint
      // Messages are stored in DB but we'll manage them client-side per session
      setMessages([])
    } catch {}
  }

  const deleteConversation = async (id) => {
    await fetch('/api/ai/conversations', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id }) })
    setConversations(c=>c.filter(x=>x.id!==id))
    if (activeConvo?.id === id) { setActiveConvo(null); setMessages([]) }
  }

  const sendMessage = async (text) => {
    const content = text || input.trim()
    if (!content || loading) return
    setInput('')

    let convo = activeConvo
    if (!convo) {
      const res = await fetch('/api/ai/conversations', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title: content.slice(0, 50) }) })
      convo = await res.json()
      setConversations(c=>[convo,...c])
      setActiveConvo(convo)
    }

    const userMsg = { role:'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages: newMessages,
          conversationId: convo.id,
          includeContext,
        }),
      })
      const data = await res.json()
      const assistantMsg = { role:'assistant', content: data.text || 'Sorry, I could not generate a response.' }
      setMessages(m=>[...m, assistantMsg])

      // Update conversation title if it's the first message
      if (messages.length === 0 && content.length > 0) {
        const title = content.slice(0, 60)
        await fetch('/api/ai/conversations', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id: convo.id, title }) })
        setConversations(c=>c.map(x=>x.id===convo.id?{...x,title}:x))
      }
    } catch {
      setMessages(m=>[...m, { role:'assistant', content:'Error connecting to AI. Please try again.' }])
    }
    setLoading(false)
  }

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e8e0d0">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#1a1a1a;padding:1px 5px;border-radius:2px;font-family:inherit">$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div style={{ display:'flex',height:'calc(100vh - 180px)',minHeight:500,gap:0,background:C.bg }}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{ width:240,flexShrink:0,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:C.surface }}>
          <div style={{ padding:'16px 16px 12px',borderBottom:`1px solid ${C.border}` }}>
            <button onClick={newConversation} style={{ width:'100%',background:C.gold,color:C.surface,border:'none',padding:'9px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>+ NEW CHAT</button>
          </div>
          <div style={{ flex:1,overflowY:'auto' }}>
            {loadingConvos && <p style={{ fontSize:11,color:C.muted,padding:'12px 16px' }}>Loading...</p>}
            {conversations.map(convo=>(
              <div key={convo.id} onClick={()=>loadConversation(convo)} style={{ padding:'10px 14px',cursor:'pointer',borderBottom:`1px solid ${C.border}`,background:activeConvo?.id===convo.id?C.bg:'transparent',display:'flex',alignItems:'center',gap:8 }}>
                <span style={{ fontSize:12,color:activeConvo?.id===convo.id?C.gold:C.muted,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{convo.title}</span>
                <button onClick={e=>{e.stopPropagation();deleteConversation(convo.id)}} style={{ background:'none',border:'none',color:C.dim,cursor:'pointer',fontSize:14,padding:0,flexShrink:0,lineHeight:1 }}>×</button>
              </div>
            ))}
            {!loadingConvos && conversations.length===0 && (
              <p style={{ fontSize:11,color:C.dim,padding:'12px 16px',lineHeight:1.7 }}>No conversations yet. Start a new chat to talk with your AI trading coach.</p>
            )}
          </div>
          <div style={{ padding:'12px 16px',borderTop:`1px solid ${C.border}` }}>
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:11,color:C.muted }}>
              <input type="checkbox" checked={includeContext} onChange={e=>setIncludeContext(e.target.checked)} style={{ accentColor:C.gold }} />
              Include my trading data
            </label>
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
        {/* Chat header */}
        <div style={{ padding:'12px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:12,background:C.surface,flexShrink:0 }}>
          <button onClick={()=>setShowSidebar(s=>!s)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>☰</button>
          <span style={{ fontSize:13,color:C.text }}>{activeConvo?.title||'AI Trading Coach'}</span>
          {includeContext && <span style={{ fontSize:10,color:C.green,border:`1px solid ${C.greenBorder}`,padding:'2px 8px',letterSpacing:1 }}>⬤ CONTEXT ON</span>}
        </div>

        {/* Messages */}
        <div style={{ flex:1,overflowY:'auto',padding:'20px' }}>
          {messages.length===0 && (
            <div>
              <div style={{ textAlign:'center',padding:'32px 20px 40px' }}>
                <div style={{ width:48,height:48,background:C.gold,transform:'rotate(45deg)',margin:'0 auto 20px' }} />
                <p style={{ fontSize:18,color:C.text,margin:'0 0 8px',fontWeight:300 }}>AI Trading Coach</p>
                <p style={{ fontSize:13,color:C.muted,maxWidth:400,margin:'0 auto',lineHeight:1.7 }}>
                  I have access to your journal, positions, watchlist, and performance data. Ask me anything about your trading.
                </p>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:8,maxWidth:700,margin:'0 auto' }}>
                {QUICK_PROMPTS.map(qp=>(
                  <button key={qp.label} onClick={()=>sendMessage(qp.prompt)} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'12px 14px',textAlign:'left',cursor:'pointer',fontFamily:C.font,color:C.muted,fontSize:12,lineHeight:1.5 }}>
                    <span style={{ color:C.gold,display:'block',marginBottom:4,fontSize:11,letterSpacing:1 }}>{qp.label}</span>
                    {qp.prompt.slice(0,60)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i)=>(
            <div key={i} style={{ marginBottom:20,display:'flex',gap:12,flexDirection:msg.role==='user'?'row-reverse':'row' }}>
              <div style={{ width:32,height:32,flexShrink:0,background:msg.role==='user'?C.border2:C.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:msg.role==='user'?C.muted:'#0a0a0a',fontFamily:C.font }}>
                {msg.role==='user'?'YOU':'AI'}
              </div>
              <div style={{ maxWidth:'75%',background:msg.role==='user'?C.border2:C.surface,border:`1px solid ${msg.role==='user'?C.border:C.border2}`,padding:'14px 18px',borderRadius:0 }}>
                <div style={{ fontSize:13,color:msg.role==='user'?C.text:'#aaa',lineHeight:1.8 }} dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex',gap:12,marginBottom:20 }}>
              <div style={{ width:32,height:32,flexShrink:0,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:C.surface }}>AI</div>
              <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'14px 18px',display:'flex',gap:6,alignItems:'center' }}>
                {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,background:C.gold,borderRadius:'50%',animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'16px 20px',borderTop:`1px solid ${C.border}`,background:C.surface,flexShrink:0 }}>
          <div style={{ display:'flex',gap:10 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage()} }}
              placeholder="Ask about your trading performance, positions, or market analysis... (Enter to send, Shift+Enter for new line)"
              style={{ flex:1,background:C.bg,border:`1px solid ${C.border2}`,padding:'12px 14px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,resize:'none',minHeight:52,maxHeight:120 }}
              rows={2}
            />
            <button onClick={()=>sendMessage()} disabled={!input.trim()||loading} style={{ background:input.trim()&&!loading?C.gold:'#222',color:input.trim()&&!loading?'#0a0a0a':C.dim,border:'none',padding:'12px 20px',fontSize:11,letterSpacing:2,cursor:input.trim()&&!loading?'pointer':'not-allowed',fontFamily:C.font,alignSelf:'flex-end',flexShrink:0 }}>
              SEND →
            </button>
          </div>
          <p style={{ fontSize:10,color:C.dim,margin:'8px 0 0' }}>The AI has access to your journal, positions, and performance data when "Include my trading data" is enabled.</p>
        </div>
      </div>
    </div>
  )
}
