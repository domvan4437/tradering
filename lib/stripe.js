import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
})

export const PLANS = {
  pro: {
    name: 'Pro',
    price: 20,
    priceLabel: '$20/mo',
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    description: 'Everything unlocked for serious traders.',
    features: [
      'Unlimited journal trades',
      'Unlimited screeners',
      'Full COT data + seasonal patterns',
      'COT alerts',
      'Extended AI coach usage',
      'Host & create competitions',
      'Broker sync & trade import',
    ],
  },
}

export const FREE_FEATURES = [
  'Unlimited journal trades',
  'Broker sync & trade import',
  'Basic COT data',
  '3 screeners per day',
  'Community feed, groups & DMs',
  'Traders map',
  'Join competitions, leaderboard & leagues',
  'Limited AI coach access',
]

export const PRO_FEATURES = [
  'Unlimited journal trades',
  'Unlimited screeners',
  'Full COT data + seasonal patterns',
  'COT alerts',
  'Host & create competitions',
  'Extended AI coach usage',
]

export async function createOrRetrieveCustomer({ email, userId }) {
  const { prisma } = await import('./prisma')
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({ email, metadata: { userId } })
  await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
  return customer.id
}
