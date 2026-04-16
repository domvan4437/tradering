import { getSession } from '../../../lib/auth'

// Static commodity-relevant recurring events with next occurrence calculation
function getNextOccurrence(dayOfWeek, hour = 15, minute = 30) {
  const now = new Date()
  const result = new Date()
  result.setHours(hour, minute, 0, 0)
  const diff = (dayOfWeek - now.getDay() + 7) % 7
  result.setDate(now.getDate() + (diff === 0 && now > result ? 7 : diff))
  return result.toISOString()
}

function getNextMonthDay(day) {
  const now = new Date()
  const result = new Date(now.getFullYear(), now.getMonth(), day, 12, 0, 0)
  if (result <= now) result.setMonth(result.getMonth() + 1)
  return result.toISOString()
}

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const recurringEvents = [
    // Weekly
    { id: 'cot-weekly', title: 'COT Report Release', description: 'CFTC Commitments of Traders — commercial positioning update', category: 'COT', impact: 'HIGH', time: getNextOccurrence(5, 15, 30), recurrence: 'Weekly (Friday 3:30pm ET)', link: 'https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm' },
    { id: 'eia-crude', title: 'EIA Crude Oil Inventories', description: 'Weekly US crude oil, gasoline, distillate stocks', category: 'Energy', impact: 'HIGH', time: getNextOccurrence(3, 10, 30), recurrence: 'Weekly (Wednesday 10:30am ET)', link: 'https://www.eia.gov/petroleum/supply/weekly/' },
    { id: 'eia-gas', title: 'EIA Natural Gas Storage', description: 'Weekly natural gas storage change', category: 'Energy', impact: 'HIGH', time: getNextOccurrence(4, 10, 30), recurrence: 'Weekly (Thursday 10:30am ET)', link: 'https://www.eia.gov/naturalgas/storage/dashboard/' },
    // Monthly
    { id: 'wasde', title: 'USDA WASDE Report', description: 'World Agricultural Supply and Demand Estimates — corn, wheat, soybeans', category: 'Grains', impact: 'HIGH', time: getNextMonthDay(10), recurrence: 'Monthly (~10th)', link: 'https://www.usda.gov/oce/commodity/wasde/' },
    { id: 'crop-progress', title: 'USDA Crop Progress', description: 'Weekly crop condition ratings — corn, soybeans, wheat', category: 'Grains', impact: 'MEDIUM', time: getNextOccurrence(1, 16, 0), recurrence: 'Weekly (Monday 4pm ET, Apr–Nov)', link: 'https://www.nass.usda.gov/Publications/National_Statistics/' },
    { id: 'fomc', title: 'FOMC Meeting / Rate Decision', description: 'Federal Reserve interest rate decision — major impact on gold, silver, commodities', category: 'Macro', impact: 'HIGH', time: getNextMonthDay(19), recurrence: '8x per year', link: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm' },
    { id: 'cpi', title: 'CPI Inflation Report', description: 'Consumer Price Index — key driver for gold, energy', category: 'Macro', impact: 'HIGH', time: getNextMonthDay(12), recurrence: 'Monthly (~12th)', link: 'https://www.bls.gov/cpi/' },
    { id: 'jobs', title: 'Non-Farm Payrolls', description: 'US employment report — impacts dollar, gold, oil', category: 'Macro', impact: 'HIGH', time: getNextOccurrence(5, 8, 30), recurrence: 'First Friday of month', link: 'https://www.bls.gov/news.release/empsit.toc.htm' },
    { id: 'cattle-report', title: 'USDA Cattle on Feed', description: 'Monthly cattle inventory and placements report', category: 'Livestock', impact: 'HIGH', time: getNextMonthDay(20), recurrence: 'Monthly (~20th)', link: 'https://www.nass.usda.gov/Publications/Todays_Reports/' },
    { id: 'hogs-pigs', title: 'USDA Hogs & Pigs', description: 'Quarterly hog inventory report', category: 'Livestock', impact: 'HIGH', time: getNextMonthDay(28), recurrence: 'Quarterly', link: 'https://www.nass.usda.gov/Publications/Todays_Reports/' },
    { id: 'coffee-report', title: 'ICO Coffee Report', description: 'International Coffee Organization monthly statistics', category: 'Softs', impact: 'MEDIUM', time: getNextMonthDay(15), recurrence: 'Monthly', link: 'https://www.ico.org/new_historical.asp' },
    { id: 'gold-demand', title: 'World Gold Council Demand Trends', description: 'Quarterly gold demand by sector', category: 'Metals', impact: 'MEDIUM', time: getNextMonthDay(5), recurrence: 'Quarterly', link: 'https://www.gold.org/goldhub/research/gold-demand-trends' },
    { id: 'opec', title: 'OPEC Monthly Oil Report', description: 'OPEC production data and demand forecasts', category: 'Energy', impact: 'HIGH', time: getNextMonthDay(14), recurrence: 'Monthly', link: 'https://www.opec.org/opec_web/en/publications/338.htm' },
    { id: 'iea', title: 'IEA Oil Market Report', description: 'International Energy Agency monthly oil market outlook', category: 'Energy', impact: 'MEDIUM', time: getNextMonthDay(13), recurrence: 'Monthly', link: 'https://www.iea.org/reports/oil-market-report' },
    { id: 'commitment-traders', title: 'Bank Participation Report', description: 'Monthly breakdown of bank positions in futures markets', category: 'COT', impact: 'MEDIUM', time: getNextMonthDay(3), recurrence: 'Monthly (first Friday)', link: 'https://www.cftc.gov/MarketReports/BankParticipationReports/index.htm' },
  ]

  // Add seasonal notes
  const month = now.getMonth()
  const seasonalNotes = [
    { 0: 'Jan: Gold often strong · Natural gas peaks · Grains quiet' },
    { 1: 'Feb: Agricultural positioning begins · Gold seasonal low risk' },
    { 2: 'Mar: Planting season begins · Corn/soybean seasonal window opens' },
    { 3: 'Apr: USDA planting intentions · Energy demand shift' },
    { 4: 'May: Crop weather premium begins · Soft commodity focus' },
    { 5: 'Jun: Grain markets peak volatility · Summer driving demand' },
    { 6: 'Jul: Mid-crop season · Gold summer doldrums' },
    { 7: 'Aug: Crop condition critical · Gold seasonal buy window opens' },
    { 8: 'Sep: Harvest pressure on grains · Gold often strengthens' },
    { 9: 'Oct: Harvest complete · Energy winter premium builds' },
    { 10: 'Nov: Post-harvest · Natural gas heating demand' },
    { 11: 'Dec: Year-end repositioning · Holiday commodity patterns' },
  ]

  return Response.json({
    events: recurringEvents.sort((a, b) => new Date(a.time) - new Date(b.time)),
    currentSeasonalNote: seasonalNotes[month]?.[month] || '',
    categories: ['All', 'COT', 'Energy', 'Grains', 'Livestock', 'Metals', 'Softs', 'Macro'],
  })
}
