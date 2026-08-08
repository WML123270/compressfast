'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { DropZone } from '@/components/compressor/DropZone'
import { ImageList } from '@/components/compressor/ImageList'
import { CompressionControls } from '@/components/compressor/CompressionControls'
import { WatermarkSettings } from '@/components/compressor/WatermarkSettings'
import { DemoShowcase } from '@/components/compressor/DemoShowcase'
import { useCompressionStore } from '@/lib/store/compression-store'
import { getLimits } from '@/lib/compression/types'
import { QuotaBanner } from '@/components/compressor/QuotaBanner'
import { formatFileSize } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import Link from 'next/link'
import { Shield, Zap, Image, Crown } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { useToast } from '@/components/ui/Toast'
import { useKeyboardShortcuts } from '@/lib/use-keyboard-shortcuts'
import { AdSlot } from '@/components/layout/AdSlot'
import { PopularTools } from '@/components/layout/PopularTools'
import { AffiliateTeaser } from '@/components/compressor/AffiliateTeaser'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { t, locale } = useT()
  const isCn = useIsCn()
  const { toast } = useToast()
  const { files, addFiles, isPro, checkProStatus, syncServerQuota } = useCompressionStore()

  // Activate keyboard shortcuts
  useKeyboardShortcuts()

  const hasFiles = files.length > 0

  useEffect(() => {
    checkProStatus().then(() => {
      // After Pro status resolved, check server quota
      const { isPro } = useCompressionStore.getState()
      if (!isPro) useCompressionStore.getState().syncServerQuota()
    })
  }, [checkProStatus])

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
        const msg = t('dropzone.error.tooMany', { maxFiles: limits.maxFiles })
        toast(msg, 'error')
        return
      }
      addFiles(imageFiles)
    }
  }, [addFiles, files.length, t, isPro])

  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Stats
  const [compressCount, setCompressCount] = useState(0)
  const [totalBytesSaved, setTotalBytesSaved] = useState(0)
  const prevDoneRef = useRef(0)
  const doneCount = files.filter(f => f.status === 'done').length

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

  const trustBadges = [
    { icon: Shield, label: t('trust.local') },
    { icon: Image, label: t('trust.formats') },
    { icon: Zap, label: t('trust.batch') },
  ]

  // SSR placeholder for crawlers — minimal structure, key content visible
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5" aria-busy="true">
        <section className="text-center space-y-3 pb-2 pt-2">
          <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto px-2">
            <span className="text-neutral-900">{t('hero.title')}</span>{' '}
            <span className="text-gradient">{t('hero.highlight')}</span>
          </h1>
          <p className="text-sm sm:text-lg max-w-lg mx-auto text-neutral-700">
            {t('hero.subtitle')}
          </p>
        </section>
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 sm:p-10 text-center">
          <p className="font-semibold text-neutral-800">{t('dropzone.drag')}</p>
          <p className="text-neutral-600 mt-2">{t('dropzone.paste')}</p>
        </div>
        <AdSlot />
        {/* PopularTools — only on CN site, env var inlined at build time */}
        {process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'cn' && <PopularTools />}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {/* Hero + Pro button */}
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
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all">
                  <Crown className="w-4 h-4" /> {t('pro.active')}
                </Link>
              ) : (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-sm font-semibold text-white transition-all">
                  <Crown className="w-4 h-4" /> {t('pro.badgePrice')}
                </Link>
              )}
            </div>
          )}
          {isCn && (
            <p className="text-neutral-600 mt-1">
              {locale === 'zh' ? '🔒 纯本地处理 · 文件绝不上传 · 始终免费' : '🔒 Local Processing · No Upload · Always Free'}
            </p>
          )}
        </section>
      )}

      {/* Demo showcase — only when no files loaded */}
      {!hasFiles && <DemoShowcase />}

      {/* Upload & Tool Area */}
      <DropZone />

      <div className="max-w-2xl mx-auto">
        <QuotaBanner />
      </div>

      <CompressionControls />
      <WatermarkSettings />
      <ImageList />
      <AffiliateTeaser />
      <AdSlot />

      {/* Popular Tools Grid — CN site content enrichment */}
      <PopularTools />

      {/* Trust badges + Stats + Links below tool */}
      <div className="pt-6 space-y-6">
        {/* Stats */}
        {compressCount > 0 && (
          <div className="flex items-center justify-center gap-6 sm:gap-10 py-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-900 tabular-nums">{compressCount.toLocaleString()}</div>
              <div className="text-xs text-neutral-600 mt-0.5">{locale === 'zh' ? '已压缩' : 'Compressed'}</div>
            </div>
            {totalBytesSaved > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 tabular-nums">{formatFileSize(totalBytesSaved)}</div>
                <div className="text-xs text-neutral-600 mt-0.5">{locale === 'zh' ? '已节省' : 'Saved'}</div>
              </div>
            )}
          </div>
        )}

        {/* Trust Badges */}
        <div className="grid grid-cols-3 divide-x divide-gray-200 border-t border-gray-200 pt-4">
          {trustBadges.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 py-3">
              <Icon className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-neutral-800">{label}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-5 pb-6 border-t border-gray-200">
          <Link href={`/${locale}/tool`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-sm sm:text-base font-medium shadow-sm">
            {locale === 'zh' ? '📖 了解更多功能' : '📖 Learn More'}
          </Link>
          <Link href={`/${locale}/help`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-sm sm:text-base font-medium shadow-sm">
            {locale === 'zh' ? '🎓 帮助中心' : '🎓 Help'}
          </Link>
          <Link href={`/${locale}/about`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-sm sm:text-base font-medium shadow-sm">
            {locale === 'zh' ? '💡 关于我们' : '💡 About'}
          </Link>
          <Link href={`/${locale}/contact`} className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-sm sm:text-base font-medium shadow-sm">
            {locale === 'zh' ? '📬 联系我们' : '📬 Contact'}
          </Link>
        </div>
      </div>
    </div>
  )
}
