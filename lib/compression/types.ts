export interface ImageFile {
  id: string
  file: File
  originalSize: number
  compressedSize: number | null
  compressedBlob: Blob | null
  status: 'pending' | 'compressing' | 'done' | 'error'
  error?: string
  previewUrl: string
  /** 图片原始尺寸 */
  width: number
  height: number
  /** 目标 KB 模式的进度信息 */
  targetProgress?: { step: number; quality: number; currentKB: number; targetKB: number }
  /** 压缩质量评级 */
  qualityTier?: QualityTier
  /** EXIF 元数据是否已清除 */
  metadataStripped?: boolean
  /** 旋转角度（顺时针） */
  rotation: 0 | 90 | 180 | 270
  /** 水平翻转 */
  flipH: boolean
  /** 垂直翻转 */
  flipV: boolean
}

export interface CompressionOptions {
  quality: number
  speed: number
  lossless: boolean
  outputFormat: 'png' | 'jpeg' | 'webp' | 'avif' | 'original'
  /** 目标文件大小（KB），0 或 undefined = 画质模式 */
  targetKB?: number
  /** 调整尺寸：目标宽度（px），0 = 不调整 */
  resizeWidth: number
  /** 调整尺寸：目标高度（px），0 = 不调整。如果只设一边，另一边自动等比计算 */
  resizeHeight: number
  /** 清除照片元数据（EXIF/GPS/相机信息），默认开启 */
  stripMetadata: boolean
}

export const DEFAULT_OPTIONS: CompressionOptions = {
  quality: 50,
  speed: 8,
  lossless: false,
  outputFormat: 'original',
  targetKB: 0,
  resizeWidth: 0,
  resizeHeight: 0,
  stripMetadata: true,
}

export interface Limits {
  maxFiles: number
  maxSizePerFile: number
}

export const FREE_LIMITS: Limits = {
  maxFiles: 30,
  maxSizePerFile: 25 * 1024 * 1024, // 25MB
}

export const PRO_LIMITS: Limits = {
  maxFiles: 500,
  maxSizePerFile: 50 * 1024 * 1024, // 50MB
}

/** 根据 Pro 状态返回对应限制 */
export function getLimits(isPro: boolean): Limits {
  return isPro ? PRO_LIMITS : FREE_LIMITS
}

/** 用户保存的自定义预设 */
export interface SavedPreset {
  id: string
  name: string
  options: CompressionOptions
  createdAt: number
}

/** 压缩质量评级 */
export type QualityTier = 'excellent' | 'good' | 'ok' | 'overcompressed'

/** 根据压缩率计算质量评级 */
export function getQualityTier(originalSize: number, compressedSize: number): QualityTier {
  if (originalSize === 0 || compressedSize === 0) return 'ok'
  const ratio = (originalSize - compressedSize) / originalSize
  if (ratio <= 0) return 'overcompressed'
  if (ratio < 0.15) return 'excellent'    // <15% 压缩 → 高质量
  if (ratio < 0.45) return 'good'         // 15-45% → 良好
  if (ratio < 0.75) return 'ok'           // 45-75% → 可接受
  return 'overcompressed'                  // >75% → 过度压缩
}

export const QUALITY_TIER_COLORS: Record<QualityTier, string> = {
  excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ok: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  overcompressed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const PRESETS_STORAGE_KEY = 'png-compressor-presets'

/** Pro 用户解锁的特性标记 */
export const PRO_FEATURES = {
  customPresets: true,
  adFree: true,
  prioritySupport: true,
  maxDevices: 5,
  lifetimeUpdates: true,
}
