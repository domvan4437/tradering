import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const hash = await bcrypt.hash('TradeZar2026!', 12)
    
    const response = await fetch(
      'https://mdddbfrtqnpyathtgvbv.supabase.co/rest/v1/User?email=eq.dominicvansaghi@yahoo.com',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZGRiZnJ0cW5weWF0aHRndmJ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4NDY1MCwiZXhwIjoyMDkxMjYwNjUwfQ.WNs2RHuG9N7Z9acsimnkscgWSRUcJKfrKmCTecjYk6s',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ password: hash })
      }
    )
    
    const data = await response.json()
    console.log('Response status:', response.status)
    console.log('Response data:', data)
    
    if (response.ok) {
      return Response.json({ success: true, updated: data })
    } else {
      return Response.json({ error: data, status: response.status })
    }
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
