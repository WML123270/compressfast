'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { DropZone } from '@/components/compressor/DropZone'
import { useCompressionStore } from '@/lib/store/compression-store'
import { getLimits } from '@/lib/compression/types'
import { QuotaBanner } from '@/components/compressor/QuotaBanner'
import { formatFileSize } from '@/lib/compression/utils'
import { getExtensionFromType } from '@/lib/utils'
import Link from 'next/link'
import { Shield, Zap, Image, Crown, Camera } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { useToast } from '@/components/ui/Toast'
import { useKeyboardShortcuts } from '@/lib/use-keyboard-shortcuts'
import { AdSlot } from '@/components/layout/AdSlot'
import { PopularTools } from '@/components/layout/PopularTools'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { Mascot } from '@/components/compressor/Mascot'
import { ProductWindow } from '@/components/compressor/ProductWindow'
import { TOOLS } from '@/lib/tool-pages'
import { TOOL_ICONS, TOOL_SHORT } from '@/lib/tool-icons'
import { GUIDES, GUIDE_SLUGS } from '@/lib/guide-pages'

// Dynamic imports for heavy components — split from critical rendering path
const CompressionControls = dynamic(
  () => import('@/components/compressor/CompressionControls').then(m => m.CompressionControls),
  { ssr: false }
)
const WatermarkSettings = dynamic(
  () => import('@/components/compressor/WatermarkSettings').then(m => m.WatermarkSettings),
  { ssr: false }
)
const ImageList = dynamic(
  () => import('@/components/compressor/ImageList').then(m => m.ImageList),
  { ssr: false }
)
const AffiliateTeaser = dynamic(
  () => import('@/components/compressor/AffiliateTeaser').then(m => m.AffiliateTeaser),
  { ssr: false }
)

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

  const formatChips = isCn
    ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
    : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']

  /**
   * Hero 主体 —— SSR 占位版与水合后共用，避免两处样式漂移。
   * 只放不依赖 store 的内容（Pro 按钮读 isPro，留在水合后的分支里）。
   */
  const heroCore = (
    <>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium mb-1 sm:mb-2">
        <Shield className="w-3 h-3" /> {t('hero.badge')}
      </div>
      <div className="relative max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight leading-tight px-2">
          <span className="text-neutral-900">{t('hero.title')}</span>{' '}
          <span className="text-gradient">{t('hero.highlight')}</span>
        </h1>
        <Mascot width={170} className="absolute top-1/2 -translate-y-[20%] -right-14 sm:-right-44 animate-mascot hidden sm:block" />
      </div>
      <p className="text-sm sm:text-lg max-w-lg mx-auto text-neutral-700">
        {t('hero.subtitle')}
      </p>
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
        {formatChips.map(f => (
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
    </>
  )

  // SSR placeholder for crawlers — 视觉与水合后保持一致，否则用户会看到界面闪变
  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5" aria-busy="true">
        <AnimatedBackground />

        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          {heroCore}
        </section>

        <ProductWindow locale={locale}>
          <div className="border-[1.5px] border-dashed border-[#cfe0fb] bg-blue-50/60 rounded-2xl px-5 py-7 sm:py-8 text-center">
            <p className="font-medium text-neutral-700 mb-1">{t('dropzone.drag')}</p>
            <p className="text-sm text-neutral-500">
              {t('dropzone.hint', { maxFiles: getLimits(false).maxFiles, maxSize: formatFileSize(getLimits(false).maxSizePerFile) })}
            </p>
            <p className="text-neutral-500 mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-blue-100 text-xs">
              {t('dropzone.paste')}
              <kbd className="hidden sm:inline text-[10px] px-1 py-0.5 rounded bg-blue-50 text-neutral-600 font-mono">⌘V</kbd>
            </p>

            {/* 拍照压缩 —— 占位版用惰性 span 对齐水合后按钮的高度，避免布局跳动 */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm sm:text-base shadow-lg shadow-blue-500/20">
                <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
                <span>{t('dropzone.camera')}</span>
              </span>
            </div>
          </div>
        </ProductWindow>

        {/* All tools — server-rendered so crawlers see the full internal link list */}
        <section className="pt-2">
          <h2 className="text-lg font-bold text-neutral-900 mb-3">
            {locale === 'zh' ? '🔥 热门图片工具' : '🔥 Popular Image Tools'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Object.values(TOOLS).map(tool => (
              <Link
                key={tool.slug}
                href={`/${locale}/tools/${tool.slug}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <span className="text-lg flex-shrink-0">{TOOL_ICONS[tool.slug] || '🔧'}</span>
                <span className="text-sm font-medium text-neutral-800 truncate">
                  {locale === 'zh' ? (TOOL_SHORT[tool.slug]?.zh || tool.heroTitleZh) : (TOOL_SHORT[tool.slug]?.en || tool.heroTitleEn)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Guides — informational pages, server-rendered for crawler internal linking */}
        <section className="pt-2">
          <h2 className="text-lg font-bold text-neutral-900 mb-3">
            {locale === 'zh' ? '📖 图片压缩指南' : '📖 Image Compression Guides'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GUIDE_SLUGS.map(slug => (
              <Link
                key={slug}
                href={`/${locale}/guides/${slug}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <span className="text-sm font-medium text-neutral-800">
                  {locale === 'zh' ? GUIDES[slug].heroTitleZh : GUIDES[slug].heroTitleEn}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <AdSlot />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {/* 科技感动画背景（无文件时） */}
      {!hasFiles && <AnimatedBackground />}

      {/* Hero + Pro button */}
      {!hasFiles && (
        <section className="text-center space-y-3 sm:space-y-4 pb-2 sm:pb-4 pt-2 sm:pt-8">
          {heroCore}
          {!isCn && (
            <div className="flex items-center justify-center gap-4 pt-4">
              {isPro ? (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-sm font-semibold text-white transition-all">
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

      {/* Upload & Tool Area */}
      <DropZone />
      <PopularTools />

      <div className="max-w-2xl mx-auto">
        <QuotaBanner />
      </div>

      {/* Heavy compression UI — only load when files are present */}
      {hasFiles && (
        <>
          <CompressionControls />
          <WatermarkSettings />
        </>
      )}
      <ImageList />
      <AffiliateTeaser />
      <AdSlot />

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
