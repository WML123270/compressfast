/**
 * GET /api/admin/licenses — 列表
 * POST /api/admin/licenses — 操作 { action: 'revoke'|'reset-devices', code: '...' }
 * 需鉴权
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getAllLicenses } from '@/lib/stats'
import { revokeLicense } from '@/lib/license'
import { getLicenseByEmail, resetDevices } from '@/lib/license'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const licenses = await getAllLicenses()
    return NextResponse.json({ licenses })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const { action, code, email } = await request.json()

    switch (action) {
      case 'revoke': {
        if (!code) return NextResponse.json({ error: '缺少激活码' }, { status: 400 })
        const ok = await revokeLicense(code)
        return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 })
      }
      case 'reset-devices': {
        if (!email && !code) return NextResponse.json({ error: '缺少邮箱或激活码' }, { status: 400 })
        // 如果传的是 code，先查到 email
        const targetEmail = email
        if (!targetEmail) {
          return NextResponse.json({ error: '暂不支持按激活码重置，请提供邮箱' }, { status: 400 })
        }
        const ok = await resetDevices(targetEmail)
        return NextResponse.json({ success: ok }, { status: ok ? 200 : 404 })
      }
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}
