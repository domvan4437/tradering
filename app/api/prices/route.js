import { fetchPrices } from '../../../lib/marketData'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean) || []
  if (!symbols.length) return Response.json({ error: 'No symbols' }, { status: 400 })
  try {
    const results = await fetchPrices(symbols)
    return Response.json(results)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
