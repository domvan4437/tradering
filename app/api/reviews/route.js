import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const reviews = await prisma.weeklyReview.findMany({
    where: { userId: session.user.id },
    orderBy: { weekOf: 'desc' },
    take: 52,
  })
  return Response.json(reviews)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  // Upsert by weekOf to avoid duplicates
  const weekOf = new Date(body.weekOf)
  const review = await prisma.weeklyReview.upsert({
    where: {
      id: body.id || 'nonexistent',
    },
    update: {
      whatWorked: body.whatWorked,
      whatDidnt: body.whatDidnt,
      biggestLesson: body.biggestLesson,
      nextWeekFocus: body.nextWeekFocus,
      mentalState: body.mentalState,
      rulesFollowed: body.rulesFollowed ? parseInt(body.rulesFollowed) : null,
      totalTrades: body.totalTrades ? parseInt(body.totalTrades) : null,
      pnl: body.pnl ? parseFloat(body.pnl) : null,
    },
    create: {
      userId: session.user.id,
      weekOf,
      whatWorked: body.whatWorked || '',
      whatDidnt: body.whatDidnt || '',
      biggestLesson: body.biggestLesson || '',
      nextWeekFocus: body.nextWeekFocus || '',
      mentalState: body.mentalState || '',
      rulesFollowed: body.rulesFollowed ? parseInt(body.rulesFollowed) : null,
      totalTrades: body.totalTrades ? parseInt(body.totalTrades) : null,
      pnl: body.pnl ? parseFloat(body.pnl) : null,
    },
  })
  return Response.json(review)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.weeklyReview.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
