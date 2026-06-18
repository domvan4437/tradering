import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split('.')
    if (parts.length < 3) return null
    const sig = parts.pop()
    const expiry = parts.pop()
    const email = parts.join('.')
    if (Date.now() > parseInt(expiry)) return null
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
    const expected = crypto.createHmac('sha256', secret).update(`${email}.${expiry}`).digest('hex')
    if (sig !== expected) return null
    return email
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const email = verifyToken(token)
    if (!email) return Response.json({ error: 'Reset link is invalid or has expired' }, { status: 400 })

    const hash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { email }, data: { password: hash } })

    return Response.json({ success: true })
  } catch (e) {
    console.error('[reset-pw/confirm]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
