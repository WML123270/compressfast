'use client'

import { useEffect, useRef, useState } from 'react'

interface ModelDownloadBarProps {
  /** 已下载字节 */
  done: number
  /** 总字节（0 = 服务端未返回 Content-Length） */
  total: number
  /** 命中本地缓存，无需下载 */
  cached?: boolean
  isZh: boolean
}

// 用十进制 MB（1 MB = 1,000,000 字节），与页面「首次约 88MB」的文案一致
// （模型 88,141,111 字节 → 88.1 MB；如果用 1024 进制会显示 84.1，用户会觉得对不上）
function formatMB(bytes: number): string {
  return (bytes / 1_000_000).toFixed(1)
}

/**
 * AI 模型下载进度条：百分比 + 已下载/总大小 + 速度 + 剩余时间。
 * 85MB 模型首次下载在手机上很慢，有明确进度用户才愿意等。
 */
export default function ModelDownloadBar({ done, total, cached, isZh }: ModelDownloadBarProps) {
  const [speed, setSpeed] = useState(0) // bytes/s，简单指数平滑
  const sample = useRef<{ t: number; bytes: number } | null>(null)

  useEffect(() => {
    if (cached || done <= 0) return
    const now = performance.now()
    const prev = sample.current
    if (!prev) {
      sample.current = { t: now, bytes: done }
      return
    }
    const dt = now - prev.t
    if (dt < 400) return
    const inst = ((done - prev.bytes) / dt) * 1000
    sample.current = { t: now, bytes: done }
    if (inst > 0) setSpeed((s) => (s > 0 ? s * 0.6 + inst * 0.4 : inst))
  }, [done, cached])

  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const ready = cached || (total > 0 && done >= total)
  const remainSec = speed > 0 && total > done ? Math.round((total - done) / speed) : 0

  return (
    <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-xs text-cyan-800">
        <span className="font-medium">
          {ready
            ? (isZh ? '模型已就绪，正在初始化…' : 'Model ready — initializing…')
            : (isZh ? '首次使用：正在下载 AI 模型' : 'First run: downloading AI model')}
        </span>
        {total > 0 && (
          <span className="tabular-nums">
            {pct}% · {formatMB(done)}/{formatMB(total)} MB
          </span>
        )}
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-100"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={total > 0 ? pct : undefined}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-[width] duration-200 ${
            total === 0 ? 'animate-pulse' : ''
          }`}
          style={{ width: total > 0 ? `${Math.max(pct, 2)}%` : '100%' }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-cyan-700/80">
        {ready
          ? (isZh ? '模型已缓存，之后无需再次下载' : 'Cached on this device — no download next time')
          : speed > 0
            ? (isZh
                ? `${formatMB(speed)} MB/s${remainSec > 0 ? ` · 剩余约 ${remainSec} 秒` : ''} · 只需下载一次`
                : `${formatMB(speed)} MB/s${remainSec > 0 ? ` · ~${remainSec}s left` : ''} · downloaded once`)
            : (isZh ? '只需下载一次，之后从本地缓存加载' : 'Downloaded once, then loaded from local cache')}
      </p>
    </div>
  )
}
