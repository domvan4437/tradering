import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')

  const courses = await prisma.groupCourse.findMany({
    where: groupId ? { groupId } : {},
    include: {
      lessons: { orderBy: { order: 'asc' } },
      _count: { select: { lessons: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Add published/price/enrollments fields for compatibility
  const normalized = courses.map(c => ({
    ...c,
    price: 0,
    published: true,
    enrollments: 0,
  }))

  return Response.json({ courses: normalized })
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { groupId, title, description, price, lessons } = await request.json()

  const course = await prisma.groupCourse.create({
    data: {
      groupId, title,
      description: description || null,
      lessons: lessons?.length ? {
        create: lessons.map((l, i) => ({
          title: l.title,
          content: l.content || '',
          videoUrl: l.videoUrl || null,
          order: i,
        }))
      } : undefined
    },
    include: { lessons: true }
  })

  return Response.json({ course: { ...course, price: price||0, published: true, enrollments: 0 } })
}

export async function PATCH(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, title, description } = await request.json()
  const course = await prisma.groupCourse.update({
    where: { id },
    data: { ...(title&&{title}), ...(description&&{description}) }
  })
  return Response.json({ course })
}
