import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})
const plaidClient = new PlaidApi(plaidConfig)

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { public_token, institution_name, institution_id, accounts } = await request.json()

    // Exchange public token for access token
    const exchangeRes = await plaidClient.itemPublicTokenExchange({ public_token })
    const { access_token, item_id } = exchangeRes.data

    // Store connection in DB
    const connection = await prisma.brokerConnection.upsert({
      where: { id: item_id },
      update: { accessToken: access_token, status: 'connected', lastSynced: new Date() },
      create: {
        id: item_id,
        userId: session.user.id,
        broker: institution_id || 'plaid',
        label: institution_name || 'Connected Account',
        accessToken: access_token,
        accountId: accounts?.[0]?.id || null,
        status: 'connected',
      }
    })

    // Immediately sync investment transactions
    await syncPlaidTransactions(plaidClient, connection, session.user.id)

    return Response.json({ success: true, connectionId: connection.id, label: institution_name })
  } catch (e) {
    console.error('Plaid exchange error:', e.response?.data || e.message)
    return Response.json({ error: e.response?.data?.error_message || 'Connection failed. Please try again.' }, { status: 500 })
  }
}

async function syncPlaidTransactions(plaidClient, connection, userId) {
  try {
    const endDate = new Date().toISOString().slice(0,10)
    const startDate = new Date(Date.now() - 365*24*60*60*1000).toISOString().slice(0,10)

    // Try investment transactions first
    try {
      const invRes = await plaidClient.investmentsTransactionsGet({
        access_token: connection.accessToken,
        start_date: startDate,
        end_date: endDate,
      })

      const txns = invRes.data.investment_transactions || []
      for (const txn of txns) {
        await prisma.brokerTrade.upsert({
          where: { connectionId_brokerTradeId: { connectionId: connection.id, brokerTradeId: txn.investment_transaction_id } },
          update: {},
          create: {
            connectionId: connection.id,
            userId,
            brokerTradeId: txn.investment_transaction_id,
            asset: txn.security?.ticker_symbol || txn.name || 'Unknown',
            symbol: txn.security?.ticker_symbol || 'UNK',
            direction: txn.type === 'buy' || txn.quantity > 0 ? 'LONG' : 'SHORT',
            entryPrice: Math.abs(txn.price || 0),
            quantity: Math.abs(txn.quantity || 1),
            contractSize: 1,
            realizedPnL: null,
            status: 'closed',
            openedAt: new Date(txn.date),
            closedAt: new Date(txn.date),
          }
        }).catch(() => {})
      }
    } catch {
      // Investment transactions not available for this account type, try regular transactions
    }
  } catch(e) {
    console.error('Plaid sync error:', e.message)
  }
}
