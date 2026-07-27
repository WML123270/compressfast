'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import { Crop } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function ResizeControls() {
  const { t, locale } = useT()
  const { options, setOptions, files } = useCompressionStore()
  const hasFiles = files.length > 0
  if (!hasFiles) return null

  return (
    <div className="border-gray-200/50 pt-3 space-y-2">
      <div className="flex items-center gap-2 font-medium text-neutral-800 text-sm">
        <Crop className="w-4 h-4" />
        <span>{t('resize.section')}</span>
      </div>
      <div className="space-y-2">
        {/* Width × Height inputs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0} max={99999} step={1}
            value={options.resizeWidth || ''}
            onChange={(e) => setOptions({ resizeWidth: Math.max(0, Number(e.target.value) || 0) })}
            placeholder={t('resize.width')}
            className="w-[64px] sm:w-[70px] px-2 py-2 text-sm text-center rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-neutral-700 text-xs font-medium">×</span>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0} max={99999} step={1}
            value={options.resizeHeight || ''}
            onChange={(e) => setOptions({ resizeHeight: Math.max(0, Number(e.target.value) || 0) })}
            placeholder={t('resize.height')}
            className="w-[64px] sm:w-[70px] px-2 py-2 text-sm text-center rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="text-neutral-700 text-xs hidden sm:inline">px</span>
        </div>

        {/* Quick preset buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { label: t('resize.preset50'), w: 0, h: 0, pct: 50 },
            { label: t('resize.preset75'), w: 0, h: 0, pct: 75 },
          ].map((p) => {
            const baseFile = files.find(f => f.status === 'pending')
            const baseW = baseFile?.width || 1920
            const baseH = baseFile?.height || 1080
            const tw = Math.round(baseW * p.pct / 100)
            const th = Math.round(baseH * p.pct / 100)
            return (
              <button
                key={p.label}
                onClick={() => { setOptions({ resizeWidth: tw, resizeHeight: th }) }}
                className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors min-w-[44px] ${
                  options.resizeWidth === tw && options.resizeHeight === th
                    ? 'border-blue-500 bg-brand-900/30 text-blue-600 font-medium'
                    : 'border-gray-300 text-neutral-700 hover:border-gray-300 active:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            )
          })}
          {[
            { label: t('resize.preset1080'), w: 1920, h: 1080 },
            { label: t('resize.preset720'), w: 1280, h: 720 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setOptions({ resizeWidth: p.w, resizeHeight: p.h }) }}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors min-w-[44px] ${
                options.resizeWidth === p.w && options.resizeHeight === p.h
                  ? 'border-blue-500 bg-brand-900/30 text-blue-600 font-medium'
                  : 'border-gray-300 text-neutral-700 hover:border-gray-300 active:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {(options.resizeWidth > 0 || options.resizeHeight > 0) && (
        <div className="flex items-center gap-1">
          <span className="text-brand-400">
            {locale === 'zh'
              ? `输出尺寸 ${options.resizeWidth || '自动'}×${options.resizeHeight || '自动'} px（等比缩放，不放大小图）`
              : `Output ${options.resizeWidth || 'auto'}×${options.resizeHeight || 'auto'} px (fit, no upscale)`}
          </span>
          <button
            onClick={() => setOptions({ resizeWidth: 0, resizeHeight: 0 })}
            className="text-neutral-700 hover:text-red-500 underline"
          >
            {locale === 'zh' ? '清除' : 'Clear'}
          </button>
        </div>
      )}
    </div>
  )
}
