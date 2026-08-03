import { NextRequest, NextResponse } from 'next/server'
import { generateLoginToken } from '@/lib/affiliate'
import { Redis } from '@upstash/redis'

// IP 限流：每分钟 2 次（防邮件滥用）
const RATE_LIMIT = 2
const rateMap = new Map<string, { count: number; resetAt: number }>()

async function checkRateLimit(ip: string): Promise<boolean> {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_URL,
        token: process.env.UPSTASH_REDIS_TOKEN,
      })
      const key = `ratelimit:aff-login:${ip}`
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

/**
 * POST /api/affiliate/login — 请求 magic link
 * Body: { email, locale? }
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!(await checkRateLimit(ip))) {
    return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()
    const userLocale = body.locale || 'en'

    if (!email || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    const token = await generateLoginToken(email)
    if (!token) {
      // Don't reveal whether affiliate exists
      return NextResponse.json({ success: true, message: 'If registered, check your email' })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'
    // Use user's locale in the login link
    const langPrefix = ['zh', 'en'].includes(userLocale) ? userLocale : 'en'
    const loginUrl = `${siteUrl}/${langPrefix}/affiliates?token=${token}`

    // Send magic link email via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@jisuyatu.com'

    if (RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `CompressFast Affiliates <${FROM_EMAIL}>`,
            to: email,
            subject: 'Your CompressFast Affiliate Login',
            html: [
              '<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">',
              '<h2>CompressFast Affiliate Portal</h2>',
              '<p>Click the button below to sign in to your affiliate dashboard:</p>',
              '<div style="text-align: center; margin: 24px 0;">',
              `<a href="${loginUrl}" style="background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Sign In</a>`,
              '</div>',
              '<p style="color: #6b7280; font-size: 14px;">This link expires in 10 minutes.</p>',
              '</div>',
            ].join('\n'),
          }),
        })
      } catch (e) {
        console.error('[Affiliate Login] Email error:', e)
      }
    } else {
      console.log(`[Affiliate Login] Would send magic link to ${email}: ${loginUrl}`)
    }

    return NextResponse.json({ success: true, message: 'If registered, check your email' })
  } catch (error: any) {
    console.error('[Affiliate Login] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
