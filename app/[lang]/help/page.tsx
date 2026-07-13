'use client'

import Link from 'next/link'
import { ArrowLeft, BookOpen, Zap, Image, Settings, Download } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export default function HelpPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  const sections = [
    { id: 'quickstart', icon: Zap, title: t('help.quickStart'), desc: t('help.quickStart.desc') },
    { id: 'format', icon: Image, title: t('help.guide.format'), desc: t('help.guide.formatDesc') },
    { id: 'quality', icon: Settings, title: t('help.guide.quality'), desc: t('help.guide.qualityDesc') },
    { id: 'batch', icon: Download, title: t('help.guide.batch'), desc: t('help.guide.batchDesc') },
    { id: 'watermark', icon: BookOpen, title: t('help.guide.watermark'), desc: t('help.guide.watermarkDesc') },
    { id: 'resize', icon: Image, title: t('help.guide.resize'), desc: t('help.guide.resizeDesc') },
    { id: 'presets', icon: Zap, title: t('help.guide.presets'), desc: t('help.guide.presetsDesc') },
    { id: 'pro', icon: Zap, title: t('help.guide.pro'), desc: t('help.guide.proDesc') },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-sm text-neutral-700 dark:text-neutral-700 hover:text-blue-600 dark:hover:text-brand-400">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <section className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{t('help.title')}</h1>
        <p className="text-neutral-700 dark:text-neutral-700 mt-3 max-w-2xl mx-auto">{t('help.subtitle')}</p>
      </section>

      {/* Quick Start */}
      <section id="quickstart" className="bg-gradient-to-r from-brand-50 to-blue-50 dark:from-brand-900/20 dark:to-blue-900/20 border border-brand-200 dark:border-brand-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="w-6 h-6 text-blue-600 dark:text-brand-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('help.quickStart')}</h2>
        </div>
        <p className="text-sm text-neutral-800 dark:text-neutral-700 leading-relaxed">{t('help.quickStart.desc')}</p>
      </section>

      {/* Format Guide */}
      <section id="format">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.format')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.formatDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-200">
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '场景' : 'Scenario'}</th>
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '推荐格式' : 'Recommended'}</th>
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '原因' : 'Why'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {[
                { scene: isZh ? '网页图片' : 'Web images', fmt: 'WebP / AVIF', why: isZh ? '体积最小，加载快' : 'Smallest, fast loading' },
                { scene: isZh ? 'Logo/图标' : 'Logo/Icon', fmt: 'PNG', why: isZh ? '保留透明背景' : 'Retains transparency' },
                { scene: isZh ? '摄影作品' : 'Photography', fmt: 'JPEG 90-95%', why: isZh ? '兼容性最好' : 'Best compatibility' },
                { scene: isZh ? '商品图片' : 'Product photos', fmt: 'JPEG 85%', why: isZh ? '体积画质平衡' : 'Size-quality balance' },
                { scene: isZh ? '表情包' : 'Memes', fmt: 'GIF', why: isZh ? '支持动画' : 'Supports animation' },
                { scene: isZh ? '截图' : 'Screenshots', fmt: 'PNG', why: isZh ? '文字边缘清晰' : 'Sharp text edges' },
                { scene: isZh ? '打印输出' : 'Print', fmt: 'PNG / TIFF', why: isZh ? '无损保留细节' : 'Lossless detail' },
              ].map(row => (
                <tr key={row.scene} className="hover:bg-gray-50 dark:hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">{row.scene}</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-600 font-medium">{row.fmt}</td>
                  <td className="py-2.5 px-3 text-neutral-700 ">{row.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quality Guide */}
      <section id="quality">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.quality')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.qualityDesc')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-200">
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '画质' : 'Quality'}</th>
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '效果' : 'Result'}</th>
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '体积减少' : 'Size Reduction'}</th>
                <th className="text-left py-2 px-3 text-neutral-800 dark:text-neutral-700 font-medium">{isZh ? '适用场景' : 'Use Case'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {[
                { q: '95-100', r: isZh ? '几乎无损' : 'Near-lossless', s: '~20%', u: isZh ? '摄影、打印' : 'Photography, Print' },
                { q: '85-95', r: isZh ? '优良' : 'Excellent', s: '~50%', u: isZh ? '网页、社交媒体' : 'Web, Social Media' },
                { q: '70-85', r: isZh ? '良好' : 'Good', s: '~70%', u: isZh ? '电商、邮件' : 'E-commerce, Email' },
                { q: '50-70', r: isZh ? '可接受' : 'Acceptable', s: '~85%', u: isZh ? '预览、缩略图' : 'Previews, Thumbnails' },
                { q: '0-50', r: isZh ? '明显压缩' : 'Noticeable', s: '~95%', u: isZh ? '极限压缩' : 'Extreme compression' },
              ].map(row => (
                <tr key={row.q} className="hover:bg-gray-50 dark:hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-600">{row.q}</td>
                  <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">{row.r}</td>
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-500 font-medium">{row.s}</td>
                  <td className="py-2.5 px-3 text-neutral-700 ">{row.u}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Batch Tutorial */}
      <section id="batch">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.batch')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.batchDesc')}</p>
        <div className="space-y-3">
          {[
            t('help.guide.batchStep1'),
            t('help.guide.batchStep2'),
            t('help.guide.batchStep3'),
            t('help.guide.batchStep4'),
            t('help.guide.batchStep5'),
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-50 border border-gray-100 dark:border-gray-200/50">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">{i + 1}</span>
              <p className="text-sm text-neutral-800 dark:text-neutral-700 leading-relaxed pt-0.5">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Watermark Tutorial */}
      <section id="watermark">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.watermark')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.watermarkDesc')}</p>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-50 border border-gray-100 dark:border-gray-200/50">
            <h3 className="font-semibold text-slate-800 dark:text-neutral-900 text-sm mb-1">{isZh ? '文字水印' : 'Text Watermark'}</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-700 leading-relaxed">{t('help.guide.watermarkText')}</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-50 border border-gray-100 dark:border-gray-200/50">
            <h3 className="font-semibold text-slate-800 dark:text-neutral-900 text-sm mb-1">{isZh ? '图片水印' : 'Image Watermark'}</h3>
            <p className="text-sm text-neutral-700 dark:text-neutral-700 leading-relaxed">{t('help.guide.watermarkImage')}</p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">⚠️ {t('help.guide.watermarkNote')}</p>
          </div>
        </div>
      </section>

      {/* Resize Tutorial */}
      <section id="resize">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.resize')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.resizeDesc')}</p>
        <div className="space-y-2">
          {[t('help.guide.resizeOpt1'), t('help.guide.resizeOpt2'), t('help.guide.resizeOpt3')].map((opt, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-50">
              <span className="text-blue-600 dark:text-brand-400 font-bold shrink-0">{i + 1}.</span>
              <p className="text-sm text-neutral-800 dark:text-neutral-700 leading-relaxed">{opt}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scene Presets */}
      <section id="presets">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.presets')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.presetsDesc')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { key: 'social', color: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20', border: 'border-pink-200 dark:border-pink-700/50' },
            { key: 'web', color: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20', border: 'border-blue-200 dark:border-blue-700/50' },
            { key: 'shop', color: 'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20', border: 'border-amber-200 dark:border-amber-700/50' },
          ].map(({ key, color, border }) => (
            <div key={key} className={`p-4 rounded-xl bg-gradient-to-r ${color} border ${border}`}>
              <h3 className="font-semibold text-slate-800 dark:text-neutral-900 text-sm mb-2">
                {key === 'social' ? '📱' : key === 'web' ? '🌐' : '🛒'} {(() => {
                  if (key === 'social') return t('help.guide.presetsSocial').split('：')[0]
                  if (key === 'web') return t('help.guide.presetsWeb').split('：')[0]
                  return t('help.guide.presetsShop').split('：')[0]
                })()}
              </h3>
              <p className="text-xs text-neutral-800 dark:text-neutral-700 leading-relaxed">
                {key === 'social' ? t('help.guide.presetsSocial').split('：')[1] : key === 'web' ? t('help.guide.presetsWeb').split('：')[1] : t('help.guide.presetsShop').split('：')[1]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pro Info */}
      <section id="pro">
        <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-900 mb-3">{t('help.guide.pro')}</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-700 mb-4">{t('help.guide.proDesc')}</p>
        <div className="flex flex-wrap gap-2">
          {t('help.guide.proItems').split(' | ').map((item: string) => (
            <span key={item} className="px-3 py-1.5 rounded-full text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-blue-600 dark:text-blue-600 border border-brand-200 dark:border-brand-700/50">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link
            href={`/${locale}/pro`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-600 text-white font-medium transition-colors text-sm"
          >
            {isZh ? '了解 Pro 版' : 'Learn about Pro'} →
          </Link>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="border-t border-gray-200 dark:border-gray-200 pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href={`/${locale}`} className="px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-blue-600 dark:text-blue-600 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors font-medium">
            🏠 {isZh ? '返回首页' : 'Home'}
          </Link>
          <Link href={`/${locale}/about`} className="px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-100 text-neutral-800 dark:text-neutral-700 hover:bg-gray-100 dark:hover:bg-gray-100 transition-colors font-medium">
            ℹ️ {isZh ? '关于我们' : 'About Us'}
          </Link>
          <Link href={`/${locale}/vs-tinypng`} className="px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-100 text-neutral-800 dark:text-neutral-700 hover:bg-gray-100 dark:hover:bg-gray-100 transition-colors font-medium">
            ⚡ vs TinyPNG
          </Link>
        </div>
      </div>
    </div>
  )
}
