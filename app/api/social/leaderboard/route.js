import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { isPublic: true },
    select: {
      id: true, name: true, username: true, plan: true,
      screenings: { select: { outcome: true, passed: true, createdAt: true } },
      tradePlans: { select: { id: true } },
      socialPosts: { select: { likes: true, reposts: true } },
      followers: { select: { id: true } },
    },
    take: 100
  })

  const ranked = users.map(u => {
    const withOutcome = u.screenings.filter(s => s.outcome)
    const wins = withOutcome.filter(s => s.outcome === 'WIN').length
    const winRate = withOutcome.length >= 5 ? Math.round((wins / withOutcome.length) * 100) : null
    const totalLikes = u.socialPosts.reduce((sum, p) => sum + (p.likes || 0), 0)
    const totalReposts = u.socialPosts.reduce((sum, p) => sum + (p.reposts || 0), 0)
    const engagementScore = (u.socialPosts.length * 2) + totalLikes + (totalReposts * 3)
    // Combined score: win rate (40%) + plans (20%) + engagement (40%)
    const score = (winRate ? winRate * 0.4 : 0) + (u.tradePlans.length * 2) + (engagementScore * 0.3)
    return {
      id: u.id, name: u.name || 'Trader', username: u.username,
      plan: u.plan, winRate, totalScreenings: u.screenings.length,
      withOutcome: withOutcome.length, tradePlans: u.tradePlans.length,
      posts: u.socialPosts.length, totalLikes, followers: u.followers.length,
      score: Math.round(score), isMe: u.id === session.user.id
    }
  }).filter(u => u.totalScreenings > 0 || u.posts > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50)

  return Response.json({ leaderboard: ranked })
}
