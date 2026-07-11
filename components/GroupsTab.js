'use client'
import React, { useState, useRef, useEffect, useContext } from 'react';
import { UserAvatarContext } from './UserAvatarContext';

// ── Persistence helpers ───────────────────────────────────────
function saveGroups(groups) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('tr_groups', JSON.stringify(groups)); } catch(e) {}
}
function loadGroups() {
  if (typeof window === "undefined") return [];
  try { const d = localStorage.getItem('tr_groups'); if (!d) return []; return JSON.parse(d).map(g => ({ type:'club', visibility:'open', country:'', desc:'', profileImg:null, ...g })); } catch(e) { return []; }
}
function compressImage(file, maxPx = 200, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}
function saveChatKey(groupId) { return 'tr_chat_' + groupId; }
function saveChat(groupId, messages) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(saveChatKey(groupId), JSON.stringify(messages)); } catch(e) {}
}
function loadChat(groupId) {
  if (typeof window === 'undefined') return [];
  try { const d = localStorage.getItem(saveChatKey(groupId)); return d ? JSON.parse(d) : []; } catch(e) { return []; }
}

// ── Avatar ────────────────────────────────────────────────────
function Av({ letter, grad, size=36, online, imageUrl }) {
  return (
    <div suppressHydrationWarning style={{ position:'relative', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:imageUrl?'transparent':grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:size*0.34, fontWeight:800, color:'#fff', overflow:'hidden' }}>
        {imageUrl ? <img src={imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : letter}
      </div>
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
const INVITE_PREFIX = '__CONTEST_INVITE__';
function parseContestInvite(text) {
  if (!text?.startsWith(INVITE_PREFIX)) return null;
  try { return JSON.parse(text.slice(INVITE_PREFIX.length)); } catch { return null; }
}

function ContestInviteCard({ invite }) {
  const [joined, setJoined] = React.useState(false);
  const [joining, setJoining] = React.useState(false);

  const handleJoin = async () => {
    if (joined || joining) return;
    setJoining(true);
    try {
      const res = await fetch('/api/group-contests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'join', contestId: invite.id }) });
      if (res.ok) setJoined(true);
    } catch {}
    setJoining(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0' }}>
      <div style={{ maxWidth: 300, width: '100%', background: 'var(--surface)', border: '1.5px solid #534AB7', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(83,74,183,0.15)' }}>
        <div style={{ background: 'linear-gradient(135deg, #534AB7, #7c3aed)', padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏆</span>
          <div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contest Invite</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{invite.name}</div>
          </div>
        </div>
        <div style={{ padding: '10px 14px 12px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Asset</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.asset || 'Any'}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Entry</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.buyIn > 0 ? `$${invite.buyIn}` : 'Free'}</div>
            </div>
            <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Members</div>
              <div style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{invite.memberCount || 1}</div>
            </div>
          </div>
          <button
            onClick={handleJoin}
            disabled={joined || joining}
            style={{ width: '100%', padding: '9px', border: 'none', borderRadius: 9, background: joined ? '#16a34a' : joining ? 'var(--surface3)' : '#534AB7', color: joined || joining ? (joined ? '#fff' : 'var(--text-muted)') : '#fff', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, cursor: joined || joining ? 'default' : 'pointer' }}
          >
            {joined ? '✓ Joined!' : joining ? 'Joining…' : 'Join Contest'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ m, onJoinCall, myAvatar }) {
  // Contest invite — check first, regardless of type
  const contestInvite = parseContestInvite(m.text);
  if (contestInvite) return <ContestInviteCard invite={contestInvite} />;

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
        <Av letter={m.avatar} grad={m.grad} size={28} imageUrl={isMe ? myAvatar : null} />
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
        <Av letter={m.avatar} grad={m.grad} size={28} imageUrl={isMe ? myAvatar : null} />
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
  const invite = parseContestInvite(m.text);
  if (invite) return <ContestInviteCard invite={invite} />;
  return (
    <div style={{ display:'flex', gap:8, flexDirection: isMe?'row-reverse':'row', alignItems:'flex-end', marginBottom:2 }}>
      <Av letter={m.avatar} grad={m.grad} size={28} imageUrl={isMe ? myAvatar : null} />
      <div style={{ maxWidth:'75%' }}>
        {!isMe && <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', marginBottom:2 }}>{m.user}</div>}
        <div style={{ background: isMe?'var(--accent)':'var(--surface2)', color: isMe?'#fff':'var(--text)', padding:'9px 13px', borderRadius: isMe?'16px 4px 16px 16px':'4px 16px 16px 16px', fontFamily:'var(--font)', fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap' }}>{m.text}</div>
        <div style={{ fontFamily:'var(--font)', fontSize:9, color:'var(--text-muted)', marginTop:2, textAlign: isMe?'right':'left' }}>{m.time}</div>
      </div>
    </div>
  );
}

// ── Group Room ────────────────────────────────────────────────

function GroupSettings({ group, onUpdate }) {
  const [name, setName] = React.useState(group.name || '');
  const [desc, setDesc] = React.useState(group.desc || '');
  const [country, setCountry] = React.useState(group.country || '');
  const [visibility, setVisibility] = React.useState(group.visibility || 'open');
  const [price, setPrice] = React.useState(group.price || '');
  const [profileImg, setProfileImg] = React.useState(group.profileImg || null);
  const [grad, setGrad] = React.useState(group.grad || 'linear-gradient(135deg,#4f46e5,#7c3aed)');
  const [saved, setSaved] = React.useState(false);
  const imgRef = React.useRef(null);

  const GRADS = [
    'linear-gradient(135deg,#4f46e5,#7c3aed)',
    'linear-gradient(135deg,#0891b2,#0e7490)',
    'linear-gradient(135deg,#16a34a,#15803d)',
    'linear-gradient(135deg,#d97706,#b45309)',
    'linear-gradient(135deg,#dc2626,#b91c1c)',
  ];

  const VIS = [
    { key:'open',   label:'Open',        icon:'🌐', desc:'Anyone can join instantly' },
    { key:'invite', label:'Invite Only',  icon:'✉️',  desc:'Members must be approved by the founder' },
    { key:'closed', label:'Closed',       icon:'🔒', desc:'Hidden from discovery, invite link only' },
  ];

  const handleImg = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const compressed = await compressImage(f);
    setProfileImg(compressed);
  };

  const save = () => {
    onUpdate({ name, desc, country, visibility, price: parseFloat(price) || 0, profileImg, grad });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  };

  const COUNTRIES = [
    'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Azerbaijan',
    'Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Brazil','Bulgaria','Cambodia',
    'Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Ecuador',
    'Egypt','Estonia','Finland','France','Germany','Ghana','Greece','Hungary','India',
    'Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan',
    'Kenya','Kuwait','Latvia','Lebanon','Lithuania','Malaysia','Mexico','Morocco',
    'Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines',
    'Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore',
    'South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand',
    'Turkey','UAE','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam',
  ];

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
      <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:16 }}>Group Settings</div>

      {/* Photo */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, padding:'14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)' }}>
        <div onClick={() => imgRef.current && imgRef.current.click()} style={{ width:56, height:56, borderRadius: group.type === 'club' ? '50%' : 12, background:grad, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', border:'2px solid var(--border)', flexShrink:0 }}>
          {profileImg
            ? <img src={profileImg} alt="group" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <span style={{ fontFamily:'var(--font-mono)', fontSize:20, fontWeight:800, color:'#fff' }}>{name ? name[0].toUpperCase() : '?'}</span>}
        </div>
        <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg} />
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Group Photo</div>
          <div style={{ display:'flex', gap:6, marginBottom:6 }}>
            {GRADS.map(g => (
              <div key={g} onClick={() => { setGrad(g); setProfileImg(null); }}
                style={{ width:20, height:20, borderRadius:5, background:g, cursor:'pointer', border: grad===g && !profileImg ? '2px solid var(--text)' : '2px solid transparent' }} />
            ))}
          </div>
          <button onClick={() => imgRef.current && imgRef.current.click()} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Upload image</button>
        </div>
      </div>

      {/* Name */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Group Name</label>
        <input value={name} onChange={e => setName(e.target.value)} style={inp} />
      </div>

      {/* Bio */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Bio / Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Tell people what your group is about..." rows={3} style={{ ...inp, resize:'none' }} />
      </div>

      {/* Visibility */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Visibility</label>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {VIS.map(v => (
            <div key={v.key} onClick={() => setVisibility(v.key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid ' + (visibility===v.key ? 'var(--accent)' : 'var(--border)'), background: visibility===v.key ? 'var(--accent-bg)' : 'var(--surface2)', cursor:'pointer', transition:'all 0.15s' }}>
              <span style={{ fontSize:15 }}>{v.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: visibility===v.key ? 'var(--accent)' : 'var(--text)' }}>{v.label}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{v.desc}</div>
              </div>
              <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid ' + (visibility===v.key ? 'var(--accent)' : 'var(--border)'), background: visibility===v.key ? 'var(--accent)' : 'transparent', flexShrink:0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Country */}
      <div style={{ marginBottom:14 }}>
        <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Country</label>
        <select value={country} onChange={e => setCountry(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
          <option value="">Select a country...</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Price */}
      <div style={{ marginBottom:20 }}>
        <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Monthly Price ($)</label>
        <input value={price} onChange={e => setPrice(e.target.value)} type="number" min="0" placeholder="0 for free" style={inp} />
      </div>

      <button onClick={save} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
        {saved ? '✓ Saved' : 'Save Changes'}
      </button>
    </div>
  );
}

function GroupRoom({ group, onBack, onUpdateGroup }) {
  const myAvatar = useContext(UserAvatarContext);
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

  // Load real API messages for API-backed groups (UUID IDs)
  useEffect(() => {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(group.id);
    if (!isUUID) return;
    fetch(`/api/groups/channels?groupId=${group.id}`)
      .then(r => r.json())
      .then(d => {
        const ch = (d.channels || []).find(c => c.name === 'general') || (d.channels || [])[0];
        if (!ch) return;
        return fetch(`/api/groups/messages?channelId=${ch.id}`).then(r => r.json());
      })
      .then(d => {
        if (!d?.messages?.length) return;
        const apiMsgs = d.messages.map(m => ({
          id: `api_${m.id}`,
          user: m.authorName || 'Trader',
          avatar: (m.authorName || 'T')[0].toUpperCase(),
          grad: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: m.content,
          type: m.content?.startsWith('__CONTEST_INVITE__') ? 'contest_invite' : 'text',
          fromApi: true,
        }));
        setMessages(prev => {
          const existingApiIds = new Set(prev.filter(m => m.fromApi).map(m => m.id));
          const newMsgs = apiMsgs.filter(m => !existingApiIds.has(m.id));
          if (!newMsgs.length) return prev;
          const localMsgs = prev.filter(m => !m.fromApi);
          return [...newMsgs, ...localMsgs].sort((a, b) => a.id < b.id ? -1 : 1);
        });
      })
      .catch(() => {});
  }, [group.id]);

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
  const MEMBERS = group.creator === 'you' ? [
    { name:'you', role:'Founder', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', online:true },
  ] : [
    { name: group.creator || 'Creator', role:'Founder', grad:'linear-gradient(135deg,#16a34a,#15803d)', online:true },
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
        <div style={{ width:28, height:28, borderRadius: group.type === 'club' ? '50%' : 7, background:group.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:11, fontWeight:800, color:'#fff', overflow:'hidden', flexShrink:0 }}>{group.profileImg ? <img src={group.profileImg} alt={group.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : group.name[0]}</div>
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
        {['chat','members','settings'].map(t => (
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
            {messages.map(m => <ChatMessage key={m.id} m={m} onJoinCall={(t) => startCall(t)} myAvatar={myAvatar} />)}
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

      {/* Settings */}
      {roomTab==='settings' && (
        <GroupSettings group={group} onUpdate={(updated) => {
          const fullUpdate = { ...group, ...updated };
          const all = loadGroups();
          const idx = all.findIndex(g => g.id === group.id);
          if (idx !== -1) { all[idx] = fullUpdate; saveGroups(all); }
          if (onUpdateGroup) onUpdateGroup(fullUpdate);
        }} />
      )}
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
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {group.creator === 'you' && (
                    <select value={m.role} onChange={e => {
                      const newRole = e.target.value;
                      const all = loadGroups();
                      const idx = all.findIndex(g => g.id === group.id);
                      if (idx !== -1) { if (!all[idx].memberRoles) all[idx].memberRoles = {}; all[idx].memberRoles[m.name] = newRole; saveGroups(all); }
                      if (onUpdateGroup) onUpdateGroup({ ...group, memberRoles: { ...(group.memberRoles||{}), [m.name]: newRole } });
                    }} style={{ padding:'3px 7px', borderRadius:6, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:10, cursor:'pointer' }}>
                      <option value='Member'>Member</option>
                      <option value='Co-Leader'>Co-Leader</option>
                    </select>
                  )}
                  <button onClick={() => startCall('voice', m.name)} title='Voice call' style={{ width:28, height:28, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><path d='M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 9.91 19.79 19.79 0 0 1 1.19 1.28 2 2 0 0 1 3.18 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 14.92z'/></svg>
                  </button>
                  <button onClick={() => startCall('video', m.name)} title='Video call' style={{ width:28, height:28, borderRadius:6, background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'><polygon points='23 7 16 12 23 17 23 7'/><rect x='1' y='5' width='15' height='14' rx='2'/></svg>
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
// ── Create Group Modal ────────────────────────────────────────

function InfoDot({ tip }) {
  const [show, setShow] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={e => { e.stopPropagation(); setShow(s => !s); }}
      style={{ position:'relative', display:'inline-flex', alignItems:'center', flexShrink:0 }}
    >
      <span style={{ width:14, height:14, borderRadius:'50%', background:'var(--surface3)', border:'1px solid var(--border2, var(--border))', color:'var(--text-muted)', fontSize:9, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', userSelect:'none' }}>i</span>
      {show && (
        <span style={{ position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', fontSize:12, color:'var(--text)', lineHeight:1.6, width:220, zIndex:999, boxShadow:'0 8px 24px rgba(0,0,0,0.2)', pointerEvents:'none', fontWeight:400, textAlign:'left' }}>
          {tip}
        </span>
      )}
    </span>
  );
}

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('club');
  const [price, setPrice] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [country, setCountry] = React.useState('');
  const [visibility, setVisibility] = React.useState('open');
  const [profileImg, setProfileImg] = React.useState(null);
  const imgRef = React.useRef(null);
  const GRADS = ['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#0891b2,#0e7490)','linear-gradient(135deg,#16a34a,#15803d)','linear-gradient(135deg,#d97706,#b45309)','linear-gradient(135deg,#dc2626,#b91c1c)'];
  const [grad, setGrad] = React.useState(GRADS[0]);
  const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Azerbaijan','Bahrain','Bangladesh','Belarus','Belgium','Bolivia','Brazil','Bulgaria','Cambodia','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Estonia','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Latvia','Lebanon','Lithuania','Malaysia','Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam'];
  const VIS = [
    { key:'open',   label:'Open',        icon:'🌐', desc:'Anyone can join instantly' },
    { key:'invite', label:'Invite Only',  icon:'✉️',  desc:'Members must be approved by the founder' },
    { key:'closed', label:'Closed',       icon:'🔒', desc:'Hidden from discovery, invite link only' },
  ];
  const handleImg = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    const compressed = await compressImage(f);
    setProfileImg(compressed);
  };
  const submit = () => {
    if (!name.trim()) return;
    onCreate({ id:Date.now(), name, type, price:parseFloat(price)||0, desc, grad, country, visibility, profileImg, members:1, max:50, joined:true, creator:'you' });
    onClose();
  };
  const inp = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Create a Group</div>
        {/* Photo */}
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <div onClick={() => imgRef.current && imgRef.current.click()} style={{ width:64, height:64, borderRadius: type === 'club' ? '50%' : 14, background:grad, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', border:'2px solid var(--border)', flexShrink:0, position:'relative' }}>
            {profileImg ? <img src={profileImg} alt="group" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontFamily:'var(--font-mono)', fontSize:22, fontWeight:800, color:'#fff' }}>{name ? name[0].toUpperCase() : '?'}</span>}
          </div>
          <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleImg} />
          <div>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:4 }}>Group Photo</div>
            <div style={{ display:'flex', gap:6, marginBottom:6 }}>
              {GRADS.map(g => <div key={g} onClick={() => { setGrad(g); setProfileImg(null); }} style={{ width:22, height:22, borderRadius:6, background:g, cursor:'pointer', border: grad===g&&!profileImg?'2px solid var(--text)':'2px solid transparent' }} />)}
            </div>
            <button onClick={() => imgRef.current && imgRef.current.click()} style={{ padding:'3px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Upload image</button>
          </div>
        </div>
        {/* Name */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Group Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. COT Swing Traders" style={inp} />
        </div>
        {/* Type */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Type</label>
          <div style={{ display:'flex', gap:8 }}>
            {[{key:'club',label:'Club',tip:'A curated group of up to 50 members. Your inner circle — real relationships, more conversation. The people you build with daily.'},{key:'channel',label:'Channel',tip:'An open community with unlimited members. Built for broad reach — share ideas, host discussions, and grow your audience at scale.'}].map(({key:t,label,tip}) => (
              <button key={t} onClick={() => setType(t)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid '+(type===t?'var(--accent)':'var(--border)'), background:type===t?'var(--accent-bg)':'var(--surface2)', color:type===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {label}<InfoDot tip={tip} />
              </button>
            ))}
          </div>
          {type==='club' && <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8, background:'var(--accent-bg)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:12, color:'var(--accent)', lineHeight:1.5 }}>A curated group of up to 50 members. Your inner circle — real relationships, more conversation. The people you build with daily.</div>}
          {type==='channel' && <div style={{ marginTop:8, padding:'8px 12px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.5 }}>An open community with unlimited members. Built for broad reach — share ideas, host discussions, and grow your audience at scale.</div>}
        </div>
        {/* Visibility */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Visibility</label>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {VIS.map(v => (
              <div key={v.key} onClick={() => setVisibility(v.key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid '+(visibility===v.key?'var(--accent)':'var(--border)'), background:visibility===v.key?'var(--accent-bg)':'var(--surface2)', cursor:'pointer', transition:'all 0.15s' }}>
                <span style={{ fontSize:16 }}>{v.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:visibility===v.key?'var(--accent)':'var(--text)' }}>{v.label}</div>
                  <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{v.desc}</div>
                </div>
                <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid '+(visibility===v.key?'var(--accent)':'var(--border)'), background:visibility===v.key?'var(--accent)':'transparent', flexShrink:0 }} />
              </div>
            ))}
          </div>
        </div>
        {/* Country */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Country (optional)</label>
          <select value={country} onChange={e=>setCountry(e.target.value)} style={{...inp, cursor:'pointer'}}>
            <option value="">Select a country...</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Price */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Monthly Price ($)</label>
          <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Leave blank for free" type="number" min="0" style={inp} />
        </div>
        {/* Bio */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Bio / Description</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Tell people what your group is about, what to expect, and who it's for..." rows={3} style={{...inp, resize:'none'}} />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:name.trim()?'var(--accent)':'var(--surface3)', color:name.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:name.trim()?'pointer':'default' }}>Create Group</button>
        </div>
      </div>
    </div>
  );
}

// ── Main GroupsTab ────────────────────────────────────────────
export default function GroupsTab({ currentUserId, searchQuery = '' }) {
  const [groups, setGroups] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setGroups(loadGroups());
  }, []);

  const [filter, setFilter] = useState('all');
  const [openGroup, setOpenGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  // Save groups to localStorage whenever they change
  useEffect(() => { if (mounted) saveGroups(groups); }, [groups, mounted]);

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
    return <GroupRoom group={latest} onBack={() => setOpenGroup(null)} onUpdateGroup={(updated) => {
      setGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
      setOpenGroup(g => g ? { ...g, ...updated } : g);
    }} />;
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
        {/* Club & Channel explainer cards */}
        {filter !== "channels" && (
          <div style={{ margin:"8px 12px 0", padding:"12px 14px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
              <span style={{ fontFamily:"var(--font)", fontSize:12, fontWeight:700, color:"var(--text)" }}>Clubs</span>
            </div>
            <div style={{ fontFamily:"var(--font)", fontSize:11, color:"var(--text-muted)", lineHeight:1.6 }}>
              Clubs are small, private groups capped at 50 members. Think of it as someone's inner circle â€” close-knit, high signal, real conversation every day.
            </div>
          </div>
        )}
        {filter !== "clubs" && (
          <div style={{ margin:"8px 12px 0", padding:"12px 14px", borderRadius:10, background:"var(--surface2)", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
              <span style={{ fontFamily:"var(--font)", fontSize:12, fontWeight:700, color:"var(--text)" }}>Channels</span>
            </div>
            <div style={{ fontFamily:"var(--font)", fontSize:11, color:"var(--text-muted)", lineHeight:1.6 }}>
              Channels are where creators share their edge. Courses, trade ideas, market breakdowns, and live discussion â€” all in one place. Join free or paid channels from creators you trust.
            </div>
          </div>
        )}
        <div style={{ margin:"10px 12px 6px", borderBottom:"1px solid var(--border)" }} />
        {groups.length === 0 ? (
          <div style={{ padding:'40px 16px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }} suppressHydrationWarning>👥</div>
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
function GroupRow({ g, onSelect }) {
  const [hov, setHov] = useState(false);
  const vis = g.visibility || 'open';
  const visLabel = vis==='invite' ? 'Invite Only' : vis==='closed' ? 'Closed' : 'Open';
  const visBg     = vis==='invite' ? '#faeeda' : vis==='closed' ? '#fcebeb' : '#eaf3de';
  const visBorder = vis==='invite' ? '#fac775' : vis==='closed' ? '#f7c1c1' : '#c0dd97';
  const visColor  = vis==='invite' ? '#854f0b' : vis==='closed' ? '#a32d2d' : '#3b6d11';
  const memberStr = g.type==='club' ? g.members+'/'+(g.max||50)+' members' : (g.members||1)+' members';
  return (
    <div onClick={() => onSelect(g)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'var(--surface2)' : 'var(--surface)',
        border: '1px solid ' + (hov ? 'var(--border2,var(--border))' : 'var(--border)'),
        borderRadius: 12, padding: '14px 16px',
        cursor: 'pointer', margin: '6px 10px', transition: 'all 0.15s',
      }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{ width:48, height:48, borderRadius: g.type === 'club' ? '50%' : 10, background:g.grad||'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
          {g.profileImg ? <img src={g.profileImg} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>{g.name}</span>
            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:'var(--surface2)', color:'var(--text-muted)', border:'1px solid var(--border)', textTransform:'capitalize' }}>{g.type}</span>
            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:20, background:visBg, color:visColor, border:'1px solid '+visBorder, fontWeight:600, marginLeft:'auto' }}>{visLabel}</span>
          </div>
          {g.desc ? (
            <p style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', margin:'0 0 8px', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{g.desc}</p>
          ) : null}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{'members: '+memberStr}</span>
            {g.country ? <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{'location: '+g.country}</span> : null}
            {g.price > 0
              ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11, fontWeight:700, color:'var