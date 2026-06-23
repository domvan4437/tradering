import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET — return (or create) the user's webhook connection and URL
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    let conn = await prisma.brokerConnection.findFirst({
      where: { userId: uid, broker: 'webhook' }
    })

    if (!conn) {
      const secret = crypto.randomBytes(20).toString('hex')
      conn = await prisma.brokerConnection.create({
        data: {
          userId: uid,
          broker: 'webhook',
          label: 'TradingView / Webhook',
          apiKey: secret,
          status: 'connected',
        }
      })
    }

    const base = process.env.NEXTAUTH_URL || 'https://tradering.vercel.app'
    return Response.json({
      webhookUrl: `${base}/api/broker/webhook/${uid}?key=${conn.apiKey}`,
      key: conn.apiKey,
      connectionId: conn.id,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}

// POST — regenerate secret
export async function POST() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const secret = crypto.randomBytes(20).toString('hex')
    const existing = await prisma.brokerConnection.findFirst({ where: { userId: uid, broker: 'webhook' } })

    let conn
    if (existing) {
      conn = await prisma.brokerConnection.update({ where: { id: existing.id }, data: { apiKey: secret } })
    } else {
      conn = await prisma.brokerConnection.create({
        data: { userId: uid, broker: 'webhook', label: 'TradingView / Webhook', apiKey: secret, status: 'connected' }
      })
    }

    const base = process.env.NEXTAUTH_URL || 'https://tradering.vercel.app'
    return Response.json({
      webhookUrl: `${base}/api/broker/webhook/${uid}?key=${conn.apiKey}`,
      key: conn.apiKey,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
