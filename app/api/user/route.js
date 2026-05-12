// app/api/user/route.js
import { getSession } from '../../../lib/auth'

const SUPABASE_URL = 'https://mdddbfrtqnpyathtgvbv.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${session.user.id}&select=id,email,name,plan,subscriptionStatus,trialEndsAt,screeningsToday,screeningsReset`,
      { headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` } }
    )
    const users = await res.json()
    const user = users[0] || { id: session.user.id, email: session.user.email, name: session.user.name, plan: 'free' }
    
    return Response.json({ 
      ...user, 
      limits: { screenings: user.plan === 'free' ? 3 : 999, alerts: user.plan === 'free' ? 0 : 99 }
    })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { name } = await request.json()
    
    await fetch(
      `${SUPABASE_URL}/rest/v1/User?id=eq.${session.user.id}`,
      {
        method: 'PATCH',
        headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      }
    )
    return Response.json({ success: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
