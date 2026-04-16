// app/api/stripe/webhook/route.js
import { stripe } from '../../../../lib/stripe'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return Response.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  const planFromMetadata = (metadata) => metadata?.plan || 'pro'

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const userId = session.metadata?.userId
      const plan = planFromMetadata(session.metadata)
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionId: session.subscription,
            subscriptionStatus: 'active',
            stripeCustomerId: session.customer,
          },
        })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object
      const user = await prisma.user.findFirst({ where: { subscriptionId: sub.id } })
      if (user) {
        const plan = sub.metadata?.plan || sub.items?.data?.[0]?.price?.metadata?.plan || user.plan
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: sub.status, plan: sub.status === 'active' ? plan : 'free' },
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      const user = await prisma.user.findFirst({ where: { subscriptionId: sub.id } })
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: 'canceled', plan: 'free' },
        })
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      const user = await prisma.user.findFirst({ where: { stripeCustomerId: invoice.customer } })
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'past_due' } })
      }
      break
    }
  }

  return Response.json({ received: true })
}
