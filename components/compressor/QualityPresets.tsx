'use client'

import { useState } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { estimateCompressedSize } from '@/lib/compression/utils'
import { Package, Sparkles, Gauge, Brain } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { analyzeBatch } from '@/lib/smart-compress'

function estimateSize(originalBytes: number, quality: number): string {
  return estimateCompressedSize(originalBytes, quality)
}

interface SmartState {
  result: ReturnType<typeof analyzeBatch>
}

export function QualityPresets() {
  const { t, locale } = useT()
  const { options, setOptions, files, totalOriginalSize } = useCompressionStore()
  const hasFiles = files.length > 0
  const [smartState, setSmartState] = useState<SmartState | null>(null)
  const isZh = locale === 'zh'

  if (!hasFiles || options.targetKB) return null

  const avgOriginalSize = files.length > 0 ? totalOriginalSize() / files.length : 0
  const smartActive = smartState !== null

  const handleSmart = () => {
    const result = analyzeBatch(files.map(f => ({
      type: f.file.type,
      originalSize: f.originalSize,
      width: f.width,
      height: f.height,
    })))
    setSmartState({ result })
    setOptions({
      quality: result.globalQuality,
      speed: result.globalSpeed,
      outputFormat: result.globalFormat,
      lossless: result.globalLossless,
      targetKB: 0,
    })
  }

  const PRESETS = [
    { key: 'max', label: t('preset.max'), icon: Package, quality: 25, speed: 3 },
    { key: 'balanced', label: t('preset.balanced'), icon: Gauge, quality: 50, speed: 8 },
    { key: 'best', label: t('preset.best'), icon: Sparkles, quality: 70, speed: 3 },
    { key: 'smart', label: t('preset.smart'), icon: Brain, quality: smartActive ? options.quality : -1, speed: 5 },
  ]

  const activePreset = smartActive ? 'smart' : PRESETS.find(p => p.key !== 'smart' && options.quality === p.quality && options.speed === p.speed)?.key
  const smartResult = smartState?.result

  return (
    <div className="space-y-2">
      <label className="text-neutral-700 font-medium text-sm">{t('controls.strength')}</label>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map(({ key, label, icon: Icon, quality, speed }) => {
          const isActive = activePreset === key
          const isSmart = key === 'smart'
          return (
            <button
              key={key}
              onClick={() => {
                if (isSmart) {
                  handleSmart()
                } else {
                  setSmartState(null)
                  setOptions({ quality, speed, targetKB: 0 })
                }
              }}
              className={[
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200',
                isActive
                  ? isSmart
                    ? 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/10'
                    : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
                isSmart && !isActive && 'border-purple-200 hover:border-purple-400 hover:bg-purple-50/50',
              ].join(' ')}
            >
              <Icon className={isActive ? (isSmart ? 'w-5 h-5 text-purple-600' : 'w-5 h-5 text-blue-600') : 'w-5 h-5 text-neutral-600'} />
              <span className={isActive ? (isSmart ? 'text-sm font-semibold text-purple-600' : 'text-sm font-semibold text-blue-600') : 'text-sm font-semibold text-neutral-800'}>{label}</span>
              <span className="text-neutral-700 leading-tight text-center">
                {isSmart
                  ? isZh ? '自动分析' : 'Auto'
                  : estimateSize(avgOriginalSize, quality)
                }
              </span>
            </button>
          )
        })}
      </div>

      {/* Smart analysis summary */}
      {smartActive && smartResult && (
        <div className="mt-2 p-3 rounded-xl bg-purple-50 border border-purple-200 text-sm space-y-1">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-purple-800">
              {isZh ? '🧠 智能分析结果' : '🧠 Smart Analysis'}
            </span>
          </div>
          <p className="text-purple-700 leading-relaxed">
            {isZh ? smartResult.summaryZh : smartResult.summary}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-xs font-medium">
              {isZh ? '画质' : 'Quality'}: {smartResult.globalQuality}%
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-xs font-medium">
              {isZh ? '速度' : 'Speed'}: {smartResult.globalSpeed}/10
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-800 text-xs font-medium">
              {isZh ? '格式' : 'Format'}: {smartResult.globalFormat.toUpperCase()}
            </span>
            {smartResult.globalLossless && (
              <span className="px-2 py-0.5 rounded-full bg-green-200 text-green-800 text-xs font-medium">
                {isZh ? '无损' : 'Lossless'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
