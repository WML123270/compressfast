import { NextRequest, NextResponse } from 'next/server'
import { getLicenseByEmail } from '@/lib/license'
import { sendLicenseEmail } from '@/lib/email'
import { Redis } from '@upstash/redis'

// IP 限流：每分钟 5 次（防暴力破解）
const RATE_LIMIT = 5
const rateMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(ip: string): Promise<boolean> {
  // Try Redis-based rate limiting
  if (process.env.UPSTASH_REDIS_URL) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN!,
      })
      const key = `ratelimit:lookup:${ip}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 60)
      return count <= RATE_LIMIT
    } catch {}
  }

  // Memory fallback
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
 * 查找/补发激活码
 * POST { email: string }
 * 查 Redis → 有就返回激活码 → 顺便尝试发邮件
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait a minute.' },
      { status: 429 },
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const license = await getLicenseByEmail(normalizedEmail)

    if (!license) {
      // 没找到 license，可能 webhook 还没到——查 pending 记录
      // 遍历 pending:* 找这个邮箱
      const pendingCode = await findPendingByEmail(normalizedEmail)

      return NextResponse.json({
        success: true,
        code: null,
        pending: !!pendingCode,
        message: pendingCode
          ? 'Payment received, generating your code. Please try again in a few seconds.'
          : 'No license found for this email.',
      })
    }

    // 尝试发邮件（Resend 未配置时静默跳过）
    const sent = await sendLicenseEmail({
      to: email,
      code: license.code,
      locale: 'en',
      subject: 'Your CompressFast Pro Activation Code',
    })

    return NextResponse.json({
      success: true,
      code: license.code,
      message: 'Activation code found.',
    })
  } catch (error) {
    console.error('[Resend License] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

/** 扫描 pending 记录找对应邮箱（webhook 可能还没到） */
async function findPendingByEmail(email: string): Promise<string | null> {
  try {
    if (!process.env.UPSTASH_REDIS_URL) return null
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN!,
    })
    // 扫描 pending:* 键
    const keys = await redis.keys('pending:*')
    if (!keys || keys.length === 0) return null
    for (const key of keys) {
      const raw = await redis.get(key)
      if (!raw) continue
      try {
        const record = typeof raw === 'string' ? JSON.parse(raw) : raw
        if (record.email === email) return key.replace('pending:', '')
      } catch {}
    }
    return null
  } catch {
    return null
  }
}
