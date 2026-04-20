
import { prisma } from '../../../../lib/prisma';

export async function GET(req, { params }) {
  const { slug } = params;

  // Find by slug or by user ID
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { profileSlug: slug },
        { id: slug },
      ],
    },
    include: {
      consistency: true,
      screenerTemplates: {
        where: { isPublic: true },
        take: 5,
        orderBy: { useCount: 'desc' },
      },
    },
  });

  if (!user) return Response.json({ error: 'Profile not found' }, { status: 404 });

  // Respect privacy settings
  if (user.profileVisibility === 'private') {
    return Response.json({ error: 'This profile is private' }, { status: 403 });
  }

  // Get verified trade calls (public profiles only show resolved calls)
  const tradeCalls = user.profileVisibility === 'public'
    ? await prisma.tradeCall.findMany({
        where: {
          userId: user.id,
          validationStatus: 'valid',
          result: { in: ['win', 'loss'] },
        },
        orderBy: { closeTimestamp: 'desc' },
        take: 50,
        select: {
          id: true, commodity: true, direction: true,
          entryPrice: true, closePrice: true,
          result: true, pnlPoints: true, riskReward: true,
          holdHours: true, entryTimestamp: true, closeTimestamp: true,
        },
      })
    : [];

  // Get competition results
  const competitionResults = await prisma.tournamentEntry.findMany({
    where: { userId: user.id },
    include: {
      tournament: { select: { name: true, traderStyle: true, endDate: true } },
    },
    orderBy: { score: 'desc' },
    take: 10,
  });

  // Get leaderboard positions
  const leaderboardPositions = await prisma.leaderboardSnapshot.findMany({
    where: { userId: user.id, period: 'monthly' },
    orderBy: { snappedAt: 'desc' },
    take: 6,
  });

  // Compute stats
  const wins = tradeCalls.filter(c => c.result === 'win').length;
  const losses = tradeCalls.filter(c => c.result === 'loss').length;
  const winRate = tradeCalls.length > 0 ? (wins / tradeCalls.length * 100).toFixed(1) : null;
  const avgRR = tradeCalls.filter(c => c.riskReward).length > 0
    ? (tradeCalls.reduce((s, c) => s + (c.riskReward || 0), 0) / tradeCalls.filter(c => c.riskReward).length).toFixed(2)
    : null;

  return Response.json({
    profile: {
      id: user.id,
      displayName: user.displayName || user.name || user.email?.split('@')[0],
      bio: user.bio,
      tradingStyle: user.tradingStyle,
      primaryAssets: user.primaryAssets ? JSON.parse(user.primaryAssets) : [],
      profileVisibility: user.profileVisibility,
      verifiedBadge: user.verifiedBadge,
      badgeEarnedAt: user.badgeEarnedAt,
      twitterHandle: user.twitterHandle,
      profileSlug: user.profileSlug,
      joinedAt: user.createdAt,
      consistency: user.consistency,
      publicScreeners: user.screenerTemplates,
    },
    stats: {
      totalVerifiedTrades: tradeCalls.length,
      wins, losses, winRate, avgRR,
    },
    recentCalls: tradeCalls.slice(0, 20),
    competitionResults,
    leaderboardPositions,
  });
}
