import { NextRequest, NextResponse } from 'next/server'
import { verifyLoginToken, createSessionToken } from '@/lib/affiliate'

/** POST /api/affiliate/verify — 验证 magic link token，返回 affiliate 数据 + session token */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = (body.token || '').trim()

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token required' }, { status: 400 })
    }

    const affiliate = await verifyLoginToken(token)
    if (!affiliate) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired token' }, { status: 401 })
    }

    // 创建会话 token（24h 有效，用于后续 stats 等鉴权 API）
    const sessionToken = await createSessionToken(affiliate.code)

    return NextResponse.json({
      valid: true,
      sessionToken,
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        email: affiliate.email,
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions,
        totalEarnings: affiliate.totalEarnings,
        paidOut: affiliate.paidOut,
        active: affiliate.active,
      },
    })
  } catch (error: any) {
    console.error('[Affiliate Verify] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
