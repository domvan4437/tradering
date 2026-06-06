import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import { stripe, createOrRetrieveCustomer } from '../../../../lib/stripe'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { groupId } = await request.json()

  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { owner: true } })
  if (!group) return Response.json({ error: 'Group not found' }, { status: 404 })

  if (group.monthlyPrice === 0) {
    // Free group — just add membership
    await prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId, userId: session.user.id } },
      update: { status: 'active' },
      create: { groupId, userId: session.user.id, monthlyFee: 0, status: 'active' }
    })
    return Response.json({ joined: true, free: true })
  }

  // Paid group — create Stripe checkout
  const customerId = await createOrRetrieveCustomer({ email: session.user.email, userId: session.user.id })

  // Create a Stripe price on-the-fly for this group
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: Math.round(group.monthlyPrice * 100),
    recurring: { interval: 'month' },
    product_data: { name: `${group.name} — TradeZar Group` }
  })

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: price.id, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/app?group_joined=${groupId}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/app`,
    subscription_data: {
      metadata: {
        userId: session.user.id, groupId, type: 'group_membership',
        creatorId: group.ownerId, monthlyFee: group.monthlyPrice.toString()
      },
      application_fee_percent: 5,
    },
    metadata: { userId: session.user.id, groupId, type: 'group_membership' },
    allow_promotion_codes: true,
  })

  return Response.json({ url: checkoutSession.url })
}
