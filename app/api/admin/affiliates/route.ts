import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getAllAffiliates, getAffiliate, updateAffiliate, getConversions } from '@/lib/affiliate'

/** GET /api/admin/affiliates — 列表 */
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const affiliates = await getAllAffiliates()
    return NextResponse.json({ affiliates })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}

/** POST /api/admin/affiliates — 管理操作 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { action, code, ...rest } = await request.json()

    switch (action) {
      case 'toggle-active': {
        const aff = await getAffiliate(code)
        if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const updated = await updateAffiliate(code, { active: !aff.active })
        return NextResponse.json({ success: true, affiliate: updated })
      }
      case 'mark-paid': {
        const amount = rest.amount || 0
        const aff = await getAffiliate(code)
        if (!aff) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const updated = await updateAffiliate(code, { paidOut: (aff.paidOut || 0) + amount })
        return NextResponse.json({ success: true, affiliate: updated })
      }
      case 'update': {
        const updated = await updateAffiliate(code, rest)
        if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ success: true, affiliate: updated })
      }
      case 'conversions': {
        const conversions = await getConversions(code)
        return NextResponse.json({ conversions })
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
