'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/user/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email.toLowerCase(), password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Signup failed. Please try again.'); setLoading(false); return }
      const { signIn } = await import('next-auth/react')
      await signIn('credentials', { email: email.toLowerCase(), password, callbackUrl: '/app' })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const features = [
    { icon: 'ti-users', text: 'Connect with traders who share your edge' },
    { icon: 'ti-trophy', text: 'Compete head-to-head in live challenges' },
    { icon: 'ti-notebook', text: 'Journal trades and track your growth' },
    { icon: 'ti-chart-bar', text: 'COT data, seasonal signals, and screeners' },
    { icon: 'ti-robot', text: 'AI coaching that sharpens your edge' },
  ]

  const inp = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #e2e0f0', background:'#fff', fontSize:14, color:'#1a1a2e', outline:'none', boxSizing:'border-box', fontFamily:'Inter,system-ui,sans-serif' }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Inter,system-ui,sans-serif' }}>
      {/* Left panel */}
      <div style={{ width:'45%', background:'linear-gradient(160deg,#4B44C8 0%,#3730a3 100%)', padding:'48px 52px', display:'flex', flexDirection:'column', justifyContent:'space-between', flexShrink:0 }}>
        <div>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48, textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <i className="ti ti-trending-up" style={{ fontSize:16, color:'#fff' }} aria-hidden="true" />
            </div>
            <span style={{ fontSize:18, fontWeight:700, color:'#fff' }}>TradeZar</span>
          </Link>
          <div style={{ fontSize:32, fontWeight:700, color:'#fff', lineHeight:1.25, marginBottom:14 }}>Join TradeZar.<br/>Trade smarter,<br/>together.</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', marginBottom:32, lineHeight:1.6 }}>The all-in-one platform for serious traders.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <i className={`ti ${f.icon}`} style={{ fontSize:14, color:'#fff' }} aria-hidden="true" />
                </div>
                <span style={{ fontSize:13, color:'rgba(255,255,255,0.88)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>© 2026 TradeZar · <Link href="/pricing" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Pricing</Link> · <Link href="#" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>Privacy</Link></div>
      </div>

      {/* Right panel */}
      <div style={{ flex:1, background:'#fafaf9', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 52px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ fontSize:28, fontWeight:700, color:'#1a1a2e', marginBottom:6 }}>Create your account</div>
          <div style={{ fontSize:14, color:'#6b7280', marginBottom:28 }}>Free forever on the basic plan. No credit card required.</div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Full name</label>
              <input style={inp} placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Email address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5 }}>Password (8+ characters)</label>
              <input style={inp} type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="new-password" />
            </div>

            {error && <div style={{ fontSize:13, color:'#dc2626', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'8px 12px' }}>{error}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background: loading ? '#9ca3af' : '#4B44C8', color:'#fff', fontSize:14, fontWeight:600, cursor: loading ? 'default' : 'pointer', fontFamily:'Inter,system-ui,sans-serif' }}>
              {loading ? 'Creating account...' : 'Create free account →'}
            </button>
          </form>

          <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'#6b7280' }}>
            Already have an account? <Link href="/login" style={{ color:'#4B44C8', fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          </div>

          <div style={{ height:1, background:'#e5e7eb', margin:'20px 0' }} />

          <Link href="/pricing" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:13, color:'#6b7280', textDecoration:'none' }}>
            <i className="ti ti-tag" style={{ fontSize:14 }} aria-hidden="true" />
            View pricing plans
          </Link>
        </div>
      </div>
    </div>
  )
}
