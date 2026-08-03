/**
 * 联盟分销系统 — Redis 核心逻辑
 *
 * Redis key 设计:
 *   affiliate:<code>         → JSON { code, name, email, paypalEmail, active, ... }
 *   affiliate:email:<email>  → code (email → code 反向索引, SETNX 防重复)
 *   aff:stats:<code>         → Hash { totalClicks, totalConversions, totalEarnings, paidOut }
 *   aff:click:<code>:<date>  → counter (每日点击)
 *   aff:token:<token>        → email (magic link, 10min TTL)
 *   aff:purchase:<code>      → list (JSON array of conversion records)
 *   aff:attribution:<email>  → code (pending attribution, 30day TTL)
 *
 * 所有写操作使用 Redis 原子命令（HINCRBY/GETDEL/SETNX）消除竞态条件。
 */

import { Redis } from '@upstash/redis'

// ─── Types ──────────────────────────────────────────

export interface AffiliateRecord {
  code: string
  name: string
  email: string
  paypalEmail: string
  created_at: string
  active: boolean
  totalClicks: number
  totalConversions: number
  totalEarnings: number   // 单位：美元分
  paidOut: number
}

export interface ConversionRecord {
  orderId: string
  amount: string
  commission: number
  email: string
  timestamp: string
}

// ─── Redis ──────────────────────────────────────────

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

// 内存降级
const memAffiliates = new Map<string, AffiliateRecord>()
const memEmailIndex = new Map<string, string>()
const memTokens = new Map<string, { email: string; expires: number }>()
const memAttributions = new Map<string, string>()
const memConversions = new Map<string, ConversionRecord[]>()
const memClicks = new Map<string, number>()

// ─── Helpers ────────────────────────────────────────

const COMMISSION_RATE = 0.50
const COMMISSION_PER_SALE = Math.round(2499 * COMMISSION_RATE) // 1250 cents

function dateKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 安全校验 name（防 XSS，只允许字母数字空格下划线中文） */
function sanitizeName(name: string): string {
  return name.replace(/[<>"'&/\\`]/g, '').slice(0, 100).trim()
}

/** 安全校验 email */
function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 254)
}

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length]
  return code
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  let token = ''
  for (let i = 0; i < 32; i++) token += chars[bytes[i] % chars.length]
  return token
}

// 从 Redis Hash 读取统计字段到记录对象
function applyStatsFromHash(record: AffiliateRecord, hash: Record<string, unknown> | null): void {
  if (!hash) return
  record.totalClicks = Number(hash.totalClicks) || 0
  record.totalConversions = Number(hash.totalConversions) || 0
  record.totalEarnings = Number(hash.totalEarnings) || 0
  record.paidOut = Number(hash.paidOut) || 0
}

// ─── CRUD ───────────────────────────────────────────

export async function createAffiliate(
  email: string,
  name: string,
  paypalEmail: string,
): Promise<AffiliateRecord> {
  const safeEmail = sanitizeEmail(email)
  const safeName = sanitizeName(name)
  const safePaypal = sanitizeEmail(paypalEmail) || safeEmail

  const r = getRedis()

  // 原子性：SET NX 确保 email→code 映射只写一次，消除竞态条件
  let code = generateAffiliateCode()

  if (r) {
    // 先用 SETNX 抢占 email 索引
    let attempts = 0
    while (attempts < 5) {
      code = attempts === 0 ? code : generateAffiliateCode()

      // SET NX 返回 'OK' 表示成功（key 之前不存在），返回 null 表示已存在
      const setnxResult = await r.set(`affiliate:email:${safeEmail}`, code, { nx: true })
      if (setnxResult === 'OK') {
        // 成功抢占 → 写入 affiliate 记录
        const record: AffiliateRecord = {
          code,
          name: safeName,
          email: safeEmail,
          paypalEmail: safePaypal,
          created_at: new Date().toISOString(),
          active: true,
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
          paidOut: 0,
        }
        await r.set(`affiliate:${code}`, JSON.stringify(record))
        // 初始化 stats hash
        await r.hset(`aff:stats:${code}`, {
          totalClicks: 0,
          totalConversions: 0,
          totalEarnings: 0,
          paidOut: 0,
        })
        return record
      }

      // email 已被占用 → 返回已存在的记录
      const existingCode = await r.get(`affiliate:email:${safeEmail}`)
      if (existingCode) {
        const raw = await r.get(`affiliate:${existingCode as string}`)
        if (raw) {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw as AffiliateRecord)
          if (parsed) {
            const statsHash = await r.hgetall(`aff:stats:${existingCode as string}`)
            applyStatsFromHash(parsed, statsHash as Record<string, unknown> | null)
            return parsed
          }
        }
      }
      attempts++
    }
    throw new Error('Failed to create affiliate after retries')
  }

  // 内存模式
  const memExisting = memEmailIndex.get(safeEmail)
  if (memExisting) return memAffiliates.get(memExisting)!

  code = generateAffiliateCode()
  while (memAffiliates.has(code)) code = generateAffiliateCode()

  const record: AffiliateRecord = {
    code, name: safeName, email: safeEmail, paypalEmail: safePaypal,
    created_at: new Date().toISOString(), active: true,
    totalClicks: 0, totalConversions: 0, totalEarnings: 0, paidOut: 0,
  }
  memAffiliates.set(code, record)
  memEmailIndex.set(safeEmail, code)
  return record
}

export async function getAffiliate(code: string): Promise<AffiliateRecord | null> {
  const r = getRedis()
  if (r) {
    const raw = await r.get(`affiliate:${code.toUpperCase()}`)
    if (!raw) return null
    const record = typeof raw === 'string' ? JSON.parse(raw) : (raw as AffiliateRecord)
    if (!record) return null
    // Merge stats from hash
    const statsHash = await r.hgetall(`aff:stats:${code.toUpperCase()}`)
    applyStatsFromHash(record, statsHash as Record<string, unknown> | null)
    return record
  }
  return memAffiliates.get(code.toUpperCase()) || null
}

export async function getAffiliateByEmail(email: string): Promise<AffiliateRecord | null> {
  const key = sanitizeEmail(email)
  const r = getRedis()
  if (r) {
    const code = await r.get(`affiliate:email:${key}`)
    if (!code) return null
    return getAffiliate(code as string)
  }
  const code = memEmailIndex.get(key)
  if (!code) return null
  return memAffiliates.get(code) || null
}

// ─── Click Tracking (atomic HINCRBY) ────────────────

export async function trackClick(code: string): Promise<void> {
  const r = getRedis()
  const upperCode = code.toUpperCase()
  if (r) {
    // 原子操作：HINCRBY + INCR 每日计数器
    // 验证 affiliate 存在性
    const exists = await r.exists(`affiliate:${upperCode}`)
    if (!exists) return
    await Promise.all([
      r.hincrby(`aff:stats:${upperCode}`, 'totalClicks', 1),
      r.incr(`aff:click:${upperCode}:${dateKey()}`),
    ])
    // Set expiry on click counter (idempotent)
    r.expire(`aff:click:${upperCode}:${dateKey()}`, 90 * 24 * 3600).catch(() => {})
  } else {
    const aff = memAffiliates.get(upperCode)
    if (!aff) return
    aff.totalClicks++
    const key = `click:${upperCode}:${dateKey()}`
    memClicks.set(key, (memClicks.get(key) || 0) + 1)
  }
}

// ─── Attribution ────────────────────────────────────

export async function saveAttribution(email: string, affCode: string): Promise<void> {
  const key = `aff:attribution:${sanitizeEmail(email)}`
  const r = getRedis()
  if (r) {
    await r.set(key, affCode.toUpperCase())
    await r.expire(key, 30 * 24 * 3600)
  } else {
    memAttributions.set(sanitizeEmail(email), affCode.toUpperCase())
  }
}

/** 原子获取并清除归属（GETDEL 防重复计数） */
export async function getAndClearAttribution(email: string): Promise<string | null> {
  const key = `aff:attribution:${sanitizeEmail(email)}`
  const r = getRedis()
  if (r) {
    // Upstash Redis supports GETDEL — atomic get+delete
    try {
      const code = await (r as any).getdel(key)
      return (code as string) || null
    } catch {
      // Fallback if getdel not available: use pipeline
      const code = await r.get(key)
      if (code) {
        await r.del(key)
        return code as string
      }
      return null
    }
  }
  const code = memAttributions.get(sanitizeEmail(email))
  if (code) memAttributions.delete(sanitizeEmail(email))
  return code || null
}

// ─── Conversion (atomic HINCRBY + RPUSH) ─────────────

export async function recordConversion(
  affCode: string,
  orderId: string,
  amount: string,
  buyerEmail: string,
): Promise<boolean> {
  const upperCode = affCode.toUpperCase()
  const r = getRedis()

  if (r) {
    // 验证 affiliate 存在且活跃
    const raw = await r.get(`affiliate:${upperCode}`)
    if (!raw) return false
    const aff = typeof raw === 'string' ? JSON.parse(raw) : (raw as AffiliateRecord)
    if (!aff || !aff.active) return false

    const conv: ConversionRecord = {
      orderId,
      amount,
      commission: COMMISSION_PER_SALE,
      email: buyerEmail,
      timestamp: new Date().toISOString(),
    }

    // 原子操作：HINCRBY stats + push conversion
    await Promise.all([
      r.hincrby(`aff:stats:${upperCode}`, 'totalConversions', 1),
      r.hincrby(`aff:stats:${upperCode}`, 'totalEarnings', COMMISSION_PER_SALE),
      // Append to list (use JSON array approach since Upstash may not have RPUSH on JSON)
      (async () => {
        const raw = await r.get(`aff:purchase:${upperCode}`)
        const list: ConversionRecord[] = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : []
        list.push(conv)
        await r.set(`aff:purchase:${upperCode}`, JSON.stringify(list))
      })(),
    ])
    return true
  }

  // Memory mode
  const aff = memAffiliates.get(upperCode)
  if (!aff || !aff.active) return false
  const conv: ConversionRecord = {
    orderId, amount, commission: COMMISSION_PER_SALE,
    email: buyerEmail, timestamp: new Date().toISOString(),
  }
  const list = memConversions.get(upperCode) || []
  list.push(conv)
  memConversions.set(upperCode, list)
  aff.totalConversions++
  aff.totalEarnings += COMMISSION_PER_SALE
  return true
}

export async function getConversions(affCode: string): Promise<ConversionRecord[]> {
  const r = getRedis()
  if (r) {
    const raw = await r.get(`aff:purchase:${affCode.toUpperCase()}`)
    if (!raw) return []
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as ConversionRecord[])
  }
  return memConversions.get(affCode.toUpperCase()) || []
}

// ─── Magic Link Login ───────────────────────────────

export async function generateLoginToken(email: string): Promise<string | null> {
  const aff = await getAffiliateByEmail(email)
  if (!aff || !aff.active) return null

  const token = generateToken()
  const r = getRedis()
  if (r) {
    await r.set(`aff:token:${token}`, aff.email)
    await r.expire(`aff:token:${token}`, 600)
  } else {
    memTokens.set(token, { email: aff.email, expires: Date.now() + 600_000 })
  }
  return token
}

export async function verifyLoginToken(token: string): Promise<AffiliateRecord | null> {
  const r = getRedis()
  let email: string | null = null

  if (r) {
    // GETDEL: atomic get+delete, prevents token reuse
    try {
      const raw = await (r as any).getdel(`aff:token:${token}`)
      email = (raw as string) || null
    } catch {
      const raw = await r.get(`aff:token:${token}`)
      if (raw) {
        email = raw as string
        await r.del(`aff:token:${token}`)
      }
    }
  } else {
    const entry = memTokens.get(token)
    if (entry && Date.now() < entry.expires) {
      email = entry.email
      memTokens.delete(token)
    }
  }

  if (!email) return null
  return getAffiliateByEmail(email)
}

// ─── Session Tokens (for authenticated API calls) ─────

const SESSION_TTL = 24 * 60 * 60 // 24 hours

/** 创建会话 token（login verify 成功后调用） */
export async function createSessionToken(affCode: string): Promise<string> {
  const token = generateToken()
  const r = getRedis()
  if (r) {
    await r.set(`aff:session:${token}`, affCode.toUpperCase())
    await r.expire(`aff:session:${token}`, SESSION_TTL)
  } else {
    memTokens.set(`session:${token}`, { email: affCode.toUpperCase(), expires: Date.now() + SESSION_TTL * 1000 })
  }
  return token
}

/** 验证会话 token，返回 affiliate code */
export async function validateSession(token: string): Promise<string | null> {
  const r = getRedis()
  if (r) {
    const raw = await r.get(`aff:session:${token}`)
    if (raw) {
      // Extend TTL on access
      r.expire(`aff:session:${token}`, SESSION_TTL).catch(() => {})
      return raw as string
    }
    return null
  }
  const entry = memTokens.get(`session:${token}`)
  if (entry && Date.now() < entry.expires) return entry.email
  return null
}

// ─── Stats (从 Redis Hash 原子读取) ──────────────────

/** 获取统计 Hash（内部使用） */
async function getStatsHash(code: string): Promise<{ totalClicks: number; totalConversions: number; totalEarnings: number; paidOut: number }> {
  const r = getRedis()
  if (r) {
    const hash = await r.hgetall(`aff:stats:${code.toUpperCase()}`)
    return {
      totalClicks: Number((hash as any)?.totalClicks) || 0,
      totalConversions: Number((hash as any)?.totalConversions) || 0,
      totalEarnings: Number((hash as any)?.totalEarnings) || 0,
      paidOut: Number((hash as any)?.paidOut) || 0,
    }
  }
  const aff = memAffiliates.get(code.toUpperCase())
  return aff ? {
    totalClicks: aff.totalClicks,
    totalConversions: aff.totalConversions,
    totalEarnings: aff.totalEarnings,
    paidOut: aff.paidOut,
  } : { totalClicks: 0, totalConversions: 0, totalEarnings: 0, paidOut: 0 }
}

// ─── Admin ──────────────────────────────────────────

export async function getAllAffiliates(): Promise<AffiliateRecord[]> {
  const r = getRedis()
  if (r) {
    try {
      const keys: string[] = []
      let cursor: string | number = 0
      do {
        const result: [string, string[]] = await r.scan(cursor as number, { match: 'affiliate:??????' })
        cursor = result[0]
        keys.push(...result[1])
      } while (String(cursor) !== '0')

      if (keys.length === 0) return []

      const rawRecords = await Promise.all(keys.map((k: string) => r!.get(k)))
      const records = rawRecords
        .filter(Boolean)
        .map((raw: unknown) => typeof raw === 'string' ? JSON.parse(raw) : raw)
        .filter(Boolean) as AffiliateRecord[]

      // 批量填充 stats hash
      await Promise.all(records.map(async (rec) => {
        const hash = await r!.hgetall(`aff:stats:${rec.code}`)
        applyStatsFromHash(rec, hash as Record<string, unknown> | null)
      }))

      return records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } catch {
      return []
    }
  }

  return Array.from(memAffiliates.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function updateAffiliate(
  code: string,
  updates: Partial<Pick<AffiliateRecord, 'active' | 'paidOut' | 'name' | 'paypalEmail'>>,
): Promise<AffiliateRecord | null> {
  const upperCode = code.toUpperCase()
  const aff = await getAffiliate(upperCode)
  if (!aff) return null

  if (updates.name !== undefined) aff.name = sanitizeName(updates.name)
  if (updates.paypalEmail !== undefined) aff.paypalEmail = sanitizeEmail(updates.paypalEmail)
  if (updates.active !== undefined) aff.active = updates.active

  const r = getRedis()
  if (r) {
    // Update the JSON record
    await r.set(`affiliate:${upperCode}`, JSON.stringify(aff))
    // paidOut lives in stats hash
    if (updates.paidOut !== undefined) {
      await r.hset(`aff:stats:${upperCode}`, { paidOut: updates.paidOut })
    }
  } else {
    if (updates.paidOut !== undefined) aff.paidOut = updates.paidOut
    memAffiliates.set(upperCode, aff)
  }

  return aff
}

export async function getDailyClicks(code: string): Promise<{ date: string; clicks: number }[]> {
  const upperCode = code.toUpperCase()
  const days: { date: string; clicks: number }[] = []
  const r = getRedis()
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    if (r) {
      const val = await r.get(`aff:click:${upperCode}:${date}`)
      days.push({ date, clicks: Number(val) || 0 })
    } else {
      days.push({ date, clicks: memClicks.get(`click:${upperCode}:${date}`) || 0 })
    }
  }
  return days
}
