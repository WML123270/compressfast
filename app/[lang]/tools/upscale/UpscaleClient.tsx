'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Sparkles, Download, Loader2, Lock, Trash2, ImagePlus } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'
import { upscaleImage } from '@/lib/ai/upscale'

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'

export default function UpscaleClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const { isPro, checkProStatus } = useCompressionStore()

  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  const [original, setOriginal] = useState<string | null>(null)
  const [originalName, setOriginalName] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [resultDims, setResultDims] = useState<{ w: number; h: number } | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [scale, setScale] = useState<2 | 4>(4)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(isZh ? '请选择图片文件' : 'Please select an image file')
      return
    }
    setError('')
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setOriginalName(file.name)
    setOriginal(URL.createObjectURL(file))
  }, [isZh])

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

    try {
      setError('')
      setStatus('loading-model')
      const buf = await file.arrayBuffer()
      setStatus('processing')
      const { blob } = await upscaleImage(buf, scale)
      setResult(URL.createObjectURL(blob))
      // 读取放大后尺寸用于展示
      try {
        const bmp = await createImageBitmap(blob)
        setResultDims({ w: bmp.width, h: bmp.height })
        bmp.close()
      } catch { setResultDims(null) }
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : (isZh ? '放大失败' : 'Failed to upscale'))
    }
  }, [originalName, isZh, scale])

  const reset = useCallback(() => {
    setOriginal(null)
    setOriginalName('')
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = originalName.replace(/\.[^.]+$/, '') + `-${scale}x.png`
    a.click()
  }, [result, originalName, scale])

  // 切换倍数后清空旧结果，避免 2x/4x 结果混淆
  const changeScale = useCallback((next: 2 | 4) => {
    if (next === scale) return
    setScale(next)
    setResult(null)
    setResultDims(null)
    setStatus('idle')
    setError('')
  }, [scale])

  const locked = !isPro
  const busy = status === 'loading-model' || status === 'processing'

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
              {status === 'loading-model'
                ? (isZh ? '加载模型中…' : 'Loading model…')
                : status === 'processing'
                  ? (isZh ? '放大中…' : 'Upscaling…')
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
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Pro 门控提示 */}
      {locked && original && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="inline-flex items-center gap-2 font-medium text-amber-800">
            <Lock className="w-4 h-4" />
            {isZh ? 'AI 放大是 Pro 专属功能' : 'AI upscaling is a Pro feature'}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            {isZh ? '升级 Pro 解锁本地 AI 放大，永久买断。' : 'Upgrade to Pro to unlock local AI upscaling.'}
          </p>
          <a href={`/${locale}/pro`} className="inline-block mt-3 px-5 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:opacity-90">
            {isZh ? '升级 Pro →' : 'Upgrade to Pro →'}
          </a>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="relative">
            <img
              src={result}
              alt="result"
              className="w-full max-h-96 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]"
            />
          </div>
          <div className="p-4 flex flex-col items-center gap-2">
            {resultDims && (
              <p className="text-xs text-gray-500">
                {isZh ? '已放大到' : 'Upscaled to'} <span className="font-semibold text-gray-700">{resultDims.w}×{resultDims.h}</span>
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
