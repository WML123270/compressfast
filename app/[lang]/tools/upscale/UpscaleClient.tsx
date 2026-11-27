'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Sparkles, Download, Loader2, Lock, Trash2, ImagePlus, RotateCw } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { useCompressionStore } from '@/lib/store/compression-store'
import { upscaleImage, preloadUpscaleModel } from '@/lib/ai/upscale'
import ModelDownloadBar from '@/components/ai/ModelDownloadBar'
import { AiError, aiErrorCopy, formatAiErrorDetail, isRetryableAiError, type AiErrorCode } from '@/lib/ai/ai-error'
import { detectAiSupportIssue } from '@/lib/ai/support'
import { trackAiEvent } from '@/lib/ai/analytics'
import { trackPro } from '@/lib/pro-funnel'

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'
type UiError = { code: AiErrorCode | 'file'; detail?: string }

// 与压缩工具的单文件上限保持一致，避免超大文件先解码再 OOM
const MAX_FILE_BYTES = 30 * 1024 * 1024

export default function UpscaleClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const isCn = useIsCn()
  const proPrice = isCn ? '¥9.9' : '$24.99'
  const { isPro, proLoading, checkProStatus } = useCompressionStore()

  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  // AI 埋点：曝光 / Pro 门控曝光（只记一次）
  const viewTracked = useRef(false)
  const gateTracked = useRef(false)
  useEffect(() => {
    if (viewTracked.current) return
    viewTracked.current = true
    trackAiEvent('view', 'upscale')
  }, [])
  useEffect(() => {
    if (proLoading || isPro || gateTracked.current) return
    gateTracked.current = true
    trackAiEvent('gate', 'upscale')
  }, [proLoading, isPro])

  const [original, setOriginal] = useState<string | null>(null)
  const [originalName, setOriginalName] = useState('')
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorInfo, setErrorInfo] = useState<UiError | null>(null)
  const [dragging, setDragging] = useState(false)
  const [scale, setScale] = useState<2 | 4>(4)
  const [phase, setPhase] = useState<'model' | 'run' | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [modelProgress, setModelProgress] = useState<{ done: number; total: number; cached: boolean } | null>(null)
  const [comparePos, setComparePos] = useState(50)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorInfo({ code: 'file', detail: isZh ? '请选择图片文件' : 'Please select an image file' })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorInfo({
        code: 'file',
        detail: isZh ? '文件超过 30MB，请先压缩后再放大' : 'File is larger than 30MB — compress it first',
      })
      return
    }
    setErrorInfo(null)
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setPhase(null)
    setProgress(null)
    setModelProgress(null)
    setOriginalName(file.name)
    setOriginal(URL.createObjectURL(file))
    setOriginalDims(null)
    try {
      const bmp = await createImageBitmap(file)
      setOriginalDims({ w: bmp.width, h: bmp.height })
      bmp.close()
    } catch { /* 读取尺寸失败不影响放大 */ }
  }, [isZh])

  // 用户已选图且是 Pro：提前下载约 5MB 模型，点「放大」时不用再等
  useEffect(() => {
    if (!originalName || proLoading || !isPro) return
    if (detectAiSupportIssue()) return
    preloadUpscaleModel()
  }, [originalName, proLoading, isPro])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const run = useCallback(async () => {
    if (!originalName) return
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    const supportIssue = detectAiSupportIssue()
    if (supportIssue) {
      setStatus('error')
      setErrorInfo({ code: 'unsupported', detail: supportIssue })
      return
    }

    const startedAt = performance.now()
    trackAiEvent('start', 'upscale', { scale })

    try {
      setErrorInfo(null)
      setProgress(null)
      setModelProgress(null)
      setPhase(null)
      setStatus('loading-model')
      const buf = await file.arrayBuffer()
      setStatus('processing')
      const { blob } = await upscaleImage(buf, scale, (p) => {
        setPhase(p.phase)
        if (p.phase === 'model') {
          if (p.total > 0) {
            setModelProgress({ done: p.done, total: p.total, cached: !!p.cached })
          }
        } else {
          setModelProgress(null)
          if (p.total > 0) setProgress({ done: p.done, total: p.total })
        }
      })
      setProgress(null)
      setModelProgress(null)
      setPhase(null)
      setComparePos(50)
      setResult(URL.createObjectURL(blob))
      // 读取放大后尺寸用于展示
      try {
        const bmp = await createImageBitmap(blob)
        setResultDims({ w: bmp.width, h: bmp.height })
        bmp.close()
      } catch { setResultDims(null) }
      setStatus('done')
      trackAiEvent('success', 'upscale', { scale, durationMs: Math.round(performance.now() - startedAt) })
    } catch (e) {
      const code: AiErrorCode = e instanceof AiError ? e.code : 'internal'
      setStatus('error')
      setPhase(null)
      setProgress(null)
      setModelProgress(null)
      setErrorInfo({ code, detail: formatAiErrorDetail(e) })
      trackAiEvent('error', 'upscale', { scale, errorCode: code })
    }
  }, [originalName, scale])

  const reset = useCallback(() => {
    setOriginal(null)
    setOriginalName('')
    setOriginalDims(null)
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setErrorInfo(null)
    setPhase(null)
    setProgress(null)
    setModelProgress(null)
    setComparePos(50)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = originalName.replace(/\.[^.]+$/, '') + `-${scale}x.png`
    a.click()
    trackAiEvent('download', 'upscale', { scale })
  }, [result, originalName, scale])

  // 切换倍数后清空旧结果，避免 2x/4x 结果混淆
  const changeScale = useCallback((next: 2 | 4) => {
    if (next === scale) return
    setScale(next)
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setErrorInfo(null)
    setPhase(null)
    setProgress(null)
    setModelProgress(null)
  }, [scale])

  const locked = !isPro
  const busy = status === 'loading-model' || status === 'processing'
  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0
  const modelPct =
    modelProgress && modelProgress.total > 0
      ? Math.min(100, Math.round((modelProgress.done / modelProgress.total) * 100))
      : 0
  const busyLabel =
    phase === 'model'
      ? modelProgress?.cached
        ? (isZh ? '模型已缓存，初始化中…' : 'Initializing cached model…')
        : modelPct >= 100
          ? (isZh ? '模型下载完成，初始化中…' : 'Model downloaded — initializing…')
          : modelPct > 0
            ? (isZh ? `下载 AI 模型 ${modelPct}%` : `Downloading AI model ${modelPct}%`)
            : (isZh ? '加载 AI 模型（首次约 5MB）…' : 'Loading AI model (~5MB first time)…')
      : phase === 'run'
        ? pct > 0
          ? (isZh ? `放大中 ${pct}%` : `Upscaling ${pct}%`)
          : (isZh ? '放大中…' : 'Upscaling…')
        : (isZh ? '准备中…' : 'Preparing…')
  // 与 worker 的 MAX_LONG_EDGE 保持一致
  const MAX_LONG_EDGE = 512
  const needsDownscale = !!originalDims && Math.max(originalDims.w, originalDims.h) > MAX_LONG_EDGE
  const downscaledDims = originalDims
    ? (() => {
        const k = MAX_LONG_EDGE / Math.max(originalDims.w, originalDims.h)
        return { w: Math.max(1, Math.round(originalDims.w * k)), h: Math.max(1, Math.round(originalDims.h * k)) }
      })()
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* 上传区 */}
      {!original && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-300 bg-white/50 hover:border-cyan-300'
          }`}
        >
          <Upload className="w-10 h-10 mx-auto text-gray-400" />
          <p className="mt-3 font-medium text-gray-700">
            {isZh ? '拖入图片，或点击上传' : 'Drop an image or click to upload'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {isZh ? 'AI 无损放大 2x / 4x · 100% 本地处理，图片不上传' : 'AI 2x / 4x upscale · 100% local, image never leaves your device'}
          </p>
        </div>
      )}

      {/* 原图预览 + 操作 */}
      {original && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="relative">
            <img src={original} alt="original" className="w-full max-h-72 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]" />
          </div>
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* 放大倍数选择 */}
            <div
              className="inline-flex items-center rounded-lg border border-gray-300 p-0.5"
              role="group"
              aria-label={isZh ? '放大倍数' : 'Upscale factor'}
            >
              {([2, 4] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => changeScale(s)}
                  disabled={busy}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 ${
                    scale === s ? 'bg-cyan-500 text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button
              onClick={run}
              disabled={locked || busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading-model' || status === 'processing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {busy
                ? busyLabel
                : locked
                  ? (isZh ? 'Pro 专属功能' : 'Pro Only')
                  : (isZh ? `AI 放大 ${scale}x` : `AI Upscale ${scale}x`)}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:border-cyan-300">
              <ImagePlus className="w-4 h-4" /> {isZh ? '换图' : 'Change'}
            </button>
            <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:text-red-500">
              <Trash2 className="w-4 h-4" /> {isZh ? '清除' : 'Clear'}
            </button>
          </div>
          {busy && phase === 'model' && modelProgress && (
            <div className="px-4 pb-3">
              <ModelDownloadBar
                done={modelProgress.done}
                total={modelProgress.total}
                cached={modelProgress.cached}
                isZh={isZh}
              />
            </div>
          )}
          {needsDownscale && originalDims && downscaledDims && (
            <p className="px-4 pb-4 text-xs leading-relaxed text-amber-700">
              {isZh
                ? `原图 ${originalDims.w}×${originalDims.h} 超过本地处理上限，将先等比缩至 ${downscaledDims.w}×${downscaledDims.h} 再放大，输出最长边 ${MAX_LONG_EDGE * scale}px。`
                : `The original ${originalDims.w}×${originalDims.h} exceeds the on-device limit. It will be resized to ${downscaledDims.w}×${downscaledDims.h} before upscaling (max output edge ${MAX_LONG_EDGE * scale}px).`}
            </p>
          )}
        </div>
      )}

      {/* 错误提示：可分类 + 可重试（Worker 已自动重置） */}
      {errorInfo && (() => {
        const copy = errorInfo.code === 'file'
          ? { title: errorInfo.detail || '', hint: '' }
          : aiErrorCopy(errorInfo.code, isZh)
        return (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-700">{copy.title}</p>
            {copy.hint && <p className="mt-1 text-sm text-red-600">{copy.hint}</p>}
            {errorInfo.code !== 'file' && errorInfo.detail && (
              <p className="mt-1 text-[11px] text-red-400 break-all">{errorInfo.detail}</p>
            )}
            {errorInfo.code !== 'file' && isRetryableAiError(errorInfo.code) && (
              <button
                onClick={run}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                <RotateCw className="w-4 h-4" /> {isZh ? '重试' : 'Retry'}
              </button>
            )}
          </div>
        )
      })()}

      {/* Pro 门控提示 */}
      {locked && original && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="inline-flex items-center gap-2 font-medium text-amber-800">
            <Lock className="w-4 h-4" />
            {isZh ? 'AI 放大是 Pro 专属功能' : 'AI upscaling is a Pro feature'}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            {isZh
              ? `${proPrice} 永久解锁本地 AI 放大，另含 AI 抠图、500 张批量、AVIF 输出，5 台设备通用。`
              : `${proPrice} lifetime unlocks on-device AI upscaling plus AI cutout, 500-image batches and AVIF output for 5 devices.`}
          </p>
          <a href={`/${locale}/pro`} onClick={() => trackPro('click', 'ai_gate')} className="inline-block mt-3 px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:opacity-90">
            {isZh ? `${proPrice} 解锁 Pro →` : `Unlock Pro · ${proPrice} →`}
          </a>
          <p className="mt-2 text-[11px] text-amber-600">
            {isZh ? '图片不上传 · 7 天未激活可退款' : 'No upload · 7-day refund if unused'}
          </p>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          {/* 原图 / AI 结果对比 */}
          <div className="relative select-none">
            <img
              src={result}
              alt="result"
              className="w-full max-h-96 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]"
            />
            {original && (
              <img
                src={original}
                alt="original"
                aria-hidden
                className="absolute inset-0 w-full h-full object-contain"
                style={{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }}
              />
            )}
            {/* 分割线 */}
            <div
              className="absolute inset-y-0 pointer-events-none -translate-x-1/2 w-0.5 bg-white/90 shadow-[0_0_4px_rgba(0,0,0,0.5)]"
              style={{ left: `${comparePos}%` }}
            />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/55 text-white text-[10px] font-semibold">
              {isZh ? '原图' : 'Original'}
            </span>
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-cyan-600/85 text-white text-[10px] font-semibold">
              AI {scale}x
            </span>
          </div>
          <div className="px-4 pt-3">
            <input
              type="range"
              min={0}
              max={100}
              value={comparePos}
              onChange={(e) => setComparePos(Number(e.target.value))}
              aria-label={isZh ? '对比原图与放大结果' : 'Compare original and upscaled result'}
              className="w-full accent-cyan-500 cursor-ew-resize"
            />
            <p className="text-center text-[11px] text-gray-400 mt-1">
              {isZh ? '拖动滑块对比原图与 AI 放大效果' : 'Drag to compare original and AI result'}
            </p>
          </div>
          <div className="p-4 flex flex-col items-center gap-2">
            {resultDims && (
              <p className="text-xs text-gray-500">
                {isZh ? '已放大到' : 'Upscaled to'}{' '}
                {originalDims && <span className="text-gray-400">{originalDims.w}×{originalDims.h} → </span>}
                <span className="font-semibold text-gray-700">{resultDims.w}×{resultDims.h}</span>
              </p>
            )}
            <button onClick={download} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90">
              <Download className="w-4 h-4" /> {isZh ? '下载放大图 PNG' : 'Download upscaled PNG'}
            </button>
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="text-xs text-center text-gray-400">
          {isZh ? '放大在本地浏览器完成，图片未上传任何服务器' : 'Upscaled locally — image never uploaded'}
        </p>
      )}
    </div>
  )
}
