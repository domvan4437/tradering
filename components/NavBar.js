
'use client';
import { useSession, signOut } from 'next-auth/react';
import { LiveDot } from './DS';

const SECTIONS = ['home','commodities','futures','forex','stocks','tools','news','social','groups','compete','broker','charts'];
const LABELS = {
  home:'Home', commodities:'Commodities', futures:'Futures', forex:'Forex',
  stocks:'Stocks', tools:'Tools', news:'News', social:'Community',
  groups:'Groups', compete:'Compete', broker:'Broker', charts:'Charts'
};

export default function NavBar({ activeSection, onSelect, user }) {
  const { data: session } = useSession();
  const plan = user?.plan || session?.user?.plan || 'free';
  const planColor = { free:'var(--text-muted)', pro:'var(--accent)', trader:'var(--accent)' }[plan] || 'var(--text-muted)';

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, height:54,
      background:'rgba(4,6,10,0.96)',
      backdropFilter:'blur(24px)',
      borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center',
      paddingLeft:20, paddingRight:20,
      zIndex:200,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:28, flexShrink:0 }}>
        <div style={{
          width:26, height:26, border:'2px solid var(--accent)',
          borderRadius:'50%', position:'relative',
          boxShadow:'0 0 14px rgba(0,212,255,0.32)', flexShrink:0,
        }}>
          <div style={{ position:'absolute', inset:4, border:'1px solid rgba(0,212,255,0.3)', borderRadius:'50%' }} />
        </div>
        <span style={{
          fontFamily:'var(--font)', fontSize:15, fontWeight:600,
          letterSpacing:'0.05em', color:'var(--text)',
        }}>TradeRing</span>
      </div>

      {/* Nav links */}
      <div style={{ display:'flex', gap:0, flex:1, overflow:'hidden' }}>
        {SECTIONS.map(s => (
          <button key={s} onClick={() => onSelect(s)} style={{
            background: activeSection === s ? 'var(--accent-bg)' : 'none',
            border: 'none',
            borderBottom: activeSection === s ? '2px solid var(--accent)' : '2px solid transparent',
            padding:'0 13px', height:54,
            fontFamily:'var(--font)',
            fontSize:12, fontWeight:500,
            letterSpacing:'0.03em',
            color: activeSection === s ? 'var(--accent)' : 'var(--text-muted)',
            cursor:'pointer', whiteSpace:'nowrap',
            transition:'all 0.15s', flexShrink:0,
          }}>
            {LABELS[s]}
          </button>
        ))}
      </div>

      {/* Right */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginLeft:16, flexShrink:0 }}>
        <LiveDot />
        <span style={{
          fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.1em',
          textTransform:'uppercase', color:planColor,
          border:`1px solid ${planColor}40`,
          padding:'3px 10px', borderRadius:4,
        }}>{plan}</span>
        {session && (
          <div onClick={() => signOut()} title="Sign out" style={{
            width:30, height:30, borderRadius:'50%',
            background:'var(--surface2)', border:'1px solid var(--border2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font)', fontSize:13, fontWeight:600,
            color:'var(--text)', cursor:'pointer',
          }}>
            {(session.user?.name || session.user?.email || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
    </nav>
  );
}
