'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import { Settings2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { QualityPresets } from './QualityPresets'
import { ScenePresets } from './ScenePresets'
import { QualitySpeedControls } from './QualitySpeedControls'
import { CompressionModeToggle } from './CompressionModeToggle'
import { ResizeControls } from './ResizeControls'
import { FormatSelector, AvifSection } from './FormatSelector'
import { PresetManager } from './PresetManager'

/**
 * CompressionControls — orchestrator for all compression settings.
 * Each logical section lives in its own component file for maintainability.
 */
export function CompressionControls() {
  const { t } = useT()
  const { files, options } = useCompressionStore()
  const hasFiles = files.length > 0
  const hasPending = files.some(f => f.status === 'pending')

  if (!hasFiles) return null

  return (
    <div className="bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-2 font-semibold text-neutral-900">
        <Settings2 className="w-4 h-4 text-blue-600" />
        <span>{t('controls.title')}</span>
        {hasPending && (
          <span className="text-amber-400 font-normal">
            {t('controls.pendingHint')}
          </span>
        )}
      </div>

      {/* Quality mode sections */}
      {!options.targetKB && (
        <>
          <QualityPresets />
          <ScenePresets />
          <QualitySpeedControls />
        </>
      )}

      {/* Mode toggle + target KB input */}
      <CompressionModeToggle />

      {/* Resize controls */}
      <ResizeControls />

      {/* Format selector + AVIF section */}
      <FormatSelector />
      <AvifSection />

      {/* Custom presets (海外版 only, Pro gated) */}
      <PresetManager />
    </div>
  )
}
