'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import type { CompressionOptions } from '@/lib/compression/types'
import { formatFileSize, q2bits, reduceColors, estimateCompressedSize } from '@/lib/compression/utils'
import { Settings2, Package, Sparkles, Gauge, Loader2, AlertTriangle, Bookmark, Lock, Trash2, Check, Save, Crop, Share2, Download, Upload, FileImage, Camera, Globe, Dna, RotateCcw } from 'lucide-react'
import { useIsCn } from '@/lib/use-is-cn'
import { saveAs } from 'file-saver'
import { PRESETS_STORAGE_KEY } from '@/lib/compression/types'
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
  const isCn = useIsCn()
  const { options, setOptions, files, totalOriginalSize, isPro, presets, loadPresets, savePreset, deletePreset, applyPreset } = useCompressionStore()
  const hasFiles = files.length > 0
  const hasPending = files.some(f => f.status === 'pending')
  const avgOriginalSize = files.length > 0 ? totalOriginalSize() / files.length : 0
  const isZh = locale === 'zh'


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
    { key: 'max', label: t('preset.max'), icon: Package, quality: 25, speed: 3, descKey: 'preset.maxDesc' },
    { key: 'balanced', label: t('preset.balanced'), icon: Gauge, quality: 50, speed: 8, descKey: 'preset.balancedDesc' },
    { key: 'best', label: t('preset.best'), icon: Sparkles, quality: 70, speed: 3, descKey: 'preset.bestDesc' },
  ]

  // 场景预设：带尺寸建议和格式建议
  const SCENARIOS: { key: string; label: string; icon: any; options: Partial<CompressionOptions>; descKey: string }[] = [
    { key: 'social', label: isZh ? '社交媒体' : 'Social Media', icon: Share2, options: { quality: 60, speed: 5, outputFormat: 'jpeg', resizeWidth: 1080, resizeHeight: 1080 }, descKey: 'preset.socialDesc' },
    { key: 'web', label: isZh ? 'Web 优化' : 'Web Optimized', icon: Gauge, options: { quality: 55, speed: 3, outputFormat: 'webp', resizeWidth: 1920, resizeHeight: 0 }, descKey: 'preset.webDesc' },
    { key: 'shop', label: isZh ? '电商白底' : 'E-commerce', icon: Package, options: { quality: 65, speed: 3, outputFormat: 'jpeg', resizeWidth: 1500, resizeHeight: 1500, stripMetadata: true }, descKey: 'preset.shopDesc' },
  ]

  const activePreset = !options.targetKB
    ? PRESETS.find(p => options.quality === p.quality && options.speed === p.speed)?.key
    : undefined

  const FORMATS: { value: CompressionOptions['outputFormat']; label: string; desc: string; icon: any; color: string }[] = [
    { value: 'original', label: t('controls.format.original'), desc: t('controls.format.originalDesc'), icon: RotateCcw, color: 'border-gray-300 bg-gray-100 text-neutral-800 hover:border-gray-300' },
    { value: 'png', label: 'PNG', desc: t('controls.format.pngDesc'), icon: FileImage, color: 'border-emerald-700/50 bg-emerald-900/10 text-emerald-400 hover:border-emerald-400' },
    { value: 'jpeg', label: 'JPEG', desc: t('controls.format.jpegDesc'), icon: Camera, color: 'border-amber-700/50 bg-amber-900/10 text-amber-400 hover:border-amber-400' },
    { value: 'webp', label: 'WebP', desc: t('controls.format.webpDesc'), icon: Globe, color: 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-400' },
    ...(isCn ? [] : [{ value: 'avif' as CompressionOptions['outputFormat'], label: 'AVIF', desc: t('controls.format.avifDesc'), icon: Dna, color: 'border-purple-700/50 bg-purple-900/10 text-purple-400 hover:border-purple-400' }]),
  ]

  return (
    <div className="bg-gray-50 backdrop-blur-xl border border-gray-200 rounded-2xl p-5 space-y-5 animate-slide-up">
      <div className="flex items-center gap-2 font-semibold text-neutral-900">
        <Settings2 className="w-4 h-4 text-blue-600" />
        <span>{t('controls.title')}</span>
        {hasPending && (
          <span className="text-amber-400 font-normal">
            {t('controls.pendingHint')}
          </span>
        )}
      </div>

      {!options.targetKB && (
        <>
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

          {/* 场景预设 */}
          <div className="pt-3 border-t border-gray-200/50">
          <div className="space-y-2">
            <label className="font-semibold text-neutral-700 uppercase tracking-widest">
              {isZh ? '场景预设' : 'Scene Presets'}
            </label>
            <div className="grid grid-cols-3 gap-2">
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
                      'flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 text-left',
                      isActive
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100',
                    ].join(' ')}
                  >
                    <Icon className={isActive ? 'w-4 h-4 text-blue-600' : 'w-4 h-4 text-neutral-600'} />
                    <span className={isActive ? 'text-xs font-semibold text-blue-600' : 'text-xs font-semibold text-neutral-800'}>{label}</span>
                    <span className="text-neutral-700 leading-tight text-center line-clamp-2">{t(descKey as any) || ''}</span>
                  </button>
                )
              })}
            </div>
          </div>
          </div>

          <div className="space-y-3 border-gray-200/50 pt-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-medium text-neutral-700 text-xs sm:text-sm">{t('controls.quality')}</label>
                <span className="font-semibold text-neutral-900 flex items-center gap-1 text-xs sm:text-sm">
                {options.quality}%
                {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-neutral-700" />}
                {!previewLoading && previewSize && (
                  <span className="text-blue-500 hidden sm:inline">→ {formatFileSize(previewSize)}</span>
                )}
                {!previewLoading && !previewSize && firstPendingFile && (
                  <span className="text-neutral-700 hidden sm:inline">{estimateSize(avgOriginalSize, options.quality)}</span>
                )}
              </span>
              </div>
              <input
                type="range" min={10} max={100} step={5}
                value={options.quality}
                onChange={(e) => { const val = Number(e.target.value); setOptions({ quality: val, targetKB: 0 }) }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-medium text-neutral-700 text-xs sm:text-sm">{t('controls.speed')}</label>
                <span className="font-semibold text-neutral-900 text-xs sm:text-sm">
                  {options.speed <= 2 ? t('controls.speed.best') : options.speed <= 5 ? t('controls.speed.balanced') : t('controls.speed.fast')}
                </span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={options.speed}
                onChange={(e) => { const val = Number(e.target.value); setOptions({ speed: val }) }}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox" checked={options.lossless}
                  onChange={(e) => setOptions({ lossless: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-brand-600"
                />
                <span className="text-neutral-700">{t('controls.lossless')}</span>
              </label>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox" checked={options.stripMetadata}
                  onChange={(e) => setOptions({ stripMetadata: e.target.checked })}
                  className="w-3.5 h-3.5 rounded accent-brand-600"
                />
                <span className="text-neutral-700">{t('controls.stripMeta')}</span>
                <span className="text-neutral-700 hidden sm:inline">{t('controls.stripMetaHint')}</span>
              </label>
            </div>
          </div>
        </>
      )}

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
                type="number" min={1} max={50000}
                value={options.targetKB || 100}
                onChange={(e) => setOptions({ targetKB: Math.max(1, Number(e.target.value)) })}
                className="w-20 px-2 py-1 text-center rounded border border-gray-300 bg-gray-100 text-neutral-900 focus:border-blue-500 focus:ring-blue-500 outline-none"
              />
              <span className="text-neutral-700">{t('controls.kb')}</span>
            </div>
          </div>
          <p className="text-neutral-600">{t('controls.targetHint')}</p>
        </div>
      )}

      {/* 尺寸调整 */}
      <div className="border-gray-200/50 pt-3 space-y-2">
        <div className="flex items-center gap-2 font-medium text-neutral-800 text-sm">
          <Crop className="w-4 h-4" />
          <span>{t('resize.section')}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <input
              type="number"
              min={0} max={99999} step={1}
              value={options.resizeWidth || ''}
              onChange={(e) => setOptions({ resizeWidth: Math.max(0, Number(e.target.value) || 0) })}
              placeholder={t('resize.width')}
              className="w-[60px] sm:w-[70px] px-2 py-1.5 text-xs sm:text-sm text-center rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="text-neutral-700 text-xs">×</span>
            <input
              type="number"
              min={0} max={99999} step={1}
              value={options.resizeHeight || ''}
              onChange={(e) => setOptions({ resizeHeight: Math.max(0, Number(e.target.value) || 0) })}
              placeholder={t('resize.height')}
              className="w-[60px] sm:w-[70px] px-2 py-1.5 text-xs sm:text-sm text-center rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="text-neutral-700 hidden sm:inline text-xs">px</span>
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
                    ? 'border-blue-500 bg-brand-900/30 text-blue-600'
                    : 'border-gray-300 text-neutral-700 hover:border-gray-300'
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
                  ? 'border-blue-500 bg-brand-900/30 text-blue-600'
                  : 'border-gray-300 text-neutral-700 hover:border-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
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

      <div className="space-y-2">
        <label className="text-neutral-700">{t('controls.outputFormat')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {FORMATS.map(({ value, label, desc, icon: Icon, color }) => {
            const isActive = effectiveFormat === value
            const isAvif = value === 'avif'
            const avifLocked = isAvif && !isPro
            return (
              <button
                key={value}
                onClick={() => {
                  if (avifLocked) {
                    window.location.href = `/${locale}/pro`
                    return
                  }
                  setOptions({ outputFormat: value })
                }}
                className={[
                  'relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all duration-200 group',
                  avifLocked
                    ? 'border-dashed border-gray-300 bg-gray-50 text-neutral-700 cursor-pointer hover:border-amber-500 hover:bg-amber-900/10'
                    : isActive
                      ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10 scale-[1.02]'
                      : `${color} border bg-opacity-50 hover:scale-[1.02]`,
                ].join(' ')}
              >
                {isAvif && !avifLocked && (
                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
                    Pro
                  </span>
                )}
                {avifLocked && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white shadow-lg">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-600' : avifLocked ? 'text-neutral-600' : ''}`} />
                <span className={`font-semibold text-sm ${avifLocked ? 'text-neutral-600' : ''}`}>{label}</span>
                <span className={`text-[10px] leading-tight text-center ${avifLocked ? 'text-neutral-600' : 'opacity-60'}`}>
                  {avifLocked ? (isZh ? 'Pro 专属' : 'Pro Only') : desc}
                </span>
              </button>
            )
          })}
        </div>
        {losingTransparency && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span className="text-neutral-900">
              PNG/GIF/SVG 图片可能含有透明背景，转换为 JPEG 后透明部分将被替换为白色背景。
            </span>
          </div>
        )}
        {effectiveFormat === 'avif' && (
          <>
            {!isPro ? (
              /* 非 Pro：AVIF 升级引导 */
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-900/10 to-amber-900/10 border border-purple-700 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧬</span>
                  <h4 className="font-bold text-sm">{t('controls.format.avifTitle')}</h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-amber-900/30 text-amber-300">
                    <Lock className="w-3 h-3" /> Pro
                  </span>
                </div>
                <p className="text-neutral-700 leading-relaxed">
                  {t('controls.format.avifWhat')}
                </p>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-100 border border-amber-700">
                  <span className="text-lg">⭐</span>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-300">
                      {isZh ? '升级 Pro 解锁 AVIF' : 'Upgrade to Pro for AVIF'}
                    </p>
                    <p className="text-amber-400">
                      {isZh ? '一次性买断 $24.99，永久使用' : 'One-time $24.99, lifetime access'}
                    </p>
                  </div>
                  <a
                    href={`/${locale}/pro`}
                    className="flex-shrink-0 px-3 py-1.5 font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                  >
                    {isZh ? '升级 →' : 'Upgrade →'}
                  </a>
                </div>
                <p className="text-neutral-600">
                  {isZh ? '免费版将使用原格式压缩' : 'Free tier will use original format'}
                </p>
              </div>
            ) : (
              /* Pro：完整 AVIF 详情 */
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-700 rounded-xl">
                {/* 标题 */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">🧬</span>
                  <h4 className="font-bold text-sm">{t('controls.format.avifTitle')}</h4>
                </div>

                {/* 简介 */}
                <p className="text-neutral-700 leading-relaxed">
                  {t('controls.format.avifWhat')}
                </p>

                {/* 优势卡片 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-100 border border-purple-800/30">
                    <span className="text-base flex-shrink-0">📦</span>
                    <div>
                      <p className="font-semibold text-purple-300">
                        {isZh ? '极致压缩' : 'Ultra Compact'}
                      </p>
                      <p className="text-neutral-700">{t('controls.format.avifSize')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-100 border border-purple-800/30">
                    <span className="text-base flex-shrink-0">🎨</span>
                    <div>
                      <p className="font-semibold text-purple-300">
                        {isZh ? '专业画质' : 'Pro Quality'}
                      </p>
                      <p className="text-neutral-700">{t('controls.format.avifQuality')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-100 border border-purple-800/30">
                    <span className="text-base flex-shrink-0">🌐</span>
                    <div>
                      <p className="font-semibold text-purple-300">
                        {isZh ? '适用场景' : 'Use Cases'}
                      </p>
                      <p className="text-neutral-700">{t('controls.format.avifUse')}</p>
                    </div>
                  </div>
                </div>

                {/* 浏览器兼容 */}
                <div className="space-y-1.5">
                  <p className="font-semibold text-neutral-800">
                    {isZh ? '✅ 浏览器兼容性' : '✅ Browser Support'}
                  </p>
                  <p className="text-blue-500 bg-green-900/20 rounded px-2 py-1">
                    {t('controls.format.avifBrowser')}
                  </p>
                  <p className="text-red-400 bg-red-900/20 rounded px-2 py-1">
                    {t('controls.format.avifNot')}
                  </p>
                </div>

                {/* 提示 */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-900/20 border border-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-300">{t('controls.format.avifNote')}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 自定义预设 — 仅海外版 */}
      {!isCn && (
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
            {/* 保存当前设置为预设 */}
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

            {/* 已保存预设列表 */}
            {presets.length === 0 ? (
              <p className="text-neutral-700 text-center py-2">{t('preset.empty')}</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <span className="flex-1 font-medium text-neutral-800 truncate">{p.name}</span>
                    <span className="text-neutral-700 hidden sm:inline">
                      {p.options.targetKB
                        ? `${p.options.targetKB}KB`
                        : `Q${p.options.quality}`}
                      {p.options.outputFormat !== 'original' && ` · ${p.options.outputFormat.toUpperCase()}`}
                      {p.options.lossless && ' · L'}
                    </span>
                    <button
                      onClick={() => applyPreset(p.id)}
                      className="px-2 py-1 font-medium text-brand-400 hover:bg-brand-900/20 rounded transition-colors"
                    >
                      {t('preset.load')}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      className="p-1 text-neutral-800 hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Export / Import presets */}
            <div className="flex items-center gap-2 pt-2 border-gray-200">
              <button
                onClick={() => {
                  const exportData = JSON.stringify(presets, null, 2)
                  const blob = new Blob([exportData], { type: 'application/json' })
                  saveAs(blob, 'compressfast-presets.json')
                }}
                disabled={presets.length === 0}
                className="flex items-center gap-1 px-2 py-1 text-neutral-700 hover:text-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Upload className="w-3 h-3" />
                {isZh ? '导出预设' : 'Export'}
              </button>
              <label className="flex items-center gap-1 px-2 py-1 text-neutral-700 hover:text-brand-400 cursor-pointer transition-colors">
                <Download className="w-3 h-3" />
                {isZh ? '导入预设' : 'Import'}
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
      )}
    </div>
  )
}
