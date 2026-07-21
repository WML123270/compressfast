'use client'

import { Shield, Zap, Download, ArrowLeft, Check, X, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'
import { DropZone } from '@/components/compressor/DropZone'
import { CompressionControls } from '@/components/compressor/CompressionControls'
import { ImageList } from '@/components/compressor/ImageList'
import { QuotaBanner } from '@/components/compressor/QuotaBanner'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useState, useEffect } from 'react'

export default function VsPage() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { syncServerQuota, checkProStatus } = useCompressionStore()

  useEffect(() => {
    checkProStatus().then(() => {
      if (!useCompressionStore.getState().isPro) syncServerQuota()
    })
  }, [])

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'
  const tools = [
    { name: t('app.name'), url: siteUrl,
      price: isCn ? (locale === 'zh' ? '完全免费' : 'Free') : t('vs.compressfast.price'),
      privacy: t('vs.compressfast.privacy'),
      batch: isCn ? (locale === 'zh' ? '30 张/次' : '30/batch') : '20/batch (Free) / 500/batch (Pro)',
      maxSize: isCn ? '25MB' : t('vs.compressfast.maxSize'),
      formats: t('vs.compressfast.formats'), lossless: true, highlight: true },
    { name: 'TinyPNG', url: 'https://tinypng.com', price: t('vs.tinypng.price'), privacy: t('vs.tinypng.privacy'), batch: t('vs.tinypng.batch'), maxSize: t('vs.tinypng.maxSize'), formats: t('vs.tinypng.formats'), lossless: false },
    { name: 'Squoosh', url: 'https://squoosh.app', price: t('vs.squoosh.price'), privacy: t('vs.squoosh.privacy'), batch: t('vs.squoosh.batch'), maxSize: t('vs.squoosh.maxSize'), formats: t('vs.squoosh.formats'), lossless: true },
    { name: 'iLoveIMG', url: 'https://www.iloveimg.com', price: t('vs.iloveimg.price'), privacy: t('vs.iloveimg.privacy'), batch: t('vs.iloveimg.batch'), maxSize: t('vs.iloveimg.maxSize'), formats: t('vs.iloveimg.formats'), lossless: false },
  ]

  const comparisonRows = [
    { label: t('vs.row.price'), key: 'price' as const },
    { label: t('vs.row.privacy'), key: 'privacy' as const },
    { label: t('vs.row.batch'), key: 'batch' as const },
    { label: t('vs.row.maxSize'), key: 'maxSize' as const },
    { label: t('vs.row.formats'), key: 'formats' as const },
    { label: t('vs.row.lossless'), key: 'lossless' as const, bool: true },
  ]

  const [showDemo, setShowDemo] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-neutral-700 hover:text-brand-400 mb-6">
        <ArrowLeft className="w-4 h-4" /> {t('vs.back')}
      </Link>

      <section className="text-center mb-10">
        <h1 className="sm:text-3xl font-bold text-slate-100">{t('vs.title')}</h1>
        <p className="text-neutral-700 mt-3 max-w-2xl mx-auto">{t('vs.subtitle')}</p>
      </section>

      {/* Try It Yourself — interactive demo */}
      <section className="mb-10 bg-gradient-to-b from-brand-900/10 to-transparent border border-brand-700/30 rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowDemo(!showDemo)}
          className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left hover:bg-brand-900/5 transition-colors"
        >
          <div>
            <h2 className="font-bold text-lg text-slate-100">
              {locale === 'zh' ? '⚡ 自己试试看' : '⚡ Try It Yourself'}
            </h2>
            <p className="text-sm text-neutral-700 mt-0.5">
              {locale === 'zh' ? '拖张图进来，几秒出结果——不用离开这个页面' : 'Drop an image, see results in seconds — without leaving this page'}
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 text-neutral-700 transition-transform ${showDemo ? 'rotate-180' : ''}`} />
        </button>
        {showDemo && (
          <div className="px-4 sm:px-6 pb-6 space-y-4">
            <DropZone />
            <div className="max-w-2xl mx-auto">
              <QuotaBanner />
            </div>
            <CompressionControls />
            <ImageList />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Shield, title: t('vs.insight1.title'), desc: t('vs.insight1.desc') },
          { icon: Zap, title: t('vs.insight2.title'), desc: t('vs.insight2.desc') },
          { icon: Download, title: t('vs.insight3.title'), desc: t('vs.insight3.desc') },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-100 border border-gray-200 rounded-xl p-5">
            <Icon className="w-6 h-6 text-brand-400 mb-2" />
            <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
            <p className="text-neutral-700 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <section className="mb-10">
        <h2 className="font-bold text-neutral-900 mb-4">{t('vs.comparison')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-gray-200">
                <th className="text-left py-3 px-4 text-neutral-700 font-medium">{t('vs.headerItem')}</th>
                {tools.map(tool => (
                  <th key={tool.name} className={`py-3 px-4 text-center ${tool.highlight ? 'text-blue-600 font-bold' : 'text-slate-300'}`}>
                    {tool.highlight ? '⭐ ' : ''}{tool.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-slate-700/50">
              {comparisonRows.map(row => (
                <tr key={row.label} className="hover:bg-gray-100">
                  <td className="py-3 px-4 font-medium text-slate-400">{row.label}</td>
                  {tools.map(tool => (
                    <td key={tool.name} className={`py-3 px-4 text-center ${tool.highlight ? 'bg-brand-50/30 bg-brand-900/10' : ''}`}>
                      {row.bool
                        ? (tool[row.key] ? <Check className="w-4 h-4 text-blue-500 mx-auto" /> : <X className="w-4 h-4 text-neutral-800 mx-auto" />)
                        : <span className={`text-xs sm:text-sm ${tool.highlight ? 'text-neutral-900 font-medium' : 'text-slate-400'}`}>{String(tool[row.key])}</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6 mb-10">
        <h2 className="font-bold text-slate-100">{t('vs.review')}</h2>

        <div className="bg-gradient-to-r from-brand-900/20 to-blue-900/20 border-brand-700 rounded-xl p-5">
          <h3 className="font-bold text-lg mb-2">{t('vs.review1.name')}</h3>
          <p className="text-neutral-700 leading-relaxed mb-3">{t('vs.review1.desc')}</p>
          <div className="flex flex-wrap gap-2">
            {t('vs.review1.tags').split(' / ').map(tag => (
              <span key={tag} className="px-2 py-0.5 font-medium rounded-full bg-brand-800/30 text-blue-600">{tag}</span>
            ))}
          </div>
        </div>

        {[
          { name: t('vs.review2.name'), desc: t('vs.review2.desc') },
          { name: t('vs.review3.name'), desc: t('vs.review3.desc') },
          { name: t('vs.review4.name'), desc: t('vs.review4.desc') },
        ].map(({ name, desc }) => (
          <div key={name} className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-neutral-900 mb-2">{name}</h3>
            <p className="text-neutral-700 leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      <section className="mb-10">
        <h2 className="font-bold text-neutral-900 mb-4">{t('vs.scenarios')}</h2>
        <div className="space-y-3">
          {[
            { who: t('vs.scenario.designer'), tool: t('vs.scenario.designer.tool'), why: t('vs.scenario.designer.why') },
            { who: t('vs.scenario.dev'), tool: t('vs.scenario.dev.tool'), why: t('vs.scenario.dev.why') },
            { who: t('vs.scenario.creator'), tool: t('vs.scenario.creator.tool'), why: t('vs.scenario.creator.why') },
            { who: t('vs.scenario.casual'), tool: t('vs.scenario.casual.tool'), why: t('vs.scenario.casual.why') },
          ].map(({ who, tool, why }) => (
            <div key={who} className="flex items-start gap-3 bg-gray-100 rounded-lg px-4 py-3">
              <span className="text-neutral-800 font-medium min-w-[100px]">{who}</span>
              <div>
                <p className="text-slate-200">{tool}</p>
                <p className="text-neutral-700 mt-0.5">{why}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-bold text-neutral-900 mb-4">{t('vs.faq')}</h2>
        <div className="space-y-4">
          {[
            { q: t('vs.faq.q1'), a: t('vs.faq.a1') },
            { q: t('vs.faq.q2'), a: t('vs.faq.a2') },
            { q: t('vs.faq.q3'), a: t('vs.faq.a3') },
            { q: t('vs.faq.q4'), a: t('vs.faq.a4') },
            { q: t('vs.faq.q5'), a: t('vs.faq.a5') },
            { q: t('vs.faq.q6'), a: t('vs.faq.a6') },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 className="font-semibold text-slate-200">{q}</h3>
              <p className="text-neutral-700 mt-1">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center bg-gradient-to-r from-brand-600 to-blue-600 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-2">{t('vs.cta.title')}</h2>
        <p className="opacity-90 mb-5 text-sm">{t('vs.cta.subtitle')}</p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:text-brand-800 font-medium rounded-xl transition-colors text-sm"
        >
          {t('vs.cta.button')} <ArrowLeft className="w-4 h-4 rotate-180" />
        </Link>
      </div>
    </div>
  )
}
