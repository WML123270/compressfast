/**
 * Smart Compress — auto-detects optimal compression settings
 * based on image characteristics (format, size, dimensions).
 *
 * Heuristics:
 * - PNG with likely transparency → lossless PNG, oxipng optimization
 * - JPEG photos → WebP 75% quality (25-35% smaller than JPEG)
 * - Large images (>2MP) → suggest resize to 1920px
 * - HEIC/BMP raw → convert to WebP for web
 * - SVG vector → keep as SVG, no compression needed
 * - GIF → animated WebP for 60-80% savings
 */

import type { CompressionOptions } from './compression/types'

type OutputFormat = NonNullable<CompressionOptions['outputFormat']>

export interface SmartRecommendation {
  quality: number
  speed: number
  outputFormat: OutputFormat
  lossless: boolean
  stripMetadata: boolean
  resizeWidth?: number
  resizeHeight?: number
  reason: string
}

interface FileMeta {
  type: string
  originalSize: number
  width?: number
  height?: number
  name?: string
}

/**
 * Analyze a single file and return optimal compression settings.
 */
export function analyzeFile(file: FileMeta): SmartRecommendation {
  const { type, originalSize, width, height } = file
  const pixels = (width && height) ? width * height : 0
  const isLarge = pixels > 2_000_000 || originalSize > 1_000_000
  const isHuge = pixels > 4_000_000 || originalSize > 5_000_000

  // SVG — vector, keep as-is
  if (type === 'image/svg+xml') {
    return {
      quality: 100, speed: 5, outputFormat: 'original',
      lossless: true, stripMetadata: true,
      reason: 'SVG is vector — no compression needed'
    }
  }

  // BMP — always convert to lossless PNG
  if (type === 'image/bmp') {
    return {
      quality: 90, speed: 5, outputFormat: 'png',
      lossless: true, stripMetadata: true,
      reason: 'BMP → PNG (lossless, much smaller)'
    }
  }

  // HEIC — convert to WebP for web compatibility
  if (type === 'image/heic' || type === 'image/heif') {
    return {
      quality: 75, speed: 5, outputFormat: 'webp',
      lossless: false, stripMetadata: true,
      reason: 'HEIC → WebP (universal web format)'
    }
  }

  // GIF — convert to animated WebP for massive savings
  if (type === 'image/gif') {
    return {
      quality: 70, speed: 4, outputFormat: 'webp',
      lossless: false, stripMetadata: true,
      reason: 'GIF → WebP (60-80% smaller, keep animation)'
    }
  }

  // AVIF — already well-compressed, light touch
  if (type === 'image/avif') {
    return {
      quality: 85, speed: 5, outputFormat: 'original',
      lossless: false, stripMetadata: true,
      reason: 'AVIF already optimized — light re-compress'
    }
  }

  // PNG — choose lossless vs lossy based on characteristics
  if (type === 'image/png') {
    // Large PNGs are usually photos/screenshots → better as WebP
    if (isHuge) {
      return {
        quality: 75, speed: 5, outputFormat: 'webp',
        lossless: false, stripMetadata: true,
        ...(pixels > 2_000_000 ? { resizeWidth: 1920, resizeHeight: 0 } : {}),
        reason: 'Large PNG → WebP (photo/screenshot, 70%+ savings)'
      }
    }
    // Medium PNGs — lossless oxipng is best for quality-preserving compression
    if (isLarge) {
      return {
        quality: 100, speed: 3, outputFormat: 'png',
        lossless: true, stripMetadata: true,
        reason: 'PNG lossless (oxipng — pixel-perfect, 20-60% smaller)'
      }
    }
    // Small PNGs — likely logos/icons, lossless
    return {
      quality: 100, speed: 3, outputFormat: 'png',
      lossless: true, stripMetadata: true,
      reason: 'Small PNG — lossless oxipng optimization'
    }
  }

  // JPEG — convert to WebP for web
  if (type === 'image/jpeg') {
    if (isHuge) {
      return {
        quality: 70, speed: 5, outputFormat: 'webp',
        lossless: false, stripMetadata: true,
        ...(pixels > 2_000_000 ? { resizeWidth: 1920, resizeHeight: 0 } : {}),
        reason: 'Large JPEG → WebP 70% + resize (huge savings for web)'
      }
    }
    return {
      quality: 75, speed: 5, outputFormat: 'webp',
      lossless: false, stripMetadata: true,
      reason: 'JPEG → WebP 75% (25-35% smaller, same quality)'
    }
  }

  // WebP — optimize in-place
  if (type === 'image/webp') {
    return {
      quality: 80, speed: 5, outputFormat: 'webp',
      lossless: false, stripMetadata: true,
      reason: 'WebP re-compress at 80% (further optimize)'
    }
  }

  // Fallback
  return {
    quality: 75, speed: 5, outputFormat: 'webp',
    lossless: false, stripMetadata: true,
    reason: 'Smart default → WebP 75% (best web format)'
  }
}

/**
 * Analyze a batch and return aggregated recommendations.
 */
export function analyzeBatch(files: FileMeta[]): {
  globalQuality: number
  globalSpeed: number
  globalFormat: OutputFormat
  globalLossless: boolean
  perFile: SmartRecommendation[]
  summary: string
  summaryZh: string
} {
  const perFile = files.map(analyzeFile)

  // Aggregate: use the most common output format
  const formatCounts: Record<string, number> = {}
  perFile.forEach(r => {
    formatCounts[r.outputFormat] = (formatCounts[r.outputFormat] || 0) + 1
  })
  const globalFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0][0] as OutputFormat

  // Average quality, weighted toward lower (safer for batch)
  const avgQuality = Math.round(perFile.reduce((s, r) => s + r.quality, 0) / perFile.length)
  const avgSpeed = Math.round(perFile.reduce((s, r) => s + r.speed, 0) / perFile.length)
  const hasLossless = perFile.some(r => r.lossless)

  // Build summary
  const formatNames: Record<string, string> = {
    png: 'PNG', jpeg: 'JPEG', webp: 'WebP', original: 'Original', avif: 'AVIF'
  }
  const reasons = Array.from(new Set(perFile.map(r => r.reason)))
  const summary = reasons.join('. ')
  const summaryZh = reasons.map(r => {
    // Quick CN translation for display
    if (r.includes('SVG')) return 'SVG矢量图无需压缩'
    if (r.includes('BMP')) return 'BMP转PNG无损压缩'
    if (r.includes('HEIC')) return 'HEIC转WebP网页格式'
    if (r.includes('GIF')) return 'GIF转WebP动态图(减小60-80%)'
    if (r.includes('AVIF')) return 'AVIF已优化,轻度重压缩'
    if (r.includes('Large PNG')) return '大PNG转WebP(可减70%+)'
    if (r.includes('PNG lossless')) return 'PNG无损oxipng优化'
    if (r.includes('Small PNG')) return '小PNG无损优化'
    if (r.includes('Large JPEG')) return '大JPEG转WebP+调整尺寸'
    if (r.includes('JPEG')) return 'JPEG转WebP(减小25-35%)'
    if (r.includes('WebP')) return 'WebP再次优化'
    return '智能默认WebP 75%'
  }).join(' · ')

  return {
    globalQuality: avgQuality,
    globalSpeed: avgSpeed,
    globalFormat,
    globalLossless: hasLossless,
    perFile,
    summary,
    summaryZh,
  }
}
