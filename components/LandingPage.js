'use client'
import Link from 'next/link'

const C = { bg: '#0a0a0a', surface: '#0d0d0d', border: '#1a1a1a', border2: '#222', gold: '#c8a84b', text: '#e8e0d0', muted: '#555', green: '#4caf82', greenBorder: '#1a3d2a', font: "'Courier New', monospace" }

const FEATURES = [
  { title: '9-Stage Screening', desc: 'Seasonal → macro → COT → open interest. Every stage backed by live data. Stops at first failure — no false signals.' },
  { title: 'Live CFTC COT Data', desc: 'Real commercial long/short positions from the CFTC public API every week. COT Index shows where positioning sits in a 3-year range (0–100).' },
  { title: 'Seasonal Analysis', desc: '15 years of monthly return history. Actual win rates per month, not opinions. Know exactly which months have an edge.' },
  { title: 'Watchlist Scanner', desc: 'Screen 20 commodities at once. Ranked by signal strength. Know every Friday which setups are lining up.' },
  { title: 'Weekly Email Alerts', desc: 'Every Friday after CFTC data releases, get your watchlist screened and emailed to you. Never miss a setup.' },
  { title: 'Trade Journal', desc: 'Log every screening. Track WIN/LOSS. See your actual win rate over time. Export to CSV.' },
]

const COMMODITIES = ['Gold','Silver','Crude Oil','Natural Gas','Corn','Wheat','Soybeans','Coffee','Sugar','Cotton','Cocoa','Live Cattle','Copper','Platinum']

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.font }}>
      {/* Nav */}
      <nav style={{ borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, background: C.surface, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ width: 10, height: 10, background: C.gold, transform: 'rotate(45deg)', flexShrink: 0 }} />
        <span style={{ fontSize: 11, letterSpacing: 4, color: C.gold }}>COMMODITY INTELLIGENCE SYSTEM</span>
        <div style={{ flex: 1 }} />
        <Link href="/pricing" style={{ fontSize: 11, color: C.muted, textDecoration: 'none', letterSpacing: 2 }}>PRICING</Link>
        <Link href="/login" style={{ fontSize: 11, color: C.muted, textDecoration: 'none', letterSpacing: 2, marginLeft: 24 }}>SIGN IN</Link>
        <Link href="/signup" style={{ background: C.gold, color: '#0a0a0a', fontSize: 11, letterSpacing: 2, padding: '8px 20px', textDecoration: 'none', marginLeft: 8 }}>START FREE</Link>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
          {['CFTC COT Data','Yahoo Finance Prices','15yr Seasonal','Real-time USDX'].map(s => (
            <span key={s} style={{ fontSize: 10, color: C.green, border: `1px solid ${C.greenBorder}`, padding: '4px 12px', letterSpacing: 1 }}>⬤ {s}</span>
          ))}
        </div>

        <h1 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 400, letterSpacing: '-2px', lineHeight: 1.05, margin: '0 0 24px' }}>
          The only commodity<br />screener built on<br /><span style={{ color: C.gold }}>your framework.</span>
        </h1>
        <p style={{ fontSize: 18, color: C.muted, maxWidth: 520, lineHeight: 1.7, margin: '0 0 48px' }}>
          9-stage analysis powered by live CFTC data, 15 years of seasonal history, and real-time market feeds. Not opinions — actual numbers.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ background: C.gold, color: '#0a0a0a', padding: '16px 40px', fontSize: 12, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
            Start Free — 14 Days →
          </Link>
          <Link href="/pricing" style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border2}`, padding: '16px 32px', fontSize: 12, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
            See Pricing
          </Link>
        </div>
        <p style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>No credit card required. Free forever for 3 screenings/day.</p>
      </div>

      {/* How it works */}
      <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '80px 24px', background: C.surface }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontSize: 11, letterSpacing: 4, color: C.muted, marginBottom: 48, textTransform: 'uppercase' }}>The 9-Stage Framework</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2 }}>
            {['Seasonal Tendency','Major Market Analysis','Commodity Trending','Intermarket Analysis','COT Hedging Program','Correlation Analysis','Commodity Filter','Open Interest Filter','Top-Down Confirmation'].map((s, i) => (
              <div key={s} style={{ padding: '16px 20px', background: C.bg, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 6, letterSpacing: 2 }}>STAGE {i + 1}</span>
                <span style={{ fontSize: 13, color: C.text }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: C.muted, marginBottom: 48, textTransform: 'uppercase' }}>What's Included</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ borderTop: `1px solid ${C.border2}`, paddingTop: 20 }}>
              <p style={{ fontSize: 15, color: C.gold, margin: '0 0 12px', fontWeight: 400 }}>{f.title}</p>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Commodities ticker */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '32px 24px', background: C.surface, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {COMMODITIES.map(c => (
            <span key={c} style={{ fontSize: 11, color: C.muted, letterSpacing: 2, whiteSpace: 'nowrap' }}>{c}</span>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 40, fontWeight: 400, margin: '0 0 16px' }}>Ready to screen smarter?</h2>
        <p style={{ color: C.muted, fontSize: 15, margin: '0 0 40px' }}>Start your 14-day free trial. No credit card needed.</p>
        <Link href="/signup" style={{ background: C.gold, color: '#0a0a0a', padding: '18px 48px', fontSize: 12, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
          Start Free Trial →
        </Link>
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <span style={{ fontSize: 10, color: C.muted, letterSpacing: 2 }}>COMMODITY INTELLIGENCE SYSTEM</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/pricing" style={{ fontSize: 11, color: C.muted, textDecoration: 'none' }}>Pricing</Link>
          <Link href="/login" style={{ fontSize: 11, color: C.muted, textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  )
}
