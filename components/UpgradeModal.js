'use client'
import { useState } from 'react'
import { PLANS, FREE_FEATURES, FREE_NOT_INCLUDED } from '../lib/stripe'

const C = {
  bg:'var(--bg)',surface:'var(--surface)',surface2:'var(--surface2)',
  border:'var(--border)',border2:'var(--border2)',accent:'var(--accent)',
  text:'var(--text)',muted:'var(--text-muted)',dim:'var(--text-dim)',
  green:'var(--green)',red:'var(--red)',gold:'var(--gold)',
  font:'var(--font)',mono:'var(--font-mono)',
}

export function PricingPage({ currentPlan = 'free', onClose }) {
  const [loading, setLoading] = useState(null)

  const handleUpgrade = async (plan) => {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { setLoading(null) }
  }

  const Check = ({ color = C.green }) => <span style={{ color, fontWeight: 700, marginRight: 6 }}>✓</span>
  const X = () => <span style={{ color: C.dim, marginRight: 6 }}>✗</span>

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: C.text, margin: '0 0 12px' }}>
          Simple, honest pricing
        </h2>
        <p style={{ fontSize: 16, color: C.muted, margin: 0, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
          Start free and upgrade when you're ready. No trials, no pressure — just a product that earns your subscription.
        </p>
      </div>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>

        {/* Free */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ padding: '24px 24px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Free</div>
            <div style={{ fontSize: 40, fontWeight: 800, color: C.text, marginBottom: 4 }}>$0</div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>Forever free · No card required</div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
              Everything you need to get started with COT analysis and seasonal research.
            </p>
            <div style={{ background: currentPlan === 'free' ? C.surface2 : C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: currentPlan === 'free' ? C.accent : C.muted }}>
              {currentPlan === 'free' ? '✓ Your current plan' : 'Free forever'}
            </div>
          </div>
          <div style={{ padding: '0 24px 24px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 12px' }}>Included</div>
            {FREE_FEATURES.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: C.muted, padding: '5px 0', display: 'flex', alignItems: 'center' }}>
                <Check />{f}
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 12px' }}>Not included</div>
            {FREE_NOT_INCLUDED.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: C.dim, padding: '5px 0', display: 'flex', alignItems: 'center' }}>
                <X />{f}
              </div>
            ))}
          </div>
        </div>

        {/* Pro */}
        <div style={{ background: C.surface, border: `2px solid ${C.accent}`, borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
          <div style={{ background: C.accent, color: '#fff', textAlign: 'center', padding: '6px', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
            Most Popular
          </div>
          <div style={{ padding: '24px 24px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Pro</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: C.text }}>$29</span>
              <span style={{ fontSize: 14, color: C.dim }}>/month</span>
            </div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>Billed monthly · Cancel anytime</div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
              {PLANS.pro.description}
            </p>
            {currentPlan === 'pro' ? (
              <div style={{ background: C.accent + '15', border: `1px solid ${C.accent}`, borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.accent }}>
                ✓ Your current plan
              </div>
            ) : (
              <button onClick={() => handleUpgrade('pro')} disabled={!!loading} style={{ width: '100%', background: loading === 'pro' ? C.surface2 : C.accent, color: '#fff', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: C.font }}>
                {loading === 'pro' ? 'Redirecting...' : 'Upgrade to Pro →'}
              </button>
            )}
          </div>
          <div style={{ padding: '0 24px 24px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 12px' }}>Everything in Free, plus</div>
            {PLANS.pro.features.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: C.muted, padding: '5px 0', display: 'flex', alignItems: 'center' }}>
                <Check color={C.accent} />{f}
              </div>
            ))}
          </div>
        </div>

        {/* Trader */}
        <div style={{ background: C.surface, border: `1px solid ${C.gold}40`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${C.gold}, ${C.gold}88)` }} />
          <div style={{ padding: '24px 24px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Trader</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 800, color: C.text }}>$79</span>
              <span style={{ fontSize: 14, color: C.dim }}>/month</span>
            </div>
            <div style={{ fontSize: 13, color: C.dim, marginBottom: 16 }}>Billed monthly · Cancel anytime</div>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 20px', lineHeight: 1.6 }}>
              {PLANS.trader.description}
            </p>
            {currentPlan === 'trader' ? (
              <div style={{ background: C.gold + '15', border: `1px solid ${C.gold}`, borderRadius: 'var(--radius-sm)', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: C.gold }}>
                ✓ Your current plan
              </div>
            ) : (
              <button onClick={() => handleUpgrade('trader')} disabled={!!loading} style={{ width: '100%', background: loading === 'trader' ? C.surface2 : C.gold, color: '#000', border: 'none', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: C.font }}>
                {loading === 'trader' ? 'Redirecting...' : 'Upgrade to Trader →'}
              </button>
            )}
          </div>
          <div style={{ padding: '0 24px 24px', borderTop: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, margin: '16px 0 12px' }}>Everything in Pro, plus</div>
            {PLANS.trader.features.map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: C.muted, padding: '5px 0', display: 'flex', alignItems: 'center' }}>
                <Check color={C.gold} />{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust signals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { icon: '🔒', title: 'Secure payments', desc: 'Powered by Stripe. Your card details never touch our servers.' },
          { icon: '↩️', title: 'Cancel anytime', desc: 'No contracts. Cancel with one click from your account settings.' },
          { icon: '💬', title: 'Real support', desc: 'Email us directly. Real responses from the team, not bots.' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 'var(--radius)', padding: '24px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, margin: '0 0 20px' }}>Common questions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            { q: 'Is there a free trial?', a: 'No — instead, our free plan works forever with no time limit. Try everything included in free for as long as you need.' },
            { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade anytime. Upgrades take effect immediately. Downgrades take effect at your next billing date.' },
            { q: 'What payment methods are accepted?', a: 'All major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Apple Pay and Google Pay also supported.' },
            { q: 'Is TradeRing financial advice?', a: 'No. TradeRing is an analytical and educational tool. Nothing on this platform constitutes financial advice. Always consult a licensed advisor.' },
          ].map((faq, i) => (
            <div key={i}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{faq.q}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function UpgradeModal({ onClose, currentPlan, feature }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, overflowY: 'auto', padding: '40px 20px' }} onClick={onClose}>
      <div style={{ background: C.bg, borderRadius: 'var(--radius)', maxWidth: 1040, margin: '0 auto', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, margin: '0 0 6px' }}>Upgrade TradeRing</h2>
            {feature && <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>
              <span style={{ color: C.accent, fontWeight: 600 }}>{feature}</span> is available on Pro and Trader plans.
            </p>}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.dim, fontSize: 24, cursor: 'pointer', padding: '0 8px' }}>×</button>
        </div>
        <PricingPage currentPlan={currentPlan} onClose={onClose} />
      </div>
    </div>
  )
}
