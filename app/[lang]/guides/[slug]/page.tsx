import { notFound } from 'next/navigation'
import { GUIDES, GUIDE_SLUGS } from '@/lib/guide-pages'
import { TOOLS } from '@/lib/tool-pages'
import type { Metadata } from 'next'
import { ChevronDown, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { GuideJsonLd } from '@/components/seo/GuideJsonLd'

interface Props { params: { slug: string; lang: string } }

export function generateStaticParams() {
  const params: { lang: string; slug: string }[] = []
  for (const lang of ['en', 'zh']) {
    for (const slug of GUIDE_SLUGS) {
      params.push({ lang, slug })
    }
  }
  return params
}

export function generateMetadata({ params }: Props): Metadata {
  const guide = GUIDES[params.slug]
  if (!guide) return {}

  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'

  return {
    title: isZh ? guide.titleZh : guide.titleEn,
    description: isZh ? guide.descriptionZh : guide.descriptionEn,
    keywords: guide.keywords,
    alternates: {
      languages: {
        'en': `/en/guides/${params.slug}`,
        'zh': `/zh/guides/${params.slug}`,
        'x-default': `/en/guides/${params.slug}`,
      },
      canonical: `${siteUrl}/${params.lang}/guides/${params.slug}`,
    },
    openGraph: {
      title: isZh ? guide.titleZh : guide.titleEn,
      description: isZh ? guide.descriptionZh : guide.descriptionEn,
      type: 'article',
      siteName: 'CompressFast',
      images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    },
    other: {
      'baidu_union_verify': 'e54d348ba3c0ecd5bd0cb95aa9e8d480',
    },
  }
}

/** Render a multi-paragraph body, preserving single newlines (list items) via whitespace-pre-line */
function Body({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').filter(Boolean).map((para, i) => (
        <p key={i} className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-line mb-3 last:mb-0">
          {para}
        </p>
      ))}
    </>
  )
}

export default function GuidePage({ params }: Props) {
  const guide = GUIDES[params.slug]
  if (!guide) notFound()

  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <GuideJsonLd guide={guide} lang={params.lang} siteUrl={siteUrl} />

      {/* Hero */}
      <section className="text-center space-y-3 pb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
          {isZh ? guide.heroTitleZh : guide.heroTitleEn}
        </h1>
        <p className="text-sm sm:text-lg text-gray-700 max-w-xl mx-auto">
          {isZh ? guide.heroSubZh : guide.heroSubEn}
        </p>
      </section>

      {/* Intro */}
      <section className="space-y-3">
        <Body text={isZh ? guide.introZh : guide.introEn} />
      </section>

      {/* Sections */}
      <div className="space-y-5">
        {guide.sections.map((section, i) => (
          <section key={i} className="p-5 rounded-xl bg-white border border-gray-200">
            <h2 className="font-bold text-gray-900 text-lg mb-3">
              {isZh ? section.headingZh : section.headingEn}
            </h2>
            <Body text={isZh ? section.bodyZh : section.bodyEn} />
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-center space-y-3">
        <h2 className="font-bold text-gray-900 text-lg">
          {isZh ? '开始压缩你的图片' : 'Start compressing your images'}
        </h2>
        <p className="text-sm text-gray-700 max-w-lg mx-auto">
          {isZh
            ? '免费、纯本地处理、文件不上传。一次拖入最多 30 张，几秒出结果。'
            : 'Free, 100% local, no upload. Drop up to 30 images at once and get results in seconds.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <Link
            href={`/${params.lang}/tools/compress-images`}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-sm font-semibold text-white transition-all"
          >
            {isZh ? '开始压缩' : 'Compress Now'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-2">
        <h2 className="font-bold text-gray-900 text-lg mb-4">
          {isZh ? '常见问题' : 'FAQ'}
        </h2>
        <div className="space-y-2">
          {guide.faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-gray-200 bg-white overflow-hidden">
              <summary className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 cursor-pointer list-none">
                <span className="font-semibold text-sm text-gray-900">{isZh ? faq.qZh : faq.qEn}</span>
                <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <p className="px-4 sm:px-5 pb-4 text-sm text-gray-700 leading-relaxed">{isZh ? faq.aZh : faq.aEn}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related Tools */}
      <section className="pt-2 pb-2">
        <h2 className="font-bold text-gray-900 text-lg mb-4">
          {isZh ? '相关工具' : 'Related Tools'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {guide.relatedTools.map(slug => {
            const related = TOOLS[slug]
            if (!related) return null
            return (
              <Link
                key={slug}
                href={`/${params.lang}/tools/${slug}`}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-all text-sm"
              >
                {isZh ? related.heroTitleZh : related.heroTitleEn}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Back */}
      <div className="text-center pt-2 pb-4">
        <Link href={`/${params.lang}`} className="text-gray-700 hover:text-blue-600 text-sm transition-colors">
          {isZh ? '← 返回首页，压缩更多图片' : '← Back to homepage — compress more images'}
        </Link>
      </div>
    </div>
  )
}
