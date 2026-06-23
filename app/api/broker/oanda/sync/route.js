import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const BASE = 'https://api-fxpractice.oanda.com'

function oandaFetch(path, token) {
  return fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json())
}

// OANDA instruments → asset class
function classifyOanda(instrument) {
  const [base] = instrument.split('_')
  const forexBase = ['EUR','GBP','USD','JPY','AUD','CAD','CHF','NZD','SEK','NOK','DKK','HKD','SGD','MXN','ZAR','TRY']
  const metals   = ['XAU','XAG','XPT','XPD','XCU']
  const energies = ['BCO','WTICO','NATGAS','CORN','SOYBN','WHEAT','SUGAR']
  const indices  = ['US30','SPX500','NAS100','UK100','DE30','FR40','AU200','JP225','HK33','TWIX']
  const crypto   = ['BTC','ETH','LTC','LINK','BCH']

  if (metals.includes(base))   return 'Commodities'
  if (energies.includes(base)) return 'Commodities'
  if (indices.includes(base))  return 'Indices'
  if (crypto.includes(base))   return 'Crypto'
  if (forexBase.includes(base)) return 'Forex'
  return 'Forex'
}

// Convert OANDA instrument EUR_USD → EURUSD
function formatSymbol(instrument) {
  return instrument.replace('_', '')
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: uid, broker: 'oanda_practice', status: 'connected' }
    })
    if (connections.length === 0) return Response.json({ error: 'No OANDA connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      const { apiKey: token, accountId } = conn
      try {
        // ── 1. Pull closed trades ──────────────────────────────────
        const closedRes = await oandaFetch(
          `/v3/accounts/${accountId}/trades?state=CLOSED&count=500`,
          token
        )
        const closedTrades = closedRes?.trades || []

        for (const t of closedTrades) {
          const exists = await prisma.brokerTrade.findFirst({
            where: { connectionId: conn.id, brokerTradeId: t.id }
          })
          if (exists) continue

          const units     = parseFloat(t.initialUnits)
          const direction = units > 0 ? 'long' : 'short'
          const qty       = Math.abs(units)
          const entry     = parseFloat(t.price)
          const exit      = parseFloat(t.averageClosePrice || t.price)
          const pnl       = parseFloat(t.realizedPL || 0)
          const symbol    = formatSymbol(t.instrument)

          await prisma.brokerTrade.create({
            data: {
              connectionId: conn.id,
              userId: uid,
              brokerTradeId: t.id,
              asset: classifyOanda(t.instrument),
              symbol,
              direction,
              entryPrice: entry,
              exitPrice: exit,
              quantity: qty,
              status: 'closed',
              openedAt: new Date(t.openTime),
              closedAt: new Date(t.closeTime),
              realizedPnL: +pnl.toFixed(4),
            }
          })
          totalNew++
        }

        // ── 2. Pull open trades ────────────────────────────────────
        const openRes = await oandaFetch(
          `/v3/accounts/${accountId}/openTrades`,
          token
        )
        const openTrades = openRes?.trades || []

        for (const t of openTrades) {
          const exists = await prisma.brokerTrade.findFirst({
            where: { connectionId: conn.id, brokerTradeId: t.id }
          })
          if (exists) continue

          const units     = parseFloat(t.initialUnits)
          const direction = units > 0 ? 'long' : 'short'
          const symbol    = formatSymbol(t.instrument)

          await prisma.brokerTrade.create({
            data: {
              connectionId: conn.id,
              userId: uid,
              brokerTradeId: t.id,
              asset: classifyOanda(t.instrument),
              symbol,
              direction,
              entryPrice: parseFloat(t.price),
              quantity: Math.abs(units),
              status: 'open',
              openedAt: new Date(t.openTime),
            }
          })
          totalNew++
        }

        await prisma.brokerConnection.update({
          where: { id: conn.id },
          data: { lastSynced: new Date() }
        })
      } catch (e) {
        console.error(`[oanda/sync] conn ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    console.error('[oanda/sync]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
