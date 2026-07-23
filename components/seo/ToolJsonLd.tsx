import type { ToolPageData } from '@/lib/tool-pages'
import { TOOLS } from '@/lib/tool-pages'

interface Props {
  tool: ToolPageData
  lang: string
  siteUrl: string
}

/**
 * JSON-LD structured data for SEO tool pages.
 * Generates: FAQPage, HowTo, WebApplication, BreadcrumbList schemas.
 *
 * FAQPage → Google FAQ rich results (accordion in SERP)
 * HowTo   → Google How-to rich results (step cards in SERP)
 * WebApplication → helps Google understand this is a tool, not just a page
 */
export function ToolJsonLd({ tool, lang, siteUrl }: Props) {
  const isZh = lang === 'zh'
  const pageUrl = `${siteUrl}/${lang}/tools/${tool.slug}`

  // FAQPage schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: tool.faqs.map(faq => ({
      '@type': 'Question',
      name: isZh ? faq.qZh : faq.qEn,
      acceptedAnswer: {
        '@type': 'Answer',
        text: isZh ? faq.aZh : faq.aEn,
      },
    })),
  }

  // HowTo schema
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: isZh ? tool.heroTitleZh : tool.heroTitleEn,
    description: isZh ? tool.descriptionZh : tool.descriptionEn,
    step: tool.howTo.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: isZh ? step.titleZh : step.titleEn,
      text: isZh ? step.descZh : step.descEn,
    })),
  }

  // WebApplication schema — tells Google this is an interactive tool
  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: isZh ? tool.heroTitleZh : tool.heroTitleEn,
    description: isZh ? tool.descriptionZh : tool.descriptionEn,
    url: pageUrl,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    browserRequirements: 'Requires JavaScript',
  }

  // BreadcrumbList schema
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
        name: isZh ? '工具' : 'Tools',
        item: `${siteUrl}/${lang}/tool`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: isZh ? tool.heroTitleZh : tool.heroTitleEn,
        item: pageUrl,
      },
    ],
  }

  // Related tools as ItemList
  const relatedSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: isZh ? '相关工具' : 'Related Tools',
    itemListElement: tool.relatedTools.map((slug, i) => {
      const related = TOOLS[slug]
      if (!related) return null
      return {
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'WebApplication',
          name: isZh ? related.heroTitleZh : related.heroTitleEn,
          url: `${siteUrl}/${lang}/tools/${slug}`,
        },
      }
    }).filter(Boolean),
  }

  const allSchemas = [faqSchema, howToSchema, appSchema, breadcrumbSchema, relatedSchema]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(
          // Wrap in @graph for cleaner schema.org representation
          { '@context': 'https://schema.org', '@graph': allSchemas },
        ),
      }}
    />
  )
}
