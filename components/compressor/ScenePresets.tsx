'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import type { CompressionOptions } from '@/lib/compression/types'
import { Package, Gauge, Share2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function ScenePresets() {
  const { t, locale } = useT()
  const { options, setOptions } = useCompressionStore()
  const hasFiles = useCompressionStore.getState().files.length > 0
  if (!hasFiles || options.targetKB) return null

  const isZh = locale === 'zh'

  const SCENARIOS: { key: string; label: string; icon: any; options: Partial<CompressionOptions>; descKey: string }[] = [
    { key: 'social', label: isZh ? '社交媒体' : 'Social Media', icon: Share2, options: { quality: 60, speed: 5, outputFormat: 'jpeg', resizeWidth: 1080, resizeHeight: 1080 }, descKey: 'preset.socialDesc' },
    { key: 'web', label: isZh ? 'Web 优化' : 'Web Optimized', icon: Gauge, options: { quality: 55, speed: 3, outputFormat: 'webp', resizeWidth: 1920, resizeHeight: 0 }, descKey: 'preset.webDesc' },
    { key: 'shop', label: isZh ? '电商白底' : 'E-commerce', icon: Package, options: { quality: 65, speed: 3, outputFormat: 'jpeg', resizeWidth: 1500, resizeHeight: 1500, stripMetadata: true }, descKey: 'preset.shopDesc' },
  ]

  return (
    <div className="pt-3 border-t border-gray-200/50">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-neutral-700 uppercase tracking-widest">
          {isZh ? '场景预设' : 'Scene Presets'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SCENARIOS.map(({ key, label, icon: Icon, options: sceneOpts, descKey }) => {
            const isActive = options.quality === sceneOpts.quality
              && options.speed === sceneOpts.speed
              && options.outputFormat === sceneOpts.outputFormat
              && options.resizeWidth === sceneOpts.resizeWidth
              && options.resizeHeight === sceneOpts.resizeHeight
            return (
              <button
                key={key}
                onClick={() => setOptions({ ...sceneOpts, targetKB: 0 })}
                title={t(descKey as any) || ''}
                className={[
                  'flex sm:flex-col items-center sm:items-center gap-2 sm:gap-1 p-3 sm:p-2.5 rounded-xl border-2 transition-all duration-200 text-left',
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
                ].join(' ')}
              >
                <Icon className={isActive ? 'w-5 h-5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0' : 'w-5 h-5 sm:w-4 sm:h-4 text-neutral-600 flex-shrink-0'} />
                <div className="sm:text-center">
                  <span className={isActive ? 'text-sm sm:text-xs font-semibold text-blue-600' : 'text-sm sm:text-xs font-semibold text-neutral-800'}>{label}</span>
                  <span className="text-neutral-700 leading-tight line-clamp-2 text-xs sm:text-[11px] block mt-0.5">{t(descKey as any) || ''}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
