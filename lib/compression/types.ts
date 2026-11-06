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

/** 海外免费用户 */
export const FREE_LIMITS: Limits = {
  maxFiles: 20,
  maxSizePerFile: 10 * 1024 * 1024, // 10MB
}

/** 国内版免费额度（15 张/次 · 10MB/张） */
export const CN_LIMITS: Limits = {
  maxFiles: 15,
  maxSizePerFile: 10 * 1024 * 1024, // 10MB
}

/** 免费用户每月总压缩张数（海外） */
export const MONTHLY_FREE_QUOTA = 400

/** 免费用户每月总压缩张数（国内） */
export const CN_MONTHLY_FREE_QUOTA = 100

/** 按部署区域返回免费月配额（国内 100 / 海外 400） */
export function getMonthlyFreeQuota(): number {
  return isCnDeploy() ? CN_MONTHLY_FREE_QUOTA : MONTHLY_FREE_QUOTA
}

export const QUOTA_STORAGE_KEY = 'png-compressor-monthly-quota'

export interface MonthlyQuota {
  count: number      // 本月已压缩张数
  month: string      // YYYY-MM
}

/** Read monthly quota from localStorage */
export function getMonthlyQuota(): MonthlyQuota {
  if (typeof window === 'undefined') return { count: 0, month: '' }
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY)
    if (raw) {
      const q = JSON.parse(raw) as MonthlyQuota
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      if (q.month === currentMonth) return q
    }
  } catch {}
  return { count: 0, month: '' }
}

export const PRO_LIMITS: Limits = {
  maxFiles: 500,
  maxSizePerFile: 50 * 1024 * 1024, // 50MB
}

import { isCnDeploy } from '@/lib/utils'

const IS_CN = isCnDeploy()

/** 根据 Pro 状态返回对应限制 */
export function getLimits(isPro: boolean): Limits {
  if (isPro) return PRO_LIMITS
  if (IS_CN) return CN_LIMITS
  return FREE_LIMITS
}

/** 用户保存的自定义预设 */
export interface SavedPreset {
  id: string
  name: string
  options: CompressionOptions
  createdAt: number
}

/** 压缩强度评级（按节省率，省得越多画质越可能受损） */
export type QualityTier = 'minimal' | 'light' | 'balanced' | 'aggressive'

/** 根据压缩率计算压缩强度 */
export function getQualityTier(originalSize: number, compressedSize: number): QualityTier {
  if (originalSize === 0 || compressedSize === 0) return 'minimal'
  const ratio = (originalSize - compressedSize) / originalSize
  if (ratio <= 0) return 'minimal'      // 没变小或变大
  if (ratio < 0.15) return 'minimal'    // <15% 几乎没压
  if (ratio < 0.45) return 'light'      // 15-45% 轻度
  if (ratio < 0.75) return 'balanced'   // 45-75% 均衡（推荐）
  return 'aggressive'                    // >75% 激进，画质可能受损
}

export const QUALITY_TIER_COLORS: Record<QualityTier, string> = {
  minimal: 'bg-gray-800/40 text-gray-400',
  light: 'bg-blue-900/30 text-blue-400',
  balanced: 'bg-green-900/30 text-green-400',
  aggressive: 'bg-amber-900/30 text-amber-400',
}

export interface NamingOptions {
  pattern: 'original_compressed' | 'original_min' | 'compressed_original' | 'custom'
  customTemplate: string // 支持 {original} {n} {date} {ext} 占位符
  numberStart: number
  numberPadding: number // 0 = 不补零，2 = 01, 3 = 001
  /** 使用编号前缀还是后缀 */
  numberPosition: 'prefix' | 'suffix'
}

export const DEFAULT_NAMING: NamingOptions = {
  pattern: 'original_compressed',
  customTemplate: '{original}_min',
  numberStart: 1,
  numberPadding: 0,
  numberPosition: 'suffix',
}

export const NAMING_STORAGE_KEY = 'png-compressor-naming'

/** 水印位置：9 宫格 + 居中 */
export type WatermarkPosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br'

export type WatermarkType = 'text' | 'image' | 'none'

export interface WatermarkOptions {
  enabled: boolean
  type: WatermarkType
  /** 文字水印 */
  text: string
  fontSize: number        // px
  fontColor: string       // hex like #ffffff
  fontOpacity: number     // 0-1
  rotation: number        // degrees
  /** 图片水印 */
  imageDataUrl: string | null  // data: URL of watermark image
  imageOpacity: number    // 0-1
  imageScale: number      // 0.1-2.0, percentage of original image width
  /** 通用 */
  position: WatermarkPosition
  /** 边距（px） */
  marginX: number
  marginY: number
}

export const DEFAULT_WATERMARK: WatermarkOptions = {
  enabled: false,
  type: 'text',
  text: '',
  fontSize: 24,
  fontColor: '#ffffff',
  fontOpacity: 0.5,
  rotation: -30,
  imageDataUrl: null,
  imageOpacity: 0.5,
  imageScale: 0.3,
  position: 'br',
  marginX: 20,
  marginY: 20,
}

export const WATERMARK_STORAGE_KEY = 'png-compressor-watermark'

export const PRESETS_STORAGE_KEY = 'png-compressor-presets'

/** Pro 用户解锁的特性标记 */
export const PRO_FEATURES = {
  customPresets: true,
  adFree: true,
  prioritySupport: true,
  maxDevices: 5,
  lifetimeUpdates: true,
  avifExport: true,
}
