'use client'

import Link from 'next/link'
import { useIsCn } from '@/lib/use-is-cn'
import { useT } from '@/lib/i18n/context'
import { TOOLS } from '@/lib/tool-pages'

/** Emoji icons for each tool slug — for visual appeal */
const ICONS: Record<string, string> = {
  'compress-png': '🖼️',
  'compress-jpeg': '📸',
  'convert-to-webp': '🌐',
  'compress-images': '🗜️',
  'compress-gif': '🎞️',
  'resize-image': '📐',
  'convert-jpg-to-png': '🔀',
  'webp-to-png': '🔄',
  'remove-metadata': '🧹',
  'tinypng-alternative': '⚡',
  'heic-to-jpg': '🍎',
  'heic-to-png': '🍏',
  'compress-svg': '📊',
  'png-to-jpg': '🖼️',
  'jpg-to-webp': '📸',
  'png-to-webp': '🖼️',
  'svg-to-png': '📊',
  'webp-to-jpg': '🌐',
}

/**
 * PopularTools — homepage section showing all SEO tool pages
 * Only rendered on domestic (CN) site to enrich homepage content
 * for Baidu Union review and internal linking SEO.
 */
export function PopularTools() {
  const isCn = useIsCn()
  const { locale } = useT()
  if (!isCn) return null

  const tools = Object.values(TOOLS)
  const isZh = locale === 'zh'

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      {/* Section header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
          {isZh ? '🔥 热门图片工具' : '🔥 Popular Image Tools'}
        </h2>
        <p className="text-sm text-neutral-600 mt-1.5">
          {isZh
            ? '18款免费在线工具，全部浏览器本地处理，不上传服务器'
            : '18 free online tools, all browser-based, no upload'}
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${locale}/tools/${tool.slug}`}
            className="group flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30 transition-all"
          >
            <span className="text-lg flex-shrink-0 mt-0.5" aria-hidden="true">
              {ICONS[tool.slug] || '🔧'}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-800 group-hover:text-blue-600 transition-colors truncate">
                {isZh ? tool.heroTitleZh : tool.heroTitleEn}
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-relaxed">
                {isZh ? tool.heroSubZh : tool.heroSubEn}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
