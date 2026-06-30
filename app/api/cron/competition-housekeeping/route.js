
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

const plaidClient = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: { headers: {
    'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
    'PLAID-SECRET': process.env.PLAID_SECRET,
  }},
}));

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
    where: { status: 'active', endDate: { lt: now } },
    include: { tournament: { select: { buyIn: true } } },
  });

  for (const match of expiredMatches) {
    const participants = [match.challengerId, match.opponentId].filter(Boolean);
    const isPaid = (match.tournament?.buyIn || 0) > 0;
    let cScore = 0, oScore = 0;

    if (!isPaid) {
      // Free match: score from paper trading portfolios
      const portfolios = await prisma.competitionPortfolio.findMany({
        where: { competitionId: match.id, userId: { in: participants } },
        include: { trades: true, positions: true },
      });
      for (const p of portfolios) {
        const realized = p.trades.reduce((s, t) => s + (t.pnl || 0), 0);
        const unrealized = p.positions.reduce((s, pos) => {
          const mult = pos.direction === 'short' ? -1 : 1;
          return s + (pos.currentPrice - pos.entryPrice) * pos.quantity * mult;
        }, 0);
        const totalPnL = realized + unrealized;
        if (p.userId === match.challengerId) cScore = totalPnL;
        else oScore = totalPnL;
      }
    } else {
      // Paid match: score from real broker trades
      const brokerTrades = await prisma.brokerTrade.findMany({
        where: { userId: { in: participants }, status: 'closed' },
      });
      for (const t of brokerTrades) {
        if (t.userId === match.challengerId) cScore += (t.realizedPnL || 0);
        else oScore += (t.realizedPnL || 0);
      }
    }

    await prisma.h2HMatch.update({
      where: { id: match.id },
      data: {
        status: 'completed',
        challengerScore: +cScore.toFixed(2),
        opponentScore: +oScore.toFixed(2),
        winnerId: cScore >= oScore ? match.challengerId : match.opponentId,
      }
    });
    log.push(`Resolved H2H match ${match.id} (${isPaid ? 'paid' : 'free'}): challenger ${cScore.toFixed(2)} vs opponent ${oScore.toFixed(2)}`);
  }

  // 3. Clean up waiting H2H slots older than 48h (abandoned)
  const staleWaiting = await prisma.h2HMatch.deleteMany({
    where: {
      status: 'waiting',
      createdAt: { lt: new Date(now - 48 * 60 * 60 * 1000) }
    }
  });
  log.push(`Cleaned ${staleWaiting.count} stale H2H queue entries`);

  // 4. Auto-sync Plaid connections for users in active paid matches
  try {
    const paidActiveMatches = await prisma.h2HMatch.findMany({
      where: { status: 'active' },
      include: { tournament: { select: { buyIn: true } } },
    });
    const paidMatches = paidActiveMatches.filter(m => (m.tournament?.buyIn || 0) > 0);
    const userIds = [...new Set(paidMatches.flatMap(m => [m.challengerId, m.opponentId].filter(Boolean)))];

    if (userIds.length > 0) {
      const plaidConns = await prisma.brokerConnection.findMany({
        where: { userId: { in: userIds }, status: 'connected', broker: { not: 'webhook' } },
      });

      for (const conn of plaidConns) {
        if (!conn.accessToken) continue;
        try {
          const endDate = new Date().toISOString().slice(0, 10);
          const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          const invRes = await plaidClient.investmentsTransactionsGet({
            access_token: conn.accessToken, start_date: startDate, end_date: endDate,
          });
          const txns = invRes.data.investment_transactions || [];
          let synced = 0;
          for (const txn of txns) {
            const exists = await prisma.brokerTrade.findFirst({
              where: { connectionId: conn.id, brokerTradeId: txn.investment_transaction_id },
            });
            if (!exists) {
              await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id,
                  userId: conn.userId,
                  brokerTradeId: txn.investment_transaction_id,
                  asset: txn.security?.ticker_symbol || 'Unknown',
                  symbol: txn.security?.ticker_symbol || 'UNK',
                  direction: (txn.quantity || 0) > 0 ? 'long' : 'short',
                  entryPrice: Math.abs(txn.price || 0),
                  quantity: Math.abs(txn.quantity || 1),
                  status: 'closed',
                  openedAt: new Date(txn.date),
                  closedAt: new Date(txn.date),
                  realizedPnL: txn.amount ? -txn.amount : 0,
                },
              });
              synced++;
            }
          }
          await prisma.brokerConnection.update({ where: { id: conn.id }, data: { lastSynced: new Date() } });
          if (synced > 0) log.push(`Plaid sync user ${conn.userId}: +${synced} trades`);
        } catch (e) {
          log.push(`Plaid sync failed for conn ${conn.id}: ${e.message}`);
        }
      }
    }
  } catch (e) {
    log.push(`Plaid auto-sync error: ${e.message}`);
  }

  return NextResponse.json({ success: true, log });
}
