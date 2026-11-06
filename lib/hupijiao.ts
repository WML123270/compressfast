/**
 * 虎皮椒支付（个人免签）API 对接
 * - 创建订单 → 返回手机端跳转链接 / PC 端二维码
 * - 签名：MD5（排除 hash 和空值 → 按 key ASCII 升序 → k=v&... → 末尾拼 appsecret → 32 位小写）
 * - 支付结果异步通知 → 验签 → 发激活码（幂等）
 */

import crypto from 'crypto'
import { Redis } from '@upstash/redis'
import { createLicense } from './license'
import { sendLicenseEmail } from './email'
import { incrementProPurchase } from './stats'

const GATEWAY = process.env.HUPIJIAO_GATEWAY || 'https://api.xunhupay.com'
const APPID = process.env.HUPIJIAO_APPID || ''
const APPSECRET = process.env.HUPIJIAO_APPSECRET || ''

function md5(str: string): string {
  return crypto.createHash('md5').update(str, 'utf8').digest('hex')
}

/** 生成签名（按虎皮椒规则） */
export function makeHupiSign(params: Record<string, string>): string {
  const keys = Object.keys(params)
    .filter((k) => k !== 'hash' && params[k] !== '' && params[k] != null)
    .sort()
  const query = keys.map((k) => `${k}=${params[k]}`).join('&')
  return md5(query + APPSECRET)
}

/** 校验虎皮椒回调签名 */
export function verifyHupiSign(params: Record<string, string>): boolean {
  const hash = (params.hash || '').toLowerCase()
  if (!hash) return false
  return makeHupiSign(params).toLowerCase() === hash
}

export interface HupiPaymentResult {
  ok: boolean
  url?: string    // 手机端跳转链接
  qrcode?: string // PC 端二维码地址
  errmsg?: string
}

/** 创建虎皮椒支付订单 */
export async function createHupiPayment(opts: {
  tradeOrderId: string
  totalFee: string
  title: string
  notifyUrl: string
  returnUrl: string
}): Promise<HupiPaymentResult> {
  if (!APPID || !APPSECRET) {
    return { ok: false, errmsg: '虎皮椒支付未配置' }
  }

  const params: Record<string, string> = {
    version: '1.1',
    appid: APPID,
    trade_order_id: opts.tradeOrderId,
    total_fee: opts.totalFee,
    title: opts.title,
    time: String(Math.floor(Date.now() / 1000)),
    notify_url: opts.notifyUrl,
    return_url: opts.returnUrl,
    nonce_str: Math.random().toString(36).slice(2) + Date.now().toString(36),
  }
  params.hash = makeHupiSign(params)

  try {
    const res = await fetch(`${GATEWAY}/payment/do.html`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    })
    const data = await res.json()
    if (data.errcode && Number(data.errcode) !== 0) {
      return { ok: false, errmsg: data.errmsg || `虎皮椒错误 ${data.errcode}` }
    }
    return { ok: true, url: data.url, qrcode: data.url_qrcode }
  } catch (e: any) {
    return { ok: false, errmsg: e?.message || '虎皮椒请求失败' }
  }
}

// ─── 待支付订单（trade_order_id → email 映射）───

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  }
  return null
}

export async function saveHupiPending(tradeOrderId: string, email: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  await r.set(`hupi-pending:${tradeOrderId}`, JSON.stringify({ email, created_at: new Date().toISOString() }))
  await r.expire(`hupi-pending:${tradeOrderId}`, 24 * 3600) // 24 小时
}

export async function getAndClearHupiPending(tradeOrderId: string): Promise<string | null> {
  const r = getRedis()
  if (!r) return null
  try {
    const raw = await r.get(`hupi-pending:${tradeOrderId}`)
    if (!raw) return null
    await r.del(`hupi-pending:${tradeOrderId}`)
    const record = typeof raw === 'string' ? JSON.parse(raw) : (raw as { email?: string })
    return record?.email || null
  } catch {
    return null
  }
}

/** 支付成功后发码（幂等：用 trade_order_id 去重，避免重复通知重复发码） */
export async function fulfillHupiOrder(tradeOrderId: string, email: string): Promise<void> {
  const r = getRedis()
  if (r) {
    const key = `hupi-paid:${tradeOrderId}`
    const exists = await r.exists(key)
    if (exists === 1) return
    await r.set(key, '1', { ex: 7 * 24 * 3600 })
  }

  const license = await createLicense(email, tradeOrderId, '9.90 CNY')
  await sendLicenseEmail({ to: email, code: license.code, locale: 'zh' })
  incrementProPurchase(9.9).catch(() => {})
  console.log(`[HupiJiao] 发码 ${license.code} → ${email} (order ${tradeOrderId})`)
}
