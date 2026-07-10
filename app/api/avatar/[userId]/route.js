import { prisma } from '../../../../lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req, { params }) {
  try {
    const { userId } = params
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { image: true },
    })

    if (!user?.image) {
      return new Response(null, { status: 404 })
    }

    const img = user.image

    // Serve base64 data URLs directly
    if (img.startsWith('data:')) {
      const commaIdx = img.indexOf(',')
      const header = img.slice(0, commaIdx)
      const data = img.slice(commaIdx + 1)
      const contentType = header.replace('data:', '').replace(';base64', '')
      const buffer = Buffer.from(data, 'base64')
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    // For Supabase or any external URL — try to proxy it with the service key
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    const fetchHeaders = supabaseKey ? { Authorization: `Bearer ${supabaseKey}` } : {}

    const upstream = await fetch(img, { headers: fetchHeaders })
    if (!upstream.ok) {
      return new Response(null, { status: 404 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const body = await upstream.arrayBuffer()
    return new Response(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (e) {
    return new Response(null, { status: 404 })
  }
}
