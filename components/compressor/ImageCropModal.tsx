'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Check, Crop } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

interface CropRect { x: number; y: number; w: number; h: number }
type AspectRatio = 'free' | '1:1' | '4:3' | '16:9'
type DragMode = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const RATIO_MAP: Record<AspectRatio, number | null> = {
  'free': null, '1:1': 1, '4:3': 4 / 3, '16:9': 16 / 9,
}

const HANDLE_SIZE = 20
const MIN_CROP = 20

interface ImageCropModalProps {
  imageUrl: string
  fileName: string
  onCrop: (croppedFile: File) => void
  onClose: () => void
}

export function ImageCropModal({ imageUrl, fileName, onCrop, onClose }: ImageCropModalProps) {
  const { t, locale } = useT()
  const isZh = locale === 'zh'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const dragRef = useRef<{
    mode: DragMode
    startX: number; startY: number
    cropX: number; cropY: number; cropW: number; cropH: number
  } | null>(null)
  const displayRef = useRef({ w: 0, h: 0, ox: 0, oy: 0, scale: 1 })

  const [loaded, setLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 })
  const [ratio, setRatio] = useState<AspectRatio>('free')
  const [dragMode, setDragMode] = useState<DragMode | null>(null)
  const [cursor, setCursor] = useState('default')

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const iw = img.naturalWidth; const ih = img.naturalHeight
      setImgSize({ w: iw, h: ih })
      // Initial crop: center 80% of image
      const cw = Math.round(iw * 0.8); const ch = Math.round(ih * 0.8)
      setCrop({ x: Math.round((iw - cw) / 2), y: Math.round((ih - ch) / 2), w: cw, h: ch })
      setLoaded(true)
    }
    img.src = imageUrl
    return () => { img.onload = null }
  }, [imageUrl])

  // Draw canvas
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const img = imgRef.current
    const { w: iw, h: ih } = imgSize

    // Fit image to canvas
    const maxW = Math.min(window.innerWidth - 32, 900)
    const maxH = window.innerHeight - 220
    const scale = Math.min(maxW / iw, maxH / ih, 1)
    const dw = Math.round(iw * scale); const dh = Math.round(ih * scale)
    const ox = Math.round((maxW - dw) / 2)

    displayRef.current = { w: dw, h: dh, ox, oy: 0, scale }
    canvas.width = dw + ox * 2
    canvas.height = dh
    canvas.style.width = `${canvas.width}px`
    canvas.style.height = `${canvas.height}px`

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    ctx.drawImage(img, ox, 0, dw, dh)

    // Darken outside crop
    const cx = ox + crop.x * scale
    const cy = crop.y * scale
    const cw = crop.w * scale
    const ch = crop.h * scale

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, canvas.width, cy)
    ctx.fillRect(0, cy, cx, ch)
    ctx.fillRect(cx + cw, cy, canvas.width - cx - cw, ch)
    ctx.fillRect(0, cy + ch, canvas.width, canvas.height - cy - ch)

    // Crop border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(cx, cy, cw, ch)
    ctx.setLineDash([])

    // Corner/edge handles
    const handles = getHandles(cx, cy, cw, ch)
    handles.forEach(h => {
      ctx.fillStyle = '#fff'
      ctx.fillRect(h.x - 3, h.y - 3, 6, 6)
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1
      ctx.strokeRect(h.x - 3, h.y - 3, 6, 6)
    })

    // Size label
    const cropW = Math.round(crop.w)
    const cropH = Math.round(crop.h)
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    const labelW = ctx.measureText(`${cropW}×${cropH}`).width + 16
    const labelY = cy > 24 ? cy - 28 : cy + ch + 20
    ctx.fillRect(cx + cw / 2 - labelW / 2, labelY, labelW, 22)
    ctx.fillStyle = '#fff'
    ctx.font = '12px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(`${cropW}×${cropH}`, cx + cw / 2, labelY + 15)
  }, [loaded, crop, imgSize])

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

  function hitTest(canvasX: number, canvasY: number): DragMode | null {
    const { ox, scale } = displayRef.current
    const cx = ox + crop.x * scale
    const cy = crop.y * scale
    const cw = crop.w * scale
    const ch = crop.h * scale

    // Check handles
    const handles = getHandles(cx, cy, cw, ch)
    for (const h of handles) {
      if (Math.abs(canvasX - h.x) < HANDLE_SIZE / 2 && Math.abs(canvasY - h.y) < HANDLE_SIZE / 2) {
        return h.id
      }
    }
    // Check inside crop area
    if (canvasX > cx && canvasX < cx + cw && canvasY > cy && canvasY < cy + ch) {
      return 'move'
    }
    return null
  }

  function clampCrop(rect: CropRect, aspect: number | null): CropRect {
    const { w: iw, h: ih } = imgSize
    let { x, y, w, h } = rect

    // Enforce aspect ratio
    if (aspect) {
      h = w / aspect
    }

    // Clamp size
    w = Math.max(MIN_CROP, Math.min(w, iw))
    h = Math.max(MIN_CROP, Math.min(h, ih))

    // Reapply aspect after size clamp
    if (aspect) h = w / aspect

    // Clamp position
    x = Math.max(0, Math.min(x, iw - w))
    y = Math.max(0, Math.min(y, ih - h))

    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }
  }

  function getCanvasPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const onPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getCanvasPos(e)
    const hit = hitTest(pos.x, pos.y)
    if (!hit) return

    dragRef.current = { mode: hit, startX: pos.x, startY: pos.y, cropX: crop.x, cropY: crop.y, cropW: crop.w, cropH: crop.h }
    setDragMode(hit)
  }, [crop])

  const onPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const pos = getCanvasPos(e)

    if (!dragRef.current) {
      // Just update cursor
      const hit = hitTest(pos.x, pos.y)
      setCursor(hit === 'move' ? 'move' : hit ? `${hit}-resize` : 'default')
      return
    }

    const d = dragRef.current
    const { scale } = displayRef.current
    const dx = (pos.x - d.startX) / scale
    const dy = (pos.y - d.startY) / scale
    const aspect = RATIO_MAP[ratio]
    let newCrop = { x: d.cropX, y: d.cropY, w: d.cropW, h: d.cropH }

    switch (d.mode) {
      case 'move':
        newCrop.x = d.cropX + dx
        newCrop.y = d.cropY + dy
        break
      case 'nw':
        newCrop.x = d.cropX + dx
        newCrop.y = d.cropY + dy
        newCrop.w = d.cropW - dx
        newCrop.h = aspect ? newCrop.w / aspect : d.cropH - dy
        break
      case 'ne':
        newCrop.y = d.cropY + dy
        newCrop.w = d.cropW + dx
        newCrop.h = aspect ? newCrop.w / aspect : d.cropH - dy
        break
      case 'sw':
        newCrop.x = d.cropX + dx
        newCrop.w = d.cropW - dx
        newCrop.h = aspect ? newCrop.w / aspect : d.cropH + dy
        break
      case 'se':
        newCrop.w = d.cropW + dx
        newCrop.h = aspect ? newCrop.w / aspect : d.cropH + dy
        break
      case 'n':
        newCrop.y = d.cropY + dy
        newCrop.h = aspect ? newCrop.w / aspect : d.cropH - dy
        break
      case 's':
        newCrop.h = d.cropH + dy
        if (aspect) newCrop.w = newCrop.h * aspect
        break
      case 'e':
        newCrop.w = d.cropW + dx
        if (aspect) newCrop.h = newCrop.w / aspect
        break
      case 'w':
        newCrop.x = d.cropX + dx
        newCrop.w = d.cropW - dx
        if (aspect) newCrop.h = newCrop.w / aspect
        break
    }

    setCrop(clampCrop(newCrop, aspect))
  }, [ratio])

  const onPointerUp = useCallback(() => {
    dragRef.current = null
    setDragMode(null)
  }, [])

  const handleCropConfirm = useCallback(async () => {
    if (!imgRef.current) return
    const img = imgRef.current
    const { x, y, w, h } = crop
    if (w < 1 || h < 1) return

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h)

    // Use original format for intermediate cropped file (compression step handles final format)
    const origExt = fileName.match(/\.(\w+)$/)?.[1]?.toLowerCase() || 'png'
    const mimeType = origExt === 'jpg' || origExt === 'jpeg' ? 'image/jpeg'
      : origExt === 'webp' ? 'image/webp'
      : origExt === 'avif' ? 'image/avif'
      : 'image/png'
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), mimeType, 0.92))
    const croppedFile = new File([blob], fileName.replace(/\.\w+$/, `_cropped.${origExt}`), { type: mimeType })
    onCrop(croppedFile)
  }, [crop, fileName, onCrop])

  // Keyboard — use refs to avoid re-registering during drag
  const confirmRef = useRef(handleCropConfirm)
  confirmRef.current = handleCropConfirm
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key === 'Enter') confirmRef.current()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <Crop className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-neutral-900">
              {isZh ? '裁剪图片' : 'Crop Image'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Aspect ratio presets */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['free', '1:1', '4:3', '16:9'] as AspectRatio[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    ratio === r ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-700 hover:text-neutral-800'
                  }`}
                >
                  {r === 'free' ? (isZh ? '自由' : 'Free') : r}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center" style={{ cursor }}>
          {!loaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
              className="rounded-lg select-none touch-none"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white/80 backdrop-blur">
          <span className="text-xs text-neutral-700">
            {isZh ? '拖拽调整裁剪区域 · 回车确认 · Esc取消' : 'Drag to adjust · Enter confirm · Esc cancel'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              onClick={handleCropConfirm}
              disabled={!loaded}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isZh ? '确认裁剪' : 'Crop'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
