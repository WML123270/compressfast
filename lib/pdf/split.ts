// PDF 拆分：每页 / 自定义范围 / 提取页面。页面原样复制，不重新编码。

import type { ParsedRanges } from './ranges'
import { sanitizeBaseName, uniqueFileName } from './file-utils'
import { MAX_SPLIT_OUTPUTS, MAX_SPLIT_PAGES } from './constants'
import { PdfToolError, toPdfToolError } from './errors'

export type SplitMode = 'every' | 'ranges' | 'extract'

export interface SplitFile {
  name: string
  bytes: Uint8Array
}

export interface SplitResult {
  files: SplitFile[]
  zipBlob: Blob | null
  totalPages: number
}

export interface SplitOptions {
  onProgress?: (done: number, total: number) => void
  onZipProgress?: (pct: number) => void
}

/** 把模式 + 范围解析结果转换为「每个输出文件包含哪些 0-based 页索引」 */
export function buildSplitPlans(mode: SplitMode, parsed: ParsedRanges, pageCount: number): number[][] {
  if (mode === 'every') {
    return Array.from({ length: pageCount }, (_, i) => [i])
  }
  if (mode === 'extract') {
    return [parsed.pages.map(p => p - 1)]
  }
  return parsed.ranges.map(r => {
    const pages: number[] = []
    for (let p = r.start; p <= r.end; p++) pages.push(p - 1)
    return pages
  })
}

export function buildSplitNames(
  mode: SplitMode,
  parsed: ParsedRanges,
  baseName: string,
  pageCount: number,
): string[] {
  const base = sanitizeBaseName(baseName)
  const used = new Set<string>()
  const width = String(pageCount).length
  let names: string[]

  if (mode === 'every') {
    names = Array.from({ length: pageCount }, (_, i) =>
      `${base}-page-${String(i + 1).padStart(width, '0')}.pdf`,
    )
  } else if (mode === 'extract') {
    names = [`${base}-selected.pdf`]
  } else {
    names = parsed.ranges.map(r =>
      r.start === r.end
        ? `${base}-page-${String(r.start).padStart(width, '0')}.pdf`
        : `${base}-${r.start}-${r.end}.pdf`,
    )
  }

  return names.map(name => uniqueFileName(name, used))
}

export async function splitPdf(
  file: File,
  mode: SplitMode,
  parsed: ParsedRanges,
  pageCount: number,
  options: SplitOptions = {},
): Promise<SplitResult> {
  if (pageCount > MAX_SPLIT_PAGES) throw new PdfToolError('too-many-pages')

  const plans = buildSplitPlans(mode, parsed, pageCount)
  if (plans.length === 0) throw new PdfToolError('unsupported')
  if (plans.length > MAX_SPLIT_OUTPUTS) throw new PdfToolError('too-many-pages')

  const names = buildSplitNames(mode, parsed, file.name, pageCount)
  const { PDFDocument } = await import('pdf-lib')

  try {
    const src = await PDFDocument.load(await file.arrayBuffer())
    const files: SplitFile[] = []
    let totalPages = 0

    for (let i = 0; i < plans.length; i++) {
      const doc = await PDFDocument.create()
      const now = new Date()
      doc.setProducer('CompressFast')
      doc.setCreator('CompressFast')
      doc.setCreationDate(now)
      doc.setModificationDate(now)

      const copied = await doc.copyPages(src, plans[i])
      for (const page of copied) doc.addPage(page)
      totalPages += copied.length

      const saved = await doc.save({ useObjectStreams: true })
      files.push({ name: names[i], bytes: saved })

      options.onProgress?.(i + 1, plans.length)
      await new Promise(resolve => setTimeout(resolve, 0))
    }

    let zipBlob: Blob | null = null
    if (files.length > 1) {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      for (const f of files) zip.file(f.name, f.bytes)
      zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'STORE' },
        meta => options.onZipProgress?.(Math.round(meta.percent)),
      )
    }

    return { files, zipBlob, totalPages }
  } catch (err) {
    throw toPdfToolError(err, 'corrupt')
  }
}
