'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, ImagePlus, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import JSZip from 'jszip'
import { useT } from '@/lib/i18n/context'
import { ImageDrop } from '@/components/tools/ImageDrop'
import { downloadBlob } from '@/lib/utils'
import { trackSplitEvent } from '@/lib/split-image/analytics'

const MAX_BYTES = 30 * 1024 * 1024
const MAX_GRID = 5

type Format = 'jpeg' | 'png'

interface Source {
  file: File
  url: string
  img: HTMLImageElement
}

interface LastZip {
  copies: number
  bytes: number
  name: string
}

/** 切图区域：正方形模式先中心裁成最小边长的正方形 */
function sourceRegion(imgW: number, imgH: number, square: boolean) {
  if (!square) return { sx: 0, sy: 0, sw: imgW, sh: imgH }
  const side = Math.min(imgW, imgH)
  return { sx: Math.round((imgW - side) / 2), sy: Math.round((imgH - side) / 2), sw: side, sh: side }
}

function extFor(format: Format) {
  return format === 'jpeg' ? 'jpg' : 'png'
}

export default function SplitImageClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [source, setSource] = useState<Source | null>(null)
  const [rows, setRows] = useState(3)
  const [cols, setCols] = useState(3)
  const [square, setSquare] = useState(true)
  const [format, setFormat] = useState<Format>('jpeg')
  const [quality, setQuality] = useState(92)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastZip, setLastZip] = useState<LastZip | null>(null)

  const previewRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const generateTracked = useRef(false)

  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url) }, [source])

  // 切法/格式变化后，旧的打包提示不再适用
  useEffect(() => { setLastZip(null) }, [rows, cols, square, format, quality])

  const handleFile = useCallback((file: File) => {
    setError(null)
    setLastZip(null)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSource({ file, url, img })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setError(isZh ? '图片无法解码，请换一张 JPG/PNG/WebP。' : 'Could not decode this image — try a JPG/PNG/WebP.')
    }
    img.src = url
  }, [isZh])

  const resetAll = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    setSource(null)
    setRows(3)
    setCols(3)
    setSquare(true)
    setError(null)
    setLastZip(null)
  }, [source])

  // 预览：原图 + 网格线 + 每块编号
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !source) return
    const r = sourceRegion(source.img.naturalWidth, source.img.naturalHeight, square)
    const cw = Math.min(640, r.sw)
    const ch = Math.max(1, Math.round(cw * (r.sh / r.sw)))
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, cw, ch)
    ctx.drawImage(source.img, r.sx, r.sy, r.sw, r.sh, 0, 0, cw, ch)

    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = 2
    ctx.setLineDash([7, 5])
    for (let c = 1; c < cols; c++) {
      const x = Math.round((c * cw) / cols) + 0.5
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke()
    }
    for (let rIdx = 1; rIdx < rows; rIdx++) {
      const y = Math.round((rIdx * ch) / rows) + 0.5
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke()
    }

    ctx.setLineDash([])
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let rIdx = 0; rIdx < rows; rIdx++) {
      for (let c = 0; c < cols; c++) {
        const cx = ((c + 0.5) * cw) / cols
        const cy = ((rIdx + 0.5) * ch) / rows
        const label = `${rIdx + 1}-${c + 1}`
        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(cx - 15, cy - 10, 30, 20)
        ctx.fillStyle = '#fff'
        ctx.fillText(label, cx, cy + 0.5)
      }
    }
  }, [source, rows, cols, square])

  const download = useCallback(async () => {
    if (!source || busy) return
    setBusy(true)
    setError(null)
    setLastZip(null)
    try {
      const r = sourceRegion(source.img.naturalWidth, source.img.naturalHeight, square)
      const xs = Array.from({ length: cols + 1 }, (_, i) => Math.round(r.sx + (i * r.sw) / cols))
      const ys = Array.from({ length: rows + 1 }, (_, i) => Math.round(r.sy + (i * r.sh) / rows))
      const base = source.file.name.replace(/\.[^.]+$/, '') || 'image'
      const ext = extFor(format)
      const zip = new JSZip()

      for (let rIdx = 0; rIdx < rows; rIdx++) {
        for (let c = 0; c < cols; c++) {
          const x0 = xs[c], x1 = xs[c + 1], y0 = ys[rIdx], y1 = ys[rIdx + 1]
          const w = Math.max(1, x1 - x0)
          const h = Math.max(1, y1 - y0)
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas unavailable')
          if (format === 'jpeg') {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, w, h)
          }
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(source.img, x0, y0, w, h, 0, 0, w, h)
          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
              format === 'jpeg' ? 'image/jpeg' : 'image/png',
              format === 'jpeg' ? quality / 100 : undefined,
            )
          })
          zip.file(`${base}-${rIdx + 1}-${c + 1}.${ext}`, blob)
          canvas.width = 0
          canvas.height = 0
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const name = `${base}-split-${rows}x${cols}.zip`
      downloadBlob(zipBlob, name)
      setLastZip({ copies: rows * cols, bytes: zipBlob.size, name })
      if (!generateTracked.current) {
        generateTracked.current = true
        trackSplitEvent('generate')
      }
      trackSplitEvent('download')
    } catch (e) {
      setError(e instanceof Error ? e.message : (isZh ? '切图失败，请重试。' : 'Split failed — please retry.'))
      trackSplitEvent('error')
    } finally {
      setBusy(false)
    }
  }, [source, busy, square, rows, cols, format, quality, isZh])

  const tileCount = rows * cols
  const zipKB = lastZip ? Math.max(1, Math.round(lastZip.bytes / 1024)) : 0

  if (!source) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <ImageDrop
          isZh={isZh}
          accept="image/jpeg,image/png,image/webp,image/bmp"
          hint={isZh
            ? '拖入一张图片，切成九宫格或任意行列。单张最大 30MB，图片不会上传。'
            : 'Drop an image to split into a nine-grid or any rows × columns. Up to 30MB — the image never leaves your device.'}
          maxBytes={MAX_BYTES}
          onFile={handleFile}
          error={error}
        />
        <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
          {isZh
            ? '发朋友圈 / 小红书建议用 3×3 + 正方形裁剪，按 1-1 到 3-3 的顺序上传。'
            : 'For WeChat Moments / Instagram, use 3×3 with square crop and upload in 1-1 … 3-3 order.'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/bmp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <canvas
            ref={previewRef}
            aria-label={isZh ? '切图预览' : 'Split preview'}
            className="w-full rounded-lg border border-gray-200 bg-white"
            style={{ aspectRatio: square ? '1 / 1' : `${source.img.naturalWidth} / ${source.img.naturalHeight}` }}
          />
          <p className="mt-2 text-[11px] text-center text-neutral-400 tabular-nums">
            {source.img.naturalWidth}×{source.img.naturalHeight}px · {rows}×{cols} ·{' '}
            {isZh ? `${tileCount} 张切片` : `${tileCount} tiles`}
          </p>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {isZh ? '切法' : 'Grid'}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {isZh ? '九宫格 = 3×3' : 'Nine-grid = 3×3'}
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { key: 'rows' as const, label: isZh ? '行' : 'Rows', value: rows, set: setRows },
                  { key: 'cols' as const, label: isZh ? '列' : 'Cols', value: cols, set: setCols },
                ].map((g) => (
                  <div key={g.key} className="flex items-center gap-2">
                    <span className="w-8 text-xs text-neutral-500">{g.label}</span>
                    <div className="flex flex-1 gap-1.5">
                      {Array.from({ length: MAX_GRID }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => g.set(n)}
                          aria-label={`${g.label} ${n}`}
                          aria-pressed={g.value === n}
                          className={`flex-1 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                            g.value === n
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 text-neutral-600 hover:border-cyan-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { r: 3, c: 3, zh: '九宫格', en: 'Nine-grid' },
                  { r: 2, c: 2, zh: '2×2', en: '2×2' },
                  { r: 1, c: 2, zh: '左右', en: '1×2' },
                  { r: 2, c: 1, zh: '上下', en: '2×1' },
                  { r: 4, c: 4, zh: '4×4', en: '4×4' },
                ].map((p) => (
                  <button
                    key={`${p.r}x${p.c}`}
                    type="button"
                    onClick={() => { setRows(p.r); setCols(p.c) }}
                    className={`px-2.5 py-1 rounded-full border text-[11px] transition-colors ${
                      rows === p.r && cols === p.c
                        ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 text-neutral-500 hover:border-cyan-300'
                    }`}
                  >
                    {isZh ? p.zh : p.en}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={square}
                onChange={(e) => setSquare(e.target.checked)}
                className="mt-0.5 accent-cyan-600"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-700">{isZh ? '正方形裁剪' : 'Square crop'}</span>
                <span className="block text-[11px] text-neutral-400 leading-relaxed">
                  {isZh
                    ? '先中心裁成正方形再切，适合九宫格/方图平台；关闭则按原图比例切成矩形。'
                    : 'Center-crop to a square first — best for square grids; turn off to keep the original aspect.'}
                </span>
              </span>
            </label>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">
                {isZh ? '输出格式' : 'Format'}
              </p>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 rounded-xl p-1">
                {(['jpeg', 'png'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`px-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      format === f ? 'bg-white text-cyan-700 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {f === 'jpeg' ? 'JPG' : 'PNG'}
                  </button>
                ))}
              </div>
              {format === 'jpeg' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-neutral-500">{isZh ? '质量' : 'Quality'}</span>
                  <input
                    type="range"
                    min={60}
                    max={100}
                    step={1}
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    aria-label={isZh ? 'JPG 质量' : 'JPG quality'}
                    className="flex-1 accent-cyan-600"
                  />
                  <span className="w-8 text-right text-xs text-neutral-500 tabular-nums">{quality}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={download}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {busy
                ? (isZh ? '正在切图打包…' : 'Splitting & packing…')
                : (isZh ? `下载 ZIP（${tileCount} 张）` : `Download ZIP (${tileCount} tiles)`)}
            </button>

            {lastZip && (
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 leading-relaxed">
                {isZh
                  ? `已生成 ${lastZip.copies} 张切片（${zipKB}KB），解压后按文件名 1-1 → ${rows}-${cols} 的顺序上传。`
                  : `Created ${lastZip.copies} tiles (${zipKB}KB). Upload them in filename order 1-1 → ${rows}-${cols}.`}
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">{error}</p>
            )}

            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-neutral-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {isZh
                ? '解码、切图和 ZIP 打包都在浏览器本地完成，图片不会上传。'
                : 'Decoding, slicing and ZIP packing all happen locally — your image is never uploaded.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-neutral-700 hover:border-cyan-300"
            >
              <ImagePlus className="w-4 h-4" /> {isZh ? '换图' : 'New image'}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-neutral-500 hover:text-red-500 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" /> {isZh ? '清除' : 'Clear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
