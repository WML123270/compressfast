import { Redis } from '@upstash/redis'

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  }
  return null
}

/** 存 pending 订单到 Redis */
export async function savePendingOrder(pid: string, email: string): Promise<void> {
  const r = getRedis()
  if (!r) return
  await r.set(`pending:${pid}`, JSON.stringify({ email, created_at: new Date().toISOString() }))
  await r.expire(`pending:${pid}`, 1800) // 30 分钟过期
}

/** 根据 pid 取邮箱（取完即删） */
export async function getPendingEmail(pid: string): Promise<string | null> {
  try {
    const r = getRedis()
    if (!r) return null
    const raw = await r.get(`pending:${pid}`)
    if (!raw) return null
    const record = JSON.parse(raw as string)
    await r.del(`pending:${pid}`)
    return record.email || null
  } catch {
    return null
  }
}
