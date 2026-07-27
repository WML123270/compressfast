'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import { estimateCompressedSize } from '@/lib/compression/utils'
import { Package, Sparkles, Gauge } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

function estimateSize(originalBytes: number, quality: number): string {
  return estimateCompressedSize(originalBytes, quality)
}

export function QualityPresets() {
  const { t } = useT()
  const { options, setOptions, files, totalOriginalSize } = useCompressionStore()
  const hasFiles = files.length > 0
  if (!hasFiles || options.targetKB) return null

  const avgOriginalSize = files.length > 0 ? totalOriginalSize() / files.length : 0

  const PRESETS = [
    { key: 'max', label: t('preset.max'), icon: Package, quality: 25, speed: 3 },
    { key: 'balanced', label: t('preset.balanced'), icon: Gauge, quality: 50, speed: 8 },
    { key: 'best', label: t('preset.best'), icon: Sparkles, quality: 70, speed: 3 },
  ]

  const activePreset = PRESETS.find(p => options.quality === p.quality && options.speed === p.speed)?.key

  return (
    <div className="space-y-2">
      <label className="text-neutral-700 font-medium text-sm">{t('controls.strength')}</label>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(({ key, label, icon: Icon, quality, speed }) => {
          const isActive = activePreset === key
          return (
            <button
              key={key}
              onClick={() => setOptions({ quality, speed, targetKB: 0 })}
              className={[
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200',
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
              ].join(' ')}
            >
              <Icon className={isActive ? 'w-5 h-5 text-blue-600' : 'w-5 h-5 text-neutral-600'} />
              <span className={isActive ? 'text-sm font-semibold text-blue-600' : 'text-sm font-semibold text-neutral-800'}>{label}</span>
              <span className="text-neutral-700 leading-tight text-center">{estimateSize(avgOriginalSize, quality)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
