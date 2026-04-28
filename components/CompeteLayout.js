'use client';
import CompeteTab from './CompeteTab';
import GlobalLeaderboard from './GlobalLeaderboard';

export default function CompeteLayout({ currentUserId }) {
  return (
    <div style={{ display:'flex', height:'calc(100vh - 100px)', overflow:'hidden', fontFamily:'var(--font)' }}>
      <div style={{ width:'38%', borderRight:'1px solid var(--border)', overflowY:'auto' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:14, fontWeight:700, color:'var(--text)' }}>🏆 Leaderboard</div>
        <GlobalLeaderboard />
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        <CompeteTab currentUserId={currentUserId} />
      </div>
    </div>
  );
}
