/**
 * 网站统计数据
 * - 使用 Upstash Redis 存储计数器
 * - 无 Redis 时降级为内存缓存（开发环境）
 */

import { Redis } from '@upstash/redis'
import type { LicenseRecord } from './license'
import { PDF_TOOL_SLUGS, type PdfTool } from './pdf/constants'
import { AI_ERROR_CODES, type AiErrorCode } from './ai/ai-error'

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

// ---- 普通工具埋点（图片拼接等，无需 Pro / AI 模型）----

export const TOOL_EVENTS = ['generate', 'download', 'error'] as const
export type ToolEventName = (typeof TOOL_EVENTS)[number]

/** 记录一次工具行为（generate/download/error） */
export async function incrementToolEvent(tool: string, event: ToolEventName): Promise<void> {
  const date = formatDate(new Date())
  await Promise.all([
    incr(`stats:tool:${tool}:${event}:total`),
    incr(`stats:tool:${tool}:${event}:daily:${date}`),
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
  const date = formatDate(new Date())
  await Promise.all([
    incr('stats:pro_purchases:total'),
    incr('stats:pro_revenue:total', Math.round(amount * 100)), // 存分（避免浮点精度问题）
    // 漏斗：支付成功（含联调测试单），与 view/click/checkout 同口径展示
    incr('stats:pro_funnel:purchase:total'),
    incr(`stats:pro_funnel:purchase:daily:${date}`),
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

/** 记录一次 AI 失败类别（只存类别计数，不存错误堆栈 / 文件名，避免隐私问题） */
export async function recordAiError(tool: AiTool, code: AiErrorCode): Promise<void> {
  await incr(`stats:ai:error_code:total:${tool}:${code}`)
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

/** 记录一次 PDF 工具行为（generate/error/download）；按工具另记一份总计数 */
export async function incrementPdfEvent(
  event: PdfEventName,
  tool: PdfTool = 'image-to-pdf',
): Promise<void> {
  const date = formatDate(new Date())
  await Promise.all([
    incr(`stats:pdf:${event}:total`),
    incr(`stats:pdf:${event}:daily:${date}`),
    incr(`stats:pdf:${event}:tool:${tool}:total`),
  ])
}

/** 记录成功生成的页数与 PDF 体积（用于计算平均页数/体积） */
export async function recordPdfOutput(
  pages: number,
  bytes: number,
  tool: PdfTool = 'image-to-pdf',
): Promise<void> {
  const safePages = Math.max(1, Math.min(Math.round(pages), 2000))
  const safeBytes = Math.max(0, Math.min(Math.round(bytes), 2 * 1024 * 1024 * 1024))
  await Promise.all([
    incr('stats:pdf:pages:total', safePages),
    incr('stats:pdf:bytes:total', safeBytes),
    incr(`stats:pdf:pages:tool:${tool}:total`, safePages),
    incr(`stats:pdf:bytes:tool:${tool}:total`, safeBytes),
  ])
}

// ---- Pro 转化漏斗埋点 ----
// view=看到 Pro 页 / click=点击站内升级入口 / intent=Pro 页内点击升级 CTA
// buy=点击支付按钮 / checkout=成功创建支付订单 / fail=创建订单失败
// source 记录入口或支付渠道，用于判断哪个入口真正带单

export const PRO_STAGES = ['view', 'click', 'intent', 'buy', 'checkout', 'fail'] as const
export type ProStage = (typeof PRO_STAGES)[number]

/** 参与近 7 天聚合的阶段（purchase 由支付回调单独累加） */
const PRO_DAILY_STAGES = ['view', 'click', 'intent', 'buy', 'checkout', 'purchase'] as const

export const PRO_SOURCES = [
  'header',
  'quota_banner',
  'image_list',
  'format_selector',
  'preset_manager',
  'watermark',
  'scene_presets',
  'home_cta',
  'hero_cta',
  'table_cta',
  'ai_gate',
  'pro_buy',
  'pro_cn_buy',
  'mobile_sticky',
  'dropzone',
  'creem',
  'hupijiao',
] as const
export type ProSource = (typeof PRO_SOURCES)[number]

/** 记录一次 Pro 漏斗行为；source 不在白名单时忽略（防脏数据） */
export async function incrementProEvent(stage: ProStage, source?: string): Promise<void> {
  const date = formatDate(new Date())
  const safeSource =
    source && (PRO_SOURCES as readonly string[]).includes(source) ? source : undefined
  await Promise.all([
    incr(`stats:pro_funnel:${stage}:total`),
    incr(`stats:pro_funnel:${stage}:daily:${date}`),
    ...(safeSource ? [incr(`stats:pro_funnel:${stage}:source:${safeSource}:total`)] : []),
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

export interface AiErrorCount {
  code: AiErrorCode
  count: number
}

export interface AiToolStats {
  view: number
  gate: number
  start: number
  success: number
  error: number
  download: number
  averageDurationMs: number
  /** 失败原因分类（只列出现过的类别） */
  errors: AiErrorCount[]
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

export interface PdfToolStats {
  /** 工具 slug（image-to-pdf / merge-pdf / split-pdf / compress-pdf） */
  tool: PdfTool
  generate: number
  error: number
  download: number
  pages: number
  bytes: number
}

export interface PdfStats {
  generate: number
  error: number
  download: number
  totalPages: number
  totalBytes: number
  daily: PdfDailyPoint[]
  /** 按工具拆分（来自 stats:pdf:*:tool:<slug>:*） */
  byTool: PdfToolStats[]
}

export interface ToolDailyPoint {
  date: string
  generate: number
  error: number
  download: number
}

export interface ToolStats {
  generate: number
  error: number
  download: number
  daily: ToolDailyPoint[]
}

/** 走 stats:tool:* 埋点的普通工具（track API 白名单） */
export const TRACKED_TOOLS = ['stitch-images', 'id-photo'] as const

export interface ProSourceStats {
  source: string
  intent: number
  buy: number
  click: number
  checkout: number
}

export interface ProFunnelDailyPoint {
  date: string
  view: number
  intent: number
  buy: number
  click: number
  checkout: number
  purchase: number
}

export interface ProFunnelStats {
  view: number
  intent: number
  buy: number
  click: number
  checkout: number
  purchase: number
  fail: number
  bySource: ProSourceStats[]
  daily: ProFunnelDailyPoint[]
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
  stitch: ToolStats
  idPhoto: ToolStats
  proFunnel: ProFunnelStats
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

  const [overseas, china, ai, pdf, stitch, idPhoto, proFunnel] = await Promise.all([
    buildSiteStats('os'),
    buildSiteStats('cn'),
    getAiStats(),
    getPdfStats(),
    getToolStats('stitch-images'),
    getToolStats('id-photo'),
    getProFunnelStats(),
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
    stitch,
    idPhoto,
    proFunnel,
  }
}

/** 普通工具（拼接 / 证件照）累计 + 近 7 天数据（一次 pipeline） */
async function getToolStats(tool: string): Promise<ToolStats> {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }

  const empty = (): ToolStats => ({
    generate: 0,
    error: 0,
    download: 0,
    daily: days.map(date => ({ date, generate: 0, error: 0, download: 0 })),
  })

  const r = getRedis()
  if (!r) return empty()

  const prefix = `stats:tool:${tool}`
  try {
    const keys: string[] = []
    for (const ev of TOOL_EVENTS) keys.push(`${prefix}:${ev}:total`)
    for (const date of days) {
      for (const ev of TOOL_EVENTS) keys.push(`${prefix}:${ev}:daily:${date}`)
    }

    const pipe = r.pipeline()
    for (const key of keys) pipe.get(key)
    const vals = (await pipe.exec()) as unknown[]

    const map = new Map<string, number>()
    keys.forEach((key, i) => map.set(key, Number(vals[i]) || 0))
    const n = (key: string) => map.get(key) || 0

    return {
      generate: n(`${prefix}:generate:total`),
      error: n(`${prefix}:error:total`),
      download: n(`${prefix}:download:total`),
      daily: days.map(date => ({
        date,
        generate: n(`${prefix}:generate:daily:${date}`),
        error: n(`${prefix}:error:daily:${date}`),
        download: n(`${prefix}:download:daily:${date}`),
      })),
    }
  } catch {
    return empty()
  }
}

/** 聚合 Pro 转化漏斗（累计 + 每个入口 + 近 7 天），一次 pipeline */
async function getProFunnelStats(): Promise<ProFunnelStats> {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(formatDate(d))
  }

  const empty = (): ProFunnelStats => ({
    view: 0,
    intent: 0,
    buy: 0,
    click: 0,
    checkout: 0,
    purchase: 0,
    fail: 0,
    bySource: PRO_SOURCES.map((source) => ({ source, intent: 0, buy: 0, click: 0, checkout: 0 })),
    daily: days.map((date) => ({ date, view: 0, intent: 0, buy: 0, click: 0, checkout: 0, purchase: 0 })),
  })

  const r = getRedis()
  if (!r) return empty()

  try {
    const keys: string[] = []
    for (const stage of PRO_STAGES) keys.push(`stats:pro_funnel:${stage}:total`)
    for (const source of PRO_SOURCES) {
      keys.push(`stats:pro_funnel:intent:source:${source}:total`)
      keys.push(`stats:pro_funnel:buy:source:${source}:total`)
      keys.push(`stats:pro_funnel:click:source:${source}:total`)
      keys.push(`stats:pro_funnel:checkout:source:${source}:total`)
    }
    for (const date of days) {
      for (const stage of PRO_DAILY_STAGES) {
        keys.push(`stats:pro_funnel:${stage}:daily:${date}`)
      }
    }

    const pipe = r.pipeline()
    for (const key of keys) pipe.get(key)
    const vals = (await pipe.exec()) as unknown[]

    const map = new Map<string, number>()
    keys.forEach((key, i) => map.set(key, Number(vals[i]) || 0))
    const n = (key: string) => map.get(key) || 0

    return {
      view: n('stats:pro_funnel:view:total'),
      intent: n('stats:pro_funnel:intent:total'),
      buy: n('stats:pro_funnel:buy:total'),
      click: n('stats:pro_funnel:click:total'),
      checkout: n('stats:pro_funnel:checkout:total'),
      purchase: n('stats:pro_funnel:purchase:total'),
      fail: n('stats:pro_funnel:fail:total'),
      bySource: PRO_SOURCES.map((source) => ({
        source,
        intent: n(`stats:pro_funnel:intent:source:${source}:total`),
        buy: n(`stats:pro_funnel:buy:source:${source}:total`),
        click: n(`stats:pro_funnel:click:source:${source}:total`),
        checkout: n(`stats:pro_funnel:checkout:source:${source}:total`),
      })),
      daily: days.map((date) => ({
        date,
        view: n(`stats:pro_funnel:view:daily:${date}`),
        intent: n(`stats:pro_funnel:intent:daily:${date}`),
        buy: n(`stats:pro_funnel:buy:daily:${date}`),
        click: n(`stats:pro_funnel:click:daily:${date}`),
        checkout: n(`stats:pro_funnel:checkout:daily:${date}`),
        purchase: n(`stats:pro_funnel:purchase:daily:${date}`),
      })),
    }
  } catch {
    return empty()
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
      errors: AI_ERROR_CODES
        .map((code) => ({ code, count: n(`stats:ai:error_code:total:${tool}:${code}`) }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count),
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
      for (const code of AI_ERROR_CODES) keys.push(`stats:ai:error_code:total:${tool}:${code}`)
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
    byTool: PDF_TOOL_SLUGS.map(tool => ({
      tool,
      generate: 0,
      error: 0,
      download: 0,
      pages: 0,
      bytes: 0,
    })),
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
    for (const tool of PDF_TOOL_SLUGS) {
      for (const ev of PDF_EVENTS) keys.push(`stats:pdf:${ev}:tool:${tool}:total`)
      keys.push(`stats:pdf:pages:tool:${tool}:total`)
      keys.push(`stats:pdf:bytes:tool:${tool}:total`)
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
      byTool: PDF_TOOL_SLUGS.map(tool => ({
        tool,
        generate: n(`stats:pdf:generate:tool:${tool}:total`),
        error: n(`stats:pdf:error:tool:${tool}:total`),
        download: n(`stats:pdf:download:tool:${tool}:total`),
        pages: n(`stats:pdf:pages:tool:${tool}:total`),
        bytes: n(`stats:pdf:bytes:tool:${tool}:total`),
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
