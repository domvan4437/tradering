
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    displayName, bio, tradingStyle, primaryAssets,
    profileVisibility, twitterHandle, profileSlug, propFirmInterest,
  } = body;

  // Validate slug uniqueness if provided
  if (profileSlug) {
    const existing = await prisma.user.findFirst({
      where: { profileSlug, NOT: { id: session.user.id } },
    });
    if (existing) return Response.json({ error: 'That profile URL is already taken' }, { status: 400 });
    if (!/^[a-z0-9-]{3,30}$/.test(profileSlug)) {
      return Response.json({ error: 'Profile URL must be 3-30 lowercase letters, numbers, or hyphens' }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      displayName: displayName || undefined,
      bio: bio !== undefined ? bio : undefined,
      tradingStyle: tradingStyle || undefined,
      primaryAssets: primaryAssets ? JSON.stringify(primaryAssets) : undefined,
      profileVisibility: profileVisibility || undefined,
      twitterHandle: twitterHandle || undefined,
      profileSlug: profileSlug || undefined,
      propFirmInterest: propFirmInterest !== undefined ? propFirmInterest : undefined,
    },
  });

  return Response.json({ success: true, user });
}
