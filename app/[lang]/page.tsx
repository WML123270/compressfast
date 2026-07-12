'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { DropZone } from '@/components/compressor/DropZone'
import { ImageList } from '@/components/compressor/ImageList'
import { CompressionControls } from '@/components/compressor/CompressionControls'
import { WatermarkSettings } from '@/components/compressor/WatermarkSettings'
import { useCompressionStore } from '@/lib/store/compression-store'
import { getLimits } from '@/lib/compression/types'
import { formatFileSize } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import Link from 'next/link'
import { Shield, Zap, Image, MousePointerClick, Download, Crown, ChevronDown, Upload } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { AdSlot } from '@/components/layout/AdSlot'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { t, locale } = useT()
  const isCn = useIsCn()
  const { files, addFiles, isPro, proLoading, checkProStatus } = useCompressionStore()

  const formatColors: Record<string, string> = {
    PNG: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    JPEG: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    WebP: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    AVIF: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    GIF: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    BMP: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    SVG: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    HEIC: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  }
  const hasFiles = files.length > 0
  const doneCount = files.filter(f => f.status === 'done').length

  useEffect(() => { checkProStatus() }, [checkProStatus])

  const steps = [
    { icon: MousePointerClick, title: t('steps.drop.title'), desc: t('steps.drop.desc') },
    { icon: Zap, title: t('steps.compress.title'), desc: t('steps.compress.desc') },
    { icon: Download, title: t('steps.download.title'), desc: t('steps.download.desc') },
  ]

  const trustBadges = [
    { icon: Shield, label: t('trust.local') },
    { icon: Image, label: t('trust.formats') },
    { icon: Zap, label: t('trust.batch') },
  ]

  const [compressCount, setCompressCount] = useState(0)
  const [totalBytesSaved, setTotalBytesSaved] = useState(0)
  const prevDoneRef = useRef(0)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('png-compressor-stats')
      if (raw) {
        const { total, bytesSaved } = JSON.parse(raw)
        setCompressCount(total || 0)
        setTotalBytesSaved(bytesSaved || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    const increment = doneCount - prevDoneRef.current
    if (increment > 0) {
      prevDoneRef.current = doneCount
      const doneFiles = files.filter(f => f.status === 'done')
      const savedThisRound = doneFiles.slice(-increment).reduce((sum, f) =>
        sum + (f.originalSize - (f.compressedSize || 0)), 0
      )
      try {
        const raw = localStorage.getItem('png-compressor-stats')
        const data = raw ? JSON.parse(raw) : { total: 0, bytesSaved: 0 }
        data.total = (data.total || 0) + increment
        data.bytesSaved = (data.bytesSaved || 0) + savedThisRound
        setCompressCount(data.total)
        setTotalBytesSaved(data.bytesSaved)
        localStorage.setItem('png-compressor-stats', JSON.stringify(data))
      } catch {}
    } else if (doneCount === 0) {
      prevDoneRef.current = 0
    }
  }, [doneCount])

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        if (blob) {
          const ext = getExtensionFromType(item.type)
          imageFiles.push(new File([blob], `clipboard_${Date.now()}_${i}${ext}`, { type: item.type }))
        }
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      const limits = getLimits(isPro)
      if (files.length >= limits.maxFiles) {
        alert(t('dropzone.error.tooMany', { maxFiles: limits.maxFiles }))
        return
      }
      addFiles(imageFiles)
    }
  }, [addFiles, files.length, t, isPro])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Render static content during SSR for SEO/Baidu crawler;
  // interactive tool UI renders after mount
  if (!mounted) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        {/* Hero — SSR visible for crawlers */}
        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium mb-1 sm:mb-2">
            <Shield className="w-3 h-3" /> {t('hero.badge')}
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto px-2">
            <span className="text-slate-100">{t('hero.title')}</span>{' '}
            <span className="text-gradient">{t('hero.highlight')}</span>
          </h1>
          <p className="text-sm sm:text-lg max-w-lg mx-auto leading-relaxed px-2">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            {(isCn
              ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
              : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']
            ).map(f => (
              <span key={f} className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${formatColors[f] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                {f === 'WebP' ? '⭐ ' : ''}{f}{f === 'WebP' ? ` ${locale === 'zh' ? '推荐' : 'Recommended'}` : ''}
              </span>
            ))}
          </div>
          {isCn && (
            <p className="text-slate-500 mt-1">
              {locale === 'zh' ? '🔒 纯本地处理 · 文件绝不上传 · 始终免费' : '🔒 Local Processing · No Upload · Always Free'}
            </p>
          )}
        </section>
        {/* Upload area placeholder for SSR */}
        <div className="border-2 border-dashed border-slate-700 rounded-2xl p-6 sm:p-10 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
            <Upload className="w-8 h-8 text-cyan-400" />
          </div>
          <p className="font-semibold text-slate-200 mb-2">{t('dropzone.drag')}</p>
          <p className="text-slate-400">{t('dropzone.paste')}</p>
        </div>
        <AdSlot />
        <HomeContent compressCount={compressCount} totalBytesSaved={totalBytesSaved} trustBadges={trustBadges} steps={steps} locale={locale} t={t} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {!hasFiles && (
        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium mb-1 sm:mb-2 animate-pulse-slow">
            <Shield className="w-3 h-3" /> {t('hero.badge')}
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto px-2">
            <span className="text-slate-100">{t('hero.title')}</span>{' '}
            <span className="text-gradient">{t('hero.highlight')}</span>
          </h1>
          <p className="text-sm sm:text-lg max-w-lg mx-auto leading-relaxed px-2">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            {(isCn
              ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
              : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']
            ).map(f => (
              <span key={f} className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${formatColors[f] || 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                {f === 'WebP' ? '⭐ ' : ''}{f}{f === 'WebP' ? ` ${locale === 'zh' ? '推荐' : 'Recommended'}` : ''}
              </span>
            ))}
          </div>
          {!isCn && (
            <div className="flex items-center justify-center gap-4 pt-4">
              {isPro ? (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-sm font-semibold transition-all shadow-green-500/25">
                  <Crown className="w-4 h-4" /> {t('pro.active')}
                </Link>
              ) : (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-sm font-semibold transition-all shadow-amber-500/25">
                  <Crown className="w-4 h-4" /> {t('pro.badgePrice')}
                </Link>
              )}
              <Link href={`/${locale}/vs-tinypng`} className="text-slate-400 hover:text-cyan-400 underline underline-offset-4 transition-colors">
                vs TinyPNG →
              </Link>
            </div>
          )}
          {isCn && (
            <p className="text-slate-500 mt-1">
              {locale === 'zh' ? '🔒 纯本地处理 · 文件绝不上传 · 始终免费' : '🔒 Local Processing · No Upload · Always Free'}
            </p>
          )}
        </section>
      )}

      <DropZone />
      <CompressionControls />
      <WatermarkSettings />
      <ImageList />
      <AdSlot />

      {/* Rich content sections — always visible for SEO and Baidu Alliance review */}
      <HomeContent compressCount={compressCount} totalBytesSaved={totalBytesSaved} trustBadges={trustBadges} steps={steps} locale={locale} t={t} />
    </div>
  )
}

function HomeContent({ compressCount, totalBytesSaved, trustBadges, steps, locale, t }: {
  compressCount: number; totalBytesSaved: number;
  trustBadges: { icon: any; label: string }[];
  steps: { icon: any; title: string; desc: string }[];
  locale: string; t: any;
}) {
  const isZh = locale === 'zh'
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  const formats = [
    { key: 'png', icon: '🖼️', color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20' },
    { key: 'jpeg', icon: '📷', color: 'from-amber-500/10 to-amber-600/5 border-amber-500/20' },
    { key: 'webp', icon: '🌐', color: 'from-cyan-500/10 to-cyan-600/5 border-cyan-500/20' },
    { key: 'avif', icon: '🚀', color: 'from-purple-500/10 to-purple-600/5 border-purple-500/20' },
    { key: 'gif', icon: '🎞️', color: 'from-pink-500/10 to-pink-600/5 border-pink-500/20' },
    { key: 'bmp', icon: '🖌️', color: 'from-slate-500/10 to-slate-600/5 border-slate-500/20' },
    { key: 'svg', icon: '📐', color: 'from-orange-500/10 to-orange-600/5 border-orange-500/20' },
    { key: 'heic', icon: '🍎', color: 'from-blue-500/10 to-blue-600/5 border-blue-500/20' },
  ] as const

  const features = [
    { key: 'batch', icon: '📦', color: 'border-cyan-500/20 hover:border-cyan-500/40' },
    { key: 'privacy', icon: '🔒', color: 'border-emerald-500/20 hover:border-emerald-500/40' },
    { key: 'resize', icon: '📏', color: 'border-purple-500/20 hover:border-purple-500/40' },
    { key: 'watermark', icon: '💧', color: 'border-blue-500/20 hover:border-blue-500/40' },
    { key: 'rename', icon: '🏷️', color: 'border-amber-500/20 hover:border-amber-500/40' },
    { key: 'format', icon: '🔄', color: 'border-pink-500/20 hover:border-pink-500/40' },
  ] as const

  const scenarios = [
    { key: 'web', icon: '💻', gradient: 'from-cyan-500/10 to-blue-600/5 border-cyan-500/20' },
    { key: 'social', icon: '📱', gradient: 'from-pink-500/10 to-rose-600/5 border-pink-500/20' },
    { key: 'shop', icon: '🛒', gradient: 'from-amber-500/10 to-orange-600/5 border-amber-500/20' },
    { key: 'photo', icon: '📸', gradient: 'from-purple-500/10 to-violet-600/5 border-purple-500/20' },
    { key: 'doc', icon: '📄', gradient: 'from-emerald-500/10 to-green-600/5 border-emerald-500/20' },
  ] as const

  const FAQs = [
    { q: t('seo.q1'), a: t('seo.a1') },
    { q: t('seo.q2'), a: t('seo.a2') },
    { q: t('seo.q3'), a: t('seo.a3') },
    { q: t('seo.q4'), a: t('seo.a4') },
    { q: t('seo.q5'), a: t('seo.a5') },
    { q: t('seo.q6'), a: t('seo.a6') },
  ]

  return (
    <>
      {/* Stats Bar */}
      {compressCount > 0 && (
        <div className="flex items-center justify-center gap-4 sm:gap-10 py-4 sm:py-5 px-4 sm:px-6 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
          <div className="text-center">
            <div className="text-xl sm:text-3xl font-extrabold text-gradient tabular-nums">{compressCount.toLocaleString()}</div>
            <div className="text-xs sm:text-sm text-slate-400 mt-1">{isZh ? '已压缩' : 'Compressed'}</div>
          </div>
          {totalBytesSaved > 0 && (
            <div className="text-center">
              <div className="text-xl sm:text-3xl font-extrabold text-gradient-warm tabular-nums">{formatFileSize(totalBytesSaved)}</div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">{isZh ? '已节省' : 'Saved'}</div>
            </div>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 py-2 sm:py-4">
        {trustBadges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all duration-300 group">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm text-slate-400 group-hover:text-slate-200 text-center leading-tight transition-colors">{label}</span>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <section className="section-divider pt-6 sm:pt-10">
        <h2 className="text-center font-bold text-slate-100 mb-4 sm:mb-6">{t('steps.heading')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {steps.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border-cyan-500/50 flex items-center justify-center font-bold text-sm text-cyan-400">
                {i + 1}
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mt-2 mb-3 sm:mb-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
              </div>
              <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">{title}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Rich Content ===== */}
      <div className="space-y-8 sm:space-y-12 pt-4 sm:pt-8">

        {/* Format Guide */}
        <section>
          <h2 className="font-bold text-slate-100 mb-1 sm:mb-2 text-lg">{t('home.formats.title')}</h2>
          <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">{t('home.formats.desc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {formats.map(({ key, icon, color }) => (
              <div key={key} className={`flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r ${color} border transition-all duration-300 hover:scale-[1.02]`}>
                <span className="text-xl sm:text-2xl shrink-0">{icon}</span>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">{t(`home.formats.${key}.name`)}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">{t(`home.formats.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="font-bold text-slate-100 mb-1 sm:mb-2 text-lg">{t('home.features.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map(({ key, icon, color }) => (
              <div key={key} className={`p-4 sm:p-5 rounded-2xl bg-white/5 border ${color} transition-all duration-300 hover:bg-white/10 hover:shadow-lg`}>
                <span className="text-xl sm:text-2xl">{icon}</span>
                <h3 className="font-semibold text-xs sm:text-sm mt-2 sm:mt-3 mb-1">{t(`home.features.${key}`)}</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{t(`home.features.${key}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scenarios */}
        <section>
          <h2 className="font-bold text-slate-100 mb-1 sm:mb-2 text-lg">{t('home.scenarios.title')}</h2>
          <div className="space-y-2 sm:space-y-3">
            {scenarios.map(({ key, icon, gradient }) => (
              <div key={key} className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r ${gradient} border transition-all duration-300 hover:scale-[1.01]`}>
                <span className="text-xl sm:text-2xl shrink-0 mt-0.5">{icon}</span>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm">{t(`home.scenarios.${key}`)}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5 leading-relaxed">{t(`home.scenarios.${key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Accordion */}
        <section className="section-divider pt-6 sm:pt-10">
          <h2 className="font-bold text-slate-100 mb-3 sm:mb-4 text-lg">{t('seo.faq')}</h2>
          <div className="space-y-2 sm:space-y-2.5">
            {FAQs.map(({ q, a }, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-white/5 overflow-hidden transition-all duration-300 hover:border-slate-700">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 text-left"
                >
                  <span className="font-medium text-sm sm:text-base text-slate-200">Q: {q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${faqOpen === idx ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${faqOpen === idx ? 'max-h-96 pb-3 sm:pb-4' : 'max-h-0'}`}>
                  <p className="px-4 sm:px-5 text-sm sm:text-base text-slate-400 leading-relaxed">{a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Links */}
        <section className="pt-4 sm:pt-6 pb-6 sm:pb-8 text-center">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <Link href={`/${locale}/help`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium">
              📖 {isZh ? '帮助中心' : 'Help Center'}
            </Link>
            <Link href={`/${locale}/about`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-slate-700 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all font-medium">
              ℹ️ {isZh ? '关于我们' : 'About Us'}
            </Link>
            <Link href={`/${locale}/contact`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-slate-700 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all font-medium">
              📧 {isZh ? '联系我们' : 'Contact'}
            </Link>
            <Link href={`/${locale}/vs-tinypng`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/5 border border-slate-700 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all font-medium">
              ⚡ vs TinyPNG
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}

