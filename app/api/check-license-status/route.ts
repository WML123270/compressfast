import { NextRequest, NextResponse } from 'next/server'
import { getLicenseByEmail } from '@/lib/license'
import { Redis } from '@upstash/redis'

/**
 * POST /api/check-license-status
 * Body: { email: string }
 *
 * 只查询激活码状态，不发邮件。用于支付二维码展示后的短轮询，
 * 避免像 /api/resend-license 那样每次查询都重发一封邮件。
 * 查不到时返回 found:false（支付回调可能还没到）。
 */

const RATE_LIMIT = 20
const rateMap = new Map<string, { count: number; resetAt: number }>()

function getIP(request: NextRequest): string {
  return request.headers.get('cf-connecting-ip')?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || 'unknown'
}

async function checkRateLimit(ip: string): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      })
      const key = `ratelimit:license-status:${ip}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 60)
      return count <= RATE_LIMIT
    } catch {}
  }

  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60000 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

export async function POST(request: NextRequest) {
  if (!(await checkRateLimit(getIP(request)))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : ''

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const license = await getLicenseByEmail(email)
    return NextResponse.json(
      { found: Boolean(license), code: license?.code || null },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('[CheckLicenseStatus] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
