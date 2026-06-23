import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const BASE = 'https://api-testnet.bybit.com'

function sign(secret, params) {
  const ts = Date.now()
  const recv = 5000
  const payload = `${ts}${params.apiKey}${recv}${params.qs || ''}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return { ts, sig, recv }
}

async function bybitGet(path, apiKey, secret, query = '') {
  const ts = Date.now()
  const recv = 5000
  const payload = `${ts}${apiKey}${recv}${query}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  const url = `${BASE}${path}${query ? '?' + query : ''}`
  const res = await fetch(url, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-SIGN': sig,
      'X-BAPI-SIGN-TYPE': '2',
      'X-BAPI-TIMESTAMP': String(ts),
      'X-BAPI-RECV-WINDOW': String(recv),
    },
  })
  return res.json()
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { apiKey, secret } = await request.json()
    if (!apiKey || !secret) return Response.json({ error: 'API Key and Secret are required' }, { status: 400 })

    // Test credentials
    const test = await bybitGet('/v5/account/wallet-balance', apiKey.trim(), secret.trim(), 'accountType=UNIFIED')
    if (test.retCode !== 0) {
      return Response.json({ error: test.retMsg || 'Invalid API credentials' }, { status: 400 })
    }

    const existing = await prisma.brokerConnection.findFirst({ where: { userId: uid, broker: 'bybit_testnet' } })
    let conn
    if (existing) {
      conn = await prisma.brokerConnection.update({ where: { id: existing.id }, data: { apiKey: apiKey.trim(), apiSecret: secret.trim(), status: 'connected', label: 'Bybit Testnet' } })
    } else {
      conn = await prisma.brokerConnection.create({ data: { userId: uid, broker: 'bybit_testnet', label: 'Bybit Testnet', apiKey: apiKey.trim(), apiSecret: secret.trim(), status: 'connected' } })
    }

    return Response.json({ success: true, connectionId: conn.id })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.brokerConnection.deleteMany({ where: { userId: session.user.id, broker: 'bybit_testnet' } })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
