
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';

// Badge criteria:
// - At least 50 verified trade calls
// - Account at least 90 days old
// - Win rate >= 50%
// - Average R:R >= 1.2
// - Profile visibility = public

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { consistency: true },
  });

  if (!user) return Response.json({ error: 'Not found' }, { status: 404 });
  if (user.verifiedBadge) return Response.json({ alreadyVerified: true });

  // Check criteria
  const accountAgeDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const cons = user.consistency;

  const criteria = {
    accountAge:   accountAgeDays >= 90,
    enoughTrades: (cons?.totalTrades || 0) >= 50,
    winRate:      (cons?.winRate || 0) >= 0.50,
    avgRR:        (cons?.avgRR || 0) >= 1.2,
    isPublic:     user.profileVisibility === 'public',
  };

  const allMet = Object.values(criteria).every(Boolean);

  if (!allMet) {
    return Response.json({
      eligible: false,
      criteria,
      missing: Object.entries(criteria).filter(([, v]) => !v).map(([k]) => k),
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { verifiedBadge: true, badgeEarnedAt: new Date() },
  });

  return Response.json({ eligible: true, awarded: true, criteria });
}
