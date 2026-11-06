import { NextRequest, NextResponse } from 'next/server'
import { createHupiPayment, saveHupiPending } from '@/lib/hupijiao'
import { Redis } from '@upstash/redis'

// 防刷：每 IP 每分钟最多 3 次下单（防止滥用虎皮椒接口 + 刷 Redis）
const RATE_LIMIT = 3

async function checkRateLimit(ip: string): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      })
      const key = `ratelimit:cn-create:${ip}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 60)
      return count <= RATE_LIMIT
    } catch {}
  }
  return true // Redis 不可用时放行
}

/**
 * POST /api/cn-create-order
 * Body: { email: string }
 * 生成虎皮椒支付订单 → 返回手机端跳转链接 / PC 端二维码
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('cf-connecting-ip')?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    if (email.length > 254) {
      return NextResponse.json({ error: 'Email too long' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jisuyatu.com'
    const tradeOrderId = 'cf' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

    // 先存 email 映射（回调时反查），再创建支付订单
    await saveHupiPending(tradeOrderId, email)

    const result = await createHupiPayment({
      tradeOrderId,
      totalFee: '9.9',
      title: '极速压图 Pro 永久买断',
      notifyUrl: `${siteUrl}/api/cn-pay-notify`,
      returnUrl: `${siteUrl}/pro`,
    })

    if (!result.ok) {
      console.error('[CnCreateOrder] 虎皮椒下单失败:', result.errmsg)
      return NextResponse.json({ error: result.errmsg || '支付创建失败' }, { status: 502 })
    }

    return NextResponse.json({ success: true, tradeOrderId, url: result.url, qrcode: result.qrcode })
  } catch (error: any) {
    console.error('[CnCreateOrder] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
