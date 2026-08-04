'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Check, SlidersHorizontal, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

interface AdjustValues {
  brightness: number  // 0-200, default 100
  contrast: number    // 0-200, default 100
  saturation: number  // 0-200, default 100
}

const DEFAULTS: AdjustValues = { brightness: 100, contrast: 100, saturation: 100 }

interface ImageAdjustModalProps {
  imageUrl: string
  fileName: string
  onAdjust: (adjustedFile: File) => void
  onClose: () => void
}

export function ImageAdjustModal({ imageUrl, fileName, onAdjust, onClose }: ImageAdjustModalProps) {
  const { t, locale } = useT()
  const isZh = locale === 'zh'
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [loaded, setLoaded] = useState(false)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [values, setValues] = useState<AdjustValues>({ ...DEFAULTS })

  // Load image
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight })
      setLoaded(true)
    }
    img.src = imageUrl
    return () => { img.onload = null }
  }, [imageUrl])

  // Draw canvas with current filter values
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const img = imgRef.current

    // Fit image to canvas
    const maxW = Math.min(window.innerWidth - 32, 800)
    const maxH = window.innerHeight - 340
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
    const dw = Math.round(img.naturalWidth * scale)
    const dh = Math.round(img.naturalHeight * scale)

    canvas.width = dw
    canvas.height = dh
    canvas.style.width = `${dw}px`
    canvas.style.height = `${dh}px`

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, dw, dh)

    // Apply CSS filters via canvas filter property
    const b = values.brightness / 100
    const c = values.contrast / 100
    const s = values.saturation / 100
    ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`
    ctx.drawImage(img, 0, 0, dw, dh)
    ctx.filter = 'none'
  }, [loaded, values, imgSize])

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current) return
    const img = imgRef.current

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!

    const b = values.brightness / 100
    const c = values.contrast / 100
    const s = values.saturation / 100
    ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`
    ctx.drawImage(img, 0, 0)
    ctx.filter = 'none'

    const origExt = fileName.match(/\.(\w+)$/)?.[1]?.toLowerCase() || 'png'
    const mimeType = origExt === 'jpg' || origExt === 'jpeg' ? 'image/jpeg'
      : origExt === 'webp' ? 'image/webp'
      : 'image/png'
    const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), mimeType, 0.92))
    const adjustedFile = new File([blob], fileName.replace(/\.\w+$/, `_adjusted.${origExt}`), { type: mimeType })
    onAdjust(adjustedFile)
  }, [values, fileName, onAdjust])

  // Keyboard — use refs to avoid re-registering on every slider change
  const confirmRef = useRef(handleConfirm)
  confirmRef.current = handleConfirm
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

  const isDefault = values.brightness === 100 && values.contrast === 100 && values.saturation === 100

  const sliders: { key: keyof AdjustValues; labelZh: string; labelEn: string }[] = [
    { key: 'brightness', labelZh: '亮度', labelEn: 'Brightness' },
    { key: 'contrast', labelZh: '对比度', labelEn: 'Contrast' },
    { key: 'saturation', labelZh: '饱和度', labelEn: 'Saturation' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/80 backdrop-blur">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-neutral-900">
              {isZh ? '调整图片' : 'Adjust Image'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setValues({ ...DEFAULTS })}
              disabled={isDefault}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isZh ? '重置' : 'Reset'}</span>
            </button>
            <button onClick={onClose} className="p-2 text-neutral-700 hover:text-neutral-900 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas preview */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
          {!loaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <canvas ref={canvasRef} className="rounded-lg" />
          )}
        </div>

        {/* Sliders */}
        <div className="px-4 py-3 border-t border-gray-200 bg-white/80 backdrop-blur space-y-3">
          {sliders.map(({ key, labelZh, labelEn }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs font-medium text-neutral-700 w-14 sm:w-16 flex-shrink-0 text-right">
                {isZh ? labelZh : labelEn}
              </span>
              <input
                type="range"
                min={0}
                max={200}
                value={values[key]}
                onChange={e => setValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="flex-1 h-1.5 rounded-full appearance-none bg-gray-300 accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-neutral-700 w-10 tabular-nums text-right">
                {values[key]}%
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white/80 backdrop-blur">
          <span className="text-xs text-neutral-700">
            {isZh ? '调整后点击确认 · 回车确认 · Esc取消' : 'Adjust & confirm · Enter to apply · Esc cancel'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {isZh ? '取消' : 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!loaded}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isZh ? '确认' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
