// PDF 转图片：pdf.js 逐页渲染为 JPEG / PNG。
// 单页直接返回图片；多页打包 ZIP（STORE，图片已压缩过，再压无收益）。

import { MAX_PDF_IMAGE_PAGES, PDF_IMAGE_EXT, type PdfImageFormat } from './constants'
import { PdfToolError, toPdfToolError } from './errors'
import { loadPdfDocument, renderPageToImage, type PageImageMime } from './pdfjs'

export interface PdfToImageOptions {
  /** 1-based 页码，按传入顺序输出（parsePageRanges 已去重） */
  pages: number[]
  dpi: number
  format: PdfImageFormat
  /** 仅 JPEG 生效，0–1 */
  quality?: number
  signal?: AbortSignal
  onProgress?: (done: number, total: number) => void
  onZipProgress?: (percent: number) => void
}

export interface PdfImageFile {
  name: string
  blob: Blob
}

export interface PdfToImageResult {
  files: PdfImageFile[]
  /** 多页时有值；单页为 null */
  zipBlob: Blob | null
  pageCount: number
  inputBytes: number
  /** 实际下载体积：单页为图片大小，多页为 ZIP 大小 */
  outputBytes: number
  /** 因浏览器画布上限被自动降低 DPI 的页数 */
  clampedPages: number
}

export async function pdfToImages(
  file: File,
  baseName: string,
  options: PdfToImageOptions,
): Promise<PdfToImageResult> {
  const input = new Uint8Array(await file.arrayBuffer())
  const mime: PageImageMime = options.format === 'png' ? 'image/png' : 'image/jpeg'
  const ext = PDF_IMAGE_EXT[options.format]
  let doc: Awaited<ReturnType<typeof loadPdfDocument>> | null = null

  try {
    doc = await loadPdfDocument(input, { signal: options.signal })
    const total = doc.numPages
    if (total > MAX_PDF_IMAGE_PAGES) throw new PdfToolError('too-many-pages')

    const pages = options.pages.filter(p => Number.isInteger(p) && p >= 1 && p <= total)
    if (pages.length === 0) throw new PdfToolError('unknown')

    const pad = Math.max(2, String(total).length)
    const files: PdfImageFile[] = []
    let clampedPages = 0

    for (let i = 0; i < pages.length; i++) {
      if (options.signal?.aborted) throw new PdfToolError('cancelled')

      const page = await doc.getPage(pages[i])
      try {
        const rendered = await renderPageToImage(page, {
          dpi: options.dpi,
          type: mime,
          quality: options.quality,
          signal: options.signal,
        })
        if (rendered.clamped) clampedPages += 1
        files.push({
          name: `${baseName}-page-${String(pages[i]).padStart(pad, '0')}.${ext}`,
          blob: rendered.blob,
        })
      } finally {
        page.cleanup()
      }

      options.onProgress?.(i + 1, pages.length)
      // 让出主线程，保证进度条与取消按钮可交互
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    let zipBlob: Blob | null = null
    let outputBytes = files.reduce((sum, f) => sum + f.blob.size, 0)

    if (files.length > 1) {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const f of files) zip.file(f.name, f.blob)
      zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'STORE' },
        meta => options.onZipProgress?.(Math.round(meta.percent)),
      )
      outputBytes = zipBlob.size
    }

    return {
      files,
      zipBlob,
      pageCount: pages.length,
      inputBytes: file.size,
      outputBytes,
      clampedPages,
    }
  } catch (err) {
    throw toPdfToolError(err, 'render')
  } finally {
    if (doc) await doc.destroy().catch(() => {})
  }
}
