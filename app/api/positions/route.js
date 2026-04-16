import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const positions = await prisma.position.findMany({
    where: { userId: session.user.id },
    orderBy: { openedAt: 'desc' },
  })
  return Response.json(positions)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const position = await prisma.position.create({
    data: {
      userId: session.user.id,
      symbol: body.symbol,
      name: body.name || body.symbol,
      direction: body.direction,
      entryPrice: parseFloat(body.entryPrice),
      currentPrice: body.currentPrice ? parseFloat(body.currentPrice) : null,
      stopPrice: body.stopPrice ? parseFloat(body.stopPrice) : null,
      targetPrice: body.targetPrice ? parseFloat(body.targetPrice) : null,
      contracts: parseInt(body.contracts) || 1,
      contractSize: parseFloat(body.contractSize) || 1,
      notes: body.notes || '',
      tags: body.tags || [],
    },
  })
  return Response.json(position)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const { id, ...updates } = body
  if (updates.entryPrice) updates.entryPrice = parseFloat(updates.entryPrice)
  if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice)
  if (updates.stopPrice) updates.stopPrice = updates.stopPrice ? parseFloat(updates.stopPrice) : null
  if (updates.targetPrice) updates.targetPrice = updates.targetPrice ? parseFloat(updates.targetPrice) : null
  if (updates.exitPrice) updates.exitPrice = parseFloat(updates.exitPrice)
  if (updates.contracts) updates.contracts = parseInt(updates.contracts)
  if (updates.contractSize) updates.contractSize = parseFloat(updates.contractSize)

  // Calculate P&L if closing
  if (updates.status === 'closed' && updates.exitPrice) {
    const position = await prisma.position.findUnique({ where: { id } })
    if (position) {
      const diff = updates.exitPrice - position.entryPrice
      const dirMult = position.direction === 'LONG' ? 1 : -1
      updates.pnl = diff * dirMult * position.contracts * position.contractSize
      updates.exitDate = new Date()
    }
  }

  const position = await prisma.position.update({
    where: { id, userId: session.user.id },
    data: updates,
  })
  return Response.json(position)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.position.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
