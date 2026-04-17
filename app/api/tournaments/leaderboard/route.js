
import { prisma } from '../../../../lib/prisma';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get('tournamentId');

  const [entries, calls] = await Promise.all([
    prisma.tournamentEntry.findMany({
      where: { tournamentId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
          include: { consistency: true }
        }
      },
      orderBy: { score: 'desc' }
    }),
    prisma.tradeCall.findMany({
      where: { tournamentId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  // Enrich entries with trade stats
  const enriched = entries.map((entry, idx) => {
    const userCalls = calls.filter(c => c.userId === entry.userId);
    const validCalls = userCalls.filter(c => c.validationStatus === 'valid' && c.result);
    const wins = validCalls.filter(c => c.result === 'win').length;
    const avgRR = validCalls.filter(c => c.riskReward).length > 0
      ? (validCalls.reduce((s, c) => s + (c.riskReward || 0), 0) / validCalls.filter(c => c.riskReward).length).toFixed(2)
      : null;

    return {
      rank: idx + 1,
      userId: entry.userId,
      name: entry.user.name || entry.user.email,
      score: entry.score,
      totalTrades: userCalls.length,
      validTrades: validCalls.length,
      wins,
      losses: validCalls.length - wins,
      winRate: validCalls.length > 0 ? ((wins / validCalls.length) * 100).toFixed(1) : '0.0',
      avgRR,
      consistencyScore: entry.user.consistency?.consistencyScore || null,
      traderStyle: entry.user.consistency?.traderStyle || null,
    };
  });

  return Response.json({ leaderboard: enriched, trades: calls });
}
