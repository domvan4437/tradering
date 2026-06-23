import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const out = {}
  try {
    const session = await getSession()
    out.session = session ? { id: session.user.id, email: session.user.email } : null
    if (!session) return Response.json({ ...out, error: 'No session' })

    // Test Tournament table
    try {
      const tCount = await prisma.tournament.count()
      out.tournamentTableOk = true
      out.tournamentCount = tCount
    } catch (e) {
      out.tournamentTableOk = false
      out.tournamentError = e.message
    }

    // Test H2HMatch table
    try {
      const mCount = await prisma.h2HMatch.count()
      out.h2hTableOk = true
      out.h2hCount = mCount
    } catch (e) {
      out.h2hTableOk = false
      out.h2hError = e.message
    }

    // Test TournamentEntry table
    try {
      const eCount = await prisma.tournamentEntry.count()
      out.entryTableOk = true
      out.entryCount = eCount
    } catch (e) {
      out.entryTableOk = false
      out.entryError = e.message
    }

    return Response.json(out)
  } catch (e) {
    return Response.json({ ...out, fatalError: e.message })
  }
}
