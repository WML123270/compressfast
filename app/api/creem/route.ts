import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/license'
import { sendLicenseEmail } from '@/lib/email'
import { incrementProPurchase } from '@/lib/stats'
import { getAndClearAttribution, recordConversion } from '@/lib/affiliate'

/**
 * Creem webhook handler
 * 接收 checkout.completed 事件 → 生成激活码 → 发邮件
 * Creem uses HMAC-SHA256 signature in creem-signature header
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: NextRequest) {
  // ─── 签名验证 ─────────────────────────
  const secret = process.env.CREEM_WEBHOOK_SECRET
  const signature = request.headers.get('creem-signature')

  if (!secret) {
    console.error('[Creem] CREEM_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  // Clone request to read body for verification, then parse
  const bodyText = await request.text()
  const isValid = await verifyCreemSignature(bodyText, signature, secret)
  if (!isValid) {
    console.error('[Creem] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ─── 处理 webhook ──────────────────────
  return processWebhook(JSON.parse(bodyText))
}

async function verifyCreemSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const key = await crypto.subtle.importKey(
      'raw', keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify'],
    )
    const sigBytes = new Uint8Array(signature.length / 2)
    for (let i = 0; i < signature.length; i += 2) {
      sigBytes[i / 2] = parseInt(signature.substring(i, i + 2), 16)
    }
    return await crypto.subtle.verify(
      'HMAC', key,
      sigBytes.buffer as ArrayBuffer,
      encoder.encode(payload).buffer as ArrayBuffer,
    )
  } catch {
    return false
  }
}

async function processWebhook(body: any) {
  try {
    const eventType = body?.eventType

    if (eventType !== 'checkout.completed') {
      return NextResponse.json({ received: true, skipped: eventType })
    }

    const email = body?.object?.customer?.email
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const orderId = body?.object?.order?.id
    const amount = body?.object?.order?.amount
    const orderAmount = amount
      ? `${(amount / 100).toFixed(2)} ${body.object.order.currency || 'USD'}`
      : undefined

    const license = await createLicense(email, orderId, orderAmount)

    // 联盟分销归属：检查是否有待处理的推荐关系
    const affCode = await getAndClearAttribution(email)
    if (affCode) {
      const recorded = await recordConversion(
        affCode,
        orderId || 'unknown',
        orderAmount || '$24.99 USD',
        email,
      )
      if (recorded) {
        console.log(`[Creem] Affiliate conversion: ${affCode} earned $12.50 from ${email}`)
      }
    }

    const sent = await sendLicenseEmail({ to: email, code: license.code, locale: 'en' })
    if (!sent) {
      console.log(`[Creem] Email not sent. Code: ${license.code} → ${email}`)
    }

    console.log(`[Creem] License ${license.code} → ${email}`)
    incrementProPurchase().catch(() => {})
    return NextResponse.json({ success: true, code: license.code })
  } catch (error: any) {
    console.error('[Creem] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
