'use client';
import { useState } from 'react';

function GroupRow({ g, selected, onSelect }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={() => onSelect(g)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
        cursor:'pointer', borderRadius:8, margin:'2px 6px',
        background: selected ? 'var(--accent-bg)' : hov ? 'var(--surface2)' : 'transparent',
        borderLeft: selected ? '2px solid var(--accent)' : '2px solid transparent',
      }}>
      <div style={{ width:38, height:38, borderRadius:10, background:g.grad, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:'#fff', flexShrink:0 }}>{g.name[0]}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:13, fontWeight:600, color: selected?'var(--accent)':'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{g.name}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontFamily:'var(--font)', fontSize:10, color:'var(--text-muted)' }}>
            {g.type==='club' ? g.members+'/'+g.max+' members' : g.members.toLocaleString()+' members'}
          </span>
          {g.price > 0 && <span style={{ fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700, color:'var(--accent)' }}>${g.price}/mo</span>}
          {g.joined && <span style={{ fontFamily:'var(--font)', fontSize:9, fontWeight:600, color:'var(--green)' }}>Joined</span>}
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('club');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const GRADS = [
    'linear-gradient(135deg,#4f46e5,#7c3aed)',
    'linear-gradient(135deg,#0891b2,#0e7490)',
    'linear-gradient(135deg,#16a34a,#15803d)',
    'linear-gradient(135deg,#d97706,#b45309)',
    'linear-gradient(135deg,#dc2626,#b91c1c)',
  ];
  const [grad, setGrad] = useState(GRADS[0]);

  const submit = () => {
    if(!name.trim()) return;
    onCreate({
      id: Date.now(), name, type, price: parseFloat(price)||0,
      desc, grad, members:1, max:50, joined:true, verified:false,
      creator:'you',
    });
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:420, maxWidth:'90vw', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily:'var(--font)', fontSize:18, fontWeight:700, color:'var(--text)', marginBottom:20 }}>Create a Group</div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Group Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. COT Swing Traders" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Type</label>
          <div style={{ display:'flex', gap:8 }}>
            {['club','channel'].map(t => (
              <button key={t} onClick={() => setType(t)} style={{ flex:1, padding:'9px', borderRadius:8, border:`1px solid ${type===t?'var(--accent)':'var(--border)'}`, background: type===t?'var(--accent-bg)':'var(--surface2)', color: type===t?'var(--accent)':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                {t==='club' ? '👥 Club (max 50)' : '📢 Channel (unlimited)'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Monthly Price ($) — leave blank for free</label>
          <input value={price} onChange={e => setPrice(e.target.value)} placeholder="0" type="number" min="0" style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', boxSizing:'border-box' }} />
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:6 }}>Description</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What is this group about?" rows={3} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface2)', fontFamily:'var(--font)', fontSize:13, color:'var(--text)', outline:'none', resize:'none', boxSizing:'border-box' }} />
        </div>

        <div style={{ marginBottom:20 }}>
          <label style={{ fontFamily:'var(--font)', fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', display:'block', marginBottom:8 }}>Color</label>
          <div style={{ display:'flex', gap:8 }}>
            {GRADS.map(g => (
              <div key={g} onClick={() => setGrad(g)} style={{ width:28, height:28, borderRadius:8, background:g, cursor:'pointer', border: grad===g?'2px solid var(--text)':'2px solid transparent' }} />
            ))}
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

export default function GroupsTab({ currentUserId }) {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const shown = filter==='mine' ? groups.filter(g=>g.joined) :
                filter==='clubs' ? groups.filter(g=>g.type==='club') :
                filter==='channels' ? groups.filter(g=>g.type==='channel') : groups;

  const createGroup = (g) => {
    setGroups(p => [g, ...p]);
    setSelected(g);
  };

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
          <div style={{ padding:'40px 20px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:10 }}>👥</div>
            <div style={{ fontFamily:'var(--font)', fontSize:14, fontWeight:600, color:'var(--text)', marginBottom:6 }}>No groups yet</div>
            <div style={{ fontFamily:'var(--font)', fontSize:12, color:'var(--text-muted)', lineHeight:1.6 }}>Create your first group or join one from Discover.</div>
          </div>
        ) : (
          <>
            {shown.filter(g=>g.joined).length > 0 && (
              <div>
                <div style={{ padding:'8px 14px 4px', fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>My Groups</div>
                {shown.filter(g=>g.joined).map(g => <GroupRow key={g.id} g={g} selected={selected?.id===g.id} onSelect={setSelected} />)}
              </div>
            )}
            {shown.filter(g=>!g.joined).length > 0 && (
              <div>
                <div style={{ padding:'8px 14px 4px', fontFamily:'var(--font)', fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--text-muted)' }}>Discover</div>
                {shown.filter(g=>!g.joined).map(g => <GroupRow key={g.id} g={g} selected={selected?.id===g.id} onSelect={setSelected} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
