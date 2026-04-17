
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { matchId } = await req.json();

  const match = await prisma.h2HMatch.findUnique({
    where: { id: matchId },
    include: { tournament: true }
  });
  if (!match) return Response.json({ error: 'Match not found' }, { status: 404 });

  // Tally scores from trade calls
  const calls = await prisma.tradeCall.findMany({
    where: {
      tournamentId: match.tournamentId,
      userId: { in: [match.challengerId, match.opponentId].filter(Boolean) },
      validationStatus: 'valid',
      result: { not: null },
    }
  });

  let challengerScore = 0, opponentScore = 0;
  for (const call of calls) {
    const pts = call.pnlPoints || 0;
    if (call.userId === match.challengerId) challengerScore += pts;
    else if (call.userId === match.opponentId) opponentScore += pts;
  }

  // Determine winner if match has ended
  const now = new Date();
  const ended = match.endDate && now > new Date(match.endDate);
  const winnerId = ended
    ? (challengerScore >= opponentScore ? match.challengerId : match.opponentId)
    : null;

  const updated = await prisma.h2HMatch.update({
    where: { id: matchId },
    data: {
      challengerScore,
      opponentScore,
      status: ended ? 'completed' : 'active',
      winnerId,
    }
  });

  return Response.json({ match: updated, challengerScore, opponentScore, winnerId });
}
