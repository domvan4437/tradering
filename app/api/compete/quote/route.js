import { getSession } from '../../../../lib/auth'
import { fetchQuote, classifySymbol, getMaxLeverage } from '../../../../lib/competitionPrices'

export async function GET(req) {
  try {
    const session = await getSession()
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const symbol = (searchParams.get('symbol') || '').trim().toUpperCase()
    if (!symbol) return Response.json({ error: 'symbol required' }, { status: 400 })

    const quote = await fetchQuote(symbol)
    const assetType = classifySymbol(symbol)
    return Response.json({
      ...quote,
      assetType,
      maxLeverage: getMaxLeverage(assetType),
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 })
  }
}
