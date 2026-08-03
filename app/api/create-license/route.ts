import { NextRequest, NextResponse } from 'next/server'
import { createLicense } from '@/lib/license'
import { saveAttribution, getAffiliate } from '@/lib/affiliate'
import { Redis } from '@upstash/redis'

const CREEM_CHECKOUT = process.env.NEXT_PUBLIC_CREEM_CHECKOUT_URL
  || 'https://www.creem.io/payment/prod_5RikkPSGxjekn6Tdro7vkw'

// IP 限流：每分钟 3 次（防止刷单）
const RATE_LIMIT = 3
// 内存降级用的 Map（Redis 不可用时）
const rateMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(ip: string): Promise<boolean> {
  // 优先用 Redis（Vercel 多实例共享）
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      })
      const key = `ratelimit:create:${ip}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 60)
      return count <= RATE_LIMIT
    } catch {}
  }

  // 内存降级
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
 *
 * 付款前生成激活码 → 存 Redis（不发邮件）
 * 邮件由 Creem webhook 在付款成功后统一发送，避免重复
 * 若 webhook 延迟，用户可通过"忘记激活码"自行查询
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limiting (Redis-based on Vercel, memory fallback)
  if (!(await checkRateLimit(ip))) {
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

    // 生成激活码存入 Redis（不发邮件，等 webhook 确认付款后发）
    const license = await createLicense(email)

    // 联盟分销归属：读取 aff_ref cookie，存储待归属关系
    const affRef = request.cookies.get('aff_ref')?.value
    if (affRef) {
      const aff = await getAffiliate(affRef)
      if (aff && aff.active) {
        await saveAttribution(email, affRef)
        console.log(`[CreateLicense] Affiliate attribution: ${affRef} → ${email}`)
      }
    }

    // 构建带邮箱的 Creem 支付链接
    const checkoutUrl = new URL(CREEM_CHECKOUT)
    checkoutUrl.searchParams.set('customer_email', email)

    console.log(`[CreateLicense] Generated ${license.code} for ${email}, awaiting payment`)

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl.toString(),
    })
  } catch (error: any) {
    console.error('[CreateLicense] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
