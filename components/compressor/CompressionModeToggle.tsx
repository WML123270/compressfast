'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import { useT } from '@/lib/i18n/context'

export function CompressionModeToggle() {
  const { t } = useT()
  const { options, setOptions } = useCompressionStore()
  const hasFiles = useCompressionStore.getState().files.length > 0
  if (!hasFiles) return null

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-3">
        <label className="text-neutral-700 text-xs sm:text-sm">{t('controls.mode')}</label>
        <div className="flex rounded-md bg-gray-100 p-0.5">
          <button
            onClick={() => setOptions({ targetKB: 0 })}
            className={`px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition-colors ${!options.targetKB ? 'bg-gray-50 text-neutral-900 shadow-sm' : 'text-neutral-700'}`}
          >{t('controls.mode.quality')}</button>
          <button
            onClick={() => setOptions({ targetKB: 50 })}
            className={`px-2 sm:px-2.5 py-1 text-xs rounded font-medium transition-colors ${options.targetKB ? 'bg-gray-50 text-neutral-900 shadow-sm' : 'text-neutral-700'}`}
          >{t('controls.mode.target')}</button>
        </div>
      </div>

      {options.targetKB && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-neutral-700">{t('controls.targetSize')}</label>
            <div className="flex items-center gap-1">
              <input
                type="number" inputMode="numeric" pattern="[0-9]*" min={1} max={50000}
                value={options.targetKB || 100}
                onChange={(e) => setOptions({ targetKB: Math.max(1, Number(e.target.value)) })}
                className="w-20 px-2 py-1.5 text-center rounded border border-gray-300 bg-gray-100 text-neutral-900 focus:border-blue-500 focus:ring-blue-500 outline-none text-sm"
              />
              <span className="text-neutral-700">{t('controls.kb')}</span>
            </div>
          </div>
          <p className="text-neutral-600">{t('controls.targetHint')}</p>
        </div>
      )}
    </>
  )
}
