'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Scissors, Download, Loader2, Lock, Trash2, ImagePlus } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'
import { removeBackground } from '@/lib/ai/remove-bg'

type Status = 'idle' | 'loading-model' | 'processing' | 'done' | 'error'

export default function RemoveBgClient() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const { isPro, checkProStatus } = useCompressionStore()

  useEffect(() => {
    checkProStatus()
  }, [checkProStatus])

  const [original, setOriginal] = useState<string | null>(null) // 原图预览 URL
  const [originalName, setOriginalName] = useState('')
  const [result, setResult] = useState<string | null>(null) // 结果预览 URL
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(isZh ? '请选择图片文件' : 'Please select an image file')
      return
    }
    setError('')
    setResult(null)
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
    // 从 input 重新读取文件得到 ArrayBuffer（原图预览 URL 不保留 buffer）
    const file = fileInputRef.current?.files?.[0]
    if (!file) return

    try {
      setError('')
      setStatus('loading-model')
      const buf = await file.arrayBuffer()
      setStatus('processing')
      const { blob } = await removeBackground(buf)
      setResult(URL.createObjectURL(blob))
      setStatus('done')
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : (isZh ? '抠图失败' : 'Failed to remove background'))
    }
  }, [originalName, isZh])

  const reset = useCallback(() => {
    setOriginal(null)
    setOriginalName('')
    setResult(null)
    setStatus('idle')
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const download = useCallback(() => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = originalName.replace(/\.[^.]+$/, '') + '-no-bg.png'
    a.click()
  }, [result, originalName])

  const locked = !isPro

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
              disabled={locked || status === 'loading-model' || status === 'processing'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading-model' || status === 'processing' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : locked ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Scissors className="w-4 h-4" />
              )}
              {status === 'loading-model'
                ? (isZh ? '加载模型中…' : 'Loading model…')
                : status === 'processing'
                  ? (isZh ? '抠图中…' : 'Removing background…')
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
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Pro 门控提示（非 Pro 时显示） */}
      {locked && original && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
          <p className="inline-flex items-center gap-2 font-medium text-amber-800">
            <Lock className="w-4 h-4" />
            {isZh ? 'AI 抠图是 Pro 专属功能' : 'AI background removal is a Pro feature'}
          </p>
          <p className="mt-1 text-sm text-amber-700">
            {isZh ? '升级 Pro 解锁本地 AI 抠图，永久买断。' : 'Upgrade to Pro to unlock local AI background removal.'}
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
              className="w-full max-h-80 object-contain bg-[repeating-conic-gradient(#e5e7eb_0%_25%,#fff_0%_50%)_0_0/16px_16px]"
            />
          </div>
          <div className="p-4 flex justify-center">
            <button onClick={download} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:opacity-90">
              <Download className="w-4 h-4" /> {isZh ? '下载透明 PNG' : 'Download transparent PNG'}
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
