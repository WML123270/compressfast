'use client'

import Link from 'next/link'
import { useIsCn } from '@/lib/use-is-cn'
import { useT } from '@/lib/i18n/context'
import { TOOLS } from '@/lib/tool-pages'
import { ArrowRight } from 'lucide-react'
import { TOOL_ICONS } from '@/lib/tool-icons'

const FEATURED = ['compress-png', 'compress-jpeg', 'convert-to-webp', 'webp-to-jpg', 'heic-to-jpg', 'compress-images']

export function PopularTools() {
  const isCn = useIsCn()
  const { locale } = useT()
  const isZh = locale === 'zh'

  // ─── CN: full 18-tool grid ──────────────────
  if (isCn) {
    const allTools = Object.values(TOOLS)
    return (
      <section className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
            {isZh ? '🔥 热门图片工具' : '🔥 Popular Image Tools'}
          </h2>
          <p className="text-sm text-neutral-600 mt-1.5">
            18款免费在线工具，全部浏览器本地处理，不上传服务器
          </p>
        </div>

        {/* AI 工具 —— 招牌 Pro 功能，置顶高亮 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-4">
          <Link
            href={`/${locale}/tools/remove-bg`}
            className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <span className="text-3xl flex-shrink-0">✂️</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-base flex items-center gap-2">
                {isZh ? 'AI 抠图' : 'AI Background Remover'}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/25">Pro</span>
              </p>
              <p className="text-xs text-white/85 mt-0.5">
                {isZh ? '一键去背景，换纯色/图片背景' : 'Remove background + replace with solid/image'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href={`/${locale}/tools/upscale`}
            className="group flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            <span className="text-3xl flex-shrink-0">🔍</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-base flex items-center gap-2">
                {isZh ? 'AI 放大' : 'AI Upscale'}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/25">Pro</span>
              </p>
              <p className="text-xs text-white/85 mt-0.5">
                {isZh ? '模糊小图无损放大 4 倍变高清' : 'Upscale blurry images 4x to high-res'}
              </p>
            </div>
            <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {allTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tools/${tool.slug}`}
              className="group flex items-start gap-2.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30 transition-all"
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{TOOL_ICONS[tool.slug] || '🔧'}</span>
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

  // ─── Overseas: compact row below DropZone ─────
  const featured = FEATURED.map(s => TOOLS[s]).filter(Boolean)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 pt-1">
        <span className="text-xs font-medium text-neutral-500 shrink-0 whitespace-nowrap">
          Quick tools:
        </span>
        <div className="flex items-center gap-1 flex-wrap">
          <Link
            href={`/${locale}/tools/remove-bg`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
          >
            <span>✂️</span> AI Remove BG
          </Link>
          <Link
            href={`/${locale}/tools/upscale`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
          >
            <span>🔍</span> AI Upscale
          </Link>
          {featured.map((tool: any) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tools/${tool.slug}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 text-neutral-600 hover:text-blue-600 hover:border-blue-300 transition-colors"
            >
              <span className="text-xs">{TOOL_ICONS[tool.slug] || '🔧'}</span>
              {tool.heroTitleEn}
            </Link>
          ))}
          <Link
            href={`/${locale}/tool`}
            className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
          >
            More <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}
