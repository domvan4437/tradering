'use client'
function goToProfile(slug) {
  if (typeof window !== 'undefined' && window.__goToProfile) {
    window.__goToProfile(slug);
  }
};
import { useState } from 'react';
import FeedTab from './FeedTab';
import GroupsTab from './GroupsTab';

export default function CommunityLayout({ currentUserId }) {
  
  const [groupMode, setGroupMode] = useState('discover');
  return (
    <div style={{ display:'flex', height:'calc(100vh - 100px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      <div style={{ width:'38%', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => setGroupMode('discover')} style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background: groupMode==='discover'?'var(--accent)':'var(--surface2)', color: groupMode==='discover'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Discover</button>
          <button onClick={() => setGroupMode('mine')} style={{ flex:1, padding:'7px', borderRadius:8, border:'none', background: groupMode==='mine'?'var(--accent)':'var(--surface2)', color: groupMode==='mine'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>My Groups</button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}><GroupsTab currentUserId={currentUserId} /></div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto' }}><FeedTab currentUserId={currentUserId} /></div>
      </div>
    </div>
  );
}
