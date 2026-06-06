const fs = require('fs')

const newRoute = `import { getSession } from '../../../../lib/auth'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(\`\${URL}/rest/v1/\${t}\${q}\`, { headers: { apikey: KEY, Authorization: \`Bearer \${KEY}\` } }).then(r => r.json()),
  del: (t, q) => fetch(\`\${URL}/rest/v1/\${t}\${q}\`, { method:'DELETE', headers: { apikey: KEY, Authorization: \`Bearer \${KEY}\` } }).then(r => r.status),
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const connections = await db.get('BrokerConnection', \`?userId=eq.\${session.user.id}&order=createdAt.desc\`)
    const trades = await db.get('BrokerTrade', \`?userId=eq.\${session.user.id}&order=openedAt.desc&limit=200\`)

    const closed = (trades||[]).filter(t => t.status === 'closed' && t.realizedPnL != null)
    const wins = closed.filter(t => t.realizedPnL > 0)
    const totalPnL = closed.reduce((s,t) => s + (t.realizedPnL || 0), 0)
    const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : null

    return Response.json({
      connections: connections || [],
      trades: trades || [],
      stats: {
        total: (trades||[]).length,
        totalPnL,
        winRate,
        wins: wins.length,
        losses: closed.length - wins.length
      }
    })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { connectionId } = await request.json()
    await db.del('BrokerConnection', \`?id=eq.\${connectionId}&userId=eq.\${session.user.id}\`)
    return Response.json({ success: true })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
`

fs.writeFileSync('app/api/plaid/connections/route.js', newRoute, 'utf8')
console.log('✓ connections/route.js rewritten to use Supabase')
console.log('\nRun: rd /s /q .next & npm run dev')
