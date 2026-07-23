'use client'

import { useState, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { ImageCard } from './ImageCard'
import { NamingSettings } from './NamingSettings'
import { Zap, Download, Trash2, ArrowRight, Dna, RotateCcw } from 'lucide-react'
import { formatFileSize } from '@/lib/compression/utils'
import { generateFilename } from '@/lib/compression/utils'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export function ImageList() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { files, isCompressing, compressAll, clearFiles, totalOriginalSize, totalCompressedSize, overallRatio, allDone, reorderFiles, naming, options, isPro, retryFailed } = useCompressionStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderFiles(dragIndex, overIndex)
    }
    setDragIndex(null)
    setOverIndex(null)
  }, [dragIndex, overIndex, reorderFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])
  if (files.length === 0) return null

  const pendingCount = files.filter(f => f.status === 'pending').length
  const doneCount = files.filter(f => f.status === 'done').length
  const errorCount = files.filter(f => f.status === 'error').length
  const hasDone = doneCount > 0
  const allProcessed = allDone()

  const handleBatchDownload = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.compressedBlob)
    if (doneFiles.length === 0) return

    if (doneFiles.length === 1) {
      const f = doneFiles[0]
      const name = generateFilename(f, naming, 1)
      saveAs(f.compressedBlob!, name)
      return
    }

    const zip = new JSZip()
    doneFiles.forEach((f, i) => {
      const name = generateFilename(f, naming, i + 1)
      zip.file(name, f.compressedBlob!)
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, 'compressed_images.zip')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 sm:gap-4 text-neutral-700 text-xs sm:text-sm flex-wrap">
          <span>{t('list.total', { n: files.length })}</span>
          {hasDone && (
            <>
              <span className="text-blue-500">
                {t('list.saved', { size: formatFileSize(totalOriginalSize() - totalCompressedSize()) })}
              </span>
              <span className="text-blue-500 font-medium">
                {t('list.reduced', { ratio: overallRatio().toFixed(0) })}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {pendingCount > 0 && !isCompressing && (
            <button
              onClick={compressAll}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 font-medium text-white bg-blue-600 hover:bg-blue-600 rounded-lg transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('list.compressAll', { n: pendingCount })}
            </button>
          )}

          {isCompressing && (
            <button disabled className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 font-medium text-white bg-blue-400 rounded-lg cursor-not-allowed text-xs sm:text-sm flex-1 sm:flex-none justify-center">
              <span className="inline-block w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-gray-300 border-t-white rounded-full animate-spin" />
              {t('list.compressing')}
            </button>
          )}

          {errorCount > 0 && !isCompressing && (
            <button
              onClick={retryFailed}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {t('list.retryFailed', { n: errorCount })}
            </button>
          )}

          {hasDone && (
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 font-medium text-white bg-blue-600 hover:bg-blue-600 rounded-lg transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {allProcessed ? t('list.downloadAll') : t('list.downloadDone', { n: doneCount })}
            </button>
          )}

          <button
            onClick={clearFiles}
            className="flex items-center gap-1 px-2 py-2 sm:px-3 sm:py-2 text-neutral-700 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t('list.clear')}</span>
          </button>
        </div>
      </div>

      <NamingSettings />

      <div className="space-y-2" onDrop={handleDrop}>
        {files.map((image, index) => (
          <div
            key={image.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-150 ${
              dragIndex === index ? 'opacity-40 scale-[0.98]' : ''
            }`}
          >
            {/* Drop indicator line — show above this card */}
            {overIndex === index && dragIndex !== index && (
              <div className="h-0.5 bg-brand-500 rounded-full mb-2 mx-2 transition-all" />
            )}
            <ImageCard image={image} index={index} showDragHandle />
            {/* Drop indicator line — show below the last card */}
            {overIndex === files.length && dragIndex !== null && index === files.length - 1 && (
              <div className="h-0.5 bg-brand-500 rounded-full mt-2 mx-2 transition-all" />
            )}
          </div>
        ))}
      </div>

      {/* AVIF comparison hint — shown after all compressions complete for non-Pro non-CN users */}
      {allProcessed && !isPro && !isCn && options.outputFormat !== 'avif' && doneCount > 0 && (
        <div className="mt-4 p-4 rounded-xl border border-purple-700/30 bg-gradient-to-r from-purple-900/10 to-indigo-900/10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Dna className="w-5 h-5 text-purple-400 flex-shrink-0" />
              <span className="text-sm text-neutral-800">
                {t('list.avifHint', { current: options.outputFormat === 'original' ? 'PNG/JPEG' : options.outputFormat.toUpperCase() })}
              </span>
            </div>
            <a
              href={`/${locale}/pro`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex-shrink-0"
            >
              {t('list.avifHintTry')}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
