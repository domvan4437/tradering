import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { stripe } from '../../../../lib/stripe'

// POST → initiate Stripe Connect onboarding, returns { url }
export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { email: true, customFields: true },
    })

    const cf = (user?.customFields && typeof user.customFields === 'object') ? user.customFields : {}
    let accountId = cf.stripeConnectId

    // Create Stripe Connect Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { userId: uid },
      })
      accountId = account.id

      await prisma.user.update({
        where: { id: uid },
        data: {
          customFields: { ...cf, stripeConnectId: accountId, stripeConnectStatus: 'pending' },
        },
      })
    }

    // Generate onboarding link
    const baseUrl = process.env.NEXTAUTH_URL || 'https://tradezar.com'
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/app?monetization=connect&status=refresh`,
      return_url:  `${baseUrl}/app?monetization=connect&status=success`,
      type: 'account_onboarding',
    })

    return Response.json({ url: accountLink.url })
  } catch (e) {
    console.error('[POST /api/monetization/connect]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// GET → check connect status and update DB
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const user = await prisma.user.findUnique({ where: { id: uid }, select: { customFields: true } })
    const cf = (user?.customFields && typeof user.customFields === 'object') ? user.customFields : {}
    const accountId = cf.stripeConnectId

    if (!accountId) return Response.json({ connected: false })

    const account = await stripe.accounts.retrieve(accountId)
    const isActive = account.details_submitted && account.charges_enabled

    if (isActive && cf.stripeConnectStatus !== 'active') {
      await prisma.user.update({
        where: { id: uid },
        data: { customFields: { ...cf, stripeConnectStatus: 'active' } },
      })
    }

    return Response.json({
      connected: true,
      active: isActive,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    })
  } catch (e) {
    console.error('[GET /api/monetization/connect]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
