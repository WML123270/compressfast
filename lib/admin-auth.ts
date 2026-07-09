/**
 * 管理后台鉴权
 * - 基于 Web Crypto API 的 HMAC-SHA256 token
 * - 验证通过后设 httpOnly cookie，7 天有效
 */

import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 天

function getAdminKey(): string {
  return process.env.ADMIN_KEY || 'compressfast2026'
}

/** HMAC-SHA256 token（不可伪造） */
async function makeToken(key: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const data = `${key}:${now}:admin`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  const hash = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${now}:${hash}`
}

/** 生成 HMAC 验证摘要（同步 helper，用一次性 hash 做快速比较） */
async function computeHmac(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyToken(key: string, token: string): Promise<boolean> {
  const parts = token.split(':')
  if (parts.length !== 2) return false
  const ts = parseInt(parts[0], 10)
  if (isNaN(ts)) return false
  const sig = parts[1]

  // 检查是否在有效期内
  if (Date.now() / 1000 - ts > COOKIE_MAX_AGE) return false

  // 验证 HMAC
  const expected = await computeHmac(key, `${key}:${ts}:admin`)
  return sig === expected
}

/** 验证 admin key 是否匹配 */
export function verifyAdminKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  return key === getAdminKey()
}

/** 生成 token 并设置 cookie */
export async function setAdminCookie(response: NextResponse): Promise<void> {
  const token = await makeToken(getAdminKey())

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/** 清除 admin cookie（退出登录） */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

/** 检查请求是否为管理员 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifyToken(getAdminKey(), token)
}
