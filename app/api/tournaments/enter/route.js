import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { tournamentId, teamName, groupId } = await request.json()

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
  if (!tournament) return Response.json({ error: 'Tournament not found' }, { status: 404 })
  if (tournament.status !== 'open') return Response.json({ error: 'Tournament is not open for entries' }, { status: 400 })

  try {
    const entry = await prisma.tournamentEntry.create({
      data: { tournamentId, userId: session.user.id, teamName: teamName || null, groupId: groupId || null, paid: tournament.buyIn === 0 }
    })
    if (tournament.buyIn > 0) {
      await prisma.tournament.update({ where: { id: tournamentId }, data: { prizePool: { increment: tournament.buyIn * (1 - tournament.platformFee) } } })
    }
    return Response.json({ entry })
  } catch { return Response.json({ error: 'Already entered' }, { status: 400 }) }
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { entryId, autoBrokerSync } = await request.json()
  const entry = await prisma.tournamentEntry.update({
    where: { id: entryId, userId: session.user.id },
    data: { autoBrokerSync }
  })
  return Response.json({ entry })
}
