'use client'
import Link from 'next/link'

export default function LandingPage() {
  const features = [
    { icon: 'ti-users', text: 'Connect with traders who share your edge' },
    { icon: 'ti-trophy', text: 'Compete head-to-head in live challenges' },
    { icon: 'ti-notebook', text: 'Journal trades and track your growth' },
    { icon: 'ti-chart-bar', text: 'COT data, seasonal signals, and screeners' },
    { icon: 'ti-robot', text: 'AI coaching that sharpens your edge' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Left panel */}
      <div style={{ width: '45%', background: 'linear-gradient(160deg,#4B44C8 0%,#3730a3 100%)', padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-trending-up" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TradeZar</span>
          </div>

          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>
            Trade smarter,<br />together.
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', marginBottom: 36, lineHeight: 1.6 }}>
            The all-in-one platform for serious traders — community, competition, and data in one place.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize: 14, color: '#fff' }} aria-hidden="true" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 48 }}>
          © 2026 TradeZar · <Link href="/pricing" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Pricing</Link> · <Link href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy</Link> · <Link href="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#fafaf9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 52px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Start for free</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 28 }}>Join thousands of traders already on TradeZar.</div>

          <Link href="/signup" style={{ display: 'block', width: '100%', padding: '12px', background: '#4B44C8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginBottom: 12 }}>
            Create free account
          </Link>

          <Link href="/login" style={{ display: 'block', width: '100%', padding: '11px', background: 'transparent', color: '#4B44C8', border: '1px solid #4B44C8', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', marginBottom: 24 }}>
            Sign in to your account
          </Link>

          <div style={{ height: 1, background: '#e5e7eb', marginBottom: 20 }} />

          <Link href="/pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '11px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer', textDecoration: 'none', marginBottom: 20 }}>
            <i className="ti ti-tag" style={{ fontSize: 15 }} aria-hidden="true" />
            View pricing plans
          </Link>

          <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
            No credit card required · Free forever on basic plan
          </div>
        </div>
      </div>
    </div>
  )
}
