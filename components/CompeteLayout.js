'use client';
import CompeteTab from './CompeteTab';

export default function CompeteLayout({ currentUserId, externalTab }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CompeteTab currentUserId={currentUserId} externalTab={externalTab} />
    </div>
  );
}
