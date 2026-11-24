/**
 * 图片拼接 —— 纯浏览器 canvas 实现
 *
 * 三种模式：
 *   vertical   竖向长图（聊天截图 / 长截图）
 *   horizontal 横向拼接（并排对比）
 *   grid       网格拼图（2/3/4 列，方形裁切铺满）
 *
 * 全程本地处理，不上传；逐张解码、画完即释放，避免同时持有大量 ImageBitmap。
 */

export type StitchMode = 'vertical' | 'horizontal' | 'grid'
export type StitchFormat = 'png' | 'jpeg' | 'webp'

export interface StitchOptions {
  mode: StitchMode
  /** 图片之间的间距（px） */
  gap: number
  /** 背景色：CSS 颜色，或 'transparent'（仅 PNG/WebP 生效） */
  background: string
  /** 网格模式列数（2-4） */
  columns: number
  /** 网格模式单元格边长（px，缩放前） */
  cellSize: number
  format: StitchFormat
  /** JPEG / WebP 质量 0-1 */
  quality: number
}

export interface StitchResult {
  blob: Blob
  width: number
  height: number
  count: number
  /** 是否因浏览器 canvas 限制被等比缩小 */
  clamped: boolean
}

export interface StitchCaps {
  maxEdge: number
  maxPixels: number
}

export const DEFAULT_CAPS: StitchCaps = { maxEdge: 24000, maxPixels: 32_000_000 }

/** 用户中途改参数 / 删图时用于取消上一轮生成 */
export class StitchCancelled extends Error {
  constructor() {
    super('cancelled')
    this.name = 'StitchCancelled'
  }
}

const MIME: Record<StitchFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

export function stitchExtension(format: StitchFormat): string {
  return format === 'jpeg' ? 'jpg' : format
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // 老浏览器不支持 imageOrientation 选项时退回默认行为
    return await createImageBitmap(file)
  }
}

/** 读取图片尺寸（不解码整张到画布，用完立即释放） */
export async function readImageSize(file: File): Promise<{ w: number; h: number }> {
  const bmp = await decode(file)
  const size = { w: bmp.width, h: bmp.height }
  bmp.close()
  return size
}

/**
 * 根据目标画布尺寸计算整体缩放比例，保证输出不超过浏览器 canvas 限制。
 */
function fitScale(width: number, height: number, caps: StitchCaps): number {
  let k = 1
  if (width > caps.maxEdge) k = Math.min(k, caps.maxEdge / width)
  if (height > caps.maxEdge) k = Math.min(k, caps.maxEdge / height)
  if (width * height * k * k > caps.maxPixels) {
    k = Math.min(k, Math.sqrt(caps.maxPixels / (width * height)))
  }
  return k
}

function createCanvas(width: number, height: number): {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  toBlob: (type: string, quality?: number) => Promise<Blob>
} {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas_unavailable')
    return {
      ctx,
      toBlob: (type, quality) => canvas.convertToBlob({ type, quality }),
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas_unavailable')
  return {
    ctx,
    toBlob: (type, quality) => new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('export_failed'))),
        type,
        quality,
      )
    }),
  }
}

interface LayoutItem {
  x: number
  y: number
  w: number
  h: number
  /** 网格模式：cover 裁切的源区域 */
  crop?: { sx: number; sy: number; sw: number; sh: number }
}

/**
 * 把多张图片拼成一张。
 * @param files 按用户排序的图片
 * @param options 拼接参数
 * @param onProgress 已处理张数 / 总张数
 * @param isCancelled 返回 true 时尽快中断
 */
export async function stitchImages(
  files: File[],
  options: StitchOptions,
  onProgress?: (done: number, total: number) => void,
  isCancelled?: () => boolean,
  caps: StitchCaps = DEFAULT_CAPS,
): Promise<StitchResult> {
  if (files.length === 0) throw new Error('no_images')
  const total = files.length

  // ── 1. 先读取所有尺寸，计算布局 ──
  const sizes: { w: number; h: number }[] = []
  for (let i = 0; i < files.length; i++) {
    if (isCancelled?.()) throw new StitchCancelled()
    sizes.push(await readImageSize(files[i]))
  }

  const gap = Math.max(0, Math.round(options.gap))
  const bg = options.background
  const format = options.format
  const mime = MIME[format]
  // JPEG 不支持透明；透明背景强制铺白
  const needsFill = bg !== 'transparent' || format === 'jpeg'
  const fill = bg === 'transparent' ? '#ffffff' : bg

  let width = 1
  let height = 1
  let k = 1
  let layout: LayoutItem[] = []
  let drawGap = gap

  if (options.mode === 'vertical') {
    const baseW = Math.max(...sizes.map(s => s.w), 1)
    const heights = sizes.map(s => Math.max(1, Math.round(s.h * (baseW / s.w))))
    width = baseW
    height = heights.reduce((sum, h) => sum + h, 0) + gap * (total - 1)
    k = fitScale(width, height, caps)
    const w = Math.max(1, Math.floor(baseW * k))
    drawGap = Math.max(0, Math.floor(gap * k))
    let y = 0
    layout = heights.map((h) => {
      const hh = Math.max(1, Math.floor(h * k))
      const item: LayoutItem = { x: 0, y, w, h: hh }
      y += hh + drawGap
      return item
    })
    width = w
    height = Math.max(1, y - drawGap)
  } else if (options.mode === 'horizontal') {
    const baseH = Math.max(...sizes.map(s => s.h), 1)
    const widths = sizes.map(s => Math.max(1, Math.round(s.w * (baseH / s.h))))
    height = baseH
    width = widths.reduce((sum, w) => sum + w, 0) + gap * (total - 1)
    k = fitScale(width, height, caps)
    const h = Math.max(1, Math.floor(baseH * k))
    drawGap = Math.max(0, Math.floor(gap * k))
    let x = 0
    layout = widths.map((w) => {
      const ww = Math.max(1, Math.floor(w * k))
      const item: LayoutItem = { x, y: 0, w: ww, h }
      x += ww + drawGap
      return item
    })
    width = Math.max(1, x - drawGap)
    height = h
  } else {
    const columns = Math.max(2, Math.min(4, Math.round(options.columns)))
    const cellSize = Math.max(64, Math.round(options.cellSize))
    const rows = Math.ceil(total / columns)
    width = columns * cellSize + gap * (columns - 1)
    height = rows * cellSize + gap * (rows - 1)
    k = fitScale(width, height, caps)
    const cell = Math.max(16, Math.floor(cellSize * k))
    drawGap = Math.max(0, Math.floor(gap * k))
    width = columns * cell + drawGap * (columns - 1)
    height = rows * cell + drawGap * (rows - 1)
    layout = sizes.map((s, i) => {
      const col = i % columns
      const row = Math.floor(i / columns)
      // cover：等比放大铺满单元格后居中裁切
      const scale = Math.max(cell / s.w, cell / s.h)
      const sw = cell / scale
      const sh = cell / scale
      return {
        x: col * (cell + drawGap),
        y: row * (cell + drawGap),
        w: cell,
        h: cell,
        crop: { sx: (s.w - sw) / 2, sy: (s.h - sh) / 2, sw, sh },
      }
    })
  }

  // ── 2. 逐张解码并绘制 ──
  const { ctx, toBlob } = createCanvas(width, height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (needsFill) {
    ctx.fillStyle = fill
    ctx.fillRect(0, 0, width, height)
  }

  for (let i = 0; i < files.length; i++) {
    if (isCancelled?.()) throw new StitchCancelled()
    const bmp = await decode(files[i])
    const box = layout[i]
    try {
      if (box.crop) {
        ctx.drawImage(
          bmp,
          box.crop.sx,
          box.crop.sy,
          box.crop.sw,
          box.crop.sh,
          box.x,
          box.y,
          box.w,
          box.h,
        )
      } else {
        ctx.drawImage(bmp, box.x, box.y, box.w, box.h)
      }
    } finally {
      bmp.close()
    }
    onProgress?.(i + 1, total)
  }

  const quality = format === 'png' ? undefined : Math.max(0.1, Math.min(1, options.quality))
  const blob = await toBlob(mime, quality)
  return { blob, width, height, count: total, clamped: k < 0.999 }
}
