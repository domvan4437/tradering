import { getSession } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

// Uses Supabase Storage REST API directly (no extra SDK needed)
async function uploadToSupabase(file, userId, filename) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase not configured')

  const path = `${userId}/${Date.now()}-${filename}`
  const res = await fetch(`${supabaseUrl}/storage/v1/object/trade-media/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: file,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return `${supabaseUrl}/storage/v1/object/public/trade-media/${path}`
}

export async function GET(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const screeningId = searchParams.get('screeningId')
  const positionId = searchParams.get('positionId')

  const media = await prisma.tradeMedia.findMany({
    where: {
      userId: session.user.id,
      ...(screeningId ? { screeningId } : {}),
      ...(positionId ? { positionId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(media)
}

export async function POST(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const screeningId = formData.get('screeningId') || null
  const positionId = formData.get('positionId') || null
  const caption = formData.get('caption') || ''

  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  let url
  try {
    url = await uploadToSupabase(file, session.user.id, file.name)
  } catch (err) {
    // Fallback: store as base64 data URL for dev environments without Supabase Storage
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    url = `data:${file.type};base64,${base64}`
  }

  const media = await prisma.tradeMedia.create({
    data: {
      userId: session.user.id,
      screeningId,
      positionId,
      url,
      caption,
      type: file.type.startsWith('image/') ? 'image' : 'file',
    },
  })

  return Response.json(media)
}

export async function DELETE(request) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.tradeMedia.delete({ where: { id, userId: session.user.id } })
  return Response.json({ success: true })
}
