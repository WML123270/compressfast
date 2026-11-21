import { create } from 'zustand'
import type { ImageFile, CompressionOptions, SavedPreset, NamingOptions, WatermarkOptions, MonthlyQuota } from '@/lib/compression/types'
import { DEFAULT_OPTIONS, getLimits, getMonthlyQuota, getMonthlyFreeQuota, PRESETS_STORAGE_KEY, DEFAULT_NAMING, NAMING_STORAGE_KEY, DEFAULT_WATERMARK, WATERMARK_STORAGE_KEY, MONTHLY_FREE_QUOTA, QUOTA_STORAGE_KEY } from '@/lib/compression/types'
import { isCnDeploy } from '@/lib/utils'
import { getDeviceFingerprint } from '@/lib/device-fingerprint'

const IS_CN = isCnDeploy()
import { generateId, getCompressionRatio } from '@/lib/compression/utils'

/** SSR-safe localStorage reader — validates stored value is a plain object before merging */
function readStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Only merge if parsed value is a plain object (not array, null, or primitive)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return { ...fallback, ...parsed } as T
      }
    }
  } catch {}
  return fallback
}

const MAX_WORKERS = Math.min(
  typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4,
  4,
)
const _workers: Worker[] = []
let _workerRR = 0
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

function isSVG(t: string) { return t === 'image/svg+xml' }

function isGIF(t: string) { return t === 'image/gif' }

/**
 * 动画 GIF 优化（保留动画）。
 * 浏览器的 canvas 只能编码 PNG/JPEG/WebP，无法编码 GIF；之前 GIF 会走静态管线，
 * 输出其实是 PNG 却命名 .gif，动画也丢了。这里用 gifsicle WASM 真正压缩动画 GIF。
 * 返回优化后的 GIF 字节；如果结果反而更大且没有任何变换，返回原文件。
 */
async function optimizeGifOnMain(
  buffer: ArrayBuffer,
  opts: {
    quality: number
    speed: number
    lossless: boolean
    resizeWidth: number
    resizeHeight: number
    rotation: number
    flipH: boolean
    flipV: boolean
    targetKB: number
  },
): Promise<ArrayBuffer> {
  const gifsicle = (await import('gifsicle-wasm-browser')).default

  const transforms: string[] = []
  if (opts.rotation === 90) transforms.push('--rotate-90')
  else if (opts.rotation === 180) transforms.push('--rotate-180')
  else if (opts.rotation === 270) transforms.push('--rotate-270')
  if (opts.flipH) transforms.push('--flip-horizontal')
  if (opts.flipV) transforms.push('--flip-vertical')

  const resize: string[] = []
  if (opts.resizeWidth > 0 || opts.resizeHeight > 0) {
    const w = opts.resizeWidth > 0 ? String(opts.resizeWidth) : '_'
    const h = opts.resizeHeight > 0 ? String(opts.resizeHeight) : '_'
    resize.push('--resize-fit', `${w}x${h}`)
  }

  // 目标大小模式：逐档加大 lossy 并同步减色，尽量贴近目标；
  // 普通模式按画质滑块换算一次
  const defaultColors = opts.lossless || opts.quality >= 85
    ? 0
    : opts.quality >= 60 ? 128 : opts.quality >= 30 ? 64 : 32
  const attempts = opts.targetKB > 0
    ? [
        { lossy: 60, colors: 128 },
        { lossy: 120, colors: 64 },
        { lossy: 200, colors: 32 },
      ]
    : [{ lossy: opts.lossless ? 0 : Math.round((100 - opts.quality) * 1.2), colors: defaultColors }]

  let best: ArrayBuffer | null = null
  for (const { lossy, colors } of attempts) {
    const args: string[] = []
    args.push(opts.speed >= 8 || buffer.byteLength > 10 * 1024 * 1024 ? '-O1' : '-O2')
    if (lossy > 0) args.push(`--lossy=${Math.min(200, Math.max(1, Math.round(lossy)))}`)
    if (colors > 0) args.push('--colors', String(colors))
    args.push(...resize, ...transforms, 'input.gif', '-o', '/out/out.gif')

    const files = await gifsicle.run({
      // 用 Blob 而不是 ArrayBuffer：避免库内部 transfer 掉原 buffer，影响兜底/多次尝试
      input: [{ file: new Blob([buffer], { type: 'image/gif' }), name: 'input.gif' }],
      command: [args.join(' ')],
      isStrict: true,
    })
    const file = files && files[0]
    if (!file) throw new Error('GIF 压缩失败')
    const out = await file.arrayBuffer()
    if (!best || out.byteLength < best.byteLength) best = out
    if (opts.targetKB <= 0) break
    if (out.byteLength <= opts.targetKB * 1024) break
  }

  if (!best) throw new Error('GIF 压缩失败')
  const changed = resize.length > 0 || transforms.length > 0
  if (!changed && best.byteLength >= buffer.byteLength) return buffer
  return best
}

/**
 * 把 SVG 光栅化为 PNG（主线程用 Image + canvas）。
 * 仅当工具要求输出位图时使用（如「SVG 转 PNG」）；「压缩 SVG」保持矢量原样。
 * 放在主线程是因为 Safari 的 Worker createImageBitmap 对 SVG 支持不稳定。
 */
async function rasterizeSVGOnMain(buffer: ArrayBuffer): Promise<ArrayBuffer> {
  const url = URL.createObjectURL(new Blob([buffer], { type: 'image/svg+xml' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('SVG 解码失败'))
      img.src = url
    })

    // 没有 width/height 的 SVG，浏览器可能给出 0，用 viewBox 尺寸兜底
    let w = img.naturalWidth
    let h = img.naturalHeight
    if (!w || !h) {
      const text = new TextDecoder().decode(buffer)
      const vb = text.match(/viewBox\s*=\s*["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i)
      w = vb ? Math.round(Number(vb[1])) : 300
      h = vb ? Math.round(Number(vb[2])) : 150
    }

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 创建失败')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('SVG 转 PNG 失败'))), 'image/png')
    })
    return blob.arrayBuffer()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Ensure Worker pool is initialized */
function ensureWorkers(): void {
  if (_workers.length > 0) return
  for (let i = 0; i < MAX_WORKERS; i++) {
    _workers.push(new Worker(new URL('../compression/worker.ts', import.meta.url)))
  }
}

/** Get the first Worker (for single-file compressOne) */
function getWorker(): Worker {
  ensureWorkers()
  return _workers[0]
}

/** Round-robin get next Worker (for batch compressAll distribution) */
function getNextWorker(): Worker {
  ensureWorkers()
  const w = _workers[_workerRR % _workers.length]
  _workerRR++
  return w
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

/** Shared tracking + quota update after compression completes (used by both compressAll and compressOne) */
function trackCompressionComplete(get: () => CompressionState, set: (s: Partial<CompressionState>) => void, count: number, sizes: number[]) {
  // visitorId 由 PageViewTracker 生成并写入 localStorage['cf_vid']（须与该 key 保持一致）
  let visitorId = ''
  try {
    visitorId = localStorage.getItem('cf_vid') || ''
  } catch {}
  // Fire analytics event
  fetch('/api/admin/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'compression', count, host: window.location.hostname, sizes, visitorId }),
  }).catch(() => {})
  // Free users: update local quota (all regions) + server quota (overseas only)
  if (!get().isPro) {
    incrementQuota(count)
    set({ monthlyUsed: getMonthlyQuota().count })
    if (!IS_CN) {
      fetch('/api/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      }).catch(() => {})
    }
  }
}

interface RemovedFileEntry {
  file: ImageFile
  index: number  // position where it was removed
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
  undoStack: RemovedFileEntry[]

  checkProStatus: () => Promise<void>
  syncServerQuota: () => Promise<void>
  addFiles: (newFiles: File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  undoRemove: () => void
  reorderFiles: (fromIndex: number, toIndex: number) => void
  setOptions: (options: Partial<CompressionOptions>) => void
  compressAll: () => Promise<void>
  compressOne: (id: string) => Promise<void>
  retryFailed: () => Promise<void>
  loadPresets: () => void
  savePreset: (name: string) => boolean
  deletePreset: (id: string) => void
  applyPreset: (id: string) => void
  setNaming: (opts: Partial<NamingOptions>) => void
  setWatermark: (opts: Partial<WatermarkOptions>) => void
  rotateImage: (id: string, direction: 'cw' | 'ccw') => void
  flipImage: (id: string, direction: 'h' | 'v') => void
  resetTransform: (id: string) => void
  cropImage: (id: string, croppedFile: File) => void
  adjustImage: (id: string, adjustedFile: File) => void

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
  monthlyQuota: getMonthlyFreeQuota(),
  serverQuotaExceeded: false,
  undoStack: [],

  checkProStatus: async () => {
    try {
      const code = localStorage.getItem('pro_license')
      if (!code) { set({ proLoading: false, isPro: false }); return }

      // 先乐观信任 localStorage（避免 Pro 状态闪烁）
      set({ isPro: true })

      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, fingerprint: getDeviceFingerprint() }),
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
        set({ serverQuotaExceeded: true, monthlyUsed: Math.max(0, data.used ?? MONTHLY_FREE_QUOTA) })
      } else {
        set({ serverQuotaExceeded: false, monthlyUsed: Math.max(0, data.used ?? get().monthlyUsed) })
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

    // Monthly quota check for free users (all regions; CN 用 localStorage 计)
    let allowFiles = newFiles
    if (!isPro) {
      const quota = getMonthlyFreeQuota()
      const q = getMonthlyQuota()
      const usedThisMonth = q.count
      // Use the higher of localStorage vs server-synced value for display
      if (usedThisMonth > get().monthlyUsed) {
        set({ monthlyUsed: usedThisMonth })
      }
      if (usedThisMonth >= quota) {
        // Quota exceeded — let the UI handle the prompt
        return
      }
      // Limit how many can be added within quota
      const quotaRemaining = quota - usedThisMonth
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
    const { files, undoStack } = get()
    const idx = files.findIndex(f => f.id === id)
    if (idx === -1) return
    const file = files[idx]
    // Don't revoke previewUrl — keep it alive for undo
    const cleanup = _compressOneCleanups.get(id)
    if (cleanup) {
      cleanup()
      _compressOneCleanups.delete(id)
    }
    // Push to undo stack (max 20 entries — keep it bounded)
    const entry: RemovedFileEntry = { file, index: idx }
    const fullStack = [...undoStack, entry]
    // Revoke previewUrl for entries that fall off the undo stack
    if (fullStack.length > 20) {
      fullStack.slice(0, fullStack.length - 20).forEach(e => URL.revokeObjectURL(e.file.previewUrl))
    }
    const newStack = fullStack.slice(-20)
    set({ files: files.filter(f => f.id !== id), undoStack: newStack })
  },

  undoRemove: () => {
    const { files, undoStack } = get()
    if (undoStack.length === 0) return
    const newStack = [...undoStack]
    const last = newStack.pop()!
    // Restore file at its original position (clamped to current files length)
    const insertIdx = Math.min(last.index, files.length)
    const updated = [...files]
    updated.splice(insertIdx, 0, last.file)
    set({ files: updated, undoStack: newStack })
  },

  clearFiles: () => {
    const { files } = get()
    files.forEach(f => URL.revokeObjectURL(f.previewUrl))
    _compressOneCleanups.forEach(cleanup => cleanup())
    _compressOneCleanups.clear()
    set({ files: [], undoStack: [] })
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

    // Init worker pool and reset round-robin
    ensureWorkers()
    _workerRR = 0

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

    // Register handler on all workers in the pool
    for (const w of _workers) {
      w.addEventListener('message', handleMessage)
    }

    const pendingCount = pendingFiles.length

    const checkDone = () => {
      const allFiles = get().files
      const stillRunning = allFiles.some(f => f.status === 'pending' || f.status === 'compressing')
      if (stillRunning) return

      // Cleanup handlers from all workers
      for (const w of _workers) {
        w.removeEventListener('message', handleMessage)
      }
      _compressAllCleanup = null

      // 统计压缩次数（只计本轮新压缩的，避免重复计数）
      if (pendingCount > 0) {
        trackCompressionComplete(get, set, pendingCount, pendingFiles.map(f => f.originalSize))
      }

      set({ isCompressing: false })
    }

    // Set cleanup for external cancellation
    _compressAllCleanup = () => {
      for (const w of _workers) {
        w.removeEventListener('message', handleMessage)
      }
    }

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

        // SVG → PNG on main thread when a bitmap output is requested（如 svg-to-png）
        if (isSVG(fileType) && effectiveFormat !== 'original') {
          try {
            fileBuffer = await rasterizeSVGOnMain(fileBuffer)
            fileType = 'image/png'
          } catch {
            set({
              files: get().files.map(f =>
                f.id === file.id ? { ...f, status: 'error' as const, error: 'SVG转换失败' } : f
              ),
            })
            checkDone()
            return
          }
        }

        // 动画 GIF：canvas 无法编码 GIF，用 gifsicle 真正压缩（保留动画），
        // 处理结果直接透传给 Worker，避免 Worker 再按静态图重编码
        let skipProcessing = false
        if (isGIF(fileType) && effectiveFormat === 'original' && !(watermark.enabled && isPro)) {
          try {
            fileBuffer = await optimizeGifOnMain(fileBuffer, {
              quality: options.quality,
              speed: options.speed,
              lossless: options.lossless,
              resizeWidth: options.resizeWidth || 0,
              resizeHeight: options.resizeHeight || 0,
              rotation: file.rotation,
              flipH: file.flipH,
              flipV: file.flipV,
              targetKB: options.targetKB || 0,
            })
            skipProcessing = true
          } catch {
            set({
              files: get().files.map(f =>
                f.id === file.id ? { ...f, status: 'error' as const, error: 'GIF压缩失败' } : f
              ),
            })
            checkDone()
            return
          }
        }

        getNextWorker().postMessage({
          id: file.id,
          fileBuffer,
          fileName: file.file.name,
          fileType,
          skipProcessing,
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
          watermark: watermark.enabled && isPro ? {
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
      const { id: msgId, type, compressedBuffer, compressedSize, outputMime, error, step, triedQuality, currentKB, targetKB } = e.data
      if (msgId !== id) return

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
        trackCompressionComplete(get, set, 1, [file.file.size])
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

        // SVG → PNG on main thread when a bitmap output is requested（如 svg-to-png）
        if (isSVG(fileType) && effectiveFormat !== 'original') {
          try {
            fileBuffer = await rasterizeSVGOnMain(fileBuffer)
            fileType = 'image/png'
          } catch {
            set({
              files: get().files.map(f =>
                f.id === file.id ? { ...f, status: 'error' as const, error: 'SVG转换失败' } : f
              ),
            })
            w.removeEventListener('message', handler)
            _compressOneCleanups.delete(id)
            return
          }
        }

        // 动画 GIF：canvas 无法编码 GIF，用 gifsicle 真正压缩（保留动画），
        // 处理结果直接透传给 Worker，避免 Worker 再按静态图重编码
        let skipProcessing = false
        if (isGIF(fileType) && effectiveFormat === 'original' && !(get().watermark.enabled && isPro)) {
          try {
            fileBuffer = await optimizeGifOnMain(fileBuffer, {
              quality: options.quality,
              speed: options.speed,
              lossless: options.lossless,
              resizeWidth: options.resizeWidth || 0,
              resizeHeight: options.resizeHeight || 0,
              rotation: file.rotation,
              flipH: file.flipH,
              flipV: file.flipV,
              targetKB: options.targetKB || 0,
            })
            skipProcessing = true
          } catch {
            set({
              files: get().files.map(f =>
                f.id === file.id ? { ...f, status: 'error' as const, error: 'GIF压缩失败' } : f
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
        skipProcessing,
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
        watermark: get().watermark.enabled && isPro ? {
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

  retryFailed: async () => {
    const { files } = get()
    const errorFiles = files.filter(f => f.status === 'error')
    if (errorFiles.length === 0) return

    // Reset error files to pending
    set({
      files: files.map(f =>
        f.status === 'error'
          ? { ...f, status: 'pending' as const, error: undefined }
          : f
      ),
    })

    // Trigger compression
    await get().compressAll()
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

  cropImage: (id: string, croppedFile: File) => {
    const file = get().files.find(f => f.id === id)
    if (!file) return
    // Create new preview URL for cropped image
    const oldUrl = file.previewUrl
    const newUrl = URL.createObjectURL(croppedFile)
    set({
      files: get().files.map(f =>
        f.id === id
          ? {
              ...f,
              file: croppedFile,
              originalSize: croppedFile.size,
              previewUrl: newUrl,
              status: 'pending' as const,
              compressedSize: null,
              compressedBlob: null,
              rotation: 0,
              flipH: false,
              flipV: false,
              width: 0,
              height: 0,
            }
          : f
      ),
    })
    // Clean up old preview URL
    URL.revokeObjectURL(oldUrl)
    // Re-read dimensions async
    createImageBitmap(croppedFile).then(bitmap => {
      set({
        files: get().files.map(f =>
          f.id === id ? { ...f, width: bitmap.width, height: bitmap.height } : f
        ),
      })
      bitmap.close()
    }).catch(() => {})
  },

  // adjustImage reuses cropImage logic — same "replace file, reset to pending" pattern
  adjustImage: (id: string, adjustedFile: File) => {
    get().cropImage(id, adjustedFile)
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
