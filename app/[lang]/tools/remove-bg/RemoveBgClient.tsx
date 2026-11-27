'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Scissors, Download, Loader2, Lock, Trash2, ImagePlus, Palette, Image, RotateCw } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { useCompressionStore } from '@/lib/store/compression-store'
import { removeBackground } from '@/lib/ai/remove-bg'
import ModelDownloadBar from '@/components/ai/ModelDownloadBar'
import { compositeBackground, type BackgroundOption } from '@/lib/ai/composite'
import { AiError, aiErrorCopy, formatAiErrorDetail, isRetryableAiError, type AiErrorCode } from '@/lib/ai/ai-error'
import { detectAiSupportIssue } from '@/lib/ai/support'
import { trackAiEvent } from '@/lib/ai/analytics'
import { trackPro } from '@/lib/pro-funnel'

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'
type BgMode = 'transparent' | 'color' | 'image'
type UiError = { code: AiErrorCode | 'file'; detail?: string }

// 与压缩工具的单文件上限保持一致
const MAX_FILE_BYTES = 30 * 1024 * 1024
// 与 remove-bg-worker.ts 的 MAX_OUTPUT_EDGE 保持一致
const MAX_OUTPUT_EDGE = 4096
// 模型实际大小（public/models/isnet-general-use-int8.onnx，int8 量化版）
const MODEL_SIZE_MB = 45

const PRESET_COLORS = ['#ffffff', '#000000', '#ff0000', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6']

export default function RemoveBgClient() {
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
    trackAiEvent('view', 'remove-bg')
  }, [])
  useEffect(() => {
    if (proLoading || isPro || gateTracked.current) return
    gateTracked.current = true
    trackAiEvent('gate', 'remove-bg')
  }, [proLoading, isPro])

  const [original, setOriginal] = useState<string | null>(null) // 原图预览 URL
  const [originalName, setOriginalName] = useState('')
  const [result, setResult] = useState<string | null>(null) // 抠图结果（透明 PNG）预览 URL
  const [resultBlob, setResultBlob] = useState<Blob | null>(null) // 抠图结果 blob（用于背景合成）
  const [bgMode, setBgMode] = useState<BgMode>('transparent')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [bgFile, setBgFile] = useState<File | null>(null)
  const [finalBlob, setFinalBlob] = useState<Blob | null>(null) // 合成后输出 blob
  const [finalUrl, setFinalUrl] = useState<string | null>(null) // 合成后预览 URL
  const [status, setStatus] = useState<Status>('idle')
  const [errorInfo, setErrorInfo] = useState<UiError | null>(null)
  const [phase, setPhase] = useState<'model' | 'run' | null>(null)
  const [modelProgress, setModelProgress] = useState<{ done: number; total: number; cached: boolean } | null>(null)
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorInfo({ code: 'file', detail: isZh ? '请选择图片文件' : 'Please select an image file' })
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorInfo({
        code: 'file',
        detail: isZh ? '文件超过 30MB，请先压缩后再抠图' : 'File is larger than 30MB — compress it first',
      })
      return
    }
    setErrorInfo(null)
    setResult(null)
    setResultBlob(null)
    setBgMode('transparent')
    setBgColor('#ffffff')
    setBgFile(null)
    setFinalBlob(null)
    setFinalUrl(null)
    setStatus('idle')
    setPhase(null)
    setModelProgress(null)
    setOriginalDims(null)
    setOriginalName(file.name)
    setOriginal(URL.createObjectURL(file))
    try {
      const bmp = await createImageBitmap(file)
      setOriginalDims({ w: bmp.width, h: bmp.height })
      bmp.close()
    } catch { /* 读取尺寸失败不影响抠图 */ }
  }, [isZh])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const run = useCallback(async () => {
    if (!originalName) return
    // 从 input 重新读取文件得到 ArrayBuffer（原图预览 URL 不保留 buffer）
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    const supportIssue = detectAiSupportIssue()
    if (supportIssue) {
      setStatus('error')
      setErrorInfo({ code: 'unsupported', detail: supportIssue })
      return
    }

    const startedAt = performance.now()
    trackAiEvent('start', 'remove-bg')

    try {
      setErrorInfo(null)
      setPhase(null)
      setModelProgress(null)
      setStatus('loading-model')
      const buf = await file.arrayBuffer()
      setStatus('processing')
      const { blob } = await removeBackground(buf, (p) => {
        setPhase(p.phase)
        if (p.phase === 'model' && (p.total ?? 0) > 0) {
          setModelProgress({ done: p.done ?? 0, total: p.total ?? 0, cached: !!p.cached })
        }
      })
      setPhase(null)
      setModelProgress(null)
      setResultBlob(blob)
      setResult(URL.createObjectURL(blob))
      setBgMode('transparent')
      setBgColor('#ffffff')
      setBgFile(null)
      setFinalBlob(null)
      setFinalUrl(null)
      setStatus('done')
      trackAiEvent('success', 'remove-bg', { durationMs: Math.round(performance.now() - startedAt) })
    } catch (e) {
      const code: AiErrorCode = e instanceof AiError ? e.code : 'internal'
      setStatus('error')
      setPhase(null)
      setModelProgress(null)
      setErrorInfo({ code, detail: formatAiErrorDetail(e) })
      trackAiEvent('error', 'remove-bg', { errorCode: code })
    }
  }, [originalName])

  const reset = useCallback(() => {
    setOriginal(null)
    setOriginalName('')
    setResult(null)
    setResultBlob(null)
    setBgMode('transparent')
    setBgColor('#ffffff')
    setBgFile(null)
    setFinalBlob(null)
    setFinalUrl(null)
    setStatus('idle')
    setErrorInfo(null)
    setPhase(null)
    setModelProgress(null)
    setOriginalDims(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // 背景选项变化时重新合成（透明则直接用抠图原片）
  useEffect(() => {
    if (!resultBlob || bgMode === 'transparent' || (bgMode === 'image' && !bgFile)) {
      setFinalBlob(null)
      setFinalUrl(null)
      return
    }
    let cancelled = false
    const bg: BackgroundOption =
      bgMode === 'color' ? { type: 'color', color: bgColor } : { type: 'image', imageFile: bgFile! }
    ;(async () => {
      try {
        const blob = await compositeBackground(resultBlob, bg)
        if (cancelled) return
        setFinalBlob(blob)
        setFinalUrl(URL.createObjectURL(blob))
      } catch (e) {
        if (!cancelled) {
          setErrorInfo({
            code: 'run',
            detail: e instanceof Error ? e.message : (isZh ? '背景合成失败' : 'Failed to apply background'),
          })
        }
      }
    })()
    return () => { cancelled = true }
  }, [resultBlob, bgMode, bgColor, bgFile, isZh])

  const displayUrl = bgMode === 'transparent' ? result : (finalUrl || result)

  const download = useCallback(() => {
    let url = ''
    let filename = ''
    if (bgMode === 'transparent') {
      url = result || ''
      filename = originalName.replace(/\.[^.]+$/, '') + '-no-bg.png'
    } else if (finalBlob) {
      url = URL.createObjectURL(finalBlob)
      filename = originalName.replace(/\.[^.]+$/, '') + '-with-bg.png'
    }
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    if (bgMode !== 'transparent') setTimeout(() => URL.revokeObjectURL(url), 1000)
    trackAiEvent('download', 'remove-bg')
  }, [result, finalBlob, originalName, bgMode])

  const locked = !isPro
  const busy = status === 'loading-model' || status === 'processing'
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
            : (isZh ? `加载 AI 模型（首次约 ${MODEL_SIZE_MB}MB）…` : `Loading AI model (~${MODEL_SIZE_MB}MB first time)…`)
      : (isZh ? 'AI 抠图中…' : 'Removing background…')
  const needsDownscale = !!originalDims && Math.max(originalDims.w, originalDims.h) > MAX_OUTPUT_EDGE

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={bgFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) { setBgFile(f); setBgMode('image') }
        }}
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
            {isZh ? '100% 本地处理，图片不上传服务器' : '100% local processing — image never leaves your device'}
          </p>
        </div>
      )}

      {/* 原图预览 + 操作 */}
      {original && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="relative">
            <img src={original} alt="original" className="w-full max-h-80 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]" />
          </div>
          <div className="p-4 flex flex-wrap items-center gap-3">
            <button
              onClick={run}
              disabled={locked || busy}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              {busy
                ? busyLabel
                : locked
                  ? (isZh ? 'Pro 专属功能' : 'Pro Only')
                  : (isZh ? 'AI 抠图' : 'Remove Background')}
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
          {needsDownscale && originalDims && (
            <p className="px-4 pb-3 text-xs leading-relaxed text-amber-700">
              {isZh
                ? `原图 ${originalDims.w}×${originalDims.h} 超过本地处理上限，输出将等比缩小到最长边 ${MAX_OUTPUT_EDGE}px。`
                : `The original ${originalDims.w}×${originalDims.h} exceeds the on-device limit — output will be scaled to a ${MAX_OUTPUT_EDGE}px long edge.`}
            </p>
          )}
          {!locked && !busy && !result && (
            <p className="px-4 pb-4 text-[11px] text-gray-400">
              {isZh
                ? `首次使用需下载约 ${MODEL_SIZE_MB}MB AI 模型（仅一次，之后走浏览器缓存）`
                : `First run downloads a ~${MODEL_SIZE_MB}MB AI model once; later runs use the browser cache.`}
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

      {/* Pro 门控提示（非 Pro 时显示） */}
      {locked && original && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="inline-flex items-center gap-2 font-medium text-amber-800">
            <Lock className="w-4 h-4" />
            {isZh ? 'AI 抠图是 Pro 专属功能' : 'AI background removal is a Pro feature'}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            {isZh
              ? `${proPrice} 永久解锁本地 AI 抠图，另含 500 张批量、AVIF 输出、水印，5 台设备通用。`
              : `${proPrice} lifetime unlocks on-device AI cutout plus 500-image batches, AVIF output and watermarks for 5 devices.`}
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
          <div className="relative">
            <img
              src={displayUrl ?? ''}
              alt="result"
              className="w-full max-h-80 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]"
            />
          </div>

          {/* 背景选择 */}
          <div className="px-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2">{isZh ? '背景' : 'Background'}</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBgMode('transparent')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  bgMode === 'transparent' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-cyan-300'
                }`}
              >
                {isZh ? '透明' : 'Transparent'}
              </button>
              <button
                onClick={() => setBgMode('color')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  bgMode === 'color' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <Palette className="w-4 h-4" /> {isZh ? '纯色' : 'Color'}
              </button>
              <button
                onClick={() => bgFileRef.current?.click()}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  bgMode === 'image' ? 'border-cyan-500 bg-cyan-50 text-cyan-700 font-medium' : 'border-gray-300 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <Image className="w-4 h-4" /> {isZh ? '图片背景' : 'Image'}
              </button>
            </div>

            {/* 纯色 swatches */}
            {bgMode === 'color' && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBgColor(c)}
                    aria-label={c}
                    style={{ backgroundColor: c }}
                    className={`w-7 h-7 rounded-full border ${c === '#ffffff' ? 'border-gray-300' : 'border-transparent'} transition-transform hover:scale-110 ${
                      bgColor === c ? 'ring-2 ring-cyan-500 ring-offset-2' : ''
                    }`}
                  />
                ))}
                <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-300 text-xs text-gray-600 cursor-pointer hover:border-cyan-300">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  {isZh ? '自定义' : 'Custom'}
                </label>
              </div>
            )}

            {/* 图片背景提示 */}
            {bgMode === 'image' && (
              <p className="mt-2 text-xs text-gray-500">
                {bgFile
                  ? (isZh ? `背景图：${bgFile.name}` : `Background: ${bgFile.name}`)
                  : (isZh ? '点击「图片背景」选择一张背景图' : 'Click "Image" to pick a background image')}
              </p>
            )}
          </div>

          <div className="p-4 flex justify-center">
            <button onClick={download} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90">
              <Download className="w-4 h-4" />
              {bgMode === 'transparent'
                ? (isZh ? '下载透明 PNG' : 'Download transparent PNG')
                : (isZh ? '下载合成图 PNG' : 'Download PNG')}
            </button>
          </div>
        </div>
      )}

      {status === 'done' && (
        <p className="text-xs text-center text-gray-400">
          {isZh ? '抠图在本地浏览器完成，图片未上传任何服务器' : 'Background removed locally — image never uploaded'}
        </p>
      )}
    </div>
  )
}
