'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(params.get('error') ? 'Invalid email or password.' : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) { setError('Invalid email or password.'); setLoading(false) }
    else router.push('/app')
  }

  const inp = { width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid #e2e0f0', background:'#fff', fontSize:14, color:'#1a1a2e', outline:'none', boxSizing:'border-box', fontFamily:'Inter,system-ui,sans-serif' }

  const features = [
    { icon:'people', text:'Find your trading community' },
    { icon:'trophy', text:'Compete in live trading competitions' },
    { icon:'share', text:'Share trades, strategies, and screeners publicly' },
    { icon:'robot', text:'AI coaching that sharpens your edge' },
  ]

  const icons = {
    people: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    trophy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="8 21 12 17 16 21"/><path d="M7 4H17L18 9C18 11.21 15.31 13 12 13C8.69 13 6 11.21 6 9L7 4Z"/><path d="M4 4h3M17 4h3M12 13v4"/></svg>,
    share: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
    robot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>,
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ width:'45%', background:'linear-gradient(160deg,#4f46e5 0%,#3730a3 100%)', padding:'48px 52px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <span style={{ fontSize:18, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>TradeZar</span>
        </div>
        <div>
          <div style={{ fontSize:36, fontWeight:700, color:'#fff', lineHeight:1.25, marginBottom:14, letterSpacing:'-0.5px' }}>Trade smarter,<br />together.</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.75)', lineHeight:1.65, marginBottom:36, maxWidth:340 }}>Built for traders who want more than charts — connection, competition, and credibility.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {features.map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icons[f.icon]}</div>
                <span style={{ fontSize:14, color:'rgba(255,255,255,0.85)' }}>{f.text}</span>
              </div>
            ))}
          </div>
          
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>© 2026 TradeZar · All rights reserved</div>
      </div>
      <div style={{ flex:1, background:'#fafaf9', display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:26, fontWeight:700, color:'#1a1a2e', marginBottom:6, letterSpacing:'-0.3px' }}>Welcome back</div>
            <div style={{ fontSize:14, color:'#6b7280' }}>Sign in to your account to continue</div>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required style={inp} onFocus={e=>e.target.style.borderColor='#4f46e5'} onBlur={e=>e.target.style.borderColor='#e2e0f0'} />
            </div>
            <div style={{ marginBottom:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:'#374151' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize:12, color:'#4f46e5', textDecoration:'none', fontWeight:500 }}>Forgot password?</Link>
              </div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" required style={inp} onFocus={e=>e.target.style.borderColor='#4f46e5'} onBlur={e=>e.target.style.borderColor='#e2e0f0'} />
            </div>
            {error && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:10, border:'none', background:loading?'#a5b4fc':'#4f46e5', color:'#fff', fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:'Inter,system-ui,sans-serif', marginTop:20 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p style={{ fontSize:13, color:'#6b7280', marginTop:24, textAlign:'center' }}>
            No account?{' '}
            <Link href="/signup" style={{ color:'#4f46e5', textDecoration:'none', fontWeight:600 }}>Start free trial</Link>
          </p>
          <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid #e5e7eb', display:'flex', justifyContent:'center', gap:20 }}>
            <Link href="/privacy" style={{ fontSize:12, color:'#9ca3af', textDecoration:'none' }}>Privacy</Link>
            <Link href="/terms" style={{ fontSize:12, color:'#9ca3af', textDecoration:'none' }}>Terms</Link>
            <Link href="/support" style={{ fontSize:12, color:'#9ca3af', textDecoration:'none' }}>Support</Link>
          </div>
        </div>
      </div>
    </div>
  )
}