
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Cron: runs periodically to:
 * 1. Auto-disqualify trades held too long
 * 2. Resolve completed H2H matches
 * 3. Clean up expired waiting H2H queue slots
 *
 * Schedule in vercel.json:
 * { "crons": [{ "path": "/api/cron/competition-housekeeping", "schedule": "0 * * * *" }] }
 *
 * Protected by CRON_SECRET header
 */
export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const log = [];

  // 1. Auto-disqualify overdue trades
  const activeTournaments = await prisma.tournament.findMany({
    where: { endDate: { gt: now }, maxHoldHours: { not: null } }
  });

  for (const t of activeTournaments) {
    const cutoff = new Date(now - t.maxHoldHours * 60 * 60 * 1000);
    const overdueCalls = await prisma.tradeCall.findMany({
      where: {
        tournamentId: t.id,
        result: null,
        validationStatus: { not: 'disqualified' },
        entryTimestamp: { lt: cutoff },
      }
    });

    for (const call of overdueCalls) {
      const holdMs = now - new Date(call.entryTimestamp);
      const holdHours = (holdMs / (1000 * 60 * 60)).toFixed(1);
      await prisma.tradeCall.update({
        where: { id: call.id },
        data: {
          result: 'disqualified',
          validationStatus: 'disqualified',
          disqualReason: `Auto-disqualified: held ${holdHours}h, max ${t.maxHoldHours}h`,
          closeTimestamp: now,
          holdHours: parseFloat(holdHours),
        }
      });
      log.push(`DQ trade ${call.id} in tournament ${t.id}`);
    }
  }

  // 2. Resolve expired H2H matches
  const expiredMatches = await prisma.h2HMatch.findMany({
    where: { status: 'active', endDate: { lt: now } }
  });

  for (const match of expiredMatches) {
    const calls = await prisma.tradeCall.findMany({
      where: {
        tournamentId: match.tournamentId,
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
    await prisma.h2HMatch.update({
      where: { id: match.id },
      data: {
        status: 'completed',
        challengerScore: cScore,
        opponentScore: oScore,
        winnerId: cScore >= oScore ? match.challengerId : match.opponentId,
      }
    });
    log.push(`Resolved H2H match ${match.id}`);
  }

  // 3. Clean up waiting H2H slots older than 48h (abandoned)
  const staleWaiting = await prisma.h2HMatch.deleteMany({
    where: {
      status: 'waiting',
      createdAt: { lt: new Date(now - 48 * 60 * 60 * 1000) }
    }
  });
  log.push(`Cleaned ${staleWaiting.count} stale H2H queue entries`);

  return NextResponse.json({ success: true, log });
}
