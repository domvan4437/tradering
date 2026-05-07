'use client';
import { useState, useRef, useEffect } from 'react';

const PURPLE = '#4f46e5';

function Dots() {
  return (
    <div style={{ display:'flex', gap:4, padding:'8px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:7, height:7, borderRadius:'50%', background:'var(--text-muted)',
          animation:'bounce 1.2s ease-in-out infinite',
          animationDelay: i * 0.2 + 's',
        }}/>
      ))}
      <style>{`
        @keyframes bounce {
          0%,80%,100%{transform:translateY(0)}
          40%{transform:translateY(-6px)}
        }
        @keyframes slideUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
      `}</style>
    </div>
  );
}

export default function FloatingAICoach() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role:'assistant', content:'Hi! I am your TradeRing AI Coach. Ask me anything about trading, your strategy, risk management, or market analysis.' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setPulse(false);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, busy]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const userMsg = { role:'user', content:input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch('/api/ai-coach', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ messages:[...messages, userMsg].map(m=>({role:m.role,content:m.content})), mode:'chat' })
      });
      const d = await res.json();
      if (res.status === 429) {
        setMessages(prev => [...prev, { role:'assistant', content: d.message || 'Daily AI limit reached. Upgrade to Pro for more messages.', isLimit:true }]);
      } else {
        setMessages(prev => [...prev, { role:'assistant', content: d.analysis||d.response||'Something went wrong.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Connection error. Please try again.' }]);
    }
    setBusy(false);
  };

  const QUICK = ['Review my risk management','What does COT mean?','Help me size a position','Analyze my trading style'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(s => !s)}
        style={{
          position:'fixed', bottom:28, right:28, zIndex:500,
          width:58, height:58, borderRadius:'50%',
          backgroundColor:PURPLE, border:'none',
          boxShadow:'0 4px 20px rgba(79,70,229,0.4)',
          cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, transition:'all 0.2s',
          animation: pulse ? 'pulseBtn 2s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(79,70,229,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(79,70,229,0.4)'; }}>
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position:'fixed', bottom:96, right:28, zIndex:499,
          width:480, height:640,
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:16, boxShadow:'0 16px 48px rgba(0,0,0,0.25)',
          display:'flex', flexDirection:'column',
          fontFamily:'var(--font)',
          animation:'slideUp 0.2s ease-out',
        }}>
          {/* Header */}
          <div style={{
            padding:'14px 18px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:10, flexShrink:0,
            background:'rgba(79,70,229,0.06)', borderRadius:'16px 16px 0 0',
          }}>
            <div style={{ width:32, height:32, borderRadius:'50%', backgroundColor:PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🤖</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>AI Coach</div>
              <div style={{ fontSize:11, color:'var(--green)', display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)' }}/>
                Always available
              </div>
            </div>
            <button onClick={() => setMessages([{ role:'assistant', content:'Hi! I am your TradeRing AI Coach. Ask me anything about trading, your strategy, risk management, or market analysis.' }])}
              style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:11, fontFamily:'var(--font)' }}>
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto', padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display:'flex', justifyContent: m.role==='user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth:'88%', padding:'11px 15px', borderRadius: m.role==='user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: m.role==='user' ? PURPLE : m.isLimit ? 'rgba(245,158,11,0.1)' : 'var(--surface2)',
                  color: m.role==='user' ? '#fff' : m.isLimit ? '#f59e0b' : 'var(--text)',
                  border: m.isLimit ? '1px solid rgba(245,158,11,0.3)' : 'none',
                  fontSize:14, lineHeight:1.7, fontFamily:'var(--font)',
                }}>
                  {m.content}
                  {m.isLimit && (
                    <button onClick={() => window.location.href='/api/stripe/checkout?plan=pro'}
                      style={{ display:'block', marginTop:8, padding:'5px 12px', borderRadius:6, border:'none', backgroundColor:'#f59e0b', color:'#fff', fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                      Upgrade to Pro →
                    </button>
                  )}
                </div>
              </div>
            ))}
            {busy && <div style={{ display:'flex', justifyContent:'flex-start' }}><div style={{ background:'var(--surface2)', borderRadius:'12px 12px 12px 2px', padding:'2px 12px' }}><Dots/></div></div>}
            <div ref={bottomRef}/>
          </div>

          {/* Quick prompts — only show at start */}
          {messages.length === 1 && (
            <div style={{ padding:'0 16px 10px', display:'flex', gap:5, flexWrap:'wrap' }}>
              {QUICK.map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(()=>inputRef.current?.focus(),50); }}
                  style={{ padding:'4px 10px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer', transition:'all 0.1s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.color=PURPLE;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)';}}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 14px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
              placeholder="Ask your AI coach..."
              style={{
                flex:1, padding:'11px 14px', borderRadius:10,
                border:'1px solid var(--border)', background:'var(--surface2)',
                fontFamily:'var(--font)', fontSize:13, color:'var(--text)',
                outline:'none', transition:'border-color 0.15s',
              }}
              onFocus={e=>e.target.style.borderColor=PURPLE}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
            <button onClick={send} disabled={busy||!input.trim()}
              style={{
                width:38, height:38, borderRadius:10, border:'none',
                backgroundColor: busy||!input.trim() ? 'var(--surface2)' : PURPLE,
                color: busy||!input.trim() ? 'var(--text-muted)' : '#fff',
                cursor: busy||!input.trim() ? 'not-allowed' : 'pointer',
                fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all 0.15s', flexShrink:0,
              }}>
              ↑
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseBtn {
          0%,100%{box-shadow:0 4px 20px rgba(79,70,229,0.4)}
          50%{box-shadow:0 4px 32px rgba(79,70,229,0.7)}
        }
      `}</style>
    </>
  );
}
