import { getSession } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

async function uploadToSupabase(file, userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase not configured')

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `avatars/${userId}/avatar.${ext}`
  const res = await fetch(`${supabaseUrl}/storage/v1/object/trade-media/${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': file.type,
      'x-upsert': 'true',
    },
    body: file,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return `${supabaseUrl}/storage/v1/object/public/trade-media/${path}`
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) return Response.json({ error: 'No file' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return Response.json({ error: 'Max 5MB' }, { status: 400 })

    let url
    try {
      url = await uploadToSupabase(file, session.user.id)
    } catch {
      // Fallback: base64 (dev without Supabase)
      const buffer = await file.arrayBuffer()
      url = `data:${file.type};base64,${Buffer.from(buffer).toString('base64')}`
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: url },
    })

    return Response.json({ url })
  } catch (e) {
    console.error('[POST /api/profile/avatar]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
