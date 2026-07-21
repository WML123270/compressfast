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

async function pfadd(key: string, value: string): Promise<void> {
  const r = getRedis()
  if (r) {
    await r.pfadd(key, value)
    return
  }
  // 内存降级：用 Set 模拟
  if (!memCounters.has(`set:${key}`)) {
    memCounters.set(`set:${key}`, 0)
  }
  // 简单计数（内存模式无法真正去重，近似统计）
  const setKey = `set:v:${key}`
  if (!memValues.has(setKey)) memValues.set(setKey, new Set())
  const s = memValues.get(setKey)!
  if (!s.has(value)) {
    s.add(value)
    memCounters.set(`set:${key}`, s.size)
  }
}

async function pfcount(key: string): Promise<number> {
  const r = getRedis()
  if (r) {
    return r.pfcount(key)
  }
  const setKey = `set:v:${key}`
  return memValues.get(setKey)?.size || 0
}

// 内存降级 Set 存储
const memValues = new Map<string, Set<string>>()

function todayKey(prefix: string): string {
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return `${prefix}:${date}`
}

// ---- Public API ----

export async function incrementPageView(site: string = 'os'): Promise<void> {
  await Promise.all([
    incr('stats:pageviews:total'),
    incr(todayKey('stats:pageviews:daily')),
    incr(`stats:pageviews:total:${site}`),
    incr(todayKey(`stats:pageviews:daily:${site}`)),
  ])
}

export async function trackUniqueVisitor(visitorId: string, site: string = 'os'): Promise<void> {
  if (!visitorId) return
  const today = todayKey('stats:uv:daily').split(':').pop()!
  await Promise.all([
    pfadd('stats:uv:total', visitorId),
    pfadd(`stats:uv:daily:${today}`, visitorId),
    pfadd(`stats:uv:total:${site}`, visitorId),
    pfadd(`stats:uv:daily:${site}:${today}`, visitorId),
  ])
}

export async function incrementCompression(count: number, site: string = 'os'): Promise<void> {
  if (count <= 0) return
  await Promise.all([
    incr('stats:compressions:total', count),
    incr(todayKey('stats:compressions:daily'), count),
    incr(`stats:compressions:total:${site}`, count),
    incr(todayKey(`stats:compressions:daily:${site}`), count),
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

export interface SiteStats {
  totalPV: number
  totalUV: number
  totalCompressions: number
  dailyPV: DailyDataPoint[]
  dailyUV: DailyDataPoint[]
  dailyCompressions: DailyDataPoint[]
}

export interface DashboardStats {
  totalPV: number
  totalUV: number
  totalCompressions: number
  totalPurchases: number
  totalRevenue: number
  dailyPV: DailyDataPoint[]
  dailyUV: DailyDataPoint[]
  dailyCompressions: DailyDataPoint[]
  recentPurchases: LicenseRecord[]
  overseas: SiteStats
  china: SiteStats
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalPV, totalUV, totalCompressions, totalPurchases, totalRevenueCents] = await Promise.all([
    getCounter('stats:pageviews:total'),
    pfcount('stats:uv:total'),
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

  // 最近 7 天 UV
  const dailyUV: DailyDataPoint[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const val = await pfcount(`stats:uv:daily:${date}`)
    dailyUV.push({ date, value: val })
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

  // Helper: build SiteStats for os/cn
  const buildSiteStats = async (site: string): Promise<SiteStats> => {
    const [totalPV, totalUV, totalCompressions] = await Promise.all([
      getCounter(`stats:pageviews:total:${site}`),
      pfcount(`stats:uv:total:${site}`),
      getCounter(`stats:compressions:total:${site}`),
    ])
    const dailyPV: DailyDataPoint[] = []
    const dailyUV: DailyDataPoint[] = []
    const dailyCompressions: DailyDataPoint[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyPV.push({ date, value: await getCounter(`stats:pageviews:daily:${site}:${date}`) })
      dailyUV.push({ date, value: await pfcount(`stats:uv:daily:${site}:${date}`) })
      dailyCompressions.push({ date, value: await getCounter(`stats:compressions:daily:${site}:${date}`) })
    }
    return { totalPV, totalUV, totalCompressions, dailyPV, dailyUV, dailyCompressions }
  }

  const [overseas, china] = await Promise.all([
    buildSiteStats('os'),
    buildSiteStats('cn'),
  ])

  return {
    totalPV,
    totalUV,
    totalCompressions,
    totalPurchases,
    totalRevenue: totalRevenueCents / 100,
    dailyPV,
    dailyUV,
    dailyCompressions,
    recentPurchases,
    overseas,
    china,
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
