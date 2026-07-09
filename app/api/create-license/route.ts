import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/license'
import { sendLicenseEmail } from '@/lib/email'

const CREEM_CHECKOUT = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL
  || 'https://www.creem.io/payment/prod_5RikkPSGxjekn6Tdro7vkw'

// IP 限流：每分钟 3 次（防止刷单）
const RATE_LIMIT = 3
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

/**
 * POST /api/create-license
 * Body: { email: string, locale?: string }
 * 付款前生成激活码 → 存 Redis → 发邮件 → 返回 Creem 支付链接
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()
    const locale = body.locale || 'en'

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    // 邮箱长度校验（防滥用）
    if (email.length > 254) {
      return NextResponse.json({ error: 'Email too long' }, { status: 400 })
    }

    // 先生成激活码
    const license = await createLicense(email)

    // 发送激活码邮件（Resend 未配置时静默跳过）
    const sent = await sendLicenseEmail({ to: email, code: license.code, locale })
    if (!sent) {
      console.log(`[CreateLicense] Email not sent (Resend not configured). Code: ${license.code} → ${email}`)
    }

    // 构建带邮箱的 Creem 支付链接
    const checkoutUrl = new URL(CREEM_CHECKOUT)
    checkoutUrl.searchParams.set('customer_email', email)

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl.toString(),
    })
  } catch (error: any) {
    console.error('[CreateLicense] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
