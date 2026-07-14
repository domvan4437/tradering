'use client';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

const PURPLE = '#4B44C8';

export default function NavBar({ activeSection, onSelect, user, hoveredSection, setHoveredSection, SECTION_TABS, setTab }) {
  const { data: session } = useSession();
  const plan = user?.plan || session?.user?.plan || 'free';

  const planColors = { pro: PURPLE, trader: '#7c3aed' };

  const navItems = [
    ['Community',    'community'],
    ['Competitions', 'compete'  ],
    ['Creator',      'creator'  ],
    ['Tools',        'tools2'   ],
    ['Journal',      'journal'  ],
  ];

  return (
    <nav suppressHydrationWarning style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 52,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      paddingLeft: 24, paddingRight: 24,
      zIndex: 300,
      gap: 0,
    }}>

      {/* Logo */}
      <div onClick={() => onSelect('community')}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 36, flexShrink: 0, cursor: 'pointer' }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: PURPLE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff' }} />
        </div>
        <span style={{
          fontFamily: 'var(--font)', fontSize: 16, fontWeight: 800,
          color: 'var(--text)', letterSpacing: '-0.4px',
        }}>TradeZar</span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, flex: 1, height: '100%' }}>
        {navItems.map(([label, sec]) => {
          const tabs = SECTION_TABS[sec] || [];
          const isActive = activeSection === sec;
          const isHovered = hoveredSection === sec;

          return (
            <div key={sec} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}
              onMouseEnter={() => setHoveredSection(sec)}
              onMouseLeave={() => setHoveredSection(null)}>
              <button
                onClick={() => { onSelect(sec); setTab(''); setHoveredSection(null); }}
                style={{
                  background: 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--text-muted)',
                  border: 'none',
                  borderBottom: isActive ? `2px solid ${PURPLE}` : '2px solid transparent',
                  borderTop: '2px solid transparent',
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  transition: 'all 0.12s',
                  whiteSpace: 'nowrap',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderBottomColor = 'var(--border)'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderBottomColor = 'transparent'; } }}>
                {label}
              </button>

              {/* Dropdown */}
              {isHovered && tabs.length > 0 && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 1px)', left: 0,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: 6,
                  minWidth: 160,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 400,
                }}>
                  {tabs.map(t => (
                    <button key={t}
                      onClick={() => { onSelect(sec); setTab(t); setHoveredSection(null); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 12px', borderRadius: 7, border: 'none',
                        background: 'transparent', color: 'var(--text-muted)',
                        fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

        {/* Search icon */}
        <button style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <i className="ti ti-search" style={{ fontSize: 17 }} />
        </button>

        {/* Help icon */}
        <button style={{ all: 'unset', cursor: 'pointer', width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <i className="ti ti-help-circle" style={{ fontSize: 17 }} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 6px' }} />

        {/* Plan badge — only show if pro/trader */}
        {plan !== 'free' && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', padding: '3px 9px', borderRadius: 20,
            background: planColors[plan] ? planColors[plan] + '18' : 'var(--surface2)',
            color: planColors[plan] || 'var(--text-muted)',
            border: `1px solid ${planColors[plan] ? planColors[plan] + '33' : 'var(--border)'}`,
          }}>{plan}</span>
        )}

        {/* Account button — Capital One "Sign In" style */}
        <button
          onClick={() => onSelect('account')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: activeSection === 'account' ? 'var(--surface2)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: activeSection === 'account' ? 600 : 400,
            color: activeSection === 'account' ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.12s',
          }}
          onMouseEnter={e => { if (activeSection !== 'account') { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; } }}
          onMouseLeave={e => { if (activeSection !== 'account') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; } }}>
          <i className="ti ti-user-circle" style={{ fontSize: 17 }} />
          {session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Account'}
        </button>
      </div>
    </nav>
  );
}
