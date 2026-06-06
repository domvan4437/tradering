import { getSession } from '../../../../lib/auth'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY

const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: { headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
    'PLAID-SECRET': process.env.PLAID_SECRET,
  }},
}))

export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Get all connections for this user
    const connections = await fetch(`${SUPA_URL}/rest/v1/BrokerConnection?userId=eq.${session.user.id}&status=eq.connected&select=*`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
    }).then(r => r.json())

    let totalSynced = 0
    for (const conn of connections || []) {
      const endDate = new Date().toISOString().slice(0,10)
      const startDate = new Date(Date.now() - 90*24*60*60*1000).toISOString().slice(0,10)
      try {
        const invRes = await plaidClient.investmentsTransactionsGet({
          access_token: conn.accessToken, start_date: startDate, end_date: endDate,
        })
        const txns = invRes.data.investment_transactions || []
        for (const txn of txns) {
          const existing = await fetch(`${SUPA_URL}/rest/v1/BrokerTrade?connectionId=eq.${conn.id}&brokerTradeId=eq.${txn.investment_transaction_id}&select=id`, {
            headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
          }).then(r => r.json())
          if (!existing || existing.length === 0) {
            await fetch(`${SUPA_URL}/rest/v1/BrokerTrade`, {
              method: 'POST',
              headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                connectionId: conn.id, userId: session.user.id,
                brokerTradeId: txn.investment_transaction_id,
                asset: txn.security?.ticker_symbol || txn.name || 'Unknown',
                symbol: txn.security?.ticker_symbol || 'UNK',
                direction: txn.quantity > 0 ? 'LONG' : 'SHORT',
                entryPrice: Math.abs(txn.price || 0),
                quantity: Math.abs(txn.quantity || 1),
                contractSize: 1, status: 'closed',
                openedAt: new Date(txn.date).toISOString(),
                closedAt: new Date(txn.date).toISOString(),
                createdAt: new Date().toISOString(),
              })
            })
            totalSynced++
          }
        }
        // Update lastSynced
        await fetch(`${SUPA_URL}/rest/v1/BrokerConnection?id=eq.${conn.id}`, {
          method: 'PATCH',
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ lastSynced: new Date().toISOString() })
        })
      } catch(e) { console.error('Sync error for conn', conn.id, e.message) }
    }
    return Response.json({ success: true, synced: totalSynced })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const connections = await fetch(`${SUPA_URL}/rest/v1/BrokerConnection?userId=eq.${session.user.id}&select=id,label,broker,status,lastSynced`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
    }).then(r => r.json())
    const trades = await fetch(`${SUPA_URL}/rest/v1/BrokerTrade?userId=eq.${session.user.id}&select=*&order=openedAt.desc&limit=100`, {
      headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
    }).then(r => r.json())
    return Response.json({ connections: connections || [], trades: trades || [] })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
