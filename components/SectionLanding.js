'use client';
import React, { useState } from 'react';

// Shared card component
function LandingCard({ title, description, icon, accent, onClick, wide, tall }) {
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
        padding: '24px 26px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        gridColumn: wide ? 'span 2' : 'span 1',
        gridRow: tall ? 'span 2' : 'span 1',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: hovered ? `0 0 24px ${accent || 'rgba(0,212,255,0.12)'}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 120,
      }}
    >
      {/* Glow top edge on hover */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent || 'var(--accent)'}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.18s',
      }} />

      {/* Background icon watermark */}
      <div style={{
        position: 'absolute', right: 20, bottom: 16,
        fontSize: 52, opacity: hovered ? 0.1 : 0.05,
        transition: 'opacity 0.18s',
        userSelect: 'none', pointerEvents: 'none',
        lineHeight: 1,
      }}>{icon}</div>

      <div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 15,
          fontWeight: 700,
          color: hovered ? (accent || 'var(--accent)') : 'var(--text)',
          marginBottom: 8,
          letterSpacing: '-0.2px',
          transition: 'color 0.18s',
        }}>{title}</div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          maxWidth: 280,
        }}>{description}</div>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: hovered ? (accent || 'var(--accent)') : 'var(--text-dim)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        marginTop: 16,
        transition: 'color 0.18s',
      }}>Enter →</div>
    </div>
  );
}

// ── MARKETS LANDING — trading floor feel
export function MarketsLanding({ onSelect }) {
  const cards = [
    {
      title: 'Commodities',
      description: 'Screen metals, energy, and grains. COT data, seasonal tendencies, and AI analysis for futures traders.',
      icon: '⬡',
      accent: 'var(--green)',
      tab: 'Commodities',
    },
    {
      title: 'Forex',
      description: 'Currency pair analysis with COT positioning, key support and resistance levels, and economic calendar.',
      icon: '◈',
      accent: 'var(--accent)',
      tab: 'Forex',
    },
    {
      title: 'Stocks',
      description: 'Sector rotation, earnings calendar, and key price levels across major indices and equities.',
      icon: '△',
      accent: '#a78bfa',
      tab: 'Stocks',
    },
    {
      title: 'Crypto',
      description: 'Live prices for 50 top crypto assets. Filter by category, sort by price or performance, and track your watchlist.',
      icon: '◇',
      accent: '#f59e0b',
      tab: 'Crypto',
    },
    {
      title: 'Charts',
      description: 'Full TradingView charting workspace. Technical analysis across all markets in one place.',
      icon: '╱',
      accent: 'var(--accent)',
      tab: 'Charts',
      wide: true,
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 10,
        }}>Markets</div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Where do you want<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(240,244,248,0.22)' }}>to trade today?</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
          Select a market to access screening, COT data, seasonal analysis, and live price data.
        </div>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
      }}>
        {cards.map(c => (
          <LandingCard
            key={c.tab}
            title={c.title}
            description={c.description}
            icon={c.icon}
            accent={c.accent}
            wide={c.wide}
            tall={c.tall}
            onClick={() => onSelect(c.tab)}
          />
        ))}
      </div>

      {/* Bottom stat strip */}
      <div style={{
        marginTop: 28,
        padding: '14px 20px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        display: 'flex',
        gap: 32,
        alignItems: 'center',
      }}>
        {[
          { label: 'Markets covered', value: '50+' },
          { label: 'COT reports', value: 'Weekly' },
          { label: 'Seasonal data', value: '15yr avg' },
          { label: 'AI screening', value: '9 stages' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── COMMUNITY LANDING — social/competitive feel
export function CommunityLanding({ onSelect }) {
  const cards = [
    {
      title: 'Feed',
      description: 'See what traders in your network are posting, sharing, and trading right now. Follow the best, ignore the rest.',
      icon: '◉',
      accent: 'var(--accent)',
      tab: 'Feed',
    },
    {
      title: 'Groups',
      description: 'Join trading communities built around specific styles and markets. Take courses, share ideas, and learn from creators.',
      icon: '⬡',
      accent: 'var(--green)',
      tab: 'Groups',
    },
    {
      title: 'Compete',
      description: 'Enter style-matched trading competitions. Submit trade calls, track your rank, and prove your edge against real traders.',
      icon: '◈',
      accent: '#f59e0b',
      tab: 'Compete',
      wide: true,
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 10,
        }}>Community</div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Trade with others.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(240,244,248,0.22)' }}>Compete. Learn. Win.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
          The only trading platform where your performance is public, verifiable, and ranked.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map(c => (
          <LandingCard
            key={c.tab}
            title={c.title}
            description={c.description}
            icon={c.icon}
            accent={c.accent}
            wide={c.wide}
            onClick={() => onSelect(c.tab)}
          />
        ))}
      </div>
    </div>
  );
}

// ── TOOLS LANDING — cockpit feel
export function ToolsLanding({ onSelect }) {
  const cards = [
    {
      title: 'Trade Calculator',
      description: 'Position sizing, risk/reward, and P&L calculation for any market and account size.',
      icon: '◧',
      accent: 'var(--accent)',
      tab: 'Trade Calc',
    },
    {
      title: 'AI Coach',
      description: 'Personalized coaching based on your trade history, journal entries, and performance patterns.',
      icon: '◈',
      accent: 'var(--green)',
      tab: 'AI Coach',
    },
    {
      title: 'Trade Plan Builder',
      description: 'Build a complete structured trade plan — entry, stop, target, sizing, and invalidation — before you press the button.',
      icon: '⬡',
      accent: 'var(--accent)',
      tab: 'Trade Plan Builder',
    },
    {
      title: 'COT Alerts',
      description: 'Get notified when COT positioning reaches your defined extreme thresholds on any market.',
      icon: '◉',
      accent: '#f59e0b',
      tab: 'COT Alerts',
    },
    {
      title: 'Backtesting',
      description: 'Analyze the historical performance of your screener signals across your scanned markets.',
      icon: '△',
      accent: 'var(--accent)',
      tab: 'Backtesting',
    },
    {
      title: 'Strategy Backtest',
      description: 'Full strategy backtesting with custom entry/exit rules and performance reporting.',
      icon: '◇',
      accent: '#a78bfa',
      tab: 'Strategy Backtest',
    },
    {
      title: 'Weekly Review',
      description: "Structured weekly performance review. What worked, what didn't, and what to focus on next week.",
      icon: '╱',
      accent: 'var(--green)',
      tab: 'Weekly Review',
    },
    {
      title: 'Notes',
      description: 'Quick notes tied to markets or dates. Research, observations, and ideas in one place.',
      icon: '◧',
      accent: 'var(--accent)',
      tab: 'Notes',
    },
    {
      title: 'Creator Studio',
      description: 'Publish groups, create courses, post trade ideas, and host tournaments. Trader plan only.',
      icon: '◈',
      accent: '#f59e0b',
      tab: 'Creator Studio',
    },
    {
      title: 'Broker',
      description: 'Connect your brokerage account to sync real trades into your journal and competitions automatically.',
      icon: '⬡',
      accent: 'var(--accent)',
      tab: 'Broker',
    },
    {
      title: 'Settings',
      description: 'Theme, display preferences, notification settings, and account management.',
      icon: '◉',
      accent: 'var(--text-muted)',
      tab: 'Settings',
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 10,
        }}>Tools</div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Your trading cockpit.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(240,244,248,0.22)' }}>Everything in one place.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
          Plan trades, review performance, set alerts, and connect your broker — without leaving the platform.
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
      }}>
        {cards.map(c => (
          <LandingCard
            key={c.tab}
            title={c.title}
            description={c.description}
            icon={c.icon}
            accent={c.accent}
            onClick={() => onSelect(c.tab)}
          />
        ))}
      </div>
    </div>
  );
}

// ── NEWS LANDING — editorial feel
export function NewsLanding({ onSelect }) {
  const cards = [
    {
      title: 'All Markets',
      description: 'Every major market-moving headline in one feed. Filtered for relevance, not just volume.',
      icon: '◉',
      accent: 'var(--accent)',
      tab: 'All Markets',
      wide: true,
    },
    {
      title: 'Forex',
      description: 'Central bank decisions, macro releases, and currency-specific news with sentiment scoring.',
      icon: '◈',
      accent: 'var(--accent)',
      tab: 'Forex',
    },
    {
      title: 'Commodities',
      description: 'Supply/demand reports, weather events, geopolitical shifts, and inventory data for commodity traders.',
      icon: '⬡',
      accent: 'var(--green)',
      tab: 'Commodities',
    },
    {
      title: 'Stocks',
      description: 'Earnings, analyst upgrades/downgrades, sector rotation stories, and index-moving events.',
      icon: '△',
      accent: '#a78bfa',
      tab: 'Stocks',
    },
    {
      title: 'Crypto',
      description: 'On-chain data, regulatory updates, and digital asset market news.',
      icon: '◇',
      accent: '#f59e0b',
      tab: 'Crypto',
    },
  ];

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 10, fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'var(--accent)', marginBottom: 10,
        }}>News</div>
        <div style={{
          fontFamily: 'var(--font)',
          fontSize: 28, fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.4px', lineHeight: 1.1,
          marginBottom: 10,
        }}>
          Market intelligence.<br />
          <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(240,244,248,0.22)' }}>Signal over noise.</span>
        </div>
        <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-muted)', maxWidth: 480 }}>
          Market-moving news filtered by asset class with AI sentiment scoring on every headline.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {cards.map(c => (
          <LandingCard
            key={c.tab}
            title={c.title}
            description={c.description}
            icon={c.icon}
            accent={c.accent}
            wide={c.wide}
            onClick={() => onSelect(c.tab)}
          />
        ))}
      </div>
    </div>
  );
}
