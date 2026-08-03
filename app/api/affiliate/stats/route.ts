import { NextRequest, NextResponse } from 'next/server'
import { validateSession, getAffiliate, getConversions, getDailyClicks } from '@/lib/affiliate'

/** GET /api/affiliate/stats — 需登录（session token） */
export async function GET(request: NextRequest) {
  try {
    // Auth: require session token
    const sessionToken = request.nextUrl.searchParams.get('token')
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const affCode = await validateSession(sessionToken)
    if (!affCode) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const affiliate = await getAffiliate(affCode)
    if (!affiliate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const [conversions, dailyClicks] = await Promise.all([
      getConversions(affCode),
      getDailyClicks(affCode),
    ])

    // 脱敏：转换记录不暴露购买者完整邮箱
    const safeConversions = conversions.map(c => ({
      orderId: c.orderId?.slice(0, 8) + '...',
      amount: c.amount,
      commission: c.commission,
      timestamp: c.timestamp,
    }))

    return NextResponse.json({
      affiliate: {
        code: affiliate.code,
        name: affiliate.name,
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions,
        totalEarnings: affiliate.totalEarnings,
        paidOut: affiliate.paidOut,
        active: affiliate.active,
      },
      conversions: safeConversions,
      dailyClicks,
      commissionRate: 50,
      link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'}?ref=${affiliate.code}`,
    })
  } catch (error: any) {
    console.error('[Affiliate Stats] Error:', error)
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
