/**
 * 前端设备指纹 — 多因子组合
 * 比单纯 UA 更能区分「同款设备」：UA 相同，但屏幕尺寸/像素比/时区/语言/CPU 核数
 * 组合起来基本不同。用于激活码的设备数量限制（每码 5 设备）。
 *
 * 注意：仅在前端调用（含 SSR 保护）。服务端在 lib/license.ts 有 UA+IP 的 fallback。
 */

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 32 位整数
  }
  return Math.abs(hash).toString(36)
}

export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return ''
  try {
    const parts = [
      navigator.userAgent || '',
      `${screen.width}x${screen.height}x${window.devicePixelRatio || 1}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      navigator.language || '',
      String(navigator.hardwareConcurrency || 0),
      navigator.platform || '',
    ]
    return simpleHash(parts.join('|'))
  } catch {
    return ''
  }
}
