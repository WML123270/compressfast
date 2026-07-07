'use client'

import { useState, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { ImageCard } from './ImageCard'
import { Zap, Download, Trash2 } from 'lucide-react'
import { formatFileSize } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import type { ImageFile } from '@/lib/compression/types'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useT } from '@/lib/i18n/context'

function getOutputName(f: ImageFile): string {
  const ext = f.compressedBlob?.type === 'image/jpeg' ? '.jpg'
    : f.compressedBlob?.type === 'image/webp' ? '.webp'
    : f.compressedBlob?.type === 'image/png' ? '.png'
    : f.compressedBlob?.type === 'image/avif' ? '.avif'
    : getExtensionFromType(f.compressedBlob?.type || f.file.type)
  return f.file.name.replace(/\.[^.]+$/, '') + '_compressed' + ext
}

export function ImageList() {
  const { t } = useT()
  const { files, isCompressing, compressAll, clearFiles, totalOriginalSize, totalCompressedSize, overallRatio, allDone, reorderFiles } = useCompressionStore()
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
  const hasDone = doneCount > 0
  const allProcessed = allDone()

  const handleBatchDownload = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.compressedBlob)
    if (doneFiles.length === 0) return

    if (doneFiles.length === 1) {
      const f = doneFiles[0]
      const name = getOutputName(f)
      saveAs(f.compressedBlob!, name)
      return
    }

    const zip = new JSZip()
    doneFiles.forEach(f => {
      const name = getOutputName(f)
      zip.file(name, f.compressedBlob!)
    })
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    saveAs(zipBlob, 'compressed_images.zip')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>{t('list.total', { n: files.length })}</span>
          {hasDone && (
            <>
              <span className="text-green-600 dark:text-green-400">
                {t('list.saved', { size: formatFileSize(totalOriginalSize() - totalCompressedSize()) })}
              </span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                {t('list.reduced', { ratio: overallRatio().toFixed(0) })}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && !isCompressing && (
            <button
              onClick={compressAll}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              {t('list.compressAll', { n: pendingCount })}
            </button>
          )}

          {isCompressing && (
            <button disabled className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-400 rounded-lg cursor-not-allowed">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('list.compressing')}
            </button>
          )}

          {hasDone && (
            <button
              onClick={handleBatchDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              {allProcessed ? t('list.downloadAll') : t('list.downloadDone', { n: doneCount })}
            </button>
          )}

          <button
            onClick={clearFiles}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{t('list.clear')}</span>
          </button>
        </div>
      </div>

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
    </div>
  )
}
