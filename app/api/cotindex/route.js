// app/api/cotindex/route.js
export async function POST(request) {
  const { cotKeyword } = await request.json()
  if (!cotKeyword) return Response.json({ error: 'No cotKeyword' }, { status: 400 })

  try {
    const encoded = encodeURIComponent(cotKeyword.toUpperCase())
    // Fetch last 3 years of COT data (156 weeks)
    const url = `https://publicreporting.cftc.gov/resource/6dca-aqww.json?$where=upper(market_and_exchange_names) like '%25${encoded}%25'&$order=report_date_as_yyyy_mm_dd DESC&$limit=156`

    const res = await fetch(url)
    if (!res.ok) return Response.json({ error: 'CFTC fetch failed' }, { status: 500 })
    const rows = await res.json()
    if (!rows.length) return Response.json({ error: 'No COT data found' }, { status: 404 })

    // Calculate net commercial for each week
    const history = rows.map((r) => {
      const long = parseInt(r.comm_positions_long_all || 0)
      const short = parseInt(r.comm_positions_short_all || 0)
      const oi = parseInt(r.open_interest_all || 0)
      return {
        date: r.report_date_as_yyyy_mm_dd?.split('T')[0],
        net: long - short,
        long,
        short,
        oi,
      }
    }).reverse() // oldest first

    // COT Index: where does current net sit in 3-year range (0=most bearish, 100=most bullish)
    const nets = history.map((h) => h.net)
    const minNet = Math.min(...nets)
    const maxNet = Math.max(...nets)
    const currentNet = nets[nets.length - 1]
    const cotIndex = maxNet === minNet ? 50 : Math.round(((currentNet - minNet) / (maxNet - minNet)) * 100)

    // OI index
    const ois = history.map((h) => h.oi)
    const minOI = Math.min(...ois)
    const maxOI = Math.max(...ois)
    const currentOI = ois[ois.length - 1]
    const oiIndex = maxOI === minOI ? 50 : Math.round(((currentOI - minOI) / (maxOI - minOI)) * 100)

    // Chart data: last 52 weeks
    const chartData = history.slice(-52).map((h) => ({
      date: h.date,
      net: h.net,
      oi: h.oi,
    }))

    return Response.json({
      cotIndex,
      oiIndex,
      currentNet,
      minNet,
      maxNet,
      currentOI,
      interpretation: cotIndex >= 75 ? 'EXTREMELY BULLISH' : cotIndex >= 60 ? 'BULLISH' : cotIndex >= 40 ? 'NEUTRAL' : cotIndex >= 25 ? 'BEARISH' : 'EXTREMELY BEARISH',
      chartData,
      weeksOfData: history.length,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
