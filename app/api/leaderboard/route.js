
import { prisma } from '../../../lib/prisma';

const ASSET_CLASSES = ['overall', 'commodities', 'forex', 'stocks', 'crypto'];

const ASSET_MAP = {
  commodities: ['GC=F','SI=F','CL=F','NG=F','ZW=F','ZC=F','ZS=F','HG=F','CT=F','KC=F'],
  forex:       ['EURUSD=X','GBPUSD=X','USDJPY=X','AUDUSD=X','USDCAD=X','NZDUSD=X'],
  stocks:      ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM'],
  crypto:      ['BTC-USD','ETH-USD','SOL-USD','BNB-USD','XRP-USD','ADA-USD'],
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const assetClass = searchParams.get('assetClass') || 'overall';
  const period = searchParams.get('period') || 'monthly';
  const limit = parseInt(searchParams.get('limit') || '50');

  // Get all public users with consistency scores
  const users = await prisma.user.findMany({
    where: {
      profileVisibility: 'public',
      consistency: { isNot: null },
    },
    include: {
      consistency: true,
    },
    take: 200,
  });

  // For asset-class filtered leaderboards, get trade calls per user
  let rankedUsers = users;

  if (assetClass !== 'overall') {
    const assetSymbols = ASSET_MAP[assetClass] || [];

    // Get trade stats per user filtered by asset class
    const userIds = users.map(u => u.id);
    const calls = await prisma.tradeCall.findMany({
      where: {
        userId: { in: userIds },
        commodity: { in: assetSymbols },
        validationStatus: 'valid',
        result: { in: ['win', 'loss'] },
      },
      select: { userId: true, result: true, riskReward: true, pnlPoints: true },
    });

    // Group by user
    const userStats = {};
    for (const call of calls) {
      if (!userStats[call.userId]) userStats[call.userId] = { wins: 0, total: 0, rrSum: 0, rrCount: 0, points: 0 };
      userStats[call.userId].total++;
      userStats[call.userId].points += call.pnlPoints || 0;
      if (call.result === 'win') userStats[call.userId].wins++;
      if (call.riskReward) { userStats[call.userId].rrSum += call.riskReward; userStats[call.userId].rrCount++; }
    }

    // Only include users with at least 10 trades in this asset class
    rankedUsers = users
      .filter(u => userStats[u.id] && userStats[u.id].total >= 10)
      .map(u => {
        const s = userStats[u.id];
        return {
          ...u,
          assetStats: {
            totalTrades: s.total,
            winRate: s.wins / s.total,
            avgRR: s.rrCount > 0 ? s.rrSum / s.rrCount : 0,
            points: s.points,
          },
        };
      });
  }

  // Sort by points / win rate / consistency
  rankedUsers.sort((a, b) => {
    const aScore = assetClass !== 'overall'
      ? (a.assetStats?.points || 0)
      : (a.consistency?.consistencyScore || 0);
    const bScore = assetClass !== 'overall'
      ? (b.assetStats?.points || 0)
      : (b.consistency?.consistencyScore || 0);
    return bScore - aScore;
  });

  const leaderboard = rankedUsers.slice(0, limit).map((u, idx) => ({
    rank: idx + 1,
    userId: u.id,
    displayName: u.displayName || u.name || u.email?.split('@')[0],
    profileSlug: u.profileSlug,
    tradingStyle: u.tradingStyle,
    verifiedBadge: u.verifiedBadge,
    consistencyScore: u.consistency?.consistencyScore,
    winRate: assetClass !== 'overall' ? u.assetStats?.winRate : u.consistency?.winRate,
    avgRR: assetClass !== 'overall' ? u.assetStats?.avgRR : u.consistency?.avgRR,
    totalTrades: assetClass !== 'overall' ? u.assetStats?.totalTrades : u.consistency?.totalTrades,
    points: assetClass !== 'overall' ? u.assetStats?.points : u.consistency?.consistencyScore,
  }));

  return Response.json({ leaderboard, assetClass, period, total: leaderboard.length });
}
