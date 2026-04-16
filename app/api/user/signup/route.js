// app/api/user/signup/route.js
import bcrypt from 'bcryptjs'
import { prisma } from '../../../../lib/prisma'

export async function POST(request) {
  const { email, password, name } = await request.json()

  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 })
  if (password.length < 8) return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) return Response.json({ error: 'Email already registered' }, { status: 400 })

  const hashed = await bcrypt.hash(password, 12)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14-day trial

  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashed,
      name: name || '',
      plan: 'free',
      trialEndsAt,
    },
  })

  return Response.json({ success: true, userId: user.id })
}
