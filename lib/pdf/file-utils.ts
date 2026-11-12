// PDF 文件工具（仅客户端调用；pdf-lib 动态加载，避免首屏打包）

import { saveAs } from 'file-saver'
import { toPdfToolError } from './errors'

export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** 去掉扩展名，替换非法字符，限制长度；用于输出文件名 */
export function sanitizeBaseName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '')
  const cleaned = Array.from(base)
    .map(ch => {
      const code = ch.charCodeAt(0)
      if (code < 32 || code === 127) return '_'
      return /[\\/:*?"<>|]/.test(ch) ? '_' : ch
    })
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .trim()
  const chars = Array.from(cleaned)
  const limited = chars.length > 80 ? chars.slice(0, 80).join('') : cleaned
  return limited || 'document'
}

/** 同名文件追加 (2)/(3)，用于 ZIP 内去重 */
export function uniqueFileName(name: string, used: Set<string>): string {
  if (!used.has(name)) {
    used.add(name)
    return name
  }
  const dot = name.lastIndexOf('.')
  const stem = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let i = 2
  let candidate = `${stem} (${i})${ext}`
  while (used.has(candidate)) {
    i += 1
    candidate = `${stem} (${i})${ext}`
  }
  used.add(candidate)
  return candidate
}

/** 读取页数；加密/损坏文件会抛出可读的 PdfToolError */
export async function inspectPdf(file: File): Promise<{ pageCount: number }> {
  const { PDFDocument } = await import('pdf-lib')
  const bytes = await file.arrayBuffer()
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false })
    return { pageCount: doc.getPageCount() }
  } catch (err) {
    throw toPdfToolError(err, 'corrupt')
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  saveAs(blob, filename)
}
