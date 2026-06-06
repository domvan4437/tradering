import { getSession } from '../../../../lib/auth'
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

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
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: session.user.id },
      client_name: 'TradeZar',
      products: [Products.Investments],
      country_codes: [CountryCode.Us],
      language: 'en',
    })
    return Response.json({ link_token: response.data.link_token })
  } catch (e) {
    console.error('Plaid link token error:', e.response?.data || e.message)
    return Response.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}
