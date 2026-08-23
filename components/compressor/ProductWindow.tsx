/**
 * 产品窗口外壳 —— 标题栏（三色点 + 站名 + Web Worker 标签）+ 毛玻璃卡片。
 *
 * 由 DropZone（水合后）和首页 SSR 占位版共用：两处若各写一份，改版时必然漂移
 * （2026-08-23 就发生过——占位版还停留在旧的虚线框样式，导致水合前后闪烁）。
 */
export function ProductWindow({
  locale,
  children,
}: {
  locale: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[22px] p-[1.5px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent">
      <div className="rounded-[20px] bg-white/70 backdrop-blur-xl overflow-hidden shadow-[0_24px_70px_rgba(16,24,40,0.14)]">
        {/* 标题栏 */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100 bg-white/55">
          <span className="flex gap-1.5 flex-none">
            <i className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <i className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <i className="w-3 h-3 rounded-full bg-[#28c840]" />
          </span>
          <span className="text-[13px] text-neutral-500 font-medium truncate">
            {locale === 'zh' ? '极速压图 — 浏览器本地' : 'CompressFast — In Browser'}
          </span>
          <span className="ml-auto text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full flex-none">
            ⚡ Web Worker
          </span>
        </div>

        {/* 主体 */}
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  )
}
