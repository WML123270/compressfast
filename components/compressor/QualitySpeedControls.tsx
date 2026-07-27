'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import type { CompressionOptions } from '@/lib/compression/types'
import { formatFileSize, q2bits, reduceColors, estimateCompressedSize } from '@/lib/compression/utils'
import { Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

async function previewCompress(
  file: File,
  quality: number,
  outputFormat: CompressionOptions['outputFormat'],
): Promise<number> {
  if (outputFormat === 'avif') return 0
  const bitmap = await createImageBitmap(file)
  const w = bitmap.width, h = bitmap.height
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  let outMime = 'image/jpeg'
  const ft = file.type
  if (outputFormat === 'png') outMime = 'image/png'
  else if (outputFormat === 'jpeg') outMime = 'image/jpeg'
  else if (outputFormat === 'webp') outMime = 'image/webp'
  else if (ft === 'image/png') outMime = 'image/png'
  else if (ft === 'image/webp') outMime = 'image/webp'

  const bits = q2bits(quality)
  if (bits < 8) {
    const imgData = ctx.getImageData(0, 0, w, h)
    const reduced = reduceColors(imgData, bits)
    ctx.putImageData(reduced, 0, 0)
  }

  if (outMime === 'image/jpeg') {
    const blob = await canvas.convertToBlob({ type: outMime, quality: quality / 100 })
    return blob.size
  }
  const blob = await canvas.convertToBlob({ type: outMime })
  return blob.size
}

function estimateSize(originalBytes: number, quality: number): string {
  return estimateCompressedSize(originalBytes, quality)
}

export function QualitySpeedControls() {
  const { t } = useT()
  const { options, setOptions, files, totalOriginalSize } = useCompressionStore()
  const hasFiles = files.length > 0
  if (!hasFiles || options.targetKB) return null

  const avgOriginalSize = files.length > 0 ? totalOriginalSize() / files.length : 0

  const [previewSize, setPreviewSize] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstPendingFile = files.find(f => f.status === 'pending')?.file

  const runPreview = useCallback(async (file: File, quality: number, fmt: CompressionOptions['outputFormat']) => {
    setPreviewLoading(true)
    try { const size = await previewCompress(file, quality, fmt); setPreviewSize(size) }
    catch { setPreviewSize(null) }
    setPreviewLoading(false)
  }, [])

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    if (!firstPendingFile || options.targetKB) { setPreviewSize(null); return }
    previewTimer.current = setTimeout(() => {
      runPreview(firstPendingFile, options.quality, options.outputFormat)
    }, 500)
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current) }
  }, [options.quality, options.outputFormat, firstPendingFile, options.targetKB, runPreview])

  return (
    <div className="space-y-3 border-gray-200/50 pt-4">
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-medium text-neutral-700 text-xs sm:text-sm">{t('controls.quality')}</label>
          <span className="font-semibold text-neutral-900 flex items-center gap-1 text-xs sm:text-sm">
            {options.quality}%
            {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-neutral-700" />}
            {!previewLoading && previewSize && (
              <span className="text-blue-500 hidden sm:inline">→ {formatFileSize(previewSize)}</span>
            )}
            {!previewLoading && !previewSize && firstPendingFile && (
              <span className="text-neutral-700 hidden sm:inline">{estimateSize(avgOriginalSize, options.quality)}</span>
            )}
          </span>
        </div>
        <input
          type="range" min={10} max={100} step={5}
          value={options.quality}
          onChange={(e) => { const val = Number(e.target.value); setOptions({ quality: val, targetKB: 0 }) }}
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="font-medium text-neutral-700 text-xs sm:text-sm">{t('controls.speed')}</label>
          <span className="font-semibold text-neutral-900 text-xs sm:text-sm">
            {options.speed <= 2 ? t('controls.speed.best') : options.speed <= 5 ? t('controls.speed.balanced') : t('controls.speed.fast')}
          </span>
        </div>
        <input
          type="range" min={1} max={10} step={1}
          value={options.speed}
          onChange={(e) => { const val = Number(e.target.value); setOptions({ speed: val }) }}
          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox" checked={options.lossless}
            onChange={(e) => setOptions({ lossless: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-brand-600"
          />
          <span className="text-neutral-700">{t('controls.lossless')}</span>
        </label>

        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input
            type="checkbox" checked={options.stripMetadata}
            onChange={(e) => setOptions({ stripMetadata: e.target.checked })}
            className="w-3.5 h-3.5 rounded accent-brand-600"
          />
          <span className="text-neutral-700">{t('controls.stripMeta')}</span>
          <span className="text-neutral-700 hidden sm:inline">{t('controls.stripMetaHint')}</span>
        </label>
      </div>
    </div>
  )
}
