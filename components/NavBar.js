
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { LiveDot } from './DS';

const SECTIONS = ['home','markets','news','community','tools'];
const LABELS   = { home:'Home', markets:'Markets', news:'News', community:'Community', tools:'Tools' };

export default function NavBar({ activeSection, onSelect, user, hoveredSection, setHoveredSection, SECTION_TABS, setTab }) {
  const { data: session } = useSession();
  const plan = user?.plan || session?.user?.plan || 'free';

  const planStyles = {
    free:   { bg:'#f3f4f6',           color:'#6b7280' },
    pro:    { bg:'var(--accent-bg)',   color:'var(--accent)' },
    trader: { bg:'rgba(167,139,250,0.12)', color:'#7c3aed' },
  };
  const ps = planStyles[plan] || planStyles.free;

  return (
    <nav style={{
      position: 'fixed', top:0, left:0, right:0, height:46,
      background: 'rgba(255,255,255,0.96)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      paddingLeft: 18, paddingRight: 18,
      zIndex: 300,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:28, flexShrink:0 }}>
        <div style={{
          width:24, height:24, borderRadius:'50%',
          border:'2.5px solid var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 0 3px var(--accent-bg)',
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)' }} />
        </div>
        <span style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:800, color:'var(--text)', letterSpacing:'-0.4px' }}>
          TradeRing
        </span>
      </div>

      {/* Nav links with dropdowns */}
      <div style={{ display:'flex', flex:1, overflow:'visible' }}>
        {SECTIONS.map(sec => {
          const tabs = SECTION_TABS?.[sec] || [];
          const hasDropdown = tabs.length > 1;
          const isActive = activeSection === sec;
          const isHovered = hoveredSection === sec;
          return (
            <div
              key={sec}
              style={{ position:'relative', flexShrink:0 }}
              onMouseEnter={() => setHoveredSection(sec)}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <button
                onClick={() => { onSelect(sec); setHoveredSection(null); }}
                style={{
                  background: isActive ? 'var(--accent-bg)' : 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '0 12px', height: 46,
                  fontFamily: 'var(--font)',
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s', marginBottom: -1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {LABELS[sec]}
                {hasDropdown && <span style={{ fontSize:9, opacity:0.5 }}>▾</span>}
              </button>

              {hasDropdown && isHovered && (
                <div style={{
                  position: 'absolute', top:'100%', left:0,
                  background: '#fff',
                  border: '1px solid var(--border2)',
                  borderRadius: '0 0 10px 10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
                  zIndex: 500, minWidth: 200, padding: '6px 0',
                  animation: 'tr-fadeUp 0.12s ease both',
                }}>
                  {tabs.map(t => (
                    <button
                      key={t}
                      onClick={() => { onSelect(sec); setTab(t); setHoveredSection(null); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        background: 'none',
                        color: 'var(--text-secondary)',
                        border: 'none',
                        borderLeft: '2px solid transparent',
                        padding: '9px 16px',
                        fontSize: 13, fontFamily: 'var(--font)', fontWeight: 400,
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: 'all 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--accent-bg)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.borderLeftColor='var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderLeftColor='transparent'; }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:16, flexShrink:0 }}>
        <LiveDot />
        <span style={{
          fontFamily:'var(--font)', fontSize:11, fontWeight:600,
          letterSpacing:'0.06em', textTransform:'uppercase',
          color: ps.color, background: ps.bg,
          padding:'3px 10px', borderRadius:20,
        }}>{plan}</span>
        {session && (
          <div
            onClick={() => signOut()}
            title="Sign out"
            style={{
              width:30, height:30, borderRadius:'50%',
              background:'linear-gradient(135deg, var(--grad-start), var(--grad-mid))',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font)', fontSize:12, fontWeight:700,
              color:'#fff', cursor:'pointer',
              boxShadow:'0 2px 8px rgba(99,102,241,0.3)',
            }}
          >
            {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
    </nav>
  );
}
