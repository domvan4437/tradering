
'use client';
import React, { useState } from 'react';

// ── UI Thumbnail previews — adapt to current theme via CSS vars
function UiThumb({ children, label }) {
  return (
    <div style={{
      background: 'var(--surface2)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 14px',
      height: 80,
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
    }}>
      {label && (
        <div style={{
          position: 'absolute', top: 7, right: 10,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          color: 'var(--accent)', letterSpacing: '0.1em',
          textTransform: 'uppercase', opacity: 0.7,
        }}>{label}</div>
      )}
      {children}
      {/* Fade out bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 24,
        background: 'linear-gradient(transparent, var(--surface2))',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// Mini table row
function ThumbRow({ sym, val, up, wide }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '3px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: wide ? 52 : 36, height: 7, borderRadius: 2,
        background: 'var(--surface3)', flexShrink: 0,
      }} />
      <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
      <div style={{
        width: 28, height: 5, borderRadius: 2,
        background: up ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
        flexShrink: 0,
      }} />
    </div>
  );
}

// Mini bar chart
function ThumbBars({ vals }) {
  const max = Math.max(...vals.map(v => Math.abs(v)));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48, marginTop: 4 }}>
      {vals.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(Math.abs(v) / max) * 100}%`,
          borderRadius: '2px 2px 0 0',
          background: v >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
          border: `1px solid ${v >= 0 ? 'var(--green-border)' : 'var(--red-border)'}`,
        }} />
      ))}
    </div>
  );
}

// Mini sparkline
function ThumbSpark({ points, up }) {
  return (
    <svg width="100%" height="40" viewBox="0 0 120 40" preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <circle
        cx={points.split(' ').pop().split(',')[0]}
        cy={points.split(' ').pop().split(',')[1]}
        r="2.5"
        fill={up ? 'var(--green)' : 'var(--red)'}
      />
    </svg>
  );
}

// Mini leaderboard row
function ThumbRankRow({ rank, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, opacity: 0.5, flexShrink: 0 }} />
      <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
      <div style={{ width: 22, height: 5, borderRadius: 2, background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', flexShrink: 0 }} />
    </div>
  );
}

// Mini signal card
function ThumbSignal({ pct, up }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 30, height: 6, borderRadius: 2, background: 'var(--surface3)', flexShrink: 0 }} />
      <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface3)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: up ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
      </div>
      <div style={{
        width: 20, height: 14, borderRadius: 2, flexShrink: 0,
        background: up ? 'var(--green-bg)' : 'var(--red-bg)',
        border: `1px solid ${up ? 'var(--green-border)' : 'var(--red-border)'}`,
      }} />
    </div>
  );
}

// Mini card blocks for tools
function ThumbToolBlock({ accent }) {
  return (
    <div style={{
      background: 'var(--surface3)',
      border: '1px solid var(--border)',
      borderRadius: 4,
      padding: '5px 8px',
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ width: 40, height: 5, borderRadius: 2, background: accent || 'var(--accent-bg)', opacity: 0.6 }} />
      <div style={{ width: 56, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
      <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
    </div>
  );
}

// ── Shared landing card
function LandingCard({ title, description, icon, accent, onClick, wide, preview }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? (accent || 'var(--accent)') : 'var(--border)'}`,
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'all 0.18s',
        gridColumn: wide ? 'span 2' : 'span 1',
        overflow: 'hidden',
        boxShadow: hovered ? `0 0 20px ${accent || 'rgba(0,212,255,0.1)'}` : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Hover top glow */}
      <div style={{
        height: 1,
        background: `linear-gradient(90deg, transparent, ${accent || 'var(--accent)'}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.18s',
        flexShrink: 0,
      }} />

      {/* UI Thumbnail preview */}
      {preview && (
        <div style={{ flexShrink: 0 }}>
          {preview}
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 700,
            color: hovered ? (accent || 'var(--accent)') : 'var(--text)',
            marginBottom: 6, letterSpacing: '-0.2px',
            transition: 'color 0.18s',
          }}>{title}</div>
          <div style={{
            fontFamily: 'var(--font)', fontSize: 12,
            color: 'var(--text-muted)', lineHeight: 1.6,
          }}>{description}</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: hovered ? (accent || 'var(--accent)') : 'var(--text-dim)',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          marginTop: 12, transition: 'color 0.18s',
        }}>Open →</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// MARKETS LANDING
// ─────────────────────────────────────────────────────
export function MarketsLanding({ onSelect }) {
  const cards = [
    {
      title: 'Commodities',
      description: 'Screen metals, energy, and grains. COT data, seasonal tendencies, AI analysis.',
      accent: 'var(--green)',
      tab: 'Commodities',
      preview: (
        <UiThumb label="screener">
          <ThumbRow sym="GC" up={true} />
          <ThumbRow sym="CL" up={false} />
          <ThumbRow sym="NG" up={true} />
          <ThumbRow sym="ZW" up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Futures',
      description: 'Financial, equity index, rates, and FX futures. Live prices across all major CME and CBOT contracts.',
      accent: '#0891b2',
      tab: 'Futures',
      preview: (
        <UiThumb label="futures">
          <ThumbRow sym="ES" up={true} wide />
          <ThumbRow sym="NQ" up={true} wide />
          <ThumbRow sym="ZB" up={false} wide />
          <ThumbRow sym="GC" up={true} wide />
        </UiThumb>
      ),
    },
    {
      title: 'Forex',
      description: 'Currency pair analysis with COT positioning, key levels, and economic calendar.',
      accent: 'var(--accent)',
      tab: 'Forex',
      preview: (
        <UiThumb label="cot data">
          <ThumbSignal pct={82} up={true} />
          <ThumbSignal pct={61} up={false} />
          <ThumbSignal pct={74} up={true} />
          <ThumbSignal pct={38} up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Stocks',
      description: 'Sector rotation, earnings calendar, and key price levels across major indices.',
      accent: '#a78bfa',
      tab: 'Stocks',
      preview: (
        <UiThumb label="sectors">
          <ThumbBars vals={[3.2, -1.4, 2.8, -0.6, 4.1, -2.2, 1.9]} />
        </UiThumb>
      ),
    },
    {
      title: 'Crypto',
      description: 'Live prices for 50 top digital assets. Filter by category, sort by performance.',
      accent: '#f59e0b',
      tab: 'Crypto',
      preview: (
        <UiThumb label="live prices">
          <ThumbRow sym="BTC" up={true} wide />
          <ThumbRow sym="ETH" up={true} wide />
          <ThumbRow sym="SOL" up={false} wide />
          <ThumbRow sym="BNB" up={true} wide />
        </UiThumb>
      ),
    },
    {
      title: 'Charts',
      description: 'Full TradingView charting workspace for technical analysis across all markets.',
      accent: 'var(--accent)',
      tab: 'Charts',
      wide: true,
      preview: (
        <UiThumb label="chart workspace">
          <ThumbSpark points="0,32 15,28 30,30 45,22 60,18 75,20 90,12 105,8 120,10" up={true} />
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Markets</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Where do you want<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>to trade today?</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          Select a market to access screening, COT data, seasonal analysis, and live prices.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {cards.map(c => (
          <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '14px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', gap: 32 }}>
        {[
          { label: 'Markets covered', value: '50+' },
          { label: 'COT reports', value: 'Weekly' },
          { label: 'Seasonal data', value: '15yr avg' },
          { label: 'AI stages', value: '9 stages' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// COMMUNITY LANDING
// ─────────────────────────────────────────────────────
export function CommunityLanding({ onSelect }) {
  const cards = [
    {
      title: 'Feed',
      description: 'See what traders in your network are posting and trading right now.',
      accent: 'var(--accent)',
      tab: 'Feed',
      preview: (
        <UiThumb label="social feed">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ width: `${[60,80,50][i-1]}px`, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
                <div style={{ width: `${[90,70,100][i-1]}px`, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
              </div>
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Groups',
      description: 'Join trading communities built around specific styles and markets.',
      accent: 'var(--green)',
      tab: 'Groups',
      preview: (
        <UiThumb label="groups">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 24, height: 14, borderRadius: 3, background: 'var(--green-bg)', border: '1px solid var(--green-border)', flexShrink: 0 }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Compete',
      description: 'Enter style-matched trading competitions and prove your edge against real traders.',
      accent: 'var(--gold)',
      tab: 'Compete',
      wide: true,
      preview: (
        <UiThumb label="leaderboard">
          <ThumbRankRow rank={1} color="var(--gold)" />
          <ThumbRankRow rank={2} color="var(--accent)" />
          <ThumbRankRow rank={3} color="var(--text-muted)" />
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Community</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Trade with others.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>Compete. Learn. Win.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          The only platform where your performance is public, verifiable, and ranked.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map(c => <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// TOOLS LANDING
// ─────────────────────────────────────────────────────
export function ToolsLanding({ onSelect }) {
  const cards = [
    {
      title: 'Trade Calculator',
      description: 'Position sizing, risk/reward, and P&L calculation for any market.',
      accent: 'var(--accent)', tab: 'Trade Calc',
      preview: (
        <UiThumb label="calculator">
          {['Entry', 'Stop', 'Target', 'Size'].map((l, i) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 30, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 40, height: 7, borderRadius: 3, background: 'var(--surface2)', border: '1px solid var(--border2)' }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'AI Coach',
      description: 'Personalized coaching based on your trade history and journal entries.',
      accent: 'var(--green)', tab: 'AI Coach',
      preview: (
        <UiThumb label="ai coach">
          {[1,2].map(i => (
            <div key={i} style={{ display: 'flex', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === 1 ? 'var(--accent-bg)' : 'var(--surface3)', border: `1px solid ${i === 1 ? 'var(--accent-border)' : 'var(--border)'}`, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'var(--surface3)' }} />
                <div style={{ width: '60%', height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
              </div>
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Trade Plan Builder',
      description: 'Build a complete structured trade plan before you press the button.',
      accent: 'var(--accent)', tab: 'Trade Plan Builder',
      preview: (
        <UiThumb label="trade plan">
          <ThumbRow sym="Entry" up={true} />
          <ThumbRow sym="Stop" up={false} />
          <ThumbRow sym="Target" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'COT Alerts',
      description: 'Get notified when COT positioning reaches your defined thresholds.',
      accent: 'var(--gold)', tab: 'COT Alerts',
      preview: (
        <UiThumb label="alerts">
          <ThumbSignal pct={88} up={true} />
          <ThumbSignal pct={72} up={true} />
          <ThumbSignal pct={45} up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Backtesting',
      description: 'Analyze historical performance of your screener signals.',
      accent: 'var(--accent)', tab: 'Backtesting',
      preview: (
        <UiThumb label="backtest">
          <ThumbBars vals={[2.1, 3.4, -1.2, 4.2, 2.8, -0.8, 5.1]} />
        </UiThumb>
      ),
    },
    {
      title: 'Strategy Backtest',
      description: 'Full strategy backtesting with custom entry/exit rules.',
      accent: '#a78bfa', tab: 'Strategy Backtest',
      preview: (
        <UiThumb label="strategy">
          <ThumbSpark points="0,30 20,26 40,20 60,22 80,14 100,10 120,12" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'Weekly Review',
      description: 'Structured weekly performance review every trading week.',
      accent: 'var(--green)', tab: 'Weekly Review',
      preview: (
        <UiThumb label="review">
          {['Mon','Tue','Wed','Thu','Fri'].map((d, i) => (
            <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 20, height: 5, borderRadius: 2, background: 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'var(--surface2)', overflow: 'hidden' }}>
                <div style={{ width: `${[60,80,40,90,70][i]}%`, height: '100%', background: [1,1,0,1,1][i] ? 'var(--green)' : 'var(--red)', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Notes',
      description: 'Quick notes tied to markets or dates. Research and observations.',
      accent: 'var(--accent)', tab: 'Notes',
      preview: (
        <UiThumb label="notes">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: `${[70,90,55][i-1]}px`, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: `${[100,80,120][i-1]}px`, height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Creator Studio',
      description: 'Publish groups, create courses, host tournaments. Trader plan.',
      accent: 'var(--gold)', tab: 'Creator Studio',
      preview: (
        <UiThumb label="creator">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 4 }}>
            <ThumbToolBlock accent="var(--gold-bg)" />
            <ThumbToolBlock accent="var(--accent-bg)" />
          </div>
        </UiThumb>
      ),
    },
    {
      title: 'Broker',
      description: 'Connect your brokerage to sync real trades automatically.',
      accent: 'var(--accent)', tab: 'Broker',
      preview: (
        <UiThumb label="broker sync">
          {['Tradovate','Alpaca','IBKR'].map((b, i) => (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: i === 0 ? 'var(--green)' : 'var(--surface3)', flexShrink: 0 }} />
              <div style={{ flex: 1, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 28, height: 12, borderRadius: 3, background: i === 0 ? 'var(--green-bg)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'var(--green-border)' : 'var(--border2)'}`, flexShrink: 0 }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'My Profile',
      description: 'Set your visibility, earn your verified badge, and apply to prop firms with your track record.',
      accent: 'var(--accent)', tab: 'My Profile',
      preview: (
        <UiThumb label="profile">
          {['Private','Invite Only','Public'].map((v, i) => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 52, height: 5, borderRadius: 2, background: i === 2 ? 'var(--accent-bg)' : 'var(--surface3)', border: i === 2 ? '1px solid var(--accent-border)' : 'none' }} />
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: i === 2 ? 'var(--accent-bg)' : 'var(--surface3)', border: `1px solid ${i === 2 ? 'var(--accent-border)' : 'var(--border2)'}` }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Settings',
      description: 'Theme, notifications, display preferences, and account management.',
      accent: 'var(--text-muted)', tab: 'Settings',
      preview: (
        <UiThumb label="settings">
          {['Theme','Notifications','Account','Display'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: `${[40,70,48,52][i]}px`, height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
              <div style={{ width: 24, height: 12, borderRadius: 6, background: i === 0 ? 'var(--accent-bg)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'var(--accent-border)' : 'var(--border2)'}` }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>Tools</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Your trading cockpit.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>Everything in one place.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          Plan trades, review performance, set alerts, and connect your broker.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cards.map(c => <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// NEWS LANDING
// ─────────────────────────────────────────────────────
export function NewsLanding({ onSelect }) {
  const cards = [
    {
      title: 'All Markets',
      description: 'Every major market-moving headline in one feed with AI sentiment scoring.',
      accent: 'var(--accent)', tab: 'All Markets', wide: true,
      preview: (
        <UiThumb label="news feed">
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ width: '85%', height: 5, borderRadius: 2, background: 'var(--surface3)' }} />
                <div style={{ width: '65%', height: 4, borderRadius: 2, background: 'var(--surface2)' }} />
              </div>
              <div style={{ width: 22, height: 14, borderRadius: 3, background: [1,0,1][i-1] ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${[1,0,1][i-1] ? 'var(--green-border)' : 'var(--red-border)'}`, flexShrink: 0 }} />
            </div>
          ))}
        </UiThumb>
      ),
    },
    {
      title: 'Forex',
      description: 'Central bank decisions and currency-specific news with sentiment.',
      accent: 'var(--accent)', tab: 'Forex',
      preview: (
        <UiThumb label="forex news">
          <ThumbSignal pct={75} up={false} />
          <ThumbSignal pct={60} up={true} />
          <ThumbSignal pct={85} up={false} />
        </UiThumb>
      ),
    },
    {
      title: 'Commodities',
      description: 'Supply, weather, geopolitical shifts, and inventory data.',
      accent: 'var(--green)', tab: 'Commodities',
      preview: (
        <UiThumb label="commodities news">
          <ThumbRow sym="GC" up={true} />
          <ThumbRow sym="CL" up={false} />
          <ThumbRow sym="NG" up={true} />
        </UiThumb>
      ),
    },
    {
      title: 'Stocks',
      description: 'Earnings, analyst ratings, and sector-moving events.',
      accent: '#a78bfa', tab: 'Stocks',
      preview: (
        <UiThumb label="stocks news">
          <ThumbBars vals={[2.4, -1.1, 3.2, -0.8, 1.9]} />
        </UiThumb>
      ),
    },
    {
      title: 'Crypto',
      description: 'On-chain data, regulatory updates, and digital asset news.',
      accent: '#f59e0b', tab: 'Crypto',
      preview: (
        <UiThumb label="crypto news">
          <ThumbSpark points="0,28 20,22 40,18 60,24 80,14 100,10 120,16" up={true} />
        </UiThumb>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font)', fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>News</div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.15, marginBottom: 10 }}>
          Market intelligence.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px var(--border3)' }}>Signal over noise.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 460 }}>
          Market-moving news filtered by asset class with AI sentiment on every headline.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map(c => <LandingCard key={c.tab} {...c} onClick={() => onSelect(c.tab)} />)}
      </div>
    </div>
  );
}
