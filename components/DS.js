
/**
 * TradeRing Design System — Option A
 * DM Sans (body/display) + IBM Plex Mono (numbers/labels)
 */

export const C = {
  bg:       'var(--bg)',
  bg1:      'var(--bg1)',
  surface:  'var(--surface)',
  surface2: 'var(--surface2)',
  surface3: 'var(--surface3)',
  border:   'var(--border)',
  border2:  'var(--border2)',
  accent:   'var(--accent)',
  text:     'var(--text)',
  textSec:  'var(--text-secondary)',
  muted:    'var(--text-muted)',
  dim:      'var(--text-dim)',
  green:    'var(--green)',
  red:      'var(--red)',
  gold:     'var(--accent)',
  mono:     'var(--font-mono)',
  display:  'var(--font-display)',
  font:     'var(--font)',
};

export function Panel({ children, style, className = '' }) {
  return <div className={`tr-panel ${className}`} style={style}>{children}</div>;
}

export function PanelHeader({ title, action, onAction, children }) {
  return (
    <div className="tr-panel-header">
      <span className="tr-panel-title">{title}</span>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {children}
        {action && <button className="tr-panel-action" onClick={onAction}>{action}</button>}
      </div>
    </div>
  );
}

export function SectionTitle({ children, style }) {
  return <div className="tr-section-title" style={style}>{children}</div>;
}

export function StatCard({ label, value, delta, deltaUp, sparkPoints, style }) {
  return (
    <div className="tr-stat-card tr-fade-up" style={style}>
      <div className="tr-stat-label">{label}</div>
      <div className="tr-stat-value">{value}</div>
      {delta && (
        <div className={`tr-stat-delta ${deltaUp ? 'tr-up' : 'tr-down'}`}>
          {deltaUp ? '↑' : '↓'} {delta}
        </div>
      )}
      {sparkPoints && (
        <svg style={{ position:'absolute', bottom:0, right:0, width:80, height:40, opacity:0.18 }} viewBox="0 0 80 40">
          <polyline points={sparkPoints} fill="none"
            stroke={deltaUp ? 'var(--green)' : 'var(--red)'} strokeWidth="1.5" />
        </svg>
      )}
    </div>
  );
}

export function Badge({ type = 'neutral', children }) {
  const map = {
    buy:'tr-badge tr-badge-buy', sell:'tr-badge tr-badge-sell',
    watch:'tr-badge tr-badge-watch', neutral:'tr-badge tr-badge-neutral',
    up:'tr-badge tr-badge-up', down:'tr-badge tr-badge-down',
    high:'tr-badge tr-badge-high', gold:'tr-badge tr-badge-gold',
  };
  return <span className={map[type] || map.neutral}>{children}</span>;
}

export function SignalBar({ value, type = 'bull' }) {
  const fill = type === 'bull' ? 'tr-signal-fill-bull' : type === 'bear' ? 'tr-signal-fill-bear' : 'tr-signal-fill-neut';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div className="tr-signal-track">
        <div className={fill} style={{ width:`${value}%` }} />
      </div>
      <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-muted)', width:34, textAlign:'right' }}>
        {value}%
      </span>
    </div>
  );
}

export function Sparkline({ points, color = 'var(--accent)', height = 40 }) {
  return (
    <svg width="100%" height={height} viewBox={`0 0 280 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function Btn({ children, onClick, disabled, ghost, style, className = '' }) {
  return (
    <button onClick={onClick} disabled={disabled} style={style}
      className={`${ghost ? 'tr-btn-ghost' : 'tr-btn-primary'} ${className}`}>
      {children}
    </button>
  );
}

export function LiveDot() {
  return <span className="tr-live-dot" />;
}

export function Tabs({ tabs, active, onSelect }) {
  return (
    <div className="tr-tabs">
      {tabs.map(t => (
        <button key={t} className={`tr-tab ${active === t ? 'active' : ''}`}
          onClick={() => onSelect(t)}>{t}</button>
      ))}
    </div>
  );
}

export function EmptyState({ icon = '◎', title, subtitle }) {
  return (
    <div style={{ textAlign:'center', padding:'52px 24px' }}>
      <div style={{ fontSize:26, marginBottom:12, opacity:0.2 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font)', fontSize:15, fontWeight:600,
        color:'var(--text)', marginBottom:5, letterSpacing:'-0.2px' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize:12, color:'var(--text-muted)',
          fontFamily:'var(--font-mono)', letterSpacing:'0.08em' }}>{subtitle}</div>
      )}
    </div>
  );
}

export function Num({ value, prefix = '', suffix = '', decimals = 2 }) {
  const num = parseFloat(value);
  const color = num > 0 ? 'var(--green)' : num < 0 ? 'var(--red)' : 'var(--text-muted)';
  const sign = num > 0 ? '+' : '';
  return (
    <span style={{ fontFamily:'var(--font-mono)', color, fontWeight:500 }}>
      {prefix}{sign}{isNaN(num) ? value : num.toFixed(decimals)}{suffix}
    </span>
  );
}
