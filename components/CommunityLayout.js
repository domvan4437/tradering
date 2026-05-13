'use client'
import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import FeedTab from './FeedTab';
import DMTab from './DMTab';

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
  try { const d = localStorage.getItem('tr_groups'); if (!d) return []; return JSON.parse(d).map(g => ({ visibility:'open', country:'', desc:'', profileImg:null, ...g })); } catch(e) { return []; }
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

function GroupChatRoom({ group, activeRoom }) {
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([]);
  const [attachment, setAttachment] = useState(null);
  const [popover, setPopover] = useState(false);
  const [linkInput, setLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
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
    const m = { id:Date.now(), user:'you', text:msg.trim(), time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), attachment: attachment||null };
    const updated = [...messages, m];
    setMessages(updated);
    try { localStorage.setItem('tr_chat_'+group.id+'_'+activeRoom, JSON.stringify(updated)); } catch {}
    setMsg(''); setAttachment(null);
  };

  const popItems = [
    { label:'Image', icon:'📷', action:() => { fileRef.current.accept='image/*'; fileRef.current.click(); } },
    { label:'File', icon:'📎', action:() => { fileRef.current.accept='.pdf,.doc,.docx,.txt,.csv,.xlsx'; fileRef.current.click(); } },
    { label:'Link', icon:'🔗', action:() => { setLinkInput(true); setPopover(false); } },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minWidth:0, overflow:'hidden' }}>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
        <span style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>#</span>
        <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{activeRoom}</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length === 0 && <div style={{ textAlign:'center', padding:'40px 0', fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>No messages in #{activeRoom} yet. Say hello!</div>}
        {messages.map(m => (
          <div key={m.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:getColor(m.user), display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>{(m.user||'?')[0].toUpperCase()}</div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>{m.user}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{m.time}</span>
              </div>
              {m.text && <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{m.text}</div>}
              {m.attachment?.type==="image" && <div style={{ marginTop:6, borderRadius:10, overflow:'hidden', maxWidth:280 }}><img src={m.attachment.url} alt="" style={{ width:'100%', display:'block', borderRadius:10 }} /></div>}
              {m.attachment?.type==="file" && <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', maxWidth:280 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><div><div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{m.attachment.name}</div>{m.attachment.size&&<div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{m.attachment.size}</div>}</div></div>}
              {m.attachment?.type==="link" && <a href={m.attachment.url} target="_blank" rel="noreferrer" style={{ marginTop:6, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, background:'var(--surface2)', border:'1px solid var(--border)', maxWidth:280, textDecoration:'none' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg><span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--accent)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.attachment.url}</span></a>}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        {attachment && (
          <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, background:'var(--surface2)', border:'1px solid var(--border)' }}>
            {attachment.type==='image' && <img src={attachment.url} alt="" style={{ width:36, height:36, borderRadius:6, objectFit:'cover' }} />}
            <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{attachment.name}</span>
            <button onClick={() => setAttachment(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:18, lineHeight:1 }}>x</button>
          </div>
        )}
        {linkInput && (
          <div style={{ marginBottom:8, display:'flex', gap:6 }}>
            <input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&attachLink()} placeholder="Paste a URL..." autoFocus style={{ flex:1, padding:'7px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:12, color:'var(--text)', outline:'none' }} />
            <button onClick={attachLink} style={{ padding:'7px 14px', borderRadius:8, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Attach</button>
            <button onClick={() => { setLinkInput(false); setLinkUrl(''); }} style={{ padding:'7px 10px', borderRadius:8, background:'var(--surface2)', color:'var(--text-muted)', border:'1px solid var(--border)', cursor:'pointer' }}>x</button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx" style={{ display:'none' }} onChange={handleFile} />
        <div style={{ display:'flex', gap:8, alignItems:'center', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'8px 12px' }}>
          <div ref={popRef} style={{ position:'relative', flexShrink:0 }}>
            <button onClick={() => setPopover(p => !p)} style={{ width:28, height:28, borderRadius:'50%', background:popover?PURPLE:'var(--accent-bg,#EEEDFE)', border:'1px solid '+(popover?PURPLE:'#4f46e5'), display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:popover?'#fff':PURPLE, fontSize:20, lineHeight:1, fontWeight:300, outline:'none' }}>+</button>
            {popover && (
              <div style={{ position:'fixed', bottom:'auto', top:0, left:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'6px', minWidth:160, zIndex:99999, boxShadow:'0 8px 24px rgba(0,0,0,0.15)' }}>
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
          <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} }} placeholder={'Message #'+activeRoom} style={{ flex:1, border:'none', background:'transparent', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none' }} />
          <button onClick={send} disabled={!msg.trim()&&!attachment} style={{ width:30, height:30, borderRadius:8, background:(msg.trim()||attachment)?PURPLE:'var(--surface3)', color:'#fff', border:'none', cursor:(msg.trim()||attachment)?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
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
    const idx = all.findIndex(g => g.id === group.id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updated }; localStorage.setItem('tr_groups', JSON.stringify(all)); }
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
            <input ref={imgRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>setProfileImg(ev.target.result); r.readAsDataURL(f); }} />
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
          <button onClick={save} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {saved ? '✓ Saved' : 'Save Changes'}
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
  const [createName, setCreateName] = useState('');
  const [createType, setCreateType] = useState('club');
  const [createVis, setCreateVis] = useState('open');
  const [createDesc, setCreateDesc] = useState('');
  const [createCountry, setCreateCountry] = useState('');
  const [createPrice, setCreatePrice] = useState('');
  const [createImg, setCreateImg] = useState(null);
  const [createGrad, setCreateGrad] = useState('linear-gradient(135deg,#4f46e5,#7c3aed)');
  const ROOMS = ['general','trade-ideas','cot-analysis','announcements'];

  useEffect(() => {
    const loaded = loadGroups();
    setGroups(loaded);
    const lastId = localStorage.getItem('tr_last_group');
    const def = loaded.find(g => g.id === lastId) || loaded.find(g => g.joined) || loaded[0] || null;
    if (def) setOpenGroup(def);
  }, []);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => setDropdownOpen(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  const handleIconClick = (e, g, active) => {
    e.stopPropagation();
    if (!active) { switchGroup(g); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    setDropdownOpen(d => !d);
  };

  const switchGroup = (g) => { setOpenGroup(g); setActiveRoom('general'); setDropdownOpen(false); try { localStorage.setItem('tr_last_group', g.id); } catch {} };
  const MEMBERS = openGroup ? (openGroup.creator==='you' ? [{name:'you',role:'Founder',color:'#4f46e5'}] : [{name:openGroup.creator||'Creator',role:'Founder',color:'#16a34a'},{name:'you',role:'Member',color:'#4f46e5'}]) : [];
  const roleColor = (r) => r==='Founder'?'#16a34a':r==='Co-Leader'?'#d97706':'var(--text-muted)';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      {/* Fixed dropdown rendered at body level via fixed positioning */}
      {dropdownOpen && openGroup && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div onClick={e => e.stopPropagation()} style={{ position:'fixed', top:dropdownPos.top, left:dropdownPos.left, width:230, zIndex:99999, transform:'translateZ(0)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.25)' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:10, background:openGroup.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', overflow:'hidden', flexShrink:0 }}>
              {openGroup.profileImg ? <img src={openGroup.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (openGroup.name||'G')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:700, color:'var(--text)' }}>{openGroup.name}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{openGroup.type==='club'?openGroup.members+'/'+(openGroup.max||50)+' members':(openGroup.members||1)+' members'} · {openGroup.visibility||'open'}</div>
            </div>
          </div>
          <div style={{ padding:'8px 8px 4px' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Rooms</div>
            {ROOMS.map(ch => (
              <button key={ch} onClick={() => { setActiveRoom(ch); setDropdownOpen(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, border:'none', background:activeRoom===ch?'#EEEDFE':'transparent', color:activeRoom===ch?'#3C3489':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:activeRoom===ch?600:400, cursor:'pointer', textAlign:'left' }}
                onMouseEnter={e => { if(activeRoom!==ch) e.currentTarget.style.background='var(--surface2)'; }}
                onMouseLeave={e => { if(activeRoom!==ch) e.currentTarget.style.background='transparent'; }}>
                <span style={{ fontSize:14 }}>#</span> {ch}
              </button>
            ))}
          </div>
          <div style={{ padding:'4px 8px 4px', borderTop:'1px solid var(--border)' }}>
            <div style={{ fontFamily:'var(--font)', fontSize:10, fontWeight:600, color:'var(--text-muted)', padding:'4px 10px', letterSpacing:'0.08em', textTransform:'uppercase' }}>Members</div>
            {MEMBERS.map(m => (
              <div key={m.name} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:m.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>{m.name[0].toUpperCase()}</div>
                <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text)', flex:1 }}>{m.name}</span>
                <span style={{ fontFamily:'var(--font)', fontSize:10, color:roleColor(m.role) }}>{m.role}</span>
              </div>
            ))}
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

      {showSettings && openGroup && <GroupSettings group={openGroup} onClose={() => setShowSettings(false)} onUpdate={(u) => { setOpenGroup(g => ({...g, ...u})); setGroups(prev => prev.map(g => g.id===openGroup.id ? {...g,...u} : g)); }} />}
      {/* Icon rail */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', borderBottom:'1px solid var(--border)', background:'var(--surface)', flexShrink:0, overflowX:'auto' }}>
        {groups.length === 0
          ? <span style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)' }}>No groups yet</span>
          : groups.map(g => {
            const active = openGroup && openGroup.id === g.id;
            return (
              <button key={g.id} onClick={e => handleIconClick(e, g, active)} title={g.name}
                style={{ width:40, height:40, borderRadius:active?14:'50%', background:g.grad||PURPLE, border:active?'2px solid '+PURPLE:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer', flexShrink:0, overflow:'hidden', transition:'all 0.2s', outline:'none', padding:0 }}>
                {g.profileImg ? <img src={g.profileImg} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
              </button>
            );
          })
        }
        {groups.length > 0 && <div style={{ width:1, height:28, background:'var(--border)', flexShrink:0, margin:'0 2px' }} />}
        <button onClick={() => setShowCreate(true)} title="Create group" style={{ width:40, height:40, borderRadius:'50%', background:'var(--surface2)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, color:'var(--text-muted)', fontSize:20, outline:'none' }}>+</button>
      </div>

      {/* Chat */}
      <div style={{ flex:1, overflow:'hidden' }}>
        {openGroup
          ? <GroupChatRoom group={openGroup} activeRoom={activeRoom} />
          : <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:12 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)' }}>No groups yet</div>
              <div style={{ fontFamily:'var(--font)', fontSize:13, color:'var(--text-muted)' }}>Click + to create your first group.</div>
            </div>
        }
      </div>

      {/* Create group modal */}
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
              <button onClick={() => {
                if (!createName.trim()) return;
                const ng = { id:Date.now(), name:createName, type:createType, visibility:createVis, desc:createDesc, country:createCountry, price:parseFloat(createPrice)||0, profileImg:createImg, grad:createGrad, members:1, max:50, joined:true, creator:'you' };
                const all = [...groups, ng]; setGroups(all);
                try { localStorage.setItem('tr_groups', JSON.stringify(all)); } catch {}
                setOpenGroup(ng); setShowCreate(false); setCreateName(''); setCreateDesc(''); setCreateCountry(''); setCreatePrice(''); setCreateImg(null); setCreateGrad('linear-gradient(135deg,#4f46e5,#7c3aed)');
              }} disabled={!createName.trim()} style={{ flex:1, padding:'11px', borderRadius:10, border:'none', background:createName.trim()?PURPLE:'var(--surface3)', color:createName.trim()?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:700, cursor:createName.trim()?'pointer':'default' }}>Create Group</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function CommunityLayout({ currentUserId, externalTab, onTabChange }) {
  const TAB_MAP = { 'Feed':'feed', 'Groups':'groups', 'Messages':'dms', 'feed':'feed', 'groups':'groups', 'dms':'dms' };
  const [tab, setTabInternal] = useState('feed');
  const [feedTab, setFeedTab] = useState('Discover');
  const setTab = (t) => { setTabInternal(t); if(onTabChange) onTabChange(t); };
  useEffect(() => { if(externalTab && TAB_MAP[externalTab]) setTabInternal(TAB_MAP[externalTab]); }, [externalTab]);
  return (
    <div style={{ display:'flex', flexDirection:'column', fontFamily:'var(--font)' }}>
      {/* Purple top nav */}
      <div style={{ background:PURPLE, padding:'0 20px', display:'flex', alignItems:'stretch', justifyContent:'space-between', flexShrink:0, position:'sticky', top:82, zIndex:299, pointerEvents:'all' }}>
        <div style={{ display:'flex', gap:0 }}>
          {[['feed','Feed'],['groups','Groups'],['dms','Messages']].map(([t,l]) => (
            <button key={t} onClick={(e) => { e.stopPropagation(); setTab(t); }} style={{ padding:'11px 20px', background:'none', border:'none', borderBottom:tab===t?'2px solid #fff':'2px solid transparent', color:tab===t?'#fff':'rgba(255,255,255,0.6)', fontFamily:'var(--font)', fontSize:13, fontWeight:tab===t?600:400, cursor:'pointer', transition:'all 0.15s', marginBottom:-1 }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, color:'rgba(255,255,255,0.7)' }}>
          {tab === 'feed' && <UserSearch />}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor:'pointer', flexShrink:0 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
      </div>
      {/* Feed sub-tabs */}
      {tab === 'feed' && (
        <div style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', flexShrink:0, display:'flex', alignItems:'stretch', overflowX:'auto', position:'sticky', top:120, zIndex:298 }}>
          {[{key:'Discover',icon:'trending-up'},{key:'Following',icon:'users'},{key:'Ideas'},{key:'Screeners'},{key:'Strategies'},{key:'COT Signals'}].map(({key:ft,icon}) => (
            <button key={ft} onClick={() => setFeedTab(ft)} style={{ padding:'10px 16px', background:'none', border:'none', borderBottom:feedTab===ft?'2px solid '+PURPLE:'2px solid transparent', color:feedTab===ft?PURPLE:'var(--text-muted)', fontFamily:'var(--font)', fontSize:13, fontWeight:feedTab===ft?600:400, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>
              {icon==='trending-up' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
              {icon==='users' && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              {ft}
            </button>
          ))}
        </div>
      )}
      {/* Tab content */}
      <div style={{ flex:1, display:'flex' }}>
        {tab === 'feed' && (
          <div style={{ flex:1, display:'flex' }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ height: 40 }} /><FeedTab currentUserId={currentUserId} activeTab={feedTab} />
            </div>
            <div style={{ width:220, borderLeft:'1px solid var(--border)', overflowY:'auto', padding:'16px 14px', flexShrink:0 }}>
              <RightSidebar />
            </div>
          </div>
        )}
        {tab === 'groups' && (
          <div style={{ flex:1, overflow:'visible', paddingTop:56 }}>
            <GroupsView currentUserId={currentUserId} />
          </div>
        )}
        {tab === 'dms' && (
          <div style={{ flex:1, overflow:'hidden' }}>
            <DMTab />
          </div>
        )}
      </div>
    </div>
  );
}

function RightSidebar() {
  const [groups, setGroups] = useState([]);
  useEffect(() => { setGroups(loadGroups().slice(0,3)); }, []);
  const TRENDING = [{tag:'GoldCOT',posts:2847},{tag:'FOMC',posts:1204},{tag:'EURUSD',posts:892},{tag:'CrudeOil',posts:744}];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {groups.length > 0 && (
        <div>
          <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Your Groups</div>
          {groups.map(g => (
            <div key={g.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:10, background:'var(--surface2)', marginBottom:6, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface3,var(--surface2))'}
              onMouseLeave={e => e.currentTarget.style.background='var(--surface2)'}>
              <div style={{ width:28, height:28, borderRadius:8, background:g.grad||PURPLE, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, overflow:'hidden' }}>
                {g.profileImg ? <img src={g.profileImg} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : (g.name||'G')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</div>
                <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{g.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Trending</div>
        {TRENDING.map(t => (
          <div key={t.tag} style={{ marginBottom:8, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.7'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}>
            <div style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color:'var(--text)' }}>#{t.tag}</div>
            <div style={{ fontFamily:'var(--font)', fontSize:11, color:'var(--text-muted)' }}>{t.posts.toLocaleString()} posts</div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:10 }}>Who to follow</div>
        {[{user:'seasonaltrader',wr:'67%',style:'Swing',color:'#4f46e5'},{user:'alpharesearch',wr:'71%',style:'Macro',color:'#0891b2'},{user:'graintrader99',wr:'59%',style:'Position',color:'#d97706'}].map(u => (
          <div key={u.user} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', background:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>{u.user[0].toUpperCase()}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text)' }}>{u.user}</div>
              <div style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>{u.wr} WR · {u.style}</div>
            </div>
            <button style={{ padding:'4px 10px', borderRadius:20, background:PURPLE, color:'#fff', border:'none', fontFamily:'var(--font)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Follow</button>
          </div>
        ))}
      </div>
    </div>
  );
}
