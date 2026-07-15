import { getSession } from '../../../../lib/auth'
import { stripe } from '../../../../lib/stripe'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  const result = {
    plan: user.plan || 'free',
    subscriptionStatus: user.subscriptionStatus || null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    paymentMethod: null,
    invoices: [],
  }

  if (!user.stripeCustomerId) return Response.json(result)

  try {
    // Active subscription details
    if (user.subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(user.subscriptionId, {
        expand: ['default_payment_method'],
      })
      result.currentPeriodEnd = sub.current_period_end
      result.cancelAtPeriodEnd = sub.cancel_at_period_end

      // Payment method from subscription
      if (sub.default_payment_method?.card) {
        const pm = sub.default_payment_method
        result.paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
      }
    }

    // Fallback: get default payment method from customer
    if (!result.paymentMethod) {
      const pms = await stripe.paymentMethods.list({ customer: user.stripeCustomerId, type: 'card', limit: 1 })
      if (pms.data.length > 0) {
        const pm = pms.data[0]
        result.paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        }
      }
    }

    // Invoice history
    const invoices = await stripe.invoices.list({ customer: user.stripeCustomerId, limit: 12 })
    result.invoices = invoices.data.map(inv => ({
      id: inv.id,
      date: inv.created,
      amount: inv.amount_paid / 100,
      currency: inv.currency.toUpperCase(),
      status: inv.status,
      pdfUrl: inv.invoice_pdf,
      description: inv.lines?.data?.[0]?.description || 'TradeZar Pro · Monthly',
    }))
  } catch (err) {
    console.error('Stripe billing fetch error:', err.message)
  }

  return Response.json(result)
}
