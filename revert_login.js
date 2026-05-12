const fs = require('fs');
const path = require('path');

const dest = path.join(process.env.USERPROFILE || process.env.HOME, 'Downloads', 'commodity-screener-final', 'commodity-screener', 'app', '(auth)', 'login', 'page.js');

const original = `'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
const C = { bg: '#0a0a0a', surface: '#0d0d0d', border: '#1a1a1a', border2: '#222', gold: '#c8a84b', text: '#e8e0d0', muted: '#555', red: '#e05a4e', font: "'Courier New', monospace" }
export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(params.get('error') ? 'Invalid email or password.' : '')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/app')
    }
  }
  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 10, height: 10, background: C.gold, transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: 11, letterSpacing: 4, color: C.gold }}>CIS</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 400, color: C.text, margin: '0 0 8px' }}>Welcome back</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '0 0 40px' }}>Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 8 }}>EMAIL</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', background: C.surface, border: \`1px solid \${C.border2}\`, padding: '12px 14px', fontSize: 14, color: C.text, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 8 }}>PASSWORD</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: C.surface, border: \`1px solid \${C.border2}\`, padding: '12px 14px', fontSize: 14, color: C.text, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }} />
          </div>
          {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#222' : C.gold, color: loading ? C.muted : '#0a0a0a', border: 'none', padding: '14px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: C.font }}>
            {loading ? 'Signing in...' : 'Sign In \u2192'}
          </button>
        </form>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 32, textAlign: 'center' }}>
          No account?{' '}
          <Link href="/signup" style={{ color: C.gold, textDecoration: 'none' }}>Start free trial</Link>
        </p>
      </div>
    </div>
  )
}
`;

fs.writeFileSync(dest, original, 'utf8');
console.log('OK: login page reverted to original');
console.log('Run: npm run dev');
