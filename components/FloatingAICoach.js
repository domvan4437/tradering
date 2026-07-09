'use client';
import { useState, useRef, useEffect } from 'react';

const PURPLE = '#4B44C8';

// ── localStorage helpers ──────────────────────────────────────────────────────
function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function pnlNum(v) {
  return parseFloat(String(v || '').replace(/[^0-9.\-]/g, '')) || 0;
}

function gatherTraderContext() {
  try {
    const trades   = lsGet('tr_journal_v3', []);
    const jTree    = lsGet('tr_journal_v3_jtree', {});
    const setups   = lsGet('tr_journal_v3_setups2', []);
    const accounts = lsGet('tr_port_accounts_v3', []);

    const total  = trades.length;
    const wins   = trades.filter(t => pnlNum(t.pnl) > 0);
    const losses = trades.filter(t => pnlNum(t.pnl) < 0);
    const winRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;
    const netPnl  = trades.reduce((s, t) => s + pnlNum(t.pnl), 0);
    const avgR    = total > 0 ? (trades.reduce((s, t) => s + (parseFloat(t.r) || 0), 0) / total).toFixed(2) : '0';
    const grossWin  = wins.reduce((s, t) => s + pnlNum(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + pnlNum(t.pnl), 0));
    const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length > 0 ? 'inf' : '0';

    let peak = 0, dd = 0, cum = 0;
    [...trades].sort((a, b) => (a.date || '').localeCompare(b.date || '')).forEach(t => {
      cum += pnlNum(t.pnl); if (cum > peak) peak = cum; if (peak - cum > dd) dd = peak - cum;
    });

    const byAsset = {}, bySetup = {}, byEmotion = {}, byDir = { Long: {w:0,t:0}, Short: {w:0,t:0} };
    trades.forEach(t => {
      if (t.asset) {
        if (!byAsset[t.asset]) byAsset[t.asset] = { w: 0, t: 0, pnl: 0 };
        byAsset[t.asset].t++; byAsset[t.asset].pnl += pnlNum(t.pnl);
        if (pnlNum(t.pnl) > 0) byAsset[t.asset].w++;
      }
      if (t.setup) {
        if (!bySetup[t.setup]) bySetup[t.setup] = { w: 0, t: 0, pnl: 0 };
        bySetup[t.setup].t++; bySetup[t.setup].pnl += pnlNum(t.pnl);
        if (pnlNum(t.pnl) > 0) bySetup[t.setup].w++;
      }
      if (t.emotion) {
        if (!byEmotion[t.emotion]) byEmotion[t.emotion] = { w: 0, t: 0, pnl: 0 };
        byEmotion[t.emotion].t++; byEmotion[t.emotion].pnl += pnlNum(t.pnl);
        if (pnlNum(t.pnl) > 0) byEmotion[t.emotion].w++;
      }
      if (t.direction === 'Long' || t.direction === 'Short') {
        byDir[t.direction].t++;
        if (pnlNum(t.pnl) > 0) byDir[t.direction].w++;
      }
    });

    const fmtAsset   = Object.entries(byAsset).sort((a,b)=>b[1].t-a[1].t).slice(0,8)
      .map(([a,d])=>a+': '+Math.round(d.w/d.t*100)+'% WR, '+d.t+' trades, $'+d.pnl.toFixed(0)+' P&L');
    const fmtSetup   = Object.entries(bySetup).sort((a,b)=>b[1].t-a[1].t).slice(0,6)
      .map(([s,d])=>s+': '+Math.round(d.w/d.t*100)+'% WR, '+d.t+' trades, $'+d.pnl.toFixed(0)+' P&L');
    const fmtEmotion = Object.entries(byEmotion).sort((a,b)=>b[1].t-a[1].t)
      .map(([e,d])=>e+': '+Math.round(d.w/d.t*100)+'% WR, '+d.t+' trades');
    const recentTrades = [...trades].sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,10)
      .map(t=>(t.date||'?')+' | '+(t.asset||'?')+' '+(t.direction||'')+' | Setup: '+(t.setup||'none')+' | P&L: '+(t.pnl||'?')+' | R: '+(t.r||'?')+' | Emotion: '+(t.emotion||'none')+' | Risk: '+(t.risk?'$'+t.risk:'-'));

    const accountTotal = accounts.reduce((s,a)=>s+(typeof a.cash==='number'?a.cash:parseFloat(a.cash)||0),0);

    const entries = jTree.entries || {};
    const items   = (jTree.items || []).filter(i=>i.type==='entry');
    const recentNotes = items.sort((a,b)=>(b.order||0)-(a.order||0)).slice(0,5).map(i=>{
      const e = entries[i.id];
      if (!e) return null;
      const text = (e.blocks||[]).map(b=>b.text||b.content||'').filter(Boolean).join(' ').slice(0,300);
      return text ? '['+i.name+']: '+text : null;
    }).filter(Boolean);

    return {
      summary: {
        totalTrades: total,
        winRate: winRate+'%',
        wins: wins.length,
        losses: losses.length,
        netPnL: '$'+netPnl.toFixed(0),
        avgR,
        profitFactor,
        maxDrawdown: '$'+dd.toFixed(0),
        accountBalance: accountTotal > 0 ? '$'+accountTotal.toFixed(0) : 'not set',
        longRecord: byDir.Long.w+'W / '+(byDir.Long.t-byDir.Long.w)+'L ('+(byDir.Long.t>0?Math.round(byDir.Long.w/byDir.Long.t*100):0)+'% WR)',
        shortRecord: byDir.Short.w+'W / '+(byDir.Short.t-byDir.Short.w)+'L ('+(byDir.Short.t>0?Math.round(byDir.Short.w/byDir.Short.t*100):0)+'% WR)',
        emotionalTrades: trades.filter(t=>['FOMO','Revenge','Anxious'].includes(t.emotion)).length,
        fullRuleTrades:  trades.filter(t=>t.rules==='4/4').length,
      },
      byAsset:  fmtAsset.length   ? fmtAsset   : ['No assets logged yet'],
      bySetup:  fmtSetup.length   ? fmtSetup   : ['No setups tagged yet'],
      byEmotion:fmtEmotion.length ? fmtEmotion : ['No emotions tagged yet'],
      recentTrades: recentTrades.length ? recentTrades : ['No trades logged yet'],
      playbookSetups: setups.length ? setups.map(s=>s.name).join(', ') : 'None defined',
      recentJournalNotes: recentNotes.length ? recentNotes : [],
    };
  } catch(e) {
    return null;
  }
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function formatInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return React.createElement('strong', {key:i}, p.slice(2,-2));
    if (p.startsWith('*')  && p.endsWith('*'))  return React.createElement('em', {key:i, style:{fontStyle:'italic'}}, p.slice(1,-1));
    if (p.startsWith('`')  && p.endsWith('`'))  return React.createElement('code', {key:i, style:{background:'rgba(0,0,0,0.15)',padding:'1px 5px',borderRadius:3,fontFamily:'monospace',fontSize:12}}, p.slice(1,-1));
    return p;
  });
}

function Markdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      out.push(React.createElement('div', {key:i, style:{fontWeight:700,fontSize:13,marginTop:10,marginBottom:3,color:PURPLE}}, formatInline(line.slice(4))));
    } else if (line.startsWith('## ')) {
      out.push(React.createElement('div', {key:i, style:{fontWeight:700,fontSize:14,marginTop:12,marginBottom:4}}, formatInline(line.slice(3))));
    } else if (line.startsWith('# ')) {
      out.push(React.createElement('div', {key:i, style:{fontWeight:700,fontSize:15,marginTop:14,marginBottom:5}}, formatInline(line.slice(2))));
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      out.push(React.createElement('div', {key:i, style:{display:'flex',gap:7,margin:'2px 0',alignItems:'flex-start'}},
        React.createElement('span', {style:{color:PURPLE,flexShrink:0,marginTop:1,fontSize:12}}, '•'),
        React.createElement('span', null, formatInline(line.slice(2)))
      ));
    } else if (/^\d+\.\s/.test(line)) {
      const m = line.match(/^(\d+)\.\s(.*)/);
      if (m) out.push(React.createElement('div', {key:i, style:{display:'flex',gap:7,margin:'2px 0',alignItems:'flex-start'}},
        React.createElement('span', {style:{color:PURPLE,flexShrink:0,fontWeight:600,minWidth:18,fontSize:12}}, m[1]+'.'),
        React.createElement('span', null, formatInline(m[2]))
      ));
    } else if (line === '---' || line === '***') {
      out.push(React.createElement('div', {key:i, style:{height:1,background:'var(--border)',margin:'8px 0'}}));
    } else if (line === '') {
      out.push(React.createElement('div', {key:i, style:{height:5}}));
    } else {
      out.push(React.createElement('div', {key:i, style:{margin:'1px 0',lineHeight:1.65}}, formatInline(line)));
    }
    i++;
  }
  return React.createElement('div', {style:{fontSize:13.5}}, ...out);
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function Dots() {
  return React.createElement('div', {style:{display:'flex',gap:4,padding:'6px 0',alignItems:'center'}},
    ...[0,1,2].map(i=>React.createElement('div', {key:i, style:{
      width:7,height:7,borderRadius:'50%',background:'var(--text-muted)',
      animation:'tz-bounce 1.2s ease-in-out infinite',animationDelay:i*0.18+'s'
    }}))
  );
}

// ── Quick prompt categories ───────────────────────────────────────────────────
const QUICK_CATS = [
  { label: 'My Stats', prompts: [
    'What are my strongest and weakest trading setups?',
    'Break down my emotional trading patterns and their impact',
    'Which asset am I most profitable on and why?',
    'Review my last 10 trades and identify patterns',
  ]},
  { label: 'Concepts', prompts: [
    'Explain liquidity sweeps with a real example',
    'What are orderblocks and how do I trade them?',
    'Explain fair value gaps (FVGs) and how to use them',
    'How do I read the COT report for trade bias?',
  ]},
  { label: 'Risk', prompts: [
    'Help me size my next trade risking 1% of my account',
    'What is a good risk:reward ratio for my trading style?',
    'How do I calculate my max drawdown risk?',
    'When should I reduce position size after a losing streak?',
  ]},
  { label: 'Psychology', prompts: [
    'How do I stop revenge trading after a loss?',
    'I keep moving my stop loss — how do I fix this habit?',
    'How do I build unshakeable trading discipline?',
    'I just had 3 losses in a row — what should I do now?',
  ]},
];

const WELCOME_TEXT = '**Welcome. I\'m your TradeZar AI Coach.**\n\nI have full access to your trade journal, performance stats, playbook setups, and notes. Ask me anything and I\'ll give you straight, data-driven answers.\n\nA few things I can help with right now:\n- **Analyze your journal data** — win rates, setup performance, emotional patterns\n- **Explain any trading concept** — SMC, ICT, risk management, COT, TA\n- **Help with live decisions** — assess a trade with your actual stats in mind\n- **Build better habits** — trading psychology, discipline, journaling frameworks\n\nWhat do you want to work on?';

// ── Main component ────────────────────────────────────────────────────────────
export default function FloatingAICoach() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([{role:'assistant', content:WELCOME_TEXT}]);
  const [input, setInput]       = useState('');
  const [busy, setBusy]         = useState(false);
  const [cat, setCat]           = useState(0);
  const [pulse, setPulse]       = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) { setTimeout(()=>inputRef.current?.focus(), 100); setPulse(false); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || busy) return;
    const userMsg = { role:'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    const tradeContext = gatherTraderContext();
    const history = [...messages, userMsg].map(m=>({role:m.role, content:m.content}));

    try {
      const res = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, tradeContext }),
      });

      if (res.status === 429) {
        const d = await res.json();
        setMessages(prev=>[...prev,{role:'assistant',content:d.message||'Daily limit reached. Upgrade for more messages.',isLimit:true,plan:d.plan}]);
        setBusy(false); return;
      }

      if (!res.ok || !res.body) {
        const d = await res.json().catch(()=>({}));
        setMessages(prev=>[...prev,{role:'assistant',content:d.error||'Something went wrong. Please try again.'}]);
        setBusy(false); return;
      }

      // Stream response
      setMessages(prev=>[...prev,{role:'assistant',content:'',streaming:true}]);
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        const snap = full;
        setMessages(prev => {
          const next = [...prev];
          next[next.length-1] = { role:'assistant', content: snap, streaming: true };
          return next;
        });
      }
      setMessages(prev => {
        const next = [...prev];
        next[next.length-1] = { role:'assistant', content: full, streaming: false };
        return next;
      });
    } catch(err) {
      setMessages(prev=>[...prev,{role:'assistant',content:'Connection error. Check your internet and try again.'}]);
    }
    setBusy(false);
  };

  const clearChat = () => setMessages([{role:'assistant', content:WELCOME_TEXT}]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return React.createElement(React.Fragment, null,
    // ── Floating button
    React.createElement('button', {
      onClick: ()=>setOpen(s=>!s),
      title: 'AI Coach',
      style: {
        position:'fixed', bottom:26, right:26, zIndex:500,
        width:54, height:54, borderRadius:'50%',
        background:'linear-gradient(135deg, #4B44C8, #7c3aed)',
        border:'none', boxShadow:'0 4px 20px rgba(75,68,200,0.45)',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, transition:'all 0.2s',
        animation: pulse ? 'tz-pulse 2.4s ease-in-out infinite' : 'none',
        color:'#fff',
      },
      onMouseEnter: e=>{e.currentTarget.style.transform='scale(1.1)';},
      onMouseLeave: e=>{e.currentTarget.style.transform='scale(1)';},
    }, open ? '✕' : '✦'),

    // ── Chat panel
    open && React.createElement('div', {
      style: {
        position:'fixed', bottom:90, right:26, zIndex:499,
        width:520, height:680,
        background:'var(--surface)', border:'0.5px solid var(--border)',
        borderRadius:16, boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
        display:'flex', flexDirection:'column',
        fontFamily:'var(--font)',
        animation:'tz-up 0.2s ease-out',
      }
    },
      // Header
      React.createElement('div', {style:{
        padding:'12px 16px', borderBottom:'0.5px solid var(--border)',
        display:'flex', alignItems:'center', gap:10, flexShrink:0,
        borderRadius:'16px 16px 0 0',
        background:'linear-gradient(135deg, rgba(75,68,200,0.08), rgba(124,58,237,0.06))',
      }},
        React.createElement('div', {style:{
          width:34, height:34, borderRadius:'50%',
          background:'linear-gradient(135deg,#4B44C8,#7c3aed)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:16, flexShrink:0, color:'#fff',
        }}, '✦'),
        React.createElement('div', {style:{flex:1}},
          React.createElement('div', {style:{fontSize:14,fontWeight:700,color:'var(--text)'}}, 'AI Coach'),
          React.createElement('div', {style:{fontSize:11,color:'var(--green)',display:'flex',alignItems:'center',gap:4}},
            React.createElement('div', {style:{width:6,height:6,borderRadius:'50%',background:'var(--green)'}}),
            'Knows your journal & stats'
          )
        ),
        React.createElement('button', {
          onClick: clearChat,
          title: 'New conversation',
          style:{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:11,fontFamily:'var(--font)',padding:'3px 8px',borderRadius:5,transition:'all 0.1s'},
          onMouseEnter:e=>{e.currentTarget.style.background='var(--surface2)';e.currentTarget.style.color='var(--text)';},
          onMouseLeave:e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text-muted)';},
        }, 'New chat')
      ),

      // Messages
      React.createElement('div', {style:{flex:1,overflowY:'auto',padding:'14px 14px',display:'flex',flexDirection:'column',gap:10}},
        ...messages.map((m,i)=>
          React.createElement('div', {key:i, style:{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',alignItems:'flex-start'}},
            m.role==='assistant' && React.createElement('div', {style:{
              width:24,height:24,borderRadius:'50%',
              background:'linear-gradient(135deg,#4B44C8,#7c3aed)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:11,flexShrink:0,marginRight:7,marginTop:2,color:'#fff',
            }}, '✦'),
            React.createElement('div', {style:{
              maxWidth:'84%', padding:'10px 14px',
              borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
              background: m.role==='user' ? 'linear-gradient(135deg,#4B44C8,#7c3aed)' : m.isLimit ? 'rgba(245,158,11,0.08)' : 'var(--surface2)',
              color: m.role==='user' ? '#fff' : m.isLimit ? '#f59e0b' : 'var(--text)',
              border: m.isLimit ? '0.5px solid rgba(245,158,11,0.3)' : 'none',
              fontSize:13.5, lineHeight:1.65,
            }},
              m.role==='user'
                ? React.createElement('span', null, m.content)
                : React.createElement(Markdown, {text:m.content}),
              m.streaming && React.createElement('span', {style:{
                display:'inline-block',width:8,height:14,background:PURPLE,
                borderRadius:1,marginLeft:2,
                animation:'tz-blink 0.8s step-end infinite',verticalAlign:'text-bottom'
              }}),
              m.isLimit && React.createElement('button', {
                onClick:()=>window.location.href='/api/stripe/checkout?plan=pro',
                style:{display:'block',marginTop:8,padding:'5px 14px',borderRadius:6,border:'none',background:'#f59e0b',color:'#fff',fontFamily:'var(--font)',fontSize:11,fontWeight:700,cursor:'pointer'},
              }, 'Upgrade to Pro →')
            )
          )
        ),
        busy && !messages[messages.length-1]?.streaming && React.createElement('div', {style:{display:'flex',alignItems:'center',gap:7}},
          React.createElement('div', {style:{width:24,height:24,borderRadius:'50%',background:'linear-gradient(135deg,#4B44C8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,flexShrink:0,color:'#fff'}}, '✦'),
          React.createElement('div', {style:{background:'var(--surface2)',borderRadius:'3px 14px 14px 14px',padding:'6px 12px'}}, React.createElement(Dots))
        ),
        React.createElement('div', {ref:bottomRef})
      ),

      // Quick prompts — show only when welcome screen
      messages.length <= 1 && React.createElement('div', {style:{padding:'0 14px 10px',flexShrink:0}},
        React.createElement('div', {style:{display:'flex',gap:6,marginBottom:7}},
          ...QUICK_CATS.map((c,i)=>React.createElement('button', {
            key:i, onClick:()=>setCat(i),
            style:{
              padding:'3px 9px',borderRadius:20,
              border:'0.5px solid '+(cat===i?PURPLE:'var(--border)'),
              background: cat===i ? 'rgba(75,68,200,0.1)' : 'transparent',
              color: cat===i ? PURPLE : 'var(--text-muted)',
              fontFamily:'var(--font)',fontSize:11,cursor:'pointer',transition:'all 0.1s',fontWeight:cat===i?600:400,
            }
          }, c.label))
        ),
        React.createElement('div', {style:{display:'flex',flexDirection:'column',gap:4}},
          ...QUICK_CATS[cat].prompts.map(q=>React.createElement('button', {
            key:q, onClick:()=>send(q),
            style:{
              padding:'7px 11px',borderRadius:8,border:'0.5px solid var(--border)',
              background:'var(--surface2)',color:'var(--text)',
              fontFamily:'var(--font)',fontSize:12,cursor:'pointer',
              textAlign:'left',transition:'all 0.1s',lineHeight:1.4,
            },
            onMouseEnter:e=>{e.currentTarget.style.borderColor=PURPLE;e.currentTarget.style.background='rgba(75,68,200,0.05)';},
            onMouseLeave:e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--surface2)';},
          }, q))
        )
      ),

      // Input
      React.createElement('div', {style:{padding:'10px 12px',borderTop:'0.5px solid var(--border)',display:'flex',gap:8,flexShrink:0}},
        React.createElement('textarea', {
          ref:inputRef,
          value:input,
          onChange:e=>{
            setInput(e.target.value);
            e.target.style.height='auto';
            e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';
          },
          onKeyDown:handleKey,
          placeholder:'Ask your AI coach… (Shift+Enter for new line)',
          rows:1,
          style:{
            flex:1, padding:'10px 13px', borderRadius:10,
            border:'0.5px solid var(--border)', background:'var(--surface2)',
            fontFamily:'var(--font)', fontSize:13, color:'var(--text)',
            outline:'none', resize:'none', lineHeight:1.5,
            transition:'border-color 0.15s', overflow:'hidden',
          },
          onFocus:e=>e.target.style.borderColor=PURPLE,
          onBlur:e=>e.target.style.borderColor='var(--border)',
        }),
        React.createElement('button', {
          onClick:()=>send(),
          disabled:busy||!input.trim(),
          style:{
            width:40, height:40, borderRadius:10, border:'none', flexShrink:0, alignSelf:'flex-end',
            background: busy||!input.trim() ? 'var(--surface2)' : 'linear-gradient(135deg,#4B44C8,#7c3aed)',
            color: busy||!input.trim() ? 'var(--text-muted)' : '#fff',
            cursor: busy||!input.trim() ? 'not-allowed' : 'pointer',
            fontSize:17, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.15s',
          },
        }, '↑')
      )
    ),

    // Keyframe styles
    React.createElement('style', null,
      '@keyframes tz-bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }' +
      '@keyframes tz-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }' +
      '@keyframes tz-pulse { 0%,100%{box-shadow:0 4px 20px rgba(75,68,200,0.45)} 50%{box-shadow:0 4px 32px rgba(75,68,200,0.75)} }' +
      '@keyframes tz-blink { 0%,100%{opacity:1} 50%{opacity:0} }'
    )
  );
}
