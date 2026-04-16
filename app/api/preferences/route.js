import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true, dashboardLayout: true, customFields: true, name: true, username: true, bio: true },
  })
  return Response.json(user)
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const updates = await request.json()
  const allowed = ['theme', 'dashboardLayout', 'customFields', 'name', 'username', 'bio']
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: filtered,
    select: { theme: true, dashboardLayout: true, customFields: true, name: true, username: true, bio: true },
  })
  return Response.json(user)
}
