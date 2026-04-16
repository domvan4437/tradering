import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

// Returns everything relevant to a symbol: notes, key levels, ideas, screenings, COT data
export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.toUpperCase()
  if (!symbol) return Response.json({ error: 'No symbol' }, { status: 400 })

  const [notes, keyLevels, ideas, screenings, positions] = await Promise.all([
    // Notes tagged with or mentioning this symbol
    prisma.note.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { tags: { has: symbol.toLowerCase() } },
          { tags: { has: symbol } },
          { title: { contains: symbol, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    }),
    // Key levels for this symbol
    prisma.idea.findMany({
      where: { userId: session.user.id, tags: { has: '__keylevel__' }, symbol: { equals: symbol, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    }),
    // Active ideas for this symbol
    prisma.idea.findMany({
      where: {
        userId: session.user.id,
        symbol: { equals: symbol, mode: 'insensitive' },
        tags: { none: { equals: '__keylevel__' } },
        status: { in: ['watching', 'active'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    // Recent screenings for this symbol (commodity names)
    prisma.screening.findMany({
      where: { userId: session.user.id, commodity: { contains: symbol, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Open positions for this symbol
    prisma.position.findMany({
      where: { userId: session.user.id, symbol: { equals: symbol, mode: 'insensitive' }, status: 'open' },
    }),
  ])

  return Response.json({
    symbol,
    notes,
    keyLevels: keyLevels.map(l => ({
      id: l.id, type: l.direction, price: parseFloat(l.entry || '0'), label: l.title, notes: l.thesis,
    })),
    ideas,
    screenings,
    positions,
  })
}
