'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, RotateCcw, Star } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { ImageDrop } from '@/components/tools/ImageDrop'
import { downloadBlob } from '@/lib/utils'

interface Loaded {
  file: File
  url: string
  img: HTMLImageElement
}

const MAX_BYTES = 15 * 1024 * 1024
const ALL_SIZES = [16, 32, 48, 64, 128, 256]
const DEFAULT_SIZES = [16, 32, 48, 256]

/** 中心裁切成正方形并缩放到 size×size */
function squareCanvas(img: HTMLImageElement, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  const iw = img.naturalWidth
  const ih = img.naturalHeight
  const scale = Math.max(size / iw, size / ih)
  const dw = iw * scale
  const dh = ih * scale
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh)
  return canvas
}

async function buildIco(img: HTMLImageElement, sizes: number[]): Promise<Blob> {
  const entries: { size: number; png: Uint8Array }[] = []
  for (const size of sizes) {
    const canvas = squareCanvas(img, size)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('encode failed')
    entries.push({ size, png: new Uint8Array(await blob.arrayBuffer()) })
  }

  const headerSize = 6 + 16 * entries.length
  const total = headerSize + entries.reduce((sum, e) => sum + e.png.byteLength, 0)
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)

  // ICONDIR
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: icon
  view.setUint16(4, entries.length, true)

  let offset = headerSize
  entries.forEach((entry, i) => {
    const p = 6 + i * 16
    // 256 用 0 表示
    out[p] = entry.size >= 256 ? 0 : entry.size
    out[p + 1] = entry.size >= 256 ? 0 : entry.size
    out[p + 2] = 0 // color count
    out[p + 3] = 0 // reserved
    view.setUint16(p + 4, 1, true) // planes
    view.setUint16(p + 6, 32, true) // bits per pixel
    view.setUint32(p + 8, entry.png.byteLength, true)
    view.setUint32(p + 12, offset, true)
    out.set(entry.png, offset)
    offset += entry.png.byteLength
  })

  return new Blob([out], { type: 'image/x-icon' })
}

export default function PngToIcoClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [source, setSource] = useState<Loaded | null>(null)
  const [sizes, setSizes] = useState<number[]>(DEFAULT_SIZES)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [resultKB, setResultKB] = useState<number | null>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    return () => {
      if (source?.url) URL.revokeObjectURL(source.url)
    }
  }, [source])

  const loadFile = (file: File) => {
    setError(null)
    setResultKB(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSource((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return { file, url, img }
      })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError(isZh ? '图片解码失败，请换一张试试。' : 'Could not decode this image. Try another file.')
    }
    img.src = url
  }

  // 32×32 预览，模拟浏览器标签页里的 favicon
  useEffect(() => {
    if (!source) return
    const canvas = previewRef.current
    if (!canvas) return
    const src = squareCanvas(source.img, 32)
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 32, 32)
    ctx.drawImage(src, 0, 0)
  }, [source])

  const toggleSize = (size: number) => {
    setResultKB(null)
    setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b)))
  }

  const generate = async () => {
    if (!source) return
    if (sizes.length === 0) {
      setError(isZh ? '请至少选择一个尺寸。' : 'Choose at least one size.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const blob = await buildIco(source.img, [...sizes].sort((a, b) => a - b))
      const base = source.file.name.replace(/\.[^.]+$/, '') || 'favicon'
      downloadBlob(blob, `${base}.ico`)
      setResultKB(Math.round((blob.size / 1024) * 10) / 10)
    } catch {
      setError(isZh ? '生成失败，请重试。' : 'Generation failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!source) {
    return (
      <ImageDrop
        isZh={isZh}
        maxBytes={MAX_BYTES}
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        icon={<Star className="h-6 w-6" />}
        onFile={loadFile}
        error={error}
        hint={
          isZh
            ? '建议使用正方形 PNG（≥256×256）。非正方形会按中心裁切，最大 15MB'
            : 'A square PNG (≥256×256) works best. Non-square images are center-cropped. Up to 15MB'
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Star className="h-4 w-4 flex-shrink-0 text-cyan-600" />
            <span className="max-w-[180px] truncate text-sm font-semibold text-neutral-900 sm:max-w-[320px]">
              {source.file.name}
            </span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {source.img.naturalWidth} × {source.img.naturalHeight}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (source.url) URL.revokeObjectURL(source.url)
              setSource(null)
              setResultKB(null)
              setError(null)
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isZh ? '换一张' : 'Change'}
          </button>
        </div>
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          {/* 模拟浏览器标签页 */}
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
            <canvas ref={previewRef} className="h-4 w-4" />
            <span className="text-xs text-neutral-700">{isZh ? '你的网站' : 'Your site'}</span>
          </div>
          <img
            src={source.url}
            alt=""
            className="max-h-52 max-w-full rounded-lg border border-gray-200 object-contain"
          />
          <p className="text-xs text-neutral-500">
            {isZh ? '上方是 32×32 favicon 预览' : 'The 32×32 favicon preview is shown above'}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-900">{isZh ? '包含尺寸' : 'Include sizes'}</p>
          <div className="flex flex-wrap gap-2">
            {ALL_SIZES.map((size) => {
              const active = sizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-800'
                      : 'border-gray-300 bg-white text-neutral-700 hover:border-gray-400'
                  }`}
                >
                  {size}px
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            {isZh
              ? '16/32/48 用于浏览器标签页和地址栏，256 用于高分屏与 Windows 快捷方式。'
              : '16/32/48 cover browser tabs and the address bar; 256 is used by HiDPI screens and Windows shortcuts.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {busy ? (isZh ? '生成中…' : 'Generating…') : isZh ? '下载' : 'Download'}
          </button>
          {resultKB !== null && (
            <span className="text-sm text-emerald-700">
              {isZh ? `favicon.ico 已生成 ${resultKB}KB` : `favicon.ico generated (${resultKB}KB)`}
            </span>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-neutral-500">
          {isZh
            ? '生成的是多尺寸 ICO（内嵌 PNG）。放到网站根目录并加 <link rel="icon" href="/favicon.ico"> 即可。'
            : 'Output is a multi-size ICO with embedded PNGs. Put it at your site root and add <link rel="icon" href="/favicon.ico">.'}
        </p>
      </div>
    </div>
  )
}
