'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2, ShieldCheck, X } from 'lucide-react'

interface Props {
  isZh: boolean
  /** 接受的 MIME 列表，默认常见图片 */
  accept?: string
  /** 支持格式说明 */
  hint?: string
  /** 单文件上限，默认 30MB */
  maxBytes?: number
  loading?: boolean
  icon?: ReactNode
  onFile: (file: File) => void
  error?: string | null
}

const DEFAULT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,image/avif'

/**
 * 通用图片上传区：点击 / 拖拽 / Ctrl+V 粘贴。
 * 只负责选文件与基础校验，解码和业务逻辑交给调用方。
 */
export function ImageDrop({
  isZh,
  accept = DEFAULT_ACCEPT,
  hint,
  maxBytes = 30 * 1024 * 1024,
  loading = false,
  icon,
  onFile,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const maxLabel = maxBytes >= 1024 * 1024 ? `${Math.round(maxBytes / 1024 / 1024)}MB` : `${Math.round(maxBytes / 1024)}KB`

  const pick = (file: File | undefined | null) => {
    if (!file) return
    setLocalError(null)
    if (!file.type.startsWith('image/')) {
      setLocalError(isZh ? '请选择图片文件。' : 'Please choose an image file.')
      return
    }
    if (file.size > maxBytes) {
      setLocalError(
        isZh
          ? `图片不能超过 ${maxLabel}，当前 ${(file.size / 1024 / 1024).toFixed(1)}MB。`
          : `Image must be under ${maxLabel}; this one is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
      )
      return
    }
    onFile(file)
  }

  // Ctrl/⌘+V 粘贴（页面只有一个上传区，监听全局粘贴）
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            pick(file)
            return
          }
        }
      }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isZh, maxBytes, onFile])

  const message = error || localError

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          pick(e.dataTransfer.files?.[0])
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
        }}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-12 sm:py-16 text-center transition-all ${
          dragOver
            ? 'border-cyan-500 bg-cyan-50'
            : 'border-gray-300 bg-white hover:border-cyan-400 hover:bg-cyan-50/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20">
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : icon}
        </div>
        <p className="text-base font-semibold text-neutral-900">
          {isZh ? '点击选择图片，或拖到这里' : 'Click to choose an image, or drop it here'}
        </p>
        <p className="mt-1.5 text-sm text-neutral-600">
          {hint ||
            (isZh
              ? `也可以直接 Ctrl+V 粘贴。单张最大 ${maxLabel}`
              : `You can also paste with Ctrl+V. Up to ${maxLabel} per file`)}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          {isZh ? '本地处理，图片不会上传' : 'Processed locally — images are never uploaded'}
        </p>
      </div>
      {message && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </p>
      )}
    </div>
  )
}
