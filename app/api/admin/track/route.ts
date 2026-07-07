/**
 * POST /api/admin/track
 * 记录网站事件（公开 API，前端调用）
 * Body: { event: 'pageview' | 'compression', count?: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { incrementPageView, incrementCompression } from '@/lib/stats'

export async function POST(request: NextRequest) {
  try {
    const { event, count } = await request.json()

    switch (event) {
      case 'pageview':
        await incrementPageView()
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
