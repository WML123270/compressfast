/**
 * POST /api/admin/auth
 * 验证 admin key 并设置 cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminKey, setAdminCookie } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json()
    if (!key || !verifyAdminKey(key)) {
      return NextResponse.json({ error: '密钥错误' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    setAdminCookie(response)
    return response
  } catch {
    return NextResponse.json({ error: '请求无效' }, { status: 400 })
  }
}
