'use client'

import { useState } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useT } from '@/lib/i18n/context'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import type { NamingOptions } from '@/lib/compression/types'

const PATTERNS: { value: NamingOptions['pattern']; labelZh: string; labelEn: string; example: string }[] = [
  { value: 'original_compressed', labelZh: '原名_compressed', labelEn: 'name_compressed', example: 'photo_compressed.jpg' },
  { value: 'original_min', labelZh: '原名_min', labelEn: 'name_min', example: 'photo_min.jpg' },
  { value: 'compressed_original', labelZh: 'compressed_原名', labelEn: 'compressed_name', example: 'compressed_photo.jpg' },
  { value: 'custom', labelZh: '自定义', labelEn: 'Custom', example: '{original}_min' },
]

export function NamingSettings() {
  const { t, locale } = useT()
  const { naming, setNaming, files } = useCompressionStore()
  const [expanded, setExpanded] = useState(false)

  const hasDone = files.some(f => f.status === 'done')
  if (!hasDone) return null

  const isZh = locale === 'zh'

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 font-medium text-neutral-800 hover:bg-gray-50/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-700" />
          {isZh ? '下载文件名设置' : 'Download Filename Settings'}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-gray-200 pt-3">
          {/* Pattern selector */}
          <div className="grid grid-cols-2 gap-1.5">
            {PATTERNS.map(p => {
              const active = naming.pattern === p.value
              return (
                <button
                  key={p.value}
                  onClick={() => setNaming({ pattern: p.value })}
                  className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                    active
                      ? 'border-blue-500 bg-brand-900/30 text-blue-600'
                      : 'border-gray-300 text-neutral-700 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium block">{isZh ? p.labelZh : p.labelEn}</span>
                  <span className="text-[10px] opacity-60">{p.example}</span>
                </button>
              )
            })}
          </div>

          {/* Numbering options */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-1.5 text-neutral-700">
              <input
                type="checkbox"
                checked={naming.numberPadding > 0}
                onChange={(e) => setNaming({ numberPadding: e.target.checked ? 2 : 0 })}
                className="w-3.5 h-3.5 rounded accent-brand-600"
              />
              {isZh ? '添加序号' : 'Numbering'}
            </label>
            {naming.numberPadding > 0 && (
              <>
                <span className="text-neutral-700">
                  {isZh ? '位数:' : 'Digits:'}
                </span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setNaming({ numberPadding: n })}
                    className={`px-1.5 py-0.5 text-xs rounded ${
                      naming.numberPadding === n
                        ? 'bg-brand-900/50 text-blue-600 font-medium'
                        : 'bg-gray-100 bg-gray-100 text-neutral-600'
                    }`}
                  >
                    {`0`.repeat(n)}
                  </button>
                ))}
                <span className="text-neutral-700 mx-1">
                  {isZh ? '位置:' : 'Pos:'}
                </span>
                <button
                  onClick={() => setNaming({ numberPosition: 'prefix' })}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    naming.numberPosition === 'prefix'
                      ? 'bg-brand-900/50 text-blue-600 font-medium'
                      : 'bg-gray-100 bg-gray-100 text-neutral-600'
                  }`}
                >
                  {isZh ? '前缀' : 'Prefix'}
                </button>
                <button
                  onClick={() => setNaming({ numberPosition: 'suffix' })}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    naming.numberPosition === 'suffix'
                      ? 'bg-brand-900/50 text-blue-600 font-medium'
                      : 'bg-gray-100 bg-gray-100 text-neutral-600'
                  }`}
                >
                  {isZh ? '后缀' : 'Suffix'}
                </button>
              </>
            )}
          </div>

          {/* Custom template */}
          {naming.pattern === 'custom' && (
            <div>
              <input
                type="text"
                value={naming.customTemplate}
                onChange={(e) => setNaming({ customTemplate: e.target.value })}
                placeholder={isZh ? '如: {original}_v2_{date}' : 'e.g. {original}_v2_{date}'}
                className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500"
              />
              <p className="text-neutral-700 mt-1">
                {isZh
                  ? '可用: {original}=原名 {n}=序号 {date}=日期 {ext}=扩展名'
                  : 'Available: {original} {n} {date} {ext}'}
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
            <p className="text-neutral-700 mb-1">{isZh ? '预览示例:' : 'Preview:'}</p>
            <p className="text-neutral-800 font-mono break-all">
              {naming.pattern === 'custom'
                ? naming.customTemplate
                    .replace(/\{original\}/g, 'photo')
                    .replace(/\{n\}/g, naming.numberPadding > 0 ? '01' : '')
                    .replace(/\{date\}/g, new Date().toISOString().slice(0, 10).replace(/-/g, ''))
                    .replace(/\{ext\}/g, '.jpg')
                : PATTERNS.find(p => p.value === naming.pattern)?.example || 'photo_compressed.jpg'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
