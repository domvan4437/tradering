'use client'
import React, { useState, useEffect, useRef, useContext } from 'react';
import ReactDOM from 'react-dom';
import FeedTab from './FeedTab';
import DMTab from './DMTab';
import LocalTradersTab from './LocalTradersTab';
import { UserAvatarContext } from './UserAvatarContext';

const PURPLE = '#4f46e5';

function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) window.__goToProfile(slug);
}
function getColor(name) {
  const colors = ['#4f46e5','#7c3aed','#0891b2','#059669','#d97706','#dc2626'];
  return colors[(name||'?').charCodeAt(0) % colors.length];
}
function loadGroups() {
  if (typeof window === 'undefined') return [];
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

function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/social/leaderboard?search=' + encodeURIComponent(query) + '&limit=8');
        const data = await res.json();
        setResults(data.users || []);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:320 }}>
      <input value={query} onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={e => { e.target.style.borderColor=PURPLE; e.target.style.boxShadow='0 0 0 3px '+PURPLE+'18'; setOpen(true); }}
        onBlur={e => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
        placeholder="Search traders..."
        style={{ width:'100%', padding:'7px 14px', borderRadius:20, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
      {open && query.trim() && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.2)', zIndex:2990, maxHeight:320, overflowY:'auto' }}>
          {loading ? <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>Searching...</div>
          : results.length === 0 ? <div style={{ padding:16, fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)', textAlign:'center' }}>No traders found</div>
          : results.map(u => (
            <div key={u.id} onClick={() => { goToProfile(u.profileSlug||u.id); setOpen(false); setQuery(''); }}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', cursor:'pointer', borderBottom:'1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:getColor(u.name||u.displayName), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(u.displayName||u.name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{u.displayName||u.name||'Trader'}</span>
                {u.verifiedBadge && <span style={{ fontSize:11, color:PURPLE, marginLeft:4 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupChatRoom({ group, activeRoom, myName }) {
  const myAvatar = useContext(UserAvatarContext);
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [popover, setPopover] = useState(false);
  const [linkInput, setLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const fileRef = useRef(null);
  const popRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    try { const d = localStorage.getItem('tr_chat_'+group.id+'_'+activeRoom); setMessages(d ? JSON.parse(d) : []); } catch { setMessages([]); }
  }, [group.id, activeRoom]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  useEffect(() => {
    const handler = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setPopover(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const isImg = f.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({ type:isImg?'image':'file', url:isImg?ev.target.result:null, name:f.name, size:f.size>1024*1024?(f.size/1024/1024).toFixed(1)+'MB':Math.round(f.size/1024)+'KB' });
    };
    isImg ? reader.readAsDataURL(f) : reader.readAsArrayBuffer(f);
    e.target.value = '';
    setPopover(false);
  };

  const attachLink = () => {
    if (!linkUrl.trim()) return;
    const url = linkUrl.startsWith('http') ? linkUrl : 'https://'+linkUrl;
    setAttachment({ type:'link', url, name:url }); setLinkUrl(''); setLinkInput(false); setPopover(false);
  };

  const send = () => {
    if (!msg.trim() && !attachment) return;
    const displayName = myName || 'you';
    const m = { id:Date.now(), user:displayName, text:msg.trim(), time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), attachment: attachment||null };
    const updated = [...messages, m];
    setMessages(updated);
    try { localStorage.setItem('tr_chat_'+group.id+'_'+activeRoom, JSON.stringify(updated)); } catch {}
    setMsg(''); setAttachment(null);
  };

  const deleteMsg = (id) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    try { localStorage.setItem('tr_chat_'+group.id+'_'+activeRoom, JSON.stringify(updated)); } catch {}
    setHoveredMsg(null);
  };

  const popItems = [
    { label:'Image', icon:'📷', action:() => { fileRef.current.accept='image/*'; fileRef.current.click(); } },
    { label:'File', icon:'📎', action:() => { fileRef.current.accept='.pdf,.doc,.docx,.txt,.csv,.xlsx'; fileRef.current.click(); } },
    { label:'Link', icon:'🔗', action:() => { setLinkInput(true); setPopover(false); } },
  ];

  const myDisplayName = myName || 'you';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minWidth:0, overflow:'hidden' }}>

      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages in #{activeRoom} yet. Say hello!</div>}
        {messages.map(m => {
          const isOwn = m.user === myDisplayName;
          const isHovered = hoveredMsg === m.id;
          return (
            <div key={m.id} onMouseEnter={() => setHoveredMsg(m.id)} onMouseLeave={() => setHoveredMsg(null)}
              style={{ display:'flex', gap:10, alignItems:'flex-start', position:'relative', padding:'2px 4px', borderRadius:8, background: isHovered ? 'var(--surface2)' : 'transparent' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background: isOwn && myAvatar ? 'transparent' : getColor(m.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                {isOwn && myAvatar ? <img src={myAvatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (m.user||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.time}</span>
                </div>
                {m.text && <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{m.text}</div>}
                {m.attachment?.type==="image" && <div style={{ marginTop:6, borderRadius:10, overflow:'hidden', maxWidth:280 }}><img src={m.attachment.url} alt="" style={{ width:'100%', display:'block', borderRadius:10 }} /></div>}
                {m.attachment?.type==="file" && <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', maxWidth:280 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div><div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.attachment.name}</div>{m.attachment.size&&<div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{m.attachment.size}</div>}</div></div>}
                {m.attachment?.type==="link" && <a href={m.attachment.url} target="_blank" rel="noreferrer" style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', maxWidth:280, textDecoration:'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.attachment.url}</span></a>}
              </div>
              {/* Delete button — shows on hover for any message */}
              {isHovered && (
                <button onClick={() => deleteMsg(m.id)} title="Delete message"
                  style={{ position:'absolute', top:2, right:4, width:26, height:26, borderRadius:6, background:'rgba(220,38,38,0.1)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626', fontSize:12 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(220,38,38,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(220,38,38,0.1)'}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        {attachment && (
          <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)' }}>
            {attachment.type==='image' && <img src={attachment.url} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'cover' }} />}
            <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachment.name}</span>
            <button onClick={() => setAttachment(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, lineHeight:1 }}>×</button>
          </div>
        )}
        {linkInput && (
          <div style={{ marginBottom:8, display:'flex', gap:6 }}>
            <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attachLink()} placeholder="Paste a URL..." autoFocus style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
            <button onClick={attachLink} style={{ padding:'7px 14px', borderRadius:8, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Attach</button>
            <button onClick={() => { setLinkInput(false); setLinkUrl(''); }} style={{ padding:'7px 10px', borderRadius:8, background:'var(--surface2)', color:'var(--text-muted)', border:'1px solid var(--border)', cursor:'pointer' }}>×</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" style={{ display:'none' }} onChange={handleFile} />
        {/* Message bar */}
        <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'2px solid #534AB7', borderRadius:14, padding:'10px 14px', boxShadow:'0 2px 12px rgba(83,74,183,0.18)' }}>
          <div ref={popRef} style={{ position:'relative', flexShrink:0 }}>
            <button onClick={() => setPopover(p => !p)} style={{ width:28, height:28, borderRadius:'50%', background:popover?PURPLE:'rgba(83,74,183,0.2)', border:'1px solid '+(popover?PURPLE:'#534AB7'), display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#AFA9EC', fontSize:20, lineHeight:1, fontWeight:300, outline:'none' }}>+</button>
            {popover && (
              <div style={{ position:'fixed', bottom:60, left:16, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:160, zIndex:99999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
                {popItems.map(item => (
                  <button key={item.label} onClick={item.action} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:8, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer', textAlign:'left' }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <span style={{ fontSize:16 }}>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }}
            placeholder={'Message #'+activeRoom}
            style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', caretColor:'#534AB7' }} />
          <button onClick={send} disabled={!msg.trim()&&!attachment} style={{ width:30, height:30, borderRadius:8, background:(msg.trim()||attachment)?PURPLE:'rgba(83,74,183,0.3)', color:'#fff', border:'none', cursor:(msg.trim()||attachment)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupSettings({ group, onClose, onUpdate }) {
  const [name, setName] = useState(group.name || '');
  const [desc, setDesc] = useState(group.desc || '');
  const [country, setCountry] = useState(group.country || '');
  const [visibility, setVisibility] = useState(group.visibility || 'open');
  const [price, setPrice] = useState(group.price || '');
  const [profileImg, setProfileImg] = useState(group.profileImg || null);
  const [grad, setGrad] = useState(group.grad || 'linear-gradient(135deg,#4f46e5,#7c3aed)');
  const [saved, setSaved] = useState(false);
  const imgRef = useRef(null);
  const GRADS = ['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#0891b2,#0e7490)','linear-gradient(135deg,#16a34a,#15803d)','linear-gradient(135deg,#d97706,#b45309)','linear-gradient(135deg,#dc2626,#b91c1c)'];
  const VIS = [{key:'open',label:'Open',icon:'🌐',desc:'Anyone can join instantly'},{key:'invite',label:'Invite Only',icon:'✉️',desc:'Members must be approved'},{key:'closed',label:'Closed',icon:'🔒',desc:'Hidden, invite link only'}];
  const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Egypt','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Malaysia','Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam'];
  const inp = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' };
  const save = () => {
    const updated = { name, desc, country, visibility, price:parseFloat(price)||0, profileImg, grad };
    const all = loadGroups();
    const idx = all.findIndex(g => String(g.id) === String(group.id));
    if (idx !== -1) { all[idx] = { ...all[idx], ...updated }; }
    else { all.push({ ...group, ...updated }); } // persist DB group overrides locally
    try { localStorage.setItem('tr_groups', JSON.stringify(all)); } catch(e) {}
    if (onUpdate) onUpdate(updated);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font)', fontSize:16, fontWeight:700, color:'var(--text)' }}>Group Settings</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:20, lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px', overflowY:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18, padding:'14px', borderRadius:12, background:'var(--surface2)', border:'1px solid var(--border)' }}>
            <div onClick={() => imgRef.current && imgRef.current.click()} style={{ width:56, height:56, borderRadius:12, background:grad, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', border:'2px solid var(--border)', flexShrink:0 }}>
              {profileImg ? <img src={profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>{name?name[0].toUpperCase():'?'}</span>}
            </div>
            <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={async e => { const f=e.target.files[0]; if(!f) return; const compressed = await compressImage(f); setProfileImg(compressed); }} />
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Group Photo</div>
              <div style={{ display:'flex', gap:5, marginBottom:6 }}>{GRADS.map(g => <div key={g} onClick={() => { setGrad(g); setProfileImg(null); }} style={{ width:20, height:20, borderRadius:5, background:g, cursor:'pointer', border:grad===g&&!profileImg?'2px solid var(--text)':'2px solid transparent' }} />)}</div>
              <button onClick={() => imgRef.current && imgRef.current.click()} style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Upload image</button>
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Group Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} style={inp} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Bio / Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} style={{...inp, resize:'none'}} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Visibility</label>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {VIS.map(v => (
                <div key={v.key} onClick={()=>setVisibility(v.key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid '+(visibility===v.key?'var(--accent)':'var(--border)'), background:visibility===v.key?'var(--accent-bg)':'var(--surface2)', cursor:'pointer' }}>
                  <span style={{ fontSize:15 }}>{v.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:visibility===v.key?'var(--accent)':'var(--text)' }}>{v.label}</div>
                    <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{v.desc}</div>
                  </div>
                  <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid '+(visibility===v.key?'var(--accent)':'var(--border)'), background:visibility===v.key?'var(--accent)':'transparent', flexShrink:0 }} />
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Country</label>
            <select value={country} onChange={e=>setCountry(e.target.value)} style={{...inp, cursor:'pointer'}}>
              <option value="">Select a country...</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Monthly Price ($)</label>
            <input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" placeholder="0 for free" style={inp} />
          </div>
          <button onClick={save} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer', marginBottom:10 }}>
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
          <button onClick={async () => {
            if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return;
            if (group.fromDB) {
              await fetch(`/api/groups?id=${group.id}`, { method: 'DELETE' }).catch(() => {});
            }
            try {
              const local = loadGroups().filter(g => String(g.id) !== String(group.id));
              localStorage.setItem('tr_groups', JSON.stringify(local));
              localStorage.removeItem('tr_rooms_'+group.id);
            } catch {}
            if (onUpdate) onUpdate({ _deleted: true });
            onClose();
          }} style={{ width:'100%', padding:'11px', borderRadius:10, border:'1px solid rgba(239,68,68,0.3)', background:'transparent', color:'#ef4444', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Delete group
          </button>
        </div>
      </div>
    </div>
  );
}

function GroupsView({ currentUserId }) {
  const [groups, setGroups] = useState([]);
  const [openGroup, setOpenGroup] = useState(null);
  const [activeRoom, setActiveRoom] = useState('general');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top:0, left:0 });
  const [showSettings, setShowSettings] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [groupMenuPos, setGroupMenuPos] = useState(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showManageRooms, setShowManageRooms] = useState(false);
  const [customRooms, setCustomRooms] = useState(['general']);
  const [newRoomName, setNewRoomName] = useState('');
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('club');
  const [createVis, setCreateVis] = useState('open');
  const [createDesc, setCreateDesc] = useState('');
  const [createCountry, setCreateCountry] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createImg, setCreateImg] = useState(null);
  const [createGrad, setCreateGrad] = useState('linear-gradient(135deg,#4f46e5,#7c3aed)');
  const [myName, setMyName] = useState('');

  // Load current user's display name
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => {
      if (s?.user) setMyName(s.user.username || s.user.name || '');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/groups?mine=true')
      .then(r => r.json())
      .then(d => {
        if (!d.groups) return;
        const localAll = loadGroups();
        const localById = {};
        localAll.forEach(g => { localById[String(g.id)] = g; });
        const dbGroups = d.groups.map(g => ({
          id: g.id,
          name: g.name,
          desc: g.description || '',
          type: localById[String(g.id)]?.type || 'club',
          visibility: g.isPublic ? 'open' : 'invite',
          members: g._count?.members || g.memberCount || 1,
          joined: true,
          creator: g.ownerId === currentUserId ? 'me' : (g.owner?.name || g.owner?.username || ''),
          grad: localById[String(g.id)]?.grad || 'linear-gradient(135deg,#4f46e5,#7c3aed)',
          profileImg: localById[String(g.id)]?.profileImg || null,
          fromDB: true,
        }));
        const localGroups = localAll.filter(lg => !dbGroups.find(dg => String(dg.id) === String(lg.id)));
        const all = [...dbGroups, ...localGroups];
        setGroups(all);
        const lastId = localStorage.getItem('tr_last_group');
        const def = all.find(g => String(g.id) === lastId) || all[0] || null;
        if (def) {
          setOpenGroup(def);
          try {
            const stored = localStorage.getItem('tr_rooms_'+def.id);
            setCustomRooms(stored ? JSON.parse(stored) : ['general']);
          } catch { setCustomRooms(['general']); }
        }
      })
      .catch(() => {
        const loaded = loadGroups();
        setGroups(loaded);
        const lastId = localStorage.getItem('tr_last_group');
        const def = loaded.find(g => g.id === lastId) || loaded[0] || null;
        if (def) {
          setOpenGroup(def);
          try {
            const stored = localStorage.getItem('tr_rooms_'+def.id);
            setCustomRooms(stored ? JSON.parse(stored) : ['general']);
          } catch { setCustomRooms(['general']); }
        }
      });
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => setDropdownOpen(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  const handleIconClick = (e, g) => {
    e.stopPropagation();
    switchGroup(g);
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    setDropdownOpen(true);
  };

  const switchGroup = (g) => {
    setOpenGroup(g);
    setActiveRoom('general');
    setDropdownOpen(false);
    try {
      localStorage.setItem('tr_last_group', g.id);
      const stored = localStorage.getItem('tr_rooms_'+g.id);
      setCustomRooms(stored ? JSON.parse(stored) : ['general']);
    } catch {}
  };
  const displayMe = myName || 'You';
  const [members, setMembers] = React.useState([]);
  const roleColor = (r) => r==='owner'?'#16a34a':r==='co-leader'?'#d97706':'var(--text-muted)';
  const roleLabel = (r) => r==='owner'?'Founder':r==='co-leader'?'Co-leader':'Member';

  React.useEffect(() => {
    if (!openGroup?.id) { setMembers([]); return; }
    fetch(`/api/groups/members?groupId=${openGroup.id}`)
      .then(r => r.json())
      .then(d => setMembers(d.members || []))
      .catch(() => setMembers([]));
  }, [openGroup?.id]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Fixed dropdown rendered at body level via fixed positioning */}
      {dropdownOpen && openGroup && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()} style={{ position:'fixed', top:dropdownPos.top, left:dropdownPos.left, width:230, zIndex:99999, transform:'translateZ(0)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius: openGroup.type === 'club' ? '50%' : 10, background:openGroup.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
              {openGroup.profileImg ? <img src={openGroup.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (openGroup.name||'G')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{openGroup.name}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{openGroup.type==='club'?openGroup.members+'/'+(openGroup.max||50)+' members':(openGroup.members||1)+' members'} · {openGroup.visibility||'open'}</div>
            </div>
          </div>
          <div style={{ padding:'8px 8px 4px' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase', display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%' }}>Rooms<button title="Manage rooms" onClick={()=>setShowManageRooms(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px', borderRadius:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }} onMouseEnter={e=>e.currentTarget.style.color='#4B44C8'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}><i className="ti ti-settings" style={{fontSize:14}} aria-hidden="true"/></button></div>
            {customRooms.map(ch => (
              <button key={ch} onClick={() => { setActiveRoom(ch); setDropdownOpen(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background:activeRoom===ch?'#EEEDFE':'transparent', color:activeRoom===ch?'#3C3489':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:activeRoom===ch?600:400, cursor:'pointer', textAlign:'left' }}
                onMouseEnter={e => { if(activeRoom!==ch) e.currentTarget.style.background='var(--surface2)'; }}
                onMouseLeave={e => { if(activeRoom!==ch) e.currentTarget.style.background='transparent'; }}>
                <span style={{ fontSize:14 }}>#</span> {ch}
              </button>
            ))}
          </div>
          <div style={{ padding:'4px 8px 4px', borderTop:'1px solid var(--border)', maxHeight:180, overflowY:'auto' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Members {members.length > 0 ? `(${members.length})` : ''}
            </div>
            {members.length === 0
              ? <div style={{ padding:'6px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>Loading…</div>
              : members.map(m => (
                <div key={m.id} onClick={() => goToProfile(m.profileSlug || m.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background: m.image ? 'transparent' : getColor(m.name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                    {m.image ? <img src={m.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (m.name||'?')[0].toUpperCase()}
                  </div>
                  <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', flex:1 }}>{m.name}</span>
                  <span style={{ fontFamily:'var(--font)', fontSize:10, color:roleColor(m.role) }}>{roleLabel(m.role)}</span>
                </div>
              ))
            }
          </div>
          <div style={{ padding:'4px 8px 8px', borderTop:'1px solid var(--border)' }}>
            <button style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, cursor:'pointer', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'} onClick={() => { setShowSettings(true); setDropdownOpen(false); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Group settings
            </button>
          </div>
        </div>
      , document.body)}

      {showSettings && openGroup && <GroupSettings group={openGroup} onClose={() => setShowSettings(false)} onUpdate={(u) => {
        if (u._deleted) {
          const remaining = groups.filter(g => String(g.id) !== String(openGroup.id));
          setGroups(remaining);
          setOpenGroup(remaining[0] || null);
          if (remaining[0]) {
            try { const s = localStorage.getItem('tr_rooms_'+remaining[0].id); setCustomRooms(s ? JSON.parse(s) : ['general']); } catch { setCustomRooms(['general']); }
          }
          setShowSettings(false);
        } else {
          setOpenGroup(g => ({...g, ...u}));
          setGroups(prev => prev.map(g => g.id===openGroup.id ? {...g,...u} : g));
        }
      }} />}
      {/* Icon rail */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, overflowX:'auto' }}>
        {groups.length === 0
          ? <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>No groups yet</span>
          : groups.map(g => {
            const active = openGroup && openGroup.id === g.id;
            return (
              <button key={g.id} onClick={e => handleIconClick(e, g)} title={g.name}
                style={{ width:40, height:40, borderRadius: g.type === 'club' ? '50%' : 10, background:g.grad||PURPLE, border:active?'2px solid '+PURPLE:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0, overflow:'hidden', transition:'all 0.2s', outline:'none', padding:0 }}>
                {g.profileImg ? <img src={g.profileImg} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
              </button>
            );
          })
        }
        {groups.length > 0 && <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0, margin:'0 2px' }} />}
        <div style={{ position:'relative', flexShrink:0 }}>
          <button onClick={(e) => { const r=e.currentTarget.getBoundingClientRect(); setGroupMenuPos({top:r.bottom+6,left:r.left}); setShowGroupMenu(m=>!m); }} title="Add group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>
          {showGroupMenu && (
            <div style={{ position:'fixed', top:groupMenuPos?.top||100, left:groupMenuPos?.left||100, background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'6px', minWidth:180, zIndex:99999, boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
              <button onClick={() => { setShowCreate(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <i className="ti ti-plus" style={{fontSize:15,color:'#4B44C8'}} aria-hidden="true"/> Create group
              </button>
              <button onClick={() => { setShowBrowse(true); setShowGroupMenu(false); }} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:7, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--surface2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <i className="ti ti-search" style={{fontSize:15,color:'#059669'}} aria-hidden="true"/> Browse groups
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {openGroup
          ? <GroupChatRoom group={openGroup} activeRoom={activeRoom} myName={displayMe} />
          : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)' }}>No groups yet</div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Click + to create your first group.</div>
            </div>
        }
      </div>

      {/* Create group modal */}
      {showBrowse && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:10001, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowBrowse(false)}>
          <div style={{ background:'var(--surface)', borderRadius:16, padding:'20px 24px', width:680, maxWidth:'95vw', maxHeight:'85vh', overflowY:'auto', boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:500, color:'var(--text)' }}>Browse groups</div>
              <button onClick={()=>setShowBrowse(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--text-muted)' }}>×</button>
            </div>
            <BrowseGroupsPanel onJoin={(g) => {
              const ng = { id: g.id, name: g.name, desc: g.description||'', visibility: g.isPublic?'open':'invite', members: (g._count?.members||g.memberCount||1)+1, joined: true, creator: g.owner?.name||'', grad:'linear-gradient(135deg,#4f46e5,#7c3aed)', fromDB: true };
              if (!groups.find(x => x.id === g.id)) {
                const all = [...groups, ng];
                setGroups(all);
                setOpenGroup(ng);
                setActiveRoom('general');
                try { localStorage.setItem('tr_rooms_'+ng.id, JSON.stringify(['general'])); } catch {}
              }
              setShowBrowse(false);
            }} />
          </div>
        </div>
      )}
      {showManageRooms && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowManageRooms(false)}>
          <div style={{ background:'var(--surface)', borderRadius:14, padding:'20px 24px', minWidth:340, maxWidth:400, boxShadow:'0 8px 32px rgba(0,0,0,0.2)' }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:500, color:'var(--text)' }}>Manage rooms</div>
              <button onClick={()=>setShowManageRooms(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'var(--text-muted)' }}>×</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
              {customRooms.map((room, i) => (
                <div key={room} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:'var(--surface2)', borderRadius:7 }}>
                  <span style={{ fontSize:14, color:'var(--text-muted)' }}>#</span>
                  <span style={{ flex:1, fontSize:13, color:'var(--text)' }}>{room}</span>
                  {room !== 'general' && (
                    <button onClick={() => {
                      const updated = customRooms.filter((_,idx)=>idx!==i);
                      setCustomRooms(updated);
                      if (openGroup) { try { localStorage.setItem('tr_rooms_'+openGroup.id, JSON.stringify(updated)); } catch {} }
                      if (activeRoom === room) setActiveRoom('general');
                    }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'0 2px' }}
                      onMouseEnter={e=>e.currentTarget.style.color='#dc2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={newRoomName} onChange={e=>setNewRoomName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                placeholder="new-room-name" onKeyDown={e=>{if(e.key==='Enter'&&newRoomName.trim()){const u=[...customRooms,newRoomName.trim()];setCustomRooms(u);if(openGroup){try{localStorage.setItem('tr_rooms_'+openGroup.id,JSON.stringify(u));}catch{}}setNewRoomName('');}}}
                style={{ flex:1, padding:'7px 10px', border:'0.5px solid var(--border2)', borderRadius:6, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }} />
              <button onClick={()=>{if(newRoomName.trim()){const u=[...customRooms,newRoomName.trim()];setCustomRooms(u);if(openGroup){try{localStorage.setItem('tr_rooms_'+openGroup.id,JSON.stringify(u));}catch{}}setNewRoomName('');}}}
                style={{ padding:'7px 14px', background:'#4B44C8', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
            </div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>Type a name and press Enter or Add. "general" cannot be removed.</div>
          </div>
        </div>
      )}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={e => { if(e.target===e.currentTarget) setShowCreate(false); }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:460, maxWidth:'95vw', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Create a Group</div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
              <div onClick={() => document.getElementById('grp-img-up').click()} style={{ width:64, height:64, borderRadius:14, background:createGrad, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', border:'2px solid var(--border)', flexShrink:0 }}>
                {createImg ? <img src={createImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ fontSize:22, fontWeight:700, color:'#fff' }}>{createName ? createName[0].toUpperCase() : '?'}</span>}
              </div>
              <input id="grp-img-up" type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setCreateImg(ev.target.result); r.readAsDataURL(f); }} />
              <div>
                <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 }}>Group Photo</div>
                <div style={{ display:'flex', gap:5, marginBottom:6 }}>
                  {['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#0891b2,#0e7490)','linear-gradient(135deg,#16a34a,#15803d)','linear-gradient(135deg,#d97706,#b45309)','linear-gradient(135deg,#dc2626,#b91c1c)'].map(g => (
                    <div key={g} onClick={() => { setCreateGrad(g); setCreateImg(null); }} style={{ width:22, height:22, borderRadius:6, background:g, cursor:'pointer', border:createGrad===g&&!createImg?'2px solid var(--text)':'2px solid transparent' }} />
                  ))}
                </div>
                <button onClick={() => document.getElementById('grp-img-up').click()} style={{ padding:'3px 10px', borderRadius:6, border:'1px solid var(--border)', background:'transparent', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:11, cursor:'pointer' }}>Upload image</button>
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Group Name</label>
              <input value={createName} onChange={e=>setCreateName(e.target.value)} placeholder="e.g. COT Swing Traders" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Type</label>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                {[{key:'club',label:'Club',emoji:'👥'},{key:'channel',label:'Channel',emoji:'📢'}].map(({key:t,label,emoji}) => (
                  <button key={t} onClick={()=>setCreateType(t)} style={{ flex:1, padding:'9px', borderRadius:8, border:'1px solid '+(createType===t?PURPLE:'var(--border)'), background:createType===t?'var(--accent-bg)':'var(--surface2)', color:createType===t?PURPLE:'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>{emoji} {label}</button>
                ))}
              </div>
              <div style={{ padding:'8px 12px', borderRadius:8, background:createType==='club'?'var(--accent-bg)':'var(--surface2)', border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:12, color:createType==='club'?PURPLE:'var(--text-muted)', lineHeight:1.5 }}>
                {createType==='club' ? 'A curated group of up to 50 members. Your inner circle — real relationships, more conversation.' : 'An open community with unlimited members. Built for broad reach — share ideas and grow your audience.'}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Visibility</label>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[{key:'open',icon:'🌐',label:'Open',desc:'Anyone can join instantly'},{key:'invite',icon:'✉️',label:'Invite Only',desc:'Members must be approved'},{key:'closed',icon:'🔒',label:'Closed',desc:'Hidden, invite link only'}].map(v => (
                  <div key={v.key} onClick={()=>setCreateVis(v.key)} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid '+(createVis===v.key?PURPLE:'var(--border)'), background:createVis===v.key?'var(--accent-bg)':'var(--surface2)', cursor:'pointer' }}>
                    <span style={{ fontSize:16 }}>{v.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:createVis===v.key?PURPLE:'var(--text)' }}>{v.label}</div>
                      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{v.desc}</div>
                    </div>
                    <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid '+(createVis===v.key?PURPLE:'var(--border)'), background:createVis===v.key?PURPLE:'transparent', flexShrink:0 }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Country (optional)</label>
              <select value={createCountry} onChange={e=>setCreateCountry(e.target.value)} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', cursor:'pointer', boxSizing:'border-box' }}>
                <option value="">Select a country...</option>
                {['Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Egypt','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Malaysia','Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Monthly Price ($)</label>
              <input value={createPrice} onChange={e=>setCreatePrice(e.target.value)} placeholder="Leave blank for free" type="number" min="0" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:6 }}>Bio / Description</label>
              <textarea value={createDesc} onChange={e=>setCreateDesc(e.target.value)} placeholder="Tell people what your group is about..." rows={3} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setShowCreate(false)} style={{ flex:1, padding:'11px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (!createName.trim()) return;
                try {
                  const res = await fetch('/api/groups', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: createName, description: createDesc, price: parseFloat(createPrice)||0, isPublic: createVis === 'open' }),
                  });
                  const data = await res.json();
                  if (!res.ok || !data.group) throw new Error(data.error || 'Failed');
                  const ng = { id: data.group.id, name: createName, type: createType, visibility: createVis, desc: createDesc, country: createCountry, price: parseFloat(createPrice)||0, profileImg: createImg, grad: createGrad, members: 1, joined: true, creator: 'me', fromDB: true };
                  const all = [...groups, ng];
                  setGroups(all);
                  try { localStorage.setItem('tr_rooms_'+ng.id, JSON.stringify(['general'])); } catch {}
                  setCustomRooms(['general']);
                  setActiveRoom('general');
                  setOpenGroup(ng);
                } catch (e) {
                  // Fallback to localStorage-only group
                  const ng = { id: Date.now(), name: createName, type: createType, visibility: createVis, desc: createDesc, country: createCountry, price: parseFloat(createPrice)||0, profileImg: createImg, grad: createGrad, members: 1, joined: true, creator: 'me' };
                  const all = [...groups, ng];
                  setGroups(all);
                  try { localStorage.setItem('tr_groups', JSON.stringify(all)); localStorage.setItem('tr_rooms_'+ng.id, JSON.stringify(['general'])); } catch {}
                  setCustomRooms(['general']);
                  setActiveRoom('general');
                  setOpenGroup(ng);
                }
                setShowCreate(false); setCreateName(''); setCreateDesc(''); setCreateCountry(''); setCreatePrice(''); setCreateImg(null); setCreateGrad('linear-gradient(135deg,#4f46e5,#7c3aed)');
              }} disabled={!createName.trim()} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:createName.trim()?PURPLE:'var(--surface3)', color:createName.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:createName.trim()?'pointer':'default' }}>Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function CommSidebar({ tab, setTab }) {
  const TABS = [
    { key:'feed',   label:'Feed',     icon:'ti-home' },
    { key:'groups', label:'Groups',   icon:'ti-users' },
    { key:'dms',    label:'Messages', icon:'ti-message' },
    { key:'local',  label:'Map',      icon:'ti-map-pin' },
  ]
  return (
    <div style={{ width:56, display:'flex', flexDirection:'column', alignItems:'center', padding:'12px 0', gap:4, borderRight:'0.5px solid var(--border)', background:'var(--surface)', flexShrink:0, alignSelf:'stretch' }}>
      {TABS.map(t => {
        const isActive = tab === t.key
        return (
          <div key={t.key} title={t.label} onClick={() => setTab(t.key)}
            style={{ width:38, height:38, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:isActive?'#EEEDFE':'transparent', color:isActive?'#534AB7':'var(--text-muted)', fontSize:19, transition:'all .15s', flexShrink:0 }}
            onMouseEnter={e => { if(!isActive){ e.currentTarget.style.background='#EEEDFE'; e.currentTarget.style.color='#534AB7'; } }}
            onMouseLeave={e => { if(!isActive){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; } }}
          >
            <i className={`ti ${t.icon}`} aria-hidden="true" />
          </div>
        )
      })}
    </div>
  )
}

function BrowseGroupsPanel({ onJoin }) {
  const [search, setSearch] = React.useState('')
  const [country, setCountry] = React.useState('')
  const [groups, setGroups] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [joining, setJoining] = React.useState(null)
  const [joined, setJoined] = React.useState({})

  const PURPLE = '#4B44C8'
  const COUNTRIES = ['Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Belgium','Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark','Egypt','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Malaysia','Mexico','Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Saudi Arabia','Serbia','Singapore','South Africa','South Korea','Spain','Sweden','Switzerland','Taiwan','Thailand','Turkey','UAE','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam']

  React.useEffect(() => {
    fetch('/api/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); setLoading(false); })
      .catch(() => setLoading(false))
  }, [])

  const filtered = groups.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = !q || g.name.toLowerCase().includes(q) || (g.description||'').toLowerCase().includes(q)
    const matchCountry = !country || (g.country||'') === country
    return matchSearch && matchCountry
  })

  const handleJoin = async (g) => {
    setJoining(g.id)
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: g.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setJoined(prev => ({ ...prev, [g.id]: true }))
        onJoin(g)
      }
    } catch {}
    setJoining(null)
  }

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or description..."
          style={{ flex:1, padding:'8px 12px', border:'0.5px solid var(--border)', borderRadius:8, background:'var(--surface2)', fontSize:13, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }} />
        <select value={country} onChange={e=>setCountry(e.target.value)}
          style={{ padding:'8px 10px', border:'0.5px solid var(--border)', borderRadius:8, background:'var(--surface2)', fontSize:13, color:'var(--text)', fontFamily:'var(--font)', outline:'none', maxWidth:160 }}>
          <option value="">All countries</option>
          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'32px', fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font)' }}>Loading groups…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'32px', fontSize:13, color:'var(--text-muted)', fontFamily:'var(--font)' }}>
          {groups.length === 0 ? 'No public groups yet. Be the first to create one!' : 'No groups match your search.'}
        </div>
      ) : (
        filtered.map(g => {
          const isJoined = joined[g.id]
          const isJoining = joining === g.id
          const memberCount = g._count?.members ?? g.memberCount ?? 1
          const color = getColor(g.name)
          return (
            <div key={g.id} style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:10, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:700, color:'#fff', flexShrink:0 }}>
                {(g.name||'G')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text)', fontFamily:'var(--font)' }}>{g.name}</span>
                  <span style={{ fontSize:10, padding:'2px 6px', borderRadius:8, background:'rgba(5,150,105,0.1)', color:'#059669', fontWeight:500 }}>
                    {g.isPublic ? 'Open' : 'Invite'}
                  </span>
                </div>
                {g.description && <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font)', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.description}</div>}
                <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font)' }}>
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                  {g.country ? ` · ${g.country}` : ''}
                  {g.owner ? ` · by ${g.owner.displayName || g.owner.name || g.owner.username}` : ''}
                </div>
              </div>
              <button onClick={() => !isJoined && handleJoin(g)} disabled={isJoined || isJoining}
                style={{ padding:'6px 16px', background:isJoined?'#059669':PURPLE, color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:600, cursor:isJoined?'default':'pointer', fontFamily:'var(--font)', flexShrink:0, opacity:isJoining?0.7:1 }}>
                {isJoined ? '✓ Joined' : isJoining ? '…' : 'Join'}
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}


function ThreadPoll({ postId, initialPoll, initialVoted }) {
  const [poll, setPoll] = React.useState(initialPoll);
  const [voted, setVoted] = React.useState(initialVoted >= 0 ? initialVoted : null);
  const total = poll.reduce((s, o) => s + (o.votes || 0), 0);
  const handleVote = async (i) => {
    if (voted !== null) return;
    const updated = poll.map((o, idx) => idx === i ? { ...o, votes: (o.votes || 0) + 1 } : o);
    setPoll(updated); setVoted(i);
    try {
      const res = await fetch('/api/social/posts/vote', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ postId, optionIndex: i }) });
      const data = await res.json();
      if (res.ok && data.poll) setPoll(data.poll);
      if (data.alreadyVoted) setVoted(data.votedIndex);
    } catch {}
  };
  return (
    <div style={{ marginBottom:10 }}>
      {poll.map((opt, i) => {
        const pct = total > 0 ? Math.round(((opt.votes || 0) / total) * 100) : 0;
        const isChosen = voted === i;
        return (
          <div key={i} onClick={() => handleVote(i)}
            style={{ position:'relative', marginBottom:7, borderRadius:8, border:`1px solid ${isChosen ? PURPLE : 'var(--border)'}`, overflow:'hidden', cursor:voted===null?'pointer':'default', background:'var(--surface2)' }}>
            {voted !== null && <div style={{ position:'absolute', inset:0, width:pct+'%', background:isChosen?PURPLE+'22':'var(--surface3)', transition:'width 0.4s' }} />}
            <div style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px' }}>
              <span style={{ fontFamily:'var(--font)', fontSize:13, color:isChosen?PURPLE:'var(--text)', fontWeight:isChosen?600:400 }}>{opt.label}</span>
              {voted !== null && <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>{pct}%</span>}
            </div>
          </div>
        );
      })}
      <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{total} vote{total !== 1 ? 's' : ''}</div>
    </div>
  );
}

function ThreadCard({ thread: t, myUserId, onDelete, onVote }) {
  const myAvatar = useContext(UserAvatarContext);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  const [commentCount, setCommentCount] = React.useState(t.commentsCount || 0);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/social/posts/comment?postId=${t.id}`);
      const data = await res.json();
      if (data.comments) {
        setComments(data.comments.map(c => ({ id: c.id, text: c.content, user: c.authorName || 'Trader' })));
        setCommentCount(data.comments.length);
      }
    } catch(e) {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(v => !v);
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText;
    setComments(prev => [...prev, { id: Date.now(), text, user: 'You' }]);
    setCommentCount(c => c + 1);
    setCommentText('');
    try {
      await fetch('/api/social/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: t.id, content: text }),
      });
    } catch(e) {}
  };

  return (
    <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:12, padding:14, marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
        {(() => {
          const avatarUrl = t.userId === myUserId ? (myAvatar || t.authorImage) : t.authorImage;
          return (
            <div onClick={() => goToProfile(t.authorSlug || t.userId)} style={{ width:28, height:28, borderRadius:'50%', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#534AB7,#7F77DD)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden', cursor:'pointer' }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (t.user||'T')[0].toUpperCase()}
            </div>
          );
        })()}
        <span onClick={() => goToProfile(t.authorSlug || t.userId)} style={{ fontSize:13, fontWeight:600, color:'var(--text)', fontFamily:'var(--font)', cursor:'pointer' }}>{t.user}</span>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font)' }}>{new Date(t.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
        {t.asset && <span style={{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:12, background:'#EEEDFE', color:'#3C3489', fontFamily:'var(--font)' }}>{t.asset}</span>}
        {t.userId === myUserId && (
          <button onClick={() => onDelete(t.id)} style={{ all:'unset', cursor:'pointer', marginLeft:'auto', fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font)', padding:'2px 8px', borderRadius:6 }}
            onMouseEnter={e=>{e.currentTarget.style.color='#dc2626';e.currentTarget.style.background='rgba(220,38,38,0.08)';}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.background='transparent';}}
          >Delete</button>
        )}
      </div>
      {t.body && <div style={{ fontSize:14, color:'var(--text)', marginBottom:10, lineHeight:1.5, fontFamily:'var(--font)' }}>{t.body}</div>}
      {t.poll && Array.isArray(t.poll) && t.poll.length >= 2 && (
        <ThreadPoll postId={t.id} initialPoll={t.poll} initialVoted={t.myVote ?? -1} />
      )}
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <button onClick={() => onVote(t.id)}
          style={{ all:'unset', cursor:'pointer', fontSize:12, color:t.liked?'#e11d48':'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font)' }}
          onMouseEnter={e=>e.currentTarget.style.color='#e11d48'}
          onMouseLeave={e=>e.currentTarget.style.color=t.liked?'#e11d48':'var(--text-muted)'}
        >
          <i className="ti ti-heart" style={{ fontSize:14 }} aria-hidden="true" />{t.likes||0}
        </button>
        <button onClick={toggleComments}
          style={{ all:'unset', cursor:'pointer', fontSize:12, color:showComments?'#534AB7':'var(--text-muted)', display:'flex', alignItems:'center', gap:4, fontFamily:'var(--font)' }}
          onMouseEnter={e=>e.currentTarget.style.color='#534AB7'}
          onMouseLeave={e=>e.currentTarget.style.color=showComments?'#534AB7':'var(--text-muted)'}
        >
          <i className="ti ti-message" style={{ fontSize:14 }} aria-hidden="true" />{commentCount}
        </button>
      </div>
      {showComments && (
        <div style={{ marginTop:10, paddingTop:10, borderTop:'0.5px solid var(--border)' }}>
          {loadingComments ? (
            <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font)', marginBottom:8 }}>Loading…</div>
          ) : comments.length === 0 ? (
            <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font)', marginBottom:8 }}>No replies yet.</div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ display:'flex', gap:8, marginBottom:8 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,#534AB7,#7F77DD)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, color:'#fff', flexShrink:0 }}>{(c.user||'T')[0].toUpperCase()}</div>
                <div style={{ flex:1, background:'var(--surface2)', borderRadius:8, padding:'5px 10px', fontFamily:'var(--font)', fontSize:12, color:'var(--text)' }}>
                  <span style={{ fontWeight:700, marginRight:6 }}>{c.user}</span>{c.text}
                </div>
              </div>
            ))
          )}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key==='Enter' && addComment()} placeholder="Reply…"
              style={{ flex:1, padding:'6px 12px', borderRadius:20, border:'0.5px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
            <button onClick={addComment} disabled={!commentText.trim()}
              style={{ all:'unset', cursor:commentText.trim()?'pointer':'default', padding:'6px 14px', borderRadius:20, background:commentText.trim()?'#534AB7':'var(--surface2)', color:commentText.trim()?'#fff':'var(--text-muted)', fontSize:12, fontWeight:600, fontFamily:'var(--font)' }}>
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ThreadsFeed({ onNewPost, currentUserId }) {
  const [threads, setThreads] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchThreads = React.useCallback(async () => {
    try {
      const res = await fetch('/api/social/posts?tab=threads');
      const data = await res.json();
      if (data.posts) {
        setThreads(data.posts.map(p => ({
          id: p.id,
          userId: p.userId,
          authorSlug: p.authorSlug || p.userId || null,
          user: p.authorName || 'Trader',
          authorImage: p.authorImage || null,
          body: p.content,
          asset: p.assetTag,
          time: p.createdAt,
          likes: p.likes || 0,
          liked: p.liked || false,
          commentsCount: p.commentsCount || 0,
          poll: p.poll || null,
          myVote: p.myVote ?? -1,
        })));
      }
    } catch(e) {}
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 20000);
    const handler = () => fetchThreads();
    window.addEventListener('post-created', handler);
    return () => { clearInterval(interval); window.removeEventListener('post-created', handler); };
  }, [fetchThreads]);

  const handleDelete = async (id) => {
    setThreads(t => t.filter(x => x.id !== id));
    try { await fetch('/api/social/posts', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id }) }); } catch(e) {}
  };

  const handleVote = async (id) => {
    setThreads(t => t.map(x => x.id === id ? {...x, likes: x.liked ? x.likes - 1 : x.likes + 1, liked: !x.liked} : x));
    try { await fetch('/api/social/posts/like', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ postId: id }) }); } catch(e) {}
  };

  const myUserId = currentUserId;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 20px', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Loading threads…</div>
        ) : threads.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minHeight:300, textAlign:'center' }}>
            <i className="ti ti-messages" style={{ fontSize:34, color:'#AFA9EC' }} aria-hidden="true" />
            <div style={{ fontSize:14, fontWeight:500, color:'var(--text-muted)', fontFamily:'var(--font)' }}>No threads yet</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', maxWidth:220, lineHeight:1.5, fontFamily:'var(--font)' }}>Be the first to start a conversation above.</div>
          </div>
        ) : (
          threads.map(t => (
            <ThreadCard key={t.id} thread={t} myUserId={myUserId} onDelete={handleDelete} onVote={handleVote} />
          ))
        )}
      </div>
    </div>
  );
}

function PostComposer({ onClose, currentUserId, feedSection }) {
  const [text, setText] = React.useState('');
  const [assetTag, setAssetTag] = React.useState('');
  const [attachment, setAttachment] = React.useState(null);
  const [showPoll, setShowPoll] = React.useState(false);
  const [pollOptions, setPollOptions] = React.useState(['', '']);
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState('');
  const fileRef = React.useRef(null);
  const charsLeft = 280 - text.length;
  const validPoll = showPoll && pollOptions.filter(o => o.trim()).length >= 2;
  const canPost = (text.trim().length > 0 || attachment || validPoll) && !posting;

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const isImg = f.type.startsWith('image/');
    const sizeLabel = f.size > 1024*1024 ? (f.size/1024/1024).toFixed(1)+'MB' : Math.round(f.size/1024)+'KB';
    if (isImg) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const MAX = 1200;
          let { width, height } = img;
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
          else if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setAttachment({ type:'image', url: compressed, name: f.name, size: sizeLabel });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(f);
    } else {
      const reader = new FileReader();
      reader.onload = () => setAttachment({ type:'file', url:null, name:f.name, size:sizeLabel });
      reader.readAsArrayBuffer(f);
    }
    e.target.value = '';
  };

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true); setPostError('');
    const pollData = showPoll ? pollOptions.filter(o => o.trim()).map(o => ({ label: o.trim(), votes: 0 })) : null;
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          assetTag: assetTag.trim() || undefined,
          postType: feedSection === 'threads' ? 'thread' : 'post',
          imageUrl: attachment?.type === 'image' ? attachment.url : undefined,
          poll: pollData && pollData.length >= 2 ? pollData : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPostError(data.error || 'Failed to post'); setPosting(false); return; }
    } catch(e) { setPostError('Network error — try again'); setPosting(false); return; }
    window.dispatchEvent(new CustomEvent('post-created'));
    onClose();
  };

  const iStyle = { padding:'7px 10px', border:'0.5px solid var(--border)', borderRadius:8, fontSize:12, background:'var(--surface)', color:'var(--text)', fontFamily:'var(--font)', outline:'none', boxSizing:'border-box' };
  const iconBtn = (icon, tip, fn, active) => (
    <button key={icon} title={tip} onClick={fn}
      style={{ all:'unset', cursor:'pointer', width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, color:active?'#534AB7':'var(--text-muted)', background:active?'#EEEDFE':'transparent' }}
      onMouseEnter={e=>{e.currentTarget.style.color='#534AB7';e.currentTarget.style.background='#EEEDFE';}}
      onMouseLeave={e=>{e.currentTarget.style.color=active?'#534AB7':'var(--text-muted)';e.currentTarget.style.background=active?'#EEEDFE':'transparent';}}
    ><i className={`ti ${icon}`} aria-hidden="true" /></button>
  );

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" style={{ display:'none' }} onChange={handleFile} />

      {/* Body */}
      <div style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'14px 16px' }}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#534AB7,#7F77DD)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, marginTop:2 }}>Y</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0,280))}
          placeholder={showPoll ? "Add context for your poll (optional)..." : "Share a trade idea, chart, or market insight..."}
          rows={showPoll ? 2 : 4}
          autoFocus
          style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:14, color:'var(--text)', resize:'none', outline:'none', lineHeight:1.6 }}
        />
      </div>

      {/* Asset tag */}
      <div style={{ padding:'0 16px 10px', display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'var(--font)', flexShrink:0 }}>Asset:</span>
        <input value={assetTag} onChange={e=>setAssetTag(e.target.value.toUpperCase().slice(0,10))}
          placeholder="e.g. GOLD, EURUSD, BTC"
          style={{ ...iStyle, flex:1 }} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div style={{ margin:'0 16px 10px', borderRadius:10, overflow:'hidden', border:'0.5px solid var(--border)', position:'relative' }}>
          {attachment.type==='image'
            ? <img src={attachment.url} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', display:'block' }} />
            : <div style={{ padding:'10px 14px', background:'var(--surface2)', display:'flex', alignItems:'center', gap:10 }}>
                <i className="ti ti-file" style={{ fontSize:16, color:'var(--text-muted)' }} aria-hidden="true" />
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:'var(--text)', fontFamily:'var(--font)' }}>{attachment.name}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font)' }}>{attachment.size}</div>
                </div>
              </div>
          }
          <button onClick={()=>setAttachment(null)} style={{ position:'absolute', top:6, right:6, width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>×</button>
        </div>
      )}

      {/* Poll builder */}
      {showPoll && (
        <div style={{ margin:'0 16px 10px', padding:12, background:'var(--surface2)', borderRadius:10, border:'0.5px solid var(--border)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8, fontFamily:'var(--font)' }}>Poll options</div>
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display:'flex', gap:6, marginBottom:6 }}>
              <input value={opt} onChange={e=>{ const n=[...pollOptions]; n[i]=e.target.value; setPollOptions(n); }}
                placeholder={`Option ${i+1}`} style={{ ...iStyle, flex:1 }} />
              {pollOptions.length > 2 && (
                <button onClick={()=>setPollOptions(p=>p.filter((_,j)=>j!==i))}
                  style={{ all:'unset', cursor:'pointer', color:'var(--text-muted)', fontSize:18, padding:'0 4px' }}>×</button>
              )}
            </div>
          ))}
          {pollOptions.length < 5 && (
            <button onClick={()=>setPollOptions(p=>[...p,''])}
              style={{ all:'unset', cursor:'pointer', padding:'4px 12px', borderRadius:8, border:'0.5px solid var(--border)', color:'var(--text-muted)', fontSize:12, fontFamily:'var(--font)' }}>+ Add option</button>
          )}
        </div>
      )}

      {/* Error message */}
      {postError && (
        <div style={{ margin:'0 16px 8px', padding:'8px 12px', background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:8, fontSize:12, color:'#dc2626', fontFamily:'var(--font)' }}>
          {postError}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'10px 14px', borderTop:'0.5px solid var(--border)', background:'var(--surface2)' }}>
        {iconBtn('ti-photo', 'Image / chart', ()=>{ fileRef.current.accept='image/*'; fileRef.current.click(); }, false)}
        {iconBtn('ti-paperclip', 'Attach file', ()=>{ fileRef.current.accept='.pdf,.doc,.docx,.txt,.csv,.xlsx'; fileRef.current.click(); }, false)}
        <div style={{ width:'0.5px', height:20, background:'var(--border)', margin:'0 4px' }} />
        {iconBtn('ti-chart-bar', 'Add poll', ()=>setShowPoll(p=>!p), showPoll)}
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:charsLeft<20?'#dc2626':charsLeft<50?'#d97706':'var(--text-muted)', fontFamily:'var(--font)' }}>{charsLeft}</span>
        <button onClick={handlePost} disabled={!canPost || posting}
          style={{ all:'unset', cursor:(canPost&&!posting)?'pointer':'default', padding:'7px 20px', borderRadius:20, fontSize:13, fontWeight:600, background:(canPost&&!posting)?'#534AB7':'var(--surface3)', color:(canPost&&!posting)?'#fff':'var(--text-muted)', fontFamily:'var(--font)', marginLeft:8 }}>
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  );
}


export default function CommunityLayout({ currentUserId, externalTab, onTabChange }) {
  const TAB_MAP = { 'Feed':'feed','Groups':'groups','Messages':'dms','Local Traders':'local','feed':'feed','groups':'groups','dms':'dms','local':'local' };
  const [tab, setTabInternal] = React.useState('feed');
  const [feedSection, setFeedSection] = React.useState('discover');
  const [showPostModal, setShowPostModal] = React.useState(false);
  const setTab = (t) => { setTabInternal(t); if(onTabChange) onTabChange(t); };
  React.useEffect(() => { if(externalTab && TAB_MAP[externalTab]) setTabInternal(TAB_MAP[externalTab]); }, [externalTab]);

  const SIDEBAR_TABS = [
    { key:'feed',   icon:'ti-home',    label:'Feed',     sub:'Discover & share ideas' },
    { key:'groups', icon:'ti-users',   label:'Groups',   sub:'Your trading communities' },
    { key:'dms',    icon:'ti-message', label:'Messages', sub:'Direct messages' },
    { key:'local',  icon:'ti-map-pin', label:'Map',      sub:'Local traders near you' },
  ];
  const meta = SIDEBAR_TABS.find(t => t.key === tab) || SIDEBAR_TABS[0];

  return (
    <div style={{ display:'flex', flexDirection:'row', height:'100%', fontFamily:'var(--font)', overflow:'hidden', alignItems:'stretch' }}>
      <CommSidebar tab={tab} setTab={(t)=>setTab(t)} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        <div style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
          {tab === 'feed' && (
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0 }}>
              <div style={{ display:'flex', alignItems:'center', padding:'0 18px', gap:28, borderBottom:'0.5px solid var(--border)', flexShrink:0, height:44 }}>
                {['discover','following','threads'].map(s => (
                  <span key={s} onClick={() => setFeedSection(s)}
                    style={{ all:'unset', cursor:'pointer', fontFamily:'var(--font)', fontSize:14, fontWeight:feedSection===s?600:400, color:feedSection===s?'var(--text)':'var(--text-muted)', position:'relative', height:44, display:'inline-flex', alignItems:'center', whiteSpace:'nowrap' }}>
                    {feedSection===s && <span style={{ position:'absolute', bottom:-1, left:0, right:0, height:2, background:'var(--text)', borderRadius:1 }} />}
                    {s==='threads'?'Threads':s[0].toUpperCase()+s.slice(1)}
                  </span>
                ))}
                <button style={{ all:'unset', marginLeft:'auto', cursor:'pointer', width:28, height:28, borderRadius:'50%', background:'#534AB7', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:300, flexShrink:0 }}
                  onMouseEnter={e => e.currentTarget.style.background='#3C3489'}
                  onMouseLeave={e => e.currentTarget.style.background='#534AB7'}
                  title="New post" onClick={()=>setShowPostModal(true)}>+</button>
              </div>
              <div style={{ flex:1, overflow:'hidden', minHeight:0, display:'flex' }}>
                {(feedSection==='discover'||feedSection==='following') && <FeedTab currentUserId={currentUserId} activeTab={feedSection==='discover'?'Discover':'Following'} />}
                {feedSection==='threads' && <ThreadsFeed onNewPost={()=>setShowPostModal(true)} currentUserId={currentUserId} />}
              </div>
            </div>
          )}
          {tab === 'groups' && <GroupsView currentUserId={currentUserId} />}
          {tab === 'dms' && <DMTab />}
          {tab === 'local' && <LocalTradersTab currentUserId={currentUserId} onNavigate={(t) => setTab(TAB_MAP[t] || t)} />}
        </div>
      </div>

      {showPostModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={e => { if(e.target===e.currentTarget) setShowPostModal(false); }}>
          <div style={{ background:'var(--surface)', border:'0.5px solid var(--border)', borderRadius:16, width:500, maxWidth:'95vw', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'12px 16px', borderBottom:'0.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:14, fontWeight:500, color:'var(--text)', fontFamily:'var(--font)' }}>{feedSection === 'threads' ? 'New thread' : 'New post'}</span>
              <button onClick={()=>setShowPostModal(false)} style={{ all:'unset', cursor:'pointer', width:26, height:26, borderRadius:'50%', background:'var(--surface2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:14 }}>×</button>
            </div>
            <PostComposer onClose={()=>setShowPostModal(false)} currentUserId={currentUserId} feedSection={feedSection} />
          </div>
        </div>
      )}
    </div>
  );
}
