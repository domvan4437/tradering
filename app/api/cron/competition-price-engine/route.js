// Competition Price Engine — runs every minute via Vercel Cron
// Responsibilities:
//  1. Update currentPrice on all open positions
//  2. Execute Stop Loss / Take Profit triggers
//  3. Fill pending limit/stop_entry orders
//  4. Liquidate accounts below 20% equity threshold
//  5. Close all positions for expired competitions

import { prisma } from '../../../../lib/prisma'
import {
  fetchBatchQuotes,
  calcPnl,
  checkSlTp,
  shouldFillOrder,
  applySlippage,
} from '../../../../lib/competitionPrices'

const LIQUIDATION_THRESHOLD_PCT = 0.20 // liquidate if equity < 20% of startingCash

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // seconds

export async function GET(req) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const started = Date.now()
  const log = { processed: 0, slTpTriggered: 0, ordersFilled: 0, liquidations: 0, errors: [] }

  try {
    const now = new Date()

    // ── 1. Find all active portfolios with open positions or pending orders ──
    const activePortfolios = await prisma.competitionPortfolio.findMany({
      where: {
        status: 'active',
        isLiquidated: false,
        OR: [
          { positions: { some: {} } },
          { orders: { some: { status: 'pending' } } },
        ],
      },
      include: {
        positions: true,
        orders: { where: { status: 'pending' } },
      },
    })

    if (activePortfolios.length === 0) {
      return Response.json({ ...log, elapsed: Date.now() - started })
    }

    // ── 2. Collect all unique symbols ────────────────────────────────────────
    const symbolSet = new Set()
    for (const p of activePortfolios) {
      for (const pos of p.positions) symbolSet.add(pos.symbol)
      for (const ord of p.orders) symbolSet.add(ord.symbol)
    }
    const symbols = [...symbolSet]
    const prices = await fetchBatchQuotes(symbols)

    // ── 3. Process each portfolio ────────────────────────────────────────────
    for (const portfolio of activePortfolios) {
      log.processed++

      // Check if competition has ended
      if (portfolio.endDate && new Date(portfolio.endDate) < now) {
        // Close all positions at market
        for (const pos of portfolio.positions) {
          const currentPrice = prices[pos.symbol]?.price
          if (!currentPrice) continue
          const exitPrice = applySlippage(currentPrice, pos.direction === 'long' ? 'short' : 'long', pos.assetType)
          const { pnl, pnlPct } = calcPnl(pos.direction, pos.entryPrice, exitPrice, pos.quantity, pos.leverage)
          const cashReturn = pos.quantity / pos.leverage + pnl
          await prisma.$transaction([
            prisma.competitionTrade.create({
              data: {
                portfolioId: portfolio.id, competitionId: portfolio.competitionId, userId: portfolio.userId,
                positionId: pos.id, symbol: pos.symbol, symbolName: pos.symbolName, assetType: pos.assetType,
                direction: pos.direction, quantity: pos.quantity, leverage: pos.leverage,
                entryPrice: pos.entryPrice, exitPrice, openedAt: pos.openedAt, closedAt: now,
                closeReason: 'competition_end', pnl, pnlPct,
              },
            }),
            prisma.competitionPosition.delete({ where: { id: pos.id } }),
            prisma.competitionPortfolio.update({
              where: { id: portfolio.id },
              data: { cash: { increment: cashReturn } },
            }),
          ])
        }
        // Cancel pending orders and refund margin
        for (const ord of portfolio.orders) {
          const refund = ord.quantity / ord.leverage
          await prisma.$transaction([
            prisma.competitionOrder.update({ where: { id: ord.id }, data: { status: 'cancelled' } }),
            prisma.competitionPortfolio.update({ where: { id: portfolio.id }, data: { cash: { increment: refund } } }),
          ])
        }
        await prisma.competitionPortfolio.update({ where: { id: portfolio.id }, data: { status: 'completed' } })
        continue
      }

      // ── 3a. Update current prices & check SL/TP for open positions ─────────
      let cashDelta = 0
      for (const pos of portfolio.positions) {
        const currentPrice = prices[pos.symbol]?.price
        if (!currentPrice) continue

        // Update stored currentPrice
        await prisma.competitionPosition.update({
          where: { id: pos.id },
          data: { currentPrice },
        })

        // Check SL/TP
        const trigger = checkSlTp(pos.direction, pos.entryPrice, currentPrice, pos.stopLoss, pos.takeProfit)
        if (trigger) {
          const exitPrice = applySlippage(currentPrice, pos.direction === 'long' ? 'short' : 'long', pos.assetType)
          const { pnl, pnlPct } = calcPnl(pos.direction, pos.entryPrice, exitPrice, pos.quantity, pos.leverage)
          const cashReturn = pos.quantity / pos.leverage + pnl
          cashDelta += cashReturn

          await prisma.$transaction([
            prisma.competitionTrade.create({
              data: {
                portfolioId: portfolio.id, competitionId: portfolio.competitionId, userId: portfolio.userId,
                positionId: pos.id, symbol: pos.symbol, symbolName: pos.symbolName, assetType: pos.assetType,
                direction: pos.direction, quantity: pos.quantity, leverage: pos.leverage,
                entryPrice: pos.entryPrice, exitPrice, openedAt: pos.openedAt, closedAt: now,
                closeReason: trigger, pnl, pnlPct,
              },
            }),
            prisma.competitionPosition.delete({ where: { id: pos.id } }),
          ])
          log.slTpTriggered++
        }
      }

      // Apply cash delta from closed positions
      if (cashDelta !== 0) {
        await prisma.competitionPortfolio.update({
          where: { id: portfolio.id },
          data: { cash: { increment: cashDelta }, updatedAt: now },
        })
      }

      // Refresh portfolio cash after changes
      const updatedPortfolio = await prisma.competitionPortfolio.findUnique({
        where: { id: portfolio.id },
        include: { positions: true },
      })
      if (!updatedPortfolio) continue

      // ── 3b. Fill pending limit/stop_entry orders ───────────────────────────
      for (const ord of portfolio.orders) {
        const currentPrice = prices[ord.symbol]?.price
        if (!currentPrice) continue

        if (shouldFillOrder(ord, currentPrice)) {
          // Fill at current market price (not at limitPrice)
          const fillPrice = applySlippage(currentPrice, ord.direction, ord.assetType)

          await prisma.$transaction([
            prisma.competitionPosition.create({
              data: {
                portfolioId: portfolio.id, competitionId: portfolio.competitionId, userId: portfolio.userId,
                symbol: ord.symbol, symbolName: ord.symbolName, assetType: ord.assetType,
                direction: ord.direction, quantity: ord.quantity, leverage: ord.leverage,
                entryPrice: fillPrice, currentPrice: fillPrice, openedAt: now,
                stopLoss: ord.stopLoss, takeProfit: ord.takeProfit,
              },
            }),
            prisma.competitionOrder.update({
              where: { id: ord.id },
              data: { status: 'filled', filledAt: now, fillPrice },
            }),
            // Note: cash was already reserved when order was submitted, no change needed
          ])
          log.ordersFilled++
        }
      }

      // ── 3c. Liquidation check ──────────────────────────────────────────────
      const freshPortfolio = await prisma.competitionPortfolio.findUnique({
        where: { id: portfolio.id },
        include: { positions: true },
      })
      if (!freshPortfolio) continue

      const unrealizedPnl = freshPortfolio.positions.reduce((sum, pos) => {
        const p = prices[pos.symbol]?.price || pos.currentPrice || pos.entryPrice
        const { pnl } = calcPnl(pos.direction, pos.entryPrice, p, pos.quantity, pos.leverage)
        return sum + pnl
      }, 0)
      const equity = freshPortfolio.cash + unrealizedPnl
      const liquidationFloor = freshPortfolio.startingCash * LIQUIDATION_THRESHOLD_PCT

      if (equity <= liquidationFloor && freshPortfolio.positions.length > 0) {
        // Force-close all positions
        for (const pos of freshPortfolio.positions) {
          const currentPrice = prices[pos.symbol]?.price || pos.currentPrice || pos.entryPrice
          const exitPrice = applySlippage(currentPrice, pos.direction === 'long' ? 'short' : 'long', pos.assetType)
          const { pnl, pnlPct } = calcPnl(pos.direction, pos.entryPrice, exitPrice, pos.quantity, pos.leverage)
          const cashReturn = Math.max(0, pos.quantity / pos.leverage + pnl)

          await prisma.$transaction([
            prisma.competitionTrade.create({
              data: {
                portfolioId: portfolio.id, competitionId: portfolio.competitionId, userId: portfolio.userId,
                positionId: pos.id, symbol: pos.symbol, symbolName: pos.symbolName, assetType: pos.assetType,
                direction: pos.direction, quantity: pos.quantity, leverage: pos.leverage,
                entryPrice: pos.entryPrice, exitPrice, openedAt: pos.openedAt, closedAt: now,
                closeReason: 'liquidation', pnl, pnlPct,
              },
            }),
            prisma.competitionPosition.delete({ where: { id: pos.id } }),
            prisma.competitionPortfolio.update({
              where: { id: portfolio.id },
              data: { cash: { increment: cashReturn } },
            }),
          ])
        }
        await prisma.competitionPortfolio.update({
          where: { id: portfolio.id },
          data: { isLiquidated: true, updatedAt: now },
        })
        log.liquidations++
      }
    }

    return Response.json({ ...log, elapsed: Date.now() - started })
  } catch (e) {
    console.error('[competition-price-engine]', e)
    return Response.json({ error: e.message, ...log }, { status: 500 })
  }
}
