import type { MetadataRoute } from 'next'
import { TOOL_SLUGS } from '@/lib/tool-pages'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'

const STATIC_PAGES = ['', 'vs-tinypng', 'about', 'help', 'contact', 'privacy', 'terms', 'pro']

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const page of STATIC_PAGES) {
    const path = page ? `/${page}` : ''
    entries.push({
      url: `${BASE_URL}/zh${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 1 : 0.7,
    })
    entries.push({
      url: `${BASE_URL}/en${path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: page === '' ? 0.9 : 0.6,
    })
  }

  // SEO landing pages
  for (const tool of TOOL_SLUGS) {
    for (const lang of ['zh', 'en']) {
      entries.push({
        url: `${BASE_URL}/${lang}/tools/${tool}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })
    }
  }

  return entries
}
