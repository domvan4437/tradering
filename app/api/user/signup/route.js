import bcrypt from 'bcryptjs'

const SUPABASE_URL = 'https://mdddbfrtqnpyathtgvbv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s'

const headers = {
  'Content-Type': 'application/json',
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
}

export async function POST(request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 })
    if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const emailLower = email.toLowerCase()

    // Check if user exists
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/User?email=eq.${encodeURIComponent(emailLower)}&select=id`,
      { headers }
    )
    const existing = await checkRes.json()
    if (existing.length > 0) return Response.json({ error: 'Email already registered' }, { status: 400 })

    const hashed = await bcrypt.hash(password, 12)
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const id = 'u_' + Date.now() + Math.random().toString(36).slice(2, 8)
    const now = new Date().toISOString()

    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/User`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        id,
        email: emailLower,
        password: hashed,
        name: name || '',
        plan: 'free',
        trialEndsAt,
        createdAt: now,
        screeningsToday: 0,
        screeningsReset: now,
        isPublic: true,
        verifiedBadge: false,
        propFirmInterest: false,
      })
    })

    const created = await createRes.json()
    if (!createRes.ok) return Response.json({ error: JSON.stringify(created) }, { status: 500 })

    return Response.json({ success: true, userId: id })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
