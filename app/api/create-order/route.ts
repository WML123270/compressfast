import { NextRequest, NextResponse } from 'next/server'
import { savePendingOrder } from '@/lib/pending-order'

function generatePid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let id = ''
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length]
  }
  return id
}

/**
 * POST /api/create-order
 * Body: { email: string }
 * 存 Redis → 返回带 email + pid 参数的 checkout URL
 */
export async function POST(request: NextRequest) {
  const checkoutUrl = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL

  if (!checkoutUrl) {
    console.error('[CreateOrder] NEXT_PUBLIC_LEMON_SQUEEZY_CHECKOUT_URL not configured')
    return NextResponse.json({ error: 'Payment not available' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const email = (body.email || '').toLowerCase().trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const pid = generatePid()

    // 存 Redis（30 分钟过期）
    await savePendingOrder(pid, email)

    // 构建带参数的 checkout URL
    const url = new URL(checkoutUrl)
    url.searchParams.set('checkout[email]', email)
    url.searchParams.set('checkout[custom][pid]', pid)

    return NextResponse.json({ url: url.toString() })
  } catch (error) {
    console.error('[CreateOrder] Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
