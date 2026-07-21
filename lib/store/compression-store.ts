import { create } from 'zustand'
import type { ImageFile, CompressionOptions, SavedPreset, NamingOptions, WatermarkOptions, MonthlyQuota } from '@/lib/compression/types'
import { DEFAULT_OPTIONS, getLimits, getMonthlyQuota, PRESETS_STORAGE_KEY, DEFAULT_NAMING, NAMING_STORAGE_KEY, DEFAULT_WATERMARK, WATERMARK_STORAGE_KEY, MONTHLY_FREE_QUOTA, QUOTA_STORAGE_KEY } from '@/lib/compression/types'

const IS_CN = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'cn'
import { generateId, getCompressionRatio } from '@/lib/compression/utils'

/** SSR-safe localStorage reader */
function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw) return { ...fallback, ...JSON.parse(raw) }
  } catch {}
  return fallback
}

let worker: Worker | null = null
let _compressAllCleanup: (() => void) | null = null
const _compressOneCleanups = new Map<string, () => void>()

/** Decode HEIC on main thread (heic2any uses window, not available in Worker) */
async function decodeHEICOnMain(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const heic2any = (await import('heic2any')).default
  const blob = new Blob([buffer], { type: 'image/heic' })
  const result = await heic2any({ blob, toType: 'image/png' })
  const pngBlob = Array.isArray(result) ? result[0] : result
  return pngBlob.arrayBuffer()
}

function isHEIC(t: string) { return t === 'image/heic' || t === 'image/heif' || t === 'image/heic-sequence' }

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../compression/worker.ts', import.meta.url),
    )
  }
  return worker
}

/** Increment monthly quota counter (called after each successful compression) */
function incrementQuota(n: number = 1) {
  if (typeof window === 'undefined') return
  try {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const q = getMonthlyQuota()
    const updated: MonthlyQuota = {
      count: q.month === currentMonth ? q.count + n : n,
      month: currentMonth,
    }
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(updated))
  } catch {}
}

interface CompressionState {
  files: ImageFile[]
  options: CompressionOptions
  isCompressing: boolean
  isPro: boolean
  proLoading: boolean
  presets: SavedPreset[]
  naming: NamingOptions
  watermark: WatermarkOptions
  monthlyUsed: number
  monthlyQuota: number
  serverQuotaExceeded: boolean

  checkProStatus: () => Promise<void>
  syncServerQuota: () => Promise<void>
  addFiles: (newFiles: File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  reorderFiles: (fromIndex: number, toIndex: number) => void
  setOptions: (options: Partial<CompressionOptions>) => void
  compressAll: () => Promise<void>
  compressOne: (id: string) => Promise<void>
  loadPresets: () => void
  savePreset: (name: string) => boolean
  deletePreset: (id: string) => void
  applyPreset: (id: string) => void
  setNaming: (opts: Partial<NamingOptions>) => void
  setWatermark: (opts: Partial<WatermarkOptions>) => void
  rotateImage: (id: string, direction: 'cw' | 'ccw') => void
  flipImage: (id: string, direction: 'h' | 'v') => void
  resetTransform: (id: string) => void

  totalOriginalSize: () => number
  totalCompressedSize: () => number
  overallRatio: () => number
  allDone: () => boolean
}

export const useCompressionStore = create<CompressionState>((set, get) => ({
  files: [],
  options: { ...DEFAULT_OPTIONS },
  isCompressing: false,
  isPro: false,
  proLoading: true,
  presets: [],
  naming: readStored(NAMING_STORAGE_KEY, DEFAULT_NAMING),
  watermark: readStored(WATERMARK_STORAGE_KEY, DEFAULT_WATERMARK),
  monthlyUsed: typeof window !== 'undefined' ? getMonthlyQuota().count : 0,
  monthlyQuota: MONTHLY_FREE_QUOTA,
  serverQuotaExceeded: false,

  checkProStatus: async () => {
    // 国内版：无 Pro，直接返回免费
    if (IS_CN) { set({ isPro: false, proLoading: false }); return }
    try {
      const code = localStorage.getItem('pro_license')
      if (!code) { set({ proLoading: false, isPro: false }); return }

      // 先乐观信任 localStorage（避免 Pro 状态闪烁）
      set({ isPro: true })

      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()

      if (data.valid) {
        set({ isPro: true, proLoading: false })
      } else if (data.reason === 'revoked') {
        // 只有明确被撤销才清本地（欺诈/退款）
        localStorage.removeItem('pro_license')
        set({ isPro: false, proLoading: false })
      } else if (data.reason === 'device_limit') {
        // 设备满了不清除，保留本地状态但显示免费
        set({ isPro: false, proLoading: false })
      } else {
        // not_found / server_error 等情况
        // 可能是 Redis 故障，不清除本地，先当免费版用
        set({ isPro: false, proLoading: false })
      }
    } catch {
      // 网络错误，信任 localStorage
      const code = localStorage.getItem('pro_license')
      set({ isPro: !!code, proLoading: false })
    }
  },

  /** Check server-side quota (IP-based, Redis). Call before compression. */
  syncServerQuota: async () => {
    const { isPro } = get()
    if (isPro || IS_CN) return
    try {
      const res = await fetch('/api/quota')
      const data = await res.json()
      if (!data.allowed) {
        set({ serverQuotaExceeded: true, monthlyUsed: data.used ?? MONTHLY_FREE_QUOTA })
      } else {
        set({ serverQuotaExceeded: false, monthlyUsed: data.used ?? get().monthlyUsed })
      }
    } catch {
      // Fail open — don't block on network error
    }
  },

  addFiles: (newFiles: File[]) => {
    const { files, isPro } = get()
    const limits = getLimits(isPro)
    const remaining = limits.maxFiles - files.length
    if (remaining <= 0) return

    // Monthly quota check for free users
    let allowFiles = newFiles
    if (!isPro && !IS_CN) {
      const q = getMonthlyQuota()
      const usedThisMonth = q.count
      // Use the higher of localStorage vs server-synced value for display
      if (usedThisMonth > get().monthlyUsed) {
        set({ monthlyUsed: usedThisMonth })
      }
      if (usedThisMonth >= MONTHLY_FREE_QUOTA) {
        // Quota exceeded — let the UI handle the prompt
        return
      }
      // Limit how many can be added within quota
      const quotaRemaining = MONTHLY_FREE_QUOTA - usedThisMonth
      allowFiles = newFiles.slice(0, Math.min(remaining, quotaRemaining))
    }

    const toAdd = allowFiles.slice(0, remaining).filter(f => {
      if (!f.type.startsWith('image/')) return false
      if (f.size > limits.maxSizePerFile) return false
      return true
    })

    const imageFiles: ImageFile[] = toAdd.map((file) => ({
      id: generateId(),
      file,
      originalSize: file.size,
      compressedSize: null,
      compressedBlob: null,
      status: 'pending',
      previewUrl: URL.createObjectURL(file),
      width: 0,
      height: 0,
      rotation: 0,
      flipH: false,
      flipV: false,
    }))

    set({ files: [...files, ...imageFiles] })

    // 异步读取图片尺寸（不阻塞 UI）
    toAdd.forEach((file, i) => {
      const id = imageFiles[i].id
      createImageBitmap(file).then(bitmap => {
        set({
          files: get().files.map(f =>
            f.id === id ? { ...f, width: bitmap.width, height: bitmap.height } : f
          ),
        })
        bitmap.close()
      }).catch(() => {
        // 读取失败（如 SVG），保持 0x0
      })
    })
  },

  removeFile: (id: string) => {
    const { files } = get()
    const file = files.find(f => f.id === id)
    if (file) URL.revokeObjectURL(file.previewUrl)
    const cleanup = _compressOneCleanups.get(id)
    if (cleanup) {
      cleanup()
      _compressOneCleanups.delete(id)
    }
    set({ files: files.filter(f => f.id !== id) })
  },

  clearFiles: () => {
    const { files } = get()
    files.forEach(f => URL.revokeObjectURL(f.previewUrl))
    _compressOneCleanups.forEach(cleanup => cleanup())
    _compressOneCleanups.clear()
    set({ files: [] })
  },

  reorderFiles: (fromIndex: number, toIndex: number) => {
    const { files } = get()
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= files.length || toIndex >= files.length) return
    const updated = [...files]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    set({ files: updated })
  },

  setOptions: (newOptions) => {
    set({ options: { ...get().options, ...newOptions } })
  },

  compressAll: async () => {
    const { files, options, watermark, isPro, serverQuotaExceeded } = get()
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    // Server-side quota check before compression (non-pro, non-CN)
    if (!isPro && !IS_CN) {
      await get().syncServerQuota()
      if (get().serverQuotaExceeded) return
    }

    // AVIF 仅 Pro 可用，非 Pro 回退到原格式
    const effectiveFormat = !isPro && options.outputFormat === 'avif' ? 'original' : options.outputFormat

    set({ isCompressing: true })
    const w = getWorker()

    if (_compressAllCleanup) {
      _compressAllCleanup()
      _compressAllCleanup = null
    }

    const handleMessage = (e: MessageEvent) => {
      const { id, type, compressedBuffer, compressedSize, outputMime, error, step, triedQuality, currentKB, targetKB } = e.data

      if (type === 'progress' && triedQuality !== undefined) {
        set({
          files: get().files.map(f =>
            f.id === id
              ? { ...f, targetProgress: { step, quality: triedQuality, currentKB, targetKB } }
              : f
          ),
        })
        return
      }

      if (type === 'progress') return

      if (type === 'done') {
        const blobMime = outputMime || get().files.find(f => f.id === id)?.file.type || 'image/png'
        const compressedBlob = new Blob([compressedBuffer], { type: blobMime })
        const qualityTier = e.data.qualityTier as string | undefined
        const metadataStripped = e.data.metadataStripped as boolean | undefined
        set({
          files: get().files.map(f =>
            f.id === id
              ? { ...f, status: 'done' as const, compressedSize, compressedBlob,
                  qualityTier: qualityTier as ImageFile['qualityTier'],
                  metadataStripped,
                  // rotation/flip baked into compressed blob, reset state
                  rotation: 0, flipH: false, flipV: false }
              : f
          ),
        })
        checkDone()
      }

      if (type === 'error') {
        set({
          files: get().files.map(f =>
            f.id === id
              ? { ...f, status: 'error' as const, error }
              : f
          ),
        })
        checkDone()
      }
    }

    const pendingCount = pendingFiles.length

    const checkDone = () => {
      const allFiles = get().files
      const stillRunning = allFiles.some(f => f.status === 'pending' || f.status === 'compressing')
      if (stillRunning) return

      if (_compressAllCleanup) {
        _compressAllCleanup()
        _compressAllCleanup = null
      }

      // 统计压缩次数（只计本轮新压缩的，避免重复计数）
      if (pendingCount > 0) {
        // Collect file sizes for analytics
        const compressedSizes = pendingFiles.map(f => f.originalSize)
        fetch('/api/admin/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'compression', count: pendingCount, host: window.location.hostname, sizes: compressedSizes }),
        }).catch(() => {})
        // 免费用户更新月度配额
        if (!get().isPro && !IS_CN) {
          incrementQuota(pendingCount)
          set({ monthlyUsed: getMonthlyQuota().count })
          // Also increment server-side (fire-and-forget)
          fetch('/api/quota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: pendingCount }),
          }).catch(() => {})
        }
      }

      set({ isCompressing: false })
    }

    w.addEventListener('message', handleMessage)
    _compressAllCleanup = () => w.removeEventListener('message', handleMessage)

    pendingFiles.forEach((file) => {
      set({
        files: get().files.map(f =>
          f.id === file.id ? { ...f, status: 'compressing' as const } : f
        ),
      })

      file.file.arrayBuffer().then(async (buffer) => {
        // HEIC → PNG on main thread (heic2any needs window, not in Worker)
        let fileBuffer = buffer
        let fileType = file.file.type
        if (isHEIC(fileType)) {
          try {
            fileBuffer = await decodeHEICOnMain(buffer)
            fileType = 'image/png'
          } catch {
            set({
              files: get().files.map(f =>
                f.id === file.id ? { ...f, status: 'error' as const, error: 'HEIC解码失败' } : f
              ),
            })
            checkDone()
            return
          }
        }

        w.postMessage({
          id: file.id,
          fileBuffer,
          fileName: file.file.name,
          fileType,
          quality: options.quality,
          speed: options.speed,
          lossless: options.lossless,
          outputFormat: effectiveFormat,
          targetKB: options.targetKB || 0,
          resizeWidth: options.resizeWidth || 0,
          resizeHeight: options.resizeHeight || 0,
          stripMetadata: options.stripMetadata,
          rotation: file.rotation,
          flipH: file.flipH,
          flipV: file.flipV,
          watermark: watermark.enabled ? {
            enabled: watermark.enabled,
            type: watermark.type,
            text: watermark.text,
            fontSize: watermark.fontSize,
            fontColor: watermark.fontColor,
            fontOpacity: watermark.fontOpacity,
            rotation: watermark.rotation,
            imageDataUrl: watermark.imageDataUrl,
            imageOpacity: watermark.imageOpacity,
            imageScale: watermark.imageScale,
            position: watermark.position,
            marginX: watermark.marginX,
            marginY: watermark.marginY,
          } : undefined,
        })
      }).catch(() => {
        set({
          files: get().files.map(f =>
            f.id === file.id ? { ...f, status: 'error' as const, error: '读取文件失败' } : f
          ),
        })
        checkDone()
      })
    })
  },

  compressOne: async (id: string) => {
    const { options, isPro } = get()
    const file = get().files.find(f => f.id === id)
    if (!file) return

    // Server-side quota check before compression
    if (!isPro && !IS_CN) {
      await get().syncServerQuota()
      if (get().serverQuotaExceeded) return
    }

    // AVIF 仅 Pro 可用
    const effectiveFormat = !isPro && options.outputFormat === 'avif' ? 'original' : options.outputFormat

    const prev = _compressOneCleanups.get(id)
    if (prev) {
      prev()
      _compressOneCleanups.delete(id)
    }

    set({
      files: get().files.map(f =>
        f.id === id ? { ...f, status: 'compressing' as const } : f
      ),
    })

    const w = getWorker()

    const handler = (e: MessageEvent) => {
      const { id: msgId, type, compressedBuffer, compressedSize, outputMime, error } = e.data
      if (msgId !== id) return

      if (type === 'done') {
        const blobMime = outputMime || file.file.type
        const compressedBlob = new Blob([compressedBuffer], { type: blobMime })
        const qualityTier = e.data.qualityTier as string | undefined
        const metadataStripped = e.data.metadataStripped as boolean | undefined
        set({
          files: get().files.map(f =>
            f.id === id
              ? { ...f, status: 'done' as const, compressedSize, compressedBlob,
                  qualityTier: qualityTier as ImageFile['qualityTier'],
                  metadataStripped,
                  // rotation/flip baked into compressed blob, reset state
                  rotation: 0, flipH: false, flipV: false }
              : f
          ),
        })
        // 统计压缩次数（单文件）
        fetch('/api/admin/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'compression', count: 1, host: window.location.hostname, sizes: [file.file.size] }),
        }).catch(() => {})
        // 免费用户更新月度配额
        if (!get().isPro && !IS_CN) {
          incrementQuota(1)
          set({ monthlyUsed: getMonthlyQuota().count })
          // Also increment server-side
          fetch('/api/quota', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 1 }),
          }).catch(() => {})
        }
      }

      if (type === 'error') {
        set({
          files: get().files.map(f =>
            f.id === id
              ? { ...f, status: 'error' as const, error }
              : f
          ),
        })
      }

      w.removeEventListener('message', handler)
      _compressOneCleanups.delete(id)
    }

    w.addEventListener('message', handler)

    const cleanup = () => {
      w.removeEventListener('message', handler)
      _compressOneCleanups.delete(id)
    }
    _compressOneCleanups.set(id, cleanup)

    file.file.arrayBuffer().then(async (buffer) => {
        let fileBuffer = buffer
        let fileType = file.file.type
        if (isHEIC(fileType)) {
          try {
            fileBuffer = await decodeHEICOnMain(buffer)
            fileType = 'image/png'
          } catch {
            set({
              files: get().files.map(f =>
                f.id === id ? { ...f, status: 'error' as const, error: 'HEIC解码失败' } : f
              ),
            })
            w.removeEventListener('message', handler)
            _compressOneCleanups.delete(id)
            return
          }
        }

          w.postMessage({
        id: file.id,
        fileBuffer,
        fileName: file.file.name,
        fileType,
        quality: options.quality,
        speed: options.speed,
        lossless: options.lossless,
        outputFormat: effectiveFormat,
        targetKB: options.targetKB || 0,
        resizeWidth: options.resizeWidth || 0,
        resizeHeight: options.resizeHeight || 0,
        stripMetadata: options.stripMetadata,
        rotation: file.rotation,
        flipH: file.flipH,
        flipV: file.flipV,
        watermark: get().watermark.enabled ? {
          enabled: get().watermark.enabled,
          type: get().watermark.type,
          text: get().watermark.text,
          fontSize: get().watermark.fontSize,
          fontColor: get().watermark.fontColor,
          fontOpacity: get().watermark.fontOpacity,
          rotation: get().watermark.rotation,
          imageDataUrl: get().watermark.imageDataUrl,
          imageOpacity: get().watermark.imageOpacity,
          imageScale: get().watermark.imageScale,
          position: get().watermark.position,
          marginX: get().watermark.marginX,
          marginY: get().watermark.marginY,
        } : undefined,
      })
    }).catch(() => {
      set({
        files: get().files.map(f =>
          f.id === id ? { ...f, status: 'error' as const, error: '读取文件失败' } : f
        ),
      })
      w.removeEventListener('message', handler)
      _compressOneCleanups.delete(id)
    })
  },

  loadPresets: () => {
    try {
      const raw = localStorage.getItem(PRESETS_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          set({ presets: parsed as SavedPreset[] })
        }
      }
    } catch { /* localStorage 不可用 */ }
  },

  savePreset: (name: string) => {
    // 国内版：不支持自定义预设
    if (IS_CN) return false
    const { options, presets } = get()
    if (presets.some(p => p.name === name.trim())) return false
    if (presets.length >= 10) return false

    const preset: SavedPreset = {
      id: generateId(),
      name: name.trim(),
      options: { ...options },
      createdAt: Date.now(),
    }
    const updated = [...presets, preset]
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
      set({ presets: updated })
      return true
    } catch {
      return false
    }
  },

  deletePreset: (id: string) => {
    const updated = get().presets.filter(p => p.id !== id)
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(updated))
    } catch {}
    set({ presets: updated })
  },

  applyPreset: (id: string) => {
    const preset = get().presets.find(p => p.id === id)
    if (preset) {
      set({ options: { ...preset.options } })
    }
  },

  setNaming: (opts: Partial<NamingOptions>) => {
    const updated = { ...get().naming, ...opts }
    set({ naming: updated })
    try { localStorage.setItem(NAMING_STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  setWatermark: (opts: Partial<WatermarkOptions>) => {
    const updated = { ...get().watermark, ...opts }
    set({ watermark: updated })
    try { localStorage.setItem(WATERMARK_STORAGE_KEY, JSON.stringify(updated)) } catch {}
  },

  rotateImage: (id: string, direction: 'cw' | 'ccw') => {
    const file = get().files.find(f => f.id === id)
    if (!file) return

    const delta = direction === 'cw' ? 90 : -90
    const newRotation = (((file.rotation + delta) % 360) + 360) % 360 as ImageFile['rotation']

    // For done images: reset to pending so rotation is baked correctly on next compress
    set({
      files: get().files.map(f =>
        f.id === id
          ? (f.status === 'done'
              ? { ...f, rotation: newRotation, status: 'pending' as const, compressedSize: null, compressedBlob: null }
              : { ...f, rotation: newRotation })
          : f
      ),
    })
  },

  flipImage: (id: string, direction: 'h' | 'v') => {
    const file = get().files.find(f => f.id === id)
    if (!file) return

    const newFlipH = direction === 'h' ? !file.flipH : file.flipH
    const newFlipV = direction === 'v' ? !file.flipV : file.flipV

    // For done images: reset to pending so flip is baked correctly on next compress
    set({
      files: get().files.map(f =>
        f.id === id
          ? (f.status === 'done'
              ? { ...f, flipH: newFlipH, flipV: newFlipV, status: 'pending' as const, compressedSize: null, compressedBlob: null }
              : { ...f, flipH: newFlipH, flipV: newFlipV })
          : f
      ),
    })
  },

  resetTransform: (id: string) => {
    const file = get().files.find(f => f.id === id)
    if (!file) return
    if (file.rotation === 0 && !file.flipH && !file.flipV) return

    // Reset transforms; for done images, re-compress from original to bake 0° rotation
    if (file.status === 'done') {
      set({
        files: get().files.map(f =>
          f.id === id ? { ...f, rotation: 0, flipH: false, flipV: false, status: 'pending' as const, compressedSize: null, compressedBlob: null } : f
        ),
      })
    } else {
      set({
        files: get().files.map(f =>
          f.id === id ? { ...f, rotation: 0, flipH: false, flipV: false } : f
        ),
      })
    }
  },

  totalOriginalSize: () => {
    return get().files.reduce((sum, f) => sum + f.originalSize, 0)
  },

  totalCompressedSize: () => {
    return get().files.reduce((sum, f) => sum + (f.compressedSize || 0), 0)
  },

  overallRatio: () => {
    const original = get().totalOriginalSize()
    const compressed = get().totalCompressedSize()
    return getCompressionRatio(original, compressed)
  },

  allDone: () => {
    const { files } = get()
    if (files.length === 0) return false
    return files.every(f => f.status === 'done' || f.status === 'error')
  },
}))

// 多标签页同步：Tab1 激活 Pro → Tab2 自动感知
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'pro_license') {
      useCompressionStore.getState().checkProStatus()
    }
  })
}
