'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { ImageCard } from './ImageCard'
import { NamingSettings } from './NamingSettings'
import { Zap, Download, Trash2, ArrowRight, Dna, RotateCcw, CheckSquare, Square, Loader2 } from 'lucide-react'
import { formatFileSize } from '@/lib/compression/utils'
import { generateFilename } from '@/lib/compression/utils'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export function ImageList() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { files, isCompressing, compressAll, clearFiles, totalOriginalSize, totalCompressedSize, overallRatio, allDone, reorderFiles, naming, options, isPro, retryFailed, undoStack, undoRemove } = useCompressionStore()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [undoVisible, setUndoVisible] = useState(false)
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Selection state for selective batch download
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; percent: number } | null>(null)
  const doneFiles = files.filter(f => f.status === 'done' && f.compressedBlob)
  const selectedCount = doneFiles.filter(f => selectedIds.has(f.id)).length
  const allSelected = doneFiles.length > 0 && selectedCount === doneFiles.length

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(doneFiles.map(f => f.id)))
  }, [doneFiles])

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Clear selection when files change
  useEffect(() => {
    setSelectedIds(prev => {
      const validIds = new Set(files.map(f => f.id))
      const next = new Set(Array.from(prev).filter(id => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [files])

  // Show undo bar when undoStack changes (file removed)
  useEffect(() => {
    if (undoStack.length > 0) {
      setUndoVisible(true)
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
      undoTimeoutRef.current = setTimeout(() => setUndoVisible(false), 8000)
    } else {
      setUndoVisible(false)
    }
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current)
    }
  }, [undoStack.length])

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
    // If files are selected, download only selected; otherwise download all done
    const targetFiles = selectedCount > 0
      ? doneFiles.filter(f => selectedIds.has(f.id))
      : doneFiles
    if (targetFiles.length === 0) return

    if (targetFiles.length === 1) {
      const f = targetFiles[0]
      const name = generateFilename(f, naming, 1)
      saveAs(f.compressedBlob!, name)
      return
    }

    setZipProgress({ current: 0, total: targetFiles.length, percent: 0 })
    const zip = new JSZip()
    targetFiles.forEach((f, i) => {
      const name = generateFilename(f, naming, i + 1)
      zip.file(name, f.compressedBlob!)
    })
    const zipBlob = await zip.generateAsync(
      { type: 'blob' },
      (meta) => {
        setZipProgress({ current: meta.currentFile ? targetFiles.findIndex(ff => ff.file.name === meta.currentFile) + 1 : 0, total: targetFiles.length, percent: meta.percent })
      },
    )
    setZipProgress(null)
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
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono ml-1">⌘↵</kbd>
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

          {/* Select All / Deselect All toggle */}
          {hasDone && !isCompressing && (
            <button
              onClick={allSelected ? deselectAll : selectAll}
              className="flex items-center gap-1 px-2 py-2 sm:px-2.5 sm:py-2 text-neutral-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
              title={allSelected ? (locale === 'zh' ? '取消全选' : 'Deselect All') : (locale === 'zh' ? '全选' : 'Select All')}
            >
              {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          {hasDone && (
            <button
              onClick={handleBatchDownload}
              disabled={zipProgress !== null}
              className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2 font-medium text-white bg-blue-600 hover:bg-blue-600 rounded-lg transition-colors text-xs sm:text-sm flex-1 sm:flex-none justify-center disabled:opacity-50"
            >
              {zipProgress ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              {selectedCount > 0
                ? (locale === 'zh' ? `下载选中 (${selectedCount})` : `Download Selected (${selectedCount})`)
                : allProcessed ? t('list.downloadAll') : t('list.downloadDone', { n: doneCount })
              }
            </button>
          )}

          {zipProgress && (
            <div className="w-full sm:w-48 flex items-center gap-2 px-2">
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${zipProgress.percent}%` }}
                />
              </div>
              <span className="text-xs text-neutral-700 tabular-nums whitespace-nowrap">
                {Math.round(zipProgress.percent)}%
              </span>
            </div>
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

      {/* Undo bar — appears after files are removed */}
      {undoVisible && undoStack.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl animate-slide-up">
          <span className="text-sm text-amber-800">
            {locale === 'zh'
              ? `已移除 ${undoStack.length} 个文件`
              : `${undoStack.length} file${undoStack.length > 1 ? 's' : ''} removed`}
          </span>
          <button
            onClick={() => {
              // Undo all removals
              const count = undoStack.length
              for (let i = 0; i < count; i++) undoRemove()
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {locale === 'zh' ? '撤销' : 'Undo'}
            <kbd className="text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-700 font-mono hidden sm:inline">⌘Z</kbd>
          </button>
        </div>
      )}

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
            <ImageCard image={image} index={index} showDragHandle selected={selectedIds.has(image.id)} onSelect={toggleSelect} />
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

      {/* Sticky mobile compress FAB — shown when there are pending files and not compressing */}
      {pendingCount > 0 && !isCompressing && (
        <div className="sm:hidden fixed bottom-6 left-4 right-4 z-40 animate-slide-up">
          <button
            onClick={compressAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all text-base"
          >
            <Zap className="w-5 h-5" />
            {t('list.compressAll', { n: pendingCount })}
          </button>
        </div>
      )}

      {/* Bottom spacer for FAB */}
      {pendingCount > 0 && !isCompressing && (
        <div className="sm:hidden h-20" />
      )}
    </div>
  )
}
