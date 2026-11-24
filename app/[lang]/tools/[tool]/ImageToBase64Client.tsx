'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Link as LinkIcon, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { ImageDrop } from '@/components/tools/ImageDrop'

type View = 'uri' | 'base64' | 'html' | 'css'

interface Loaded {
  file: File
  dataUrl: string
  width: number
  height: number
}

const MAX_BYTES = 5 * 1024 * 1024

function formatKB(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)}MB`
    : `${(bytes / 1024).toFixed(1)}KB`
}

export default function ImageToBase64Client() {
  const { locale } = useT()
  const isZh = locale === 'zh'

  const [source, setSource] = useState<Loaded | null>(null)
  const [view, setView] = useState<View>('uri')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const loadFile = (file: File) => {
    setError(null)
    setCopied(false)
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const img = new Image()
      img.onload = () => {
        setSource({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = () => {
        setSource({ file, dataUrl, width: 0, height: 0 })
      }
      img.src = dataUrl
    }
    reader.onerror = () => {
      setError(isZh ? '读取文件失败，请重试。' : 'Could not read this file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const rawBase64 = source ? source.dataUrl.split(',')[1] || '' : ''
  const htmlSnippet = source
    ? `<img src="${source.dataUrl}" alt=""${source.width ? ` width="${source.width}" height="${source.height}"` : ''} />`
    : ''
  const cssSnippet = source ? `.element {\n  background-image: url("${source.dataUrl}");\n  background-size: cover;\n}` : ''

  const text =
    view === 'uri' ? source?.dataUrl || '' : view === 'base64' ? rawBase64 : view === 'html' ? htmlSnippet : cssSnippet

  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 旧浏览器兜底
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    if (copyTimer.current) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800)
  }

  if (!source) {
    return (
      <ImageDrop
        isZh={isZh}
        maxBytes={MAX_BYTES}
        accept="image/*"
        icon={<LinkIcon className="h-6 w-6" />}
        onFile={loadFile}
        error={error}
        hint={
          isZh
            ? '支持 PNG / JPG / WebP / GIF / SVG，最大 5MB。适合图标和较小的图片'
            : 'PNG / JPG / WebP / GIF / SVG, up to 5MB. Best for icons and small images'
        }
      />
    )
  }

  const overhead = Math.max(0, text.length - source.file.size)
  const views: { key: View; label: string }[] = [
    { key: 'uri', label: 'Data URI' },
    { key: 'base64', label: 'Base64' },
    { key: 'html', label: 'HTML' },
    { key: 'css', label: 'CSS' },
  ]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <LinkIcon className="h-4 w-4 flex-shrink-0 text-cyan-600" />
            <span className="max-w-[180px] truncate text-sm font-semibold text-neutral-900 sm:max-w-[320px]">
              {source.file.name}
            </span>
            <span className="hidden text-xs text-neutral-500 sm:inline">
              {source.width ? `${source.width} × ${source.height}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSource(null)
              setError(null)
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isZh ? '换一张' : 'Change'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-4 py-4">
          <img
            src={source.dataUrl}
            alt=""
            className="h-20 max-w-[160px] rounded-lg border border-gray-200 bg-[linear-gradient(45deg,#f3f4f6_25%,transparent_25%,transparent_75%,#f3f4f6_75%),linear-gradient(45deg,#f3f4f6_25%,#fff_25%,#fff_75%,#f3f4f6_75%)] bg-[length:12px_12px] bg-[position:0_0,6px_6px] object-contain"
          />
          <div className="space-y-1 text-xs text-neutral-600">
            <p>
              {isZh ? '原始文件' : 'Original'}: <span className="font-semibold text-neutral-900">{formatKB(source.file.size)}</span>
            </p>
            <p>
              {isZh ? '编码后约' : 'Encoded'}: <span className="font-semibold text-neutral-900">{formatKB(text.length)}</span>
              <span className="ml-1 text-neutral-500">(+{formatKB(overhead)})</span>
            </p>
            <p className="text-neutral-500">
              {isZh ? 'Base64 通常比原文件大 33% 左右' : 'Base64 is usually about 33% larger than the file'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            {views.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setView(v.key)
                  setCopied(false)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                  view === v.key ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-gray-50"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? (isZh ? '已复制' : 'Copied') : isZh ? '复制' : 'Copy'}
          </button>
        </div>

        <textarea
          readOnly
          value={text}
          spellCheck={false}
          className="h-52 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-neutral-800 outline-none focus:border-cyan-400"
          aria-label={isZh ? 'Base64 输出' : 'Base64 output'}
        />

        <p className="text-xs text-neutral-500">
          {isZh
            ? 'Data URI 适合内联小图标，可省掉一次请求；大图片会明显撑大 HTML/CSS，建议仍用 URL 引用。'
            : 'Data URIs are great for tiny inline icons and save a request; large images bloat HTML/CSS, so keep using URLs for those.'}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  )
}
