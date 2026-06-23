import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const PAPER_BASE = 'https://paper-api.alpaca.markets'
const LIVE_BASE  = 'https://api.alpaca.markets'

// Verify the keys work and return account info
async function testAlpaca(keyId, secretKey, paper = true) {
  const base = paper ? PAPER_BASE : LIVE_BASE
  const res = await fetch(`${base}/v2/account`, {
    headers: {
      'APCA-API-KEY-ID': keyId,
      'APCA-API-SECRET-KEY': secretKey,
    },
  })
  if (!res.ok) throw new Error(`Invalid API keys (${res.status})`)
  return res.json()
}

// POST — save Alpaca connection
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { keyId, secretKey, paper = true } = await request.json()
    if (!keyId || !secretKey) return Response.json({ error: 'API Key ID and Secret Key are required' }, { status: 400 })

    // Verify keys before saving
    let account
    try {
      account = await testAlpaca(keyId.trim(), secretKey.trim(), paper)
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 })
    }

    const brokerLabel = paper ? 'Alpaca Paper Trading' : 'Alpaca Live Trading'
    const brokerType  = paper ? 'alpaca_paper' : 'alpaca_live'

    // Upsert the connection
    const existing = await prisma.brokerConnection.findFirst({
      where: { userId: uid, broker: brokerType }
    })

    let conn
    if (existing) {
      conn = await prisma.brokerConnection.update({
        where: { id: existing.id },
        data: { apiKey: keyId.trim(), apiSecret: secretKey.trim(), status: 'connected', label: brokerLabel, accountId: account.id }
      })
    } else {
      conn = await prisma.brokerConnection.create({
        data: {
          userId: uid,
          broker: brokerType,
          label: brokerLabel,
          apiKey: keyId.trim(),
          apiSecret: secretKey.trim(),
          accountId: account.id,
          status: 'connected',
        }
      })
    }

    return Response.json({
      success: true,
      connectionId: conn.id,
      accountId: account.id,
      equity: account.equity,
      paper,
    })
  } catch (e) {
    console.error('[alpaca/connect]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — disconnect
export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    await prisma.brokerConnection.deleteMany({
      where: { userId: uid, broker: { in: ['alpaca_paper', 'alpaca_live'] } }
    })

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
