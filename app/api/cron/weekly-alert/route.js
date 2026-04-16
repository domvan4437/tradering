// app/api/cron/weekly-alert/route.js
import { prisma } from '../../../../lib/prisma'
import { sendEmail, weeklyAlertEmail } from '../../../../lib/email'
import { fetchAllMarketData } from '../../../../lib/marketData'

// Called by Vercel cron every Friday at 6pm ET (after CFTC release at 3:30pm)
export async function GET(request) {
  // Verify this is a legitimate cron call
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all users with alerts enabled on pro/trader plans
  const users = await prisma.user.findMany({
    where: {
      plan: { in: ['pro', 'trader'] },
      subscriptionStatus: { in: ['active', 'trialing'] },
      alerts: { some: { type: 'weekly_cot', enabled: true } },
    },
    include: {
      watchlist: true,
      alerts: { where: { type: 'weekly_cot' } },
    },
  })

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const defaultWatchlist = ['Gold', 'Crude Oil', 'Corn', 'Natural Gas', 'Silver', 'Wheat', 'Soybeans', 'Coffee']

  let emailsSent = 0
  const errors = []

  for (const user of users) {
    try {
      const watchlist = user.watchlist.length > 0
        ? user.watchlist.map(w => w.commodity)
        : defaultWatchlist

      // Fetch market data for each commodity (limit to 8 to keep email reasonable)
      const commodities = watchlist.slice(0, 8)
      const results = []

      for (const commodity of commodities) {
        try {
          const md = await fetchAllMarketData(commodity)
          if (md.error) continue

          // Quick pass/fail based on key signals (simplified version for email)
          const signals = {
            trending: md.price?.trending,
            dollarBearish: md.usdx?.bearishForCommodities,
            commercialBullish: md.cot?.netCommercial > 0,
            oiDropped: md.cot?.oiDropped15,
          }
          const signalCount = Object.values(signals).filter(Boolean).length
          const passed = signalCount >= 3
          const direction = md.cot?.netCommercial > 0 ? 'BUY' : 'SELL'

          results.push({
            commodity,
            passed,
            direction: passed ? direction : null,
            stageFailed: !passed ? 'Signal threshold not met' : null,
            price: md.price?.latest,
          })
        } catch { continue }
      }

      const html = weeklyAlertEmail({ userName: user.name || user.email.split('@')[0], results, date })

      await sendEmail({
        to: user.email,
        subject: `Weekly COT Report — ${results.filter(r => r.passed).length} setups passing · ${date}`,
        html,
      })

      // Update lastSent
      await prisma.alert.updateMany({
        where: { userId: user.id, type: 'weekly_cot' },
        data: { lastSent: new Date() },
      })

      emailsSent++
    } catch (err) {
      errors.push({ userId: user.id, error: err.message })
    }
  }

  return Response.json({ success: true, emailsSent, errors })
}
