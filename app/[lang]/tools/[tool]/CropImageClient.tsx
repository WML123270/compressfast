'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Crop,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'

type AspectRatio = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16'
type DragMode = 'move' | 'new' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
type OutputFormat = 'original' | 'png' | 'jpeg' | 'webp'

interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

interface LoadedImage {
  file: File
  url: string
  img: HTMLImageElement
}

const RATIO_MAP: Record<AspectRatio, number | null> = {
  free: null,
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
}

const RATIOS: AspectRatio[] = ['free', '1:1', '4:3', '3:4', '16:9', '9:16']
const HANDLE_SIZE = 22
const MIN_CROP = 24
const MAX_BYTES = 30 * 1024 * 1024
const HANDLE_CURSORS: Record<Exclude<DragMode, 'move' | 'new'>, string> = {
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
}

function centeredCrop(w: number, h: number, aspect: number | null): CropRect {
  let cw = w * 0.8
  let ch = h * 0.8
  if (aspect) {
    if (cw / ch > aspect) cw = ch * aspect
    else ch = cw / aspect
  }
  return {
    x: Math.round((w - cw) / 2),
    y: Math.round((h - ch) / 2),
    w: Math.round(cw),
    h: Math.round(ch),
  }
}

function clampRect(rect: CropRect, rw: number, rh: number, aspect: number | null): CropRect {
  let { x, y, w, h } = rect

  w = Math.max(MIN_CROP, w)
  h = Math.max(MIN_CROP, h)

  if (aspect) {
    if (w / h > aspect) w = h * aspect
    else h = w / aspect
    if (w > rw) {
      w = rw
      h = w / aspect
    }
    if (h > rh) {
      h = rh
      w = h * aspect
    }
  }

  w = Math.min(w, rw)
  h = Math.min(h, rh)
  x = Math.max(0, Math.min(x, rw - w))
  y = Math.max(0, Math.min(y, rh - h))

  return { x, y, w, h }
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

export default function CropImageClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [source, setSource] = useState<LoadedImage | null>(null)
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState<AspectRatio>('free')
  const [rotation, setRotation] = useState(0)
  const [format, setFormat] = useState<OutputFormat>('original')
  const [quality, setQuality] = useState(0.92)
  const [viewport, setViewport] = useState({ maxW: 720, maxH: 480 })
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ bytes: number; w: number; h: number } | null>(null)
  const [hoverCursor, setHoverCursor] = useState('default')

  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef<LoadedImage | null>(null)
  const displayRef = useRef({ scale: 1 })
  const dragRef = useRef<{
    mode: DragMode
    startX: number
    startY: number
    base: CropRect
    moved: boolean
  } | null>(null)

  const rot = ((rotation % 360) + 360) % 360
  const iw = source?.img.naturalWidth ?? 0
  const ih = source?.img.naturalHeight ?? 0
  const turned = rot === 90 || rot === 270
  const rw = turned ? ih : iw
  const rh = turned ? iw : ih

  const isLossy =
    format === 'jpeg' ||
    format === 'webp' ||
    (format === 'original' &&
      (source?.file.type === 'image/jpeg' || source?.file.type === 'image/webp'))

  // Canvas can only re-encode JPG/PNG/WebP reliably. Other inputs (AVIF, GIF,
  // BMP, SVG) fall back to PNG, so label the option with what actually happens.
  const originalLabel = (() => {
    const type = source?.file.type
    if (type === 'image/jpeg') return isZh ? '原格式（JPG）' : 'Original (JPG)'
    if (type === 'image/png') return isZh ? '原格式（PNG）' : 'Original (PNG)'
    if (type === 'image/webp') return isZh ? '原格式（WebP）' : 'Original (WebP)'
    return isZh ? '自动转 PNG' : 'Auto (PNG)'
  })()

  // ── Load / replace / clean up the source image ─────────────────────────
  const applySource = useCallback((next: LoadedImage) => {
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url)
    sourceRef.current = next
    setSource(next)
  }, [])

  const loadFile = useCallback(
    (file: File) => {
      setError('')
      setResult(null)

      const looksLikeImage =
        file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(file.name)
      if (!looksLikeImage) {
        setError(isZh ? '请选择图片文件（PNG、JPG、WebP、GIF、BMP、SVG、AVIF）。' : 'Please choose an image file (PNG, JPG, WebP, GIF, BMP, SVG, AVIF).')
        return
      }
      if (file.size > MAX_BYTES) {
        setError(
          isZh
            ? `图片超过 ${formatFileSize(MAX_BYTES)}，请先压缩或缩小后再试。`
            : `This image is larger than ${formatFileSize(MAX_BYTES)}. Compress or resize it first.`,
        )
        return
      }

      setLoading(true)
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        if (!img.naturalWidth || !img.naturalHeight) {
          URL.revokeObjectURL(url)
          setLoading(false)
          setError(isZh ? '无法读取这张图片的尺寸，请换一张试试。' : 'Could not read this image. Please try another file.')
          return
        }
        applySource({ file, url, img })
        setRotation(0)
        setRatio('free')
        setCrop(centeredCrop(img.naturalWidth, img.naturalHeight, null))
        setLoading(false)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setLoading(false)
        setError(
          isZh
            ? '无法解码这张图片。HEIC 等格式请先用对应工具转成 JPG 再裁剪。'
            : 'This image could not be decoded. For HEIC and similar formats, convert to JPG first.',
        )
      }
      img.src = url
    },
    [applySource, isZh],
  )

  useEffect(() => {
    return () => {
      if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url)
      sourceRef.current = null
    }
  }, [])

  const removeImage = useCallback(() => {
    if (sourceRef.current) URL.revokeObjectURL(sourceRef.current.url)
    sourceRef.current = null
    setSource(null)
    setRotation(0)
    setRatio('free')
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  // ── Paste an image from the clipboard ──────────────────────────────────
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      const file = item?.getAsFile()
      if (file) {
        e.preventDefault()
        loadFile(file)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [loadFile])

  // ── Measure the available canvas area ──────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const maxW = Math.max(240, el.clientWidth - 24)
      const maxH = Math.min(Math.max(260, window.innerHeight * 0.62), 680)
      setViewport({ maxW, maxH })
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [source])

  // ── Draw preview ───────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !source || !rw || !rh) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const scale = Math.min(viewport.maxW / rw, viewport.maxH / rh, 1)
    const cssW = Math.max(1, Math.round(rw * scale))
    const cssH = Math.max(1, Math.round(rh * scale))

    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)
    ctx.imageSmoothingQuality = 'high'

    // Rotated image, centred in the canvas
    ctx.save()
    ctx.translate(cssW / 2, cssH / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.drawImage(source.img, (-iw * scale) / 2, (-ih * scale) / 2, iw * scale, ih * scale)
    ctx.restore()

    displayRef.current = { scale }

    const cx = crop.x * scale
    const cy = crop.y * scale
    const cw = crop.w * scale
    const ch = crop.h * scale

    if (cw >= 1 && ch >= 1) {
      // Dim everything outside the crop
      ctx.fillStyle = 'rgba(11, 20, 32, 0.62)'
      ctx.fillRect(0, 0, cssW, Math.max(0, cy))
      ctx.fillRect(0, cy + ch, cssW, Math.max(0, cssH - cy - ch))
      ctx.fillRect(0, cy, Math.max(0, cx), ch)
      ctx.fillRect(cx + cw, cy, Math.max(0, cssW - cx - cw), ch)

      // Rule-of-thirds guides
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 1; i <= 2; i++) {
        ctx.moveTo(cx + (cw / 3) * i, cy)
        ctx.lineTo(cx + (cw / 3) * i, cy + ch)
        ctx.moveTo(cx, cy + (ch / 3) * i)
        ctx.lineTo(cx + cw, cy + (ch / 3) * i)
      }
      ctx.stroke()

      // Crop border
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.strokeRect(cx, cy, cw, ch)

      // Handles
      const handles = getHandles(cx, cy, cw, ch)
      handles.forEach(h => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(h.x - 3, h.y - 3, 6, 6)
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 1
        ctx.strokeRect(h.x - 3, h.y - 3, 6, 6)
      })

      // Live size label
      const label = `${Math.round(crop.w)} × ${Math.round(crop.h)}`
      ctx.font = '600 12px system-ui, sans-serif'
      const labelW = ctx.measureText(label).width + 16
      const labelX = Math.max(4, Math.min(cssW - labelW - 4, cx + cw / 2 - labelW / 2))
      const labelY = cy > 28 ? cy - 26 : Math.min(cssH - 24, cy + ch + 8)
      ctx.fillStyle = 'rgba(11, 20, 32, 0.85)'
      ctx.fillRect(labelX, labelY, labelW, 20)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, labelX + labelW / 2, labelY + 10)
    }
  }, [source, rotation, crop, viewport, rw, rh, iw, ih, rot])

  function getHandles(cx: number, cy: number, cw: number, ch: number) {
    return [
      { id: 'nw' as DragMode, x: cx, y: cy },
      { id: 'n' as DragMode, x: cx + cw / 2, y: cy },
      { id: 'ne' as DragMode, x: cx + cw, y: cy },
      { id: 'e' as DragMode, x: cx + cw, y: cy + ch / 2 },
      { id: 'se' as DragMode, x: cx + cw, y: cy + ch },
      { id: 's' as DragMode, x: cx + cw / 2, y: cy + ch },
      { id: 'sw' as DragMode, x: cx, y: cy + ch },
      { id: 'w' as DragMode, x: cx, y: cy + ch / 2 },
    ]
  }

  function hitTest(x: number, y: number): DragMode | null {
    const scale = displayRef.current.scale
    const cx = crop.x * scale
    const cy = crop.y * scale
    const cw = crop.w * scale
    const ch = crop.h * scale

    for (const h of getHandles(cx, cy, cw, ch)) {
      if (Math.abs(x - h.x) < HANDLE_SIZE / 2 && Math.abs(y - h.y) < HANDLE_SIZE / 2) {
        return h.id
      }
    }
    if (x > cx && x < cx + cw && y > cy && y < cy + ch) return 'move'
    return null
  }

  const getCanvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!source) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    const scale = displayRef.current.scale || 1
    const nx = pos.x / scale
    const ny = pos.y / scale
    const mode = hitTest(pos.x, pos.y) ?? 'new'

    let base: CropRect
    let startX = nx
    let startY = ny

    if (mode === 'new') {
      startX = Math.max(0, Math.min(nx, rw))
      startY = Math.max(0, Math.min(ny, rh))
      base = { ...crop }
    } else {
      base = { ...crop }
    }

    dragRef.current = { mode, startX, startY, base, moved: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setResult(null)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e)
    const scale = displayRef.current.scale || 1

    if (!dragRef.current) {
      const hit = hitTest(pos.x, pos.y)
      if (hit === 'move') setHoverCursor('grab')
      else if (hit === 'new' || !hit) setHoverCursor('crosshair')
      else setHoverCursor(HANDLE_CURSORS[hit] ?? 'default')
      return
    }

    e.preventDefault()
    const d = dragRef.current
    const nx = pos.x / scale
    const ny = pos.y / scale
    const dx = nx - d.startX
    const dy = ny - d.startY
    const aspect = RATIO_MAP[ratio]
    let next: CropRect = { ...d.base }

    if (d.mode === 'new') {
      const w = Math.abs(nx - d.startX)
      const h = Math.abs(ny - d.startY)
      // Ignore a plain click in empty space — only start a new crop after a real drag
      if (!d.moved && w < 4 / scale && h < 4 / scale) return
      d.moved = true
      next = {
        x: Math.min(nx, d.startX),
        y: Math.min(ny, d.startY),
        w: Math.max(MIN_CROP, w),
        h: Math.max(MIN_CROP, h),
      }
      if (aspect) {
        if (next.w / next.h > aspect) next.w = next.h * aspect
        else next.h = next.w / aspect
      }
      next = clampRect(next, rw, rh, aspect)
    } else {
      d.moved = true
      switch (d.mode) {
        case 'move':
          next.x = d.base.x + dx
          next.y = d.base.y + dy
          break
        case 'nw':
          next.x = d.base.x + dx
          next.y = d.base.y + dy
          next.w = d.base.w - dx
          next.h = d.base.h - dy
          break
        case 'ne':
          next.y = d.base.y + dy
          next.w = d.base.w + dx
          next.h = d.base.h - dy
          break
        case 'sw':
          next.x = d.base.x + dx
          next.w = d.base.w - dx
          next.h = d.base.h + dy
          break
        case 'se':
          next.w = d.base.w + dx
          next.h = d.base.h + dy
          break
        case 'n':
          next.y = d.base.y + dy
          next.h = d.base.h - dy
          break
        case 's':
          next.h = d.base.h + dy
          break
        case 'e':
          next.w = d.base.w + dx
          break
        case 'w':
          next.x = d.base.x + dx
          next.w = d.base.w - dx
          break
      }
      next = clampRect(next, rw, rh, aspect)
    }

    setCrop(next)
  }

  const endDrag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (d) {
      if (d.mode === 'new' && !d.moved) {
        // A click without dragging should not destroy the current selection
        setCrop(d.base)
      } else {
        setCrop(prev => {
          const aspect = RATIO_MAP[ratio]
          return clampRect(
            { x: prev.x, y: prev.y, w: Math.max(MIN_CROP, prev.w), h: Math.max(MIN_CROP, prev.h) },
            rw,
            rh,
            aspect,
          )
        })
      }
    }
    dragRef.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  // ── Ratio / rotate / reset ─────────────────────────────────────────────
  const applyRatio = (next: AspectRatio) => {
    setRatio(next)
    setCrop(centeredCrop(rw, rh, RATIO_MAP[next]))
    setResult(null)
  }

  const rotate = (delta: number) => {
    if (!source) return
    const next = (rotation + delta + 360) % 360
    const nextTurned = next === 90 || next === 270
    const nextW = nextTurned ? ih : iw
    const nextH = nextTurned ? iw : ih
    setRotation(next)
    setRatio('free')
    setCrop(centeredCrop(nextW, nextH, null))
    setResult(null)
  }

  const resetCrop = () => {
    setRatio('free')
    setCrop(centeredCrop(rw, rh, null))
    setResult(null)
  }

  // ── Export ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!source || downloading) return
    const outW = Math.max(1, Math.round(crop.w))
    const outH = Math.max(1, Math.round(crop.h))
    if (outW < 1 || outH < 1) return

    setDownloading(true)
    setError('')
    try {
      let mime = 'image/png'
      if (format === 'original') {
        if (source.file.type === 'image/jpeg') mime = 'image/jpeg'
        else if (source.file.type === 'image/webp') mime = 'image/webp'
      } else if (format === 'jpeg') {
        mime = 'image/jpeg'
      } else if (format === 'webp') {
        mime = 'image/webp'
      }

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')

      if (mime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, outW, outH)
      }

      ctx.imageSmoothingQuality = 'high'
      ctx.save()
      ctx.translate(-crop.x, -crop.y)
      ctx.translate(rw / 2, rh / 2)
      ctx.rotate((rot * Math.PI) / 180)
      ctx.drawImage(source.img, -iw / 2, -ih / 2, iw, ih)
      ctx.restore()

      const blob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, mime, mime === 'image/png' ? undefined : quality)
      })
      if (!blob) throw new Error('encode failed')

      // Safari may silently fall back to PNG for unsupported output types
      const actualMime = blob.type || mime
      const ext = extFromMime(actualMime)
      const base = source.file.name.replace(/\.[^.]+$/, '') || 'image'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${base}-cropped.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)

      setResult({ bytes: blob.size, w: outW, h: outH })
    } catch {
      setError(
        isZh
          ? '导出失败，请重试或换一张图片。'
          : 'Export failed. Please try again or use a different image.',
      )
    } finally {
      setDownloading(false)
    }
  }

  // ── UI ─────────────────────────────────────────────────────────────────
  if (!source) {
    return (
      <div className="space-y-3">
        <div
          onDragOver={e => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const file = e.dataTransfer.files?.[0]
            if (file) loadFile(file)
          }}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 sm:py-16 text-center transition-all ${
            dragOver
              ? 'border-cyan-500 bg-cyan-50'
              : 'border-gray-300 bg-white hover:border-cyan-400 hover:bg-cyan-50/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif"
            className="hidden"
            onClick={e => e.stopPropagation()}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) loadFile(file)
              e.target.value = ''
            }}
          />
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Crop className="h-6 w-6" />}
          </div>
          <p className="text-base font-semibold text-neutral-900">
            {isZh ? '点击选择图片，或拖到这里' : 'Click to choose an image, or drop it here'}
          </p>
          <p className="mt-1.5 text-sm text-neutral-600">
            {isZh
              ? '也可以直接 Ctrl+V 粘贴。PNG / JPG / WebP / GIF / BMP / SVG / AVIF，最大 30MB'
              : 'You can also paste with Ctrl+V. PNG / JPG / WebP / GIF / BMP / SVG / AVIF, up to 30MB'}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            {isZh ? '本地处理，照片不会上传' : 'Processed locally — photos are never uploaded'}
          </p>
        </div>
        {error && (
          <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4 text-cyan-600" />
            <span className="max-w-[180px] truncate text-sm font-semibold text-neutral-900 sm:max-w-[280px]">
              {source.file.name}
            </span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {iw} × {ih}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => rotate(-90)}
              title={isZh ? '逆时针旋转 90°' : 'Rotate left 90°'}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-gray-100 hover:text-neutral-900"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => rotate(90)}
              title={isZh ? '顺时针旋转 90°' : 'Rotate right 90°'}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-gray-100 hover:text-neutral-900"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetCrop}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-gray-100 hover:text-neutral-900"
            >
              {isZh ? '重置' : 'Reset'}
            </button>
            <button
              type="button"
              onClick={removeImage}
              title={isZh ? '更换图片' : 'Change image'}
              className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ratio presets */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 px-3 py-2 sm:px-4">
          <span className="mr-1 flex-shrink-0 text-xs font-medium text-neutral-500">
            {isZh ? '比例' : 'Ratio'}
          </span>
          {RATIOS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => applyRatio(r)}
              className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                ratio === r
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-gray-100 text-neutral-700 hover:bg-gray-200'
              }`}
            >
              {r === 'free' ? (isZh ? '自由' : 'Free') : r}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div
          ref={wrapRef}
          className="flex items-center justify-center bg-[#0b1420] p-3"
          style={{ minHeight: 200 }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={{ cursor: hoverCursor }}
            className="max-w-full touch-none select-none rounded-lg"
          />
        </div>

        {/* Footer controls */}
        <div className="space-y-3 border-t border-gray-100 px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-neutral-600">
              {isZh ? '导出格式' : 'Export'}
              <select
                value={format}
                onChange={e => {
                  setFormat(e.target.value as OutputFormat)
                  setResult(null)
                }}
                className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-neutral-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              >
                <option value="original">{originalLabel}</option>
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </label>

            {isLossy && (
              <label className="flex flex-1 items-center gap-2 text-xs font-medium text-neutral-600">
                <span className="whitespace-nowrap">{isZh ? '质量' : 'Quality'}</span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={e => {
                    setQuality(Number(e.target.value))
                    setResult(null)
                  }}
                  className="h-1.5 min-w-[100px] flex-1 accent-cyan-600"
                />
                <span className="w-8 text-right tabular-nums">{Math.round(quality * 100)}</span>
              </label>
            )}

            <span className="ml-auto rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium tabular-nums text-neutral-700">
              {Math.round(crop.w)} × {Math.round(crop.h)} px
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-neutral-500">
              {isZh
                ? '拖动选框移动，拖角缩放，空白处拖动可重新框选。'
                : 'Drag the box to move, handles to resize, or drag on empty space to draw a new crop.'}
            </p>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || crop.w < 1 || crop.h < 1}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isZh ? '裁剪并下载' : 'Crop & Download'}
            </button>
          </div>

          {result && (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <ImagePlus className="h-4 w-4 flex-shrink-0" />
              {isZh
                ? `已下载 ${result.w} × ${result.h}，${formatFileSize(result.bytes)}。`
                : `Downloaded ${result.w} × ${result.h}, ${formatFileSize(result.bytes)}.`}
            </p>
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        {isZh
          ? '全程本地处理，图片不会上传；导出时自动去除 EXIF 定位信息。'
          : 'Everything stays on your device, and EXIF location data is stripped on export.'}
      </p>

      {loading && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-neutral-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {isZh ? '正在读取图片…' : 'Reading the image…'}
        </p>
      )}
    </div>
  )
}
