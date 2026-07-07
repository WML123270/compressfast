/**
 * GET /api/admin/stats
 * 返回仪表盘统计数据（需鉴权）
 */

import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getDashboardStats } from '@/lib/stats'

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || '服务器错误' }, { status: 500 })
  }
}
