import { NextRequest, NextResponse } from 'next/server'
import { createAffiliate, createSessionToken } from '@/lib/affiliate'
import { Redis } from '@upstash/redis'

// IP 限流：每分钟 3 次
const RATE_LIMIT = 3
const rateMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(ip: string): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      })
      const key = `ratelimit:aff-signup:${ip}`
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

/** POST /api/affiliate/signup — 注册成为分销商 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()
    const name = (body.name || '').trim()
    const paypalEmail = (body.paypalEmail || '').trim()

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Name required (2-100 chars)' }, { status: 400 })
    }

    const affiliate = await createAffiliate(email, name, paypalEmail || email)
    const sessionToken = await createSessionToken(affiliate.code)

    return NextResponse.json({
      success: true,
      sessionToken,
      code: affiliate.code,
      link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'}?ref=${affiliate.code}`,
    })
  } catch (error: any) {
    console.error('[Affiliate Signup] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
