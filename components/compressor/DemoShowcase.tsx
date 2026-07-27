'use client'

import { useState, useEffect, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { formatFileSize } from '@/lib/compression/utils'
import { ImageCompare } from './ImageCompare'
import { Zap, ArrowRight, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { SAMPLE_IMAGES } from '@/lib/sample-images'

/**
 * DemoShowcase — visible on homepage when no files are loaded.
 * Auto-compresses a sample image to demonstrate compression quality.
 */
export function DemoShowcase() {
  const { t, locale } = useT()
  const { files, addFiles } = useCompressionStore()
  const [demoFile, setDemoFile] = useState<File | null>(null)
  const [demoPreview, setDemoPreview] = useState<string | null>(null)
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null)
  const [originalSize, setOriginalSize] = useState(0)
  const [compressedSize, setCompressedSize] = useState(0)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // Don't show when files are loaded
  if (files.length > 0) return null

  const isZh = locale === 'zh'

  const runDemo = useCallback(async () => {
    if (loading || done) return
    setLoading(true)

    try {
      // Use the photo sample
      const photo = SAMPLE_IMAGES.find(s => s.name === 'photo') || SAMPLE_IMAGES[0]
      const file = await photo.generator()
      setDemoFile(file)
      setOriginalSize(file.size)

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setDemoPreview(previewUrl)

      // Compress via the store pipeline — compressOne on a temp entry
      // We'll add the file, compress it, then capture the result
      addFiles([file])

      // Poll for compression result
      const checkDone = setInterval(() => {
        const state = useCompressionStore.getState()
        const compressed = state.files.find(f => f.file.name === file.name && f.status === 'done')
        if (compressed && compressed.compressedBlob) {
          clearInterval(checkDone)
          setCompressedSize(compressed.compressedSize!)
          const blobUrl = URL.createObjectURL(compressed.compressedBlob)
          setCompressedPreview(blobUrl)
          setDone(true)
          setLoading(false)

          // Clean up the demo file from the store
          useCompressionStore.getState().removeFile(compressed.id)
        }
      }, 200)

      // Trigger compression after a short delay
      setTimeout(() => {
        const state = useCompressionStore.getState()
        const entry = state.files.find(f => f.file.name === file.name)
        if (entry) {
          state.compressOne(entry.id)
        }
      }, 500)

      // Timeout after 15s
      setTimeout(() => {
        clearInterval(checkDone)
        if (!done) setLoading(false)
      }, 15000)
    } catch {
      setLoading(false)
    }
  }, [loading, done, addFiles])

  return (
    <div className="max-w-2xl mx-auto mt-6 animate-slide-up">
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-neutral-800 text-sm">
              {isZh ? '看看效果' : 'See it in action'}
            </span>
          </div>
          {!done && (
            <span className="text-xs text-neutral-600">
              {isZh ? '自动演示 · 不上传服务器' : 'Auto demo · No upload'}
            </span>
          )}
        </div>

        {/* Demo content */}
        <div className="p-4 sm:p-5">
          {!done && !loading && (
            <div className="text-center py-8 space-y-4">
              <p className="text-neutral-700 text-sm">
                {isZh
                  ? '点一下按钮，看看一张照片能压多小——浏览器里完成，文件不上传。'
                  : 'Click to see how small a photo can get — all in your browser, no upload.'}
              </p>
              <button
                onClick={runDemo}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all"
              >
                <Zap className="w-4 h-4" />
                {isZh ? '演示压缩效果' : 'Run Demo'}
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-neutral-700 text-sm">
                {isZh ? '正在浏览器中压缩…' : 'Compressing in your browser…'}
              </p>
            </div>
          )}

          {done && demoPreview && compressedPreview && (
            <div className="space-y-4">
              {/* Comparison */}
              <ImageCompare
                beforeSrc={demoPreview}
                afterSrc={compressedPreview}
                beforeLabel={isZh ? '原图' : 'Original'}
                afterLabel={isZh ? '压缩后' : 'Compressed'}
              />

              {/* Stats bar */}
              <div className="flex items-center justify-center gap-4 sm:gap-8 py-3">
                <div className="text-center">
                  <div className="text-neutral-600 text-xs">{isZh ? '原图' : 'Before'}</div>
                  <div className="text-lg font-bold text-neutral-900">{formatFileSize(originalSize)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <div className="text-center">
                  <div className="text-blue-600 text-xs">{isZh ? '压缩后' : 'After'}</div>
                  <div className="text-lg font-bold text-blue-600">{formatFileSize(compressedSize)}</div>
                </div>
                <ArrowRight className="w-5 h-5 text-amber-500" />
                <div className="text-center">
                  <div className="text-amber-500 text-xs">{isZh ? '节省' : 'Saved'}</div>
                  <div className="text-lg font-bold text-amber-500">
                    {originalSize > 0
                      ? ((originalSize - compressedSize) / originalSize * 100).toFixed(0) + '%'
                      : '—'}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-2">
                <p className="text-sm text-neutral-700 mb-3">
                  {isZh
                    ? '拖入你的照片试试 → 支持30张批量处理'
                    : 'Drop your photos above → Batch up to 30 at once'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
