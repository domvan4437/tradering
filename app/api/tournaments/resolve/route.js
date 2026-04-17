
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { validateTradeCall } from '../../../../lib/competitionValidator';
import { updateConsistencyScore } from '../../../../lib/consistencyScore';

async function fetchCurrentPrice(symbol) {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch { return null; }
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tournamentId } = await req.json();
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return Response.json({ error: 'Not found' }, { status: 404 });

  const openCalls = await prisma.tradeCall.findMany({
    where: { tournamentId, result: null, validationStatus: { not: 'disqualified' } }
  });

  const now = new Date();
  const results = [];
  const usersToUpdate = new Set();

  for (const call of openCalls) {
    const currentPrice = await fetchCurrentPrice(call.commodity);
    if (!currentPrice) continue;

    const holdMs = now - new Date(call.entryTimestamp || call.createdAt);
    const holdHours = holdMs / (1000 * 60 * 60);

    // Not held long enough yet — update note and skip
    if (tournament.minHoldHours && holdHours < tournament.minHoldHours) {
      await prisma.tradeCall.update({
        where: { id: call.id },
        data: {
          validationStatus: 'pending',
          disqualReason: `Must hold ${tournament.minHoldHours}h minimum (at ${holdHours.toFixed(1)}h)`
        }
      });
      continue;
    }

    // Held too long — auto-disqualify
    if (tournament.maxHoldHours && holdHours > tournament.maxHoldHours) {
      await prisma.tradeCall.update({
        where: { id: call.id },
        data: {
          result: 'disqualified',
          validationStatus: 'disqualified',
          disqualReason: `Max hold ${tournament.maxHoldHours}h exceeded (held ${holdHours.toFixed(1)}h)`,
          closeTimestamp: now,
          holdHours: parseFloat(holdHours.toFixed(2)),
        }
      });
      results.push({ callId: call.id, result: 'disqualified' });
      continue;
    }

    // Determine win/loss
    let result = null;
    let pnlPoints = 0;
    const direction = call.direction?.toUpperCase();

    if (direction === 'LONG') {
      if (call.takeProfit && currentPrice >= call.takeProfit) result = 'win';
      else if (call.stopLoss && currentPrice <= call.stopLoss) result = 'loss';
    } else if (direction === 'SHORT') {
      if (call.takeProfit && currentPrice <= call.takeProfit) result = 'win';
      else if (call.stopLoss && currentPrice >= call.stopLoss) result = 'loss';
    }

    if (result) {
      const rr = call.riskReward || 1;
      pnlPoints = result === 'win' ? Math.round(10 + (rr * 5)) : -10;

      await prisma.tradeCall.update({
        where: { id: call.id },
        data: {
          result,
          pnlPoints,
          closePrice: currentPrice,
          closeTimestamp: now,
          holdHours: parseFloat(holdHours.toFixed(2)),
          validationStatus: 'valid',
          disqualReason: null,
        }
      });

      // Update tournament entry score
      await prisma.tournamentEntry.updateMany({
        where: { tournamentId, userId: call.userId },
        data: { score: { increment: pnlPoints } }
      });

      usersToUpdate.add(call.userId);
      results.push({ callId: call.id, result, pnlPoints });
    }
  }

  // Update consistency scores for all affected users
  for (const userId of usersToUpdate) {
    await updateConsistencyScore(userId, prisma).catch(console.error);
  }

  // Also resolve H2H match scores if applicable
  const h2hMatches = await prisma.h2HMatch.findMany({
    where: { tournamentId, status: 'active' }
  });
  for (const match of h2hMatches) {
    const calls = await prisma.tradeCall.findMany({
      where: {
        tournamentId,
        userId: { in: [match.challengerId, match.opponentId].filter(Boolean) },
        validationStatus: 'valid',
        result: { not: null },
      }
    });
    let cScore = 0, oScore = 0;
    for (const c of calls) {
      if (c.userId === match.challengerId) cScore += (c.pnlPoints || 0);
      else oScore += (c.pnlPoints || 0);
    }
    const ended = match.endDate && now > new Date(match.endDate);
    await prisma.h2HMatch.update({
      where: { id: match.id },
      data: {
        challengerScore: cScore,
        opponentScore: oScore,
        status: ended ? 'completed' : 'active',
        winnerId: ended ? (cScore >= oScore ? match.challengerId : match.opponentId) : null,
      }
    });
  }

  return Response.json({ resolved: results.length, results });
}
