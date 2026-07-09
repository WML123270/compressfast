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
import { Shield, Zap, Share2, Check, Image, MousePointerClick, Download, ArrowRight, Crown } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { t, locale } = useT()
  const isCn = useIsCn()
  const { files, addFiles, isPro, proLoading, checkProStatus } = useCompressionStore()

  const formats = isCn
    ? ['PNG', 'JPEG', 'WebP', 'GIF', 'BMP', 'SVG', 'HEIC']
    : ['PNG', 'JPEG', 'WebP', 'AVIF', 'GIF', 'BMP', 'SVG', 'HEIC']
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

  // Render empty placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12" />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      {!hasFiles && (
        <section className="text-center space-y-4 pb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-medium mb-2">
            <Shield className="w-3 h-3" /> {t('hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {t('hero.title')} <span className="text-brand-600 dark:text-brand-400">{t('hero.highlight')}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg max-w-lg mx-auto">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 pt-1">
            {formats.map(f => (
              <span key={f} className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{f}</span>
            ))}
          </div>
          {!isCn && (
            <div className="flex items-center justify-center gap-3 pt-3">
              {isPro ? (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors">
                  <Crown className="w-4 h-4" /> {t('pro.active')}
                </Link>
              ) : (
                <Link href={`/${locale}/pro`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors">
                  <Crown className="w-4 h-4" /> {t('pro.badgePrice')}
                </Link>
              )}
              <Link href={`/${locale}/vs-tinypng`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2">
                vs TinyPNG →
              </Link>
            </div>
          )}
        </section>
      )}

      <DropZone />
      <CompressionControls />
      <WatermarkSettings />
      <ImageList />

      {!hasFiles && (
        <>
          {compressCount > 0 && (
            <div className="text-center py-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {locale === 'zh'
                  ? <>本设备已压缩 <span className="font-bold text-brand-600 dark:text-brand-400">{compressCount}</span> 张图片{totalBytesSaved > 0 && <>, 累计节省 <span className="font-bold text-brand-600 dark:text-brand-400">{formatFileSize(totalBytesSaved)}</span></>}</>
                  : <><span className="font-bold text-brand-600 dark:text-brand-400">{compressCount}</span> images compressed on this device{totalBytesSaved > 0 && <>, <span className="font-bold text-brand-600 dark:text-brand-400">{formatFileSize(totalBytesSaved)}</span> saved</>}</>
                }
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 py-4">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50">
                <Icon className="w-5 h-5 text-brand-500 dark:text-brand-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <section className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <h2 className="text-center text-base font-semibold text-slate-800 dark:text-slate-200 mb-5">{t('steps.heading')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {steps.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="relative text-center p-4">
                  {i < 2 && <div className="hidden sm:block absolute top-8 right-0 text-slate-300 dark:text-slate-600 -mr-2"><ArrowRight className="w-4 h-4" /></div>}
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm mb-1">{title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-400">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{t('seo.heading')}</h2>
              <p>{t('seo.p1')}</p>
              <ul className="space-y-1">
                <li><strong className="dark:text-slate-300">{t('seo.benefit1')}</strong></li>
                <li><strong className="dark:text-slate-300">{t('seo.benefit2')}</strong></li>
                <li><strong className="dark:text-slate-300">{t('seo.benefit3')}</strong></li>
                <li><strong className="dark:text-slate-300">{t('seo.benefit4')}</strong></li>
              </ul>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-6">{t('seo.faq')}</h2>
              <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('seo.q1')}</h3>
              <p>{t('seo.a1')}</p>
              <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('seo.q2')}</h3>
              <p>{t('seo.a2')}</p>
              <h3 className="font-medium text-slate-700 dark:text-slate-300">{t('seo.q3')}</h3>
              <p>{t('seo.a3')}</p>
            </div>
          </section>

          <ShareSection />
        </>
      )}
    </div>
  )
}

function ShareSection() {
  const { t } = useT()
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    const title = t('meta.title')
    if (navigator.share) { try { await navigator.share({ title, url }); return } catch {} }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  return (
    <section className="pt-6 text-center">
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{t('share.prompt')}</p>
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-sm transition-all text-sm font-medium"
      >
        {copied ? <><Check className="w-4 h-4 text-green-500" /> {t('share.copied')}</> : <><Share2 className="w-4 h-4" /> {t('share.button')}</>}
      </button>
    </section>
  )
}
