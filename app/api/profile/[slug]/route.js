import { prisma } from '../../../../lib/prisma';
import { getSession } from '../../../../lib/auth';

export async function GET(req, { params }) {
  const { slug } = params;
  const session = await getSession();

  const user = await prisma.user.findFirst({
    where: { OR: [{ profileSlug: slug }, { id: slug }] },
    include: {
      consistency: true,
      screenerTemplates: { where: { isPublic: true }, take: 6, orderBy: { useCount: 'desc' } },
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user) return Response.json({ error: 'Profile not found' }, { status: 404 });
  if (user.profileVisibility === 'private') return Response.json({ error: 'This profile is private' }, { status: 403 });

  // Check if current user is following this profile
  let isFollowing = false;
  if (session?.user?.id && session.user.id !== user.id) {
    const follow = await prisma.userFollow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } }
    });
    isFollowing = !!follow;
  }

  // Posts
  const posts = await prisma.socialPost.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { _count: { select: { comments: true, postLikes: true } } }
  });

  // Trade calls
  const tradeCalls = user.profileVisibility === 'public'
    ? await prisma.tradeCall.findMany({
        where: { userId: user.id, validationStatus: 'valid' },
        orderBy: { submittedAt: 'desc' },
        take: 50,
      })
    : [];

  // Competition results
  const competitionResults = await prisma.tournamentEntry.findMany({
    where: { userId: user.id },
    include: { tournament: { select: { name: true, traderStyle: true, endDate: true, prizePool: true } } },
    orderBy: { score: 'desc' },
    take: 20,
  });

  // Groups owned + member of
  const ownedGroups = await prisma.group.findMany({
    where: { ownerId: user.id, isPublic: true },
    include: { _count: { select: { members: true } } },
    take: 10,
  });

  const memberGroups = await prisma.groupMember.findMany({
    where: { userId: user.id, role: { not: 'owner' } },
    include: { group: { include: { _count: { select: { members: true } }, owner: { select: { name: true, profileSlug: true } } } } },
    take: 10,
  });

  // Followers list
  const followers = await prisma.userFollow.findMany({
    where: { followingId: user.id },
    include: { follower: { select: { id: true, name: true, displayName: true, profileSlug: true, verifiedBadge: true, tradingStyle: true } } },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Following list
  const following = await prisma.userFollow.findMany({
    where: { followerId: user.id },
    include: { following: { select: { id: true, name: true, displayName: true, profileSlug: true, verifiedBadge: true, tradingStyle: true } } },
    take: 50,
    orderBy: { createdAt: 'desc' },
  });

  // Leaderboard positions
  const leaderboardPositions = await prisma.leaderboardSnapshot.findMany({
    where: { userId: user.id, period: 'monthly' },
    orderBy: { snappedAt: 'desc' },
    take: 6,
  });

  // Stats
  const wins = tradeCalls.filter(c => c.status === 'won').length;
  const losses = tradeCalls.filter(c => c.status === 'lost').length;
  const total = wins + losses;
  const winRate = total > 0 ? (wins / total * 100).toFixed(1) : null;
  const avgRR = tradeCalls.filter(c => c.rMultiple).length > 0
    ? (tradeCalls.reduce((s,c) => s + (c.rMultiple||0), 0) / tradeCalls.filter(c=>c.rMultiple).length).toFixed(2)
    : null;

  return Response.json({
    profile: {
      id: user.id,
      displayName: user.displayName || user.name || user.email?.split('@')[0],
      bio: user.bio,
      tradingStyle: user.tradingStyle,
      primaryAssets: user.primaryAssets ? (typeof user.primaryAssets === 'string' ? JSON.parse(user.primaryAssets) : user.primaryAssets) : [],
      profileVisibility: user.profileVisibility,
      verifiedBadge: user.verifiedBadge,
      badgeEarnedAt: user.badgeEarnedAt,
      twitterHandle: user.twitterHandle,
      instagramHandle: user.instagramHandle,
      youtubeHandle: user.youtubeHandle,
      tradingviewHandle: user.tradingviewHandle,
      profileSlug: user.profileSlug,
      joinedAt: user.createdAt,
      consistency: user.consistency,
      publicScreeners: user.screenerTemplates,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    },
    isFollowing,
    stats: { totalVerifiedTrades: total, wins, losses, winRate, avgRR },
    posts,
    tradeCalls,
    competitionResults,
    ownedGroups,
    memberGroups: memberGroups.map(m => m.group),
    followers: followers.map(f => f.follower),
    following: following.map(f => f.following),
    leaderboardPositions,
  });
}
