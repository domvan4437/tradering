'use client';
import { useState } from 'react';
import CompeteTab from './CompeteTab';
import GlobalLeaderboard from './GlobalLeaderboard';

export default function CompeteLayout({ currentUserId }) {
  const [mode, setMode] = useState('Home');
  const isHome = mode === 'Home';
  return (
    <div style={{ display:'flex', height:'calc(100vh - 100px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      {isHome && (
        <div style={{ width:'38%', borderRight:'1px solid var(--border)', overflowY:'auto', flexShrink:0 }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>🏆 Leaderboard</div>
          <GlobalLeaderboard />
        </div>
      )}
      <div style={{ flex:1, overflowY:'auto', minWidth:0 }}>
        <CompeteTab currentUserId={currentUserId} mode={mode} setMode={setMode} />
      </div>
    </div>
  );
}