'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { FileImage, Images, Loader2, ShieldCheck, X } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import { trackPdfEvent } from '@/lib/pdf/analytics'
import {
  MAX_PDF_IMAGE_PAGES,
  MAX_PDF_BYTES,
  type PdfImageFormat,
} from '@/lib/pdf/constants'
import { PdfToolError, pdfErrorMessage } from '@/lib/pdf/errors'
import { downloadBlob, inspectPdf, sanitizeBaseName } from '@/lib/pdf/file-utils'
import { parsePageRanges, rangeErrorMessage, type ParsedRanges } from '@/lib/pdf/ranges'
import { pdfToImages } from '@/lib/pdf/pdf-to-image'
import { PdfDropzone } from '@/components/pdf-tools/PdfDropzone'
import { PdfFileCard } from '@/components/pdf-tools/PdfFileCard'
import { PdfOptionCards } from '@/components/pdf-tools/PdfOptionCards'
import { PdfProgress } from '@/components/pdf-tools/PdfProgress'
import { PdfResultCard } from '@/components/pdf-tools/PdfResultCard'
import { PdfSegmented } from '@/components/pdf-tools/PdfSegmented'

type PageMode = 'all' | 'custom'
type DpiPreset = '150' | '200' | '300'
type QualityPreset = 'high' | 'balanced' | 'small'

const QUALITY_VALUES: Record<QualityPreset, number> = {
  high: 0.92,
  balanced: 0.82,
  small: 0.7,
}

interface PdfItem {
  file: File
  pageCount: number
}

interface PdfToImageResultState {
  kind: 'image' | 'zip'
  blob: Blob
  name: string
  pageCount: number
  inputBytes: number
  outputBytes: number
  clampedPages: number
}

export default function PdfToImageClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [item, setItem] = useState<PdfItem | null>(null)
  const [format, setFormat] = useState<PdfImageFormat>('jpeg')
  const [dpi, setDpi] = useState<DpiPreset>('200')
  const [quality, setQuality] = useState<QualityPreset>('balanced')
  const [pageMode, setPageMode] = useState<PageMode>('all')
  const [rangeInput, setRangeInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [zipPct, setZipPct] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)
  const [result, setResult] = useState<PdfToImageResultState | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const busy = adding || generating

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const parseResult = useMemo(() => {
    if (!item || pageMode === 'all') return null
    // 页码会去重，输出上限由页数天然限制；token 上限沿用默认值即可
    return parsePageRanges(rangeInput, item.pageCount)
  }, [item, pageMode, rangeInput])

  const parsed: ParsedRanges | null = parseResult?.ok ? parseResult.value : null
  const rangeError =
    parseResult && !parseResult.ok && item
      ? rangeErrorMessage(parseResult, isZh, item.pageCount)
      : ''
  const selectedPages = pageMode === 'all'
    ? item?.pageCount ?? 0
    : parsed?.pages.length ?? 0
  const canGenerate =
    Boolean(item) && !busy && selectedPages > 0 && (pageMode === 'all' || Boolean(parsed))

  const addFile = async (files: File[]) => {
    const file = files[0]
    if (!file || busy) return

    setError('')
    setCancelled(false)
    setResult(null)

    if (file.size > MAX_PDF_BYTES) {
      setError(
        isZh
          ? '文件超过 50MB，请先压缩或拆分后再试。'
          : 'The file is larger than 50MB. Compress or split it first.',
      )
      return
    }

    setAdding(true)
    try {
      const { pageCount } = await inspectPdf(file)
      if (pageCount > MAX_PDF_IMAGE_PAGES) {
        setItem(null)
        setError(
          isZh
            ? `此 PDF 有 ${pageCount} 页，超过 ${MAX_PDF_IMAGE_PAGES} 页上限，请先拆分。`
            : `This PDF has ${pageCount} pages — the limit is ${MAX_PDF_IMAGE_PAGES}. Split it first.`,
        )
        return
      }
      setItem({ file, pageCount })
      setPageMode('all')
      setRangeInput('')
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
    setCancelled(false)
    setResult(null)
  }

  const generate = async () => {
    if (!item || !canGenerate) return

    const pages = pageMode === 'all'
      ? Array.from({ length: item.pageCount }, (_, i) => i + 1)
      : parsed?.pages ?? []
    if (pages.length === 0) return

    const controller = new AbortController()
    abortRef.current = controller
    setError('')
    setCancelled(false)
    setResult(null)
    setZipPct(null)
    setProgress({ done: 0, total: pages.length })
    setGenerating(true)

    try {
      const output = await pdfToImages(item.file, sanitizeBaseName(item.file.name), {
        pages,
        dpi: Number(dpi),
        format,
        quality: format === 'jpeg' ? QUALITY_VALUES[quality] : undefined,
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
        onZipProgress: pct => setZipPct(pct),
      })

      const first = output.files[0]
      if (!first) throw new Error('empty output')

      setResult({
        kind: output.zipBlob ? 'zip' : 'image',
        blob: output.zipBlob ?? first.blob,
        name: output.zipBlob ? `${sanitizeBaseName(item.file.name)}-pages.zip` : first.name,
        pageCount: output.pageCount,
        inputBytes: output.inputBytes,
        outputBytes: output.outputBytes,
        clampedPages: output.clampedPages,
      })
      trackPdfEvent('generate', {
        tool: 'pdf-to-jpg',
        pages: output.pageCount,
        bytes: output.outputBytes,
      })
    } catch (err) {
      if (err instanceof PdfToolError && err.code === 'cancelled') {
        setCancelled(true)
      } else {
        console.error('[pdf-to-jpg]', err)
        setError(pdfErrorMessage(err, isZh))
        trackPdfEvent('error', { tool: 'pdf-to-jpg' })
      }
    } finally {
      setGenerating(false)
      setProgress(null)
      setZipPct(null)
      abortRef.current = null
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
  }

  const download = () => {
    if (!result) return
    downloadBlob(result.blob, result.name)
    trackPdfEvent('download', {
      tool: 'pdf-to-jpg',
      pages: result.pageCount,
      bytes: result.blob.size,
    })
  }

  return (
    <div className="space-y-4">
      {!item ? (
        <PdfDropzone
          disabled={busy}
          hint={
            isZh
              ? `1 个 PDF，≤50MB、≤${MAX_PDF_IMAGE_PAGES} 页 — 文件不会上传`
              : `One PDF, ≤50MB and ≤${MAX_PDF_IMAGE_PAGES} pages — nothing is uploaded`
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
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-5">
          {/* 输出格式 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">
              {isZh ? '输出格式' : 'Output format'}
            </p>
            <PdfOptionCards<PdfImageFormat>
              value={format}
              onChange={next => {
                setFormat(next)
                setResult(null)
                setError('')
              }}
              disabled={busy}
              options={[
                {
                  value: 'jpeg',
                  title: 'JPG',
                  desc: isZh ? '体积小，适合分享和上传' : 'Smaller files — great for sharing',
                  badge: isZh ? '推荐' : 'Popular',
                },
                {
                  value: 'png',
                  title: 'PNG',
                  desc: isZh ? '无损画质，适合截图和图表' : 'Lossless — best for text and diagrams',
                },
              ]}
            />
          </div>

          {/* 清晰度 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">
              {isZh ? '清晰度（DPI）' : 'Resolution (DPI)'}
            </p>
            <PdfSegmented<DpiPreset>
              value={dpi}
              onChange={next => {
                setDpi(next)
                setResult(null)
              }}
              disabled={busy}
              fullWidth
              options={[
                { value: '150', label: isZh ? '150 屏幕' : '150 Screen' },
                { value: '200', label: isZh ? '200 清晰' : '200 Sharp' },
                { value: '300', label: isZh ? '300 印刷' : '300 Print' },
              ]}
            />
            <p className="text-xs text-gray-500">
              {isZh
                ? 'DPI 越高图片越清晰，文件也越大。300 DPI 适合打印，网页分享用 150–200 即可。'
                : 'Higher DPI means sharper images and larger files. 300 DPI suits printing; 150–200 is plenty for sharing.'}
            </p>
          </div>

          {/* JPEG 质量 */}
          {format === 'jpeg' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">
                {isZh ? 'JPG 质量' : 'JPG quality'}
              </p>
              <PdfSegmented<QualityPreset>
                value={quality}
                onChange={next => {
                  setQuality(next)
                  setResult(null)
                }}
                disabled={busy}
                fullWidth
                options={[
                  { value: 'high', label: isZh ? '高质量' : 'High' },
                  { value: 'balanced', label: isZh ? '均衡' : 'Balanced' },
                  { value: 'small', label: isZh ? '小体积' : 'Small' },
                ]}
              />
            </div>
          )}

          {/* 页码范围 */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">
              {isZh ? '要转换的页面' : 'Pages to convert'}
            </p>
            <PdfSegmented<PageMode>
              value={pageMode}
              onChange={next => {
                setPageMode(next)
                setResult(null)
                setError('')
              }}
              disabled={busy}
              fullWidth
              options={[
                { value: 'all', label: isZh ? `全部 ${item.pageCount} 页` : `All ${item.pageCount} pages` },
                { value: 'custom', label: isZh ? '自定义页码' : 'Custom pages' },
              ]}
            />
            {pageMode === 'custom' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="pdf-image-range" className="text-xs text-gray-600">
                    {isZh ? '示例：1-3,5,8-10' : 'Example: 1-3,5,8-10'}
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
                  id="pdf-image-range"
                  value={rangeInput}
                  onChange={e => {
                    setRangeInput(e.target.value)
                    setResult(null)
                  }}
                  disabled={busy}
                  inputMode="numeric"
                  placeholder="1-3,5,8-10"
                  className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:bg-gray-50 ${
                    rangeError ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {rangeError && <p className="text-xs text-red-500">{rangeError}</p>}
              </div>
            )}
          </div>

          <p className="text-xs text-cyan-700">
            {pageMode === 'custom' && parsed
              ? isZh
                ? `将转换 ${parsed.pages.length} 页，${parsed.pages.length > 1 ? '打包为一个 ZIP' : '输出 1 张图片'}`
                : `Converts ${parsed.pages.length} page${parsed.pages.length > 1 ? 's' : ''}${parsed.pages.length > 1 ? ', packed into one ZIP' : ' into one image'}`
              : isZh
                ? `将转换全部 ${selectedPages} 页，${selectedPages > 1 ? '打包为一个 ZIP' : '输出 1 张图片'}`
                : `Converts all ${selectedPages} page${selectedPages > 1 ? 's' : ''}${selectedPages > 1 ? ', packed into one ZIP' : ' into one image'}`}
          </p>

          {generating ? (
            <button
              type="button"
              onClick={cancel}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-300 text-red-600 font-semibold hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              {isZh ? '取消转换' : 'Cancel'}
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={!canGenerate}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
            >
              <FileImage className="w-4 h-4" />
              {isZh ? '转换为图片' : 'Convert to images'}
            </button>
          )}
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
                ? `正在渲染第 ${progress.done}/${progress.total} 页`
                : `Rendering page ${progress.done}/${progress.total}`
          }
        />
      )}

      {cancelled && (
        <p className="text-sm text-gray-500 text-center">
          {isZh ? '已取消转换，可重新开始。' : 'Conversion cancelled — try again anytime.'}
        </p>
      )}

      {error && <p className="text-sm text-red-500 text-center break-words">{error}</p>}

      {result && (
        <PdfResultCard
          title={isZh ? '转换完成' : 'PDF converted'}
          primaryLabel={
            result.kind === 'zip'
              ? isZh
                ? `下载 ZIP（${result.pageCount} 张图片）`
                : `Download ZIP (${result.pageCount} images)`
              : isZh
                ? '下载图片'
                : 'Download image'
          }
          onPrimary={download}
          secondaryLabel={isZh ? '重新转换' : 'Convert again'}
          onSecondary={() => setResult(null)}
          warning={
            result.clampedPages > 0
              ? isZh
                ? `${result.clampedPages} 页超出浏览器画布上限，已自动降低分辨率。`
                : `${result.clampedPages} page${result.clampedPages > 1 ? 's were' : ' was'} downscaled to fit browser canvas limits.`
              : undefined
          }
          note={
            result.kind === 'zip'
              ? isZh
                ? 'ZIP 内含逐页图片，文件名按页码排序。'
                : 'The ZIP contains one image per page, named by page number.'
              : undefined
          }
        >
          {isZh
            ? `${result.pageCount} 张图片 · ${formatFileSize(result.outputBytes)}（原 PDF ${formatFileSize(result.inputBytes)}）`
            : `${result.pageCount} image${result.pageCount > 1 ? 's' : ''} · ${formatFileSize(result.outputBytes)} (source PDF ${formatFileSize(result.inputBytes)})`}
        </PdfResultCard>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <Images className="w-3.5 h-3.5" />
        <ShieldCheck className="w-3.5 h-3.5" />
        {isZh ? '转换在浏览器本地完成，PDF 不会上传到服务器' : 'Conversion runs locally — your PDF never leaves your device'}
      </p>
    </div>
  )
}
