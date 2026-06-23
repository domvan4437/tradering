import { getSession } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export const dynamic = 'force-dynamic'

const DEMO_BASE = 'https://demo.tradovateapi.com/v1'

// Tradovate uses a registered app ID — this is the app's own developer credentials.
// Users supply only their username + password.
const APP_ID      = process.env.TRADOVATE_APP_ID      || 'Sample App'
const APP_VERSION = process.env.TRADOVATE_APP_VERSION  || '1.0'
const APP_SECRET  = process.env.TRADOVATE_APP_SECRET   || ''

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const uid = session.user.id

    const { username, password } = await request.json()
    if (!username || !password) return Response.json({ error: 'Username and password are required' }, { status: 400 })

    // Authenticate with Tradovate demo
    const authRes = await fetch(`${DEMO_BASE}/auth/accesstokenrequest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: username.trim(),
        password,
        appId: APP_ID,
        appVersion: APP_VERSION,
        cids: 0,
        sec: APP_SECRET,
      }),
    })

    const authData = await authRes.json()
    if (!authData?.accessToken) {
      return Response.json({
        error: authData?.errorText || authData?.p || 'Login failed — check your username and password',
      }, { status: 400 })
    }

    const accessToken = authData.accessToken

    const existing = await prisma.brokerConnection.findFirst({
      where: { userId: uid, broker: 'tradovate_demo' }
    })

    let conn
    if (existing) {
      conn = await prisma.brokerConnection.update({
        where: { id: existing.id },
        data: {
          apiKey: username.trim(),
          apiSecret: password,
          accessToken,
          status: 'connected',
          label: 'Tradovate Demo',
        }
      })
    } else {
      conn = await prisma.brokerConnection.create({
        data: {
          userId: uid,
          broker: 'tradovate_demo',
          label: 'Tradovate Demo',
          apiKey: username.trim(),
          apiSecret: password,
          accessToken,
          status: 'connected',
        }
      })
    }

    return Response.json({ success: true, connectionId: conn.id })
  } catch (e) {
    console.error('[tradovate/connect]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.brokerConnection.deleteMany({
      where: { userId: session.user.id, broker: 'tradovate_demo' }
    })
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
