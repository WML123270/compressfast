'use client'

import { useState, useRef, useEffect } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { Bookmark, Lock, Save, Check, Trash2, Upload, Download } from 'lucide-react'
import { useIsCn } from '@/lib/use-is-cn'
import { useT } from '@/lib/i18n/context'
import { PRESETS_STORAGE_KEY } from '@/lib/compression/types'
import { saveAs } from 'file-saver'

export function PresetManager() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { presets, options, isPro, loadPresets, savePreset, deletePreset, applyPreset, setOptions } = useCompressionStore()
  const hasFiles = useCompressionStore.getState().files.length > 0
  if (!hasFiles || isCn) return null

  const isZh = locale === 'zh'

  useEffect(() => { loadPresets() }, [loadPresets])

  const [presetName, setPresetName] = useState('')
  const [presetFeedback, setPresetFeedback] = useState<'ok' | 'dup' | 'max' | null>(null)
  const presetFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showPresetFeedback = (kind: 'ok' | 'dup' | 'max') => {
    setPresetFeedback(kind)
    if (presetFeedbackTimer.current) clearTimeout(presetFeedbackTimer.current)
    presetFeedbackTimer.current = setTimeout(() => setPresetFeedback(null), 2000)
  }

  return (
    <div className="border-gray-200 pt-4 space-y-3">
      <div className="flex items-center gap-2 font-medium text-neutral-800">
        <Bookmark className="w-4 h-4" />
        <span>{t('preset.section')}</span>
        {!isPro && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-900/30 text-amber-300">
            <Lock className="w-3 h-3" /> {t('preset.locked')}
          </span>
        )}
      </div>

      {!isPro ? (
        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-300">
          <span className="text-neutral-700">{t('preset.lockedHint')}</span>
          <a
            href={`/${locale}/pro`}
            className="font-medium text-brand-400 hover:underline"
          >
            {locale === 'zh' ? '升级 →' : 'Upgrade →'}
          </a>
        </div>
      ) : (
        <>
          {/* Save current settings as preset */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => { setPresetName(e.target.value); setPresetFeedback(null) }}
                placeholder={t('preset.savePlaceholder')}
                maxLength={20}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const name = presetName.trim()
                  if (!name) return
                  const result = savePreset(name)
                  if (result) {
                    setPresetName('')
                    showPresetFeedback('ok')
                  } else if (presets.some(p => p.name === name)) {
                    showPresetFeedback('dup')
                  } else {
                    showPresetFeedback('max')
                  }
                }}
                disabled={!presetName.trim()}
                className="flex items-center gap-1 px-3 py-1.5 font-medium text-white bg-blue-600 hover:bg-blue-600 disabled:bg-gray-50 rounded-lg transition-colors flex-shrink-0"
              >
                {presetFeedback === 'ok' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {presetFeedback === 'ok' ? t('preset.saveOk')
                  : presetFeedback === 'dup' ? t('preset.saveDup')
                  : presetFeedback === 'max' ? t('preset.saveMax')
                  : t('preset.saveButton')}
              </button>
            </div>
          </div>

          {/* Saved preset list */}
          {presets.length === 0 ? (
            <p className="text-neutral-700 text-center py-2">{t('preset.empty')}</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-medium text-neutral-800 truncate block text-sm">{p.name}</span>
                    <span className="text-neutral-700 text-xs">
                      {p.options.targetKB
                        ? `${p.options.targetKB}KB`
                        : `Q${p.options.quality}`}
                      {p.options.outputFormat !== 'original' && ` · ${p.options.outputFormat.toUpperCase()}`}
                      {p.options.lossless && ' · L'}
                    </span>
                  </span>
                  <button
                    onClick={() => applyPreset(p.id)}
                    className="px-2.5 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-900/20 rounded-lg transition-colors min-w-[36px]"
                  >
                    {t('preset.load')}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    className="p-1.5 text-neutral-800 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Export / Import */}
          <div className="flex items-center gap-2 pt-2 border-gray-200">
            <button
              onClick={() => {
                const exportData = JSON.stringify(presets, null, 2)
                const blob = new Blob([exportData], { type: 'application/json' })
                saveAs(blob, 'compressfast-presets.json')
              }}
              disabled={presets.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-xs font-medium text-neutral-700 hover:text-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isZh ? '导出预设' : 'Export'}</span>
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-xs font-medium text-neutral-700 hover:text-brand-400 cursor-pointer transition-colors rounded-lg hover:bg-gray-50">
              <Download className="w-3.5 h-3.5" />
              <span>{isZh ? '导入预设' : 'Import'}</span>
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    try {
                      const imported = JSON.parse(reader.result as string)
                      if (Array.isArray(imported) && imported.every((p: any) => p.id && p.name && p.options)) {
                        const current = useCompressionStore.getState().presets
                        let merged = [...current]
                        for (const p of imported) {
                          if (merged.length >= 10) break
                          if (!merged.some(existing => existing.name === p.name)) {
                            merged.push(p)
                          }
                        }
                        try { localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(merged)) } catch {}
                        useCompressionStore.setState({ presets: merged })
                      }
                    } catch { /* ignore invalid files */ }
                  }
                  reader.readAsText(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </>
      )}
    </div>
  )
}
