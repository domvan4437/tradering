'use client'
import Link from 'next/link'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: '/mo',
      desc: 'Perfect for getting started',
      features: [
        '50 journal trades per month',
        '3 market screeners per day',
        'Community feed and groups',
        'Basic COT data',
        'Compete tab access',
      ],
      cta: 'Get started free',
      href: '/signup',
      featured: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/mo',
      desc: 'For serious, active traders',
      features: [
        'Unlimited journal trades',
        'Full COT + seasonal data',
        'Unlimited screeners',
        'AI coaching sessions',
        'Revenue sharing enabled',
        'Priority support',
        'Advanced analytics',
      ],
      cta: 'Start 14-day free trial',
      href: '/signup?plan=pro',
      featured: true,
    },
    {
      name: 'Trader+',
      price: '$49',
      period: '/mo',
      desc: 'For professionals and educators',
      features: [
        'Everything in Pro',
        'Sell courses and signals',
        'Priority AI + broker sync',
        'Custom group branding',
        'Early access to features',
      ],
      cta: 'Start free trial',
      href: '/signup?plan=trader',
      featured: false,
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Left panel */}
      <div style={{ width: '36%', background: 'linear-gradient(160deg,#4B44C8 0%,#3730a3 100%)', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-trending-up" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TradeZar</span>
          </Link>

          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.25, marginBottom: 12 }}>
            Simple,<br />transparent pricing.
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginBottom: 32, lineHeight: 1.6 }}>
            Start free. Upgrade when you're ready. No contracts, cancel anytime.
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>All plans include</div>
            {['Community feed and groups', 'Trading journal', 'Basic market data', 'Compete tab access', 'Live price ticker'].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
                <i className="ti ti-check" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} aria-hidden="true" />
                {f}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
            Questions about pricing?<br />
            <a href="mailto:support@tradezar.com" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Contact our team →</a>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 32 }}>
          © 2026 TradeZar · <Link href="#" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Privacy</Link> · <Link href="#" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Terms</Link>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#fafaf9', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Already have an account? <Link href="/login" style={{ color: '#4B44C8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{ background: '#fff', border: plan.featured ? '2px solid #4B44C8' : '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px' }}>
              {plan.featured && (
                <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#EEEDFE', color: '#3C3489', display: 'inline-block', marginBottom: 8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Most popular
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>{plan.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 24, fontWeight: 700, color: plan.featured ? '#4B44C8' : '#1a1a2e' }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>{plan.period}</span>
                </div>
              </div>

              <div style={{ height: 1, background: '#f3f4f6', margin: '10px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', marginBottom: 14 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
                    <i className="ti ti-check" style={{ fontSize: 12, color: '#4B44C8', flexShrink: 0 }} aria-hidden="true" />
                    {f}
                  </div>
                ))}
              </div>

              <Link href={plan.href} style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', background: plan.featured ? '#4B44C8' : 'transparent', color: plan.featured ? '#fff' : '#4B44C8', border: plan.featured ? 'none' : '1px solid #4B44C8' }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
