'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = { bg: '#0a0a0a', surface: '#0d0d0d', border: '#1a1a1a', border2: '#222', gold: '#c8a84b', text: '#e8e0d0', muted: '#555', green: '#4caf82', greenBorder: '#1a3d2a', font: "'Courier New', monospace" }

const PLANS = [
  {
    key: 'free', name: 'Free', price: '$0', sub: 'forever',
    features: ['3 screenings per day', 'All 9 stages', 'Trade journal', 'Seasonal & COT Index tools', 'Trade calculator'],
    cta: 'Start Free', href: '/signup', highlight: false,
  },
  {
    key: 'pro', name: 'Pro', price: '$29', sub: '/month',
    features: ['Unlimited screenings', 'Watchlist scanner (20 commodities)', 'Weekly COT email alerts', 'DB-backed journal (never lost)', 'All free features', '14-day free trial'],
    cta: 'Start Free Trial', href: null, highlight: true,
  },
  {
    key: 'trader', name: 'Trader', price: '$79', sub: '/month',
    features: ['Everything in Pro', 'Priority support', 'Early access to new features', 'Shareable screening reports', '14-day free trial'],
    cta: 'Start Free Trial', href: null, highlight: false,
  },
]

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleUpgrade = async (planKey) => {
    if (!session) { router.push('/signup'); return }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planKey }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: C.font, padding: '60px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
          <div style={{ width: 10, height: 10, background: C.gold, transform: 'rotate(45deg)' }} />
          <Link href="/" style={{ fontSize: 11, letterSpacing: 4, color: C.gold, textDecoration: 'none' }}>COMMODITY INTELLIGENCE SYSTEM</Link>
        </div>

        <h1 style={{ fontSize: 48, fontWeight: 400, letterSpacing: '-1px', margin: '0 0 12px' }}>
          Simple <span style={{ color: C.gold }}>pricing</span>
        </h1>
        <p style={{ color: C.muted, fontSize: 15, margin: '0 0 64px' }}>Start free. Upgrade when you need more.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.key} style={{
              background: plan.highlight ? '#0d1008' : C.surface,
              border: `1px solid ${plan.highlight ? C.gold : C.border2}`,
              padding: '32px 28px',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -1, right: 24, background: C.gold, color: '#0a0a0a', fontSize: 9, letterSpacing: 2, padding: '4px 10px' }}>MOST POPULAR</div>
              )}
              <p style={{ fontSize: 11, letterSpacing: 3, color: C.muted, margin: '0 0 12px' }}>{plan.name.toUpperCase()}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 28 }}>
                <span style={{ fontSize: 40, fontWeight: 300, color: C.text }}>{plan.price}</span>
                <span style={{ fontSize: 13, color: C.muted }}>{plan.sub}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                {plan.features.map(f => (
                  <li key={f} style={{ fontSize: 13, color: '#888', padding: '6px 0', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: C.green, fontSize: 11 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              {plan.href ? (
                <Link href={plan.href} style={{ display: 'block', textAlign: 'center', background: C.border2, color: C.muted, padding: '12px', fontSize: 10, letterSpacing: 3, textDecoration: 'none', textTransform: 'uppercase' }}>
                  {plan.cta}
                </Link>
              ) : (
                <button onClick={() => handleUpgrade(plan.key)} style={{ width: '100%', background: plan.highlight ? C.gold : C.border2, color: plan.highlight ? '#0a0a0a' : C.muted, border: 'none', padding: '12px', fontSize: 10, letterSpacing: 3, cursor: 'pointer', fontFamily: C.font, textTransform: 'uppercase' }}>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 48 }}>
          All paid plans include a 14-day free trial. Cancel anytime. Data sources: CFTC, Yahoo Finance — always free.
        </p>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          {session
            ? <Link href="/app" style={{ color: C.gold, fontSize: 13, textDecoration: 'none' }}>← Back to app</Link>
            : <Link href="/login" style={{ color: C.muted, fontSize: 13, textDecoration: 'none' }}>Already have an account? Sign in</Link>
          }
        </div>
      </div>
    </div>
  )
}
