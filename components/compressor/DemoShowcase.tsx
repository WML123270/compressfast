'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { formatFileSize } from '@/lib/compression/utils'
import { ImageCompare } from './ImageCompare'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'

/**
 * DemoShowcase — visible on homepage when no files are loaded.
 * Uses a real landscape photo from /demo-photo.jpg.
 * Compresses via Canvas API (no store/Worker).
 * Shows visitors compression quality without requiring an upload.
 */
export function DemoShowcase() {
  const { t, locale } = useT()
  const files = useCompressionStore(s => s.files)
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('loading')
  const [demoData, setDemoData] = useState<{
    beforeUrl: string
    afterUrl: string
    beforeSize: number
    afterSize: number
  } | null>(null)
  const autoStarted = useRef(false)

  const isZh = locale === 'zh'

  // Auto-run demo on mount (after short delay to not block first paint)
  useEffect(() => {
    if (autoStarted.current) return
    autoStarted.current = true
    const timer = setTimeout(() => runDemo(), 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hide when user has real files loaded
  if (files.length > 0) return null

  const runDemo = useCallback(async () => {
    if (state === 'done') return
    setState('loading')

    try {
      // Load real landscape photo from public directory
      const res = await fetch('/demo-photo.jpg?v=2')
      if (!res.ok) throw new Error('Failed to load demo photo')
      const blob = await res.blob()
      const file = new File([blob], 'sample-photo.jpg', { type: 'image/jpeg' })
      const beforeUrl = URL.createObjectURL(file)

      // Compress via Canvas: decode PNG → re-encode as JPEG at quality 50
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      bitmap.close()

      const compressedBlob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.5)
      )
      const afterUrl = URL.createObjectURL(compressedBlob)

      setDemoData({
        beforeUrl,
        afterUrl,
        beforeSize: file.size,
        afterSize: compressedBlob.size,
      })
      setState('done')

      // Track demo view for conversion analytics (fire-and-forget)
      fetch('/api/admin/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'demo_view', host: window.location.hostname }),
      }).catch(() => {})
    } catch {
      setState('idle')
    }
  }, [state])

  const savedPct = demoData
    ? ((demoData.beforeSize - demoData.afterSize) / demoData.beforeSize * 100).toFixed(0)
    : '0'

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-neutral-800 text-sm">
              {isZh ? '看看效果' : 'See it in action'}
            </span>
          </div>
          {state !== 'done' && (
            <span className="text-xs text-neutral-700">
              {isZh ? '浏览器内演示 · 不上传' : 'In-browser demo · No upload'}
            </span>
          )}
        </div>

        {/* Demo content */}
        <div className="p-4 sm:p-5">
          {/* Idle state — only shown if auto-run failed */}
          {state === 'idle' && (
            <div className="text-center py-6 space-y-3">
              <p className="text-neutral-700 text-sm">
                {isZh
                  ? '点击按钮看看压缩效果——全部在浏览器里完成，文件不上传。'
                  : 'Click to see compression in action — all in your browser, zero upload.'}
              </p>
              <button
                onClick={runDemo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all"
              >
                <Zap className="w-4 h-4" />
                {isZh ? '演示压缩效果' : 'Run Demo'}
              </button>
            </div>
          )}

          {/* Loading state */}
          {state === 'loading' && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-neutral-700 text-sm">
                {isZh ? '正在浏览器中压缩…' : 'Compressing in your browser…'}
              </p>
            </div>
          )}

          {/* Done state */}
          {state === 'done' && demoData && (
            <div className="space-y-4">
              <ImageCompare
                beforeSrc={demoData.beforeUrl}
                afterSrc={demoData.afterUrl}
                beforeLabel={isZh ? '原图' : 'Original'}
                afterLabel={isZh ? '压缩后' : 'Compressed'}
              />

              {/* Stats bar */}
              <div className="flex items-center justify-center gap-3 sm:gap-6 py-3">
                <div className="text-center">
                  <div className="text-neutral-600 text-xs">
                    {isZh ? '原图' : 'Before'}
                  </div>
                  <div className="text-lg font-bold text-neutral-900 tabular-nums">
                    {formatFileSize(demoData.beforeSize)}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="text-center">
                  <div className="text-blue-600 text-xs">
                    {isZh ? '压缩后' : 'After'}
                  </div>
                  <div className="text-lg font-bold text-blue-600 tabular-nums">
                    {formatFileSize(demoData.afterSize)}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-center">
                  <div className="text-green-600 text-xs">
                    {isZh ? '节省' : 'Saved'}
                  </div>
                  <div className="text-lg font-bold text-green-600 tabular-nums">
                    {savedPct}%
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-2">
                <p className="text-sm text-neutral-700">
                  {isZh
                    ? '拖入你的照片试试 → 支持批量处理'
                    : 'Drop your photos above → Batch processing supported'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
