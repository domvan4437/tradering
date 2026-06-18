'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e2e0f0', background: '#fff', fontSize: 14, color: '#1a1a2e', outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,system-ui,sans-serif' }

  if (!token) return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 14, color: '#dc2626', marginBottom: 16 }}>Invalid or missing reset link.</div>
      <Link href="/forgot-password" style={{ color: '#4f46e5', fontSize: 14 }}>Request a new one</Link>
    </div>
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/reset-pw/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (done) return (
    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '24px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>✅</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#166534', marginBottom: 6 }}>Password updated!</div>
      <div style={{ fontSize: 13, color: '#15803d' }}>Redirecting you to sign in…</div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>New password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required style={inp}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = '#e2e0f0'} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Confirm new password</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" required style={inp}
          onFocus={e => e.target.style.borderColor = '#4f46e5'}
          onBlur={e => e.target.style.borderColor = '#e2e0f0'} />
      </div>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>
      )}
      <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: loading ? '#a5b4fc' : '#4f46e5', color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter,system-ui,sans-serif' }}>
        {loading ? 'Updating...' : 'Set new password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter,system-ui,sans-serif', background: '#fafaf9', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 32 }}>
          <Link href="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to sign in
          </Link>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 6, letterSpacing: '-0.3px' }}>Set new password</div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Choose a new password for your account.</div>
        </div>
        <Suspense fallback={<div style={{ fontSize: 14, color: '#6b7280' }}>Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
