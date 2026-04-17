
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '../../../../../lib/prisma';
import { checkAccountEligibility, isSuspiciousH2HPair } from '../../../../../lib/accountGuard';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tournamentId } = await req.json();
  const userId = session.user.id;

  // Account age guard
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const eligibility = await checkAccountEligibility(user, prisma);
  if (!eligibility.eligible) {
    return Response.json({ error: eligibility.errors[0] }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament || tournament.type !== 'h2h') {
    return Response.json({ error: 'Not a valid H2H competition' }, { status: 400 });
  }

  // Check not already in an active match for this tournament
  const activeMatch = await prisma.h2HMatch.findFirst({
    where: {
      tournamentId,
      status: { in: ['waiting', 'active'] },
      OR: [{ challengerId: userId }, { opponentId: userId }]
    }
  });
  if (activeMatch) {
    return Response.json({ match: activeMatch, alreadyQueued: true });
  }

  // Find a waiting match to join — RANDOM selection (not FIFO)
  // This prevents alt-account manipulation (you can't predict who you'll face)
  const waitingMatches = await prisma.h2HMatch.findMany({
    where: {
      tournamentId,
      status: 'waiting',
      challengerId: { not: userId }, // can't match yourself
    },
    include: { challenger: { select: { id: true, createdAt: true } } }
  });

  // Filter out suspicious pairs
  const safeMatches = [];
  for (const m of waitingMatches) {
    const suspicious = await isSuspiciousH2HPair(userId, m.challengerId, prisma);
    if (!suspicious) safeMatches.push(m);
  }

  if (safeMatches.length > 0) {
    // Pick a RANDOM waiting match (not the oldest — prevents queue manipulation)
    const randomMatch = safeMatches[Math.floor(Math.random() * safeMatches.length)];

    const startDate = new Date();
    const endDate = new Date(tournament.endDate);

    const match = await prisma.h2HMatch.update({
      where: { id: randomMatch.id },
      data: {
        opponentId: userId,
        status: 'active',
        startDate,
        endDate,
      },
      include: {
        challenger: { select: { id: true, name: true } },
        opponent: { select: { id: true, name: true } },
      }
    });

    // Create tournament entries for both if not already there
    await prisma.tournamentEntry.upsert({
      where: { tournamentId_userId: { tournamentId, userId: match.challengerId } },
      create: { tournamentId, userId: match.challengerId, score: 0 },
      update: {},
    }).catch(() => {});

    await prisma.tournamentEntry.upsert({
      where: { tournamentId_userId: { tournamentId, userId } },
      create: { tournamentId, userId, score: 0 },
      update: {},
    }).catch(() => {});

    return Response.json({ match, matched: true });
  }

  // No match available — create a new waiting slot
  const newMatch = await prisma.h2HMatch.create({
    data: { tournamentId, challengerId: userId, status: 'waiting' }
  });

  return Response.json({ match: newMatch, matched: false, message: 'In queue — waiting for opponent' });
}

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get('tournamentId');

  const match = await prisma.h2HMatch.findFirst({
    where: {
      tournamentId,
      OR: [{ challengerId: session.user.id }, { opponentId: session.user.id }],
      status: { in: ['waiting', 'active'] }
    },
    include: {
      challenger: { select: { id: true, name: true, email: true } },
      opponent: { select: { id: true, name: true, email: true } },
    }
  });

  return Response.json({ match });
}
