'use client';
import { useState } from 'react';
import FeedTab from './FeedTab';
import GroupsTab from './GroupsTab';

export default function CommunityLayout({ currentUserId }) {
  const [feedMode, setFeedMode] = useState('discover');
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
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => setFeedMode('discover')} style={{ padding:'7px 18px', borderRadius:8, border:'none', background: feedMode==='discover'?'var(--accent)':'var(--surface2)', color: feedMode==='discover'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Discover</button>
          <button onClick={() => setFeedMode('following')} style={{ padding:'7px 18px', borderRadius:8, border:'none', background: feedMode==='following'?'var(--accent)':'var(--surface2)', color: feedMode==='following'?'#fff':'var(--text-muted)', fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Following</button>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}><FeedTab currentUserId={currentUserId} /></div>
      </div>
    </div>
  );
}
