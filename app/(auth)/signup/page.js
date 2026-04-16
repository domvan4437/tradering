'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const C = { bg: '#0a0a0a', surface: '#0d0d0d', border2: '#222', gold: '#c8a84b', text: '#e8e0d0', muted: '#555', red: '#e05a4e', green: '#4caf82', font: "'Courier New', monospace" }

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/user/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { setError(data.error || 'Signup failed.'); setLoading(false); return }

    await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    router.push('/app')
  }

  const inputStyle = { width: '100%', background: C.surface, border: `1px solid ${C.border2}`, padding: '12px 14px', fontSize: 14, color: C.text, outline: 'none', fontFamily: C.font, boxSizing: 'border-box' }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.font, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <div style={{ width: 10, height: 10, background: C.gold, transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: 11, letterSpacing: 4, color: C.gold }}>CIS</span>
        </div>

        <div style={{ background: '#080d09', border: '1px solid #1a3d2a', padding: '12px 16px', marginBottom: 32 }}>
          <p style={{ color: C.green, fontSize: 12, margin: 0, letterSpacing: 1 }}>✓ 14-DAY FREE TRIAL · NO CREDIT CARD REQUIRED</p>
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 400, color: C.text, margin: '0 0 8px' }}>Create account</h1>
        <p style={{ color: C.muted, fontSize: 13, margin: '0 0 40px' }}>Get full access for 14 days, free.</p>

        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'NAME (optional)', type: 'text' },
            { key: 'email', label: 'EMAIL', type: 'email' },
            { key: 'password', label: 'PASSWORD (8+ characters)', type: 'password' },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 3, color: C.muted, marginBottom: 8 }}>{label}</label>
              <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
                required={key !== 'name'} style={inputStyle} />
            </div>
          ))}

          {error && <p style={{ color: C.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#222' : C.gold, color: loading ? C.muted : '#0a0a0a', border: 'none', padding: '14px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: C.font, marginBottom: 12 }}>
            {loading ? 'Creating account...' : 'Start Free Trial →'}
          </button>
        </form>

        <p style={{ color: C.muted, fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
          After your trial, continue free (3 screenings/day) or upgrade to Pro ($29/mo) for unlimited access.
        </p>
        <p style={{ color: C.muted, fontSize: 13, marginTop: 24, textAlign: 'center' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: C.gold, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
