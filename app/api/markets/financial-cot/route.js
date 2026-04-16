export async function GET(request) {
  var s = new URL(request.url).searchParams
  var m = s.get("market") || "ES"
  var names = {"ES":"S&P 500 Consolidated","NQ":"NASDAQ-100 Consolidated","YM":"DJIA Consolidated","RTY":"RUSSELL E-MINI","ZN":"ULTRA UST 10Y","ZB":"UST BOND","ZF":"UST 5Y NOTE","6E":"EURO FX","6J":"JAPANESE YEN","6B":"BRITISH POUND"}
  var t = names[m] || m
  try {
    var e = encodeURIComponent(t)
    var u = "https://publicreporting.cftc.gov/resource/jun7-fc8e.json?$where=contract_market_name%20like%20%27%25" + e + "%25%27&$order=report_date_as_yyyy_mm_dd%20DESC&$limit=52"
    var r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0" } })
    var rows = await r.json()
    if (!Array.isArray(rows) || rows.length === 0) { return Response.json({ error: "No data for " + m }, { status: 404 }) }
    var l = rows[0]
    var cL = parseInt(l.comm_positions_long_all || 0)
    var cS = parseInt(l.comm_positions_short_all || 0)
    var sL = parseInt(l.noncomm_positions_long_all || 0)
    var sS = parseInt(l.noncomm_positions_short_all || 0)
    var nC = cL - cS
    var nS = sL - sS
    var ar = rows.slice(0, 52).reverse()
    function ci(a, c) { var mn=Math.min.apply(null,a),mx=Math.max.apply(null,a); return mx===mn?50:Math.round(((c-mn)/(mx-mn))*100) }
    var cNs = ar.map(function(r) { return parseInt(r.comm_positions_long_all||0)-parseInt(r.comm_positions_short_all||0) })
    var sNs = ar.map(function(r) { return parseInt(r.noncomm_positions_long_all||0)-parseInt(r.noncomm_positions_short_all||0) })
    var cI = ci(cNs, nC)
    var sI = ci(sNs, nS)
    var cd = ar.slice(-26).map(function(r) { return { date: r.report_date_as_yyyy_mm_dd?r.report_date_as_yyyy_mm_dd.split("T")[0]:"", dealer: parseInt(r.comm_positions_long_all||0)-parseInt(r.comm_positions_short_all||0), asset: parseInt(r.noncomm_positions_long_all||0)-parseInt(r.noncomm_positions_short_all||0), lev: 0, oi: parseInt(r.open_interest_all||0) } })
    return Response.json({ market: m, marketName: l.market_and_exchange_names, reportDate: l.report_date_as_yyyy_mm_dd?l.report_date_as_yyyy_mm_dd.split("T")[0]:"", openInterest: parseInt(l.open_interest_all||0), dealer: { long: cL, short: cS, net: nC, cotIndex: cI, signal: cI<=35?"BULLISH":cI>=75?"BEARISH":"NEUTRAL" }, assetManager: { long: sL, short: sS, net: nS, cotIndex: sI, signal: sI>=80?"EXTREME LONG":sI<=20?"EXTREME SHORT":"MODERATE" }, leveraged: { long: 0, short: 0, net: 0, cotIndex: 50, signal: "N/A" }, chartData: cd, weeksOfData: rows.length })
  } catch(err) { return Response.json({ error: err.message }, { status: 500 }) }
}