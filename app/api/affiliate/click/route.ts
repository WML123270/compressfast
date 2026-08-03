import { NextRequest, NextResponse } from 'next/server'
import { trackClick } from '@/lib/affiliate'

/**
 * POST /api/affiliate/click
 * 记录一次推荐点击（由前端信标调用）
 * Body: { code: string }
 * 或自动从 aff_ref cookie 读取
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const code = body.code || request.cookies.get('aff_ref')?.value

    if (!code) {
      return NextResponse.json({ tracked: false, reason: 'no code' })
    }

    await trackClick(code)
    return NextResponse.json({ tracked: true })
  } catch {
    // 静默失败 — 不影响主流程
    return NextResponse.json({ tracked: false })
  }
}
