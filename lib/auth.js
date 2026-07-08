import { getServerSession } from 'next-auth'
import { authOptions } from '../app/api/auth/[...nextauth]/route'
import { prisma } from './prisma'

export const PLAN_LIMITS = {
  free: {
    screeningsPerDay: 3,
    watchlist: false,
    alerts: false,
    journal: true,
    aiCoach: false,
    tradePlans: false,
    cotAlerts: false,
    competitions: true,   // can join, not create
    brokerSync: true,
    groups: true,         // can join free groups
    strategyBacktest: false,
    label: 'Free',
  },
  pro: {
    screeningsPerDay: 999,
    watchlist: true,
    alerts: true,
    journal: true,
    aiCoach: true,
    tradePlans: true,
    cotAlerts: true,
    competitions: true,
    brokerSync: true,
    groups: true,
    strategyBacktest: true,
    label: 'Pro',
  },
  trader: {
    screeningsPerDay: 999,
    watchlist: true,
    alerts: true,
    journal: true,
    aiCoach: true,
    tradePlans: true,
    cotAlerts: true,
    competitions: true,
    brokerSync: true,
    groups: true,         // can create paid groups
    strategyBacktest: true,
    label: 'Trader',
  },
}

export async function getSession() {
  return getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getUser(userId) {
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function checkScreeningLimit(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { allowed: false, reason: 'User not found' }

  const plan = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free
  if (plan.screeningsPerDay >= 999) return { allowed: true }

  const now = new Date()
  const resetDate = new Date(user.screeningsReset)
  const isNewDay = now.toDateString() !== resetDate.toDateString()

  if (isNewDay) {
    await prisma.user.update({ where: { id: userId }, data: { screeningsToday: 0, screeningsReset: now } })
    return { allowed: true }
  }

  if (user.screeningsToday >= plan.screeningsPerDay) {
    return {
      allowed: false,
      reason: `You've used all ${plan.screeningsPerDay} free screenings today. Upgrade to Pro for unlimited.`,
      limitReached: true,
      used: user.screeningsToday,
      limit: plan.screeningsPerDay,
    }
  }

  return { allowed: true, used: user.screeningsToday, limit: plan.screeningsPerDay }
}

export async function incrementScreeningCount(userId) {
  await prisma.user.update({ where: { id: userId }, data: { screeningsToday: { increment: 1 } } })
}
