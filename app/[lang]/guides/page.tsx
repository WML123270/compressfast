import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { GUIDES, GUIDE_SLUGS } from '@/lib/guide-pages'

interface Props { params: { lang: string } }

export function generateMetadata({ params }: Props): Metadata {
  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'
  return {
    title: isZh ? '图片压缩指南 | 极速压图' : 'Image Compression Guides | CompressFast',
    description: isZh
      ? '图片压缩实用指南合集：格式选择、无损压缩、邮件附件、网页优化，附真实数据与步骤。'
      : 'Practical image compression guides: format selection, lossless compression, email attachments, and web optimization — with real numbers and step-by-step instructions.',
    alternates: {
      canonical: `${siteUrl}/${params.lang}/guides`,
    },
  }
}

export default function GuidesIndexPage({ params }: Props) {
  const isZh = params.lang === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <section className="text-center space-y-3 pb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          {isZh ? '图片压缩指南' : 'Image Compression Guides'}
        </h1>
        <p className="text-sm sm:text-lg text-gray-700 max-w-xl mx-auto">
          {isZh
            ? '从格式选择到批量压缩，每个指南都有真实数据、分步教程和可立即上手的工具。'
            : 'From format selection to batch compression — every guide includes real numbers, step-by-step tutorials, and the tools to act on them.'}
        </p>
      </section>

      <div className="space-y-3">
        {GUIDE_SLUGS.map(slug => {
          const guide = GUIDES[slug]
          return (
            <Link
              key={slug}
              href={`/${params.lang}/guides/${slug}`}
              className="block p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <h2 className="font-semibold text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                    {isZh ? guide.heroTitleZh : guide.heroTitleEn}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {isZh ? guide.heroSubZh : guide.heroSubEn}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
              </div>
            </Link>
          )
        })}
      </div>

      <div className="text-center pt-2 pb-4">
        <Link href={`/${params.lang}`} className="text-gray-700 hover:text-blue-600 text-sm transition-colors">
          {isZh ? '← 返回首页，压缩更多图片' : '← Back to homepage — compress more images'}
        </Link>
      </div>
    </div>
  )
}
