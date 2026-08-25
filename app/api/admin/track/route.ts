/**
 * POST /api/admin/track
 * 记录网站事件（公开 API，前端调用）
 * Body: { event: 'pageview' | 'compression', count?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { incrementPageView, incrementCompression, trackUniqueVisitor, recordFileSizes, checkCompressionRateLimit, markVisitorActive, isVisitorActive } from '@/lib/stats'
import { isLikelyBot } from '@/lib/bot-detection'

function getIP(request: NextRequest): string {
  // Vercel 走 Cloudflare：cf-connecting-ip 才是真实客户端 IP
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (xff) return xff
  return '0.0.0.0'
}

export async function POST(request: NextRequest) {
  try {
    // 过滤爬虫/自动化流量，避免污染统计
    if (isLikelyBot(request.headers.get('user-agent'))) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }

    const { event, count, visitorId, host, sizes } = await request.json()

    // 按域名区分：jisuyatu.com=国内 / 其他=海外
    const site = (host === 'jisuyatu.com' || host === 'www.jisuyatu.com') ? 'cn' : 'os'

    switch (event) {
      case 'pageview':
        await Promise.all([
          incrementPageView(site),
          trackUniqueVisitor(visitorId || '', site),
          markVisitorActive(visitorId || ''),
        ])
        break
      case 'compression': {
        const n = Math.max(1, Math.min(Number(count) || 1, 500))
        // 校验：压缩事件必须带 visitorId，且该 visitorId 先有 pageview 前置
        // （防脚本直连 POST /api/admin/track 伪造压缩量，8/25 第 3 次爬虫暴增）
        if (!(await isVisitorActive(visitorId || ''))) {
          return NextResponse.json({ success: true, skipped: 'no_session' })
        }
        // 单 IP 每日限流：爬虫暴增时不污染统计（不阻断实际压缩）
        const allowed = await checkCompressionRateLimit(getIP(request), n)
        if (allowed <= 0) {
          return NextResponse.json({ success: true, skipped: 'rate_limit' })
        }
        await incrementCompression(allowed, site)
        // Track file size distribution
        if (sizes && Array.isArray(sizes)) {
          await recordFileSizes(sizes, site)
        }
        break
      }
      default:
        return NextResponse.json({ error: '未知事件' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
