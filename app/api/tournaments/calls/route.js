
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { validateTradeCall, checkWeeklyTradeLimit, calculateRR } from '../../../../lib/competitionValidator';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { tournamentId, commodity, direction, entryPrice, stopLoss, takeProfit, riskPct, notes } = body;

  // Fetch tournament with all filter rules
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

  // Check tournament is active
  const now = new Date();
  if (now < new Date(tournament.startDate) || now > new Date(tournament.endDate)) {
    return Response.json({ error: 'Tournament is not currently active' }, { status: 400 });
  }

  // Check user is entered
  const entry = await prisma.tournamentEntry.findFirst({
    where: { tournamentId, userId: session.user.id }
  });
  if (!entry) return Response.json({ error: 'You have not entered this tournament' }, { status: 400 });

  // Check weekly trade limit
  const existingCalls = await prisma.tradeCall.findMany({
    where: { tournamentId, userId: session.user.id }
  });
  const weeklyCheck = checkWeeklyTradeLimit(existingCalls, tournament);
  if (!weeklyCheck.allowed) {
    return Response.json({
      error: `Weekly trade limit reached (${weeklyCheck.count}/${weeklyCheck.max}). Wait until next week to submit more trades.`
    }, { status: 400 });
  }

  // Calculate R:R
  const riskReward = calculateRR(entryPrice, stopLoss, takeProfit, direction);

  // Build trade call object for validation
  const tradeCallData = {
    commodity,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    riskPct,
    riskReward,
    entryTimestamp: now,
    validationStatus: 'pending',
  };

  // Run pre-entry validation (stop loss, target, R:R, asset whitelist)
  const validation = validateTradeCall(tradeCallData, tournament);
  if (!validation.valid) {
    return Response.json({ error: validation.reason }, { status: 400 });
  }

  // Create the trade call
  const call = await prisma.tradeCall.create({
    data: {
      tournamentId,
      userId: session.user.id,
      commodity,
      direction,
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      riskPct: riskPct ? parseFloat(riskPct) : null,
      riskReward,
      notes,
      entryTimestamp: now,
      validationStatus: 'pending',
    }
  });

  return Response.json({ success: true, call });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get('tournamentId');

  const calls = await prisma.tradeCall.findMany({
    where: { tournamentId },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return Response.json({ calls });
}
