import { prisma } from '../../../lib/prisma'
import { sendEmail } from '../../../lib/email'
import crypto from 'crypto'

function makeToken(email) {
  const expiry = Date.now() + 1000 * 60 * 60 // 1 hour
  const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret'
  const sig = crypto.createHmac('sha256', secret).update(`${email}.${expiry}`).digest('hex')
  return Buffer.from(`${email}.${expiry}.${sig}`).toString('base64url')
}

export async function POST(request) {
  try {
    const { email } = await request.json()
    if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    // Always return success to avoid revealing which emails exist
    if (!user) return Response.json({ success: true })

    const token = makeToken(email.toLowerCase())
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

    await sendEmail({
      to: email,
      subject: 'Reset your TradeZar password',
      html: `
        <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
          <div style="margin-bottom:32px;">
            <span style="font-size:20px;font-weight:700;color:#1a1a2e;">TradeZar</span>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#1a1a2e;margin:0 0 12px;">Reset your password</h1>
          <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">
            We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#4f46e5;color:#fff;font-size:14px;font-weight:600;border-radius:10px;text-decoration:none;margin-bottom:28px;">
            Reset password
          </a>
          <p style="font-size:12px;color:#9ca3af;line-height:1.6;margin:0;">
            If you didn't request this, you can safely ignore this email. Your password won't change.
          </p>
        </div>
      `,
    })

    return Response.json({ success: true })
  } catch (e) {
    console.error('[reset-pw]', e)
    return Response.json({ error: e.message }, { status: 500 })
  }
}
