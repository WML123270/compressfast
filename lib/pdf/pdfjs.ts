// pdf.js 运行时加载器（仅「PDF 压缩」用）
// 资源自托管在 public/pdfjs/v<版本>/，通过 webpackIgnore 在运行时按 URL 加载，
// 不进入 webpack 打包 —— 与 /ort/ 的加载方式一致（见 lib/ai/upscale-worker.ts）。

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { MAX_CANVAS_EDGE, MAX_CANVAS_PIXELS } from './constants'
import { PdfToolError, toPdfToolError } from './errors'

export const PDFJS_VERSION = '4.10.38'
const PDFJS_DIR = `/pdfjs/v${PDFJS_VERSION}/`

type PdfJsModule = typeof import('pdfjs-dist')

let modulePromise: Promise<PdfJsModule> | null = null

export function getPdfJs(): Promise<PdfJsModule> {
  if (!modulePromise) {
    modulePromise = (async () => {
      // pdf.js 4.10 直接使用 Promise.withResolvers（Safari 17.4+）。先装兜底，让 Safari 16.4+ 也能用。
      // @ts-ignore —— 运行时从 public/ 加载，TS 无需解析
      await import(/* webpackIgnore: true */ '/pdfjs/v4.10.38/promise-with-resolvers.mjs')
      // @ts-ignore —— 同上
      const mod = (await import(/* webpackIgnore: true */ '/pdfjs/v4.10.38/pdf.min.mjs')) as PdfJsModule
      mod.GlobalWorkerOptions.workerSrc = `${PDFJS_DIR}pdf.worker.entry.mjs`
      return mod
    })().catch(err => {
      modulePromise = null
      throw toPdfToolError(err, 'engine')
    })
  }
  return modulePromise
}

export interface LoadPdfOptions {
  signal?: AbortSignal
  onProgress?: (loaded: number, total: number) => void
}

export async function loadPdfDocument(
  data: Uint8Array,
  options: LoadPdfOptions = {},
): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs()

  const task = pdfjs.getDocument({
    data,
    cMapUrl: `${PDFJS_DIR}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${PDFJS_DIR}standard_fonts/`,
    isEvalSupported: false,
    verbosity: 0,
  })

  task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    options.onProgress?.(loaded, total)
  }

  const onAbort = () => {
    void task.destroy()
  }
  options.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const doc = await task.promise
    if (options.signal?.aborted) {
      await doc.destroy()
      throw new PdfToolError('cancelled')
    }
    return doc
  } catch (err) {
    if (options.signal?.aborted) throw new PdfToolError('cancelled')
    throw toPdfToolError(err, 'corrupt')
  } finally {
    options.signal?.removeEventListener('abort', onAbort)
  }
}

export interface RenderPageOptions {
  dpi: number
  quality: number
  signal?: AbortSignal
}

export interface RenderedPage {
  jpeg: Uint8Array
  pageWidth: number
  pageHeight: number
  canvasWidth: number
  canvasHeight: number
  effectiveDpi: number
  clamped: boolean
}

export type PageImageMime = 'image/jpeg' | 'image/png'

export interface RenderPageImageOptions {
  dpi: number
  type: PageImageMime
  /** 仅 JPEG 生效；PNG 忽略 */
  quality?: number
  signal?: AbortSignal
}

export interface RenderedPageImage {
  blob: Blob
  pageWidth: number
  pageHeight: number
  canvasWidth: number
  canvasHeight: number
  effectiveDpi: number
  clamped: boolean
}

/**
 * 把一页渲染成白底图片（JPEG / PNG）。
 * 页面尺寸用 scale=1 的 viewport（已包含旋转与 CropBox），输出方向与 PDF 可见方向一致。
 */
export async function renderPageToImage(
  page: PDFPageProxy,
  options: RenderPageImageOptions,
): Promise<RenderedPageImage> {
  const base = page.getViewport({ scale: 1 })
  let scale = options.dpi / 72
  const maxScale = Math.min(
    Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, base.width * base.height)),
    MAX_CANVAS_EDGE / Math.max(1, base.width, base.height),
  )
  const clamped = scale > maxScale
  scale = Math.min(scale, maxScale)

  const viewport = page.getViewport({ scale })
  const canvasWidth = Math.max(1, Math.floor(viewport.width))
  const canvasHeight = Math.max(1, Math.floor(viewport.height))

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new PdfToolError('render')

  // JPEG 无透明通道；透明像素在 Chromium 会合成成黑色，必须先铺白底
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
    background: '#ffffff',
  })

  const onAbort = () => renderTask.cancel()
  options.signal?.addEventListener('abort', onAbort, { once: true })

  try {
    await renderTask.promise
    if (options.signal?.aborted) throw new PdfToolError('cancelled')

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new PdfToolError('render'))),
        options.type,
        options.type === 'image/jpeg' ? options.quality : undefined,
      )
    })

    return {
      blob,
      pageWidth: base.width,
      pageHeight: base.height,
      canvasWidth,
      canvasHeight,
      effectiveDpi: scale * 72,
      clamped,
    }
  } catch (err) {
    if (options.signal?.aborted) throw new PdfToolError('cancelled')
    throw toPdfToolError(err, 'render')
  } finally {
    options.signal?.removeEventListener('abort', onAbort)
    canvas.width = 0
    canvas.height = 0
  }
}

/** 把一页渲染成白底 JPEG（PDF 压缩复用），返回原始字节。 */
export async function renderPageToJpeg(
  page: PDFPageProxy,
  options: RenderPageOptions,
): Promise<RenderedPage> {
  const rendered = await renderPageToImage(page, {
    dpi: options.dpi,
    type: 'image/jpeg',
    quality: options.quality,
    signal: options.signal,
  })
  return {
    jpeg: new Uint8Array(await rendered.blob.arrayBuffer()),
    pageWidth: rendered.pageWidth,
    pageHeight: rendered.pageHeight,
    canvasWidth: rendered.canvasWidth,
    canvasHeight: rendered.canvasHeight,
    effectiveDpi: rendered.effectiveDpi,
    clamped: rendered.clamped,
  }
}
