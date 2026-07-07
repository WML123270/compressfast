/** GET /api/admin/ping — 简单测试 API 是否可达 */
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: true, time: Date.now() })
}
