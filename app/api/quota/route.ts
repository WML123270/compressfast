/**
 * GET  /api/quota — check monthly compression quota for this IP
 * POST /api/quota — increment quota after compression
 *
 * IP-based monthly quota (400 images/month for free users)
 * Stored in Upstash Redis with 32-day TTL
 * Falls back to always-allow if Redis is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const MONTHLY_LIMIT = 400
const QUOTA_TTL = 32 * 24 * 3600 // 32 days

let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
    return redis
  }
  return null
}

function getIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'
}

function getKey(ip: string): string {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `quota:${ip}:${month}`
}

/** GET — check current usage */
export async function GET(request: NextRequest) {
  try {
    const r = getRedis()
    if (!r) return NextResponse.json({ used: 0, limit: MONTHLY_LIMIT, allowed: true })

    const ip = getIP(request)
    const key = getKey(ip)
    const raw = await r.get(key)
    const used = typeof raw === 'number' ? raw : parseInt(String(raw ?? '0'), 10) || 0

    return NextResponse.json({
      used,
      limit: MONTHLY_LIMIT,
      allowed: used < MONTHLY_LIMIT,
    })
  } catch {
    // Fail open — don't block users if Redis is down
    return NextResponse.json({ used: 0, limit: MONTHLY_LIMIT, allowed: true })
  }
}

/** POST — increment usage counter after compression */
export async function POST(request: NextRequest) {
  try {
    const { count } = await request.json()
    const r = getRedis()
    if (!r) return NextResponse.json({ success: true })

    const ip = getIP(request)
    const key = getKey(ip)
    await r.incrby(key, count || 1)
    await r.expire(key, QUOTA_TTL)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false })
  }
}
