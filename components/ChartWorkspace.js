'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

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

// Symbol categories for quick switching
const SYMBOL_GROUPS = {
  'Index Futures': ['ES1!','NQ1!','YM1!','RTY1!','VX1!'],
  'Metals': ['COMEX:GC1!','COMEX:SI1!','COMEX:HG1!','COMEX:PL1!'],
  'Energy': ['NYMEX:CL1!','NYMEX:NG1!','NYMEX:RB1!','NYMEX:HO1!'],
  'Grains': ['CBOT:ZC1!','CBOT:ZW1!','CBOT:ZS1!'],
  'Softs': ['ICEUS:KC1!','ICEUS:SB1!','ICEUS:CT1!','ICEUS:CC1!'],
  'Livestock': ['CME:LE1!','CME:HE1!'],
  'Bonds': ['CBOT:ZN1!','CBOT:ZB1!','CBOT:ZF1!'],
  'FX': ['FX:EURUSD','FX:USDJPY','FX:GBPUSD','FX:USDCAD'],
  'Stocks': ['AAPL','NVDA','MSFT','GOOGL','META','AMZN','TSLA','JPM'],
  'ETFs': ['SPY','QQQ','IWM','GLD','TLT','XLK','XLE'],
}

const TIMEFRAMES = [
  { label:'1m', tv:'1' }, { label:'5m', tv:'5' }, { label:'15m', tv:'15' },
  { label:'1H', tv:'60' }, { label:'4H', tv:'240' }, { label:'D', tv:'D' },
  { label:'W', tv:'W' }, { label:'M', tv:'M' },
]

const PANEL_CONFIGS = [
  { id:'chart-only', label:'Chart Only', icon:'◻' },
  { id:'chart-notes', label:'Chart + Notes', icon:'◫' },
  { id:'chart-ai', label:'Chart + AI', icon:'◨' },
  { id:'chart-data', label:'Chart + Data', icon:'⊟' },
  { id:'triple', label:'Triple Panel', icon:'⊞' },
]

function Label({ children, style }) {
  return <p style={{ fontSize:10,letterSpacing:3,color:C.muted,margin:'0 0 8px',textTransform:'uppercase',...style }}>{children}</p>
}

// ─── TradingView Widget ───────────────────────────────────────────────────────
function TradingViewChart({ symbol, interval, theme, onSymbolChange, height }) {
  const containerRef = useRef(null)
  const scriptRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const containerId = `tv_${Math.random().toString(36).slice(2)}`
    const div = document.createElement('div')
    div.id = containerId
    div.style.height = '100%'
    containerRef.current.appendChild(div)

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/tv.js'
    script.async = true
    script.onload = () => {
      if (!window.TradingView) return
      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: symbol || 'NQ1!',
        interval: interval || 'D',
        timezone: 'America/New_York',
        theme: theme === 'dark' ? 'dark' : 'light',
        style: '1',
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#0f1117' : '#ffffff',
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: true,
        container_id: containerId,
        backgroundColor: theme === 'dark' ? '#0f1117' : '#ffffff',
        gridColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        studies: [],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '700',
        withdateranges: true,
        allow_symbol_change: true,
        details: true,
        hotlist: true,
        calendar: true,
      })
    }
    document.head.appendChild(script)
    scriptRef.current = script

    return () => {
      if (scriptRef.current) scriptRef.current.remove()
    }
  }, [symbol, interval])

  return <div ref={containerRef} style={{ width:'100%',height: height||'100%' }} />
}

// ─── Lightweight Analytics Chart (COT + Seasonal overlay) ────────────────────
function AnalyticsChart({ symbol, cotData, seasonalData }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0,0,w,h)
    ctx.fillStyle = C.bg
    ctx.fillRect(0,0,w,h)

    // COT Index bar
    if (cotData?.cotIndex != null) {
      const idx = cotData.cotIndex
      const barColor = idx>=70?C.green:idx>=55?'#8bc34a':idx>=40?C.gold:idx>=25?'#ff8a65':C.red
      // Background track
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(20,20,w-40,16)
      // Fill
      ctx.fillStyle = barColor
      ctx.fillRect(20,20,(w-40)*idx/100,16)
      // Label
      ctx.fillStyle = C.muted
      ctx.font = `9px ${C.font}`
      ctx.fillText('COT INDEX', 20, 16)
      ctx.fillStyle = barColor
      ctx.font = `bold 11px ${C.font}`
      ctx.fillText(`${idx}/100 — ${cotData.interpretation||''}`, 20, 50)
    }

    // Seasonal monthly bars
    if (seasonalData?.seasonal) {
      const months = seasonalData.seasonal
      const maxAbs = Math.max(...months.map(m=>Math.abs(m.avgReturn)),0.1)
      const barW = (w-40)/12
      const midY = h - 60
      const barMaxH = 50

      months.forEach((m,i) => {
        const x = 20 + i*barW + 2
        const barH = (Math.abs(m.avgReturn)/maxAbs)*barMaxH
        const isPos = m.avgReturn >= 0
        const isCurrent = i === new Date().getMonth()
        ctx.fillStyle = isCurrent?(isPos?C.green:C.red):isPos?'#1a3d2a':'#3d1a1a'
        ctx.fillRect(x, midY-(isPos?barH:0), barW-4, barH)
        ctx.fillStyle = isCurrent?C.gold:C.muted
        ctx.font = `8px ${C.font}`
        ctx.fillText(m.month.slice(0,1), x+2, midY+12)
        if (isCurrent) {
          ctx.fillStyle = isCurrent?C.gold:C.dim
          ctx.font = `9px ${C.font}`
          ctx.fillText(`${m.avgReturn>0?'+':''}${m.avgReturn}%`, x-4, midY-barH-4)
        }
      })

      ctx.fillStyle = C.muted
      ctx.font = `9px ${C.font}`
      ctx.fillText('SEASONAL PATTERN (15yr avg)', 20, midY-55)
      ctx.fillStyle = C.dim
      ctx.fillText('Current month highlighted', 20, h-8)
    }
  }, [cotData, seasonalData])

  return (
    <canvas ref={canvasRef} width={500} height={180}
      style={{ width:'100%',height:180,display:'block',background:C.bg }} />
  )
}

// ─── Symbol Workspace Context Panel ──────────────────────────────────────────
function WorkspaceContext({ symbol, onAddNote, onAddLevel }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cotData, setCotData] = useState(null)
  const [seasonalData, setSeasonalData] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    if (!symbol) return
    setLoading(true)
    setData(null)
    fetch(`/api/workspace?symbol=${encodeURIComponent(symbol)}`)
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false)})
      .catch(()=>setLoading(false))
  }, [symbol])

  const typeColor = { SUPPORT:C.green, RESISTANCE:C.red, PIVOT:C.blue }

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',overflow:'hidden' }}>
      {/* Section tabs */}
      <div style={{ display:'flex',borderBottom:`1px solid ${C.border}`,flexShrink:0 }}>
        {[['overview','Overview'],['levels','Levels'],['ideas','Ideas'],['notes','Notes'],['history','History']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveSection(id)} style={{ flex:1,background:'transparent',color:activeSection===id?C.text:C.muted,border:'none',borderBottom:`2px solid ${activeSection===id?C.gold:'transparent'}`,padding:'8px 4px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font,textTransform:'uppercase' }}>{label}</button>
        ))}
      </div>

      <div style={{ flex:1,overflowY:'auto',padding:'12px' }}>
        {loading && <p style={{ fontSize:11,color:C.muted }}>Loading {symbol} data...</p>}

        {/* Overview */}
        {activeSection==='overview' && data && (
          <div>
            <p style={{ fontSize:14,color:C.gold,margin:'0 0 12px',fontWeight:400 }}>{symbol}</p>
            <div style={{ display:'grid',gap:8,marginBottom:12 }}>
              {data.positions?.length>0 && (
                <div style={{ background:C.greenBg,border:`1px solid ${C.greenBorder}`,padding:'10px 12px' }}>
                  <Label style={{ margin:'0 0 4px' }}>OPEN POSITION</Label>
                  {data.positions.map(p=>(
                    <p key={p.id} style={{ fontSize:12,color:C.green,margin:0 }}>
                      {p.direction} {p.contracts}x @ {p.entryPrice} | Stop: {p.stopPrice||'—'} | Target: {p.targetPrice||'—'}
                    </p>
                  ))}
                </div>
              )}
              {data.ideas?.length>0 && (
                <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'10px 12px' }}>
                  <Label style={{ margin:'0 0 4px' }}>ACTIVE IDEAS ({data.ideas.length})</Label>
                  {data.ideas.map(i=>(
                    <p key={i.id} style={{ fontSize:11,color:C.muted,margin:'2px 0' }}>
                      [{i.status}] {i.direction||''} — {i.title}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'flex',gap:8 }}>
              <button onClick={()=>onAddNote?.(symbol)} style={{ flex:1,background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'7px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>+ NOTE</button>
              <button onClick={()=>onAddLevel?.(symbol)} style={{ flex:1,background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'7px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>+ LEVEL</button>
            </div>
          </div>
        )}

        {/* Key Levels */}
        {activeSection==='levels' && data && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
              <Label style={{ margin:0 }}>KEY LEVELS — {symbol}</Label>
              <button onClick={()=>onAddLevel?.(symbol)} style={{ background:C.gold,color:C.surface,border:'none',padding:'4px 10px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>+ADD</button>
            </div>
            {data.keyLevels?.length===0 && <p style={{ fontSize:11,color:C.dim }}>No levels saved for {symbol}. Add support/resistance levels using the + button.</p>}
            <div style={{ display:'grid',gap:4 }}>
              {[...data.keyLevels||[]].sort((a,b)=>b.price-a.price).map(level=>(
                <div key={level.id} style={{ background:C.bg,border:`1px solid ${C.border}`,padding:'8px 12px',display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:9,color:typeColor[level.type]||C.muted,border:`1px solid ${typeColor[level.type]||C.border}`,padding:'1px 5px',letterSpacing:1,flexShrink:0 }}>{level.type}</span>
                  <span style={{ fontSize:14,fontWeight:300,color:C.text }}>{level.price.toLocaleString()}</span>
                  <span style={{ fontSize:11,color:C.muted,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{level.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ideas */}
        {activeSection==='ideas' && data && (
          <div>
            <Label>IDEAS — {symbol}</Label>
            {data.ideas?.length===0 && <p style={{ fontSize:11,color:C.dim }}>No active ideas for {symbol}.</p>}
            <div style={{ display:'grid',gap:6 }}>
              {(data.ideas||[]).map(idea=>(
                <div key={idea.id} style={{ background:C.bg,border:`1px solid ${C.border}`,padding:'10px 12px' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                    <span style={{ fontSize:11,color:idea.direction==='BUY'?C.green:idea.direction==='SELL'?C.red:C.gold }}>{idea.direction||'WATCHING'}</span>
                    <span style={{ fontSize:11,color:C.text }}>{idea.title}</span>
                    {idea.confidence && <span style={{ fontSize:10,color:C.gold,marginLeft:'auto' }}>★{idea.confidence}/10</span>}
                  </div>
                  {idea.thesis && <p style={{ fontSize:11,color:C.muted,margin:0,lineHeight:1.5 }}>{idea.thesis.slice(0,100)}{idea.thesis.length>100?'...':''}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {activeSection==='notes' && data && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
              <Label style={{ margin:0 }}>NOTES — {symbol}</Label>
              <button onClick={()=>onAddNote?.(symbol)} style={{ background:C.gold,color:C.surface,border:'none',padding:'4px 10px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>+ADD</button>
            </div>
            {data.notes?.length===0 && <p style={{ fontSize:11,color:C.dim }}>No notes for {symbol}. Add a note to start building your research library for this instrument.</p>}
            <div style={{ display:'grid',gap:6 }}>
              {(data.notes||[]).map(note=>(
                <div key={note.id} style={{ background:note.color||C.bg,border:`1px solid ${C.border}`,padding:'10px 12px' }}>
                  <p style={{ fontSize:12,color:C.text,margin:'0 0 4px' }}>{note.title}</p>
                  <p style={{ fontSize:11,color:C.muted,margin:0,lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical' }}>{note.content||<em>Empty</em>}</p>
                  <p style={{ fontSize:9,color:C.dim,margin:'6px 0 0' }}>{new Date(note.updatedAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screening history */}
        {activeSection==='history' && data && (
          <div>
            <Label>SCREENING HISTORY — {symbol}</Label>
            {data.screenings?.length===0 && <p style={{ fontSize:11,color:C.dim }}>No screenings found for {symbol}.</p>}
            <div style={{ display:'grid',gap:4 }}>
              {(data.screenings||[]).map(s=>(
                <div key={s.id} style={{ background:C.bg,border:`1px solid ${C.border}`,padding:'8px 12px' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap' }}>
                    <span style={{ fontSize:10,background:s.passed?C.gold:'#8b2020',color:C.surface,padding:'1px 7px' }}>{s.passed?'PASS':'FAIL'}</span>
                    {s.direction && <span style={{ fontSize:10,color:s.direction==='BUY'?C.green:C.red }}>{s.direction}</span>}
                    {s.outcome && <span style={{ fontSize:10,color:s.outcome==='WIN'?C.green:C.red }}>{s.outcome}</span>}
                    <span style={{ fontSize:10,color:C.dim,marginLeft:'auto' }}>{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  {s.stageFailed && <p style={{ fontSize:10,color:C.muted,margin:'4px 0 0' }}>Failed: {s.stageFailed}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Workspace AI Panel ───────────────────────────────────────────────────────
function WorkspaceAI({ symbol }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' })
  }, [messages])

  // Reset when symbol changes
  useEffect(() => {
    if (symbol) {
      setMessages([{
        role:'assistant',
        content:`I'm ready to help you analyze **${symbol}**. I have access to your notes, key levels, ideas, and screening history for this instrument.\n\nWhat would you like to know?`
      }])
    }
  }, [symbol])

  const QUICK = [
    { label:`Analyze ${symbol}`, prompt:`Run a quick analysis of ${symbol} using the 9-stage framework. What signals are currently present?` },
    { label:'Key levels', prompt:`What key levels should I be watching on ${symbol} right now based on market structure?` },
    { label:'Trade plan', prompt:`Help me build a trade plan for ${symbol}. What would a good entry, stop, and target look like based on current conditions?` },
    { label:'Review my data', prompt:`Review my notes, ideas, and screening history for ${symbol}. What patterns or themes do you see?` },
  ]

  const send = async (text) => {
    const content = text||input.trim()
    if (!content||loading) return
    setInput('')
    const userMsg = { role:'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        messages: newMessages.map(m => ({
          ...m,
          content: m === userMsg ? `[Currently viewing chart: ${symbol}]\n\n${content}` : m.content
        })),
        includeContext: true,
      })})
      const data = await res.json()
      setMessages(m=>[...m,{ role:'assistant', content: data.text||'Error' }])
    } catch { setMessages(m=>[...m,{ role:'assistant', content:'Connection error.' }]) }
    setLoading(false)
  }

  const fmt = (text) => text
    .replace(/\*\*(.*?)\*\*/g,'<strong style="color:#e8e0d0">$1</strong>')
    .replace(/\n/g,'<br/>')

  return (
    <div style={{ display:'flex',flexDirection:'column',height:'100%',overflow:'hidden' }}>
      <div style={{ padding:'10px 12px',borderBottom:`1px solid ${C.border}`,flexShrink:0,display:'flex',alignItems:'center',gap:8 }}>
        <div style={{ width:8,height:8,background:C.gold,transform:'rotate(45deg)' }} />
        <span style={{ fontSize:11,color:C.gold,letterSpacing:2 }}>AI COACH</span>
        <span style={{ fontSize:11,color:C.muted,marginLeft:4 }}>— {symbol}</span>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'12px',display:'flex',flexDirection:'column',gap:10 }}>
        {messages.map((m,i)=>(
          <div key={i} style={{ display:'flex',gap:8,flexDirection:m.role==='user'?'row-reverse':'row' }}>
            <div style={{ width:24,height:24,flexShrink:0,background:m.role==='user'?C.border2:C.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:m.role==='user'?C.muted:'#0a0a0a',fontFamily:C.font }}>
              {m.role==='user'?'YOU':'AI'}
            </div>
            <div style={{ maxWidth:'85%',background:m.role==='user'?C.border2:C.surface,border:`1px solid ${m.role==='user'?C.border:C.border2}`,padding:'10px 12px' }}>
              <div style={{ fontSize:12,color:m.role==='user'?C.text:'#aaa',lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html:fmt(m.content) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex',gap:8 }}>
            <div style={{ width:24,height:24,background:C.gold,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:C.surface }}>AI</div>
            <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'10px 12px',display:'flex',gap:4 }}>
              {[0,1,2].map(i=><div key={i} style={{ width:5,height:5,background:C.gold,borderRadius:'50%',animation:`pulse 1.2s ${i*0.2}s infinite` }} />)}
              <style>{`@keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
            </div>
          </div>
        )}
        {messages.length===1 && !loading && (
          <div style={{ display:'grid',gap:5,marginTop:8 }}>
            {QUICK.map(q=>(
              <button key={q.label} onClick={()=>send(q.prompt)} style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:'8px 10px',textAlign:'left',cursor:'pointer',fontFamily:C.font,color:C.muted,fontSize:11 }}>
                {q.label}
              </button>
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:'10px 12px',borderTop:`1px solid ${C.border}`,flexShrink:0 }}>
        <div style={{ display:'flex',gap:6 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()}
            placeholder={`Ask about ${symbol}...`}
            style={{ flex:1,background:C.bg,border:`1px solid ${C.border2}`,padding:'8px 10px',fontSize:12,color:C.text,outline:'none',fontFamily:C.font }} />
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ background:input.trim()&&!loading?C.gold:'#222',color:input.trim()&&!loading?'#0a0a0a':C.dim,border:'none',padding:'8px 12px',fontSize:9,letterSpacing:2,cursor:input.trim()&&!loading?'pointer':'not-allowed',fontFamily:C.font }}>→</button>
        </div>
      </div>
    </div>
  )
}

// ─── Quick Note / Level creator ───────────────────────────────────────────────
function QuickAddModal({ type, symbol, onClose, onSave }) {
  const [form, setForm] = useState({ title:'', content:'', price:'', levelType:'SUPPORT', notes:'' })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const save = async () => {
    if (type==='note') {
      await fetch('/api/notes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        title: form.title||`${symbol} note`,
        content: form.content,
        tags:[symbol.toLowerCase(),'chart'],
      })})
    } else {
      await fetch('/api/markets/keylevels',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
        symbol, name: form.title||`${symbol} ${form.levelType}`,
        type: form.levelType, price: parseFloat(form.price), notes: form.notes,
      })})
    }
    onSave?.()
    onClose()
  }

  const inp = { width:'100%',background:C.bg,border:`1px solid ${C.border2}`,padding:'9px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,boxSizing:'border-box' }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:C.surface,border:`1px solid ${C.border2}`,padding:28,width:400,maxWidth:'90vw' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20 }}>
          <p style={{ fontSize:14,color:C.text,margin:0 }}>{type==='note'?'Quick Note':'Quick Level'} — {symbol}</p>
          <button onClick={onClose} style={{ background:'none',border:'none',color:C.muted,cursor:'pointer',fontSize:18 }}>×</button>
        </div>
        {type==='note' ? (
          <>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Title" style={{ ...inp,marginBottom:10 }} />
            <textarea value={form.content} onChange={e=>set('content',e.target.value)} placeholder="Your notes about this chart setup..." rows={4} style={{ ...inp,resize:'vertical',lineHeight:1.7,marginBottom:16 }} />
          </>
        ) : (
          <>
            <div style={{ display:'flex',gap:6,marginBottom:10 }}>
              {['SUPPORT','RESISTANCE','PIVOT'].map(t=>(
                <button key={t} onClick={()=>set('levelType',t)} style={{ flex:1,background:form.levelType===t?({SUPPORT:C.green,RESISTANCE:C.red,PIVOT:C.blue}[t]):C.border2,color:form.levelType===t?'#0a0a0a':C.muted,border:'none',padding:'7px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{t}</button>
              ))}
            </div>
            <input value={form.price} onChange={e=>set('price',e.target.value)} placeholder="Price level" type="number" style={{ ...inp,marginBottom:10 }} />
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Label (e.g. Feb highs, ATH)" style={{ ...inp,marginBottom:10 }} />
            <input value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="Notes (optional)" style={{ ...inp,marginBottom:16 }} />
          </>
        )}
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={save} style={{ background:C.gold,color:C.surface,border:'none',padding:'10px 24px',fontSize:10,letterSpacing:2,cursor:'pointer',fontFamily:C.font }}>SAVE</button>
          <button onClick={onClose} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'10px 18px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>CANCEL</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Chart Workspace ─────────────────────────────────────────────────────
export default function ChartWorkspace() {
  const [symbol, setSymbol] = useState('NQ1!')
  const [symbolInput, setSymbolInput] = useState('NQ1!')
  const [interval, setInterval] = useState('D')
  const [layout, setLayout] = useState('chart-notes')
  const [activeGroup, setActiveGroup] = useState('Index Futures')
  const [quickAdd, setQuickAdd] = useState(null) // { type: 'note'|'level', symbol }
  const [refreshKey, setRefreshKey] = useState(0)
  const [showSymbolPicker, setShowSymbolPicker] = useState(false)

  const changeSymbol = (sym) => {
    setSymbol(sym)
    setSymbolInput(sym)
    setShowSymbolPicker(false)
  }

  const handleAddNote = (sym) => setQuickAdd({ type:'note', symbol: sym||symbol })
  const handleAddLevel = (sym) => setQuickAdd({ type:'level', symbol: sym||symbol })

  const mainHeight = 'calc(100vh - 108px)'

  return (
    <div style={{ marginLeft:-24,marginRight:-24,marginTop:-28 }}>
      {/* Workspace toolbar */}
      <div style={{ background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'10px 20px',display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
        {/* Symbol input */}
        <div style={{ position:'relative' }}>
          <div style={{ display:'flex',alignItems:'center',gap:0 }}>
            <input
              value={symbolInput}
              onChange={e=>setSymbolInput(e.target.value.toUpperCase())}
              onKeyDown={e=>{if(e.key==='Enter')changeSymbol(symbolInput)}}
              onFocus={()=>setShowSymbolPicker(true)}
              style={{ background:C.bg,border:`1px solid ${C.border2}`,borderRight:'none',padding:'6px 12px',fontSize:13,color:C.text,outline:'none',fontFamily:C.font,width:130 }}
            />
            <button onClick={()=>changeSymbol(symbolInput)} style={{ background:C.gold,color:C.surface,border:'none',padding:'6px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>GO</button>
          </div>
          {showSymbolPicker && (
            <div style={{ position:'absolute',top:'100%',left:0,background:C.surface,border:`1px solid ${C.border2}`,zIndex:200,width:480,maxHeight:360,overflow:'auto',boxShadow:'0 8px 32px rgba(0,0,0,0.8)' }}>
              <div style={{ display:'flex',gap:2,padding:8,borderBottom:`1px solid ${C.border}`,flexWrap:'wrap' }}>
                {Object.keys(SYMBOL_GROUPS).map(g=>(
                  <button key={g} onClick={()=>setActiveGroup(g)} style={{ background:activeGroup===g?C.gold:'transparent',color:activeGroup===g?'#0a0a0a':C.muted,border:`1px solid ${activeGroup===g?C.gold:C.border2}`,padding:'3px 10px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font }}>{g}</button>
                ))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4,padding:8 }}>
                {SYMBOL_GROUPS[activeGroup]?.map(sym=>(
                  <button key={sym} onClick={()=>changeSymbol(sym)} style={{ background:symbol===sym?C.gold:'transparent',color:symbol===sym?'#0a0a0a':C.text,border:`1px solid ${symbol===sym?C.gold:C.border}`,padding:'8px',fontSize:11,cursor:'pointer',fontFamily:C.font,textAlign:'left' }}>
                    {sym.split(':').pop()}
                  </button>
                ))}
              </div>
              <div style={{ padding:8,borderTop:`1px solid ${C.border}` }}>
                <p style={{ fontSize:10,color:C.dim,margin:0 }}>Or type any TradingView symbol above and press Enter</p>
              </div>
            </div>
          )}
        </div>

        {/* Timeframe */}
        <div style={{ display:'flex',gap:1 }}>
          {TIMEFRAMES.map(tf=>(
            <button key={tf.tv} onClick={()=>setInterval(tf.tv)} style={{ background:interval===tf.tv?C.gold:'transparent',color:interval===tf.tv?'#0a0a0a':C.muted,border:'none',padding:'5px 10px',fontSize:10,cursor:'pointer',fontFamily:C.font }}>{tf.label}</button>
          ))}
        </div>

        <div style={{ width:1,height:20,background:C.border }} />

        {/* Layout */}
        <div style={{ display:'flex',gap:1 }}>
          {PANEL_CONFIGS.map(cfg=>(
            <button key={cfg.id} onClick={()=>setLayout(cfg.id)} title={cfg.label} style={{ background:layout===cfg.id?C.gold:'transparent',color:layout===cfg.id?'#0a0a0a':C.muted,border:'none',padding:'5px 10px',fontSize:14,cursor:'pointer',fontFamily:C.font }}>{cfg.icon}</button>
          ))}
        </div>

        <div style={{ width:1,height:20,background:C.border }} />

        {/* Quick actions */}
        <button onClick={()=>handleAddNote(symbol)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:1 }}>+ NOTE</button>
        <button onClick={()=>handleAddLevel(symbol)} style={{ background:'transparent',border:`1px solid ${C.border2}`,color:C.muted,padding:'5px 12px',fontSize:10,cursor:'pointer',fontFamily:C.font,letterSpacing:1 }}>+ LEVEL</button>

        <div style={{ marginLeft:'auto',display:'flex',alignItems:'center',gap:8 }}>
          <span style={{ fontSize:11,color:C.muted }}>Powered by</span>
          <span style={{ fontSize:11,color:C.gold,letterSpacing:1 }}>TradingView</span>
        </div>
      </div>

      {/* Symbol group quick-select strip */}
      <div style={{ background:C.bg,borderBottom:`1px solid ${C.border}`,padding:'4px 20px',display:'flex',gap:4,overflowX:'auto' }}>
        {Object.entries(SYMBOL_GROUPS).flatMap(([group,syms])=>
          syms.slice(0,layout==='chart-only'?5:3).map(sym=>(
            <button key={sym} onClick={()=>changeSymbol(sym)} style={{ background:symbol===sym?C.gold:'transparent',color:symbol===sym?'#0a0a0a':C.dim,border:'none',padding:'3px 10px',fontSize:9,letterSpacing:1,cursor:'pointer',fontFamily:C.font,whiteSpace:'nowrap',flexShrink:0 }}>
              {sym.split(':').pop()}
            </button>
          ))
        )}
      </div>

      {/* Main workspace */}
      <div style={{ display:'grid', height: mainHeight, overflow:'hidden',
        gridTemplateColumns: layout==='chart-only' ? '1fr'
          : layout==='triple' ? '1fr 280px 280px'
          : '1fr 300px'
      }}>
        {/* Chart panel */}
        <div style={{ background:C.bg,overflow:'hidden',position:'relative' }}>
          <TradingViewChart symbol={symbol} interval={interval} />
        </div>

        {/* Right panel 1 */}
        {layout!=='chart-only' && (
          <div style={{ borderLeft:`1px solid ${C.border}`,overflow:'hidden',display:'flex',flexDirection:'column' }}>
            {(layout==='chart-notes'||layout==='triple') && <WorkspaceContext symbol={symbol} onAddNote={handleAddNote} onAddLevel={handleAddLevel} />}
            {layout==='chart-ai' && <WorkspaceAI symbol={symbol} />}
            {layout==='chart-data' && <WorkspaceContext symbol={symbol} onAddNote={handleAddNote} onAddLevel={handleAddLevel} />}
          </div>
        )}

        {/* Right panel 2 (triple layout) */}
        {layout==='triple' && (
          <div style={{ borderLeft:`1px solid ${C.border}`,overflow:'hidden' }}>
            <WorkspaceAI symbol={symbol} />
          </div>
        )}
      </div>

      {/* Quick add modal */}
      {quickAdd && (
        <QuickAddModal
          type={quickAdd.type}
          symbol={quickAdd.symbol}
          onClose={()=>setQuickAdd(null)}
          onSave={()=>setRefreshKey(k=>k+1)}
        />
      )}

      {/* Click outside to close symbol picker */}
      {showSymbolPicker && <div style={{ position:'fixed',inset:0,zIndex:100 }} onClick={()=>setShowSymbolPicker(false)} />}
    </div>
  )
}
