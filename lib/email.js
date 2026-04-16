// lib/email.js
export async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'alerts@commodityscreener.com',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Email send failed: ${err}`)
  }
  return res.json()
}

export function weeklyAlertEmail({ userName, results, date }) {
  const rows = results.map(r => {
    const statusColor = r.passed ? '#4caf82' : '#e05a4e'
    const dirColor = r.direction === 'BUY' ? '#4caf82' : r.direction === 'SELL' ? '#e05a4e' : '#888'
    return `
      <tr style="border-bottom:1px solid #222;">
        <td style="padding:12px 8px;font-size:14px;color:#e8e0d0;">${r.commodity}</td>
        <td style="padding:12px 8px;"><span style="color:${statusColor};font-size:12px;letter-spacing:1px;">${r.passed ? '✓ PASS' : `✗ FAIL — ${r.stageFailed}`}</span></td>
        <td style="padding:12px 8px;"><span style="color:${dirColor};font-size:13px;font-weight:bold;letter-spacing:2px;">${r.direction || '—'}</span></td>
        <td style="padding:12px 8px;font-size:12px;color:#888;">${r.price || '—'}</td>
      </tr>`
  }).join('')

  const passing = results.filter(r => r.passed).length

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0a0a0a;color:#e8e0d0;font-family:'Courier New',monospace;padding:0;margin:0;">
  <div style="max-width:640px;margin:0 auto;padding:40px 24px;">
    <div style="border-bottom:1px solid #222;padding-bottom:20px;margin-bottom:32px;">
      <div style="width:10px;height:10px;background:#c8a84b;transform:rotate(45deg);display:inline-block;margin-right:12px;"></div>
      <span style="font-size:11px;letter-spacing:4px;color:#c8a84b;">COMMODITY INTELLIGENCE SYSTEM</span>
    </div>

    <h1 style="font-size:28px;font-weight:300;margin:0 0 8px;">Weekly COT<br/><span style="color:#c8a84b;">Alert Report</span></h1>
    <p style="color:#555;font-size:13px;margin:0 0 32px;">Week of ${date} · ${passing} of ${results.length} commodities passing all stages</p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
      <thead>
        <tr style="border-bottom:1px solid #333;">
          <th style="padding:8px;text-align:left;font-size:10px;letter-spacing:2px;color:#555;">COMMODITY</th>
          <th style="padding:8px;text-align:left;font-size:10px;letter-spacing:2px;color:#555;">STATUS</th>
          <th style="padding:8px;text-align:left;font-size:10px;letter-spacing:2px;color:#555;">SIGNAL</th>
          <th style="padding:8px;text-align:left;font-size:10px;letter-spacing:2px;color:#555;">PRICE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${passing > 0 ? `
    <div style="background:#080d09;border:1px solid #1a3d2a;padding:20px;margin-bottom:32px;">
      <p style="font-size:10px;letter-spacing:3px;color:#4caf82;margin:0 0 8px;">PASSING SETUPS THIS WEEK</p>
      <p style="font-size:14px;color:#e8e0d0;margin:0;">${results.filter(r => r.passed).map(r => `${r.commodity} (${r.direction})`).join(' · ')}</p>
    </div>` : `
    <div style="background:#0d0808;border:1px solid #3d1a1a;padding:20px;margin-bottom:32px;">
      <p style="font-size:13px;color:#888;margin:0;">No commodities passing all 9 stages this week. Patience is a position.</p>
    </div>`}

    <div style="border-top:1px solid #222;padding-top:20px;font-size:11px;color:#444;">
      <p>This alert was generated automatically every Friday after CFTC data release.</p>
      <p>Data sources: CFTC public API · Yahoo Finance · 15-year seasonal analysis</p>
      <p style="margin-top:16px;"><a href="${process.env.NEXTAUTH_URL}/app" style="color:#c8a84b;">Open full app →</a> &nbsp;|&nbsp; <a href="${process.env.NEXTAUTH_URL}/api/alerts/unsubscribe?email=${encodeURIComponent('')}" style="color:#555;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
}
