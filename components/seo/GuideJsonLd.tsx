import type { GuidePageData } from '@/lib/guide-pages'

interface Props {
  guide: GuidePageData
  lang: string
  siteUrl: string
}

/**
 * JSON-LD structured data for SEO guide (informational) pages.
 * Generates: Article, FAQPage, BreadcrumbList schemas.
 *
 * Article    → tells Google this is an informational piece, eligible for
 *              rich results and (with enough authority) featured snippets
 * FAQPage    → Google FAQ rich results (accordion in SERP)
 */
export function GuideJsonLd({ guide, lang, siteUrl }: Props) {
  const isZh = lang === 'zh'
  const pageUrl = `${siteUrl}/${lang}/guides/${guide.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: isZh ? guide.heroTitleZh : guide.heroTitleEn,
    description: isZh ? guide.descriptionZh : guide.descriptionEn,
    inLanguage: isZh ? 'zh-CN' : 'en-US',
    datePublished: '2026-08-17',
    dateModified: '2026-08-17',
    author: {
      '@type': 'Organization',
      name: 'CompressFast',
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CompressFast',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-512.png`,
      },
    },
    mainEntityOfPage: pageUrl,
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map(faq => ({
      '@type': 'Question',
      name: isZh ? faq.qZh : faq.qEn,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isZh ? faq.aZh : faq.aEn,
      },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isZh ? '极速压图' : 'CompressFast',
        item: `${siteUrl}/${lang}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isZh ? '指南' : 'Guides',
        item: `${siteUrl}/${lang}/guides`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isZh ? guide.heroTitleZh : guide.heroTitleEn,
        item: pageUrl,
      },
    ],
  }

  const allSchemas = [articleSchema, faqSchema, breadcrumbSchema]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': allSchemas }),
      }}
    />
  )
}
