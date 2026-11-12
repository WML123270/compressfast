'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Archive, Loader2, ShieldCheck, X } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import { trackPdfEvent } from '@/lib/pdf/analytics'
import {
  COMPRESS_PRESETS,
  MAX_COMPRESS_PAGES,
  MAX_PDF_BYTES,
  type CompressPreset,
  type PdfCompressMode,
} from '@/lib/pdf/constants'
import { PdfToolError, pdfErrorMessage } from '@/lib/pdf/errors'
import { downloadBlob, inspectPdf, sanitizeBaseName } from '@/lib/pdf/file-utils'
import {
  compressPdfLossless,
  compressPdfLossy,
  type CompressPhase,
} from '@/lib/pdf/compress'
import { PdfDropzone } from '@/components/pdf-tools/PdfDropzone'
import { PdfFileCard } from '@/components/pdf-tools/PdfFileCard'
import { PdfOptionCards } from '@/components/pdf-tools/PdfOptionCards'
import { PdfProgress } from '@/components/pdf-tools/PdfProgress'
import { PdfResultCard } from '@/components/pdf-tools/PdfResultCard'

interface CompressItem {
  file: File
  pageCount: number
}

interface CompressResultState {
  blob: Blob
  name: string
  pages: number
  inputBytes: number
  outputBytes: number
  clampedPages: number
  mode: PdfCompressMode
}

export default function CompressPdfClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [item, setItem] = useState<CompressItem | null>(null)
  const [mode, setMode] = useState<PdfCompressMode>('lossy')
  const [preset, setPreset] = useState<CompressPreset>('balanced')
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [phase, setPhase] = useState<CompressPhase | null>(null)
  const [error, setError] = useState('')
  const [cancelled, setCancelled] = useState(false)
  const [result, setResult] = useState<CompressResultState | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const busy = adding || generating

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const addFile = async (files: File[]) => {
    const file = files[0]
    if (!file || busy) return

    setError('')
    setCancelled(false)
    setResult(null)
    if (file.size > MAX_PDF_BYTES) {
      setError(isZh ? '文件超过 50MB，请先拆分后再试。' : 'The file is larger than 50MB. Split it first.')
      return
    }

    setAdding(true)
    try {
      const { pageCount } = await inspectPdf(file)
      if (pageCount > MAX_COMPRESS_PAGES) {
        setItem(null)
        setError(
          isZh
            ? `此 PDF 有 ${pageCount} 页，超过 ${MAX_COMPRESS_PAGES} 页上限，请先拆分。`
            : `This PDF has ${pageCount} pages — the limit is ${MAX_COMPRESS_PAGES}. Split it first.`,
        )
        return
      }
      setItem({ file, pageCount })
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
    setError('')
    setCancelled(false)
    setResult(null)
  }

  const generate = async () => {
    if (!item || busy) return

    const controller = new AbortController()
    abortRef.current = controller
    setError('')
    setCancelled(false)
    setResult(null)
    setProgress(mode === 'lossy' ? { done: 0, total: item.pageCount } : null)
    setPhase('loading')
    setGenerating(true)

    try {
      const output =
        mode === 'lossy'
          ? await compressPdfLossy(item.file, preset, {
              signal: controller.signal,
              onProgress: (done, total) => setProgress({ done, total }),
              onPhase: setPhase,
            })
          : await compressPdfLossless(item.file, {
              signal: controller.signal,
              onPhase: setPhase,
            })

      const base = sanitizeBaseName(item.file.name)
      setResult({
        blob: output.blob,
        name: `${base}-compressed.pdf`,
        pages: output.pages,
        inputBytes: output.inputBytes,
        outputBytes: output.outputBytes,
        clampedPages: output.clampedPages,
        mode,
      })
      trackPdfEvent('generate', {
        tool: 'compress-pdf',
        mode,
        pages: output.pages,
        bytes: output.outputBytes,
      })
    } catch (err) {
      if (err instanceof PdfToolError && err.code === 'cancelled') {
        setCancelled(true)
      } else {
        console.error('[compress-pdf]', err)
        setError(pdfErrorMessage(err, isZh))
        trackPdfEvent('error', { tool: 'compress-pdf', mode })
      }
    } finally {
      setGenerating(false)
      setProgress(null)
      setPhase(null)
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
      tool: 'compress-pdf',
      mode: result.mode,
      pages: result.pages,
      bytes: result.blob.size,
    })
  }

  const phaseLabel = (() => {
    if (!generating) return ''
    if (mode === 'lossless') {
      return isZh ? '正在优化 PDF 结构…' : 'Optimizing the PDF structure…'
    }
    if (phase === 'loading') return isZh ? '正在加载 PDF…' : 'Loading the PDF…'
    if (phase === 'rendering' && progress) {
      return isZh
        ? `正在处理第 ${progress.done}/${progress.total} 页…`
        : `Rendering page ${progress.done}/${progress.total}…`
    }
    if (phase === 'saving') return isZh ? '正在生成 PDF…' : 'Building the PDF…'
    return isZh ? '正在处理…' : 'Working…'
  })()

  const grew = result ? result.outputBytes >= result.inputBytes * 0.98 : false
  const savedBytes = result ? result.inputBytes - result.outputBytes : 0
  const savedPct = result && result.inputBytes > 0 ? (savedBytes / result.inputBytes) * 100 : 0

  return (
    <div className="space-y-4">
      {!item ? (
        <PdfDropzone
          disabled={busy}
          hint={
            isZh
              ? `1 个 PDF，≤50MB、≤${MAX_COMPRESS_PAGES} 页 — 文件不会上传`
              : `One PDF, ≤50MB and ≤${MAX_COMPRESS_PAGES} pages — nothing is uploaded`
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
            <p className="text-sm font-medium text-gray-800">{isZh ? '压缩方式' : 'Compression mode'}</p>
            <PdfOptionCards<PdfCompressMode>
              value={mode}
              onChange={next => {
                if (busy) return
                setMode(next)
                setResult(null)
                setError('')
                setCancelled(false)
              }}
              disabled={busy}
              columns={2}
              options={[
                {
                  value: 'lossy',
                  title: isZh ? '图片化压缩' : 'Rasterize',
                  desc: isZh
                    ? '适合扫描件/照片型 PDF，体积通常大幅减小；文字会变成图片'
                    : 'Best for scans and image-heavy PDFs — big savings, but text becomes an image',
                  badge: isZh ? '推荐' : 'Popular',
                },
                {
                  value: 'lossless',
                  title: isZh ? '无损优化' : 'Lossless',
                  desc: isZh
                    ? '保留文字、链接和表单；体积收益较小，通常 0–10%'
                    : 'Keeps text, links and forms; modest savings, usually 0–10%',
                },
              ]}
            />
          </div>

          {mode === 'lossy' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">{isZh ? '压缩档位' : 'Preset'}</p>
              <PdfOptionCards<CompressPreset>
                value={preset}
                onChange={next => {
                  if (busy) return
                  setPreset(next)
                  setResult(null)
                }}
                disabled={busy}
                options={[
                  {
                    value: 'strong',
                    title: isZh ? '极限压缩' : 'Maximum',
                    desc: `${COMPRESS_PRESETS.strong.dpi} DPI · JPEG ${Math.round(COMPRESS_PRESETS.strong.quality * 100)}%`,
                  },
                  {
                    value: 'balanced',
                    title: isZh ? '均衡' : 'Balanced',
                    desc: `${COMPRESS_PRESETS.balanced.dpi} DPI · JPEG ${Math.round(COMPRESS_PRESETS.balanced.quality * 100)}%`,
                    badge: isZh ? '推荐' : 'Best',
                  },
                  {
                    value: 'high',
                    title: isZh ? '高清' : 'High quality',
                    desc: `${COMPRESS_PRESETS.high.dpi} DPI · JPEG ${Math.round(COMPRESS_PRESETS.high.quality * 100)}%`,
                  },
                ]}
              />
            </div>
          )}

          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${
              mode === 'lossy'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${mode === 'lossy' ? 'text-amber-500' : 'text-gray-400'}`} />
            <span>
              {mode === 'lossy'
                ? isZh
                  ? '图片化压缩适合扫描件和照片型 PDF。压缩后文字不可选中/搜索，链接、表单和书签也会丢失；以文字为主的 PDF 可能反而变大，建议改用无损优化。'
                  : 'Rasterization suits scans and photo-heavy PDFs. Text will no longer be selectable or searchable, and links, forms and bookmarks are lost. Text-heavy PDFs may get larger — use lossless instead.'
                : isZh
                  ? '无损优化会保留文字、链接、表单与书签，但体积收益有限，部分 PDF 甚至可能略微变大。'
                  : 'Lossless keeps text, links, forms and bookmarks, but savings are limited and some PDFs may even grow slightly.'}
            </span>
          </div>

          {generating ? (
            <button
              type="button"
              onClick={cancel}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-red-300 text-red-600 font-semibold hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              {isZh ? '取消处理' : 'Cancel'}
            </button>
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
            >
              <Archive className="w-4 h-4" />
              {mode === 'lossy'
                ? isZh
                  ? '压缩 PDF'
                  : 'Compress PDF'
                : isZh
                  ? '无损优化'
                  : 'Optimize losslessly'}
            </button>
          )}
        </div>
      )}

      {generating && (
        <PdfProgress
          done={progress?.done ?? 0}
          total={progress?.total ?? 0}
          label={phaseLabel}
          indeterminate={mode === 'lossless' || !progress}
        />
      )}

      {cancelled && (
        <p className="text-sm text-gray-500 text-center">{isZh ? '已取消处理，可重新开始。' : 'Processing cancelled — try again anytime.'}</p>
      )}

      {error && <p className="text-sm text-red-500 text-center break-words">{error}</p>}

      {result && (
        <PdfResultCard
          title={isZh ? '压缩完成' : 'PDF compressed'}
          primaryLabel={isZh ? '下载压缩后的 PDF' : 'Download compressed PDF'}
          onPrimary={download}
          secondaryLabel={isZh ? '重新压缩' : 'Compress again'}
          onSecondary={() => setResult(null)}
          warning={
            grew
              ? isZh
                ? `输出比原文件更大（${formatFileSize(result.outputBytes)} vs ${formatFileSize(result.inputBytes)}）。这份 PDF 可能以文字为主，建议改用无损优化或保留原文件。`
                : `The output is larger than the original (${formatFileSize(result.outputBytes)} vs ${formatFileSize(result.inputBytes)}). This PDF is probably text-heavy — try lossless or keep the original.`
              : undefined
          }
          note={
            result.clampedPages > 0
              ? isZh
                ? `${result.clampedPages} 个超大页面已自动降低分辨率。`
                : `${result.clampedPages} oversized page(s) were automatically downscaled.`
              : undefined
          }
          extra={
            grew ? (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {mode === 'lossy' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('lossless')
                      setResult(null)
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-sm font-medium text-amber-800 hover:bg-amber-100"
                  >
                    {isZh ? '改用无损优化' : 'Use lossless'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => downloadBlob(item!.file, item!.file.name)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:border-cyan-300"
                >
                  {isZh ? '下载原文件' : 'Download original'}
                </button>
              </div>
            ) : undefined
          }
        >
          <div className="space-y-1">
            <p>
              {isZh
                ? `${result.pages} 页 · ${formatFileSize(result.inputBytes)} → ${formatFileSize(result.outputBytes)}`
                : `${result.pages} pages · ${formatFileSize(result.inputBytes)} → ${formatFileSize(result.outputBytes)}`}
            </p>
            <p className={`text-xs font-semibold ${savedBytes >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {savedBytes >= 0
                ? isZh
                  ? `节省 ${formatFileSize(savedBytes)}（${savedPct.toFixed(1)}%）`
                  : `Saved ${formatFileSize(savedBytes)} (${savedPct.toFixed(1)}%)`
                : isZh
                  ? `增加 ${formatFileSize(Math.abs(savedBytes))}（${Math.abs(savedPct).toFixed(1)}%）`
                  : `Increased by ${formatFileSize(Math.abs(savedBytes))} (${Math.abs(savedPct).toFixed(1)}%)`}
            </p>
          </div>
        </PdfResultCard>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5" />
        {isZh ? '压缩在浏览器本地完成，PDF 不会上传到服务器' : 'Compression runs locally — your PDF never leaves your device'}
      </p>
    </div>
  )
}
