import { q2bits, reduceColors } from './utils'
// heic2any 在 Worker 中引用 window 会崩溃，HEIC 解码移到主线程
// oxipng 动态导入，避免 WASM 加载问题阻塞 Worker
// avif 编码器动态导入

interface WatermarkOpts {
  enabled: boolean
  type: 'text' | 'image' | 'none'
  text: string
  fontSize: number
  fontColor: string
  fontOpacity: number
  rotation: number
  imageDataUrl: string | null
  imageOpacity: number
  imageScale: number
  position: string
  marginX: number
  marginY: number
}

interface WMsg {
  id: string
  fileBuffer: ArrayBuffer
  fileName: string
  fileType: string
  quality: number
  speed: number
  lossless: boolean
  outputFormat: string
  targetKB?: number
  resizeWidth?: number
  resizeHeight?: number
  stripMetadata?: boolean
  rotation?: 0 | 90 | 180 | 270
  flipH?: boolean
  flipV?: boolean
  watermark?: WatermarkOpts
}

interface WRes {
  id: string
  type: 'progress' | 'done' | 'error'
  progress?: number
  step?: number
  currentKB?: number
  targetKB?: number
  triedQuality?: number
  compressedBuffer?: ArrayBufferLike
  compressedSize?: number
  outputMime?: string
  qualityTier?: string
  metadataStripped?: boolean
  error?: string
}

async function decodeImage(buffer: ArrayBuffer): Promise<ImageData> {
  const blob = new Blob([buffer])
  const bitmap = await createImageBitmap(blob)
  const w = bitmap.width, h = bitmap.height
  if (w === 0 || h === 0) { bitmap.close(); throw new Error('图片尺寸无效') }
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) { bitmap.close(); throw new Error('Canvas创建失败') }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return ctx.getImageData(0, 0, w, h)
}

/** 根据用户指定的宽高计算目标尺寸（等比缩放，不超过边界） */
function calcResizeDims(origW: number, origH: number, targetW: number, targetH: number): { w: number; h: number } {
  if (targetW > 0 && targetH > 0) {
    // 两边都指定了：fit within，等比缩放，不超过边界
    const scale = Math.min(targetW / origW, targetH / origH, 1)
    return { w: Math.round(origW * scale), h: Math.round(origH * scale) }
  }
  if (targetW > 0) {
    // 只指定宽度：等比计算高度
    const scale = Math.min(targetW / origW, 1)
    return { w: Math.round(origW * scale), h: Math.round(origH * scale) }
  }
  if (targetH > 0) {
    // 只指定高度：等比计算宽度
    const scale = Math.min(targetH / origH, 1)
    return { w: Math.round(origW * scale), h: Math.round(origH * scale) }
  }
  return { w: origW, h: origH }
}

/** 高质量图片缩放（使用 createImageBitmap 的 resize 选项，浏览器内置算法） */
async function resizeImage(img: ImageData, targetW: number, targetH: number): Promise<ImageData> {
  if (targetW >= img.width && targetH >= img.height) return img // 不放大小图

  // 通过 createImageBitmap 的 resize 选项获得高质量缩放
  const canvas = new OffscreenCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas创建失败')
  ctx.putImageData(img, 0, 0)
  const origBlob = await canvas.convertToBlob({ type: 'image/png' })
  const bitmap = await createImageBitmap(origBlob, {
    resizeWidth: targetW,
    resizeHeight: targetH,
    resizeQuality: 'high',
  })
  const outCanvas = new OffscreenCanvas(targetW, targetH)
  const outCtx = outCanvas.getContext('2d')
  if (!outCtx) { bitmap.close(); throw new Error('Canvas创建失败') }
  outCtx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close()
  return outCtx.getImageData(0, 0, targetW, targetH)
}

async function encodeImage(img: ImageData, mime: string, quality: number): Promise<ArrayBuffer> {
  const canvas = new OffscreenCanvas(img.width, img.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas创建失败')
  ctx.putImageData(img, 0, 0)
  const blob = await canvas.convertToBlob({ type: mime, quality: quality / 100 })
  return blob.arrayBuffer()
}

/** AVIF 编码（使用 @jsquash/avif WASM 编码器） */
async function encodeAvif(img: ImageData, quality: number, speed: number, lossless: boolean): Promise<ArrayBuffer> {
  const avifEncode = (await import('@jsquash/avif')).encode
  const avifSpeed = Math.max(0, Math.min(10, speed - 1))
  return avifEncode(img, { quality, speed: avifSpeed, lossless })
}

/** speed → 档位：1=极速, 2=均衡, 4=最佳压缩 */
function sp2level(s: number): number {
  if (s <= 2) return 4
  if (s <= 5) return 2
  return 1
}

function isJPEG(t: string) { return t === 'image/jpeg' || t === 'image/jpg' }
function isPNG(t: string) { return t === 'image/png' }
/** 图片像素总数 */
function totalPx(img: ImageData): number { return img.width * img.height }

// ─── EXIF 处理 ───────────────────────────────────────────

/** 从 JPEG ArrayBuffer 中提取 EXIF (APP1 marker) 原始字节 */
function extractExifFromJPEG(buf: ArrayBuffer): Uint8Array | null {
  const data = new Uint8Array(buf)
  if (data[0] !== 0xFF || data[1] !== 0xD8) return null // 不是 JPEG
  let offset = 2
  while (offset < data.length - 1) {
    if (data[offset] !== 0xFF) break
    const marker = data[offset + 1]
    if (marker === 0xDA || marker === 0xD9) break // SOS/EOI，停止
    if (marker === 0xE1) {
      // APP1 — EXIF
      const len = (data[offset + 2] << 8) | data[offset + 3]
      return data.slice(offset, offset + 2 + len)
    }
    // 跳过其他 marker
    const skip = (data[offset + 2] << 8) | data[offset + 3]
    offset += 2 + skip
  }
  return null
}

/** 将 EXIF APP1 marker 注入 JPEG ArrayBuffer（插在 SOI 之后） */
function injectExifIntoJPEG(buf: ArrayBuffer, exif: Uint8Array): ArrayBuffer {
  const data = new Uint8Array(buf)
  // 确保是 JPEG 且 SOI 在开头
  if (data[0] !== 0xFF || data[1] !== 0xD8) return buf
  const out = new Uint8Array(data.length + exif.length)
  out.set(data.subarray(0, 2), 0)       // SOI
  out.set(exif, 2)                       // APP1
  out.set(data.subarray(2), 2 + exif.length) // 剩余部分
  return out.buffer
}

/** Apply watermark (text or image) to ImageData */
async function applyWatermark(img: ImageData, wm: WatermarkOpts, imgWidth: number, imgHeight: number): Promise<ImageData> {
	if (!wm.enabled || wm.type === 'none') return img

	const canvas = new OffscreenCanvas(imgWidth, imgHeight)
	const ctx = canvas.getContext('2d')
	if (!ctx) return img
	ctx.putImageData(img, 0, 0)

	const mX = wm.marginX ?? 20
	const mY = wm.marginY ?? 20

	if (wm.type === 'text') {
		if (!wm.text) return img
		ctx.save()
		ctx.globalAlpha = wm.fontOpacity ?? 0.5
		ctx.fillStyle = wm.fontColor || '#ffffff'
		const fs = Math.max(8, Math.min(wm.fontSize ?? 24, imgHeight * 0.5))
		ctx.font = `bold ${fs}px sans-serif`
		ctx.textBaseline = 'top'

		const metrics = ctx.measureText(wm.text)
		const tw = metrics.width
		const th = fs

		const pos = wm.position || 'br'
		const isLeft = pos[1] === 'l'
		const isRight = pos[1] === 'r'
		const isTop = pos[0] === 't'
		const isBottom = pos[0] === 'b'

		let x: number, y: number
		if (isLeft) x = mX
		else if (isRight) x = imgWidth - tw - mX
		else x = (imgWidth - tw) / 2

		if (isTop) y = mY
		else if (isBottom) y = imgHeight - th - mY
		else y = (imgHeight - th) / 2

		if (wm.rotation) {
			ctx.translate(x + tw / 2, y + th / 2)
			ctx.rotate((wm.rotation * Math.PI) / 180)
			ctx.translate(-(x + tw / 2), -(y + th / 2))
		}

		ctx.fillText(wm.text, x, y)
		ctx.restore()
	} else if (wm.type === 'image' && wm.imageDataUrl) {
		try {
			const resp = await fetch(wm.imageDataUrl)
			const blob = await resp.blob()
			const bitmap = await createImageBitmap(blob)

			const scale = wm.imageScale ?? 0.3
			const maxW = imgWidth * scale
			const maxH = imgHeight * scale
			let w = bitmap.width, h = bitmap.height
			if (w > maxW || h > maxH) {
				const ratio = Math.min(maxW / w, maxH / h)
				w = Math.round(w * ratio)
				h = Math.round(h * ratio)
			}
			if (w < 4 || h < 4) { bitmap.close(); return img }

			const pos = wm.position || 'br'
			const isLeft = pos[1] === 'l'
			const isRight = pos[1] === 'r'
			const isTop = pos[0] === 't'
			const isBottom = pos[0] === 'b'

			let x: number, y: number
			if (isLeft) x = mX
			else if (isRight) x = imgWidth - w - mX
			else x = (imgWidth - w) / 2

			if (isTop) y = mY
			else if (isBottom) y = imgHeight - h - mY
			else y = (imgHeight - h) / 2

			ctx.save()
			ctx.globalAlpha = wm.imageOpacity ?? 0.5
			ctx.drawImage(bitmap, x, y, w, h)
			ctx.restore()
			bitmap.close()
		} catch {
			// watermark image failed to load, silently skip
		}
	}

	return ctx.getImageData(0, 0, imgWidth, imgHeight)
}

// ─── 质量评级 ───────────────────────────────────────────

function calcQualityTier(orig: number, compressed: number): string {
  if (orig === 0 || compressed === 0) return 'ok'
  const r = (orig - compressed) / orig
  if (r <= 0) return 'overcompressed'
  if (r < 0.15) return 'excellent'
  if (r < 0.45) return 'good'
  if (r < 0.75) return 'ok'
  return 'overcompressed'
}

/** Apply rotation + flip to an ImageData via canvas transform */
function applyTransform(
  img: ImageData,
  rotation: 0 | 90 | 180 | 270,
  flipH: boolean,
  flipV: boolean,
): ImageData {
  if (rotation === 0 && !flipH && !flipV) return img

  const bw = img.width, bh = img.height
  const swapped = rotation === 90 || rotation === 270
  const cw = swapped ? bh : bw
  const ch = swapped ? bw : bh

  const canvas = new OffscreenCanvas(cw, ch)
  const ctx = canvas.getContext('2d')
  if (!ctx) return img

  // Put original on a temp canvas to create an ImageBitmap for drawing
  const srcCanvas = new OffscreenCanvas(bw, bh)
  const srcCtx = srcCanvas.getContext('2d')
  if (!srcCtx) return img
  srcCtx.putImageData(img, 0, 0)

  ctx.translate(cw / 2, ch / 2)
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.drawImage(srcCanvas, -bw / 2, -bh / 2, bw, bh)

  return ctx.getImageData(0, 0, cw, ch)
}

/** 简单跳像素缩放，无 Canvas 操作，非常快 */
function scaleImageFast(img: ImageData, ratio: number): ImageData {
  const w = Math.round(img.width * ratio)
  const h = Math.round(img.height * ratio)
  if (w < 1 || h < 1) return img
  // Use precise ratio to avoid pixel overshoot beyond row boundaries
  const xRatio = img.width / w
  const yRatio = img.height / h
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(Math.floor(y * yRatio), img.height - 1)
    for (let x = 0; x < w; x++) {
      const sx = Math.min(Math.floor(x * xRatio), img.width - 1)
      const si = (sy * img.width + sx) * 4
      const di = (y * w + x) * 4
      out[di] = img.data[si]
      out[di + 1] = img.data[si + 1]
      out[di + 2] = img.data[si + 2]
      out[di + 3] = img.data[si + 3]
    }
  }
  return new ImageData(out, w, h)
}

/** 根据 speed 决定对大图做预缩放的比例（1=不缩放） */
function getPreScale(speed: number, pxCount: number): number {
  const level = sp2level(speed)
  // 最佳压缩(speed 1-2)：不缩放
  if (level >= 4) return 1
  // 均衡(speed 3-5)：> 2MP 缩到 80%
  if (level >= 2) return pxCount > 2_000_000 ? 0.8 : 1
  // 极速(speed 6-10)：> 1MP 缩到 60%
  return pxCount > 1_000_000 ? 0.6 : 1
}

/** targetKB 模式：根据 speed 决定尝试的画质+缩放组合数 */
function getKBQualityLevels(speed: number): number[] {
  const level = sp2level(speed)
  if (level >= 4) return [95, 90, 80, 70, 50, 30, 15, 5]   // 最佳 — 8 档
  if (level >= 2) return [90, 60, 30, 10]                    // 均衡 — 4 档
  return [70, 20]                                             // 极速 — 2 档
}

function getKBScales(speed: number): number[] {
  const level = sp2level(speed)
  if (level >= 4) return [1, 0.75, 0.5, 0.25]   // 最佳 — 4 档缩放
  if (level >= 2) return [1, 0.5]                // 均衡 — 2 档
  return [1]                                      // 极速 — 不缩放
}

async function compressRegular(
  img: ImageData,
  outMime: string,
  quality: number,
  speed: number,
  lossless: boolean,
): Promise<{ buf: ArrayBuffer; size: number }> {
  // AVIF: use dedicated WASM encoder (handles its own quantization)
  if (outMime === 'image/avif') {
    const buf = await encodeAvif(img, quality, speed, lossless)
    return { buf, size: buf.byteLength }
  }

  let workImg = img

  // Speed: 对超大图先预缩放（非无损模式）
  if (!lossless) {
    const preScale = getPreScale(speed, totalPx(img))
    if (preScale < 1) {
      workImg = scaleImageFast(workImg, preScale)
    }
  }

  // 颜色缩减
  if (!lossless) {
    const bits = q2bits(quality)
    if (bits < 8) workImg = reduceColors(workImg, bits)
  }

  // JPEG 需要 quality 参数（0-100），PNG/WebP 忽略
  const encodeQ = isJPEG(outMime) ? (lossless ? 95 : quality) : quality
  let buf = await encodeImage(workImg, outMime, encodeQ)

  // Apply oxipng for PNG lossless optimization (dynamic import to avoid WASM loading issues)
  if (lossless && isPNG(outMime)) {
    try {
      const oxipng = await import('@jsquash/oxipng')
      const optimized = await oxipng.optimise(new Uint8Array(buf)) as unknown as ArrayBuffer
      buf = optimized
    } catch {
      // oxipng failed, use unoptimized result
    }
  }

  return { buf, size: buf.byteLength }
}

async function compressToTarget(
  id: string,
  img: ImageData,
  targetBytes: number,
  speed: number,
  lossless: boolean,
  outMime: string,
): Promise<{ buf: ArrayBuffer; size: number; currentKB: number }> {
  const scales = getKBScales(speed)

  let bestBuf: ArrayBuffer = new ArrayBuffer(0)
  let bestSize = Infinity

  // PNG 输出：Canvas 忽略 quality 参数，改用缩放 + 颜色缩减 + oxipng 策略
  // 非 PNG 输出：迭代 quality + scale
  const isPngOut = isPNG(outMime)

  for (const scale of scales) {
    const src = scale === 1 ? img : scaleImageFast(img, scale)

    if (isPngOut && !lossless) {
      // PNG: quality iteration is wasted (canvas ignores it for PNG).
      // Instead: try different color bit-depths, then oxipng.
      for (const bits of [8, 6, 4, 2]) {
        let workImg = src
        if (bits < 8) workImg = reduceColors(workImg, bits)
        let buf = await encodeImage(workImg, outMime, 80)
        // Try oxipng on top
        try {
          const oxipng = await import('@jsquash/oxipng')
          const optimized = await oxipng.optimise(new Uint8Array(buf)) as unknown as ArrayBuffer
          buf = optimized
        } catch { /* use unoptimized */ }
        const size = buf.byteLength

        self.postMessage({
          id, type: 'progress',
          triedQuality: bits * 10, // fake quality for progress display
          currentKB: Math.round(size / 1024), targetKB: Math.round(targetBytes / 1024),
        } as WRes)

        if (Math.abs(size - targetBytes) < Math.abs(bestSize - targetBytes)) {
          bestBuf = buf; bestSize = size
        }
        if (size <= targetBytes * 1.1 && size >= targetBytes * 0.9) break
      }
    } else {
      // JPEG / WebP / AVIF / lossless-PNG: quality-based iteration works
      const qualities = getKBQualityLevels(speed)
      for (const q of qualities) {
        let buf: ArrayBuffer
        if (outMime === 'image/avif') {
          buf = await encodeAvif(src, q, speed, lossless)
        } else {
          let workImg = src
          if (!lossless) {
            const bits = q2bits(q)
            if (bits < 8) workImg = reduceColors(workImg, bits)
          }
          buf = await encodeImage(workImg, outMime, q)
          // Apply oxipng for PNG lossless mode
          if (lossless && isPngOut) {
            try {
              const oxipng = await import('@jsquash/oxipng')
              const optimized = await oxipng.optimise(new Uint8Array(buf)) as unknown as ArrayBuffer
              buf = optimized
            } catch { /* use unoptimized */ }
          }
        }
        const size = buf.byteLength

        self.postMessage({
          id, type: 'progress',
          triedQuality: q, currentKB: Math.round(size / 1024), targetKB: Math.round(targetBytes / 1024),
        } as WRes)

        if (Math.abs(size - targetBytes) < Math.abs(bestSize - targetBytes)) {
          bestBuf = buf; bestSize = size
        }
        // 误差 10% 以内，满意
        if (size <= targetBytes * 1.1 && size >= targetBytes * 0.9) break
      }
    }

    if (bestSize <= targetBytes * 1.15) break
  }

  return { buf: bestBuf, size: bestSize, currentKB: Math.round(bestSize / 1024) }
}

/** SVG 文本级优化（浏览器安全，不使用 Canvas 光栅化，保持矢量格式）
 *
 *  优化阶段:
 *  1. 移除结构性垃圾 (XML声明/DOCTYPE/注释/编辑器元数据)
 *  2. 属性清理 (version/xml:space/空属性/编辑器属性/无用namespace)
 *  3. 数值精度压缩 (path坐标→1位小数, 通用数值→2位, 颜色缩短)
 *  4. 空白清理 (>  < → ><, 多空格→1, =周围空格)
 *  5. 结构清理 (空<g>组, 空<defs>)
 *
 *  预期额外节省: 20-50% vs 基础优化
 */
async function optimizeSvg(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  let svg = new TextDecoder().decode(buffer)

  // ─── Phase 1: 移除结构性垃圾 ───

  // Remove XML declaration: <?xml ...?>
  svg = svg.replace(/<\?xml[^>]*\?>/gi, '')
  // Remove DOCTYPE
  svg = svg.replace(/<!DOCTYPE[^>]*>/gi, '')
  // Remove XML comments: <!-- ... -->
  svg = svg.replace(/<!--[\s\S]*?-->/g, '')
  // Remove <metadata> blocks (Adobe/Inkscape editor data)
  svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
  // Remove editor-namespaced elements: <sodipodi:...>, <inkscape:...>, <adobe:...>
  svg = svg.replace(/<sodipodi:[^>]*\/?>/gi, '')
  svg = svg.replace(/<\/sodipodi:[^>]*>/gi, '')
  // Remove <title> and <desc> (non-essential for rendering)
  svg = svg.replace(/<title>[\s\S]*?<\/title>/gi, '')
  svg = svg.replace(/<desc>[\s\S]*?<\/desc>/gi, '')
  // Remove inline <style> blocks (CSS) — strip completely, rare in production SVGs
  svg = svg.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')

  // ─── Phase 2: 属性清理 ───

  // Remove version attribute
  svg = svg.replace(/\s+version\s*=\s*["'][^"']*["']/gi, '')
  // Remove xml:space attribute
  svg = svg.replace(/\s+xml:space\s*=\s*["'][^"']*["']/gi, '')
  // Remove empty id, class, data-* attributes
  svg = svg.replace(/\s+(?:id|class|data-[\w-]+)\s*=\s*["']\s*["']/gi, '')
  // Remove editor-specific attributes (inkscape:*, sodipodi:*, xmlns:inkscape etc.)
  svg = svg.replace(/\s+(?:inkscape|sodipodi|adobe|serif):[\w-]+\s*=\s*["'][^"']*["']/gi, '')
  // Remove unused namespace declarations (xmlns:inkscape, xmlns:sodipodi, xmlns:rdf, xmlns:cc, xmlns:dc, xmlns:xlink)
  const unusedNs = ['inkscape', 'sodipodi', 'rdf', 'cc', 'dc', 'serif', 'adobe', 'xlink']
  for (const ns of unusedNs) {
    svg = svg.replace(new RegExp(`\\s+xmlns:${ns}\\s*=\\s*["'][^"']*["']`, 'gi'), '')
  }

  // ─── Phase 3: 数值精度压缩 ───

  // 3a. Path data: round coordinates to 1 decimal place (biggest win, ~20-40%)
  // Path d="..." contains commands (MmLlHhVvCcSsQqTtAaZz) followed by numbers
  svg = svg.replace(/\bd\s*=\s*"([^"]*)"/gi, (match, pathData: string) => {
    // Round numbers in path data to 1 decimal (0.5px precision is fine for screen)
    const rounded = pathData.replace(/(\d+\.\d{2,})/g, (num: string) => {
      const v = parseFloat(num)
      // Keep one decimal for coordinates
      return (Math.round(v * 10) / 10).toString()
    })
    // Clean up: remove trailing .0 for integer values
    .replace(/\b(\d+)\.0\b/g, '$1')
    // Compact separators: "0.5 0.5" stays, but "12,34" → "12 34"
    .replace(/,/g, ' ')
    // Collapse multiple spaces in path data
    .replace(/\s{2,}/g, ' ')
    return `d="${rounded}"`
  })

  // 3b. General numeric values: round to 2 decimal places (stroke-width, opacity, font-size, etc.)
  svg = svg.replace(/(\d+\.\d{3,})(?=[^\w])/g, (_: string, num: string) => {
    return (Math.round(parseFloat(num) * 100) / 100).toString()
  })

  // 3c. Color optimization: #ffffff → #fff, #ff0000 → red, rgb(0,0,0) → #000
  svg = svg.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi, '#$1$2$3')
  // rgb(255,255,255) → #fff
  svg = svg.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (_, r, g, b) => {
    const hex = ((parseInt(r) << 16) | (parseInt(g) << 8) | parseInt(b)).toString(16).padStart(6, '0')
    return `#${hex}`
  })

  // ─── Phase 4: 空白清理 ───

  // Collapse whitespace between tags: >  < → ><
  svg = svg.replace(/>\s+</g, '><')
  // Collapse multiple spaces into one
  svg = svg.replace(/\s{2,}/g, ' ')
  // Remove whitespace around = in attributes
  svg = svg.replace(/\s*=\s*/g, '=')
  // Remove leading/trailing whitespace inside attribute quotes (safe for quoted values)
  svg = svg.replace(/"\s+/g, '"')
  svg = svg.replace(/\s+"/g, '"')

  // ─── Phase 5: 结构清理 ───

  // Remove empty <g> groups: <g></g>, <g />
  svg = svg.replace(/<g\b[^>]*>\s*<\/g>/gi, '')
  svg = svg.replace(/<g\b[^>]*\/>/gi, '')
  // Remove empty <defs>
  svg = svg.replace(/<defs\b[^>]*>\s*<\/defs>/gi, '')
  // Remove empty <a> elements
  svg = svg.replace(/<a\b[^>]*>\s*<\/a>/gi, '')

  // Final trim
  svg = svg.trim()

  return new TextEncoder().encode(svg).buffer as ArrayBuffer
}

function isSVG(t: string) { return t === 'image/svg+xml' }

self.onmessage = async (e: MessageEvent<WMsg>) => {
  const { id, fileBuffer, fileType, quality, speed, lossless, outputFormat, targetKB, resizeWidth, resizeHeight, stripMetadata, watermark: wm } = e.data
  try {
    // 确定输出 MIME
    let outMime = fileType
    if (outputFormat === 'png') outMime = 'image/png'
    else if (outputFormat === 'jpeg') outMime = 'image/jpeg'
    else if (outputFormat === 'webp') outMime = 'image/webp'
    else if (outputFormat === 'avif') outMime = 'image/avif'

    const targetBytes = targetKB ? targetKB * 1024 : 0
    const shouldStrip = stripMetadata !== false // 默认 true

    // SVG: 文本级优化，不走 Canvas 光栅化（保持矢量格式）
    if (isSVG(fileType)) {
      let resultBuf = await optimizeSvg(fileBuffer)
      const resultSize = resultBuf.byteLength
      const qualityTier = calcQualityTier(fileBuffer.byteLength, resultSize)

      self.postMessage({
        id, type: 'done',
        compressedBuffer: resultBuf,
        compressedSize: resultSize,
        outputMime: 'image/svg+xml',
        qualityTier,
        metadataStripped: true, // SVGO 默认清除注释/元数据
      } as WRes)
      return
    }

    // HEIC 已在主线程解码为 PNG，Worker 不再处理 HEIC

    // 保留 EXIF：压缩前从原文件中提取
    let exifData: Uint8Array | null = null
    if (!shouldStrip && isJPEG(outMime) && isJPEG(fileType)) {
      exifData = extractExifFromJPEG(fileBuffer)
    }

    // 解码
    let img = await decodeImage(fileBuffer)

    // 用户指定的尺寸调整（先于压缩进行）
    if ((resizeWidth && resizeWidth > 0) || (resizeHeight && resizeHeight > 0)) {
      const { w, h } = calcResizeDims(img.width, img.height, resizeWidth || 0, resizeHeight || 0)
      if (w < img.width || h < img.height) {
        img = await resizeImage(img, w, h)
      }
    }

    // 旋转/翻转（从 store 传入的 rotation/flipH/flipV）
    const { rotation, flipH, flipV } = e.data
    if (rotation || flipH || flipV) {
      img = applyTransform(img, rotation || 0, flipH || false, flipV || false)
    }

    // 水印（在压缩前应用）
    if (wm && wm.enabled && wm.type !== 'none') {
      img = await applyWatermark(img, wm, img.width, img.height)
    }

    let resultBuf: ArrayBuffer
    let resultSize: number
    let currentKB = 0

    if (!targetBytes) {
      const r = await compressRegular(img, outMime, quality, speed, lossless)
      resultBuf = r.buf; resultSize = r.size
    } else {
      const r = await compressToTarget(id, img, targetBytes, speed, lossless, outMime)
      resultBuf = r.buf; resultSize = r.size; currentKB = r.currentKB
    }

    // 回注 EXIF
    if (exifData && isJPEG(outMime)) {
      resultBuf = injectExifIntoJPEG(resultBuf, exifData)
    }

    const qualityTier = calcQualityTier(fileBuffer.byteLength, resultSize)

    self.postMessage({
      id, type: 'done',
      compressedBuffer: resultBuf,
      compressedSize: resultSize,
      outputMime: outMime,
      qualityTier,
      metadataStripped: shouldStrip,
      currentKB,
    } as WRes)
  } catch (err) {
    self.postMessage({ id, type: 'error', error: err instanceof Error ? err.message : '压缩失败' } as WRes)
  }
}
