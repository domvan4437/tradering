import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

// Receives trade events from TradingView alerts, custom scripts, or any platform.
//
// TradingView alert message format:
// {"symbol":"{{ticker}}","action":"{{strategy.order.action}}","price":"{{strategy.order.price}}","qty":"{{strategy.order.contracts}}","key":"YOUR_SECRET"}
//
// Generic format:
// {"symbol":"AAPL","action":"buy","price":"195.20","qty":"10","key":"YOUR_SECRET"}
// {"symbol":"AAPL","action":"sell","price":"200.00","qty":"10","key":"YOUR_SECRET"}
//
// action values accepted: buy/long/sell/short/close/exit

export async function POST(request, { params }) {
  try {
    const { userId } = params
    const { searchParams } = new URL(request.url)
    const urlKey = searchParams.get('key')

    let body
    try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    // Key can be in URL param or body
    const key = urlKey || body.key
    if (!key) return Response.json({ error: 'Missing key' }, { status: 401 })

    // Find webhook connection for this user+key
    const connection = await prisma.brokerConnection.findFirst({
      where: { userId, broker: 'webhook', apiKey: key }
    })
    if (!connection) return Response.json({ error: 'Invalid key or user' }, { status: 401 })

    // Parse payload — support TradingView and generic formats
    const rawSymbol = body.symbol || body.ticker || ''
    const rawAction = (body.action || body.side || body.order_action || '').toLowerCase().trim()
    const price = parseFloat(body.price || body.entry_price || body.close || 0)
    const qty = parseFloat(body.qty || body.quantity || body.contracts || body.size || 1)
    const stopPrice = body.stop ? parseFloat(body.stop) : null
    const targetPrice = body.target ? parseFloat(body.target) : null

    if (!rawSymbol) return Response.json({ error: 'Missing symbol' }, { status: 400 })
    if (!rawAction) return Response.json({ error: 'Missing action (buy/sell/long/short)' }, { status: 400 })
    if (!price || price <= 0) return Response.json({ error: 'Missing or invalid price' }, { status: 400 })

    const symbol = rawSymbol.replace(/[^A-Z0-9./=-]/gi, '').toUpperCase()
    const isClose = ['sell', 'exit', 'close', 'sell_long', 'sell_short', 'cover'].some(v => rawAction.includes(v))
    const isOpen = ['buy', 'long', 'short', 'enter', 'buy_long', 'buy_short'].some(v => rawAction.includes(v))
    const direction = rawAction.includes('short') || rawAction === 'short' ? 'short' : 'long'

    const now = new Date()

    if (isClose) {
      // Find the most recent open trade for this symbol from this connection
      const openTrade = await prisma.brokerTrade.findFirst({
        where: { connectionId: connection.id, symbol, status: 'open' },
        orderBy: { openedAt: 'desc' }
      })

      if (openTrade) {
        const mult = openTrade.direction === 'short' ? -1 : 1
        const pnl = (price - openTrade.entryPrice) * openTrade.quantity * mult
        await prisma.brokerTrade.update({
          where: { id: openTrade.id },
          data: {
            exitPrice: price,
            status: 'closed',
            closedAt: now,
            realizedPnL: +pnl.toFixed(4),
          }
        })

        // Update lastSynced on connection
        await prisma.brokerConnection.update({ where: { id: connection.id }, data: { lastSynced: now } })

        return Response.json({ success: true, event: 'trade_closed', symbol, pnl: +pnl.toFixed(4) })
      }

      // No matching open trade — log as a standalone closed trade (e.g. closing a position opened elsewhere)
      const brokerTradeId = `${symbol}-close-${Date.now()}`
      await prisma.brokerTrade.create({
        data: {
          connectionId: connection.id,
          userId,
          brokerTradeId,
          asset: classifyAsset(symbol),
          symbol,
          direction: direction === 'long' ? 'short' : 'long', // reverse since it's a close
          entryPrice: price,
          exitPrice: price,
          quantity: qty,
          status: 'closed',
          openedAt: now,
          closedAt: now,
          realizedPnL: 0,
        }
      })
      return Response.json({ success: true, event: 'close_logged', note: 'No matching open trade found' })
    }

    if (isOpen) {
      const brokerTradeId = `${symbol}-${rawAction}-${Date.now()}`
      await prisma.brokerTrade.create({
        data: {
          connectionId: connection.id,
          userId,
          brokerTradeId,
          asset: classifyAsset(symbol),
          symbol,
          direction,
          entryPrice: price,
          stopPrice: stopPrice || null,
          targetPrice: targetPrice || null,
          quantity: qty,
          status: 'open',
          openedAt: now,
        }
      })

      await prisma.brokerConnection.update({ where: { id: connection.id }, data: { lastSynced: now } })
      return Response.json({ success: true, event: 'trade_opened', symbol, direction, price, qty })
    }

    return Response.json({ error: `Unrecognized action: ${rawAction}. Use buy/sell/long/short/close.` }, { status: 400 })
  } catch (e) {
    console.error('[POST /api/broker/webhook]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

function classifyAsset(symbol) {
  const s = symbol.toUpperCase()
  if (s.endsWith('=X') || s.includes('USD') && s.length <= 8) return 'Forex'
  if (s.endsWith('=F') || ['ES','NQ','YM','CL','GC','SI','ZN'].some(f => s.startsWith(f))) return 'Futures'
  if (s.includes('-USD') || ['BTC','ETH','SOL','ADA','XRP'].some(c => s.startsWith(c))) return 'Crypto'
  return 'Stocks'
}
