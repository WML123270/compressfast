/**
 * POST /api/admin/logout
 * 清除 admin cookie（服务端操作，httpOnly cookie 只能由服务端清除）
 */

import { NextResponse } from 'next/server'
import { clearAdminCookie } from '@/lib/admin-auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  clearAdminCookie(response)
  return response
}
