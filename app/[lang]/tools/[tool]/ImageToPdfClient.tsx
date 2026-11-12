'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, FileText, Download, Loader2, Trash2, ChevronUp, ChevronDown,
  X, Plus, GripVertical, ArrowDownAZ, CheckCircle2, ShieldCheck, RefreshCw,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import { trackPdfEvent } from '@/lib/pdf/analytics'

// ─── 配置 ─────────────────────────────────────────────────────────────
const MAX_FILES = 50
const MAX_FILE_BYTES = 50 * 1024 * 1024

const PAGE_SIZES: Record<'a4' | 'letter', [number, number]> = {
  a4: [595.28, 841.89], // 210 × 297 mm，单位 pt
  letter: [612, 792],   // 8.5 × 11 in
}

type PageSize = 'a4' | 'letter' | 'fit'
type Orientation = 'auto' | 'portrait' | 'landscape'
type Margin = 0 | 24 | 48
type MaxEdge = 1600 | 2400 | 3200

interface PdfItem {
  id: string
  name: string
  size: number
  width: number
  height: number
  thumb: string   // 小缩略图 data URL
  source: Blob    // 生成时使用的源文件（HEIC 已转 JPEG）
}

interface PdfResult {
  url: string
  size: number
  pages: number
  name: string
}

interface Settings {
  pageSize: PageSize
  orientation: Orientation
  margin: Margin
  quality: number
  maxEdge: MaxEdge
}

// ─── 图片解码（createImageBitmap 优先，SVG 等回退 <img>）─────────────
type Decoded = { source: CanvasImageSource; width: number; height: number; close: () => void }

async function decodeImage(blob: Blob): Promise<Decoded> {
  try {
    const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
    return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
  } catch {
    const url = URL.createObjectURL(blob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image()
        el.onload = () => resolve(el)
        el.onerror = () => reject(new Error('decode failed'))
        el.src = url
      })
      if (!img.naturalWidth || !img.naturalHeight) throw new Error('empty image')
      return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
    } catch (err) {
      URL.revokeObjectURL(url)
      throw err
    }
  }
}

function isHeicFile(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
}

async function prepareSource(file: File): Promise<Blob> {
  if (!isHeicFile(file)) return file
  const mod = await import('heic2any')
  const convert = (mod as unknown as { default?: unknown }).default ?? mod
  const out = await (convert as (opts: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>)({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  })
  return Array.isArray(out) ? out[0] : out
}

async function makeThumb(decoded: Decoded): Promise<string> {
  const k = Math.min(1, 240 / Math.max(decoded.width, decoded.height))
  const w = Math.max(1, Math.round(decoded.width * k))
  const h = Math.max(1, Math.round(decoded.height * k))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(decoded.source, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.72)
}

// ─── 用 pdf-lib 在本地合成 PDF ────────────────────────────────────────
async function buildPdf(
  items: PdfItem[],
  settings: Settings,
  title: string,
  onProgress: (done: number, total: number) => void,
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  const doc = await PDFDocument.create()
  doc.setTitle(title)
  doc.setCreator('CompressFast (compressfast.site)')
  doc.setProducer('CompressFast')
  doc.setSubject('Created locally in your browser')
  const now = new Date()
  doc.setCreationDate(now)
  doc.setModificationDate(now)

  const margin = settings.margin

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const decoded = await decodeImage(item.source)
    try {
      // 等比缩放到所选最大长边，再铺白底编码 JPEG（PNG 透明区域变白色）
      const k = Math.min(1, settings.maxEdge / Math.max(decoded.width, decoded.height))
      const w = Math.max(1, Math.round(decoded.width * k))
      const h = Math.max(1, Math.round(decoded.height * k))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(decoded.source, 0, 0, w, h)
      const jpg = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          b => (b ? resolve(b) : reject(new Error('JPEG encode failed'))),
          'image/jpeg',
          settings.quality,
        )
      })
      const jpgBytes = new Uint8Array(await jpg.arrayBuffer())
      // 立即释放大画布
      canvas.width = 0
      canvas.height = 0

      const embedded = await doc.embedJpg(jpgBytes)

      let pageW: number
      let pageH: number
      if (settings.pageSize === 'fit') {
        // 页面长边固定 842pt（A4 长边），宽度按图片比例，照片四周不留白边
        const long = 842
        const contentLong = Math.max(72, long - 2 * margin)
        const ratio = w / h
        let cw: number
        let ch: number
        if (ratio >= 1) {
          cw = contentLong
          ch = cw / ratio
        } else {
          ch = contentLong
          cw = ch * ratio
        }
        pageW = cw + 2 * margin
        pageH = ch + 2 * margin
      } else {
        const [pw, ph] = PAGE_SIZES[settings.pageSize]
        const shortSide = Math.min(pw, ph)
        const longSide = Math.max(pw, ph)
        const landscape =
          settings.orientation === 'landscape' ||
          (settings.orientation === 'auto' && w > h)
        pageW = landscape ? longSide : shortSide
        pageH = landscape ? shortSide : longSide
      }

      const contentW = Math.max(1, pageW - 2 * margin)
      const contentH = Math.max(1, pageH - 2 * margin)
      const fit = Math.min(contentW / w, contentH / h)
      const drawW = w * fit
      const drawH = h * fit
      const page = doc.addPage([pageW, pageH])
      page.drawImage(embedded, {
        x: (pageW - drawW) / 2,
        y: (pageH - drawH) / 2,
        width: drawW,
        height: drawH,
      })
    } finally {
      decoded.close()
    }

    onProgress(i + 1, items.length)
    // 让出主线程，让进度条有机会刷新
    await new Promise(r => setTimeout(r, 0))
  }

  const bytes = await doc.save()
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
}

// ─── 分段选择器 ───────────────────────────────────────────────────────
function Seg<T extends string | number>({
  label, value, options, onChange, disabled,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
      <div
        className="inline-flex flex-wrap items-center rounded-lg border border-gray-300 p-0.5"
        role="group"
        aria-label={label}
      >
        {options.map(o => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            disabled={disabled}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-40 ${
              value === o.value ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────
export default function ImageToPdfClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [items, setItems] = useState<PdfItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [adding, setAdding] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PdfResult | null>(null)

  const [pageSize, setPageSize] = useState<PageSize>('a4')
  const [orientation, setOrientation] = useState<Orientation>('auto')
  const [margin, setMargin] = useState<Margin>(24)
  const [maxEdge, setMaxEdge] = useState<MaxEdge>(2400)
  const [quality, setQuality] = useState(0.9)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragFrom = useRef<number | null>(null)
  const resultUrlRef = useRef<string | null>(null)

  const busy = adding || generating

  const clearResult = useCallback(() => {
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = null
    }
    setResult(null)
  }, [])

  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  const addFiles = useCallback(async (files: File[]) => {
    if (generating) return
    const imageFiles = files.filter(f => f.type.startsWith('image/') || isHeicFile(f))
    if (imageFiles.length === 0) {
      setError(isZh ? '请选择图片文件（JPG / PNG / WebP / HEIC 等）' : 'Please select image files (JPG / PNG / WebP / HEIC)')
      return
    }
    const room = MAX_FILES - items.length
    if (room <= 0) {
      setError(isZh ? `单个 PDF 最多合并 ${MAX_FILES} 张图片` : `Up to ${MAX_FILES} images per PDF`)
      return
    }

    const accepted = imageFiles.slice(0, room)
    const overLimit = imageFiles.length > room
    setError('')
    setAdding(true)
    const added: PdfItem[] = []
    const failed: string[] = []
    const tooLarge: string[] = []

    for (const file of accepted) {
      if (file.size > MAX_FILE_BYTES) {
        tooLarge.push(file.name)
        continue
      }
      try {
        const source = await prepareSource(file)
        const decoded = await decodeImage(source)
        try {
          const thumb = await makeThumb(decoded)
          added.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: file.name,
            size: file.size,
            width: decoded.width,
            height: decoded.height,
            thumb,
            source,
          })
        } finally {
          decoded.close()
        }
      } catch {
        failed.push(file.name)
      }
    }

    if (added.length > 0) {
      setItems(prev => [...prev, ...added])
      clearResult()
    }
    setAdding(false)

    const notes: string[] = []
    if (tooLarge.length) notes.push(isZh ? `${tooLarge.length} 张超过 50MB 已跳过` : `${tooLarge.length} larger than 50MB skipped`)
    if (failed.length) notes.push(isZh ? `${failed.length} 张无法读取已跳过` : `${failed.length} could not be read`)
    if (overLimit) notes.push(isZh ? `最多 ${MAX_FILES} 张，多余图片未添加` : `limit is ${MAX_FILES} images`)
    if (notes.length) setError(notes.join('；'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, isZh, clearResult, generating])

  // 支持 Ctrl+V 直接粘贴图片
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
      if (files.length > 0) {
        e.preventDefault()
        void addFiles(files)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addFiles])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    if (files.length > 0) void addFiles(files)
  }, [addFiles])

  const move = useCallback((from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return
    setItems(prev => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    clearResult()
  }, [items.length, clearResult])

  const removeAt = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    clearResult()
  }, [clearResult])

  const clearAll = useCallback(() => {
    setItems([])
    setError('')
    clearResult()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [clearResult])

  const sortByName = useCallback(() => {
    setItems(prev => [...prev].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
    ))
    clearResult()
  }, [clearResult])

  // 任一设置变化后旧 PDF 失效
  const changeSetting = useCallback(<T,>(setter: (v: T) => void, value: T) => {
    setter(value)
    clearResult()
  }, [clearResult])

  const generate = useCallback(async () => {
    if (items.length === 0 || busy) return
    setError('')
    clearResult()
    setGenerating(true)
    setProgress({ done: 0, total: items.length })
    try {
      const base = (items[0].name.replace(/\.[^.]+$/, '') || 'images')
        .replace(/[\\/:*?"<>|]+/g, '_')
        .slice(0, 60)
      const settings: Settings = { pageSize, orientation, margin, quality, maxEdge }
      const blob = await buildPdf(items, settings, base || 'images', (done, total) => {
        setProgress({ done, total })
      })
      const url = URL.createObjectURL(blob)
      resultUrlRef.current = url
      setResult({ url, size: blob.size, pages: items.length, name: `${base || 'images'}.pdf` })
      trackPdfEvent('generate', { tool: 'image-to-pdf', pages: items.length, bytes: blob.size })
    } catch (e) {
      console.error('[image-to-pdf]', e)
      setError(isZh ? '生成 PDF 失败，请重试或减少图片数量' : 'Failed to generate the PDF. Please retry or use fewer images.')
      trackPdfEvent('error', { tool: 'image-to-pdf', pages: items.length })
    } finally {
      setGenerating(false)
      setProgress(null)
    }
  }, [items, busy, clearResult, pageSize, orientation, margin, quality, maxEdge, isZh])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
    trackPdfEvent('download', { tool: 'image-to-pdf', pages: result.pages, bytes: result.size })
  }, [result])

  const pct = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length > 0) void addFiles(files)
          e.target.value = ''
        }}
      />

      {/* 上传区（无图片时） */}
      {items.length === 0 && (
        <div
          onClick={() => !busy && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-300 bg-white/50 hover:border-cyan-300'
          }`}
        >
          {adding ? (
            <Loader2 className="w-10 h-10 mx-auto text-cyan-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 mx-auto text-gray-400" />
          )}
          <p className="mt-3 font-medium text-gray-700">
            {adding
              ? (isZh ? '正在读取图片…' : 'Reading images…')
              : (isZh ? '拖入多张图片，或点击上传' : 'Drop multiple images or click to upload')}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isZh
              ? 'JPG / PNG / WebP / HEIC · 每张图片一页 · 100% 本地处理'
              : 'JPG / PNG / WebP / HEIC · one image per page · 100% local'}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-blue-100 text-xs text-neutral-500">
            {isZh ? '也可以 Ctrl+V 粘贴图片' : 'You can also paste with Ctrl+V'}
          </p>
        </div>
      )}

      {/* 图片列表 */}
      {items.length > 0 && (
        <div
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const files = Array.from(e.dataTransfer.files ?? [])
            if (files.length > 0) void addFiles(files)
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">
              {isZh ? `共 ${items.length} 张 · ${items.length} 页` : `${items.length} image${items.length > 1 ? 's' : ''} · ${items.length} page${items.length > 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:border-cyan-300 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> {isZh ? '添加' : 'Add'}
              </button>
              <button
                onClick={sortByName}
                disabled={busy || items.length < 2}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:border-cyan-300 disabled:opacity-40"
              >
                <ArrowDownAZ className="w-3.5 h-3.5" /> {isZh ? '按名称排序' : 'Sort by name'}
              </button>
              <button
                onClick={clearAll}
                disabled={busy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:text-red-500 hover:border-red-200 disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" /> {isZh ? '清空' : 'Clear'}
              </button>
            </div>
          </div>

          <ul className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
            {items.map((item, i) => (
              <li
                key={item.id}
                draggable={!busy}
                onDragStart={() => { dragFrom.current = i }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = dragFrom.current
                  dragFrom.current = null
                  if (from !== null) move(from, i)
                }}
                className="flex items-center gap-2 px-3 py-2.5 bg-white hover:bg-gray-50/70"
              >
                <span className="w-5 text-center text-xs font-bold text-gray-400 flex-shrink-0">{i + 1}</span>
                <GripVertical className="hidden sm:block w-4 h-4 text-gray-300 cursor-grab flex-shrink-0" aria-hidden />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumb}
                  alt=""
                  draggable={false}
                  className="w-11 h-11 rounded-lg object-cover border border-gray-200 bg-white flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {item.width}×{item.height} · {formatFileSize(item.size)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => move(i, i - 1)}
                    disabled={busy || i === 0}
                    aria-label={isZh ? '上移' : 'Move up'}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    disabled={busy || i === items.length - 1}
                    aria-label={isZh ? '下移' : 'Move down'}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeAt(i)}
                    disabled={busy}
                    aria-label={isZh ? '移除' : 'Remove'}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* 追加图片入口（拖放由外层卡片统一处理） */}
          <div
            onClick={() => !busy && fileInputRef.current?.click()}
            className="m-3 rounded-xl border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400 cursor-pointer transition-colors hover:border-cyan-300"
          >
            {adding
              ? (isZh ? '正在读取图片…' : 'Reading images…')
              : (isZh ? '拖入更多图片，或点击添加' : 'Drop more images here, or click to add')}
          </div>
        </div>
      )}

      {/* 设置 */}
      {items.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Seg
              label={isZh ? '页面尺寸' : 'Page size'}
              value={pageSize}
              disabled={busy}
              onChange={(v) => changeSetting(setPageSize, v)}
              options={[
                { value: 'a4', label: 'A4' },
                { value: 'letter', label: 'Letter' },
                { value: 'fit', label: isZh ? '跟随图片' : 'Fit image' },
              ]}
            />
            <Seg
              label={isZh ? '页面方向' : 'Orientation'}
              value={orientation}
              disabled={busy || pageSize === 'fit'}
              onChange={(v) => changeSetting(setOrientation, v)}
              options={[
                { value: 'auto', label: isZh ? '自动' : 'Auto' },
                { value: 'portrait', label: isZh ? '纵向' : 'Portrait' },
                { value: 'landscape', label: isZh ? '横向' : 'Landscape' },
              ]}
            />
            <Seg
              label={isZh ? '页边距' : 'Margins'}
              value={margin}
              disabled={busy}
              onChange={(v) => changeSetting(setMargin, v)}
              options={[
                { value: 0 as Margin, label: isZh ? '无边距' : 'None' },
                { value: 24 as Margin, label: isZh ? '窄' : 'Small' },
                { value: 48 as Margin, label: isZh ? '标准' : 'Normal' },
              ]}
            />
            <Seg
              label={isZh ? '最大分辨率（长边）' : 'Max resolution (long edge)'}
              value={maxEdge}
              disabled={busy}
              onChange={(v) => changeSetting(setMaxEdge, v)}
              options={[
                { value: 1600 as MaxEdge, label: '1600px' },
                { value: 2400 as MaxEdge, label: '2400px' },
                { value: 3200 as MaxEdge, label: '3200px' },
              ]}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="pdf-quality" className="text-xs font-medium text-gray-500">
                {isZh ? '图片画质' : 'Image quality'}
              </label>
              <span className="text-xs font-semibold text-gray-700">{Math.round(quality * 100)}%</span>
            </div>
            <input
              id="pdf-quality"
              type="range"
              min={60}
              max={95}
              step={1}
              value={Math.round(quality * 100)}
              disabled={busy}
              onChange={(e) => changeSetting(setQuality, Number(e.target.value) / 100)}
              className="w-full accent-cyan-500 disabled:opacity-40"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {isZh
                ? '画质越高越清晰，PDF 体积也越大；90% 适合大多数场景。'
                : 'Higher quality means a sharper PDF but a larger file — 90% suits most use cases.'}
            </p>
          </div>
        </div>
      )}

      {/* 生成按钮 / 进度 */}
      {items.length > 0 && !result && (
        <div className="space-y-2">
          <button
            onClick={generate}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:opacity-90 disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {generating
              ? (isZh
                  ? `正在生成 PDF${progress ? ` ${progress.done}/${progress.total}` : ''}…`
                  : `Generating PDF${progress ? ` ${progress.done}/${progress.total}` : ''}…`)
              : (isZh ? `生成 PDF（${items.length} 页）` : `Generate PDF (${items.length} page${items.length > 1 ? 's' : ''})`)}
          </button>
          {generating && (
            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      {/* 结果 */}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
          <p className="mt-2 font-semibold text-emerald-900">
            {isZh ? 'PDF 已生成' : 'PDF is ready'}
          </p>
          <p className="text-sm text-emerald-800/80 mt-0.5">
            {result.pages} {isZh ? '页' : `page${result.pages > 1 ? 's' : ''}`} · {formatFileSize(result.size)}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={download}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90"
            >
              <Download className="w-4 h-4" /> {isZh ? '下载 PDF' : 'Download PDF'}
            </button>
            <button
              onClick={generate}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-emerald-300 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> {isZh ? '重新生成' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
        {isZh
          ? '图片与 PDF 均在本机生成，不会上传到任何服务器'
          : 'Images and the PDF are generated on your device — nothing is uploaded'}
      </p>
    </div>
  )
}
