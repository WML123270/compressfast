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
import { Shield, Zap, Image, MousePointerClick, Download, Crown, Upload } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { AdSlot } from '@/components/layout/AdSlot'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { t, locale } = useT()
  const isCn = useIsCn()
  const { files, addFiles, isPro, proLoading, checkProStatus } = useCompressionStore()

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
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        {/* Hero — SSR visible for crawlers */}
        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium mb-1 sm:mb-2">
            <Shield className="w-3 h-3" /> {t('hero.badge')}
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto px-2">
            <span className="text-neutral-900">{t('hero.title')}</span>{' '}
            <span className="text-gradient">{t('hero.highlight')}</span>
          </h1>
          <p className="text-sm sm:text-lg max-w-lg mx-auto text-neutral-700">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            {(isCn
              ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
              : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']
            ).map(f => (
              <span key={f} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-gray-300 text-neutral-700">
                {f}
              </span>
            ))}
          </div>
          {isCn && (
            <p className="text-neutral-600 mt-1">
              {locale === 'zh' ? '🔒 纯本地处理 · 文件绝不上传 · 始终免费' : '🔒 Local Processing · No Upload · Always Free'}
            </p>
          )}
        </section>
        {/* Upload area placeholder for SSR */}
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-10 text-center bg-gray-50/50">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-500" />
          </div>
          <p className="font-semibold text-neutral-800 mb-2">{t('dropzone.drag')}</p>
          <p className="text-neutral-600">{t('dropzone.paste')}</p>
        </div>
        <AdSlot />
        <HomeContent compressCount={compressCount} totalBytesSaved={totalBytesSaved} trustBadges={trustBadges} steps={steps} locale={locale} t={t} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {!hasFiles && (
        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium mb-1 sm:mb-2">
            <Shield className="w-3 h-3" /> {t('hero.badge')}
          </div>
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto px-2">
            <span className="text-neutral-900">{t('hero.title')}</span>{' '}
            <span className="text-gradient">{t('hero.highlight')}</span>
          </h1>
          <p className="text-sm sm:text-lg max-w-lg mx-auto text-neutral-700">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            {(isCn
              ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
              : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']
            ).map(f => (
              <span key={f} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border border-gray-300 text-neutral-700">
                {f}
              </span>
            ))}
          </div>
          {!isCn && (
            <div className="flex items-center justify-center gap-4 pt-4">
              {isPro ? (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-sm font-semibold text-white transition-all">
                  <Crown className="w-4 h-4" /> {t('pro.active')}
                </Link>
              ) : (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-sm font-semibold text-white transition-all">
                  <Crown className="w-4 h-4" /> {t('pro.badgePrice')}
                </Link>
              )}
              <Link href={`/${locale}/vs-tinypng`} className="text-neutral-600 hover:text-blue-600 underline underline-offset-4 transition-colors">
                vs TinyPNG →
              </Link>
            </div>
          )}
          {isCn && (
            <p className="text-neutral-600 mt-1">
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

function CompareDemo({ locale }: { locale: string }) {
  return (
    <div>
      <img src="/demo-photo.png" alt={locale === 'zh' ? '压缩前后对比' : 'Before/after comparison'} className="w-full rounded-lg" />
    </div>
  )
}

function HomeContent({ compressCount, totalBytesSaved, trustBadges, locale, t }: {
  compressCount: number; totalBytesSaved: number;
  trustBadges: { icon: any; label: string }[];
  steps: { icon: any; title: string; desc: string }[];
  locale: string; t: any;
}) {
  const isZh = locale === 'zh'

  const faqs = [
    { q: t('seo.q1'), a: t('seo.a1') },
    { q: t('seo.q2'), a: t('seo.a2') },
    { q: t('seo.q3'), a: t('seo.a3') },
  ]

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-4 space-y-6">
      {/* Stats */}
      {compressCount > 0 && (
        <div className="flex items-center justify-center gap-10 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 tabular-nums">{compressCount.toLocaleString()}</div>
            <div className="text-xs text-neutral-600 mt-0.5">{isZh ? '已压缩' : 'Compressed'}</div>
          </div>
          {totalBytesSaved > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 tabular-nums">{formatFileSize(totalBytesSaved)}</div>
              <div className="text-xs text-neutral-600 mt-0.5">{isZh ? '已节省' : 'Saved'}</div>
            </div>
          )}
        </div>
      )}

      {/* Trust Badges — 1 row, 3 columns */}
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        {trustBadges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 py-3">
            <Icon className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-neutral-800">{label}</span>
          </div>
        ))}
      </div>

      {/* Before/After Demo */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-2 text-center">
          {isZh ? '看得出来区别吗？' : 'Can you tell the difference?'}
        </h2>
        <p className="text-sm text-neutral-700 text-center mb-5">
          {isZh ? '左边是原始图片，右边是压缩后的图片——肉眼几乎看不出差异' : 'Original vs compressed — barely any visual difference'}
        </p>
        <CompareDemo locale={locale} />
      </div>

      {/* FAQ — 3 columns */}
      <div className="border-t border-gray-200 pt-5">
        <h2 className="text-base font-semibold text-neutral-900 mb-5 text-center">{t('seo.faq')}</h2>
        <div className="grid grid-cols-3 gap-6">
          {faqs.map(({ q, a }, idx) => (
            <div key={idx} className="text-center">
              <div className="text-sm font-medium text-neutral-800 mb-2">{q}</div>
              <p className="text-sm text-neutral-700 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom links */}
      <div className="flex items-center justify-center gap-6 pt-4 pb-6 text-sm text-neutral-700">
        <Link href={`/${locale}/help`} className="hover:text-blue-600 transition-colors">{isZh ? '帮助中心' : 'Help'}</Link>
        <span className="text-gray-300 select-none">|</span>
        <Link href={`/${locale}/about`} className="hover:text-blue-600 transition-colors">{isZh ? '关于我们' : 'About'}</Link>
        <span className="text-gray-300 select-none">|</span>
        <Link href={`/${locale}/contact`} className="hover:text-blue-600 transition-colors">{isZh ? '联系我们' : 'Contact'}</Link>
      </div>
    </div>
  )
}

