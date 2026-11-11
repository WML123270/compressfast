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

// ---- 压缩事件限流（防爬虫污染统计） ----

const DAILY_COMPRESSION_LIMIT_PER_IP = 200
// pageview 后多久内视为「真实浏览器会话」：压缩事件要求 visitorId 先有 pageview
const VISITOR_ACTIVE_TTL = 6 * 3600 // 6 小时

/**
 * 标记 visitorId 为「最近访问过页面」（由 pageview 事件调用）。
 * 压缩事件要求 visitorId 必须先有 pageview 前置，否则视为脚本直连 POST 爬虫。
 */
export async function markVisitorActive(visitorId: string): Promise<void> {
  if (!visitorId) return
  const r = getRedis()
  if (!r) return
  try {
    await r.set(`vid:active:${visitorId}`, '1', { ex: VISITOR_ACTIVE_TTL })
  } catch {
    // fail-open：统计口径，不影响实际压缩
  }
}

/**
 * visitorId 是否在最近 pageview 活跃集里。直连脚本（无 pageview 前置）返回 false。
 * 无 Redis 时 fail-open（开发环境）。
 * 用 exists 而非 get 判断：Upstash 会把 "1" 反序列化成 number 1，`=== '1'` 会误判。
 */
export async function isVisitorActive(visitorId: string): Promise<boolean> {
  if (!visitorId) return false
  const r = getRedis()
  if (!r) return true
  try {
    return (await r.exists(`vid:active:${visitorId}`)) === 1
  } catch {
    return true // fail-open
  }
}

/**
 * 单 IP 每日压缩统计上限。真实用户日压缩个位数~几十，爬虫一次暴增数百
 * （8/18=209、8/21=295、8/25=279）。返回「允许计入的数量」（≤count），
 * 超过每日上限后返回 0。绝不阻断实际压缩 —— 压缩在浏览器本地完成，
 * 这里只控制统计口径。无 Redis / 无真实 IP 时放行（fail-open）。
 *
 * 修复 8/25 绕过：旧实现 `total - count < LIMIT` 对单次大 count（如 500）
 * 完全放行；新实现先读 prev，只计入 `min(count, LIMIT - prev)`。
 */
export async function checkCompressionRateLimit(ip: string, count: number): Promise<number> {
  if (!ip || ip === '0.0.0.0') return count
  const r = getRedis()
  if (!r) return count
  try {
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const key = `rl:comp:${ip}:${date}`
    const prev = Number(await r.get(key)) || 0
    if (prev >= DAILY_COMPRESSION_LIMIT_PER_IP) return 0
    const allowed = Math.min(count, DAILY_COMPRESSION_LIMIT_PER_IP - prev)
    await r.incrby(key, allowed)
    await r.expire(key, 2 * 24 * 3600) // 2 天 TTL
    return allowed
  } catch {
    return count // fail-open
  }
}

export async function incrementProPurchase(amount = 24.99): Promise<void> {
  await Promise.all([
    incr('stats:pro_purchases:total'),
    incr('stats:pro_revenue:total', Math.round(amount * 100)), // 存分（避免浮点精度问题）
  ])
}

// ---- AI 工具埋点（抠图 / 放大）----

export type AiTool = 'upscale' | 'remove-bg'
export const AI_TOOLS: AiTool[] = ['upscale', 'remove-bg']
export const AI_EVENTS = ['view', 'gate', 'start', 'success', 'error', 'download'] as const
export type AiEventName = (typeof AI_EVENTS)[number]

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 记录一次 AI 行为（view/gate/start/success/error/download） */
export async function incrementAiEvent(tool: AiTool, event: AiEventName): Promise<void> {
  const date = formatDate(new Date())
  await Promise.all([
    incr(`stats:ai:${event}:total:${tool}`),
    incr(`stats:ai:${event}:daily:${tool}:${date}`),
  ])
}

/** 记录成功推理耗时（毫秒），用于计算平均耗时 */
export async function recordAiDuration(tool: AiTool, ms: number): Promise<void> {
  const safe = Math.max(0, Math.min(Math.round(ms), 10 * 60 * 1000))
  await Promise.all([
    incr(`stats:ai:duration_ms:total:${tool}`, safe),
    incr(`stats:ai:duration_count:total:${tool}`, 1),
  ])
}

// ---- 图片转 PDF 埋点 ----

export const PDF_EVENTS = ['generate', 'error', 'download'] as const
export type PdfEventName = (typeof PDF_EVENTS)[number]

/** 记录一次 PDF 工具行为（generate/error/download） */
export async function incrementPdfEvent(event: PdfEventName): Promise<void> {
  const date = formatDate(new Date())
  await Promise.all([
    incr(`stats:pdf:${event}:total`),
    incr(`stats:pdf:${event}:daily:${date}`),
  ])
}

/** 记录成功生成的页数与 PDF 体积（用于计算平均页数/体积） */
export async function recordPdfOutput(pages: number, bytes: number): Promise<void> {
  const safePages = Math.max(1, Math.min(Math.round(pages), 500))
  const safeBytes = Math.max(0, Math.min(Math.round(bytes), 2 * 1024 * 1024 * 1024))
  await Promise.all([
    incr('stats:pdf:pages:total', safePages),
    incr('stats:pdf:bytes:total', safeBytes),
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

export interface AiDailyPoint {
  date: string
  view: number
  start: number
  success: number
  error: number
}

export interface AiToolStats {
  view: number
  gate: number
  start: number
  success: number
  error: number
  download: number
  averageDurationMs: number
  daily: AiDailyPoint[]
}

export interface AiStats {
  upscale: AiToolStats
  removeBg: AiToolStats
}

export interface PdfDailyPoint {
  date: string
  generate: number
  error: number
  download: number
}

export interface PdfStats {
  generate: number
  error: number
  download: number
  totalPages: number
  totalBytes: number
  daily: PdfDailyPoint[]
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
  ai: AiStats
  pdf: PdfStats
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

  const [overseas, china, ai, pdf] = await Promise.all([
    buildSiteStats('os'),
    buildSiteStats('cn'),
    getAiStats(),
    getPdfStats(),
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
    ai,
    pdf,
  }
}

/** 聚合 AI 工具的累计 + 近 7 天数据（一次 pipeline，避免几十次 HTTP） */
async function getAiStats(): Promise<AiStats> {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }

  const r = getRedis()
  const build = (map: Map<string, number>, tool: AiTool): AiToolStats => {
    const n = (key: string) => map.get(key) || 0
    const durationMs = n(`stats:ai:duration_ms:total:${tool}`)
    const durationCount = n(`stats:ai:duration_count:total:${tool}`)
    return {
      view: n(`stats:ai:view:total:${tool}`),
      gate: n(`stats:ai:gate:total:${tool}`),
      start: n(`stats:ai:start:total:${tool}`),
      success: n(`stats:ai:success:total:${tool}`),
      error: n(`stats:ai:error:total:${tool}`),
      download: n(`stats:ai:download:total:${tool}`),
      averageDurationMs: durationCount > 0 ? Math.round(durationMs / durationCount) : 0,
      daily: days.map((date) => ({
        date,
        view: n(`stats:ai:view:daily:${tool}:${date}`),
        start: n(`stats:ai:start:daily:${tool}:${date}`),
        success: n(`stats:ai:success:daily:${tool}:${date}`),
        error: n(`stats:ai:error:daily:${tool}:${date}`),
      })),
    }
  }

  if (!r) {
    const empty = new Map<string, number>()
    return { upscale: build(empty, 'upscale'), removeBg: build(empty, 'remove-bg') }
  }

  try {
    const keys: string[] = []
    for (const tool of AI_TOOLS) {
      for (const ev of AI_EVENTS) keys.push(`stats:ai:${ev}:total:${tool}`)
      for (const date of days) {
        for (const ev of ['view', 'start', 'success', 'error'] as const) {
          keys.push(`stats:ai:${ev}:daily:${tool}:${date}`)
        }
      }
      keys.push(`stats:ai:duration_ms:total:${tool}`, `stats:ai:duration_count:total:${tool}`)
    }

    const pipe = r.pipeline()
    for (const key of keys) pipe.get(key)
    const vals = (await pipe.exec()) as unknown[]

    const map = new Map<string, number>()
    keys.forEach((key, i) => map.set(key, Number(vals[i]) || 0))

    return { upscale: build(map, 'upscale'), removeBg: build(map, 'remove-bg') }
  } catch {
    const empty = new Map<string, number>()
    return { upscale: build(empty, 'upscale'), removeBg: build(empty, 'remove-bg') }
  }
}

/** 聚合图片转 PDF 的累计 + 近 7 天数据（一次 pipeline） */
async function getPdfStats(): Promise<PdfStats> {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }

  const empty = (): PdfStats => ({
    generate: 0,
    error: 0,
    download: 0,
    totalPages: 0,
    totalBytes: 0,
    daily: days.map(date => ({ date, generate: 0, error: 0, download: 0 })),
  })

  const r = getRedis()
  if (!r) return empty()

  try {
    const keys = [
      'stats:pdf:generate:total',
      'stats:pdf:error:total',
      'stats:pdf:download:total',
      'stats:pdf:pages:total',
      'stats:pdf:bytes:total',
    ]
    for (const date of days) {
      for (const ev of PDF_EVENTS) keys.push(`stats:pdf:${ev}:daily:${date}`)
    }

    const pipe = r.pipeline()
    for (const key of keys) pipe.get(key)
    const vals = (await pipe.exec()) as unknown[]

    const map = new Map<string, number>()
    keys.forEach((key, i) => map.set(key, Number(vals[i]) || 0))
    const n = (key: string) => map.get(key) || 0

    return {
      generate: n('stats:pdf:generate:total'),
      error: n('stats:pdf:error:total'),
      download: n('stats:pdf:download:total'),
      totalPages: n('stats:pdf:pages:total'),
      totalBytes: n('stats:pdf:bytes:total'),
      daily: days.map(date => ({
        date,
        generate: n(`stats:pdf:generate:daily:${date}`),
        error: n(`stats:pdf:error:daily:${date}`),
        download: n(`stats:pdf:download:daily:${date}`),
      })),
    }
  } catch {
    return empty()
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

/** Bucket file sizes for analytics */
function sizeBucket(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb <= 1) return '0-1MB'
  if (mb <= 5) return '1-5MB'
  if (mb <= 10) return '5-10MB'
  if (mb <= 25) return '10-25MB'
  return '25MB+'
}

/** Record file size distribution from compression events */
export async function recordFileSizes(sizes: number[], site: string) {
  const r = getRedis()
  if (!r) return
  try {
    const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    for (const size of sizes) {
      const bucket = sizeBucket(size)
      const key = `filesize:${site}:${date}:${bucket}`
      await r.incr(key)
      await r.expire(key, 90 * 24 * 3600) // 90 day TTL
    }
  } catch {}
}
