'use client'

import { useCompressionStore } from '@/lib/store/compression-store'
import type { CompressionOptions } from '@/lib/compression/types'
import { Lock, AlertTriangle, FileImage, Camera, Globe, Dna, RotateCcw } from 'lucide-react'
import { useIsCn } from '@/lib/use-is-cn'
import { useT } from '@/lib/i18n/context'

interface FormatDef {
  value: CompressionOptions['outputFormat']
  label: string
  desc: string
  icon: any
  color: string
}

export function FormatSelector() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { options, setOptions, files, isPro } = useCompressionStore()
  const hasFiles = files.length > 0
  if (!hasFiles) return null

  const isZh = locale === 'zh'
  const effectiveFormat = options.outputFormat

  const hasTransparentSource = files.some(
    f => f.file.type === 'image/png' || f.file.type === 'image/gif' || f.file.type === 'image/svg+xml'
  )
  const losingTransparency = effectiveFormat === 'jpeg' && hasTransparentSource

  const FORMATS: FormatDef[] = [
    { value: 'original', label: t('controls.format.original'), desc: t('controls.format.originalDesc'), icon: RotateCcw, color: 'border-gray-300 bg-gray-100 text-neutral-800 hover:border-gray-300' },
    { value: 'png', label: 'PNG', desc: t('controls.format.pngDesc'), icon: FileImage, color: 'border-emerald-700/50 bg-emerald-900/10 text-emerald-400 hover:border-emerald-400' },
    { value: 'jpeg', label: 'JPEG', desc: t('controls.format.jpegDesc'), icon: Camera, color: 'border-amber-700/50 bg-amber-900/10 text-amber-400 hover:border-amber-400' },
    { value: 'webp', label: 'WebP', desc: t('controls.format.webpDesc'), icon: Globe, color: 'border-blue-200 bg-blue-50 text-blue-600 hover:border-blue-400' },
    ...(isCn ? [] : [{ value: 'avif' as CompressionOptions['outputFormat'], label: 'AVIF', desc: t('controls.format.avifDesc'), icon: Dna, color: 'border-purple-700/50 bg-purple-900/10 text-purple-400 hover:border-purple-400' }]),
  ]

  return (
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
            {t('controls.transparencyWarning')}
          </span>
        </div>
      )}
    </div>
  )
}

/** AVIF detail card — shown when AVIF is selected (Pro or upgrade prompt) */
export function AvifSection() {
  const { t, locale } = useT()
  const { options, isPro } = useCompressionStore()
  const hasFiles = useCompressionStore.getState().files.length > 0
  if (!hasFiles || options.outputFormat !== 'avif') return null

  const isZh = locale === 'zh'

  if (!isPro) {
    return (
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 rounded-lg bg-gray-100 border border-amber-700">
          <span className="text-lg">⭐</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-300">
              {isZh ? '升级 Pro 解锁 AVIF' : 'Upgrade to Pro for AVIF'}
            </p>
            <p className="text-amber-400 text-sm">
              {isZh ? '一次性买断 $24.99，永久使用' : 'One-time $24.99, lifetime access'}
            </p>
          </div>
          <a
            href={`/${locale}/pro`}
            className="flex-shrink-0 px-4 py-2 font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors text-sm sm:text-xs self-stretch sm:self-auto text-center"
          >
            {isZh ? '升级 →' : 'Upgrade →'}
          </a>
        </div>
        <p className="text-neutral-600">
          {isZh ? '免费版将使用原格式压缩' : 'Free tier will use original format'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-700 rounded-xl">
      <div className="flex items-center gap-2">
        <span className="text-lg">🧬</span>
        <h4 className="font-bold text-sm">{t('controls.format.avifTitle')}</h4>
      </div>
      <p className="text-neutral-700 leading-relaxed">
        {t('controls.format.avifWhat')}
      </p>
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
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-900/20 border border-amber-700">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-amber-300">{t('controls.format.avifNote')}</p>
      </div>
    </div>
  )
}
