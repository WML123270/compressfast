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
    <div className="border border-slate-700 rounded-xl bg-slate-800 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 font-medium text-slate-300 hover:bg-slate-700/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          {isZh ? '下载文件名设置' : 'Download Filename Settings'}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-slate-700 pt-3">
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
                      ? 'border-brand-500 bg-brand-900/30 text-brand-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
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
            <label className="flex items-center gap-1.5 text-slate-400">
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
                <span className="text-slate-400">
                  {isZh ? '位数:' : 'Digits:'}
                </span>
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setNaming({ numberPadding: n })}
                    className={`px-1.5 py-0.5 text-xs rounded ${
                      naming.numberPadding === n
                        ? 'bg-brand-900/50 text-brand-300 font-medium'
                        : 'bg-slate-100 bg-slate-700 text-slate-500'
                    }`}
                  >
                    {`0`.repeat(n)}
                  </button>
                ))}
                <span className="text-slate-400 mx-1">
                  {isZh ? '位置:' : 'Pos:'}
                </span>
                <button
                  onClick={() => setNaming({ numberPosition: 'prefix' })}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    naming.numberPosition === 'prefix'
                      ? 'bg-brand-900/50 text-brand-300 font-medium'
                      : 'bg-slate-100 bg-slate-700 text-slate-500'
                  }`}
                >
                  {isZh ? '前缀' : 'Prefix'}
                </button>
                <button
                  onClick={() => setNaming({ numberPosition: 'suffix' })}
                  className={`px-1.5 py-0.5 text-xs rounded ${
                    naming.numberPosition === 'suffix'
                      ? 'bg-brand-900/50 text-brand-300 font-medium'
                      : 'bg-slate-100 bg-slate-700 text-slate-500'
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
                className="w-full px-3 py-1.5 rounded-lg border border-slate-600 bg-slate-700 text-slate-100 outline-none focus:border-brand-500"
              />
              <p className="text-slate-400 mt-1">
                {isZh
                  ? '可用: {original}=原名 {n}=序号 {date}=日期 {ext}=扩展名'
                  : 'Available: {original} {n} {date} {ext}'}
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700">
            <p className="text-slate-400 mb-1">{isZh ? '预览示例:' : 'Preview:'}</p>
            <p className="text-slate-300 font-mono break-all">
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
