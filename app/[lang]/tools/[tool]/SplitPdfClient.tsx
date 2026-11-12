'use client'

import { useMemo, useState } from 'react'
import { Files, Loader2, Scissors, ShieldCheck } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import { trackPdfEvent } from '@/lib/pdf/analytics'
import {
  MAX_PDF_BYTES,
  MAX_SPLIT_OUTPUTS,
  MAX_SPLIT_PAGES,
} from '@/lib/pdf/constants'
import { pdfErrorMessage } from '@/lib/pdf/errors'
import { downloadBlob, inspectPdf, sanitizeBaseName } from '@/lib/pdf/file-utils'
import {
  parsePageRanges,
  rangeErrorMessage,
  type ParsedRanges,
} from '@/lib/pdf/ranges'
import { splitPdf, type SplitMode } from '@/lib/pdf/split'
import { PdfDropzone } from '@/components/pdf-tools/PdfDropzone'
import { PdfFileCard } from '@/components/pdf-tools/PdfFileCard'
import { PdfOptionCards } from '@/components/pdf-tools/PdfOptionCards'
import { PdfProgress } from '@/components/pdf-tools/PdfProgress'
import { PdfResultCard } from '@/components/pdf-tools/PdfResultCard'

interface SplitItem {
  file: File
  pageCount: number
}

interface SplitResultState {
  kind: 'pdf' | 'zip'
  blob: Blob
  name: string
  fileCount: number
  totalPages: number
}

export default function SplitPdfClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [item, setItem] = useState<SplitItem | null>(null)
  const [mode, setMode] = useState<SplitMode>('ranges')
  const [rangeInput, setRangeInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [zipPct, setZipPct] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SplitResultState | null>(null)

  const busy = adding || generating

  const parseResult = useMemo(() => {
    if (!item || mode === 'every') return null
    return parsePageRanges(rangeInput, item.pageCount)
  }, [item, mode, rangeInput])

  const parsed: ParsedRanges | null = parseResult?.ok ? parseResult.value : null
  const everyTooMany = mode === 'every' && item ? item.pageCount > MAX_SPLIT_OUTPUTS : false
  const rangeError =
    parseResult && !parseResult.ok && item
      ? rangeErrorMessage(parseResult, isZh, item.pageCount)
      : ''
  const canGenerate = Boolean(item) && !busy && !everyTooMany && (mode === 'every' || Boolean(parsed))

  const addFile = async (files: File[]) => {
    const file = files[0]
    if (!file || busy) return

    setError('')
    setResult(null)
    if (file.size > MAX_PDF_BYTES) {
      setError(isZh ? '文件超过 50MB，请先压缩或拆分后再试。' : 'The file is larger than 50MB. Compress or split it first.')
      return
    }

    setAdding(true)
    try {
      const { pageCount } = await inspectPdf(file)
      if (pageCount > MAX_SPLIT_PAGES) {
        setItem(null)
        setError(
          isZh
            ? `此 PDF 有 ${pageCount} 页，超过 ${MAX_SPLIT_PAGES} 页上限。请先用其他工具分段。`
            : `This PDF has ${pageCount} pages — the limit is ${MAX_SPLIT_PAGES}. Split it in another tool first.`,
        )
        return
      }
      setItem({ file, pageCount })
      setRangeInput('')
      setMode('ranges')
    } catch (err) {
      setItem(null)
      setError(pdfErrorMessage(err, isZh))
    } finally {
      setAdding(false)
    }
  }

  const reset = () => {
    if (busy) return
    setItem(null)
    setRangeInput('')
    setError('')
    setResult(null)
  }

  const generate = async () => {
    if (!item || !canGenerate) return

    let value: ParsedRanges
    if (mode === 'every') {
      value = {
        ranges: [{ start: 1, end: item.pageCount }],
        pages: Array.from({ length: item.pageCount }, (_, i) => i + 1),
        totalPages: item.pageCount,
      }
    } else if (parsed) {
      value = parsed
    } else {
      return
    }

    const outputs =
      mode === 'every' ? item.pageCount : mode === 'extract' ? 1 : value.ranges.length

    setError('')
    setResult(null)
    setZipPct(null)
    setGenerating(true)
    setProgress({ done: 0, total: outputs })

    try {
      const split = await splitPdf(item.file, mode, value, item.pageCount, {
        onProgress: (done, total) => setProgress({ done, total }),
        onZipProgress: pct => setZipPct(pct),
      })
      const base = sanitizeBaseName(item.file.name)

      if (split.zipBlob) {
        setResult({
          kind: 'zip',
          blob: split.zipBlob,
          name: `${base}-split.zip`,
          fileCount: split.files.length,
          totalPages: split.totalPages,
        })
        trackPdfEvent('generate', {
          tool: 'split-pdf',
          pages: split.totalPages,
          bytes: split.zipBlob.size,
        })
      } else {
        const first = split.files[0]
        if (!first) throw new Error('empty split output')
        const blob = new Blob([first.bytes as unknown as BlobPart], { type: 'application/pdf' })
        setResult({
          kind: 'pdf',
          blob,
          name: first.name,
          fileCount: 1,
          totalPages: split.totalPages,
        })
        trackPdfEvent('generate', { tool: 'split-pdf', pages: split.totalPages, bytes: blob.size })
      }
    } catch (err) {
      console.error('[split-pdf]', err)
      setError(pdfErrorMessage(err, isZh))
      trackPdfEvent('error', { tool: 'split-pdf' })
    } finally {
      setGenerating(false)
      setProgress(null)
      setZipPct(null)
    }
  }

  const download = () => {
    if (!result) return
    downloadBlob(result.blob, result.name)
    trackPdfEvent('download', {
      tool: 'split-pdf',
      pages: result.totalPages,
      bytes: result.blob.size,
    })
  }

  const preview = (() => {
    if (!item) return ''
    if (mode === 'every') {
      return isZh
        ? `将生成 ${item.pageCount} 个单页 PDF${item.pageCount > 1 ? '，打包为一个 ZIP' : ''}`
        : `Creates ${item.pageCount} single-page PDF${item.pageCount > 1 ? 's, packed into one ZIP' : ''}`
    }
    if (!parseResult?.ok) return ''
    if (mode === 'extract') {
      return isZh
        ? `将提取 ${parseResult.value.pages.length} 页，合成 1 个 PDF`
        : `Extracts ${parseResult.value.pages.length} page${parseResult.value.pages.length > 1 ? 's' : ''} into one PDF`
    }
    return isZh
      ? `将生成 ${parseResult.value.ranges.length} 个 PDF${parseResult.value.ranges.length > 1 ? '，打包为 ZIP' : ''}`
      : `Creates ${parseResult.value.ranges.length} PDF${parseResult.value.ranges.length > 1 ? 's, packed into a ZIP' : ''}`
  })()

  return (
    <div className="space-y-4">
      {!item ? (
        <PdfDropzone
          disabled={busy}
          hint={
            isZh
              ? `1 个 PDF，≤50MB、≤${MAX_SPLIT_PAGES} 页 — 文件不会上传`
              : `One PDF, ≤50MB and ≤${MAX_SPLIT_PAGES} pages — nothing is uploaded`
          }
          onFiles={addFile}
        />
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
            <PdfFileCard
              file={item.file}
              pageCount={item.pageCount}
              status="ready"
              disabled={busy}
              onRemove={reset}
            />
          </div>
          <PdfDropzone
            compact
            disabled={busy}
            compactLabel={isZh ? '更换 PDF' : 'Replace PDF'}
            onFiles={addFile}
          />
        </>
      )}

      {adding && (
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isZh ? '正在读取 PDF 页数…' : 'Reading the PDF…'}
        </p>
      )}

      {item && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">{isZh ? '拆分方式' : 'Split mode'}</p>
            <PdfOptionCards<SplitMode>
              value={mode}
              onChange={next => {
                setMode(next)
                setResult(null)
                setError('')
              }}
              disabled={busy}
              options={[
                {
                  value: 'ranges',
                  title: isZh ? '按范围拆分' : 'Custom ranges',
                  desc: isZh
                    ? '每一段范围生成一个 PDF，例如 1-3,5,8-10'
                    : 'One PDF per range, e.g. 1-3,5,8-10',
                  badge: isZh ? '常用' : 'Popular',
                },
                {
                  value: 'every',
                  title: isZh ? '每页一个 PDF' : 'One PDF per page',
                  desc: isZh ? '把每一页拆成单独文件，多页时打包 ZIP' : 'Each page becomes its own PDF; multiple pages are zipped',
                },
                {
                  value: 'extract',
                  title: isZh ? '提取指定页' : 'Extract pages',
                  desc: isZh ? '把指定页合并成一个 PDF，例如 1,3,5' : 'Merge chosen pages into one PDF, e.g. 1,3,5',
                },
              ]}
            />
          </div>

          {mode !== 'every' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="pdf-range-input" className="text-sm font-medium text-gray-800">
                  {mode === 'extract' ? (isZh ? '要提取的页码' : 'Pages to extract') : isZh ? '页码范围' : 'Page ranges'}
                </label>
                <button
                  type="button"
                  onClick={() => setRangeInput(`1-${item.pageCount}`)}
                  disabled={busy}
                  className="text-xs font-medium text-cyan-700 hover:text-cyan-800 disabled:opacity-50"
                >
                  {isZh ? '全部页面' : 'All pages'}
                </button>
              </div>
              <input
                id="pdf-range-input"
                value={rangeInput}
                onChange={e => {
                  setRangeInput(e.target.value)
                  setResult(null)
                }}
                disabled={busy}
                inputMode="numeric"
                placeholder={mode === 'extract' ? '1,3,5' : '1-3,5,8-10'}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:bg-gray-50 ${
                  rangeError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500">
                {mode === 'extract'
                  ? isZh
                    ? '用逗号分隔页码或范围，重复页会自动去重。'
                    : 'Separate pages or ranges with commas; duplicates are removed.'
                  : isZh
                    ? '每一段用逗号分隔，例如 1-3,5,8-10。'
                    : 'Separate each range with a comma, e.g. 1-3,5,8-10.'}
              </p>
              {rangeError && <p className="text-xs text-red-500">{rangeError}</p>}
              {preview && !rangeError && <p className="text-xs text-cyan-700">{preview}</p>}
            </div>
          )}

          {mode === 'every' && preview && (
            <p className="text-xs text-cyan-700">{preview}</p>
          )}

          {everyTooMany && (
            <p className="text-xs text-red-500">
              {isZh
                ? `此 PDF 有 ${item.pageCount} 页，超过单次 ${MAX_SPLIT_OUTPUTS} 个文件上限，请改用范围拆分。`
                : `This PDF has ${item.pageCount} pages — over the ${MAX_SPLIT_OUTPUTS}-file limit. Use custom ranges instead.`}
            </p>
          )}

          <button
            type="button"
            onClick={generate}
            disabled={!canGenerate}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scissors className="w-4 h-4" />}
            {generating ? (isZh ? '正在拆分…' : 'Splitting…') : isZh ? '拆分 PDF' : 'Split PDF'}
          </button>
        </div>
      )}

      {progress && (
        <PdfProgress
          done={progress.done}
          total={progress.total}
          label={
            zipPct !== null
              ? isZh
                ? `正在打包 ZIP… ${zipPct}%`
                : `Packing ZIP… ${zipPct}%`
              : isZh
                ? `正在生成 ${progress.done}/${progress.total} 个文件`
                : `Creating file ${progress.done}/${progress.total}`
          }
        />
      )}

      {error && <p className="text-sm text-red-500 text-center break-words">{error}</p>}

      {result && (
        <PdfResultCard
          title={isZh ? '拆分完成' : 'PDF split'}
          primaryLabel={
            result.kind === 'zip'
              ? isZh
                ? `下载 ZIP（${result.fileCount} 个文件）`
                : `Download ZIP (${result.fileCount} files)`
              : isZh
                ? '下载 PDF'
                : 'Download PDF'
          }
          onPrimary={download}
          secondaryLabel={isZh ? '重新拆分' : 'Split again'}
          onSecondary={() => setResult(null)}
        >
          {isZh
            ? `${result.fileCount} 个文件 · 共 ${result.totalPages} 页 · ${formatFileSize(result.blob.size)}`
            : `${result.fileCount} file${result.fileCount > 1 ? 's' : ''} · ${result.totalPages} pages · ${formatFileSize(result.blob.size)}`}
        </PdfResultCard>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <Files className="w-3.5 h-3.5" />
        <ShieldCheck className="w-3.5 h-3.5" />
        {isZh ? '拆分在浏览器本地完成，PDF 不会上传到服务器' : 'Splitting runs locally — your PDF never leaves your device'}
      </p>
    </div>
  )
}
