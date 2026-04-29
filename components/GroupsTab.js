'use client';
import { useState, useRef, useEffect } from 'react';

// ── Persistence helpers ───────────────────────────────────────
function saveGroups(groups) {
  try { localStorage.setItem('tr_groups', JSON.stringify(groups)); } catch(e) {}
}
function loadGroups() {
  try { const d = localStorage.getItem('tr_groups'); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}
function saveChatKey(groupId) { return 'tr_chat_' + groupId; }
function saveChat(groupId, messages) {
  try { localStorage.setItem(saveChatKey(groupId), JSON.stringify(messages)); } catch(e) {}
}
function loadChat(groupId) {
  try { const d = localStorage.getItem(saveChatKey(groupId)); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}

// ── Avatar ────────────────────────────────────────────────────
function Av({ letter, grad, size=36, online }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:size*0.34, fontWeight:800, color:'#fff' }}>{letter}</div>
      {online !== undefined && <div style={{ position:'absolute', bottom:1, right:1, width:8, height:8, borderRadius:'50%', background: online?'var(--green)':'var(--surface3)', border:'2px solid var(--surface)' }} />}
    </div>
  );
}

// ── Call UI ───────────────────────────────────────────────────
function CallOverlay({ callType, groupName, targetName, onEnd }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = async () => {
      try {
        const constraints = callType === 'video' ? { audio: true, video: true } : { audio: true, video: false };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setConnected(true);
      } catch(e) {
        setConnected(true); // Still show UI even if no permission
      }
    };
    start();
    const timer = setInterval(() => setElapsed(s => s+1), 1000);
    return () => {
      clearInterval(timer);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const toggleMute = () => {
    if(streamRef.current) streamRef.current.getAudioTracks().forEach(t => t.enabled = muted);
    setMuted(!muted);
  };

  const toggleCam = () => {
    if(streamRef.current) streamRef.current.getVideoTracks().forEach(t => t.enabled = camOff);
    setCamOff(!camOff);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'#0a0a0a', zIndex:2000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
      {callType === 'video' && (
        <video ref={remoteVideoRef} autoPlay playsInline style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.3 }} />
      )}
      <div style={{ position:'relative', textAlign:'center', zIndex:1 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)', marginBottom:12 }}>
          {callType === 'video' ? 'Video Call' : 'Voice Call'} · {targetName || groupName}
        </div>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:28, fontWeight:800, color:'#fff', margin:'0 auto 16px' }}>
          {(targetName||groupName)[0]}
        </div>
        <div style={{ fontFamily:'var(--font)', fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>{targetName || groupName}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:14, color:'rgba(255,255,255,0.5)' }}>{connected ? fmt(elapsed) : 'Connecting...'}</div>
      </div>

      {callType === 'video' && (
        <video ref={localVideoRef} autoPlay playsInline muted style={{ position:'absolute', bottom:80, right:20, width:120, height:90, objectFit:'cover', borderRadius:10, border:'2px solid rgba(255,255,255,0.2)', zIndex:2 }} />
      )}

      <div style={{ position:'absolute', bottom:40, display:'flex', gap:16, zIndex:2 }}>
        <button onClick={toggleMute} style={{ width:52, height:52, borderRadius:'50%', background: muted?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {muted
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          }
        </button>
        {callType === 'video' && (
          <button onClick={toggleCam} style={{ width:52, height:52, borderRadius:'50%', background: camOff?'rgba(255,255,255,0.2)':'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>{camOff && <line x1="1" y1="1" x2="23" y2="23"/>}</svg>
          </button>
        )}
        <button onClick={onEnd} style={{ width:52, height:52, borderRadius:'50%', background:'#dc2626', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.42 19.42 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.16 7.91"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Chat Message ──────────────────────────────────────────────
function ChatMessage({ m, onJoinCall }) {
  if (m.type === 'call_invite') {
    return (
      <div style={{ display:'flex', justifyContent:'center', margin:'6px 0' }}>
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:12, padding:'12px 16px', maxWidth:300, width:'100%' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">{m.callType==='video'?<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>:<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/>}</svg>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{m.callType==='video'?'Video':'Voice'} call started</div>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)', marginBottom:10 }}>Started by {m.user} · Tap to join</div>
          <button onClick={() => onJoinCall(m.callType)} style={{ width:'100%', padding:'8px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer' }}>Join Call</button>
        </div>
      </div>
    );
  }

  if (m.type === 'image') {
    const isMe = m.user === 'you';
    return (
      <div style={{ display:'flex', gap:8, flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end', marginBottom:2 }}>
        <Av letter={m.avatar} grad={m.grad} size={28} />
        <div style={{ maxWidth:'70%' }}>
          {!isMe && <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', marginBottom:2 }}>{m.user}</div>}
          <img src={m.url} alt="attachment" style={{ maxWidth:'100%', borderRadius:10, display:'block', border:'1px solid var(--border)' }} />
          <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', marginTop:2, textAlign: isMe?'right':'left' }}>{m.time}</div>
        </div>
      </div>
    );
  }

  if (m.type === 'file') {
    const isMe = m.user === 'you';
    return (
      <div style={{ display:'flex', gap:8, flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end', marginBottom:2 }}>
        <Av letter={m.avatar} grad={m.grad} size={28} />
        <div style={{ maxWidth:'70%' }}>
          {!isMe && <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', marginBottom:2 }}>{m.user}</div>}
          <div style={{ background: isMe?'var(--accent)':'var(--surface2)', padding:'10px 14px', borderRadius:10, display:'flex', alignItems:'center', gap:10 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isMe?'rgba(255,255,255,0.8)':'var(--text-muted)'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color: isMe?'#fff':'var(--text)' }}>{m.fileName}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color: isMe?'rgba(255,255,255,0.7)':'var(--text-muted)' }}>{m.fileSize}</div>
            </div>
          </div>
          <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', marginTop:2, textAlign: isMe?'right':'left' }}>{m.time}</div>
        </div>
      </div>
    );
  }

  const isMe = m.user === 'you';
  return (
    <div style={{ display:'flex', gap:8, flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end', marginBottom:2 }}>
      <Av letter={m.avatar} grad={m.grad} size={28} />
      <div style={{ maxWidth:'75%' }}>
        {!isMe && <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', marginBottom:2 }}>{m.user}</div>}
        <div style={{ background: isMe?'var(--accent)':'var(--surface2)', color: isMe?'#fff':'var(--text)', padding:'9px 13px', borderRadius: isMe?'16px 4px 16px 16px':'4px 16px 16px 16px', fontFamily:'var(--font)', fontSize:13, lineHeight:1.5 }}>{m.text}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', marginTop:2, textAlign: isMe?'right':'left' }}>{m.time}</div>
      </div>
    </div>
  );
}

// ── Group Room ────────────────────────────────────────────────
function GroupRoom({ group, onBack }) {
  const [roomTab, setRoomTab] = useState('chat');
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState(() => loadChat(group.id));
  const [activeCall, setActiveCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [callTarget, setCallTarget] = useState(null);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  // Save chat whenever messages change
  useEffect(() => { saveChat(group.id, messages); }, [messages, group.id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const addMsg = (m) => setMessages(p => [...p, m]);

  const send = () => {
    if(!msg.trim()) return;
    addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), text:msg, type:'text' });
    setMsg('');
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      if(isImage) {
        addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), type:'image', url:ev.target.result });
      } else {
        addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}), type:'file', fileName:file.name, fileSize: file.size > 1024*1024 ? (file.size/1024/1024).toFixed(1)+'MB' : Math.round(file.size/1024)+'KB' });
      }
    };
    isImage ? reader.readAsDataURL(file) : reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const [pendingCall, setPendingCall] = useState(null); // { type, target }

  const startCall = (type, target=null) => {
    setPendingCall({ type, target });
  };

  const [inviteStep, setInviteStep] = useState(false);
  const [invitedMembers, setInvitedMembers] = useState([]);

  const MEMBERS_LIST = [
    { name: group.creator || 'Creator', grad:'linear-gradient(135deg,#16a34a,#15803d)', online:true },
    { name:'you', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', online:true },
  ].filter(m => m.name !== 'you');

  const confirmCall = (option) => {
    if(!pendingCall) return;
    const { type, target } = pendingCall;
    if(option === 'cancel') { setPendingCall(null); setInviteStep(false); setInvitedMembers([]); return; }
    if(option === 'invite_select') { setInviteStep(true); return; }
    setPendingCall(null); setInviteStep(false); setInvitedMembers([]);
    const now = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    if(option === 'start') {
      addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:now, type:'call_invite', callType:type });
      setCallType(type); setCallTarget(target); setActiveCall(true);
    }
    if(option === 'invite_chat') {
      addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:now, type:'call_invite', callType:type });
    }
    if(option === 'invite_members') {
      const names = invitedMembers.join(', ');
      addMsg({ id:Date.now(), user:'you', avatar:'D', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', time:now, type:'call_invite', callType:type, invitedNames:names });
      setCallType(type); setCallTarget(target); setActiveCall(true);
    }
  };

  const toggleMember = (name) => setInvitedMembers(p => p.includes(name) ? p.filter(n=>n!==name) : [...p,name]);

  const phoneIcon = (type) => type==='video'
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>;

  const CallConfirmModal = pendingCall ? (() => {
    const { type, target } = pendingCall;
    const label = type === 'video' ? 'Video Call' : 'Voice Call';
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:24, width:360, maxWidth:'92vw', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{label}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>{target ? `with ${target}` : group.name}</div>

          {!inviteStep ? (
            <>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {[
                  { key:'start', color:'var(--accent)', icon:phoneIcon(type), label:'Start call', desc:'Join now and post invite to chat' },
                  { key:'invite_chat', color:'var(--text)', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, label:'Send to chat', desc:'Post invite link in group chat' },
                  { key:'invite_select', color:'var(--text)', icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label:'Invite members', desc:'Choose specific members to invite' },
                ].map(o => (
                  <button key={o.key} onClick={() => confirmCall(o.key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer', textAlign:'left', width:'100%' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}>
                    <div style={{ color:o.color, flexShrink:0 }}>{o.icon}</div>
                    <div>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:o.color }}>{o.label}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{o.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => confirmCall('cancel')} style={{ width:'100%', padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            </>
          ) : (
            <>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.08em' }}>Select members to invite</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:16, maxHeight:200, overflowY:'auto' }}>
                {MEMBERS_LIST.length === 0
                  ? <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', padding:'10px 0' }}>No other members yet.</div>
                  : MEMBERS_LIST.map(m => {
                    const sel = invitedMembers.includes(m.name);
                    return (
                      <div key={m.name} onClick={() => toggleMember(m.name)} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:`1px solid ${sel?'var(--accent)':'var(--border)'}`, background: sel?'var(--accent-bg)':'var(--surface2)', cursor:'pointer' }}>
                        <div style={{ width:30, height:30, borderRadius:'50%', background:m.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:800, color:'#fff', flexShrink:0 }}>{m.name[0].toUpperCase()}</div>
                        <div style={{ flex:1, fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: sel?'var(--accent)':'var(--text)' }}>{m.name}</div>
                        <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${sel?'var(--accent)':'var(--border)'}`, background: sel?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setInviteStep(false)} style={{ flex:1, padding:'10px', borderRadius:10, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Back</button>
                <button onClick={() => confirmCall('invite_members')} disabled={invitedMembers.length===0} style={{ flex:2, padding:'10px', borderRadius:10, border:'none', background: invitedMembers.length>0?'var(--accent)':'var(--surface3)', color: invitedMembers.length>0?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor: invitedMembers.length>0?'pointer':'default' }}>
                  Send Invite{invitedMembers.length>0?` (${invitedMembers.length})`:''}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  })() : null;

  const endCall = () => { setActiveCall(false); setCallType(null); setCallTarget(null); };

  const MEMBERS = [
    { name: group.creator || 'Creator', role:'Creator', grad:'linear-gradient(135deg,#16a34a,#15803d)', online:true },
    { name:'you', role:'Member', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', online:true },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font)' }}>
      {CallConfirmModal}
      {activeCall && <CallOverlay callType={callType} groupName={group.name} targetName={callTarget} onEnd={endCall} />}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" style={{ display:'none' }} onChange={handleFile} />

      {/* Header */}
      <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, background:'var(--surface)', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font)', fontSize:12, padding:'4px 8px', borderRadius:6 }}
          onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background='none'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <div style={{ width:28, height:28, borderRadius:7, background:group.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:800, color:'#fff' }}>{group.name[0]}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{group.name}</div>
          <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{group.type==='club' ? group.members+'/'+group.max+' members' : (group.members||1)+' members'}</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {[['voice','var(--accent)',<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>],['video','var(--accent)',<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>]].map(([type,color,icon]) => (
            <button key={type} onClick={() => startCall(type)} title={type+' call'} style={{ width:30, height:30, borderRadius:7, background:'var(--surface2)', border:'1px solid var(--border)', color, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--accent-bg)'}
              onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}>
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0 }}>
        {['chat','members'].map(t => (
          <button key={t} onClick={() => setRoomTab(t)} style={{ padding:'8px 16px', background:'none', border:'none', borderBottom: roomTab===t?'2px solid var(--accent)':'2px solid transparent', color: roomTab===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, fontWeight: roomTab===t?700:400, cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
        ))}
      </div>

      {/* Chat */}
      {roomTab==='chat' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ flex:1, overflowY:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.length === 0 && (
              <div style={{ textAlign:'center', padding:'30px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages yet. Say hello!</div>
            )}
            {messages.map(m => <ChatMessage key={m.id} m={m} onJoinCall={(t) => startCall(t)} />)}
            <div ref={endRef} />
          </div>
          <div style={{ padding:'10px 12px', borderTop:'1px solid var(--border)', display:'flex', gap:8, alignItems:'flex-end' }}>
            <button onClick={() => fileInputRef.current?.click()} title="Attach file" style={{ width:32, height:32, borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </button>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }} placeholder="Message the group..." rows={1} style={{ flex:1, padding:'8px 12px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none' }} />
            <button onClick={send} disabled={!msg.trim()} style={{ width:32, height:32, borderRadius:8, background: msg.trim()?'var(--accent)':'var(--surface2)', color: msg.trim()?'#fff':'var(--text-muted)', border:'none', cursor: msg.trim()?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      {roomTab==='members' && (
        <div style={{ flex:1, overflowY:'auto', padding:'14px' }}>
          <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:700, color:'var(--text)', marginBottom:10 }}>Members · {MEMBERS.length}</div>
          {MEMBERS.map(m => (
            <div key={m.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <Av letter={m.name[0].toUpperCase()} grad={m.grad} size={36} online={m.online} />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.name}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:10, color: m.online?'var(--green)':'var(--text-muted)' }}>{m.role} · {m.online?'Online':'Offline'}</div>
              </div>
              {m.name !== 'you' && (
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => startCall('voice', m.name)} title="Voice call" style={{ width:28, height:28, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z"/></svg>
                  </button>
                  <button onClick={() => startCall('video', m.name)} title="Video call" style={{ width:28, height:28, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Group Row ─────────────────────────────────────────────────
function GroupRow({ g, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(g)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', borderRadius:8, margin:'2px 6px', background: hov?'var(--surface2)':'transparent' }}>
      <div style={{ width:38, height:38, borderRadius:10, background:g.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>{g.name[0]}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.type==='club'?g.members+'/'+g.max+' members':(g.members||1)+' members'}</span>
          {g.price>0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:'var(--accent)' }}>${g.price}/mo</span>}
        </div>
      </div>
    </div>
  );
}

// ── Create Group Modal ────────────────────────────────────────
function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('club');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const GRADS = ['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#0891b2,#0e7490)','linear-gradient(135deg,#16a34a,#15803d)','linear-gradient(135deg,#d97706,#b45309)','linear-gradient(135deg,#dc2626,#b91c1c)'];
  const [grad, setGrad] = useState(GRADS[0]);

  const submit = () => {
    if(!name.trim()) return;
    onCreate({ id:Date.now(), name, type, price:parseFloat(price)||0, desc, grad, members:1, max:50, joined:true, creator:'you' });
    onClose();
  };

  const inputStyle = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:420, maxWidth:'90vw', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Create a Group</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Group Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. COT Swing Traders" style={inputStyle} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Type</label>
          <div style={{ display:'flex', gap:8 }}>
            {['club','channel'].map(t => (
              <button key={t} onClick={() => setType(t)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${type===t?'var(--accent)':'var(--border)'}`, background: type===t?'var(--accent-bg)':'var(--surface2)', color: type===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                {t==='club'?'👥 Club (max 50)':'📢 Channel'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Monthly Price ($)</label>
          <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Leave blank for free" type="number" min="0" style={inputStyle} />
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="What is this group about?" rows={3} style={{...inputStyle, resize:'none'}} />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:8 }}>Color</label>
          <div style={{ display:'flex', gap:8 }}>
            {GRADS.map(g => <div key={g} onClick={() => setGrad(g)} style={{ width:28, height:28, borderRadius:8, background:g, cursor:'pointer', border: grad===g?'3px solid var(--text)':'3px solid transparent' }} />)}
          </div>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background: name.trim()?'var(--accent)':'var(--surface3)', color: name.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor: name.trim()?'pointer':'default' }}>Create Group</button>
        </div>
      </div>
    </div>
  );
}

// ── Main GroupsTab ────────────────────────────────────────────
export default function GroupsTab({ currentUserId }) {
  const [groups, setGroups] = useState(() => loadGroups());
  const [filter, setFilter] = useState('all');
  const [openGroup, setOpenGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Save groups to localStorage whenever they change
  useEffect(() => { saveGroups(groups); }, [groups]);

  const shown = filter==='clubs' ? groups.filter(g=>g.type==='club') :
                filter==='channels' ? groups.filter(g=>g.type==='channel') : groups;

  const createGroup = (g) => {
    const newGroups = [g, ...groups];
    setGroups(newGroups);
    setOpenGroup(g);
  };

  if (openGroup) {
    // Make sure we always open latest version of group
    const latest = groups.find(g => g.id === openGroup.id) || openGroup;
    return <GroupRoom group={latest} onBack={() => setOpenGroup(null)} />;
  }

  return (
    <div style={{ fontFamily:'var(--font)', height:'100%', display:'flex', flexDirection:'column' }}>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreate={createGroup} />}

      <div style={{ padding:'12px 12px 10px', flexShrink:0 }}>
        <button onClick={() => setShowCreate(true)} style={{ width:'100%', padding:'9px', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, fontFamily:'var(--font)', fontSize:12, fontWeight:700, cursor:'pointer', marginBottom:10 }}>+ Create Group</button>
        <div style={{ display:'flex', gap:4 }}>
          {['all','clubs','channels'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:'3px 10px', borderRadius:20, border:'1px solid var(--border)', background: filter===f?'var(--accent)':'transparent', color: filter===f?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:10, fontWeight: filter===f?600:400, cursor:'pointer', textTransform:'capitalize' }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', paddingBottom:8 }}>
        {groups.length === 0 ? (
          <div style={{ padding:'40px 16px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No groups yet</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>Create your first group to get started.</div>
          </div>
        ) : (
          <>
            {shown.filter(g=>g.joined).length > 0 && (
              <div>
                <div style={{ padding:'8px 14px 4px', fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>My Groups</div>
                {shown.filter(g=>g.joined).map(g => <GroupRow key={g.id} g={g} onSelect={setOpenGroup} />)}
              </div>
            )}
            {shown.filter(g=>!g.joined).length > 0 && (
              <div>
                <div style={{ padding:'8px 14px 4px', fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>Discover</div>
                {shown.filter(g=>!g.joined).map(g => <GroupRow key={g.id} g={g} onSelect={setOpenGroup} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
