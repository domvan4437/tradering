import { getSession } from '../../../../lib/auth'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY
const supa = (path, method='GET', body) => fetch(`${SUPA_URL}/rest/v1/${path}`, {
  method, headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json', 'Prefer': method==='POST'?'return=representation':'' },
  body: body ? JSON.stringify(body) : undefined,
}).then(r => r.json())

const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: { headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
    'PLAID-SECRET': process.env.PLAID_SECRET,
  }},
}))

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { public_token, institution_name, institution_id, accounts } = await request.json()

    // Exchange public token for access token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeRes.data

    // Check if connection already exists
    const existing = await supa(`BrokerConnection?id=eq.${item_id}&select=id`)
    
    if (existing && existing.length > 0) {
      // Update existing
      await supa(`BrokerConnection?id=eq.${item_id}`, 'PATCH', {
        accessToken: access_token, status: 'connected', lastSynced: new Date().toISOString()
      })
    } else {
      // Create new
      await supa('BrokerConnection', 'POST', {
        id: item_id,
        userId: session.user.id,
        broker: institution_id || 'plaid',
        label: institution_name || 'Connected Account',
        accessToken: access_token,
        accountId: accounts?.[0]?.id || null,
        status: 'connected',
        lastSynced: new Date().toISOString(),
        autoCompete: true,
        showPnL: false,
        createdAt: new Date().toISOString(),
      })
    }

    // Sync investment transactions
    await syncTrades(plaidClient, access_token, item_id, session.user.id)

    return Response.json({ success: true, connectionId: item_id, label: institution_name })
  } catch (e) {
    console.error('Plaid exchange error:', e.response?.data || e.message)
    return Response.json({ error: e.response?.data?.error_message || 'Connection failed' }, { status: 500 })
  }
}

async function syncTrades(plaidClient, accessToken, connectionId, userId) {
  try {
    const endDate = new Date().toISOString().slice(0,10)
    const startDate = new Date(Date.now() - 365*24*60*60*1000).toISOString().slice(0,10)
    const invRes = await plaidClient.investmentsTransactionsGet({
      access_token: accessToken, start_date: startDate, end_date: endDate,
    })
    const txns = invRes.data.investment_transactions || []
    for (const txn of txns) {
      const existing = await fetch(`${SUPA_URL}/rest/v1/BrokerTrade?connectionId=eq.${connectionId}&brokerTradeId=eq.${txn.investment_transaction_id}&select=id`, {
        headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}` }
      }).then(r => r.json())
      if (!existing || existing.length === 0) {
        await fetch(`${SUPA_URL}/rest/v1/BrokerTrade`, {
          method: 'POST',
          headers: { 'apikey': SUPA_KEY, 'Authorization': `Bearer ${SUPA_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId, userId,
            brokerTradeId: txn.investment_transaction_id,
            asset: txn.security?.ticker_symbol || txn.name || 'Unknown',
            symbol: txn.security?.ticker_symbol || 'UNK',
            direction: txn.quantity > 0 ? 'LONG' : 'SHORT',
            entryPrice: Math.abs(txn.price || 0),
            quantity: Math.abs(txn.quantity || 1),
            contractSize: 1,
            status: 'closed',
            openedAt: new Date(txn.date).toISOString(),
            closedAt: new Date(txn.date).toISOString(),
            createdAt: new Date().toISOString(),
          })
        })
      }
    }
  } catch(e) {
    console.error('Sync error:', e.message)
  }
}
