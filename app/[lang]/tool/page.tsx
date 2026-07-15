'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield, Zap, Image, MousePointerClick, Download, Crown, ArrowRight, ArrowLeft } from 'lucide-react'
import { formatFileSize } from '@/lib/compression/utils'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { useCompressionStore } from '@/lib/store/compression-store'

export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { t, locale } = useT()
  const isCn = useIsCn()
  const { isPro, checkProStatus } = useCompressionStore()

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

  const features = [
    { icon: Shield, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: Image, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: Zap, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { icon: Download, title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
  ]

  const faqs = [
    { q: t('seo.q1'), a: t('seo.a1') },
    { q: t('seo.q4'), a: t('seo.a4') },
    { q: t('seo.q5'), a: t('seo.a5') },
    { q: t('seo.q6'), a: t('seo.a6') },
  ]

  const [compressCount, setCompressCount] = useState(0)
  const [totalBytesSaved, setTotalBytesSaved] = useState(0)

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

  const isZh = locale === 'zh'

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-blue-600 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> {isZh ? '← 返回工具' : '← Back to Tool'}
          </Link>
        </div>
        <section className="text-center space-y-3 pb-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-neutral-900">{t('landing.featuresTitle')}</h1>
          <p className="text-sm text-neutral-700">{t('hero.subtitle')}</p>
        </section>
        <LandingContent compressCount={compressCount} totalBytesSaved={totalBytesSaved} trustBadges={trustBadges} features={features} steps={steps} faqs={faqs} locale={locale} t={t} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-5">
      {/* Back to tool */}
      <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-neutral-600 hover:text-blue-600 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '← 返回工具' : '← Back to Tool'}
      </Link>

      {/* Hero */}
      <section className="text-center space-y-3 sm:space-y-4 pb-2 pt-2">
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

        {/* CTA to tool */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
          >
            {t('cta.start')} <ArrowRight className="w-4 h-4" />
          </Link>
          {!isCn && (
            <Link
              href={`/${locale}/pro`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 font-semibold text-sm transition-all"
            >
              <Crown className="w-4 h-4" /> {t('cta.pro')}
            </Link>
          )}
        </div>
        <p className="text-xs text-neutral-600 mt-2">{t('cta.subtitle')}</p>
      </section>

      <LandingContent compressCount={compressCount} totalBytesSaved={totalBytesSaved} trustBadges={trustBadges} features={features} steps={steps} faqs={faqs} locale={locale} t={t} />
    </div>
  )
}

function LandingContent({ compressCount, totalBytesSaved, trustBadges, features, steps, faqs, locale, t }: {
  compressCount: number; totalBytesSaved: number;
  trustBadges: { icon: any; label: string }[];
  features: { icon: any; title: string; desc: string }[];
  steps: { icon: any; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  locale: string; t: any;
}) {
  const isZh = locale === 'zh'

  return (
    <div className="max-w-4xl mx-auto pt-4 pb-4 space-y-6">
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

      {/* Trust Badges */}
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        {trustBadges.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1.5 py-3">
            <Icon className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-medium text-neutral-800">{label}</span>
          </div>
        ))}
      </div>

      {/* Feature Highlights — 4 cards */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-5 text-center">{t('landing.featuresTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-neutral-900 mb-1">{title}</h3>
                <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works — 3 steps */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-5 text-center">{t('steps.heading')}</h2>
        <div className="grid grid-cols-3 gap-4">
          {steps.map(({ icon: Icon, title, desc }, idx) => (
            <div key={idx} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="font-semibold text-sm text-neutral-900 mb-1">{title}</div>
              <p className="text-xs text-neutral-700">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Before/After Demo */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-base font-semibold text-neutral-900 mb-2 text-center">
          {isZh ? '看得出来区别吗？' : 'Can you tell the difference?'}
        </h2>
        <p className="text-sm text-neutral-700 text-center mb-5">
          {isZh ? '左边是原始图片，右边是压缩后的图片——肉眼几乎看不出差异' : 'Original vs compressed — barely any visual difference'}
        </p>
        <div>
          <img src="/demo-photo.png" alt={isZh ? '压缩前后对比' : 'Before/after comparison'} className="w-full rounded-lg" />
        </div>
      </div>

      {/* FAQ — 2×2 grid */}
      <div className="border-t border-gray-200 pt-5">
        <h2 className="text-base font-semibold text-neutral-900 mb-5 text-center">{t('seo.faq')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {faqs.map(({ q, a }, idx) => (
            <div key={idx} className="text-center p-4 rounded-xl bg-white border border-gray-200">
              <div className="text-sm font-medium text-neutral-800 mb-2">{q}</div>
              <p className="text-sm text-neutral-700 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-6 border-t border-gray-200">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-105"
        >
          {t('cta.start')} <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-neutral-600 mt-2">{t('cta.subtitle')}</p>
      </div>

      {/* Bottom links */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-5 pb-6">
        <Link href={`/${locale}`} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-base font-medium shadow-sm">
          {isZh ? '🏠 返回首页' : '🏠 Home'}
        </Link>
        <Link href={`/${locale}/help`} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-base font-medium shadow-sm">
          {isZh ? '🎓 帮助中心' : '🎓 Help'}
        </Link>
        <Link href={`/${locale}/about`} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-base font-medium shadow-sm">
          {isZh ? '💡 关于我们' : '💡 About'}
        </Link>
        <Link href={`/${locale}/contact`} className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-800 hover:text-blue-600 transition-all text-base font-medium shadow-sm">
          {isZh ? '📬 联系我们' : '📬 Contact'}
        </Link>
      </div>
    </div>
  )
}
