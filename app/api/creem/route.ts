import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/license'
import { sendLicenseEmail } from '@/lib/email'
import { incrementProPurchase } from '@/lib/stats'

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    // 发送激活码邮件
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
