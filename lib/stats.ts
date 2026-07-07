/**
 * 网站统计数据
 * - 使用 Upstash Redis 存储计数器
 * - 无 Redis 时降级为内存缓存（开发环境）
 */

import { Redis } from '@upstash/redis'
import type { LicenseRecord } from './license'

// Lazy init Redis
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
const memCounters = new Map<string, number>()

async function incr(key: string, by = 1): Promise<number> {
  const r = getRedis()
  if (r) {
    return r.incrby(key, by)
  }
  const current = memCounters.get(key) || 0
  memCounters.set(key, current + by)
  return current + by
}

async function getCounter(key: string): Promise<number> {
  const r = getRedis()
  if (r) {
    const val = await r.get(key)
    return Number(val) || 0
  }
  return memCounters.get(key) || 0
}

function todayKey(prefix: string): string {
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}:${date}`
}

// ---- Public API ----

export async function incrementPageView(): Promise<void> {
  await Promise.all([
    incr('stats:pageviews:total'),
    incr(todayKey('stats:pageviews:daily')),
  ])
}

export async function incrementCompression(count: number): Promise<void> {
  if (count <= 0) return
  await Promise.all([
    incr('stats:compressions:total', count),
    incr(todayKey('stats:compressions:daily'), count),
  ])
}

export async function incrementProPurchase(amount = 24.99): Promise<void> {
  await Promise.all([
    incr('stats:pro_purchases:total'),
    incr('stats:pro_revenue:total', Math.round(amount * 100)), // 存分（避免浮点精度问题）
  ])
}

export interface DailyDataPoint {
  date: string
  value: number
}

export interface DashboardStats {
  totalPV: number
  totalCompressions: number
  totalPurchases: number
  totalRevenue: number
  dailyPV: DailyDataPoint[]
  dailyCompressions: DailyDataPoint[]
  recentPurchases: LicenseRecord[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalPV, totalCompressions, totalPurchases, totalRevenueCents] = await Promise.all([
    getCounter('stats:pageviews:total'),
    getCounter('stats:compressions:total'),
    getCounter('stats:pro_purchases:total'),
    getCounter('stats:pro_revenue:total'),
  ])

  // 最近 7 天 PV
  const dailyPV: DailyDataPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const val = await getCounter(`stats:pageviews:daily:${date}`)
    dailyPV.push({ date, value: val })
  }

  // 最近 7 天压缩次数
  const dailyCompressions: DailyDataPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const val = await getCounter(`stats:compressions:daily:${date}`)
    dailyCompressions.push({ date, value: val })
  }

  // 最近购买（扫描 Redis license:* keys）
  const recentPurchases = await getRecentPurchases()

  return {
    totalPV,
    totalCompressions,
    totalPurchases,
    totalRevenue: totalRevenueCents / 100,
    dailyPV,
    dailyCompressions,
    recentPurchases,
  }
}

async function getRecentPurchases(): Promise<LicenseRecord[]> {
  const r = getRedis()
  if (!r) return []

  try {
    const keys: string[] = []
    let cursor: string | number = 0
    do {
      const result: [string, string[]] = await r.scan(cursor as number, { match: 'license:????-????-????' })
      cursor = result[0]
      keys.push(...result[1])
    } while (String(cursor) !== '0')

    if (keys.length === 0) return []

    const rawRecords = await Promise.all(keys.map((k: string) => r!.get(k)))
    const records = rawRecords
      .filter(Boolean)
      .map((raw: unknown) => {
        if (typeof raw === 'string') return JSON.parse(raw)
        return raw
      }) as LicenseRecord[]

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return records.slice(0, 20)
  } catch {
    return []
  }
}

export async function getAllLicenses(): Promise<LicenseRecord[]> {
  const r = getRedis()
  if (!r) return []

  try {
    const keys: string[] = []
    let cursor: string | number = 0
    do {
      const result: [string, string[]] = await r.scan(cursor as number, { match: 'license:????-????-????' })
      cursor = result[0]
      keys.push(...result[1])
    } while (String(cursor) !== '0')

    if (keys.length === 0) return []

    const rawRecords = await Promise.all(keys.map((k: string) => r!.get(k)))
    const records = rawRecords
      .filter(Boolean)
      .map((raw: unknown) => {
        if (typeof raw === 'string') return JSON.parse(raw)
        return raw
      }) as LicenseRecord[]

    records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return records
  } catch {
    return []
  }
}
