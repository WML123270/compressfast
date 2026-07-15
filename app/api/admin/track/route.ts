/**
 * POST /api/admin/track
 * 记录网站事件（公开 API，前端调用）
 * Body: { event: 'pageview' | 'compression', count?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { incrementPageView, incrementCompression, trackUniqueVisitor } from '@/lib/stats'

export async function POST(request: NextRequest) {
  try {
    const { event, count, visitorId, host } = await request.json()

    // 按域名区分：jisuyatu.com=国内 / 其他=海外
    const site = (host === 'jisuyatu.com' || host === 'www.jisuyatu.com') ? 'cn' : 'os'

    switch (event) {
      case 'pageview':
        await Promise.all([
          incrementPageView(site),
          trackUniqueVisitor(visitorId || '', site),
        ])
        break
      case 'compression':
        await incrementCompression(count || 1)
        break
      default:
        return NextResponse.json({ error: '未知事件' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
