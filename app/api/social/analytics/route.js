import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const now = new Date()
    const ago7d  = new Date(now - 7  * 86400000)
    const ago30d = new Date(now - 30 * 86400000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // ── Followers ───────────────────────────────────────────────────
    const [followersTotal, followersThisWeek] = await Promise.all([
      prisma.userFollow.count({ where: { followingId: uid } }),
      prisma.userFollow.count({ where: { followingId: uid, createdAt: { gte: ago7d } } }),
    ])

    // ── Follower growth: new followers per week, last 7 weeks ───────
    const followerGrowth = []
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 86400000)
      const weekEnd   = new Date(now.getTime() - i * 7 * 86400000)
      const count = await prisma.userFollow.count({
        where: { followingId: uid, createdAt: { gte: weekStart, lt: weekEnd } },
      })
      followerGrowth.push(count)
    }
    const netNewThisMonth = await prisma.userFollow.count({
      where: { followingId: uid, createdAt: { gte: startOfMonth } },
    })

    // ── My posts in last 30d ────────────────────────────────────────
    const myPosts = await prisma.socialPost.findMany({
      where: { userId: uid, groupId: null, createdAt: { gte: ago30d } },
      select: {
        id: true,
        content: true,
        likes: true,
        reposts: true,
        createdAt: true,
        _count: { select: { comments: true } },
      },
      orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    })
    const posts30dCount = myPosts.length
    const avgLikes    = posts30dCount ? +(myPosts.reduce((s, p) => s + p.likes, 0)           / posts30dCount).toFixed(1) : 0
    const avgReposts  = posts30dCount ? +(myPosts.reduce((s, p) => s + p.reposts, 0)         / posts30dCount).toFixed(1) : 0
    const avgComments = posts30dCount ? +(myPosts.reduce((s, p) => s + p._count.comments, 0) / posts30dCount).toFixed(1) : 0

    // Engagement rate = (avg likes + avg comments) / followers * 100
    const engageRate = posts30dCount && followersTotal > 0
      ? +((myPosts.reduce((s, p) => s + p.likes + p._count.comments, 0) / posts30dCount / followersTotal) * 100).toFixed(1)
      : null

    // Top 3 posts by total engagement
    const topPosts = myPosts.slice(0, 3).map(p => ({
      preview: p.content.length > 45 ? p.content.slice(0, 45) + '…' : p.content || '(image / poll)',
      engagement: p.likes + p.reposts + p._count.comments,
      likes: p.likes,
      comments: p._count.comments,
    }))

    // ── Groups owned by current user ────────────────────────────────
    const myGroups = await prisma.group.findMany({
      where: { ownerId: uid },
      select: { id: true, _count: { select: { members: true } } },
    })
    const activeGroups       = myGroups.length
    const totalGroupMembers  = myGroups.reduce((s, g) => s + g._count.members, 0)
    const groupIds           = myGroups.map(g => g.id)

    const [newGroupMembersMonth, groupPosts7d] = await Promise.all([
      groupIds.length
        ? prisma.groupMember.count({ where: { groupId: { in: groupIds }, joinedAt: { gte: startOfMonth } } })
        : Promise.resolve(0),
      groupIds.length
        ? prisma.socialPost.count({ where: { groupId: { in: groupIds }, createdAt: { gte: ago7d } } })
        : Promise.resolve(0),
    ])

    // Active members (7d): unique users who posted in my groups in last 7d
    const activeGroupMembers = groupIds.length
      ? await prisma.socialPost.groupBy({
          by: ['userId'],
          where: { groupId: { in: groupIds }, createdAt: { gte: ago7d } },
        }).then(r => r.length)
      : 0

    // ── Audience interests: followers' primaryAssets ────────────────
    // primaryAssets is a comma-separated string like "Gold, EUR/USD, Bitcoin, Stocks"
    const followerProfiles = await prisma.userFollow.findMany({
      where: { followingId: uid },
      select: { follower: { select: { primaryAssets: true } } },
      take: 500,
    })

    // Map each asset token to a category bucket
    const ASSET_BUCKETS = {
      Commodities: ['Gold','Silver','Crude Oil','Natural Gas','Wheat','Corn','Soybeans','Oil','Commodity','Commodities'],
      Forex:       ['EUR/USD','GBP/USD','AUD/USD','USD/JPY','USD/CAD','NZD/USD','EUR/GBP','Forex','FX','Currency'],
      Crypto:      ['Bitcoin','Ethereum','BTC','ETH','Crypto','Solana','XRP','Litecoin','USDT','Altcoin'],
      Stocks:      ['Stocks','Stock','Equities','S&P','SPY','QQQ','Equity','Shares'],
      Futures:     ['ES Futures','NQ Futures','Futures','MES','MNQ','YM','RTY','CL','GC','SI'],
    }
    const bucketCounts = { Commodities: 0, Forex: 0, Crypto: 0, Stocks: 0, Futures: 0 }
    let totalAssetMentions = 0

    followerProfiles.forEach(f => {
      const assets = f.follower?.primaryAssets
      if (!assets) return
      // primaryAssets can be string (comma-separated) or array
      const list = Array.isArray(assets) ? assets : assets.split(',').map(s => s.trim()).filter(Boolean)
      list.forEach(asset => {
        for (const [bucket, keywords] of Object.entries(ASSET_BUCKETS)) {
          if (keywords.some(k => asset.toLowerCase().includes(k.toLowerCase()))) {
            bucketCounts[bucket]++
            totalAssetMentions++
            break
          }
        }
      })
    })

    const denominator = totalAssetMentions || 1
    const audienceInterests = [
      { label: 'Commodities', key: 'Commodities', color: '#633806' },
      { label: 'Forex',       key: 'Forex',       color: '#085041' },
      { label: 'Crypto',      key: 'Crypto',       color: '#3C3489' },
      { label: 'Stocks',      key: 'Stocks',       color: '#791F1F' },
      { label: 'Futures',     key: 'Futures',      color: '#444441' },
    ].map(({ label, key, color }) => ({
      label,
      pct: Math.round((bucketCounts[key] / denominator) * 100),
      color,
    }))

    return Response.json({
      followersTotal,
      followersThisWeek,
      netNewThisMonth,
      followerGrowth,
      posts30dCount,
      avgLikes,
      avgReposts,
      avgComments,
      engageRate,
      topPosts,
      activeGroups,
      totalGroupMembers,
      newGroupMembersMonth,
      groupPosts7d,
      activeGroupMembers,
      audienceInterests,
    })
  } catch (e) {
    console.error('[GET /api/social/analytics]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
