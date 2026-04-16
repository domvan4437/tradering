import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
})

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 29,
    priceLabel: '$29/mo',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    color: '#4A6FA5',
    description: 'For serious traders who want the full edge.',
    features: [
      'Unlimited screenings',
      'AI Performance Coach',
      'Trade Plan Builder',
      'COT Alerts',
      'Strategy Backtesting',
      'Broker account sync',
      'Competition entry',
      'Watchlist scanner',
      'Full journal & analytics',
      'Email support',
    ],
    notIncluded: [
      'Create paid groups',
      'White-label competitions',
    ],
  },
  trader: {
    name: 'Trader',
    price: 79,
    priceLabel: '$79/mo',
    priceId: process.env.STRIPE_TRADER_PRICE_ID,
    color: '#d97706',
    description: 'For professional traders and community builders.',
    features: [
      'Everything in Pro',
      'Create & monetize groups',
      'Host paid tournaments',
      'Priority API access',
      'Advanced strategy backtesting',
      'White-label competitions',
      'Early access to new features',
      'Priority support',
    ],
    notIncluded: [],
  },
}

export const FREE_FEATURES = [
  '3 screenings per day',
  'COT Index lookup',
  'Seasonal analysis',
  'Trade calculator',
  'Trading journal',
  'Join free groups',
  'Enter free competitions',
  'Market news feed',
  'Home dashboard',
]

export const FREE_NOT_INCLUDED = [
  'Unlimited screenings',
  'AI Coach',
  'Trade Plan Builder',
  'COT Alerts',
  'Broker sync',
  'Strategy Backtesting',
]

export async function createOrRetrieveCustomer({ email, userId }) {
  const { prisma } = await import('./prisma')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({ email, metadata: { userId } })
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
  return customer.id
}
