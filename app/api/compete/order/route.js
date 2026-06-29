import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import {
  fetchQuote,
  classifySymbol,
  getMaxLeverage,
  applySlippage,
  calcPnl,
} from '../../../../lib/competitionPrices'

const STARTING_CASH = 10000
const MAX_POSITION_PCT = 0.40  // max 40% of equity per position
const LIQUIDATION_PCT = 0.20   // liquidate if equity < 20% of starting cash
const LIMIT_ORDER_DELAY_MS = 60 * 1000 // 60 second anti-cheat delay

export async function POST(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await req.json()
    const {
      competitionId,
      competitionType = 'h2h',
      endDate,
      symbol,
      direction,   // 'long' | 'short'
      quantity,    // dollar notional to allocate
      leverage = 1,
      orderType = 'market', // 'market' | 'limit' | 'stop_entry'
      limitPrice,
      stopLoss,
      takeProfit,
    } = body

    if (!competitionId || !symbol || !direction || !quantity) {
      return Response.json({ error: 'competitionId, symbol, direction, quantity required' }, { status: 400 })
    }
    if (!['long', 'short'].includes(direction)) {
      return Response.json({ error: 'direction must be long or short' }, { status: 400 })
    }
    if (!['market', 'limit', 'stop_entry'].includes(orderType)) {
      return Response.json({ error: 'Invalid orderType' }, { status: 400 })
    }

    const dollarNotional = parseFloat(quantity)
    if (dollarNotional <= 0) return Response.json({ error: 'quantity must be > 0' }, { status: 400 })

    const assetType = classifySymbol(symbol)
    const maxLev = getMaxLeverage(assetType)
    const clampedLeverage = Math.min(Math.max(parseFloat(leverage) || 1, 1), maxLev)

    // ── Get or create portfolio ──────────────────────────────────────────────
    let portfolio = await prisma.competitionPortfolio.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
      include: { positions: true },
    })

    if (!portfolio) {
      portfolio = await prisma.competitionPortfolio.create({
        data: {
          competitionId,
          competitionType,
          userId,
          startingCash: STARTING_CASH,
          cash: STARTING_CASH,
          endDate: endDate ? new Date(endDate) : null,
          status: 'active',
        },
        include: { positions: true },
      })
    }

    if (portfolio.isLiquidated) {
      return Response.json({ error: 'Your account has been liquidated for this competition.' }, { status: 400 })
    }
    if (portfolio.status === 'completed') {
      return Response.json({ error: 'This competition has ended.' }, { status: 400 })
    }

    // ── Fetch current price (server-side — anti-cheat) ───────────────────────
    const quote = await fetchQuote(symbol)
    const serverPrice = quote.price

    // ── Validate position size cap ───────────────────────────────────────────
    // Equity = cash + unrealized P&L of open positions
    // (For validation, use entry prices to avoid needing another batch fetch)
    const unrealizedPnl = portfolio.positions.reduce((sum, pos) => {
      const { pnl } = calcPnl(pos.direction, pos.entryPrice, pos.currentPrice || pos.entryPrice, pos.quantity, pos.leverage)
      return sum + pnl
    }, 0)
    const equity = portfolio.cash + unrealizedPnl

    const maxAllowed = equity * MAX_POSITION_PCT
    if (dollarNotional > maxAllowed) {
      return Response.json({
        error: `Max position size is ${MAX_POSITION_PCT * 100}% of equity ($${maxAllowed.toFixed(2)}). You tried to allocate $${dollarNotional.toFixed(2)}.`,
      }, { status: 400 })
    }

    // Cash needed = notional / leverage (the "margin" required)
    const cashRequired = dollarNotional / clampedLeverage
    if (cashRequired > portfolio.cash) {
      return Response.json({
        error: `Insufficient cash. Need $${cashRequired.toFixed(2)} margin but you have $${portfolio.cash.toFixed(2)}.`,
      }, { status: 400 })
    }

    // ── Market order: fill immediately with slippage ─────────────────────────
    if (orderType === 'market') {
      const fillPrice = applySlippage(serverPrice, direction, assetType)

      const [position] = await prisma.$transaction([
        prisma.competitionPosition.create({
          data: {
            portfolioId: portfolio.id,
            competitionId,
            userId,
            symbol: quote.symbol,
            symbolName: quote.name,
            assetType,
            direction,
            quantity: dollarNotional,
            leverage: clampedLeverage,
            entryPrice: fillPrice,
            currentPrice: fillPrice,
            openedAt: new Date(),
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          },
        }),
        prisma.competitionPortfolio.update({
          where: { id: portfolio.id },
          data: { cash: { decrement: cashRequired }, updatedAt: new Date() },
        }),
      ])

      return Response.json({
        success: true,
        orderType: 'market',
        fillPrice,
        position: {
          id: position.id,
          symbol: position.symbol,
          symbolName: position.symbolName,
          assetType: position.assetType,
          direction: position.direction,
          quantity: position.quantity,
          leverage: position.leverage,
          entryPrice: position.entryPrice,
        },
        cashRemaining: portfolio.cash - cashRequired,
      })
    }

    // ── Limit / Stop-entry order: queue with 60s anti-cheat delay ────────────
    if (orderType === 'limit' || orderType === 'stop_entry') {
      if (!limitPrice) return Response.json({ error: 'limitPrice required for limit/stop_entry orders' }, { status: 400 })

      const canFillAfter = new Date(Date.now() + LIMIT_ORDER_DELAY_MS)

      // Reserve the cash (deduct margin from available cash immediately)
      const order = await prisma.$transaction(async (tx) => {
        const o = await tx.competitionOrder.create({
          data: {
            portfolioId: portfolio.id,
            competitionId,
            userId,
            symbol: quote.symbol,
            symbolName: quote.name,
            assetType,
            direction,
            quantity: dollarNotional,
            leverage: clampedLeverage,
            orderType,
            limitPrice: parseFloat(limitPrice),
            stopLoss: stopLoss ? parseFloat(stopLoss) : null,
            takeProfit: takeProfit ? parseFloat(takeProfit) : null,
            status: 'pending',
            submittedAt: new Date(),
            canFillAfter,
          },
        })
        await tx.competitionPortfolio.update({
          where: { id: portfolio.id },
          data: { cash: { decrement: cashRequired }, updatedAt: new Date() },
        })
        return o
      })

      return Response.json({
        success: true,
        orderType,
        order: {
          id: order.id,
          symbol: order.symbol,
          direction: order.direction,
          quantity: order.quantity,
          limitPrice: order.limitPrice,
          canFillAfter: order.canFillAfter,
          status: order.status,
        },
        serverPrice,
        note: 'Order queued. Will fill in ~60s if price conditions are met.',
      })
    }

    return Response.json({ error: 'Unknown orderType' }, { status: 400 })
  } catch (e) {
    console.error('[POST /api/compete/order]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// Cancel a pending order
export async function DELETE(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await req.json()
    const { orderId } = body
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 })

    const order = await prisma.competitionOrder.findFirst({
      where: { id: orderId, userId, status: 'pending' },
    })
    if (!order) return Response.json({ error: 'Order not found or already processed' }, { status: 404 })

    // Refund the reserved margin
    const cashRequired = order.quantity / order.leverage
    await prisma.$transaction([
      prisma.competitionOrder.update({ where: { id: orderId }, data: { status: 'cancelled' } }),
      prisma.competitionPortfolio.update({
        where: { id: order.portfolioId },
        data: { cash: { increment: cashRequired }, updatedAt: new Date() },
      }),
    ])

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// Modify SL/TP on an open position
export async function PATCH(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = session.user.id

    const body = await req.json()
    const { positionId, stopLoss, takeProfit } = body
    if (!positionId) return Response.json({ error: 'positionId required' }, { status: 400 })

    await prisma.competitionPosition.updateMany({
      where: { id: positionId, userId },
      data: {
        stopLoss: stopLoss !== undefined ? (stopLoss ? parseFloat(stopLoss) : null) : undefined,
        takeProfit: takeProfit !== undefined ? (takeProfit ? parseFloat(takeProfit) : null) : undefined,
      },
    })

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
