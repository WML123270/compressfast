'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LayoutGrid, ChevronDown } from 'lucide-react'
import { TOOL_ICONS, TOOL_SHORT } from '@/lib/tool-icons'
import { useT } from '@/lib/i18n/context'

const GROUPS: { key: string; label: { en: string; zh: string }; slugs: string[] }[] = [
  {
    key: 'ai',
    label: { en: 'AI Tools', zh: 'AI 工具' },
    slugs: ['remove-bg', 'upscale'],
  },
  {
    key: 'pdf',
    label: { en: 'PDF', zh: 'PDF 工具' },
    slugs: ['merge-pdf', 'split-pdf', 'compress-pdf', 'pdf-to-jpg', 'image-to-pdf'],
  },
  {
    key: 'compress',
    label: { en: 'Compress', zh: '压缩' },
    slugs: ['compress-png', 'compress-jpeg', 'compress-gif', 'compress-svg', 'compress-images'],
  },
  {
    key: 'to-webp',
    label: { en: 'To WebP', zh: '转 WebP' },
    slugs: ['convert-to-webp', 'jpg-to-webp', 'png-to-webp', 'gif-to-webp', 'heic-to-webp', 'avif-to-webp'],
  },
  {
    key: 'to-jpg-png',
    label: { en: 'To JPG / PNG', zh: '转 JPG / PNG' },
    slugs: [
      'convert-jpg-to-png', 'png-to-jpg', 'webp-to-png', 'webp-to-jpg', 'svg-to-png',
      'heic-to-jpg', 'heic-to-png', 'avif-to-jpg', 'avif-to-png',
    ],
  },
  {
    key: 'adjust',
    label: { en: 'Adjust & Export', zh: '调整与导出' },
    slugs: ['resize-image', 'remove-metadata', 'tinypng-alternative'],
  },
]

export function ToolsMenu() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border transition-all text-sm font-semibold ${
          open
            ? 'border-blue-400 bg-blue-50 text-blue-700'
            : 'border-gray-300 text-neutral-700 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{isZh ? '全部工具' : 'All Tools'}</span>
        <ChevronDown className={`w-3 h-3 hidden sm:inline transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Mobile click-away backdrop */}
          <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setOpen(false)} />

          <div className="absolute top-full mt-2 z-50 rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 p-4
                          left-1/2 -translate-x-1/2 w-[calc(100vw-1.5rem)] max-w-[760px]
                          sm:left-0 sm:translate-x-0 sm:w-[760px]
                          max-h-[72vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {GROUPS.map(group => (
                <div key={group.key}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2 px-1">
                    {isZh ? group.label.zh : group.label.en}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {group.slugs.map(slug => {
                      const short = TOOL_SHORT[slug]
                      if (!short) return null
                      return (
                        <Link
                          key={slug}
                          href={`/${locale}/tools/${slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-neutral-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <span className="text-sm flex-shrink-0">{TOOL_ICONS[slug] || '🔧'}</span>
                          <span className="text-[13px] leading-tight">{isZh ? short.zh : short.en}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
