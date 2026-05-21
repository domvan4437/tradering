const fs = require('fs')
let s = fs.readFileSync('components/CommunityLayout.js', 'utf8')

// Add showManageRooms state
s = s.replace(
  `const [showBrowse, setShowBrowse] = useState(false);`,
  `const [showBrowse, setShowBrowse] = useState(false);\r\n  const [showManageRooms, setShowManageRooms] = useState(false);\r\n  const [customRooms, setCustomRooms] = useState(['general','trade-ideas','cot-analysis','announcements']);\r\n  const [newRoomName, setNewRoomName] = useState('');`
)

// Replace the alert with setShowManageRooms
s = s.replace(
  `onClick={()=>alert('Manage rooms coming soon')}`,
  `onClick={()=>setShowManageRooms(true)}`
)

// Add manage rooms modal before the closing return div
// Find a good anchor - the showCreate modal
const OLD_MODAL_ANCHOR = `{showCreate && (`
const manageRoomsModal = `{showManageRooms && (
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
                    <button onClick={() => setCustomRooms(r => r.filter((_,idx)=>idx!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:14, padding:'0 2px' }}
                      onMouseEnter={e=>e.currentTarget.style.color='#dc2626'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>×</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input value={newRoomName} onChange={e=>setNewRoomName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,''))}
                placeholder="new-room-name" onKeyDown={e=>{if(e.key==='Enter'&&newRoomName.trim()){setCustomRooms(r=>[...r,newRoomName.trim()]);setNewRoomName('');}}}
                style={{ flex:1, padding:'7px 10px', border:'0.5px solid var(--border2)', borderRadius:6, background:'var(--surface2)', fontSize:12, color:'var(--text)', fontFamily:'var(--font)', outline:'none' }} />
              <button onClick={()=>{if(newRoomName.trim()){setCustomRooms(r=>[...r,newRoomName.trim()]);setNewRoomName('');}}}
                style={{ padding:'7px 14px', background:'#4B44C8', color:'#fff', border:'none', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'var(--font)' }}>Add</button>
            </div>
            <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>Type a name and press Enter or Add. "general" cannot be removed.</div>
          </div>
        </div>
      )}
      `

if (s.includes(OLD_MODAL_ANCHOR)) {
  s = s.replace(OLD_MODAL_ANCHOR, manageRoomsModal + OLD_MODAL_ANCHOR)
  console.log('✓ Manage rooms modal added')
} else {
  console.log('⚠ Modal anchor not found')
}

// Also use customRooms instead of ROOMS constant for rendering
s = s.replace(
  `{ROOMS.map(ch => (`,
  `{customRooms.map(ch => (`
)
console.log('✓ Rooms list now uses customRooms state')

fs.writeFileSync('components/CommunityLayout.js', s, 'utf8')
console.log('✓ Saved')
console.log('\nRun: rd /s /q .next & npm run dev')
