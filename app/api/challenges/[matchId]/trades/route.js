import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

function calcR(direction, entry, stop, exit) {
  const riskPerUnit = Math.abs(entry - stop)
  if (riskPerUnit === 0) return 0
  return direction === 'long'
    ? (exit - entry) / riskPerUnit
    : (entry - exit) / riskPerUnit
}

export async function POST(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { matchId } = params
    const { symbol, asset, direction, entryPrice, stopPrice, targetPrice, contracts } = await request.json()

    if (!symbol || !direction || !entryPrice || !stopPrice || !targetPrice) {
      return Response.json({ error: 'symbol, direction, entryPrice, stopPrice, and targetPrice are required' }, { status: 400 })
    }

    const entry = parseFloat(entryPrice)
    const stop = parseFloat(stopPrice)
    const target = parseFloat(targetPrice)
    const size = parseInt(contracts) || 1

    // Validate direction vs stop/target
    if (direction === 'long' && stop >= entry) return Response.json({ error: 'Long: stop must be below entry' }, { status: 400 })
    if (direction === 'long' && target <= entry) return Response.json({ error: 'Long: target must be above entry' }, { status: 400 })
    if (direction === 'short' && stop <= entry) return Response.json({ error: 'Short: stop must be above entry' }, { status: 400 })
    if (direction === 'short' && target >= entry) return Response.json({ error: 'Short: target must be below entry' }, { status: 400 })

    const match = await prisma.h2HMatch.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    })
    if (!match) return Response.json({ error: 'Match not found' }, { status: 404 })

    const participants = [match.challengerId, match.opponentId].filter(Boolean)
    if (!participants.includes(uid)) return Response.json({ error: 'Not in this match' }, { status: 403 })
    if (match.status !== 'active') return Response.json({ error: 'Match is not active yet — wait for your opponent to accept' }, { status: 400 })

    // Get or create TournamentEntry
    let tournEntry = await prisma.tournamentEntry.findFirst({
      where: { tournamentId: match.tournamentId, userId: uid }
    })
    if (!tournEntry) {
      tournEntry = await prisma.tournamentEntry.create({
        data: { tournamentId: match.tournamentId, userId: uid, score: 0 }
      })
    }

    // Enforce daily call limit
    const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0)
    const todayCount = await prisma.tradeCall.count({
      where: { entryId: tournEntry.id, submittedAt: { gte: dayStart } }
    })
    const limit = match.tournament?.maxCallsPerDay || 99
    if (todayCount >= limit) {
      return Response.json({ error: `Daily limit of ${limit} trade calls reached for today` }, { status: 400 })
    }

    const riskPerUnit = Math.abs(entry - stop)
    const rewardPerUnit = Math.abs(target - entry)

    const trade = await prisma.tradeCall.create({
      data: {
        entryId: tournEntry.id,
        tournamentId: match.tournamentId,
        userId: uid,
        asset: asset || 'Any',
        symbol: symbol.trim().toUpperCase(),
        direction,
        entryPrice: entry,
        stopPrice: stop,
        stopLoss: stop,
        targetPrice: target,
        takeProfit: target,
        contracts: size,
        dollarRisk: riskPerUnit * size,
        dollarTarget: rewardPerUnit * size,
        status: 'open',
        validationStatus: 'approved',
        entryTimestamp: new Date(),
      }
    })

    return Response.json({ success: true, trade })
  } catch (e) {
    console.error('[POST /api/challenges/[matchId]/trades]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id
    const { matchId } = params
    const { tradeId, action, exitPrice } = await request.json()

    const trade = await prisma.tradeCall.findUnique({ where: { id: tradeId } })
    if (!trade) return Response.json({ error: 'Trade not found' }, { status: 404 })
    if (trade.userId !== uid) return Response.json({ error: 'Not your trade' }, { status: 403 })
    if (trade.status !== 'open') return Response.json({ error: 'Trade is already closed' }, { status: 400 })

    let closePrice, status
    if (action === 'hit_target') {
      closePrice = trade.targetPrice
      status = 'won'
    } else if (action === 'hit_stop') {
      closePrice = trade.stopPrice
      status = 'stopped'
    } else if (action === 'close_manual' && exitPrice) {
      closePrice = parseFloat(exitPrice)
      const r = calcR(trade.direction, trade.entryPrice, trade.stopPrice, closePrice)
      status = r >= 0 ? 'won' : 'stopped'
    } else {
      return Response.json({ error: 'Invalid action or missing exitPrice' }, { status: 400 })
    }

    const rMultiple = +calcR(trade.direction, trade.entryPrice, trade.stopPrice, closePrice).toFixed(2)
    const dollarPnL = (closePrice - trade.entryPrice) * trade.contracts * (trade.direction === 'short' ? -1 : 1)

    const updated = await prisma.tradeCall.update({
      where: { id: tradeId },
      data: {
        status,
        rMultiple,
        points: Math.max(0, rMultiple),
        currentPrice: closePrice,
        dollarPnL: +dollarPnL.toFixed(2),
        resolvedAt: new Date(),
        closeTimestamp: new Date(),
      }
    })

    // Update TournamentEntry score
    const tournEntry = await prisma.tournamentEntry.findFirst({
      where: { tournamentId: trade.tournamentId, userId: uid }
    })
    if (tournEntry) {
      await prisma.tournamentEntry.update({
        where: { id: tournEntry.id },
        data: { score: { increment: Math.max(0, rMultiple) } }
      })
    }

    // Update H2HMatch score
    const match = await prisma.h2HMatch.findUnique({ where: { id: matchId } })
    if (match) {
      const scoreField = match.challengerId === uid ? 'challengerScore' : 'opponentScore'
      await prisma.h2HMatch.update({
        where: { id: matchId },
        data: { [scoreField]: { increment: Math.max(0, rMultiple) } }
      })
    }

    return Response.json({ success: true, trade: updated, rMultiple })
  } catch (e) {
    console.error('[PATCH /api/challenges/[matchId]/trades]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
