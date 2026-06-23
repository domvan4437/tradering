import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const DEMO_BASE   = 'https://demo.tradovateapi.com/v1'
const APP_ID      = process.env.TRADOVATE_APP_ID      || 'Sample App'
const APP_VERSION = process.env.TRADOVATE_APP_VERSION  || '1.0'
const APP_SECRET  = process.env.TRADOVATE_APP_SECRET   || ''

async function refreshToken(conn) {
  const res = await fetch(`${DEMO_BASE}/auth/accesstokenrequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: conn.apiKey,
      password: conn.apiSecret,
      appId: APP_ID,
      appVersion: APP_VERSION,
      cids: 0,
      sec: APP_SECRET,
    }),
  })
  const data = await res.json()
  if (!data?.accessToken) throw new Error('Token refresh failed')
  return data.accessToken
}

function tvFetch(path, token) {
  return fetch(`${DEMO_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  }).then(r => r.json())
}

function classifyFuture(symbol) {
  const s = symbol.toUpperCase()
  if (['ES','NQ','YM','RTY','MES','MNQ','MYM'].some(f => s.startsWith(f))) return 'Indices'
  if (['CL','QM','NG','RB','HO'].some(f => s.startsWith(f)))              return 'Commodities'
  if (['GC','SI','HG','PL','PA'].some(f => s.startsWith(f)))              return 'Commodities'
  if (['ZN','ZB','ZF','ZT'].some(f => s.startsWith(f)))                  return 'Bonds'
  if (['ZC','ZW','ZS','ZL','ZM','KC','SB','CT','CC'].some(f => s.startsWith(f))) return 'Commodities'
  if (['6E','6B','6J','6A','6C','6S','6N','M6E'].some(f => s.startsWith(f))) return 'Forex'
  if (['BTC','ETH','MBT','MET'].some(f => s.startsWith(f)))              return 'Crypto'
  return 'Futures'
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const connections = await prisma.brokerConnection.findMany({
      where: { userId: uid, broker: 'tradovate_demo', status: 'connected' }
    })
    if (connections.length === 0) return Response.json({ error: 'No Tradovate connection found' }, { status: 404 })

    let totalNew = 0

    for (const conn of connections) {
      try {
        // Refresh token (Tradovate tokens expire)
        let token
        try {
          token = await refreshToken(conn)
          // Save refreshed token
          await prisma.brokerConnection.update({
            where: { id: conn.id },
            data: { accessToken: token }
          })
        } catch {
          console.error(`[tradovate/sync] token refresh failed for conn ${conn.id}`)
          continue
        }

        // ── 1. Pull all fills (executed orders) ──────────────────────
        const fills = await tvFetch('/fill/list', token)
        if (!Array.isArray(fills)) continue

        // Build a symbol map from contract IDs → symbol
        const contracts = await tvFetch('/contract/list', token)
        const symbolMap = {}
        if (Array.isArray(contracts)) {
          contracts.forEach(c => { symbolMap[c.id] = c.name })
        }

        // ── 2. Group fills into open/close pairs ─────────────────────
        // Track net position per contract
        const openByContract = {} // contractId → { id, entryPrice, qty, direction, openedAt }

        // Sort fills by timestamp
        fills.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

        for (const fill of fills) {
          const contractId = fill.contractId
          const symbol     = symbolMap[contractId] || `CONTRACT_${contractId}`
          const qty        = Math.abs(fill.qty)
          const price      = fill.price
          const ts         = fill.timestamp
          const isBuy      = fill.action === 'Buy'

          const brokerFillId = `fill-${fill.id}`
          const exists = await prisma.brokerTrade.findFirst({
            where: { connectionId: conn.id, brokerTradeId: brokerFillId }
          })

          if (isBuy) {
            if (!exists) {
              const trade = await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id,
                  userId: uid,
                  brokerTradeId: brokerFillId,
                  asset: classifyFuture(symbol),
                  symbol,
                  direction: 'long',
                  entryPrice: price,
                  quantity: qty,
                  status: 'open',
                  openedAt: new Date(ts),
                }
              })
              openByContract[contractId] = trade
              totalNew++
            } else if (exists.status === 'open') {
              openByContract[contractId] = exists
            }
          } else {
            // Sell fill — close the open trade if one exists
            const open = openByContract[contractId]
            if (open) {
              const pnl = +((price - open.entryPrice) * open.quantity).toFixed(4)
              await prisma.brokerTrade.update({
                where: { id: open.id },
                data: {
                  exitPrice: price,
                  status: 'closed',
                  closedAt: new Date(ts),
                  realizedPnL: pnl,
                }
              })
              delete openByContract[contractId]
              if (!exists) totalNew++
            } else if (!exists) {
              // Short sale
              const trade = await prisma.brokerTrade.create({
                data: {
                  connectionId: conn.id,
                  userId: uid,
                  brokerTradeId: brokerFillId,
                  asset: classifyFuture(symbol),
                  symbol,
                  direction: 'short',
                  entryPrice: price,
                  quantity: qty,
                  status: 'open',
                  openedAt: new Date(ts),
                }
              })
              openByContract[contractId] = trade
              totalNew++
            }
          }
        }

        await prisma.brokerConnection.update({
          where: { id: conn.id },
          data: { lastSynced: new Date() }
        })
      } catch (e) {
        console.error(`[tradovate/sync] conn ${conn.id}:`, e.message)
      }
    }

    return Response.json({ success: true, synced: totalNew })
  } catch (e) {
    console.error('[tradovate/sync]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
