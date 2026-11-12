// PDF 合并：页面原样复制，不重新编码（文字/矢量/画质保持不变）

import { MAX_MERGE_PAGES } from './constants'
import { PdfToolError, toPdfToolError } from './errors'

export interface MergeOptions {
  title?: string
  onProgress?: (done: number, total: number) => void
}

export interface MergeResult {
  blob: Blob
  pages: number
}

export async function mergePdfFiles(files: File[], options: MergeOptions = {}): Promise<MergeResult> {
  const { PDFDocument } = await import('pdf-lib')
  const out = await PDFDocument.create()
  const now = new Date()

  out.setProducer('CompressFast')
  out.setCreator('CompressFast')
  out.setCreationDate(now)
  out.setModificationDate(now)
  if (options.title) out.setTitle(options.title)

  let pages = 0

  try {
    for (let i = 0; i < files.length; i++) {
      const bytes = await files[i].arrayBuffer()
      const src = await PDFDocument.load(bytes)
      const copied = await out.copyPages(src, src.getPageIndices())
      for (const page of copied) out.addPage(page)
      pages += copied.length

      if (pages > MAX_MERGE_PAGES) throw new PdfToolError('too-many-pages')

      options.onProgress?.(i + 1, files.length)
      // 让出主线程，保证进度条能绘制
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    const saved = await out.save({ useObjectStreams: true })
    return {
      blob: new Blob([saved as unknown as BlobPart], { type: 'application/pdf' }),
      pages,
    }
  } catch (err) {
    throw toPdfToolError(err, 'corrupt')
  }
}
