const fs = require('fs')

const DB = `
const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(\`\${_URL}/rest/v1/\${t}\${q}\`, { headers: { apikey: _KEY, Authorization: \`Bearer \${_KEY}\` } }).then(r => r.json()),
  post: (t, b) => fetch(\`\${_URL}/rest/v1/\${t}\`, { method:'POST', headers: { apikey: _KEY, Authorization: \`Bearer \${_KEY}\`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(\`\${_URL}/rest/v1/\${t}\${q}\`, { method:'PATCH', headers: { apikey: _KEY, Authorization: \`Bearer \${_KEY}\`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(\`\${_URL}/rest/v1/\${t}\${q}\`, { method:'DELETE', headers: { apikey: _KEY, Authorization: \`Bearer \${_KEY}\` } }).then(r => r.status),
}
`

// 1. social/posts
fs.writeFileSync('app/api/social/posts/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const q = userId ? \`?userId=eq.\${userId}&order=createdAt.desc&limit=50\` : \`?order=createdAt.desc&limit=50\`
    const posts = await db.get('CommunityPost', q)
    return Response.json({ posts: posts || [] })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { content, type, asset, tags } = await request.json()
    if (!content?.trim()) return Response.json({ error: 'Content required' }, { status: 400 })
    const post = await db.post('CommunityPost', {
      userId: session.user.id,
      content: content.trim(),
      type: type || 'general',
      asset: asset || null,
      tags: tags || [],
      likes: 0,
      reposts: 0,
      createdAt: new Date().toISOString(),
    })
    return Response.json({ post: Array.isArray(post) ? post[0] : post })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function DELETE(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { postId } = await request.json()
    await db.del('CommunityPost', \`?id=eq.\${postId}&userId=eq.\${session.user.id}\`)
    return Response.json({ success: true })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ social/posts/route.js')

// 2. social/follow
fs.writeFileSync('app/api/social/follow/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { targetUserId, action } = await request.json()
    if (action === 'unfollow') {
      await db.del('Follow', \`?followerId=eq.\${session.user.id}&followingId=eq.\${targetUserId}\`)
    } else {
      const existing = await db.get('Follow', \`?followerId=eq.\${session.user.id}&followingId=eq.\${targetUserId}\`)
      if (!existing?.length) {
        await db.post('Follow', { followerId: session.user.id, followingId: targetUserId, createdAt: new Date().toISOString() })
      }
    }
    return Response.json({ success: true })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const [followers, following] = await Promise.all([
      db.get('Follow', \`?followingId=eq.\${userId}&select=followerId\`),
      db.get('Follow', \`?followerId=eq.\${userId}&select=followingId\`),
    ])
    return Response.json({ followers: followers?.length || 0, following: following?.length || 0 })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ social/follow/route.js')

// 3. social/messages (DMs)
fs.writeFileSync('app/api/social/messages/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const withUserId = searchParams.get('with')
    if (!withUserId) {
      const convos = await db.get('DirectMessage', \`?or=(senderId.eq.\${session.user.id},receiverId.eq.\${session.user.id})&order=createdAt.desc&limit=100\`)
      return Response.json({ messages: convos || [] })
    }
    const messages = await db.get('DirectMessage', \`?or=(and(senderId.eq.\${session.user.id},receiverId.eq.\${withUserId}),and(senderId.eq.\${withUserId},receiverId.eq.\${session.user.id}))&order=createdAt.asc&limit=100\`)
    return Response.json({ messages: messages || [] })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { receiverId, content } = await request.json()
    if (!content?.trim() || !receiverId) return Response.json({ error: 'Missing fields' }, { status: 400 })
    const msg = await db.post('DirectMessage', {
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    })
    return Response.json({ message: Array.isArray(msg) ? msg[0] : msg })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ social/messages/route.js')

// 4. profile/update
fs.writeFileSync('app/api/profile/update/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function PATCH(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const allowed = ['name','username','bio','country','city','tradingStyle','experience','assets','openToMeetups','openToMentoring','twitter','instagram','youtube','website','publicWinRate','publicPnl','publicTrades','publicLocation','tagline']
    const update = {}
    allowed.forEach(k => { if (body[k] !== undefined) update[k] = body[k] })
    update.updatedAt = new Date().toISOString()
    const user = await db.patch('User', \`?id=eq.\${session.user.id}\`, update)
    return Response.json({ user: Array.isArray(user) ? user[0] : user })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await db.get('User', \`?id=eq.\${session.user.id}&select=id,name,email,username,bio,country,city,tradingStyle,experience,assets,openToMeetups,openToMentoring,twitter,instagram,youtube,website,publicWinRate,publicPnl,publicTrades,publicLocation,tagline,plan\`)
    return Response.json({ user: user?.[0] || null })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ profile/update/route.js')

// 5. broker/sync
fs.writeFileSync('app/api/broker/sync/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    // Trigger Plaid sync
    const res = await fetch(\`\${process.env.NEXTAUTH_URL || ''}/api/plaid/sync\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') || '' }
    })
    const data = await res.json()
    return Response.json(data)
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const connections = await db.get('BrokerConnection', \`?userId=eq.\${session.user.id}&select=id,label,broker,status,lastSynced\`)
    const trades = await db.get('BrokerTrade', \`?userId=eq.\${session.user.id}&select=*&order=openedAt.desc&limit=100\`)
    return Response.json({ connections: connections || [], trades: trades || [] })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ broker/sync/route.js')

// 6. plaid/manual-trade
fs.writeFileSync('app/api/plaid/manual-trade/route.js', `import { getSession } from '../../../../lib/auth'
${DB}
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { symbol, direction, entryPrice, exitPrice, quantity, openedAt, closedAt, notes } = await request.json()
    if (!symbol || !direction || !entryPrice) return Response.json({ error: 'Missing required fields' }, { status: 400 })
    const pnl = exitPrice ? (direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice) * (quantity || 1) : null
    const connections = await db.get('BrokerConnection', \`?userId=eq.\${session.user.id}&limit=1\`)
    const connectionId = connections?.[0]?.id || 'manual'
    const trade = await db.post('BrokerTrade', {
      connectionId,
      userId: session.user.id,
      brokerTradeId: 'manual_' + Date.now(),
      asset: symbol,
      symbol,
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: exitPrice ? parseFloat(exitPrice) : null,
      quantity: parseFloat(quantity) || 1,
      contractSize: 1,
      realizedPnL: pnl,
      status: exitPrice ? 'closed' : 'open',
      notes: notes || null,
      openedAt: openedAt || new Date().toISOString(),
      closedAt: closedAt || (exitPrice ? new Date().toISOString() : null),
      createdAt: new Date().toISOString(),
    })
    return Response.json({ trade: Array.isArray(trade) ? trade[0] : trade })
  } catch(e) { return Response.json({ error: e.message }, { status: 500 }) }
}
`)
console.log('✓ plaid/manual-trade/route.js')

console.log('\n✓ All 6 priority routes rewritten to use Supabase')
console.log('Run: rd /s /q .next & npm run dev')
