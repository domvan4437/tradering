// app/api/risksize/route.js
export async function POST(request) {
  const { accountSize, riskPercent, entryPrice, stopPrice, contractSize } = await request.json()

  const riskPerTrade = accountSize * (riskPercent / 100)
  const riskPerContract = Math.abs(entryPrice - stopPrice) * (contractSize || 1)
  const contracts = riskPerContract > 0 ? Math.floor(riskPerTrade / riskPerContract) : 0
  const actualRisk = contracts * riskPerContract
  const target2R = entryPrice > stopPrice
    ? entryPrice + (entryPrice - stopPrice) * 2
    : entryPrice - (stopPrice - entryPrice) * 2
  const target3R = entryPrice > stopPrice
    ? entryPrice + (entryPrice - stopPrice) * 3
    : entryPrice - (stopPrice - entryPrice) * 3

  return Response.json({
    contracts,
    riskPerTrade: riskPerTrade.toFixed(2),
    actualRisk: actualRisk.toFixed(2),
    target2R: target2R.toFixed(4),
    target3R: target3R.toFixed(4),
    riskRewardNote: '2R and 3R targets based on entry-to-stop distance',
  })
}
