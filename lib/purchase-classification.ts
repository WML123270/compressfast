// 订单/激活码归类：区分「真实外部用户」「自购」「测试」
// 判定顺序：先看有没有支付订单号，再看邮箱特征。
// 没有 orderId 的历史激活码（安全测试、手工发码）不算付费。

export type PurchaseKind = 'external' | 'self' | 'test'

const OWNER_EMAILS = new Set(['756971388@qq.com', '756971388wml@gmail.com'])

const TEST_PATTERNS: RegExp[] = [
  /@test\.com$/i,
  /@t\.com$/i,
  /@example\.com$/i,
  /^test/i,
  /^hacker/i,
  /^hupitest/i,
  /^securtest/i,
  /^bypass-test/i,
  /^replay_/i,
  /^v2_/i,
  /^paid\d/i,
]

export function classifyPurchase(email?: string, orderId?: string): PurchaseKind {
  // 没有支付订单号 → 从未走支付回调，只能是测试/手工码
  if (!orderId) return 'test'
  const e = (email || '').toLowerCase().trim()
  if (!e) return 'test'
  if (OWNER_EMAILS.has(e)) return 'self'
  if (TEST_PATTERNS.some((p) => p.test(e))) return 'test'
  return 'external'
}

/** 金额缺失时不要伪造默认价（历史 bug：后台把无订单记录显示成 $24.99） */
export function displayAmount(orderAmount?: string): string {
  return orderAmount && orderAmount.trim() ? orderAmount : '—'
}
