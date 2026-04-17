
/**
 * TraderConsistency Score Engine
 *
 * Score 0-100 based on:
 *  - Win rate (40 pts)
 *  - Average R:R quality (30 pts)
 *  - Hold time consistency (15 pts) — not wild swings in hold duration
 *  - Trade frequency consistency (15 pts) — steady cadence
 *
 * Updated after every resolved trade call.
 */

export async function updateConsistencyScore(userId, prisma) {
  // Get last 50 resolved trades for this user across all tournaments
  const trades = await prisma.tradeCall.findMany({
    where: {
      userId,
      validationStatus: 'valid',
      result: { in: ['win', 'loss'] },
    },
    orderBy: { closeTimestamp: 'desc' },
    take: 50,
  });

  if (trades.length < 3) {
    // Not enough data yet — set a neutral score
    await prisma.traderConsistency.upsert({
      where: { userId },
      create: { userId, totalTrades: trades.length, consistencyScore: 0 },
      update: { totalTrades: trades.length, lastUpdated: new Date() },
    });
    return;
  }

  const wins = trades.filter(t => t.result === 'win').length;
  const winRate = wins / trades.length;

  // Average R:R (only trades that have it)
  const rrTrades = trades.filter(t => t.riskReward && t.riskReward > 0);
  const avgRR = rrTrades.length > 0
    ? rrTrades.reduce((s, t) => s + t.riskReward, 0) / rrTrades.length
    : 0;

  // Hold time consistency (lower std deviation = more consistent)
  const holdTrades = trades.filter(t => t.holdHours && t.holdHours > 0);
  const avgHold = holdTrades.length > 0
    ? holdTrades.reduce((s, t) => s + t.holdHours, 0) / holdTrades.length
    : 0;
  const holdStdDev = holdTrades.length > 1
    ? Math.sqrt(holdTrades.reduce((s, t) => s + Math.pow(t.holdHours - avgHold, 2), 0) / holdTrades.length)
    : 0;
  const holdConsistency = avgHold > 0 ? Math.max(0, 1 - (holdStdDev / avgHold)) : 0;

  // Infer trader style from average hold
  let traderStyle = null;
  if (avgHold < 1) traderStyle = 'scalper';
  else if (avgHold < 24) traderStyle = 'daytrader';
  else if (avgHold < 240) traderStyle = 'swing';
  else if (avgHold < 1344) traderStyle = 'position';
  else traderStyle = 'macro';

  // Scoring
  const winScore = winRate * 40;                                    // 0-40
  const rrScore = Math.min(avgRR / 3, 1) * 30;                     // 0-30 (capped at 3:1)
  const holdScore = holdConsistency * 15;                           // 0-15
  const freqScore = Math.min(trades.length / 20, 1) * 15;          // 0-15 (more data = more reliable)

  const consistencyScore = Math.round(winScore + rrScore + holdScore + freqScore);

  await prisma.traderConsistency.upsert({
    where: { userId },
    create: {
      userId, totalTrades: trades.length, winRate, avgRR,
      avgHoldHours: avgHold, traderStyle, consistencyScore,
    },
    update: {
      totalTrades: trades.length, winRate, avgRR,
      avgHoldHours: avgHold, traderStyle, consistencyScore,
      lastUpdated: new Date(),
    },
  });

  return consistencyScore;
}
