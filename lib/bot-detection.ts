/**
 * 简单的爬虫 / 自动化 UA 检测
 * 用于 /api/admin/track 过滤机器流量，避免污染统计（2026-08-18 的 209 次压缩暴增即爬虫所致）。
 *
 * 只匹配高置信度信号，避免误伤真实用户：
 * - 真实 Android 手机报 "Linux; Android"
 * - 真实小米 MiuiBrowser 报 "X11; Linux x86_64"（带 Device/Model 标记）→ 不能一刀切拦 x86_64
 * - 无头 Chrome 跑在 ARM 云服务器报 "X11; Linux aarch64"（无 Device/Model）→ 高置信度爬虫
 */

const BOT_TOKENS = [
  // 搜索引擎 / AI 爬虫
  'gptbot', 'chatgpt', 'googlebot', 'bingbot', 'baiduspider', 'yandex',
  'bytespider', 'petalbot', 'facebookexternalhit', 'twitterbot', 'linkedinbot',
  'duckduckbot', 'slurp', 'mj12bot', 'semrush', 'ahrefs', 'dotbot',
  // 自动化 / 无头浏览器
  'headlesschrome', 'phantomjs', 'puppeteer', 'playwright', 'selenium',
  // 命令行 / 脚本 HTTP 客户端
  'wget', 'curl/', 'python-requests', 'go-http-client', 'node-fetch', 'scrapy',
  // 监控 / 可用性探测
  'pingdom', 'uptimerobot',
]

/** 无头 Chrome 跑在 ARM 云服务器上的典型签名 */
const HEADLESS_ARM = /x11; linux aarch64/i

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true // 真实浏览器必带 UA
  const ua = userAgent.toLowerCase()
  if (HEADLESS_ARM.test(ua)) return true
  return BOT_TOKENS.some((token) => ua.includes(token))
}
