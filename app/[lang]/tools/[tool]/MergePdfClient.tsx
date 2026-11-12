'use client'

import { useMemo, useRef, useState } from 'react'
import {
  ArrowDownAZ,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  GripVertical,
  Loader2,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import { trackPdfEvent } from '@/lib/pdf/analytics'
import { MAX_MERGE_FILES, MAX_MERGE_TOTAL_BYTES, MAX_PDF_BYTES } from '@/lib/pdf/constants'
import { pdfErrorMessage, toPdfToolError } from '@/lib/pdf/errors'
import { createId, downloadBlob, inspectPdf, sanitizeBaseName } from '@/lib/pdf/file-utils'
import { mergePdfFiles } from '@/lib/pdf/merge'
import { PdfDropzone } from '@/components/pdf-tools/PdfDropzone'
import { PdfFileCard } from '@/components/pdf-tools/PdfFileCard'
import { PdfProgress } from '@/components/pdf-tools/PdfProgress'
import { PdfResultCard } from '@/components/pdf-tools/PdfResultCard'

interface MergeItem {
  id: string
  file: File
  pageCount: number | null
  status: 'loading' | 'ready' | 'error'
  error?: string
}

interface MergeResultState {
  blob: Blob
  name: string
  pages: number
}

export default function MergePdfClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [items, setItems] = useState<MergeItem[]>([])
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<MergeResultState | null>(null)

  const dragFrom = useRef<number | null>(null)
  const busy = adding || generating

  const totalPages = useMemo(
    () => items.reduce((sum, item) => sum + (item.status === 'ready' && item.pageCount ? item.pageCount : 0), 0),
    [items],
  )
  const readyItems = items.filter(item => item.status === 'ready')
  const hasError = items.some(item => item.status === 'error')
  const canGenerate = readyItems.length >= 2 && !hasError && !busy

  const clearResult = () => setResult(null)

  const addFiles = async (incoming: File[]) => {
    if (busy) return
    setError('')
    setAdding(true)
    try {
      const room = MAX_MERGE_FILES - items.length
      if (room <= 0) {
        setError(isZh ? `最多合并 ${MAX_MERGE_FILES} 个 PDF` : `Up to ${MAX_MERGE_FILES} PDFs can be merged`)
        return
      }

      const accepted: MergeItem[] = []
      const notes: string[] = []
      let totalBytes = items.reduce((sum, item) => sum + item.file.size, 0)
      let tooLarge = 0

      for (const file of incoming.slice(0, room)) {
        if (file.size > MAX_PDF_BYTES || totalBytes + file.size > MAX_MERGE_TOTAL_BYTES) {
          tooLarge += 1
          continue
        }
        totalBytes += file.size
        accepted.push({ id: createId(), file, pageCount: null, status: 'loading' })
      }

      if (incoming.length > room) {
        notes.push(
          isZh
            ? `最多 ${MAX_MERGE_FILES} 个文件，多余的未添加`
            : `limit is ${MAX_MERGE_FILES} files — extras were not added`,
        )
      }
      if (tooLarge > 0) {
        notes.push(
          isZh
            ? `${tooLarge} 个文件超过单文件 50MB 或总大小 150MB，已跳过`
            : `${tooLarge} file(s) exceeded the 50MB per-file or 150MB total limit`,
        )
      }

      if (accepted.length === 0) {
        setError(notes.join(isZh ? '；' : '; '))
        return
      }

      setItems(prev => [...prev, ...accepted])
      clearResult()

      let failed = 0
      for (const item of accepted) {
        try {
          const { pageCount } = await inspectPdf(item.file)
          setItems(prev => prev.map(it => (it.id === item.id ? { ...it, pageCount, status: 'ready' } : it)))
        } catch (err) {
          failed += 1
          const message = pdfErrorMessage(toPdfToolError(err, 'corrupt'), isZh)
          setItems(prev =>
            prev.map(it => (it.id === item.id ? { ...it, status: 'error', error: message } : it)),
          )
        }
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      if (failed > 0) {
        notes.push(isZh ? `${failed} 个文件无法读取` : `${failed} file(s) could not be read`)
      }
      if (notes.length) setError(notes.join(isZh ? '；' : '; '))
    } finally {
      setAdding(false)
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    if (busy) return
    setItems(prev => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    clearResult()
  }

  const dropAt = (toIndex: number) => {
    const from = dragFrom.current
    dragFrom.current = null
    if (from === null || from === toIndex || busy) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    clearResult()
  }

  const sortByName = () => {
    if (busy) return
    setItems(prev =>
      [...prev].sort((a, b) =>
        a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' }),
      ),
    )
    clearResult()
  }

  const remove = (id: string) => {
    if (busy) return
    setItems(prev => prev.filter(item => item.id !== id))
    clearResult()
  }

  const clearAll = () => {
    if (busy) return
    setItems([])
    setError('')
    clearResult()
  }

  const generate = async () => {
    if (!canGenerate) {
      if (hasError) setError(isZh ? '请先移除无法读取的文件。' : 'Remove the files that could not be read first.')
      else setError(isZh ? '至少需要 2 个 PDF 才能合并。' : 'Add at least 2 PDFs to merge.')
      return
    }

    setError('')
    setGenerating(true)
    setProgress({ done: 0, total: readyItems.length })
    const base = sanitizeBaseName(readyItems[0].file.name)

    try {
      const { blob, pages } = await mergePdfFiles(
        readyItems.map(item => item.file),
        {
          title: `${base}-merged`,
          onProgress: (done, total) => setProgress({ done, total }),
        },
      )
      setResult({ blob, pages, name: `${base}-merged.pdf` })
      trackPdfEvent('generate', { tool: 'merge-pdf', pages, bytes: blob.size })
    } catch (err) {
      console.error('[merge-pdf]', err)
      setError(pdfErrorMessage(err, isZh))
      trackPdfEvent('error', { tool: 'merge-pdf' })
    } finally {
      setGenerating(false)
      setProgress(null)
    }
  }

  const download = () => {
    if (!result) return
    downloadBlob(result.blob, result.name)
    trackPdfEvent('download', { tool: 'merge-pdf', pages: result.pages, bytes: result.blob.size })
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <PdfDropzone
          multiple
          disabled={busy}
          hint={
            isZh
              ? `支持 PDF，单文件 ≤50MB，最多 ${MAX_MERGE_FILES} 个 — 文件不会上传`
              : `PDF only, ≤50MB each, up to ${MAX_MERGE_FILES} files — nothing is uploaded`
          }
          onFiles={addFiles}
        />
      ) : (
        <PdfDropzone multiple compact disabled={busy} onFiles={addFiles} />
      )}

      {adding && items.length > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isZh ? '正在读取 PDF 页数…' : 'Reading PDF page counts…'}
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-600">
              {isZh
                ? `${items.length} 个文件 · ${totalPages} 页`
                : `${items.length} file${items.length > 1 ? 's' : ''} · ${totalPages} pages`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={sortByName}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:border-cyan-300 disabled:opacity-40"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" />
                {isZh ? '按文件名排序' : 'Sort by name'}
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isZh ? '清空' : 'Clear'}
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable={!busy}
                onDragStart={() => {
                  dragFrom.current = index
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dropAt(index)}
                className={item.status === 'error' ? 'bg-red-50/40' : ''}
              >
                <div className="flex items-stretch">
                  <span className="hidden sm:flex items-center px-1.5 text-gray-300 cursor-grab" aria-hidden>
                    <GripVertical className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <PdfFileCard
                      file={item.file}
                      pageCount={item.pageCount}
                      status={item.status}
                      error={item.error}
                      index={index}
                      disabled={busy}
                      onRemove={() => remove(item.id)}
                      actions={
                        <>
                          <button
                            type="button"
                            onClick={() => move(index, -1)}
                            disabled={busy || index === 0}
                            aria-label={isZh ? '上移' : 'Move up'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => move(index, 1)}
                            disabled={busy || index === items.length - 1}
                            aria-label={isZh ? '下移' : 'Move down'}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </>
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length > 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <FilePlus2 className="w-3.5 h-3.5" />
          {isZh
            ? '拖动行可排序；页面原样复制，文字与画质不变'
            : 'Drag rows to reorder — pages are copied, not re-encoded'}
        </p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={!canGenerate}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus2 className="w-4 h-4" />}
        {generating
          ? isZh
            ? '正在合并…'
            : 'Merging…'
          : isZh
            ? `合并 ${readyItems.length} 个 PDF`
            : `Merge ${readyItems.length} PDFs`}
      </button>

      {progress && (
        <PdfProgress
          done={progress.done}
          total={progress.total}
          label={isZh ? `正在合并 ${progress.done}/${progress.total} 个文件` : `Merging ${progress.done}/${progress.total}`}
        />
      )}

      {error && <p className="text-sm text-red-500 text-center break-words">{error}</p>}

      {result && (
        <PdfResultCard
          title={isZh ? '合并完成' : 'PDF merged'}
          primaryLabel={isZh ? '下载合并后的 PDF' : 'Download merged PDF'}
          onPrimary={download}
          secondaryLabel={isZh ? '继续调整' : 'Adjust again'}
          onSecondary={clearResult}
        >
          {isZh
            ? `${result.pages} 页 · ${formatFileSize(result.blob.size)}`
            : `${result.pages} pages · ${formatFileSize(result.blob.size)}`}
        </PdfResultCard>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5" />
        {isZh ? '所有合并在浏览器本地完成，PDF 不会上传到服务器' : 'Everything runs locally — your PDFs never leave your device'}
      </p>
    </div>
  )
}
