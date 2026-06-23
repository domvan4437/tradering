import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const BASE = 'https://www.okx.com'

function okxSign(secret, timestamp, method, path, body = '') {
  const prehash = `${timestamp}${method}${path}${body}`
  return crypto.createHmac('sha256', secret).update(prehash).digest('base64')
}

async function okxGet(path, apiKey, secret, passphrase) {
  const ts = new Date().toISOString()
  const sig = okxSign(secret, ts, 'GET', path)
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': sig,
      'OK-ACCESS-TIMESTAMP': ts,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'x-simulated-trading': '1',
      'Content-Type': 'application/json',
    },
  })
  return res.json()
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { apiKey, secret, passphrase } = await request.json()
    if (!apiKey || !secret || !passphrase) {
      return Response.json({ error: 'API Key, Secret, and Passphrase are all required' }, { status: 400 })
    }

    // Test credentials
    const test = await okxGet('/api/v5/account/balance', apiKey.trim(), secret.trim(), passphrase.trim())
    if (test.code !== '0') {
      return Response.json({ error: test.msg || 'Invalid API credentials — make sure you generated Demo Trading keys' }, { status: 400 })
    }

    const existing = await prisma.brokerConnection.findFirst({ where: { userId: uid, broker: 'okx_demo' } })
    let conn
    const data = { apiKey: apiKey.trim(), apiSecret: secret.trim(), accountId: passphrase.trim(), status: 'connected', label: 'OKX Demo' }
    if (existing) {
      conn = await prisma.brokerConnection.update({ where: { id: existing.id }, data })
    } else {
      conn = await prisma.brokerConnection.create({ data: { userId: uid, broker: 'okx_demo', ...data } })
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
    await prisma.brokerConnection.deleteMany({ where: { userId: session.user.id, broker: 'okx_demo' } })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
