import { prisma } from '../../../../lib/prisma'
import { sendEmail } from '../../../../lib/email'
import { fetchAllMarketData } from '../../../../lib/marketData'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { enabled: true, triggered: false },
    include: { user: { select: { email: true, name: true } } },
  })

  let triggered = 0
  const errors = []
  const checked = new Set()

  for (const alert of alerts) {
    try {
      const cacheKey = alert.symbol
      let marketData
      if (checked.has(cacheKey)) continue
      checked.add(cacheKey)

      marketData = await fetchAllMarketData(alert.symbol)
      if (!marketData || marketData.error) continue

      const currentPrice = parseFloat(marketData.price?.latest)
      let shouldTrigger = false

      if (alert.condition === 'above' && currentPrice >= alert.value) shouldTrigger = true
      if (alert.condition === 'below' && currentPrice <= alert.value) shouldTrigger = true
      if (alert.condition === 'cotIndex_above' && marketData.cot?.cotIndex >= alert.value) shouldTrigger = true
      if (alert.condition === 'cotIndex_below' && marketData.cot?.cotIndex <= alert.value) shouldTrigger = true

      if (shouldTrigger) {
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: { triggered: true, triggeredAt: new Date() },
        })

        await sendEmail({
          to: alert.user.email,
          subject: `🔔 Alert: ${alert.name} ${alert.condition} ${alert.value}`,
          html: `
            <div style="background:#0a0a0a;color:#e8e0d0;font-family:'Courier New',monospace;padding:40px 24px;max-width:600px;margin:0 auto;">
              <p style="color:#c8a84b;font-size:11px;letter-spacing:4px;margin-bottom:24px">COMMODITY INTELLIGENCE SYSTEM</p>
              <h1 style="font-size:28px;font-weight:300;margin:0 0 8px">Alert Triggered</h1>
              <p style="color:#555;margin:0 0 32px">${new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
              <div style="background:#0d0d0d;border:1px solid #222;padding:24px;margin-bottom:24px">
                <p style="font-size:11px;letter-spacing:2px;color:#555;margin:0 0 8px">COMMODITY</p>
                <p style="font-size:24px;margin:0 0 16px">${alert.name}</p>
                <p style="font-size:13px;color:#888;margin:0 0 4px">Condition: ${alert.condition.replace(/_/g,' ')} ${alert.value}</p>
                <p style="font-size:13px;color:#4caf82;margin:0">Current price: ${currentPrice}</p>
              </div>
              ${alert.message ? `<p style="color:#888;font-size:13px">${alert.message}</p>` : ''}
              <p style="margin-top:32px"><a href="${process.env.NEXTAUTH_URL}/app" style="color:#c8a84b">Open app →</a></p>
            </div>`,
        })
        triggered++
      }
    } catch (err) {
      errors.push({ alertId: alert.id, error: err.message })
    }
  }

  return Response.json({ success: true, triggered, errors })
}
