'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, X, RotateCcw, RotateCw, ChevronDown, ChevronUp, GripVertical, ShieldCheck, FlipHorizontal, FlipVertical, Undo2 } from 'lucide-react'
import type { ImageFile, QualityTier } from '@/lib/compression/types'
import { getQualityTier, QUALITY_TIER_COLORS } from '@/lib/compression/types'
import { useCompressionStore } from '@/lib/store/compression-store'
import { formatFileSize, getCompressionRatio } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import { saveAs } from 'file-saver'
import { useT } from '@/lib/i18n/context'
import { ImageCompare } from './ImageCompare'

interface ImageCardProps { image: ImageFile; index?: number; showDragHandle?: boolean }

export function ImageCard({ image, showDragHandle }: ImageCardProps) {
  const { t } = useT()
  const { removeFile, compressOne, rotateImage, flipImage, resetTransform } = useCompressionStore()
  const [showPreview, setShowPreview] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const previewBlobUrlRef = useRef<string | null>(null)

  const ratio = image.compressedSize
    ? getCompressionRatio(image.originalSize, image.compressedSize)
    : 0

  useEffect(() => {
    if (showPreview && image.compressedBlob) {
      previewBlobUrlRef.current = URL.createObjectURL(image.compressedBlob)
    }
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current)
        previewBlobUrlRef.current = null
      }
    }
  }, [showPreview, image.compressedBlob])

  const handleDownload = async () => {
    if (image.compressedBlob && !downloading) {
      setDownloading(true)
      try {
        let blob: Blob = image.compressedBlob
        // Apply rotation/flip at download time using Canvas API
        if (image.rotation !== 0 || image.flipH || image.flipV) {
          try {
            const bitmap = await createImageBitmap(blob)
            const bw = bitmap.width, bh = bitmap.height
            const swapped = image.rotation === 90 || image.rotation === 270
            const cw = swapped ? bh : bw
            const ch = swapped ? bw : bh
            const canvas = document.createElement('canvas')
            canvas.width = cw; canvas.height = ch
            const ctx = canvas.getContext('2d')!
            ctx.translate(cw / 2, ch / 2)
            ctx.scale(image.flipH ? -1 : 1, image.flipV ? -1 : 1)
            ctx.rotate((image.rotation * Math.PI) / 180)
            ctx.drawImage(bitmap, -bw / 2, -bh / 2, bw, bh)
            bitmap.close()
            blob = await new Promise(resolve => canvas.toBlob(b => resolve(b!), image.compressedBlob!.type, 1.0))
          } catch { /* use original blob */ }
        }

        const ext = image.compressedBlob.type === 'image/jpeg' ? '.jpg'
          : image.compressedBlob.type === 'image/webp' ? '.webp'
          : image.compressedBlob.type === 'image/png' ? '.png'
          : image.compressedBlob.type === 'image/avif' ? '.avif'
          : getExtensionFromType(image.compressedBlob.type)
        const baseName = image.file.name.replace(/\.[^.]+$/, '')
        saveAs(blob, baseName + '_compressed' + ext)
      } finally {
        setDownloading(false)
      }
    }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 sm:p-4 bg-white dark:bg-slate-800 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {showDragHandle && (
          <div className="flex-shrink-0 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing -ml-1">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center">
          <img
            src={image.previewUrl}
            alt={image.file.name}
            loading="lazy"
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${image.rotation}deg) scaleX(${image.flipH ? -1 : 1}) scaleY(${image.flipV ? -1 : 1})`,
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{image.file.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatFileSize(image.originalSize)}
            {image.width > 0 && image.height > 0 && (
              <span> · {image.width}×{image.height}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {image.status === 'pending' && (
            <span className="text-xs text-slate-400 dark:text-slate-500">{t('card.pending')}</span>
          )}

          {image.status === 'compressing' && (
            <div className="flex items-center gap-1 text-brand-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {image.targetProgress ? (
                <span className="text-xs">{t('card.compressingQuality', { quality: image.targetProgress.quality, currentKB: image.targetProgress.currentKB })}</span>
              ) : (
                <span className="text-xs hidden sm:inline">{t('card.compressing')}</span>
              )}
            </div>
          )}

          {image.status === 'done' && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5">
                  {image.qualityTier && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${QUALITY_TIER_COLORS[image.qualityTier as QualityTier]}`}>
                      {t(`quality.${image.qualityTier}`)}
                    </span>
                  )}
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">{t('card.reduced', { ratio: ratio.toFixed(0) })}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(image.compressedSize!)}</p>
                  {image.metadataStripped && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 dark:text-green-400" title={t('quality.privacy')}>
                      <ShieldCheck className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 rounded-lg transition-colors"
              >
                {downloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{downloading ? t('card.exporting') : t('card.download')}</span>
              </button>
            </div>
          )}

          {image.status === 'error' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 hidden sm:inline">{image.error || t('card.failed')}</span>
              <button onClick={() => compressOne(image.id)} className="p-1 text-slate-400 hover:text-brand-600" title={t('card.retry')}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {image.status === 'done' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 text-slate-400 hover:text-slate-600"
              title={t('card.preview')}
            >
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button onClick={() => removeFile(image.id)} className="p-1 text-slate-300 hover:text-red-500" title={t('card.remove')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transform toolbar — only for non-compressing images */}
      {image.status !== 'compressing' && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">编辑:</span>
          <button
            onClick={() => rotateImage(image.id, 'ccw')}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title={t('card.rotateCcw')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => rotateImage(image.id, 'cw')}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            title={t('card.rotateCw')}
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
          <button
            onClick={() => flipImage(image.id, 'h')}
            className={`p-1.5 rounded-md transition-colors ${image.flipH ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-200 dark:ring-brand-800' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title={t('card.flipH')}
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => flipImage(image.id, 'v')}
            className={`p-1.5 rounded-md transition-colors ${image.flipV ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-200 dark:ring-brand-800' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title={t('card.flipV')}
          >
            <FlipVertical className="w-4 h-4" />
          </button>
          {(image.rotation !== 0 || image.flipH || image.flipV) && (
            <>
              <span className="w-px h-5 bg-slate-200 dark:bg-slate-600 mx-1" />
              <button
                onClick={() => resetTransform(image.id)}
                className="p-1.5 text-amber-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title={t('card.rotateReset')}
              >
                <Undo2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {showPreview && image.status === 'done' && previewBlobUrlRef.current && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <ImageCompare
            beforeSrc={image.previewUrl}
            afterSrc={previewBlobUrlRef.current}
            beforeLabel={t('card.before')}
            afterLabel={t('card.after')}
          />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500">{formatFileSize(image.originalSize)}</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatFileSize(image.compressedSize!)} · {t('card.reduced', { ratio: ratio.toFixed(0) })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
