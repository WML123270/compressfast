/** 画质 → 颜色位深（与 Worker 中的 q2bits 相同） */
export function q2bits(q: number): number {
  if (q >= 95) return 8; if (q >= 80) return 7; if (q >= 60) return 6
  if (q >= 40) return 5; if (q >= 20) return 4; return 3
}

/** 颜色缩减（与 Worker 中的 reduceColors 相同） */
export function reduceColors(img: ImageData, bits: number): ImageData {
  const out = new Uint8ClampedArray(img.data.length)
  const levels = (1 << bits) - 1
  const shift = 8 - bits
  for (let i = 0; i < out.length; i += 4) {
    out[i]     = ((img.data[i]     >> shift) * 255 / levels) | 0
    out[i + 1] = ((img.data[i + 1] >> shift) * 255 / levels) | 0
    out[i + 2] = ((img.data[i + 2] >> shift) * 255 / levels) | 0
    out[i + 3] = img.data[i + 3]
  }
  return new ImageData(out, img.width, img.height)
}

/** 根据画质和原始大小估算压缩后体积（预设卡片和滑块 label 用） */
export function estimateCompressedSize(originalBytes: number, quality: number): string {
  // 基于实际测试校准的压缩率估算
  // PNG/无损格式压缩率较低，有损格式（JPEG/WebP）较高
  const ratio = quality >= 90 ? 0.55
    : quality >= 70 ? 0.30
    : quality >= 50 ? 0.18
    : quality >= 30 ? 0.10
    : 0.06
  const estimated = Math.round(originalBytes * ratio)
  if (estimated < 1024) return '约 <1KB'
  return `约 ${formatFileSize(estimated)}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

export function getCompressionRatio(original: number, compressed: number): number {
  if (original === 0) return 0
  return ((original - compressed) / original) * 100
}

export function generateId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(36)).join('').substring(0, 9)
}

export async function fileToImageData(file: File): Promise<{
  imageData: ImageData
  width: number
  height: number
}> {
  const bitmap = await createImageBitmap(file)
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建Canvas上下文')
  ctx.drawImage(bitmap, 0, 0)
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
  bitmap.close()
  return { imageData, width: bitmap.width, height: bitmap.height }
}
