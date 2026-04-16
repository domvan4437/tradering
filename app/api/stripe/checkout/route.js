import { getSession } from '../../../../lib/auth'
import { stripe, PLANS, createOrRetrieveCustomer } from '../../../../lib/stripe'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json()
  const planConfig = PLANS[plan]
  if (!planConfig) return Response.json({ error: 'Invalid plan' }, { status: 400 })

  const customerId = await createOrRetrieveCustomer({
    email: session.user.email,
    userId: session.user.id,
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/app?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/app`,
    // No trial — freemium model, pay from day one
    subscription_data: {
      metadata: { userId: session.user.id, plan },
    },
    metadata: { userId: session.user.id, plan },
    allow_promotion_codes: true, // lets you give discount codes to early users
  })

  return Response.json({ url: checkoutSession.url })
}
