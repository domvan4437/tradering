import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'id required' }, { status: 400 })

    const contest = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, username: true, displayName: true } },
        entries: {
          orderBy: { joinedAt: 'asc' },
          include: { user: { select: { id: true, name: true, username: true, displayName: true } } },
        },
      },
    })

    if (!contest) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({
      id: contest.id,
      name: contest.name,
      description: contest.description,
      asset: contest.assetClasses?.[0] || 'Any',
      buyIn: contest.buyIn,
      status: contest.status,
      endDate: contest.endDate,
      maxParticipants: contest.maxParticipants,
      prizeStructure: contest.prizeStructure,
      creatorName: contest.creator?.displayName || contest.creator?.name || contest.creator?.username || 'Trader',
      memberCount: contest.entries.length,
      members: contest.entries.map(e => ({
        id: e.user.id,
        name: e.user.displayName || e.user.name || e.user.username || 'Trader',
        score: e.score,
        joinedAt: e.joinedAt,
      })),
      joined: contest.entries.some(e => e.user.id === session.user.id),
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
