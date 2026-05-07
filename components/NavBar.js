
'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const PURPLE = '#4f46e5';

export default function NavBar({ activeSection, onSelect, user, hoveredSection, setHoveredSection, SECTION_TABS, setTab }) {
  const { data: session } = useSession();
  const plan = user?.plan || session?.user?.plan || 'free';

  const planStyles = {
    free:   { bg:'var(--surface2)',           color:'var(--text-muted)' },
    pro:    { bg:'rgba(79,70,229,0.12)',       color:PURPLE },
    trader: { bg:'rgba(124,58,237,0.12)',      color:'#7c3aed' },
  };
  const ps = planStyles[plan] || planStyles.free;

  // New nav order — Community first, no Home
  const navItems = [
    ['Community', 'community'],
    ['Compete',   'compete'  ],
    ['Markets',   'markets'  ],
    ['Charts',    'charts'   ],
    ['Creator',   'creator'  ],
    ['Tools',     'tools2'   ],
    ['Journal',   'journal'  ],
  ];

  return (
    <nav suppressHydrationWarning style={{
      position:'fixed', top:0, left:0, right:0, height:48,
      background:'var(--bg)',
      backdropFilter:'blur(20px)',
      borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center',
      paddingLeft:18, paddingRight:18,
      zIndex:300,
    }}>
      {/* Logo */}
      <div
        onClick={() => onSelect('community')}
        style={{ display:'flex', alignItems:'center', gap:8, marginRight:28, flexShrink:0, cursor:'pointer' }}>
        <div style={{
          width:26, height:26, borderRadius:'50%',
          border:'2.5px solid '+PURPLE,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 0 0 3px rgba(79,70,229,0.12)',
        }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:PURPLE }} />
        </div>
        <span style={{
          fontFamily:'var(--font)', fontSize:15, fontWeight:800,
          color:'var(--text)', letterSpacing:'-0.3px',
        }}>TradeRing</span>
      </div>

      {/* Nav items */}
      <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
        {navItems.map(([label, sec]) => {
          const tabs = SECTION_TABS[sec] || [];
          const isActive = activeSection === sec;
          const isHovered = hoveredSection === sec;

          return (
            <div key={sec}
              style={{ position:'relative' }}
              onMouseEnter={() => setHoveredSection(sec)}
              onMouseLeave={() => setHoveredSection(null)}>
              <button
                onClick={() => { onSelect(sec); setTab(''); setHoveredSection(null); }}
                style={{
                  background: isActive ? 'rgba(79,70,229,0.1)' : 'transparent',
                  color: isActive ? PURPLE : 'var(--text-muted)',
                  border:'none',
                  borderRadius:8,
                  padding:'6px 12px',
                  fontSize:13,
                  fontWeight: isActive ? 700 : 500,
                  cursor:'pointer',
                  fontFamily:'var(--font)',
                  transition:'all 0.15s',
                  whiteSpace:'nowrap',
                }}>
                {label}
              </button>

              {/* Dropdown */}
              {isHovered && tabs.length > 0 && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', left:0,
                  background:'var(--surface)',
                  border:'1px solid var(--border)',
                  borderRadius:10,
                  padding:6,
                  minWidth:160,
                  boxShadow:'0 8px 32px rgba(0,0,0,0.15)',
                  zIndex:400,
                }}>
                  {tabs.map(t => (
                    <button key={t}
                      onClick={() => { onSelect(sec); setTab(t); setHoveredSection(null); }}
                      style={{
                        display:'block', width:'100%', textAlign:'left',
                        padding:'8px 12px', borderRadius:7, border:'none',
                        background:'transparent', color:'var(--text-muted)',
                        fontFamily:'var(--font)', fontSize:13, cursor:'pointer',
                        transition:'all 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-muted)'; }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right side — Account + Plan badge */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
        <span style={{
          fontSize:10, fontWeight:700, textTransform:'uppercase',
          letterSpacing:'0.08em', padding:'3px 10px', borderRadius:20,
          background:ps.bg, color:ps.color,
        }}>{plan}</span>
        <button
          onClick={() => onSelect('account')}
          style={{
            background: activeSection==='account' ? 'rgba(79,70,229,0.1)' : 'var(--surface2)',
            border:'1px solid var(--border)',
            borderRadius:20, padding:'5px 14px',
            fontFamily:'var(--font)', fontSize:12, fontWeight:600,
            color: activeSection==='account' ? PURPLE : 'var(--text-muted)',
            cursor:'pointer', transition:'all 0.15s',
          }}>
          {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Account'}
        </button>
      </div>
    </nav>
  );
}
