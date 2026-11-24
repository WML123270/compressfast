'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, Image as ImageIcon, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { ImageDrop } from '@/components/tools/ImageDrop'
import { downloadBlob } from '@/lib/utils'

type Mode = 'blur' | 'pixelate'
type Format = 'jpeg' | 'png' | 'webp'

interface Loaded {
  file: File
  url: string
  img: HTMLImageElement
}

const MAX_BYTES = 30 * 1024 * 1024
const MAX_PREVIEW_EDGE = 1200

function extFor(format: Format): string {
  return format === 'jpeg' ? 'jpg' : format
}

/** 把效果绘制到目标 canvas；strength 按输出尺寸缩放，保证预览与导出观感一致 */
function paintEffect(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  mode: Mode,
  strength: number,
) {
  ctx.clearRect(0, 0, w, h)
  // 先铺一层原图：模糊滤镜在边缘会产生透明，底图让边缘保持完整
  ctx.drawImage(img, 0, 0, w, h)

  if (mode === 'blur') {
    const radius = Math.max(0.5, strength)
    const supportsFilter = typeof ctx.filter === 'string'
    if (supportsFilter) {
      ctx.save()
      ctx.filter = `blur(${radius}px)`
      ctx.drawImage(img, 0, 0, w, h)
      ctx.restore()
      return
    }
    // 旧 Safari 无 ctx.filter：用降采样再放大模拟模糊
    const factor = Math.max(1, Math.round(radius / 2))
    const tw = Math.max(1, Math.ceil(w / factor))
    const th = Math.max(1, Math.ceil(h / factor))
    const tmp = document.createElement('canvas')
    tmp.width = tw
    tmp.height = th
    const tctx = tmp.getContext('2d')
    if (!tctx) return
    tctx.imageSmoothingEnabled = true
    tctx.drawImage(img, 0, 0, w, h, 0, 0, tw, th)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(tmp, 0, 0, tw, th, 0, 0, w, h)
    return
  }

  // 马赛克：缩小到块尺寸再以最近邻放大
  const cell = Math.max(2, Math.round(strength))
  const tw = Math.max(1, Math.ceil(w / cell))
  const th = Math.max(1, Math.ceil(h / cell))
  const tmp = document.createElement('canvas')
  tmp.width = tw
  tmp.height = th
  const tctx = tmp.getContext('2d')
  if (!tctx) return
  tctx.imageSmoothingEnabled = true
  tctx.drawImage(img, 0, 0, w, h, 0, 0, tw, th)
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tmp, 0, 0, tw, th, 0, 0, w, h)
}

export default function BlurImageClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [source, setSource] = useState<Loaded | null>(null)
  const [mode, setMode] = useState<Mode>('blur')
  const [strength, setStrength] = useState(14)
  const [format, setFormat] = useState<Format>('jpeg')
  const [quality, setQuality] = useState(92)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [outputKB, setOutputKB] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url)
    }
  }, [source])

  const loadFile = (file: File) => {
    setError(null)
    setOutputKB(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSource((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return { file, url, img }
      })
      // 默认强度按图片尺寸给一个合理值
      const base = Math.max(img.naturalWidth, img.naturalHeight)
      setStrength(mode === 'blur' ? Math.max(6, Math.round(base / 120)) : Math.max(8, Math.round(base / 100)))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError(isZh ? '图片解码失败，请换一张试试。' : 'Could not decode this image. Try another file.')
    }
    img.src = url
  }

  // 预览：按最大边缩放，效果好又不会卡
  useEffect(() => {
    if (!source) return
    const canvas = canvasRef.current
    if (!canvas) return
    const { img } = source
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(iw, ih))
    const w = Math.max(1, Math.round(iw * scale))
    const h = Math.max(1, Math.round(ih * scale))
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    paintEffect(ctx, img, w, h, mode, strength * scale)
  }, [source, mode, strength])

  const reset = () => {
    if (source?.url) URL.revokeObjectURL(source.url)
    setSource(null)
    setError(null)
    setOutputKB(null)
  }

  const exportImage = async () => {
    if (!source) return
    setBusy(true)
    setError(null)
    try {
      const { img, file } = source
      const w = img.naturalWidth
      const h = img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas unavailable')
      if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      paintEffect(ctx, img, w, h, mode, strength)
      const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, mime, format === 'png' ? undefined : quality / 100),
      )
      if (!blob) throw new Error('encode failed')
      const base = file.name.replace(/\.[^.]+$/, '') || 'image'
      const suffix = mode === 'blur' ? 'blurred' : 'mosaic'
      downloadBlob(blob, `${base}-${suffix}.${extFor(format)}`)
      setOutputKB(Math.round((blob.size / 1024) * 10) / 10)
    } catch {
      setError(isZh ? '导出失败，请重试。' : 'Export failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!source) {
    return (
      <ImageDrop
        isZh={isZh}
        maxBytes={MAX_BYTES}
        icon={<ImageIcon className="h-6 w-6" />}
        onFile={loadFile}
        error={error}
        hint={
          isZh
            ? `支持 PNG / JPG / WebP / GIF / BMP / SVG / AVIF，最大 30MB。也可 Ctrl+V 粘贴`
            : `PNG / JPG / WebP / GIF / BMP / SVG / AVIF, up to 30MB. Ctrl+V to paste`
        }
      />
    )
  }

  const { img, file } = source
  const isBlur = mode === 'blur'
  const strengthMax = isBlur ? 50 : 80

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <ImageIcon className="h-4 w-4 flex-shrink-0 text-cyan-600" />
            <span className="max-w-[180px] truncate text-sm font-semibold text-neutral-900 sm:max-w-[320px]">
              {file.name}
            </span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {img.naturalWidth} × {img.naturalHeight}
            </span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isZh ? '换一张' : 'Change'}
          </button>
        </div>
        <div className="flex max-h-[52vh] items-center justify-center overflow-hidden bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,#fff_25%,#fff_75%,#f3f4f6_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
          <canvas ref={canvasRef} className="max-h-[52vh] w-auto max-w-full object-contain" />
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">{isZh ? '处理方式' : 'Effect'}</p>
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            <button
              type="button"
              onClick={() => {
                setMode('blur')
                setStrength(14)
                setOutputKB(null)
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                isBlur ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              {isZh ? '高斯模糊' : 'Blur'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('pixelate')
                setStrength(16)
                setOutputKB(null)
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                !isBlur ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
              }`}
            >
              {isZh ? '马赛克' : 'Pixelate'}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <label className="font-medium text-neutral-800">
              {isBlur ? (isZh ? '模糊强度' : 'Blur radius') : isZh ? '马赛克块大小' : 'Pixel size'}
            </label>
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
              {strength}px
            </span>
          </div>
          <input
            type="range"
            min={2}
            max={strengthMax}
            value={strength}
            onChange={(e) => {
              setStrength(Number(e.target.value))
              setOutputKB(null)
            }}
            className="w-full accent-cyan-600"
            aria-label={isBlur ? 'Blur strength' : 'Pixel size'}
          />
          <p className="mt-1 text-xs text-neutral-500">
            {isZh
              ? '对整张图片统一处理。只遮挡局部区域时，建议先用「裁剪图片」截出区域再打码。'
              : 'Applied to the whole image. To hide only a small area, crop it first, then blur it.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-800">{isZh ? '输出格式' : 'Output format'}</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm text-neutral-900 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            >
              <option value="jpeg">JPG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
          </div>
          {format !== 'png' && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <label className="font-medium text-neutral-800">{isZh ? '画质' : 'Quality'}</label>
                <span className="text-xs font-semibold text-neutral-700">{quality}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-cyan-600"
                aria-label="Quality"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportImage}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {busy ? (isZh ? '处理中…' : 'Working…') : isZh ? '下载' : 'Download'}
          </button>
          {outputKB !== null && (
            <span className="text-sm text-emerald-700">
              {isZh ? `已生成 ${outputKB}KB` : `Generated ${outputKB}KB`}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
