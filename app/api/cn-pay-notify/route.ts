import { NextRequest, NextResponse } from 'next/server'
import { verifyHupiSign, getAndClearHupiPending, fulfillHupiOrder } from '@/lib/hupijiao'

/**
 * POST /api/cn-pay-notify — 虎皮椒支付结果异步通知
 * 验签 → 检查支付状态（OD=已支付）→ 反查邮箱 → 发激活码
 * 应答需包含 "success"（纯文本），否则平台会重复推送。
 */
export async function POST(request: NextRequest) {
  try {
    // 虎皮椒回调是 application/x-www-form-urlencoded
    const form = await request.formData()
    const params: Record<string, string> = {}
    form.forEach((value, key) => {
      params[key] = String(value)
    })

    // 1. 验签
    if (!verifyHupiSign(params)) {
      console.error('[CnPayNotify] 验签失败', Object.keys(params))
      return new NextResponse('fail', { status: 400 })
    }

    // 2. 检查支付状态（OD=已支付）
    const status = params.status || ''
    if (status !== 'OD') {
      console.log(`[CnPayNotify] 未支付状态: ${status || '(空)'}`)
      return new NextResponse('success')
    }

    // 3. 金额校验（防篡改）
    const fee = params.total_fee || ''
    if (fee !== '9.9' && fee !== '9.90') {
      console.error(`[CnPayNotify] 金额异常: ${fee}`)
      return new NextResponse('success') // 金额不对不处理，但应答避免重推
    }

    // 4. 反查邮箱
    const tradeOrderId = params.trade_order_id || ''
    const email = await getAndClearHupiPending(tradeOrderId)
    if (!email) {
      console.error(`[CnPayNotify] 找不到订单 ${tradeOrderId}`)
      return new NextResponse('success')
    }

    await fulfillHupiOrder(tradeOrderId, email)

    return new NextResponse('success')
  } catch (e) {
    console.error('[CnPayNotify] Error:', e)
    return new NextResponse('fail', { status: 500 })
  }
}
