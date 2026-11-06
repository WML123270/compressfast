/**
 * Pro 激活码逻辑
 * - 生成/验证激活码
 * - Upstash Redis 存储
 * - 设备计数（每码最多 5 设备）
 * - 内存缓存（Redis 不可用时的降级）
 */

import { Redis } from '@upstash/redis'

const MAX_DEVICES = 5

// Lazy init Redis（没有配置时用内存缓存降级）
let redis: Redis | null = null
function getRedis(): Redis | null {
  if (redis) return redis
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
    return redis
  }
  return null
}

// 内存缓存（开发环境或无 Redis 时降级）
const memCache = new Map<string, LicenseRecord>()
const memEmailCache = new Map<string, string>() // email → code

export interface LicenseRecord {
  code: string
  email: string
  created_at: string
  active: boolean
  devices: string[]    // 设备指纹列表
  orderId?: string     // LS 订单号
  orderAmount?: string // 订单金额
}

export function generateLicenseCode(): string {
  // Format: XXXX-XXXX-XXXX (12 chars, uppercase alphanumeric)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 避开易混淆字符 0/O/1/I
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  const segments: string[] = []
  for (let s = 0; s < 3; s++) {
    let seg = ''
    for (let i = 0; i < 4; i++) {
      seg += chars[bytes[s * 4 + i] % chars.length]
    }
    segments.push(seg)
  }
  return segments.join('-')
}

export function generateDeviceFingerprint(userAgent: string, ip?: string): string {
  // 服务端 fallback：UA + IP 前 3 段（/24），比单纯 UA 更能区分不同网络的设备
  // 前端会优先传更精确的多因子指纹（见 lib/device-fingerprint.ts）
  const ipSeg = ip ? ip.split('.').slice(0, 3).join('.') : 'unknown'
  return simpleHash(`${userAgent.slice(0, 150)}|${ipSeg}`)
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export async function createLicense(
  email: string,
  orderId?: string,
  orderAmount?: string,
): Promise<LicenseRecord> {
  // 安全关键：orderId 只在「支付确认后」（Creem/虎皮椒/LS 回调）才会传入。
  //   - 无 orderId（付款前，如 /api/create-license）→ active=false，码不可用
  //   - 有 orderId（支付回调）→ active=true，码才可用
  // 防止「调 create-license 白拿一个可用激活码」的绕过。
  const paid = !!orderId

  // 检查是否已有激活码（防止重复回调覆盖）
  const existing = await getLicenseByEmail(email)
  if (existing) {
    let changed = false
    // 更新订单信息（可能第一次没记录）
    if (orderId && !existing.orderId) {
      existing.orderId = orderId
      existing.orderAmount = orderAmount
      changed = true
    }
    // 支付确认 → 从未支付/撤销状态激活
    if (paid && !existing.active) {
      existing.active = true
      changed = true
    }
    if (changed) {
      const r = getRedis()
      if (r) {
        await r.set(`license:${existing.code}`, JSON.stringify(existing))
      } else {
        memCache.set(`license:${existing.code}`, existing)
      }
    }
    return existing
  }

  const code = generateLicenseCode()
  const record: LicenseRecord = {
    code,
    email,
    created_at: new Date().toISOString(),
    active: paid,
    devices: [],
    orderId,
    orderAmount,
  }

  const r = getRedis()
  if (r) {
    await r.set(`license:${code}`, JSON.stringify(record))
    await r.set(`license:email:${email}`, code)
  } else {
    // ⚠️ 内存缓存不会在 Vercel 函数间持久化 — 生产环境必须配 Upstash Redis
    memCache.set(`license:${code}`, record)
    memEmailCache.set(email, code)
  }

  return record
}

export async function verifyLicense(
  code: string,
  userAgent?: string,
  ip?: string,
  fingerprint?: string,
): Promise<{ valid: boolean; reason?: string; email?: string }> {
  const r = getRedis()
  let record: LicenseRecord | null = null

  if (r) {
    // Upstash Redis 自动 JSON.parse，返回的是对象不是字符串
    const raw = await r.get(`license:${code}`)
    if (raw) {
      record = (typeof raw === 'string' ? JSON.parse(raw) : raw) as LicenseRecord
    }
  } else {
    record = memCache.get(`license:${code}`) || null
  }

  if (!record) return { valid: false, reason: 'not_found' }
  if (!record.active) return { valid: false, reason: 'revoked' }

  // Check device limit
  if (fingerprint || userAgent) {
    const fp = fingerprint || generateDeviceFingerprint(userAgent || '', ip)
    if (!record.devices.includes(fp)) {
      if (record.devices.length >= MAX_DEVICES) {
        return { valid: false, reason: 'device_limit' }
      }
      // Add new device
      record.devices.push(fp)
      if (r) {
        await r.set(`license:${code}`, JSON.stringify(record))
      } else {
        memCache.set(`license:${code}`, record)
      }
    }
  }

  return { valid: true, email: record.email }
}

/** 解析 Redis 返回值（可能是对象或字符串） */
function parseRecord(raw: unknown): LicenseRecord | null {
  if (!raw) return null
  if (typeof raw === 'string') return JSON.parse(raw) as LicenseRecord
  return raw as LicenseRecord
}

export async function getLicenseByEmail(email: string): Promise<LicenseRecord | null> {
  const r = getRedis()
  if (r) {
    const code = await r.get(`license:email:${email}`)
    if (!code) return null
    const raw = await r.get(`license:${code as string}`)
    return parseRecord(raw)
  }

  const code = memEmailCache.get(email)
  if (!code) return null
  return memCache.get(`license:${code}`) || null
}

export async function revokeLicense(code: string): Promise<boolean> {
  const r = getRedis()
  if (r) {
    const raw = await r.get(`license:${code}`)
    const record = parseRecord(raw)
    if (!record) return false
    record.active = false
    await r.set(`license:${code}`, JSON.stringify(record))
  } else {
    const cached = memCache.get(`license:${code}`)
    if (!cached) return false
    cached.active = false
    memCache.set(`license:${code}`, cached)
  }
  return true
}

export async function resetDevices(email: string): Promise<boolean> {
  const r = getRedis()
  if (r) {
    const code = await r.get(`license:email:${email}`)
    if (!code) return false
    const raw = await r.get(`license:${code as string}`)
    const record = parseRecord(raw)
    if (!record) return false
    record.devices = []
    await r.set(`license:${code as string}`, JSON.stringify(record))
  } else {
    const code = memEmailCache.get(email)
    if (!code) return false
    const cached = memCache.get(`license:${code}`)
    if (!cached) return false
    cached.devices = []
    memCache.set(`license:${code}`, cached)
  }
  return true
}
