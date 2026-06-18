import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) return Response.json({ error: 'Missing fields' }, { status: 400 })
    if (newPassword.length < 8) return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { password: true } })
    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return Response.json({ error: 'Current password is incorrect' }, { status: 400 })

    const hash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hash } })

    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
