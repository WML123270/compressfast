import { NextRequest, NextResponse } from 'next/server'
import { verifyLicense } from '@/lib/license'
import { Redis } from '@upstash/redis'

// IP 限流（使用 Upstash Redis 或内存）
const RATE_LIMIT = 10 // requests per minute
const rateMap = new Map<string, { count: number; resetAt: number }>()

function getRateLimitKey(ip: string): string {
  return `ratelimit:verify:${ip}`
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = getRateLimitKey(ip)

  // Try Redis first
  if (process.env.UPSTASH_REDIS_URL) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN!,
      })
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, 60) // 1 minute window
      }
      return count <= RATE_LIMIT
    } catch {
      // Fall through to memory-based
    }
  }

  // Memory-based fallback
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + 60000 })
    return true
  }
  entry.count++
  return entry.count <= RATE_LIMIT
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = request.headers.get('user-agent') || undefined

  // Rate limiting
  const allowed = await checkRateLimit(ip)
  if (!allowed) {
    return NextResponse.json({ valid: false, reason: 'rate_limit' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string' || code.length < 8) {
      return NextResponse.json({ valid: false, reason: 'invalid_format' })
    }

    const result = await verifyLicense(code.toUpperCase().trim(), userAgent, ip)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ valid: false, reason: 'server_error' }, { status: 500 })
  }
}
