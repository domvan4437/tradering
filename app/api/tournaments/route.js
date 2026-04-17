
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '../../../lib/prisma';

export async function GET(req) {
  const tournaments = await prisma.tournament.findMany({
    include: {
      _count: { select: { entries: true } },
      entries: { select: { score: true, userId: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  return Response.json({ tournaments });
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    name, description, type, prizePool, entryFee, startDate, endDate,
    traderStyle, minHoldHours, maxHoldHours, maxTradesPerWeek,
    minRiskReward, maxRiskPct, allowedAssets, requireStopLoss, requireTarget
  } = body;

  const tournament = await prisma.tournament.create({
    data: {
      name, description, type,
      prizePool: prizePool ? parseFloat(prizePool) : null,
      entryFee: entryFee ? parseFloat(entryFee) : 0,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      creatorId: session.user.id,
      // Filter rules
      traderStyle: traderStyle || null,
      minHoldHours: minHoldHours ? parseInt(minHoldHours) : null,
      maxHoldHours: maxHoldHours ? parseInt(maxHoldHours) : null,
      maxTradesPerWeek: maxTradesPerWeek ? parseInt(maxTradesPerWeek) : null,
      minRiskReward: minRiskReward ? parseFloat(minRiskReward) : null,
      maxRiskPct: maxRiskPct ? parseFloat(maxRiskPct) : null,
      allowedAssets: allowedAssets?.length ? JSON.stringify(allowedAssets) : null,
      requireStopLoss: requireStopLoss !== false,
      requireTarget: requireTarget !== false,
    }
  });

  return Response.json({ tournament });
}
