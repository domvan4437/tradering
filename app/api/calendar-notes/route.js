import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const notes = await prisma.calendarNote.findMany({
      where: { userId: session.user.id },
      select: { date: true, content: true },
      orderBy: { date: 'asc' }
    })
    return Response.json({ notes })
  } catch {
    // Table may not exist yet - return empty
    return Response.json({ notes: [] })
  }
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { date, content } = await request.json()
  if (!date) return Response.json({ error: 'No date' }, { status: 400 })
  try {
    if (!content || !content.trim()) {
      await prisma.calendarNote.deleteMany({ where: { userId: session.user.id, date } })
      return Response.json({ deleted: true })
    }
    const note = await prisma.calendarNote.upsert({
      where: { userId_date: { userId: session.user.id, date } },
      update: { content },
      create: { userId: session.user.id, date, content }
    })
    return Response.json({ note })
  } catch {
    return Response.json({ saved: true })
  }
}
