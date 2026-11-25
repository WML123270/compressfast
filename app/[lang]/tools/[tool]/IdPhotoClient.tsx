'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Download, Loader2, Lock, RotateCcw, ScanFace, ImagePlus, Trash2, ShieldCheck, SlidersHorizontal,
} from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useIsCn } from '@/lib/use-is-cn'
import { ImageDrop } from '@/components/tools/ImageDrop'
import ModelDownloadBar from '@/components/ai/ModelDownloadBar'
import { cutoutPortrait } from '@/lib/ai/id-photo'
import { AiError, aiErrorCopy, formatAiErrorDetail, isRetryableAiError, type AiErrorCode } from '@/lib/ai/ai-error'
import { detectAiSupportIssue } from '@/lib/ai/support'
import { composeOnBackground, composePrintSheet, type PrintSheetResult } from '@/lib/id-photo/compose'
import {
  BG_COLORS, DEFAULT_PRESET_KEY, ID_PHOTO_PRESETS, MAX_FILE_BYTES, MODEL_SIZE_MB,
  getPreset, type IdPhotoFormat, type IdPhotoPreset,
} from '@/lib/id-photo/presets'
import { trackIdPhotoEvent } from '@/lib/id-photo/analytics'
import { downloadBlob } from '@/lib/utils'

type Status = 'idle' | 'processing' | 'done' | 'error'
type UiError = { code: AiErrorCode | 'file'; detail?: string }

interface Source {
  file: File
  url: string
  img: HTMLImageElement
}

interface Crop {
  /** 1 = 尽可能完整地保留原图（目标比例的最大内接矩形） */
  zoom: number
  /** 画面中心在原图中的归一化坐标 */
  cx: number
  cy: number
}

interface Rect {
  sx: number
  sy: number
  sw: number
  sh: number
}

interface ResultImage {
  blob: Blob
  url: string
  w: number
  h: number
}

/** 目标比例下、能放进原图的最大矩形（zoom=1 时的取景框） */
function baseRect(imgW: number, imgH: number, aspect: number): { w: number; h: number } {
  let w = imgW
  let h = w / aspect
  if (h > imgH) {
    h = imgH
    w = h * aspect
  }
  return { w, h }
}

function sourceRect(imgW: number, imgH: number, aspect: number, crop: Crop): Rect {
  const base = baseRect(imgW, imgH, aspect)
  const sw = base.w / crop.zoom
  const sh = base.h / crop.zoom
  const maxSx = Math.max(0, imgW - sw)
  const maxSy = Math.max(0, imgH - sh)
  let sx = crop.cx * imgW - sw / 2
  let sy = crop.cy * imgH - sh / 2
  sx = Math.min(Math.max(0, sx), maxSx)
  sy = Math.min(Math.max(0, sy), maxSy)
  return { sx, sy, sw, sh }
}

export default function IdPhotoClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const isCn = useIsCn()
  const { isPro, proLoading, checkProStatus } = useCompressionStore()

  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  const [source, setSource] = useState<Source | null>(null)
  const [presetKey, setPresetKey] = useState(DEFAULT_PRESET_KEY)
  const [bgColor, setBgColor] = useState<string>(BG_COLORS[0].color)
  const [format, setFormat] = useState<IdPhotoFormat>('jpeg')
  const [showGuides, setShowGuides] = useState(true)
  const [crop, setCrop] = useState<Crop>({ zoom: 1, cx: 0.5, cy: 0.5 })

  const [status, setStatus] = useState<Status>('idle')
  const [errorInfo, setErrorInfo] = useState<UiError | null>(null)
  const [phase, setPhase] = useState<'model' | 'run' | null>(null)
  const [modelProgress, setModelProgress] = useState<{ done: number; total: number; cached: boolean } | null>(null)

  const [cutout, setCutout] = useState<Blob | null>(null)
  const [result, setResult] = useState<ResultImage | null>(null)
  const [sheet, setSheet] = useState<(PrintSheetResult & { url: string }) | null>(null)
  const [sheetBusy, setSheetBusy] = useState(false)

  const preset = getPreset(presetKey)
  const aspect = preset.width / preset.height

  const previewRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{
    startX: number
    startY: number
    sx: number
    sy: number
    sw: number
    cssW: number
    pointerId: number
  } | null>(null)

  const generateTracked = useRef(false)

  // 释放旧的 object URL（结果/排版/原图）
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url) }, [result])
  useEffect(() => () => { if (sheet) URL.revokeObjectURL(sheet.url) }, [sheet])
  useEffect(() => () => { if (source) URL.revokeObjectURL(source.url) }, [source])

  // 清掉与当前裁切不一致的旧结果
  const invalidate = useCallback(() => {
    setCutout(null)
    setResult(null)
    setSheet(null)
    setStatus('idle')
    setPhase(null)
    setModelProgress(null)
  }, [])

  const handleFile = useCallback((file: File) => {
    setErrorInfo(null)
    invalidate()
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setSource({ file, url, img })
      setCrop({ zoom: 1, cx: 0.5, cy: 0.5 })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      setErrorInfo({ code: 'file', detail: isZh ? '图片无法解码，请换一张 JPG/PNG/WebP' : 'Could not decode this image — try a JPG/PNG/WebP' })
    }
    img.src = url
  }, [invalidate, isZh])

  const resetAll = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    setSource(null)
    setCrop({ zoom: 1, cx: 0.5, cy: 0.5 })
    setErrorInfo(null)
    invalidate()
  }, [source, invalidate])

  // 预览画布：按当前取景框绘制
  useEffect(() => {
    const canvas = previewRef.current
    if (!canvas || !source) return
    const w = Math.min(600, Math.max(280, preset.width * 2))
    const h = Math.round(w / aspect)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const r = sourceRect(source.img.naturalWidth, source.img.naturalHeight, aspect, crop)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(source.img, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h)
    // status 用于在「重新调整」把画布重新挂载后补画
  }, [source, preset.width, aspect, crop, status])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!source) return
    const canvas = e.currentTarget
    const r = sourceRect(source.img.naturalWidth, source.img.naturalHeight, aspect, crop)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      sx: r.sx,
      sy: r.sy,
      sw: r.sw,
      cssW: canvas.clientWidth || 1,
      pointerId: e.pointerId,
    }
    canvas.setPointerCapture?.(e.pointerId)
  }, [source, aspect, crop])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current
    if (!d || !source || d.pointerId !== e.pointerId) return
    const iw = source.img.naturalWidth
    const ih = source.img.naturalHeight
    const scale = d.sw / d.cssW // CSS px → 原图像素
    const maxSx = Math.max(0, iw - d.sw)
    const maxSy = Math.max(0, ih - (d.sw / aspect))
    const nx = Math.min(Math.max(0, d.sx - (e.clientX - d.startX) * scale), maxSx)
    const ny = Math.min(Math.max(0, d.sy - (e.clientY - d.startY) * scale), maxSy)
    setCrop({
      zoom: crop.zoom,
      cx: (nx + d.sw / 2) / iw,
      cy: (ny + (d.sw / aspect) / 2) / ih,
    })
  }, [source, aspect, crop.zoom])

  const endDrag = useCallback(() => { dragRef.current = null }, [])

  // 切换尺寸会改变裁切比例，旧结果作废
  const choosePreset = useCallback((key: string) => {
    if (key === presetKey) return
    setPresetKey(key)
    invalidate()
  }, [presetKey, invalidate])

  // 模型输出 → 合成最终照片；换底色/格式只重新合成，不重跑模型
  useEffect(() => {
    if (!cutout) return
    let cancelled = false
    setStatus('processing')
    setPhase('run')
    composeOnBackground(cutout, bgColor, format)
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        setResult({ blob, url, w: preset.width, h: preset.height })
        setStatus('done')
        setPhase(null)
        if (!generateTracked.current) {
          generateTracked.current = true
          trackIdPhotoEvent('generate')
        }
      })
      .catch((e) => {
        if (cancelled) return
        setStatus('error')
        setPhase(null)
        setErrorInfo({ code: 'internal', detail: formatAiErrorDetail(e) })
        trackIdPhotoEvent('error')
      })
    return () => { cancelled = true }
  }, [cutout, bgColor, format, preset.width, preset.height])

  const generate = useCallback(async () => {
    if (!source) return
    const supportIssue = detectAiSupportIssue()
    if (supportIssue) {
      setStatus('error')
      setErrorInfo({ code: 'unsupported', detail: supportIssue })
      return
    }

    try {
      setErrorInfo(null)
      setSheet(null)
      setStatus('processing')
      setPhase('model')
      setModelProgress(null)

      // 按目标像素尺寸裁切（300 DPI 标准尺寸）
      const canvas = document.createElement('canvas')
      canvas.width = preset.width
      canvas.height = preset.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      const r = sourceRect(source.img.naturalWidth, source.img.naturalHeight, aspect, crop)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source.img, r.sx, r.sy, r.sw, r.sh, 0, 0, preset.width, preset.height)

      const cropped = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png')
      })
      const buffer = await cropped.arrayBuffer()

      const out = await cutoutPortrait(buffer, (p) => {
        setPhase(p.phase)
        if (p.phase === 'model' && (p.total ?? 0) > 0) {
          setModelProgress({ done: p.done ?? 0, total: p.total ?? 0, cached: !!p.cached })
        }
      })
      setModelProgress(null)
      setPhase(null)
      setCutout(out) // 合成交给上方 effect
    } catch (e) {
      const code: AiErrorCode = e instanceof AiError ? e.code : 'internal'
      setStatus('error')
      setPhase(null)
      setModelProgress(null)
      setErrorInfo({ code, detail: formatAiErrorDetail(e) })
      trackIdPhotoEvent('error')
    }
  }, [source, preset.width, preset.height, aspect, crop])

  const download = useCallback(() => {
    if (!result) return
    const bgKey = BG_COLORS.find((c) => c.color.toLowerCase() === bgColor.toLowerCase())?.key || 'custom'
    const name = `id-photo-${preset.key}-${bgKey}.${format === 'jpeg' ? 'jpg' : 'png'}`
    downloadBlob(result.blob, name)
    trackIdPhotoEvent('download')
  }, [result, bgColor, preset.key, format])

  const makeSheet = useCallback(async () => {
    if (!result || sheetBusy) return
    try {
      setSheetBusy(true)
      setErrorInfo(null)
      const s = await composePrintSheet(result.blob)
      setSheet({ ...s, url: URL.createObjectURL(s.blob) })
    } catch (e) {
      setErrorInfo({ code: 'internal', detail: formatAiErrorDetail(e) })
    } finally {
      setSheetBusy(false)
    }
  }, [result, sheetBusy])

  const downloadSheet = useCallback(() => {
    if (!sheet) return
    downloadBlob(sheet.blob, `id-photo-sheet-6inch-${preset.key}.jpg`)
    trackIdPhotoEvent('download')
  }, [sheet, preset.key])

  const busy = status === 'processing'
  const modelPct =
    modelProgress && modelProgress.total > 0
      ? Math.min(100, Math.round((modelProgress.done / modelProgress.total) * 100))
      : 0
  const busyLabel =
    phase === 'model'
      ? modelProgress?.cached
        ? (isZh ? '初始化人像模型…' : 'Initializing model…')
        : modelPct >= 100
          ? (isZh ? '模型下载完成，初始化中…' : 'Model downloaded — initializing…')
          : modelPct > 0
            ? (isZh ? `下载人像模型 ${modelPct}%` : `Downloading model ${modelPct}%`)
            : (isZh ? `加载人像模型（首次约 ${MODEL_SIZE_MB}MB）…` : `Loading model (~${MODEL_SIZE_MB}MB first time)…`)
      : (isZh ? '生成证件照…' : 'Generating photo…')

  const presetLabel = (p: IdPhotoPreset) => (isZh ? p.labelZh : p.labelEn)
  const presetSize = (p: IdPhotoPreset) => (isZh ? p.sizeZh : p.sizeEn)

  // ─── 上传 ───
  if (!source) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <ImageDrop
          isZh={isZh}
          accept="image/jpeg,image/png,image/webp,image/bmp"
          hint={isZh
            ? `上传一张正脸照片（手机自拍也可以）。单张最大 30MB，图片不会上传服务器。`
            : `Upload a front-facing portrait (a phone selfie works). Up to 30MB — the image never leaves your device.`}
          maxBytes={MAX_FILE_BYTES}
          icon={<ScanFace className="h-6 w-6" />}
          onFile={handleFile}
          error={errorInfo?.code === 'file' ? errorInfo.detail : null}
        />
        <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
          {isZh
            ? '提示：正脸、光线均匀、背景简单的照片效果最好。上传后可以拖动和缩放取景。'
            : 'Tip: a front-facing photo with even light and a simple background works best. You can pan and zoom after uploading.'}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-4">
        {/* 取景 / 结果 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            {result && status === 'done' ? (
              <div className="space-y-2">
                <div className="flex justify-center">
                  <img
                    src={result.url}
                    alt={isZh ? '证件照预览' : 'ID photo preview'}
                    className="max-h-[420px] max-w-full rounded-lg border border-gray-200"
                    style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                  />
                </div>
                <p className="text-[11px] text-center text-neutral-400 tabular-nums">
                  {preset.width}×{preset.height}px · 300DPI · {presetLabel(preset)} {presetSize(preset)}
                </p>
              </div>
            ) : (
              <div className="relative select-none">
                <canvas
                  ref={previewRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  aria-label={isZh ? '照片取景：拖动调整位置' : 'Photo crop: drag to reposition'}
                  className="w-full rounded-lg border border-gray-200 touch-none cursor-grab active:cursor-grabbing bg-gray-100"
                  style={{ aspectRatio: `${preset.width} / ${preset.height}` }}
                />
                {showGuides && (
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    {/* 头顶 / 下巴参考线（不同尺寸的头部比例不同） */}
                    <div className="absolute inset-x-0 border-t border-dashed border-cyan-400/90 drop-shadow" style={{ top: `${preset.guideTop * 100}%` }} />
                    <div className="absolute inset-x-0 border-t border-dashed border-cyan-400/90 drop-shadow" style={{ bottom: `${(1 - preset.guideBottom) * 100}%` }} />
                    {/* 头部椭圆 */}
                    <div
                      className="absolute left-1/2 w-[64%] -translate-x-1/2 rounded-[50%] border border-dashed border-cyan-400/70"
                      style={{ top: `${preset.guideTop * 100}%`, bottom: `${(1 - preset.guideBottom) * 100}%` }}
                    />
                    {/* 中线 */}
                    <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-cyan-400/50" />
                    <span
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-full pb-1 text-[10px] font-medium text-cyan-600 whitespace-nowrap"
                      style={{ top: `${preset.guideTop * 100}%` }}
                    >
                      {isZh ? '头顶' : 'Head top'}
                    </span>
                    <span
                      className="absolute left-1/2 -translate-x-1/2 translate-y-full pt-1 text-[10px] font-medium text-cyan-600 whitespace-nowrap"
                      style={{ bottom: `${(1 - preset.guideBottom) * 100}%` }}
                    >
                      {isZh ? '下巴' : 'Chin'}
                    </span>
                  </div>
                )}
                {busy && (
                  <div className="absolute inset-0 rounded-lg bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
                    <span className="text-xs font-medium text-neutral-700">{busyLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 缩放 + 参考线 */}
          {!(result && status === 'done') && (
            <div className="rounded-2xl border border-gray-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-xs font-medium text-neutral-500 whitespace-nowrap">{isZh ? '缩放' : 'Zoom'}</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.02}
                  value={crop.zoom}
                  onChange={(e) => setCrop((c) => ({ ...c, zoom: Number(e.target.value) }))}
                  aria-label={isZh ? '缩放取景' : 'Zoom crop'}
                  className="flex-1 accent-cyan-600"
                />
                <span className="text-xs text-neutral-500 tabular-nums w-10 text-right">{Math.round(crop.zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setCrop({ zoom: 1, cx: 0.5, cy: 0.5 })}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-cyan-600 hover:bg-cyan-50"
                  aria-label={isZh ? '重置取景' : 'Reset crop'}
                  title={isZh ? '重置取景' : 'Reset crop'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-neutral-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGuides}
                  onChange={(e) => setShowGuides(e.target.checked)}
                  className="accent-cyan-600"
                />
                {isZh ? '显示构图参考线（头顶 / 下巴）' : 'Show head & chin guides'}
              </label>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {isZh
                  ? '拖动照片调整位置，让头顶贴近上方虚线、下巴靠近下方虚线。正脸居中效果最好。'
                  : 'Drag the photo so the head top sits near the upper line and the chin near the lower line. Centered, front-facing photos work best.'}
              </p>
            </div>
          )}
        </div>

        {/* 设置 / 操作 */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {isZh ? '证件照尺寸' : 'Photo size'}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {ID_PHOTO_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => choosePreset(p.key)}
                    className={`px-1 py-2 rounded-lg border text-center transition-all ${
                      p.key === presetKey
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                        : 'border-gray-200 text-neutral-600 hover:border-cyan-300'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{presetLabel(p)}</span>
                    <span className="block text-[10px] opacity-70 mt-0.5">{presetSize(p)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                {isZh ? '背景颜色' : 'Background'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {BG_COLORS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setBgColor(c.color)}
                    aria-label={isZh ? c.zh : c.en}
                    title={isZh ? c.zh : c.en}
                    style={{ backgroundColor: c.color }}
                    className={`w-8 h-8 rounded-full border transition-transform hover:scale-110 ${
                      c.color === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'
                    } ${bgColor.toLowerCase() === c.color.toLowerCase() ? 'ring-2 ring-cyan-500 ring-offset-2' : ''}`}
                  />
                ))}
                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-300 text-xs text-neutral-600 cursor-pointer hover:border-cyan-300">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  {isZh ? '自定义' : 'Custom'}
                </label>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
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
              <p className="mt-1.5 text-[11px] text-neutral-400">
                {isZh ? '报名/上传系统通常要求 JPG。' : 'Most application systems require JPG.'}
              </p>
            </div>

            {!(result && status === 'done') && (
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                {busy ? busyLabel : (isZh ? '生成证件照' : 'Generate ID photo')}
              </button>
            )}

            {result && status === 'done' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={download}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90"
                >
                  <Download className="w-4 h-4" />
                  {isZh ? `下载证件照（${format === 'jpeg' ? 'JPG' : 'PNG'}）` : `Download photo (${format === 'jpeg' ? 'JPG' : 'PNG'})`}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setCutout(null); setResult(null); setSheet(null); setStatus('idle') }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-neutral-700 hover:border-cyan-300"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> {isZh ? '重新调整' : 'Adjust'}
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 text-sm text-neutral-700 hover:border-cyan-300"
                  >
                    <ImagePlus className="w-4 h-4" /> {isZh ? '换图' : 'New photo'}
                  </button>
                </div>
              </div>
            )}

            {busy && phase === 'model' && modelProgress && (
              <ModelDownloadBar
                done={modelProgress.done}
                total={modelProgress.total}
                cached={modelProgress.cached}
                isZh={isZh}
              />
            )}

            <p className="text-[11px] text-neutral-400 flex items-start gap-1.5 leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              {isZh
                ? `人像分割在浏览器本地完成，照片不会上传。首次使用需下载约 ${MODEL_SIZE_MB}MB 模型（之后走浏览器缓存）。`
                : `Portrait segmentation runs locally — your photo is never uploaded. The first run downloads a ~${MODEL_SIZE_MB}MB model once; later runs use the browser cache.`}
            </p>
          </div>

          {/* 排版打印 */}
          {result && status === 'done' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  {isZh ? '排版打印' : 'Print sheet'}
                </p>
                {!isPro && !proLoading && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    <Lock className="w-3 h-3" /> Pro
                  </span>
                )}
              </div>
              {isPro ? (
                <>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    {isZh
                      ? '把这张照片排到 6 寸相纸（4×6 英寸，300DPI）上，自动计算张数并带裁切线，冲洗后剪开即可。'
                      : 'Arrange copies on a 6×4 inch sheet at 300 DPI with cut guides — print, then cut them apart.'}
                  </p>
                  {!sheet ? (
                    <button
                      type="button"
                      onClick={makeSheet}
                      disabled={sheetBusy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-300 bg-cyan-50 text-cyan-700 font-semibold hover:bg-cyan-100 disabled:opacity-60"
                    >
                      {sheetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      {sheetBusy ? (isZh ? '排版中…' : 'Building sheet…') : (isZh ? '生成 6 寸排版图' : 'Create print sheet')}
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <img
                        src={sheet.url}
                        alt={isZh ? '排版预览' : 'Print sheet preview'}
                        className="w-full rounded-lg border border-gray-200"
                      />
                      <p className="text-[11px] text-neutral-400 text-center tabular-nums">
                        {isZh
                          ? `6 寸相纸 · ${sheet.cols} 列 × ${sheet.rows} 行 · 共 ${sheet.copies} 张`
                          : `6-inch sheet · ${sheet.cols}×${sheet.rows} · ${sheet.copies} photos`}
                      </p>
                      <button
                        type="button"
                        onClick={downloadSheet}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90"
                      >
                        <Download className="w-4 h-4" /> {isZh ? '下载排版图（JPG）' : 'Download sheet (JPG)'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
                  <p className="text-xs text-amber-800">
                    {isZh
                      ? '排版打印（6 寸相纸多张 + 裁切线）是 Pro 功能，单张证件照下载免费。'
                      : 'Print sheets (multiple copies + cut guides) are a Pro feature. Single-photo download is free.'}
                  </p>
                  <a
                    href={`/${locale}/pro`}
                    className={`inline-block mt-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:opacity-90`}
                  >
                    {isZh ? (isCn ? '升级 Pro（¥9.9）→' : '升级 Pro →') : 'Upgrade to Pro →'}
                  </a>
                </div>
              )}
            </div>
          )}

          {source && !result && (
            <button
              type="button"
              onClick={resetAll}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-neutral-500 hover:text-red-500 hover:border-red-200"
            >
              <Trash2 className="w-4 h-4" /> {isZh ? '清除照片' : 'Clear photo'}
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {errorInfo && errorInfo.code !== 'file' && (() => {
        const copy = aiErrorCopy(errorInfo.code, isZh)
        return (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">{copy.title}</p>
            {copy.hint && <p className="mt-1 text-sm text-red-600">{copy.hint}</p>}
            {errorInfo.detail && (
              <p className="mt-1 text-[11px] text-red-400 break-all">{errorInfo.detail}</p>
            )}
            {isRetryableAiError(errorInfo.code) && (
              <button
                type="button"
                onClick={generate}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" /> {isZh ? '重试' : 'Retry'}
              </button>
            )}
          </div>
        )
      })()}

      <p className="text-[11px] text-center text-neutral-400 leading-relaxed">
        {isZh
          ? '各地、各国证件照的尺寸、底色和头部比例要求不同，提交前请以受理机构的官方要求为准。'
          : 'Photo size, background and head-ratio rules differ by country and agency — always check the official requirements before submitting.'}
      </p>
    </div>
  )
}
