import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const PRACTICE_BASE = 'https://api-fxpractice.oanda.com'

async function testOanda(token, accountId) {
  const res = await fetch(`${PRACTICE_BASE}/v3/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.errorMessage || `Invalid credentials (${res.status})`)
  }
  return res.json()
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { token, accountId } = await request.json()
    if (!token || !accountId) return Response.json({ error: 'API Token and Account ID are required' }, { status: 400 })

    // Verify credentials
    let accountData
    try {
      accountData = await testOanda(token.trim(), accountId.trim())
    } catch (e) {
      return Response.json({ error: e.message }, { status: 400 })
    }

    const balance = accountData?.account?.balance

    const existing = await prisma.brokerConnection.findFirst({
      where: { userId: uid, broker: 'oanda_practice' }
    })

    let conn
    if (existing) {
      conn = await prisma.brokerConnection.update({
        where: { id: existing.id },
        data: { apiKey: token.trim(), accountId: accountId.trim(), status: 'connected', label: 'OANDA Practice' }
      })
    } else {
      conn = await prisma.brokerConnection.create({
        data: {
          userId: uid,
          broker: 'oanda_practice',
          label: 'OANDA Practice',
          apiKey: token.trim(),
          accountId: accountId.trim(),
          status: 'connected',
        }
      })
    }

    return Response.json({ success: true, connectionId: conn.id, balance })
  } catch (e) {
    console.error('[oanda/connect]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.brokerConnection.deleteMany({
      where: { userId: session.user.id, broker: 'oanda_practice' }
    })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
