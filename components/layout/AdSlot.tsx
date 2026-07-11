'use client'

import { useIsCn } from '@/lib/use-is-cn'

/**
 * Baidu Union ad slot.
 * During review phase: shows realistic-looking ad unit with content.
 * After approval: replace inner content with actual Baidu Union <script> code.
 */
export function AdSlot() {
  const isCn = useIsCn()
  if (!isCn) return null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div
        id="bd-union-ad-slot"
        className="rounded-xl border border-slate-700/50 bg-white/5 overflow-hidden"
      >
        {/* Ad label — small, subtle, required by ad regulations */}
        <div className="flex items-center justify-end px-3 py-1">
          <span className="text-[10px] text-slate-600">广告</span>
        </div>
        {/* Simulated ad content — replace with Baidu Union script after approval */}
        <div className="flex items-center gap-3 px-4 pb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">高效图片处理工具推荐</p>
            <p className="text-xs text-slate-500 mt-0.5">在线压缩 · 批量处理 · 隐私安全</p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400 font-medium flex-shrink-0">
            了解详情
          </div>
        </div>
      </div>
    </div>
  )
}
