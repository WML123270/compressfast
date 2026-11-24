'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Download,
  ImagePlus,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { formatFileSize } from '@/lib/compression/utils'
import {
  DEFAULT_CAPS,
  StitchCancelled,
  readImageSize,
  stitchExtension,
  stitchImages,
  type StitchCaps,
  type StitchFormat,
  type StitchMode,
  type StitchOptions,
} from '@/lib/stitch/stitch'
import { trackStitchEvent } from '@/lib/stitch/analytics'

interface Item {
  id: string
  file: File
  url: string
  w: number
  h: number
}

interface PreviewResult {
  blob: Blob
  url: string
  width: number
  height: number
  count: number
  scaled: boolean
}

const MAX_ITEMS = 30
const MAX_FILE_BYTES = 30 * 1024 * 1024

// 设备内存/浏览器 canvas 限制不同：先按大图生成，失败后逐级降级重试
const CAPS_STEPS: StitchCaps[] = [
  DEFAULT_CAPS,
  { maxEdge: 16000, maxPixels: 16_000_000 },
  { maxEdge: 12000, maxPixels: 8_000_000 },
]

const BG_SWATCHES = [
  { value: '#ffffff', label: { en: 'White', zh: '白色' } },
  { value: '#000000', label: { en: 'Black', zh: '黑色' } },
  { value: '#f3f4f6', label: { en: 'Light gray', zh: '浅灰' } },
  { value: '#e0f2fe', label: { en: 'Light blue', zh: '浅蓝' } },
]

function uid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

export default function StitchImagesClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [items, setItems] = useState<Item[]>([])
  const [options, setOptions] = useState<StitchOptions>({
    mode: 'vertical',
    gap: 0,
    background: '#ffffff',
    columns: 2,
    cellSize: 600,
    format: 'png',
    quality: 0.92,
  })
  const [result, setResult] = useState<PreviewResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [notice, setNotice] = useState('')
  const [genError, setGenError] = useState('')
  const [dragging, setDragging] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<Item[]>([])
  const genRef = useRef(0)
  const resultUrlRef = useRef<string | null>(null)
  const firstGenerateTracked = useRef(false)

  itemsRef.current = items

  const revokeItem = (item: Item) => {
    try { URL.revokeObjectURL(item.url) } catch {}
  }

  const clearAll = useCallback(() => {
    genRef.current++
    setItems(prev => {
      prev.forEach(revokeItem)
      return []
    })
    setResult(prev => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
    resultUrlRef.current = null
    setNotice('')
    setGenError('')
    setBusy(false)
  }, [])

  useEffect(() => () => {
    // 卸载时取消进行中的生成，并释放所有 object URL
    genRef.current++
    itemsRef.current.forEach(revokeItem)
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  const addFiles = useCallback(async (incoming: File[]) => {
    if (incoming.length === 0) return
    setNotice('')
    setGenError('')

    const room = MAX_ITEMS - itemsRef.current.length
    if (room <= 0) {
      setNotice(isZh ? `最多拼接 ${MAX_ITEMS} 张图片` : `Up to ${MAX_ITEMS} images per collage`)
      return
    }

    const rejected: string[] = []
    const accepted: File[] = []
    for (const file of incoming) {
      if (accepted.length >= room) break
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(isZh ? `${file.name}（超过 30MB）` : `${file.name} (over 30MB)`)
        continue
      }
      if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|avif|gif|bmp|svg)$/i.test(file.name)) {
        rejected.push(isZh ? `${file.name}（不是图片）` : `${file.name} (not an image)`)
        continue
      }
      accepted.push(file)
    }

    const loaded: Item[] = []
    for (const file of accepted) {
      const url = URL.createObjectURL(file)
      try {
        const { w, h } = await readImageSize(file)
        loaded.push({ id: uid(), file, url, w, h })
      } catch {
        URL.revokeObjectURL(url)
        rejected.push(isZh ? `${file.name}（无法解码，HEIC 请先转成 JPG）` : `${file.name} (cannot decode — convert HEIC to JPG first)`)
      }
    }

    if (loaded.length > 0) {
      setItems(prev => [...prev, ...loaded].slice(0, MAX_ITEMS))
    }
    if (rejected.length > 0) {
      setNotice(
        (isZh ? '以下图片未加入：' : 'Skipped: ') + rejected.slice(0, 3).join(isZh ? '、' : ', ') +
        (rejected.length > 3 ? (isZh ? ` 等 ${rejected.length} 张` : ` and ${rejected.length - 3} more`) : ''),
      )
    }
    if (accepted.length !== incoming.length && rejected.length === 0) {
      setNotice(isZh ? `最多拼接 ${MAX_ITEMS} 张图片` : `Up to ${MAX_ITEMS} images per collage`)
    }
  }, [isZh])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) void addFiles(files)
  }, [addFiles])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const files: File[] = []
      const list = e.clipboardData?.items
      if (!list) return
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (!item.type.startsWith('image/')) continue
        const blob = item.getAsFile()
        if (blob) {
          const ext = item.type === 'image/jpeg' ? '.jpg' : item.type === 'image/png' ? '.png' : item.type === 'image/webp' ? '.webp' : ''
          files.push(new File([blob], `clipboard-${Date.now()}-${i}${ext}`, { type: item.type }))
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        void addFiles(files)
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addFiles])

  // ── 生成预览（参数/顺序变化后 300ms 防抖）──
  useEffect(() => {
    if (items.length === 0) {
      setResult(prev => {
        if (prev) URL.revokeObjectURL(prev.url)
        return null
      })
      resultUrlRef.current = null
      setBusy(false)
      setProgress({ done: 0, total: 0 })
      return
    }

    const token = ++genRef.current
    const timer = setTimeout(async () => {
      setBusy(true)
      setGenError('')
      setProgress({ done: 0, total: items.length })
      const files = items.map(i => i.file)

      for (let step = 0; step < CAPS_STEPS.length; step++) {
        try {
          const res = await stitchImages(
            files,
            options,
            (done, total) => {
              if (genRef.current === token) setProgress({ done, total })
            },
            () => genRef.current !== token,
            CAPS_STEPS[step],
          )
          if (genRef.current !== token) return

          const url = URL.createObjectURL(res.blob)
          if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
          resultUrlRef.current = url
          setResult({
            blob: res.blob,
            url,
            width: res.width,
            height: res.height,
            count: res.count,
            scaled: step > 0 || res.clamped,
          })
          if (!firstGenerateTracked.current) {
            firstGenerateTracked.current = true
            trackStitchEvent('generate')
          }
          setBusy(false)
          return
        } catch (e) {
          if (e instanceof StitchCancelled) return
          if (genRef.current !== token) return
          // 最后一档也失败才报错；否则降级重试
          if (step === CAPS_STEPS.length - 1) {
            setGenError(
              isZh
                ? '生成失败：图片太多或太大，超出了浏览器内存。请减少图片数量，或先用压缩工具缩小图片。'
                : 'Could not generate: the collage exceeds browser memory. Try fewer or smaller images.',
            )
            // 失败时移除上一版预览，避免下载到与当前参数不符的旧结果
            setResult(prev => {
              if (prev) URL.revokeObjectURL(prev.url)
              return null
            })
            resultUrlRef.current = null
            setBusy(false)
            trackStitchEvent('error')
            return
          }
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [items, options, isZh])

  const move = (index: number, dir: -1 | 1) => {
    setItems(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const tmp = next[index]
      next[index] = next[target]
      next[target] = tmp
      return next
    })
  }

  const remove = (index: number) => {
    setItems(prev => {
      const next = [...prev]
      const [removed] = next.splice(index, 1)
      if (removed) revokeItem(removed)
      return next
    })
  }

  const download = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result.url
    a.download = `stitched-${Date.now()}.${stitchExtension(options.format)}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    trackStitchEvent('download')
  }

  const setMode = (mode: StitchMode) => {
    setOptions(prev => ({
      ...prev,
      mode,
      gap: mode === 'grid' && prev.gap === 0 ? 8 : prev.gap,
    }))
  }

  const setFormat = (format: StitchFormat) => {
    setOptions(prev => ({
      ...prev,
      format,
      // JPEG 不支持透明，切到 JPEG 时把透明背景改为白色
      background: format === 'jpeg' && prev.background === 'transparent' ? '#ffffff' : prev.background,
    }))
  }

  const transparentDisabled = options.format === 'jpeg'
  const qualityVisible = options.format !== 'png'

  return (
    <div className="space-y-4">
      {/* ── 添加区 / 拖放 ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed transition-colors ${
          dragging ? 'border-blue-400 bg-blue-50/70' : 'border-gray-300 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length > 0) void addFiles(files)
            e.target.value = ''
          }}
        />

        {items.length === 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full px-6 py-10 sm:py-14 flex flex-col items-center gap-3 text-center"
          >
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ImagePlus className="w-7 h-7" />
            </span>
            <span className="font-semibold text-neutral-800">
              {isZh ? '拖入图片、点击选择，或 Ctrl / ⌘ + V 粘贴' : 'Drop images, click to browse, or paste with Ctrl / ⌘ + V'}
            </span>
            <span className="text-xs sm:text-sm text-neutral-500 max-w-md">
              {isZh
                ? '最多 30 张，单张不超过 30MB。JPG、PNG、WebP、AVIF、GIF 均可，全程本地处理，不上传。'
                : 'Up to 30 images, 30MB each. JPG, PNG, WebP, AVIF and GIF supported. Everything runs locally — no upload.'}
            </span>
          </button>
        ) : (
          <div className="p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-neutral-800">
                {isZh ? `图片顺序（${items.length}/${MAX_ITEMS}）` : `Image order (${items.length}/${MAX_ITEMS})`}
              </p>
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isZh ? '清空' : 'Clear all'}
              </button>
            </div>

            <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {items.map((item, index) => (
                <li key={item.id} className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden group">
                  <div className="aspect-square flex items-center justify-center bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={isZh ? `第 ${index + 1} 张：${item.file.name}` : `Image ${index + 1}: ${item.file.name}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="absolute top-1 left-1 min-w-5 h-5 px-1 rounded-md bg-black/60 text-white text-[11px] font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={isZh ? `移除第 ${index + 1} 张` : `Remove image ${index + 1}`}
                    className="absolute top-1 right-1 w-6 h-6 sm:w-5 sm:h-5 rounded-md bg-black/55 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <div className="flex items-center justify-between px-1 py-1 bg-white border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label={isZh ? '向前移动' : 'Move earlier'}
                      className="p-1.5 rounded text-neutral-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      {options.mode === 'horizontal' ? <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <ArrowUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                    </button>
                    <span className="text-[10px] text-neutral-400 tabular-nums truncate px-1">
                      {item.w}×{item.h}
                    </span>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label={isZh ? '向后移动' : 'Move later'}
                      className="p-1.5 rounded text-neutral-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      {options.mode === 'horizontal' ? <ArrowRight className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <ArrowDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
                    </button>
                  </div>
                </li>
              ))}
              {items.length < MAX_ITEMS && (
                <li>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="w-full aspect-square rounded-xl border-2 border-dashed border-gray-300 text-neutral-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/40 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[11px] font-medium">{isZh ? '添加' : 'Add'}</span>
                  </button>
                </li>
              )}
            </ul>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isZh ? '图片不会上传，全部在你的浏览器里拼接。' : 'Images are never uploaded — everything is stitched in your browser.'}
            </p>
          </div>
        )}
      </div>

      {notice && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      )}

      {/* ── 参数 + 预览 ── */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-4">
          {/* 设置面板 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {isZh ? '拼接方式' : 'Layout'}
              </p>
              <div className="grid grid-cols-3 gap-1.5 bg-gray-100 rounded-xl p-1">
                {([
                  { value: 'vertical', en: 'Vertical', zh: '纵向长图' },
                  { value: 'horizontal', en: 'Side by side', zh: '横向拼接' },
                  { value: 'grid', en: 'Grid', zh: '网格拼图' },
                ] as const).map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`px-1 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      options.mode === m.value
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {isZh ? m.zh : m.en}
                  </button>
                ))}
              </div>
            </div>

            {options.mode === 'grid' && (
              <div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                  {isZh ? '每行列数' : 'Columns'}
                </p>
                <div className="flex gap-1.5">
                  {[2, 3, 4].map(cols => (
                    <button
                      key={cols}
                      type="button"
                      onClick={() => setOptions(prev => ({ ...prev, columns: cols }))}
                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        options.columns === cols
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-neutral-600 hover:border-gray-300'
                      }`}
                    >
                      {cols}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {isZh ? '间距' : 'Gap'}
                </span>
                <span className="text-xs text-neutral-600 tabular-nums">{options.gap}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={2}
                value={options.gap}
                onChange={(e) => setOptions(prev => ({ ...prev, gap: Number(e.target.value) }))}
                aria-label={isZh ? '图片间距' : 'Gap between images'}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {isZh ? '背景色' : 'Background'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {BG_SWATCHES.map(sw => (
                  <button
                    key={sw.value}
                    type="button"
                    onClick={() => setOptions(prev => ({ ...prev, background: sw.value }))}
                    aria-label={isZh ? sw.label.zh : sw.label.en}
                    title={isZh ? sw.label.zh : sw.label.en}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      options.background === sw.value
                        ? 'border-blue-500 scale-110'
                        : 'border-gray-200 hover:scale-105'
                    }`}
                    style={{ background: sw.value }}
                  />
                ))}
                <button
                  type="button"
                  disabled={transparentDisabled}
                  onClick={() => setOptions(prev => ({ ...prev, background: 'transparent' }))}
                  title={transparentDisabled
                    ? (isZh ? 'JPG 不支持透明' : 'JPG does not support transparency')
                    : (isZh ? '透明（仅 PNG / WebP）' : 'Transparent (PNG / WebP only)')}
                  aria-label={isZh ? '透明背景' : 'Transparent background'}
                  className={`w-7 h-7 rounded-full border-2 relative overflow-hidden transition-transform ${
                    options.background === 'transparent'
                      ? 'border-blue-500 scale-110'
                      : 'border-gray-200 hover:scale-105'
                  } ${transparentDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundImage:
                      'linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%),linear-gradient(45deg,#e5e7eb 25%,transparent 25%,transparent 75%,#e5e7eb 75%)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 5px 5px',
                    backgroundColor: '#fff',
                  }}
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600 cursor-pointer">
                  <input
                    type="color"
                    value={options.background === 'transparent' ? '#ffffff' : options.background}
                    onChange={(e) => setOptions(prev => ({ ...prev, background: e.target.value }))}
                    aria-label={isZh ? '自定义背景色' : 'Custom background color'}
                    className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer"
                  />
                  {isZh ? '自定义' : 'Custom'}
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {isZh ? '输出格式' : 'Format'}
              </p>
              <div className="flex gap-1.5">
                {([
                  { value: 'png', label: 'PNG', hint: isZh ? '无损' : 'Lossless' },
                  { value: 'jpeg', label: 'JPG', hint: isZh ? '最小' : 'Smallest' },
                  { value: 'webp', label: 'WebP', hint: isZh ? '均衡' : 'Balanced' },
                ] as const).map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFormat(f.value)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      options.format === f.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-neutral-600 hover:border-gray-300'
                    }`}
                  >
                    {f.label}
                    <span className="block text-[10px] font-normal opacity-70">{f.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {qualityVisible && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    {isZh ? '质量' : 'Quality'}
                  </span>
                  <span className="text-xs text-neutral-600 tabular-nums">{Math.round(options.quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  step={1}
                  value={Math.round(options.quality * 100)}
                  onChange={(e) => setOptions(prev => ({ ...prev, quality: Number(e.target.value) / 100 }))}
                  aria-label={isZh ? '输出质量' : 'Output quality'}
                  className="w-full accent-blue-600"
                />
              </div>
            )}
          </div>

          {/* 预览 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 flex flex-col">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                {isZh ? '预览' : 'Preview'}
              </p>
              {result && !busy && (
                <span className="text-[11px] text-neutral-500 tabular-nums">
                  {result.width}×{result.height} · {formatFileSize(result.blob.size)}
                </span>
              )}
            </div>

            <div className="flex-1 min-h-[220px] rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center p-2">
              {busy ? (
                <div className="flex flex-col items-center gap-2 text-neutral-500">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <p className="text-sm font-medium">
                    {isZh ? '正在拼接…' : 'Stitching…'}
                    {progress.total > 0 ? ` ${progress.done}/${progress.total}` : ''}
                  </p>
                  <div className="w-40 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-[width] duration-200"
                      style={{ width: `${progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 5}%` }}
                    />
                  </div>
                </div>
              ) : result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.url}
                  alt={isZh ? '拼接结果预览' : 'Stitched result preview'}
                  className="max-h-[52vh] max-w-full object-contain rounded-md shadow-sm"
                />
              ) : (
                <p className="text-sm text-neutral-400 px-6 text-center">
                  {genError || (isZh ? '添加图片后自动生成预览' : 'Add images to see a preview')}
                </p>
              )}
            </div>

            {genError && !busy && (
              <p className="mt-2 text-xs text-red-600 leading-relaxed">{genError}</p>
            )}

            {result && !busy && (
              <div className="mt-3 space-y-1.5">
                {result.scaled && (
                  <p className="text-[11px] text-amber-600">
                    {isZh
                      ? '图片较多，已自动等比缩小以适配浏览器内存。减少图片数量可获得更高分辨率。'
                      : 'Auto-scaled to fit browser memory. Use fewer images for a higher-resolution result.'}
                  </p>
                )}
                <button
                  type="button"
                  onClick={download}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:opacity-95 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  {isZh ? '下载拼接图片' : 'Download image'}
                  <span className="text-white/75 font-normal">
                    ({stitchExtension(options.format).toUpperCase()})
                  </span>
                </button>
                <p className="text-[11px] text-neutral-400 text-center">
                  {isZh ? '无水印 · 无需注册 · 不上传' : 'No watermark · No sign-up · No upload'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-600" />{isZh ? '长截图/聊天记录拼接' : 'Long screenshots'}</span>
          <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-600" />{isZh ? '横向并排对比' : 'Side-by-side'}</span>
          <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-600" />{isZh ? '九宫格拼图' : 'Grid collage'}</span>
          <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-600" />{isZh ? '无水印、免费' : 'Free, no watermark'}</span>
        </div>
      )}
    </div>
  )
}
