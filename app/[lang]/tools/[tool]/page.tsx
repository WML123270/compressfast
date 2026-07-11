import { notFound } from 'next/navigation'
import { TOOLS, TOOL_SLUGS } from '@/lib/tool-pages'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import { Upload, Shield, Zap, Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'

// Client component for the interactive tool area
const ToolClient = dynamic(() => import('./ToolClient'), { ssr: false })

interface Props { params: { tool: string; lang: string } }

export function generateStaticParams() {
  const params: { lang: string; tool: string }[] = []
  for (const lang of ['en', 'zh']) {
    for (const tool of TOOL_SLUGS) {
      params.push({ lang, tool })
    }
  }
  return params
}

export function generateMetadata({ params }: Props): Metadata {
  const tool = TOOLS[params.tool]
  if (!tool) return {}

  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'

  return {
    title: isZh ? tool.titleZh : tool.titleEn,
    description: isZh ? tool.descriptionZh : tool.descriptionEn,
    keywords: tool.keywords,
    alternates: {
      languages: {
        'en': `/${params.lang || 'en'}/tools/${params.tool}`,
        'zh': `/zh/tools/${params.tool}`,
        'x-default': `/en/tools/${params.tool}`,
      },
      canonical: `${siteUrl}/${params.lang}/tools/${params.tool}`,
    },
    openGraph: {
      title: isZh ? tool.titleZh : tool.titleEn,
      description: isZh ? tool.descriptionZh : tool.descriptionEn,
      type: 'website',
      siteName: 'CompressFast',
      images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    },
    other: {
      'baidu_union_verify': '88a78eaf1ef0ec38f4c7e7d4ca595e55',
    },
  }
}

export default function ToolPage({ params }: Props) {
  const tool = TOOLS[params.tool]
  if (!tool) notFound()

  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Hero */}
      <section className="text-center space-y-3 pb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-100">
          <span>{isZh ? tool.heroTitleZh : tool.heroTitleEn}</span>
        </h1>
        <p className="text-sm sm:text-lg text-slate-400 max-w-xl mx-auto">
          {isZh ? tool.heroSubZh : tool.heroSubEn}
        </p>
      </section>

      {/* Interactive Tool Area */}
      <ToolClient defaultSettings={tool.defaultSettings} />

      {/* Benefits */}
      <section className="pt-4">
        <h2 className="font-bold text-slate-100 text-lg mb-4">
          {isZh ? '为什么选择我们？' : 'Why Choose CompressFast?'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tool.benefits.map((b, i) => (
            <div key={i} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/20 transition-all group">
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-semibold text-sm mt-3 mb-1">{isZh ? b.titleZh : b.titleEn}</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{isZh ? b.descZh : b.descEn}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How To */}
      <section className="pt-4">
        <h2 className="font-bold text-slate-100 text-lg mb-4">
          {isZh ? '三步完成' : 'How to ' + (isZh ? '' : tool.heroTitleEn.split(' ').slice(1).join(' '))}
        </h2>
        <div className="space-y-3">
          {tool.howTo.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {step.step}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{isZh ? step.titleZh : step.titleEn}</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">{isZh ? step.descZh : step.descEn}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pt-4">
        <h2 className="font-bold text-slate-100 text-lg mb-4">
          {isZh ? '常见问题' : 'FAQ'}
        </h2>
        <div className="space-y-2">
          {tool.faqs.map((faq, i) => (
            <details key={i} className="group rounded-xl border border-slate-800 bg-white/5 overflow-hidden">
              <summary className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 cursor-pointer list-none">
                <span className="font-medium text-sm text-slate-200">{isZh ? faq.qZh : faq.qEn}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <p className="px-4 sm:px-5 pb-4 text-sm text-slate-400 leading-relaxed">{isZh ? faq.aZh : faq.aEn}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related Tools */}
      <section className="pt-4 pb-6">
        <h2 className="font-bold text-slate-100 text-lg mb-4">
          {isZh ? '相关工具' : 'Related Tools'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tool.relatedTools.map(slug => {
            const related = TOOLS[slug]
            if (!related) return null
            return (
              <Link
                key={slug}
                href={`/${params.lang}/tools/${slug}`}
                className="px-4 py-2 rounded-full bg-white/5 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-sm"
              >
                {isZh ? related.heroTitleZh : related.heroTitleEn}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Breadcrumb-like link back */}
      <div className="text-center pt-2 pb-4">
        <Link href={`/${params.lang}`} className="text-slate-500 hover:text-cyan-400 text-sm transition-colors">
          {isZh ? '← 返回首页，压缩更多图片' : '← Back to homepage — compress more images'}
        </Link>
      </div>
    </div>
  )
}
