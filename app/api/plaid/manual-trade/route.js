import { getSession } from '../../../../lib/auth'

const _URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const _KEY = process.env.SUPABASE_SERVICE_KEY
const db = {
  get: (t, q='') => fetch(`${_URL}/rest/v1/${t}${q}`, { headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.json()),
  post: (t, b) => fetch(`${_URL}/rest/v1/${t}`, { method:'POST', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  patch: (t, q, b) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'PATCH', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify(b) }).then(r => r.json()),
  del: (t, q) => fetch(`${_URL}/rest/v1/${t}${q}`, { method:'DELETE', headers: { apikey: _KEY, Authorization: `Bearer ${_KEY}` } }).then(r => r.status),
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const { symbol, direction, entryPrice, exitPrice, quantity, openedAt, closedAt, notes } = await request.json()
    if (!symbol || !direction || !entryPrice) return Response.json({ error: 'Missing required fields' }, { status: 400 })
    const pnl = exitPrice ? (direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice) * (quantity || 1) : null
    const connections = await db.get('BrokerConnection', `?userId=eq.${session.user.id}&limit=1`)
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
