'use client'
import { useState, useEffect, useRef } from 'react'
import { FONT } from '../lib/design'

export const C = {
  bg: '#0a0a0a', surface: '#0d0d0d', surfaceHover: '#111',
  border: '#1a1a1a', border2: '#222', border3: '#2a2a2a',
  gold: '#c8a84b', text: '#e8e0d0', muted: '#666', dim: '#3a3a3a',
  green: '#4caf82', greenBg: '#080d09', greenBorder: '#1a3d2a',
  red: '#e05a4e', redBg: '#0d0808', redBorder: '#3d1a1a',
  blue: '#4fc3f7', purple: '#ce93d8',
  font: FONT,
}

// ── Typography ────────────────────────────────────────────────────────────────
export function Label({ children, style }) {
  return (
    <p style={{
      fontSize: 10, letterSpacing: 3, color: C.muted,
      margin: '0 0 8px', textTransform: 'uppercase',
      fontFamily: C.font, ...style,
    }}>
      {children}
    </p>
  )
}

export function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{
        fontSize: 'clamp(22px,4vw,32px)', fontWeight: 300,
        margin: 0, color: C.text, letterSpacing: '-0.5px',
      }}>
        {children}
      </h2>
      {sub && <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 0' }}>{sub}</p>}
    </div>
  )
}

// ── Containers ────────────────────────────────────────────────────────────────
export function Card({ children, style, hover, onClick }) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        background: isHovered ? C.surfaceHover : C.surface,
        border: `1px solid ${C.border2}`,
        padding: '18px 22px',
        transition: 'background 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Panel({ children, style }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border2}`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
export function Badge({ children, color, bg, style }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: 1.5, padding: '3px 9px',
      background: bg || color || C.border2,
      color: bg ? (color || '#0a0a0a') : (color || C.muted),
      border: bg ? 'none' : `1px solid ${color || C.border2}`,
      fontFamily: C.font, textTransform: 'uppercase',
      display: 'inline-block', ...style,
    }}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pass:    { label: 'PASS',    bg: C.gold,     color: '#0a0a0a' },
    fail:    { label: 'FAIL',    bg: '#8b2020',  color: '#fff' },
    win:     { label: 'WIN',     bg: C.green,    color: '#0a0a0a' },
    loss:    { label: 'LOSS',    bg: C.red,      color: '#fff' },
    pending: { label: 'PENDING', bg: C.border2,  color: C.muted },
    buy:     { label: 'BUY',     bg: 'none',     color: C.green, border: C.greenBorder },
    sell:    { label: 'SELL',    bg: 'none',     color: C.red,   border: C.redBorder },
  }
  const s = map[status?.toLowerCase()] || { label: status, bg: C.border2, color: C.muted }
  return <Badge bg={s.bg !== 'none' ? s.bg : undefined} color={s.color} style={s.border ? { border: `1px solid ${s.border}` } : {}}>{s.label}</Badge>
}

// ── Buttons ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, style, type }) {
  const sizes = { sm: '5px 12px', md: '10px 24px', lg: '14px 36px' }
  const variants = {
    primary:  { bg: C.gold,     color: '#0a0a0a', border: 'none' },
    ghost:    { bg: 'transparent', color: C.muted, border: `1px solid ${C.border2}` },
    danger:   { bg: 'transparent', color: C.red,   border: `1px solid ${C.redBorder}` },
    success:  { bg: C.green,    color: '#0a0a0a', border: 'none' },
    blue:     { bg: C.blue,     color: '#0a0a0a', border: 'none' },
  }
  const v = variants[variant] || variants.primary
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#1a1a1a' : v.bg,
        color: disabled ? C.dim : v.color,
        border: disabled ? `1px solid ${C.border2}` : v.border,
        padding: sizes[size],
        fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: C.font, transition: 'all 0.15s',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// ── Inputs ────────────────────────────────────────────────────────────────────
export function Input({ value, onChange, onKeyDown, placeholder, type, list, style, autoFocus }) {
  return (
    <input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      type={type}
      list={list}
      autoFocus={autoFocus}
      style={{
        width: '100%', background: C.bg,
        border: `1px solid ${C.border2}`,
        padding: '10px 14px', fontSize: 14,
        color: C.text, outline: 'none',
        fontFamily: C.font, boxSizing: 'border-box',
        transition: 'border-color 0.15s',
        ...style,
      }}
    />
  )
}

export function Textarea({ value, onChange, placeholder, rows, style }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows || 4}
      style={{
        width: '100%', background: C.bg,
        border: `1px solid ${C.border2}`,
        padding: '10px 14px', fontSize: 13,
        color: C.text, outline: 'none',
        fontFamily: C.font, boxSizing: 'border-box',
        resize: 'vertical', lineHeight: 1.7,
        ...style,
      }}
    />
  )
}

// ── Select ────────────────────────────────────────────────────────────────────
export function Select({ value, onChange, options, style }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%', background: C.surface,
        border: `1px solid ${C.border2}`,
        padding: '10px 14px', fontSize: 13,
        color: C.text, outline: 'none',
        fontFamily: C.font, cursor: 'pointer',
        ...style,
      }}
    >
      {options.map(opt => (
        typeof opt === 'string'
          ? <option key={opt} value={opt}>{opt}</option>
          : <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

// ── Data display ──────────────────────────────────────────────────────────────
export function DataBlock({ label, value, sub1, sub2, color1, small }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: 2, color: C.muted, margin: '0 0 5px', textTransform: 'uppercase', fontFamily: C.font }}>
        {label}
      </p>
      <p style={{ fontSize: small ? 13 : 18, color: color1 || C.text, margin: '0 0 3px', fontWeight: 300, lineHeight: 1.2, fontFamily: C.font }}>
        {value}
      </p>
      {sub1 && <p style={{ fontSize: 11, color: C.muted, margin: '2px 0', fontFamily: C.font }}>{sub1}</p>}
      {sub2 && <p style={{ fontSize: 11, color: C.dim, margin: '2px 0', fontFamily: C.font }}>{sub2}</p>}
    </div>
  )
}

export function ChangeTag({ value, suffix = '%' }) {
  const n = parseFloat(value)
  if (isNaN(n)) return null
  return (
    <span style={{ fontSize: 11, color: n > 0 ? C.green : n < 0 ? C.red : C.muted, fontFamily: C.font }}>
      {n > 0 ? '+' : ''}{value}{suffix}
    </span>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, height = 2 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div style={{ height, background: C.border2, borderRadius: height }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color || C.gold, borderRadius: height, transition: 'width 0.4s ease' }} />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, title, width = 480 }) {
  useEffect(() => {
    const handleKey = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.surface, border: `1px solid ${C.border2}`,
          padding: 28, width: '100%', maxWidth: width,
          maxHeight: '90vh', overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 15, color: C.text, margin: 0, fontFamily: C.font }}>{title}</p>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            background: active === tab ? (accent || C.gold) : 'transparent',
            color: active === tab ? '#0a0a0a' : C.muted,
            border: 'none', padding: '6px 13px',
            fontSize: 10, letterSpacing: 2, cursor: 'pointer',
            fontFamily: C.font, textTransform: 'uppercase',
            transition: 'all 0.15s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function EmptyState({ title, body, action, onAction }) {
  return (
    <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ width: 32, height: 32, background: C.border2, transform: 'rotate(45deg)', margin: '0 auto 16px' }} />
      <p style={{ fontSize: 15, color: C.text, margin: '0 0 8px', fontFamily: C.font }}>{title}</p>
      {body && <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>{body}</p>}
      {action && <Btn onClick={onAction}>{action}</Btn>}
    </Card>
  )
}

// ── Loading spinner ───────────────────────────────────────────────────────────
export function Spinner({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, background: C.gold, borderRadius: '50%',
            animation: `cispin 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>{label || 'Loading...'}</span>
      <style>{`@keyframes cispin { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </div>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
export function Sparkline({ data, color, height = 40, width = 80 }) {
  if (!data?.length || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ')
  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color || C.green} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ style }) {
  return <div style={{ height: 1, background: C.border, margin: '20px 0', ...style }} />
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, background: checked ? C.gold : C.border2,
          borderRadius: 10, position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 19 : 3,
          width: 14, height: 14, background: checked ? '#0a0a0a' : C.muted,
          borderRadius: '50%', transition: 'left 0.2s',
        }} />
      </div>
      {label && <span style={{ fontSize: 12, color: C.muted, fontFamily: C.font }}>{label}</span>}
    </label>
  )
}

// ── Close position modal ──────────────────────────────────────────────────────
export function ClosePositionModal({ position, onClose, onConfirm }) {
  const [exitPrice, setExitPrice] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    const price = parseFloat(exitPrice)
    if (isNaN(price) || price <= 0) { setError('Enter a valid exit price'); return }
    onConfirm(position.id, price)
    onClose()
  }

  const diff = exitPrice ? parseFloat(exitPrice) - position.entryPrice : 0
  const pnl = diff * (position.direction === 'LONG' ? 1 : -1) * position.contracts * position.contractSize

  return (
    <Modal onClose={onClose} title={`Close ${position.name || position.symbol}`} width={380}>
      <div style={{ marginBottom: 16 }}>
        <Label>ENTRY PRICE</Label>
        <p style={{ fontSize: 18, color: C.text, margin: 0, fontFamily: C.font }}>{position.entryPrice}</p>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Label>EXIT PRICE</Label>
        <Input
          value={exitPrice}
          onChange={e => { setExitPrice(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          placeholder="Enter exit price..."
          type="number"
          autoFocus
        />
        {error && <p style={{ fontSize: 11, color: C.red, margin: '6px 0 0', fontFamily: C.font }}>{error}</p>}
      </div>
      {exitPrice && !isNaN(pnl) && (
        <div style={{
          background: pnl >= 0 ? C.greenBg : C.redBg,
          border: `1px solid ${pnl >= 0 ? C.greenBorder : C.redBorder}`,
          padding: '12px 16px', marginBottom: 16,
        }}>
          <Label>ESTIMATED P&L</Label>
          <p style={{ fontSize: 22, color: pnl >= 0 ? C.green : C.red, margin: 0, fontFamily: C.font, fontWeight: 300 }}>
            {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
          </p>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={handleConfirm} style={{ flex: 1 }}>Close Position</Btn>
        <Btn onClick={onClose} variant="ghost">Cancel</Btn>
      </div>
    </Modal>
  )
}

// ── Direction selector ────────────────────────────────────────────────────────
export function DirectionPicker({ value, onChange, options }) {
  const opts = options || ['BUY', 'SELL']
  const colors = { BUY: C.green, SELL: C.red, LONG: C.green, SHORT: C.red, WATCHING: C.gold, SUPPORT: C.green, RESISTANCE: C.red, PIVOT: C.blue }
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {opts.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            flex: 1, background: value === opt ? (colors[opt] || C.gold) : C.border2,
            color: value === opt ? '#0a0a0a' : C.muted,
            border: 'none', padding: '9px 8px',
            fontSize: 10, letterSpacing: 1.5, cursor: 'pointer',
            fontFamily: C.font, transition: 'all 0.15s',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
