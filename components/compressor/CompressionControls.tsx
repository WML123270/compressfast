'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import type { CompressionOptions } from '@/lib/compression/types'
import { formatFileSize, q2bits, reduceColors, estimateCompressedSize } from '@/lib/compression/utils'
import { Settings2, Package, Sparkles, Gauge, Loader2, AlertTriangle, Bookmark, Lock, Trash2, Check, Save, Crop } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

async function previewCompress(
  file: File,
  quality: number,
  outputFormat: CompressionOptions['outputFormat'],
): Promise<number> {
  // AVIF encoding not supported by canvas API — skip live preview
  if (outputFormat === 'avif') return 0

  const bitmap = await createImageBitmap(file)
  const w = bitmap.width, h = bitmap.height
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  let outMime = 'image/jpeg'

  const ft = file.type
  if (outputFormat === 'png') outMime = 'image/png'
  else if (outputFormat === 'jpeg') outMime = 'image/jpeg'
  else if (outputFormat === 'webp') outMime = 'image/webp'
  else if (ft === 'image/png') outMime = 'image/png'
  else if (ft === 'image/webp') outMime = 'image/webp'

  const bits = q2bits(quality)
  if (bits < 8) {
    const imgData = ctx.getImageData(0, 0, w, h)
    const reduced = reduceColors(imgData, bits)
    ctx.putImageData(reduced, 0, 0)
  }

  if (outMime === 'image/jpeg') {
    const blob = await canvas.convertToBlob({ type: outMime, quality: quality / 100 })
    return blob.size
  }
  const blob = await canvas.convertToBlob({ type: outMime })
  return blob.size
}

function estimateSize(originalBytes: number, quality: number): string {
  return estimateCompressedSize(originalBytes, quality)
}

export function CompressionControls() {
  const { t, locale } = useT()
  const { options, setOptions, files, totalOriginalSize, isPro, presets, loadPresets, savePreset, deletePreset, applyPreset } = useCompressionStore()
  const hasFiles = files.length > 0
  const hasPending = files.some(f => f.status === 'pending')
  const avgOriginalSize = files.length > 0 ? totalOriginalSize() / files.length : 0


  const [previewSize, setPreviewSize] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firstPendingFile = files.find(f => f.status === 'pending')?.file

  const runPreview = useCallback(async (file: File, quality: number, fmt: CompressionOptions['outputFormat']) => {
    setPreviewLoading(true)
    try { const size = await previewCompress(file, quality, fmt); setPreviewSize(size) }
    catch { setPreviewSize(null) }
    setPreviewLoading(false)
  }, [])

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    if (!firstPendingFile || options.targetKB) { setPreviewSize(null); return }
    previewTimer.current = setTimeout(() => {
      runPreview(firstPendingFile, options.quality, options.outputFormat)
    }, 500)
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current) }
  }, [options.quality, options.outputFormat, firstPendingFile, options.targetKB, runPreview])

  // 加载自定义预设
  useEffect(() => { loadPresets() }, [loadPresets])

  // 预设管理 state
  const [presetName, setPresetName] = useState('')
  const [presetFeedback, setPresetFeedback] = useState<'ok' | 'dup' | 'max' | null>(null)
  const presetFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showPresetFeedback = (kind: 'ok' | 'dup' | 'max') => {
    setPresetFeedback(kind)
    if (presetFeedbackTimer.current) clearTimeout(presetFeedbackTimer.current)
    presetFeedbackTimer.current = setTimeout(() => setPresetFeedback(null), 2000)
  }

  if (!hasFiles) return null

  const effectiveFormat = options.outputFormat
  const hasTransparentSource = files.some(
    f => f.file.type === 'image/png' || f.file.type === 'image/gif' || f.file.type === 'image/svg+xml'
  )
  const losingTransparency = effectiveFormat === 'jpeg' && hasTransparentSource

  const PRESETS = [
    { key: 'max', label: t('preset.max'), icon: Package, quality: 25, speed: 3 },
    { key: 'balanced', label: t('preset.balanced'), icon: Gauge, quality: 50, speed: 8 },
    { key: 'best', label: t('preset.best'), icon: Sparkles, quality: 70, speed: 3 },
  ]

  const activePreset = !options.targetKB
    ? PRESETS.find(p => options.quality === p.quality && options.speed === p.speed)?.key
    : undefined

  const FORMATS: { value: CompressionOptions['outputFormat']; label: string; desc: string }[] = [
    { value: 'original', label: t('controls.format.original'), desc: t('controls.format.originalDesc') },
    { value: 'png', label: 'PNG', desc: t('controls.format.pngDesc') },
    { value: 'jpeg', label: 'JPEG', desc: t('controls.format.jpegDesc') },
    { value: 'webp', label: 'WebP', desc: t('controls.format.webpDesc') },
    { value: 'avif', label: 'AVIF', desc: t('controls.format.avifDesc') },
  ]

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Settings2 className="w-4 h-4" />
        <span>{t('controls.title')}</span>
        {hasPending && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-normal">
            {t('controls.pendingHint')}
          </span>
        )}
      </div>

      {!options.targetKB && (
        <>
          <div className="space-y-2">
            <label className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('controls.strength')}</label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map(({ key, label, icon: Icon, quality, speed }) => {
                const isActive = activePreset === key
                return (
                  <button
                    key={key}
                    onClick={() => setOptions({ quality, speed, targetKB: 0 })}
                    className={[
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                      isActive
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500 hover:shadow-sm',
                    ].join(' ')}
                  >
                    <Icon className={isActive ? 'w-5 h-5 text-brand-600 dark:text-brand-400' : 'w-5 h-5 text-slate-400 dark:text-slate-500'} />
                    <span className={isActive ? 'text-sm font-semibold text-brand-700 dark:text-brand-300' : 'text-sm font-semibold text-slate-700 dark:text-slate-300'}>{label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight text-center">{estimateSize(avgOriginalSize, quality)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('controls.quality')}</label>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {options.quality}%
                {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
                {!previewLoading && previewSize && (
                  <span className="text-green-600 dark:text-green-400">→ {formatFileSize(previewSize)}</span>
                )}
                {!previewLoading && !previewSize && firstPendingFile && (
                  <span className="text-slate-400">{estimateSize(avgOriginalSize, options.quality)}</span>
                )}
              </span>
              </div>
              <input
                type="range" min={10} max={100} step={5}
                value={options.quality}
                onChange={(e) => { const val = Number(e.target.value); setOptions({ quality: val, targetKB: 0 }) }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('controls.speed')}</label>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {options.speed <= 2 ? t('controls.speed.best') : options.speed <= 5 ? t('controls.speed.balanced') : t('controls.speed.fast')}
                </span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={options.speed}
                onChange={(e) => { const val = Number(e.target.value); setOptions({ speed: val }) }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox" checked={options.lossless}
                onChange={(e) => setOptions({ lossless: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-brand-600"
              />
              <span className="text-slate-500 dark:text-slate-400">{t('controls.lossless')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox" checked={options.stripMetadata}
                onChange={(e) => setOptions({ stripMetadata: e.target.checked })}
                className="w-3.5 h-3.5 rounded accent-brand-600"
              />
              <span className="text-slate-500 dark:text-slate-400">{t('controls.stripMeta')}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{t('controls.stripMetaHint')}</span>
            </label>
          </div>
        </>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 dark:text-slate-400">{t('controls.mode')}</label>
        <div className="flex rounded-md bg-slate-200 dark:bg-slate-700 p-0.5">
          <button
            onClick={() => setOptions({ targetKB: 0 })}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${!options.targetKB ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >{t('controls.mode.quality')}</button>
          <button
            onClick={() => setOptions({ targetKB: 50 })}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${options.targetKB ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-200 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
          >{t('controls.mode.target')}</button>
        </div>
      </div>

      {options.targetKB && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-slate-600 dark:text-slate-400">{t('controls.targetSize')}</label>
            <div className="flex items-center gap-1">
              <input
                type="number" min={1} max={50000}
                value={options.targetKB || 100}
                onChange={(e) => setOptions({ targetKB: Math.max(1, Number(e.target.value)) })}
                className="w-20 px-2 py-1 text-sm text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
              />
              <span className="text-slate-500 dark:text-slate-400">{t('controls.kb')}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t('controls.targetHint')}</p>
        </div>
      )}

      {/* 尺寸调整 */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Crop className="w-4 h-4" />
          <span>{t('resize.section')}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0} max={99999} step={1}
              value={options.resizeWidth || ''}
              onChange={(e) => setOptions({ resizeWidth: Math.max(0, Number(e.target.value) || 0) })}
              placeholder={t('resize.width')}
              className="w-[70px] px-2 py-1.5 text-sm text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-xs text-slate-400">×</span>
            <input
              type="number"
              min={0} max={99999} step={1}
              value={options.resizeHeight || ''}
              onChange={(e) => setOptions({ resizeHeight: Math.max(0, Number(e.target.value) || 0) })}
              placeholder={t('resize.height')}
              className="w-[70px] px-2 py-1.5 text-sm text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <span className="text-[10px] text-slate-400 hidden sm:inline">px</span>
          </div>

          {/* 快捷比例按钮 */}
          {[
            { label: t('resize.preset50'), w: 0, h: 0, pct: 50 },
            { label: t('resize.preset75'), w: 0, h: 0, pct: 75 },
          ].map((p) => {
            // 基于第一张 pending 图片的尺寸来计算
            const baseFile = files.find(f => f.status === 'pending')
            const baseW = baseFile?.width || 1920
            const baseH = baseFile?.height || 1080
            const tw = Math.round(baseW * p.pct / 100)
            const th = Math.round(baseH * p.pct / 100)
            return (
              <button
                key={p.label}
                onClick={() => { setOptions({ resizeWidth: tw, resizeHeight: th }) }}
                className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                  options.resizeWidth === tw && options.resizeHeight === th
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                {p.label}
              </button>
            )
          })}

          {/* 预设尺寸按钮 */}
          {[
            { label: t('resize.preset1080'), w: 1920, h: 1080 },
            { label: t('resize.preset720'), w: 1280, h: 720 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setOptions({ resizeWidth: p.w, resizeHeight: p.h }) }}
              className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${
                options.resizeWidth === p.w && options.resizeHeight === p.h
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                  : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {(options.resizeWidth > 0 || options.resizeHeight > 0) && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-brand-600 dark:text-brand-400">
              {locale === 'zh'
                ? `输出尺寸 ${options.resizeWidth || '自动'}×${options.resizeHeight || '自动'} px（等比缩放，不放大小图）`
                : `Output ${options.resizeWidth || 'auto'}×${options.resizeHeight || 'auto'} px (fit, no upscale)`}
            </span>
            <button
              onClick={() => setOptions({ resizeWidth: 0, resizeHeight: 0 })}
              className="text-[10px] text-slate-400 hover:text-red-500 underline"
            >
              {locale === 'zh' ? '清除' : 'Clear'}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-600 dark:text-slate-400">{t('controls.outputFormat')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {FORMATS.map(({ value, label, desc }) => {
            const isActive = effectiveFormat === value
            return (
              <button
                key={value}
                onClick={() => setOptions({ outputFormat: value })}
                className={[
                  'text-left px-3 py-2 rounded-lg border text-sm transition-colors',
                  isActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500',
                ].join(' ')}
              >
                <span className="font-medium block">{label}</span>
                <span className="text-xs opacity-70">{desc}</span>
              </button>
            )
          })}
        </div>
        {losingTransparency && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-amber-700 dark:text-amber-300">
              PNG/GIF/SVG images may have transparent backgrounds. Converting to JPEG will replace transparency with a white background.
            </span>
          </div>
        )}
        {effectiveFormat === 'avif' && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <span className="text-blue-700 dark:text-blue-300">{t('controls.format.avifWarning')}</span>
          </div>
        )}
      </div>

      {/* 自定义预设 */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
          <Bookmark className="w-4 h-4" />
          <span>{t('preset.section')}</span>
          {!isPro && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <Lock className="w-3 h-3" /> {t('preset.locked')}
            </span>
          )}
        </div>

        {!isPro ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-600">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('preset.lockedHint')}</span>
            <a
              href={`/${locale}/pro`}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {locale === 'zh' ? '升级 →' : 'Upgrade →'}
            </a>
          </div>
        ) : (
          <>
            {/* 保存当前设置为预设 */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => { setPresetName(e.target.value); setPresetFeedback(null) }}
                  placeholder={t('preset.savePlaceholder')}
                  maxLength={20}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-brand-300 dark:disabled:bg-slate-600 rounded-lg transition-colors flex-shrink-0"
                >
                  {presetFeedback === 'ok' ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {presetFeedback === 'ok' ? t('preset.saveOk')
                    : presetFeedback === 'dup' ? t('preset.saveDup')
                    : presetFeedback === 'max' ? t('preset.saveMax')
                    : t('preset.saveButton')}
                </button>
              </div>
            </div>

            {/* 已保存预设列表 */}
            {presets.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">{t('preset.empty')}</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                      {p.options.targetKB
                        ? `${p.options.targetKB}KB`
                        : `Q${p.options.quality}`}
                      {p.options.outputFormat !== 'original' && ` · ${p.options.outputFormat.toUpperCase()}`}
                      {p.options.lossless && ' · L'}
                    </span>
                    <button
                      onClick={() => applyPreset(p.id)}
                      className="px-2 py-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded transition-colors"
                    >
                      {t('preset.load')}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
