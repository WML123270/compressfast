import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/license'
import { getPendingEmail } from '@/lib/pending-order'

/**
 * Lemon Squeezy webhook handler
 * 接收订单完成事件 → 生成激活码 → 发邮件
 *
 * LS sends: POST with X-Signature header (HMAC-SHA256)
 * Event type: order_created (or order.paid for one-time products)
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-signature')
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET

  // 必须配置 secret 且验证签名，拒绝未签名请求
  if (!secret) {
    console.error('[LS Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  const body = await request.text()
  const isValid = await verifySignature(body, signature, secret)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  return await processWebhook(JSON.parse(body))
}

async function processWebhook(body: any) {
  try {
    const eventName = body.meta?.event_name
    const orderData = body.data?.attributes

    // Only process completed orders
    if (eventName !== 'order_created' && eventName !== 'order.paid') {
      return NextResponse.json({ received: true, skipped: eventName })
    }

    let email = orderData?.user_email || orderData?.email

    // 兜底：从 LS 的 custom data 里取 pid → 查我们的 Redis
    if (!email) {
      const customData = body.data?.attributes?.custom_data
        || body.meta?.custom_data
        || body.data?.custom_data
      const pid = typeof customData === 'object' ? customData?.pid : null
      if (pid && typeof pid === 'string') {
        const fallbackEmail = await getPendingEmail(pid)
        if (fallbackEmail) email = fallbackEmail
      }
    }

    if (!email) {
      console.error('[LS Webhook] No email in webhook data and no pending record')
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    // order_created / order.paid 事件本身就表示支付成功
    // 无需额外检查 status 字段

    // Generate license (handles duplicate webhooks safely)
    const orderId = body.data?.id || undefined
    const orderAmount = orderData?.total || orderData?.total_formatted || undefined
    const license = await createLicense(email, orderId, orderAmount)

    // Only send email for NEW licenses (not duplicates)
    if (!license.orderId || license.orderId === orderId) {
      await sendActivationEmail(email, license.code, orderId === body.data?.id)
    }

    console.log(`[LS Webhook] License: ${license.code} for ${email} (order: ${orderId || 'N/A'})`)
    return NextResponse.json({ success: true, code: license.code })
  } catch (error) {
    console.error('[LS Webhook] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  // Lemon Squeezy uses HMAC-SHA256
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const sigBytes = new Uint8Array(signature.length / 2)
    for (let i = 0; i < signature.length; i += 2) {
      sigBytes[i / 2] = parseInt(signature.substring(i, i + 2), 16)
    }
    return await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes.buffer as ArrayBuffer,
      encoder.encode(payload).buffer as ArrayBuffer,
    )
  } catch (err) {
    // NEVER skip verification — if crypto fails, reject the request
    console.error('[LS Webhook] Signature verification error:', err)
    return false
  }
}

async function sendActivationEmail(email: string, code: string, _isNewOrder?: boolean): Promise<void> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@jisuyatu.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'

  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send to ${email}: activation code ${code}`)
    console.log(`[Email] Set RESEND_API_KEY to enable email sending`)
    return
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `CompressFast <${FROM_EMAIL}>`,
        to: email,
        subject: 'Your CompressFast Pro Activation Code',
        html: [
          '<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">',
          '<h2>Thank you for going Pro!</h2>',
          '<p>Your activation code is:</p>',
          '<div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 16px 0;">',
          `<span style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 4px;">${code}</span>`,
          '</div>',
          '<p>To activate:</p>',
          '<ol>',
          `<li>Visit <a href="${siteUrl}/en/pro">CompressFast Pro</a></li>`,
          '<li>Enter the code above</li>',
          '<li>Enjoy unlimited batch compression!</li>',
          '</ol>',
          '<p style="color: #6b7280; font-size: 14px;">This code works on up to 5 devices. Need help? Reply to this email.</p>',
          '</div>',
        ].join('\n'),
      }),
    })

    if (!res.ok) {
      console.error('[Email] Failed to send:', await res.text())
    }
  } catch (error) {
    console.error('[Email] Error:', error)
  }
}
