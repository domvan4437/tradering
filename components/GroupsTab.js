'use client';
import { useState, useRef, useEffect } from 'react';

// ── Constants ─────────────────────────────────────────────────

const MOCK_CLUBS = [
  { id:1, type:'club', name:'COT Masters Inner Circle', creator:'seasonaltrader', verified:true, category:'Commodities', members:47, max:50, price:99, desc:'Weekly live COT breakdowns, real-time trade alerts, and direct access to my analysis. 50 spots only — I know every member personally.', tags:['COT','Swing','Commodities'], waitlist:12, grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', joined:true },
  { id:2, type:'club', name:'Grain Swing Traders Club', creator:'graintrader99', verified:false, category:'Commodities', members:31, max:50, price:49, desc:'Focused exclusively on grain markets. USDA reports, seasonal setups, COT positioning. Tight group, serious traders only.', tags:['Grains','Swing','Seasonal'], waitlist:0, grad:'linear-gradient(135deg,#d97706,#b45309)', joined:false },
  { id:3, type:'club', name:'FX Macro Elite', creator:'alpharesearch', verified:true, category:'Forex', members:50, max:50, price:129, desc:'Full. Join the waitlist to be notified when a spot opens.', tags:['Forex','Macro','COT'], waitlist:28, grad:'linear-gradient(135deg,#0891b2,#0e7490)', joined:false, full:true },
];

const MOCK_CHANNELS = [
  { id:4, type:'channel', name:'TradeRing Community', creator:'TradeRing', verified:true, category:'General', members:4821, price:0, desc:'The official TradeRing community channel. Market updates, platform news, and open discussion for all traders.', tags:['General','Free'], grad:'linear-gradient(135deg,#6366f1,#8b5cf6)', joined:true },
  { id:5, type:'channel', name:'COT Weekly Broadcast', creator:'cotmaster', verified:true, category:'Commodities', members:1204, price:9, desc:'Every Friday: full COT analysis across all major commodity markets. 1,200+ subscribers get the breakdown before the open.', tags:['COT','Commodities','Weekly'], grad:'linear-gradient(135deg,#16a34a,#15803d)', joined:false },
  { id:6, type:'channel', name:'Crypto Macro Signal', creator:'cryptodesk', verified:false, category:'Crypto', members:892, price:15, desc:'On-chain data, macro correlations, and BTC/ETH positioning signals. Published 3x per week.', tags:['Crypto','Macro','Signals'], grad:'linear-gradient(135deg,#f59e0b,#d97706)', joined:false },
];

const MOCK_MESSAGES = [
  { id:1, user:'seasonaltrader', verified:true, avatar:'S', grad:'linear-gradient(135deg,#16a34a,#15803d)', time:'9:14 AM', text:'Good morning everyone. Gold COT just released — commercials added to longs for the 3rd consecutive week. Bullish confirmation for our setup.', type:'text' },
  { id:2, user:'you', verified:false, avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:'9:22 AM', text:'Seeing the same. Price is coiling above 4,820 support. Volume profile looks clean.', type:'text' },
  { id:3, user:'seasonaltrader', verified:true, avatar:'S', grad:'linear-gradient(135deg,#16a34a,#15803d)', time:'9:45 AM', text:'', type:'call', callType:'scheduled', callTitle:'Weekly COT Breakdown', callTime:'Today 2:00 PM EST', callDuration:'60 min' },
  { id:4, user:'graintrader99', verified:false, avatar:'G', grad:'linear-gradient(135deg,#d97706,#b45309)', time:'10:02 AM', text:'', type:'course', courseTitle:'COT Fundamentals: Module 3', courseDesc:'Understanding commercial vs speculative positioning and what extremes mean for price action.', courseLessons:8, coursePrice:0 },
  { id:5, user:'seasonaltrader', verified:true, avatar:'S', grad:'linear-gradient(135deg,#16a34a,#15803d)', time:'11:30 AM', text:'Wheat setting up as well. USDA report Thursday — this is the pre-positioning window. Watch the seasonal.', type:'text' },
];

const SCHEDULED_CALLS = [
  { id:1, title:'Weekly COT Breakdown', host:'seasonaltrader', time:'Today 2:00 PM EST', duration:'60 min', type:'video', attendees:31 },
  { id:2, title:'Q&A — Grain Setups', host:'seasonaltrader', time:'Thu Apr 24 4:00 PM EST', duration:'30 min', type:'voice', attendees:18 },
  { id:3, title:'Monthly Strategy Review', host:'seasonaltrader', time:'Fri Apr 25 12:00 PM EST', duration:'90 min', type:'video', attendees:44 },
];

const MEMBERS = [
  { name:'seasonaltrader', role:'Creator', verified:true, grad:'linear-gradient(135deg,#16a34a,#15803d)', online:true },
  { name:'you',            role:'Member',  verified:false, grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', online:true },
  { name:'graintrader99',  role:'Member',  verified:false, grad:'linear-gradient(135deg,#d97706,#b45309)', online:true },
  { name:'cotmaster',      role:'Member',  verified:true,  grad:'linear-gradient(135deg,#0891b2,#0e7490)', online:false },
  { name:'alpharesearch',  role:'Member',  verified:true,  grad:'linear-gradient(135deg,#7c3aed,#a855f7)', online:false },
];

const COURSES = [
  { id:1, title:'COT Fundamentals', desc:'Learn to read Commitment of Traders reports from scratch.', lessons:12, price:0,   enrolled:847 },
  { id:2, title:'Seasonal Patterns', desc:'How to identify and trade seasonal commodity cycles.',        lessons:8,  price:49,  enrolled:312 },
  { id:3, title:'Swing Trade Setup', desc:'Building a complete swing trade checklist using COT + seasonals.', lessons:10, price:79, enrolled:204 },
];

// ── Helpers ───────────────────────────────────────────────────

function Av({ letter, grad, size=36, online }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:size*0.34, fontWeight:800, color:'#fff' }}>{letter}</div>
      {online !== undefined && <div style={{ position:'absolute', bottom:1, right:1, width:9, height:9, borderRadius:'50%', background: online?'var(--green)':'var(--surface3)', border:'2px solid var(--surface)' }} />}
    </div>
  );
}

function TypeBadge({ type }) {
  const isClub = type === 'club';
  return (
    <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color: isClub?'#d97706':'var(--accent)', background: isClub?'rgba(217,119,6,0.1)':'var(--accent-bg)', padding:'2px 8px', borderRadius:20, border: isClub?'1px solid rgba(217,119,6,0.25)':'1px solid var(--accent-border)' }}>
      {isClub ? 'Club · Max 50' : 'Channel'}
    </span>
  );
}

// ── Group Card ────────────────────────────────────────────────

function GroupCard({ g, onOpen }) {
  const isFull = g.full || (g.type==='club' && g.members >= g.max);
  const pct    = g.type==='club' ? Math.round((g.members/g.max)*100) : null;

  return (
    <div onClick={() => onOpen(g)} style={{ border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', cursor:'pointer', transition:'all 0.15s', background:'var(--surface)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='var(--shadow-md)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ height:4, background:g.grad }} />
      <div style={{ padding:'16px 18px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ width:38, height:38, borderRadius:10, background:g.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>{g.name[0]}</div>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{g.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <TypeBadge type={g.type} />
                {g.joined && <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:600, color:'var(--green)', background:'var(--green-bg)', padding:'2px 7px', borderRadius:20 }}>Joined</span>}
              </div>
            </div>
          </div>
          {g.price > 0
            ? <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'var(--accent)' }}>${g.price}/mo</span>
            : <span style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--green)' }}>Free</span>
          }
        </div>

        <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6, marginBottom:12 }}>{g.desc.length > 100 ? g.desc.slice(0,100)+'...' : g.desc}</div>

        {g.type==='club' && (
          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{g.members}/{g.max} members</span>
              {isFull && g.waitlist > 0 && <span style={{ fontFamily:'var(--font)', fontSize:11, color:'#d97706' }}>{g.waitlist} on waitlist</span>}
            </div>
            <div style={{ height:4, background:'var(--surface3)', borderRadius:2, overflow:'hidden' }}>
              <div style={{ width:pct+'%', height:'100%', background: isFull?'#d97706':'var(--accent)', borderRadius:2 }} />
            </div>
            {g.type==='club' && !isFull && <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', marginTop:4 }}>{g.max - g.members} spots remaining — intimate group, creator knows every member</div>}
          </div>
        )}

        {g.type==='channel' && (
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>{g.members.toLocaleString()} members</div>
        )}

        <button style={{ width:'100%', padding:'9px', background: isFull?'var(--surface2)':g.joined?'var(--surface2)':'var(--accent)', color: isFull?'var(--text-muted)':g.joined?'var(--accent)':'#fff', border: g.joined?'1px solid var(--accent-border)':'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          {g.joined ? 'Open →' : isFull ? 'Join Waitlist' : g.price > 0 ? 'Join $'+g.price+'/mo' : 'Join Free'}
        </button>
      </div>
    </div>
  );
}

// ── Chat Message ──────────────────────────────────────────────

function Message({ m, onJoinCall }) {
  const isMe = m.user === 'you';

  if (m.type === 'call') {
    return (
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0' }}>
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:12, padding:'12px 18px', maxWidth:340, width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.callTitle}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.callTime} · {m.callDuration}</div>
            </div>
          </div>
          <button onClick={onJoinCall} style={{ width:'100%', padding:'8px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Join Call</button>
        </div>
      </div>
    );
  }

  if (m.type === 'course') {
    return (
      <div style={{ display:'flex', justifyContent:'center', margin:'8px 0' }}>
        <div style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'12px 18px', maxWidth:340, width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:700, color:'#10b981', letterSpacing:'0.1em', textTransform:'uppercase' }}>Course Shared</span>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:3 }}>{m.courseTitle}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginBottom:8 }}>{m.courseDesc}</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.courseLessons} lessons</span>
            <button style={{ padding:'5px 12px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>
              {m.coursePrice > 0 ? 'Enroll $'+m.coursePrice : 'Start Free'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', flexDirection: isMe?'row-reverse':'row', marginBottom:2 }}>
      <Av letter={m.avatar} grad={m.grad} size={32} />
      <div style={{ maxWidth:'70%' }}>
        {!isMe && (
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:3 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
            {m.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
            <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{m.time}</span>
          </div>
        )}
        <div style={{ background: isMe?'var(--accent)':'var(--surface2)', color: isMe?'#fff':'var(--text)', padding:'9px 13px', borderRadius: isMe?'16px 4px 16px 16px':'4px 16px 16px 16px', fontFamily:'var(--font)', fontSize:13, lineHeight:1.55 }}>{m.text}</div>
        {isMe && <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', textAlign:'right', marginTop:2 }}>{m.time}</div>}
      </div>
    </div>
  );
}

// ── Group Room ────────────────────────────────────────────────

function GroupRoom({ group, onBack }) {
  const [roomTab, setRoomTab]   = useState('chat');
  const [msg, setMsg]           = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [showShareCourse, setShowShareCourse] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  const [callType, setCallType] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const send = () => {
    if (!msg.trim()) return;
    setMessages(p => [...p, { id:Date.now(), user:'you', verified:false, avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:'now', text:msg, type:'text' }]);
    setMsg('');
  };

  const shareCourse = (course) => {
    setMessages(p => [...p, { id:Date.now(), user:'you', verified:false, avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:'now', text:'', type:'course', courseTitle:course.title, courseDesc:course.desc, courseLessons:course.lessons, coursePrice:course.price }]);
    setShowShareCourse(false);
  };

  const startCall = (type) => { setCallType(type); setActiveCall(true); };

  const ROOM_TABS = ['chat','calls','courses','members'];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'calc(100vh - 140px)', fontFamily:'var(--font)' }}>

      {/* Active call overlay */}
      {activeCall && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24 }}>
          <div style={{ textAlign:'center', marginBottom:8 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:8 }}>
              {callType==='video' ? 'Video Call' : callType==='voice' ? 'Voice Call' : 'FaceTime'} · {group.name}
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:700, color:'#fff', marginBottom:4 }}>Connected</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'rgba(255,255,255,0.5)' }}>00:04:23</div>
          </div>
          <div style={{ display:'flex', gap:16 }}>
            {MEMBERS.slice(0,4).map(m => (
              <div key={m.name} style={{ textAlign:'center' }}>
                <Av letter={m.name[0].toUpperCase()} grad={m.grad} size={56} />
                <div style={{ fontFamily:'var(--font)', fontSize:10, color:'rgba(255,255,255,0.6)', marginTop:6 }}>{m.name}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:8 }}>
            {[
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>, label:'Mute' },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label:'Members' },
              { icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, label:'Camera' },
            ].map(btn => (
              <button key={btn.label} style={{ width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:3 }}>
                {btn.icon}
              </button>
            ))}
            <button onClick={() => setActiveCall(false)} style={{ width:52, height:52, borderRadius:'50%', background:'#dc2626', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.16 7.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Room header */}
      <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, background:'var(--surface)' }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font)', fontSize:13, padding:'4px 8px', borderRadius:6 }}
          onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{ width:1, height:16, background:'var(--border)' }} />
        <div style={{ width:32, height:32, borderRadius:8, background:group.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:13, fontWeight:800, color:'#fff' }}>{group.name[0]}</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{group.name}</span>
            <TypeBadge type={group.type} />
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>
            {group.type==='club' ? group.members+'/'+group.max+' members' : group.members.toLocaleString()+' members'} · {group.creator} {group.verified?'✓':''}
          </div>
        </div>
        {/* Call buttons */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => startCall('voice')} title="Voice Call" style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
          </button>
          <button onClick={() => startCall('video')} title="Video Call" style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </button>
          <button onClick={() => startCall('facetime')} title="FaceTime" style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'#16a34a', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
            onMouseEnter={e => e.currentTarget.style.background='var(--green-bg)'}
            onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="18" cy="18" r="4" fill="var(--green-bg)" stroke="#16a34a"/><polyline points="16 18 18 20 21 16" stroke="#16a34a"/></svg>
          </button>
        </div>
      </div>

      {/* Room sub-tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
        {ROOM_TABS.map(t => (
          <button key={t} onClick={() => setRoomTab(t)} style={{ padding:'9px 16px', background:'none', border:'none', borderBottom: roomTab===t?'2px solid var(--accent)':'2px solid transparent', color: roomTab===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: roomTab===t?700:400, cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* Chat */}
      {roomTab==='chat' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:12 }}>
            {messages.map(m => <Message key={m.id} m={m} onJoinCall={() => startCall('video')} />)}
            <div ref={endRef} />
          </div>
          {/* Share course modal */}
          {showShareCourse && (
            <div style={{ padding:'12px 20px', borderTop:'1px solid var(--border)', background:'var(--surface2)' }}>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:10 }}>Share a course to the group</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {COURSES.map(c => (
                  <div key={c.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'1px solid var(--border)', borderRadius:8, cursor:'pointer', background:'var(--surface)', transition:'border-color 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                  >
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{c.title}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.lessons} lessons · {c.price > 0 ? '$'+c.price : 'Free'}</div>
                    </div>
                    <button onClick={() => shareCourse(c)} style={{ padding:'5px 12px', background:'#10b981', color:'#fff', border:'none', borderRadius:6, fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>Share</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShareCourse(false)} style={{ marginTop:8, width:'100%', padding:'7px', background:'none', color:'var(--text-muted)', border:'1px solid var(--border)', borderRadius:6, fontFamily:'var(--font)', fontSize:12, cursor:'pointer' }}>Cancel</button>
            </div>
          )}
          {/* Compose */}
          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--surface)', display:'flex', gap:8, alignItems:'flex-end' }}>
            <button onClick={() => setShowShareCourse(!showShareCourse)} title="Share Course" style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'#10b981', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </button>
            <button title="Schedule Call" onClick={() => setRoomTab('calls')} style={{ width:36, height:36, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Message the group..." rows={1} style={{ flex:1, padding:'9px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none', lineHeight:1.5 }} />
            <button onClick={send} disabled={!msg.trim()} style={{ width:36, height:36, borderRadius:8, background: msg.trim()?'var(--accent)':'var(--surface2)', color: msg.trim()?'#fff':'var(--text-muted)', border:'none', cursor: msg.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Calls tab */}
      {roomTab==='calls' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)' }}>Calls & Scheduled Sessions</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => startCall('voice')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--surface2)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
                Voice
              </button>
              <button onClick={() => startCall('video')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                Video
              </button>
              <button onClick={() => startCall('facetime')} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#16a34a', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                FaceTime
              </button>
            </div>
          </div>

          <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:10 }}>Upcoming</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {SCHEDULED_CALLS.map(c => (
              <div key={c.id} style={{ border:'1px solid var(--border)', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:14, background:'var(--surface)' }}>
                <div style={{ width:40, height:40, borderRadius:10, background: c.type==='video'?'var(--accent-bg)':'var(--green-bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {c.type==='video'
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{c.title}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.host} · {c.time} · {c.duration} · {c.attendees} attending</div>
                </div>
                <button onClick={() => startCall(c.type)} style={{ padding:'7px 14px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                  {c.time.startsWith('Today') ? 'Join Now' : 'RSVP'}
                </button>
              </div>
            ))}
          </div>

          <button style={{ width:'100%', padding:'11px', background:'var(--surface2)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:10, fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            + Schedule a Call
          </button>
        </div>
      )}

      {/* Courses tab */}
      {roomTab==='courses' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)' }}>Group Courses</div>
            <button style={{ padding:'7px 14px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>+ Add Course</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {COURSES.map(c => (
              <div key={c.id} style={{ border:'1px solid var(--border)', borderRadius:12, padding:'16px 18px', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'center', background:'var(--surface)' }}>
                <div>
                  <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{c.title}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{c.desc}</div>
                  <div style={{ display:'flex', gap:12 }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.lessons} lessons</span>
                    <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{c.enrolled.toLocaleString()} enrolled</span>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end' }}>
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:700, color: c.price>0?'var(--accent)':'var(--green)' }}>{c.price>0?'$'+c.price:'Free'}</span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => { setRoomTab('chat'); setTimeout(()=>shareCourse(c),100); }} style={{ padding:'5px 10px', background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)', borderRadius:6, fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer' }}>Share to Chat</button>
                    <button style={{ padding:'5px 10px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:6, fontFamily:'var(--font)', fontSize:11, fontWeight:700, cursor:'pointer' }}>Open</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members tab */}
      {roomTab==='members' && (
        <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:16 }}>
            Members {group.type==='club' && <span style={{ fontSize:12, fontWeight:400, color:'var(--text-muted)' }}>({group.members}/{group.max} · intimate group)</span>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {MEMBERS.map(m => (
              <div key={m.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:'1px solid var(--border)', borderRadius:10, background:'var(--surface)' }}>
                <Av letter={m.name[0].toUpperCase()} grad={m.grad} size={36} online={m.online} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.name}</span>
                    {m.verified && <span style={{ color:'var(--accent)', fontSize:11 }}>✓</span>}
                    <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)', background:'var(--surface2)', padding:'1px 7px', borderRadius:20, border:'1px solid var(--border)' }}>{m.role}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color: m.online?'var(--green)':'var(--text-muted)' }}>{m.online?'Online':'Offline'}</div>
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => startCall('voice')} style={{ width:30, height:30, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
                  </button>
                  <button onClick={() => startCall('facetime')} style={{ width:30, height:30, borderRadius:6, background:'var(--green-bg)', border:'1px solid var(--green-border)', color:'var(--green)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font)', fontSize:9, fontWeight:700 }}>FT</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main GroupsTab ─────────────────────────────────────────────

export default function GroupsTab({ currentUserId }) {
  const [view, setView]         = useState('browse');
  const [filter, setFilter]     = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openGroup, setOpenGroup]   = useState(null);

  const allGroups = [...MOCK_CLUBS, ...MOCK_CHANNELS];
  const filtered  = allGroups.filter(g => {
    if (typeFilter === 'clubs'    && g.type !== 'club')    return false;
    if (typeFilter === 'channels' && g.type !== 'channel') return false;
    if (filter === 'joined' && !g.joined) return false;
    return true;
  });

  if (openGroup) return <GroupRoom group={openGroup} onBack={() => setOpenGroup(null)} />;

  return (
    <div style={{ fontFamily:'var(--font)' }}>

      {/* Header */}
      <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--accent)', marginBottom:6 }}>Community</div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--text)', letterSpacing:'-0.5px' }}>Groups</div>
          </div>
          <button style={{ padding:'9px 18px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>+ Create Group</button>
        </div>

        {/* Type explainer */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          <div style={{ padding:'12px 16px', background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'#d97706' }}>Clubs</span>
              <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:700, color:'#d97706', background:'rgba(217,119,6,0.1)', padding:'2px 7px', borderRadius:20 }}>Max 50 members</span>
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.55 }}>
              Intimate, high-touch communities. Capped at 50 so creators know every member personally. Think premium access, not broadcast.
            </div>
          </div>
          <div style={{ padding:'12px 16px', background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--accent)' }}>Channels</span>
              <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:700, color:'var(--accent)', background:'var(--accent-bg)', padding:'2px 7px', borderRadius:20 }}>Unlimited members</span>
            </div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.55 }}>
              Discord-style broadcast communities. Scale to thousands. Creators publish content, members engage and subscribe.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          {['all','clubs','channels'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid var(--border)', background: typeFilter===t?'var(--accent)':'var(--surface)', color: typeFilter===t?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: typeFilter===t?600:400, cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
          ))}
          <div style={{ width:1, height:16, background:'var(--border)', margin:'0 4px' }} />
          <button onClick={() => setFilter(filter==='joined'?'all':'joined')} style={{ padding:'6px 14px', borderRadius:20, border:'1px solid var(--border)', background: filter==='joined'?'var(--green-bg)':'var(--surface)', color: filter==='joined'?'var(--green)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight: filter==='joined'?600:400, cursor:'pointer' }}>My Groups</button>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
        {filtered.map(g => <GroupCard key={g.id} g={g} onOpen={setOpenGroup} />)}
      </div>
    </div>
  );
}
