'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, X, RotateCcw, RotateCw, ChevronDown, ChevronUp, GripVertical, ShieldCheck, FlipHorizontal, FlipVertical, Undo2 } from 'lucide-react'
import type { ImageFile, QualityTier } from '@/lib/compression/types'
import { getQualityTier, QUALITY_TIER_COLORS } from '@/lib/compression/types'
import { useCompressionStore } from '@/lib/store/compression-store'
import { formatFileSize, getCompressionRatio } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import { generateFilename } from '@/lib/compression/utils'
import { saveAs } from 'file-saver'
import { useT } from '@/lib/i18n/context'
import { ImageCompare } from './ImageCompare'

interface ImageCardProps { image: ImageFile; index?: number; showDragHandle?: boolean }

export function ImageCard({ image, showDragHandle }: ImageCardProps) {
  const { t } = useT()
  const { removeFile, compressOne, rotateImage, flipImage, resetTransform, naming } = useCompressionStore()
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

        const name = generateFilename({ ...image, compressedBlob: blob }, naming, 1)
        saveAs(blob, name)
      } finally {
        setDownloading(false)
      }
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3">
        {showDragHandle && (
          <div className="flex-shrink-0 text-neutral-800 hover:text-neutral-700 cursor-grab active:cursor-grabbing -ml-1">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-300 flex items-center justify-center">
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
          <p className="font-medium text-neutral-900 truncate text-sm sm:text-base">{image.file.name}</p>
          <p className="text-neutral-700 mt-0.5 text-xs sm:text-sm">
            {formatFileSize(image.originalSize)}
            {image.width > 0 && image.height > 0 && (
              <span className="hidden sm:inline"> · {image.width}×{image.height}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {image.status === 'pending' && (
            <span className="text-neutral-600">{t('card.pending')}</span>
          )}

          {image.status === 'compressing' && (
            <div className="flex items-center gap-1 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              {image.targetProgress ? (
                <span className="text-xs">{t('card.compressingQuality', { quality: image.targetProgress.quality, currentKB: image.targetProgress.currentKB })}</span>
              ) : (
                <span className="text-xs">{t('card.compressing')}</span>
              )}
            </div>
          )}

          {image.status === 'done' && (
            <div className="flex items-center gap-2">
              {/* Mobile: compact info + download */}
              <div className="sm:hidden flex items-center gap-1.5">
                {image.qualityTier && (
                  <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${QUALITY_TIER_COLORS[image.qualityTier as QualityTier]}`}>
                    {t(`quality.${image.qualityTier}`)}
                  </span>
                )}
                <span className="text-blue-500 text-xs font-medium">{ratio.toFixed(0)}%</span>
              </div>
              {/* Desktop: full info */}
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-1.5">
                  {image.qualityTier && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${QUALITY_TIER_COLORS[image.qualityTier as QualityTier]}`}>
                      {t(`quality.${image.qualityTier}`)}
                    </span>
                  )}
                  <p className="text-blue-500 font-medium">{t('card.reduced', { ratio: ratio.toFixed(0) })}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-neutral-700">{formatFileSize(image.compressedSize!)}</p>
                  {image.metadataStripped && (
                    <span className="inline-flex items-center gap-0.5 text-blue-500" title={t('quality.privacy')}>
                      <ShieldCheck className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-1.5 font-medium text-white bg-blue-600 hover:bg-blue-600 disabled:bg-blue-400 rounded-lg transition-colors text-xs sm:text-sm"
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
              <span className="text-red-400 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{image.error || t('card.failed')}</span>
              <button onClick={() => compressOne(image.id)} className="p-1 text-neutral-700 hover:text-blue-600 flex-shrink-0" title={t('card.retry')}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          {image.status === 'done' && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="p-1 text-neutral-700 hover:text-neutral-600"
              title={t('card.preview')}
            >
              {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}

          <button onClick={() => removeFile(image.id)} className="p-1 text-neutral-800 hover:text-red-500" title={t('card.remove')}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Transform toolbar — only for non-compressing images */}
      {image.status !== 'compressing' && (
        <div className="flex items-center gap-0.5 sm:gap-1 mt-2 pt-2 border-gray-200">
          <span className="text-neutral-700 mr-0.5 hidden sm:inline text-xs">编辑:</span>
          <button
            onClick={() => rotateImage(image.id, 'ccw')}
            className="p-1 sm:p-1.5 text-neutral-700 hover:text-neutral-900 hover:bg-gray-50 rounded-md transition-colors"
            title={t('card.rotateCcw')}
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => rotateImage(image.id, 'cw')}
            className="p-1 sm:p-1.5 text-neutral-700 hover:text-neutral-900 hover:bg-gray-50 rounded-md transition-colors"
            title={t('card.rotateCw')}
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <span className="w-px h-4 sm:h-5 bg-gray-50 mx-0.5 sm:mx-1" />
          <button
            onClick={() => flipImage(image.id, 'h')}
            className={`p-1 sm:p-1.5 rounded-md transition-colors ${image.flipH ? 'text-blue-600 bg-brand-900/30 ring-1 ring-brand-800' : 'text-neutral-700 hover:text-neutral-900 hover:bg-gray-50'}`}
            title={t('card.flipH')}
          >
            <FlipHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={() => flipImage(image.id, 'v')}
            className={`p-1 sm:p-1.5 rounded-md transition-colors ${image.flipV ? 'text-blue-600 bg-brand-900/30 ring-1 ring-brand-800' : 'text-neutral-700 hover:text-neutral-900 hover:bg-gray-50'}`}
            title={t('card.flipV')}
          >
            <FlipVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {(image.rotation !== 0 || image.flipH || image.flipV) && (
            <>
              <span className="w-px h-4 sm:h-5 bg-gray-50 mx-0.5 sm:mx-1" />
              <button
                onClick={() => resetTransform(image.id)}
                className="p-1 sm:p-1.5 text-amber-500 hover:text-red-500 hover:bg-red-900/20 rounded-md transition-colors"
                title={t('card.rotateReset')}
              >
                <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          )}
        </div>
      )}

      {showPreview && image.status === 'done' && previewBlobUrlRef.current && (
        <div className="mt-3 pt-3 border-gray-200">
          <ImageCompare
            beforeSrc={image.previewUrl}
            afterSrc={previewBlobUrlRef.current}
            beforeLabel={t('card.before')}
            afterLabel={t('card.after')}
          />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-neutral-600">{formatFileSize(image.originalSize)}</span>
            <span className="text-blue-500 font-medium">
              {formatFileSize(image.compressedSize!)} · {t('card.reduced', { ratio: ratio.toFixed(0) })}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
