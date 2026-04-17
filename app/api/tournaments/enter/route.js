
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import { checkAccountEligibility } from '../../../../lib/accountGuard';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { tournamentId } = await req.json();

  // Get full user record for eligibility checks
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  // Account age + verification guard
  const eligibility = await checkAccountEligibility(user, prisma);
  if (!eligibility.eligible) {
    return Response.json({ error: eligibility.errors[0] }, { status: 403 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 });

  // Check not already entered
  const existing = await prisma.tournamentEntry.findFirst({
    where: { tournamentId, userId: session.user.id }
  });
  if (existing) return Response.json({ error: 'Already entered' }, { status: 400 });

  // Check tournament hasn't ended
  if (new Date() > new Date(tournament.endDate)) {
    return Response.json({ error: 'This competition has ended' }, { status: 400 });
  }

  const entry = await prisma.tournamentEntry.create({
    data: { tournamentId, userId: session.user.id, score: 0 }
  });

  return Response.json({ success: true, entry });
}
