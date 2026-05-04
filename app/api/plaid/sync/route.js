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

    const { connectionId } = await request.json()

    const connection = await prisma.brokerConnection.findUnique({
      where: { id: connectionId, userId: session.user.id }
    })
    if (!connection) return Response.json({ error: 'Connection not found' }, { status: 404 })

    const endDate = new Date().toISOString().slice(0,10)
    const startDate = new Date(Date.now() - 90*24*60*60*1000).toISOString().slice(0,10)

    let synced = 0
    try {
      const invRes = await plaidClient.investmentsTransactionsGet({
        access_token: connection.accessToken,
        start_date: startDate,
        end_date: endDate,
      })

      for (const txn of invRes.data.investment_transactions || []) {
        await prisma.brokerTrade.upsert({
          where: { connectionId_brokerTradeId: { connectionId: connection.id, brokerTradeId: txn.investment_transaction_id } },
          update: {},
          create: {
            connectionId: connection.id,
            userId: session.user.id,
            brokerTradeId: txn.investment_transaction_id,
            asset: txn.security?.ticker_symbol || txn.name || 'Unknown',
            symbol: txn.security?.ticker_symbol || 'UNK',
            direction: txn.quantity > 0 ? 'LONG' : 'SHORT',
            entryPrice: Math.abs(txn.price || 0),
            quantity: Math.abs(txn.quantity || 1),
            contractSize: 1,
            realizedPnL: null,
            status: 'closed',
            openedAt: new Date(txn.date),
            closedAt: new Date(txn.date),
          }
        }).catch(() => {})
        synced++
      }
    } catch {}

    await prisma.brokerConnection.update({
      where: { id: connectionId },
      data: { lastSynced: new Date(), status: 'connected' }
    })

    return Response.json({ synced })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
