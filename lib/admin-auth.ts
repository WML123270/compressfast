/**
 * 管理后台鉴权
 * - 简单 token 验证，不依赖 JWT
 * - 验证通过后设 httpOnly cookie，7 天有效
 */

import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'admin_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 天

function getAdminKey(): string {
  return process.env.ADMIN_KEY || 'compressfast2026'
}

/** 简单 hash */
function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

function makeToken(key: string): string {
  const now = Math.floor(Date.now() / 1000)
  const hash = simpleHash(key + ':' + now + ':salt2026')
  return `${now}:${hash}`
}

function verifyToken(key: string, token: string): boolean {
  const parts = token.split(':')
  if (parts.length !== 2) return false
  const ts = parseInt(parts[0], 10)
  const hash = parts[1]

  // 检查是否在有效期内
  if (Date.now() / 1000 - ts > COOKIE_MAX_AGE) return false

  // 验证 hash
  const expected = simpleHash(key + ':' + ts + ':salt2026')
  return hash === expected
}

/** 验证 admin key 是否匹配 */
export function verifyAdminKey(key: string): boolean {
  return key === getAdminKey()
}

/** 生成 token 并设置 cookie */
export function setAdminCookie(response: NextResponse): void {
  const token = makeToken(getAdminKey())

  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

/** 检查请求是否为管理员 */
export function isAdmin(request: NextRequest): boolean {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return verifyToken(getAdminKey(), token)
}
