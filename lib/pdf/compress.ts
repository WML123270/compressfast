// PDF 压缩：
// - lossy：pdf.js 逐页渲染成 JPEG，再用 pdf-lib 按原页面尺寸重建（适合扫描件/图片型 PDF）
// - lossless：pdf-lib 重写对象流（体积收益小，但保留文字层/链接/表单）

import { COMPRESS_PRESETS, MAX_COMPRESS_PAGES, type CompressPreset } from './constants'
import { PdfToolError, toPdfToolError } from './errors'
import { loadPdfDocument, renderPageToJpeg } from './pdfjs'

export type CompressPhase = 'loading' | 'rendering' | 'saving'

export interface CompressOptions {
  signal?: AbortSignal
  onProgress?: (done: number, total: number) => void
  onPhase?: (phase: CompressPhase) => void
}

export interface CompressResult {
  blob: Blob
  pages: number
  inputBytes: number
  outputBytes: number
  clampedPages: number
}

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
}

export async function compressPdfLossy(
  file: File,
  preset: CompressPreset,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { dpi, quality } = COMPRESS_PRESETS[preset]
  const input = new Uint8Array(await file.arrayBuffer())
  const { PDFDocument } = await import('pdf-lib')

  options.onPhase?.('loading')
  let doc = null
  try {
    doc = await loadPdfDocument(input, { signal: options.signal })
    const total = doc.numPages
    if (total > MAX_COMPRESS_PAGES) throw new PdfToolError('too-many-pages')

    const out = await PDFDocument.create()
    const now = new Date()
    out.setProducer('CompressFast')
    out.setCreator('CompressFast')
    out.setCreationDate(now)
    out.setModificationDate(now)

    options.onPhase?.('rendering')
    let clampedPages = 0

    for (let i = 1; i <= total; i++) {
      if (options.signal?.aborted) throw new PdfToolError('cancelled')

      const page = await doc.getPage(i)
      try {
        const rendered = await renderPageToJpeg(page, {
          dpi,
          quality,
          signal: options.signal,
        })
        if (rendered.clamped) clampedPages += 1

        const image = await out.embedJpg(rendered.jpeg)
        const outPage = out.addPage([rendered.pageWidth, rendered.pageHeight])
        outPage.drawImage(image, {
          x: 0,
          y: 0,
          width: rendered.pageWidth,
          height: rendered.pageHeight,
        })
      } finally {
        page.cleanup()
      }

      options.onProgress?.(i, total)
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    options.onPhase?.('saving')
    const saved = await out.save({ useObjectStreams: true })
    return {
      blob: toBlob(saved),
      pages: total,
      inputBytes: file.size,
      outputBytes: saved.length,
      clampedPages,
    }
  } catch (err) {
    throw toPdfToolError(err, 'render')
  } finally {
    if (doc) await doc.destroy().catch(() => {})
  }
}

export async function compressPdfLossless(
  file: File,
  options: CompressOptions = {},
): Promise<CompressResult> {
  const { PDFDocument } = await import('pdf-lib')
  options.onPhase?.('loading')

  try {
    const input = await file.arrayBuffer()
    const src = await PDFDocument.load(input, { updateMetadata: false })
    const pages = src.getPageCount()
    if (pages > MAX_COMPRESS_PAGES) throw new PdfToolError('too-many-pages')

    options.onPhase?.('saving')
    const saved = await src.save({ useObjectStreams: true, addDefaultPage: false })
    return {
      blob: toBlob(saved),
      pages,
      inputBytes: file.size,
      outputBytes: saved.length,
      clampedPages: 0,
    }
  } catch (err) {
    throw toPdfToolError(err, 'corrupt')
  }
}
