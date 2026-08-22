/**
 * 品牌 Logo —— 青蓝渐变圆角方块 + 压缩箭头图标。
 * 图标源自桌面 ui/ 的 jisuyatu-favicon.svg（原创品牌资产）。
 */
export function BrandLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="极速压图"
      className={className}
    >
      <defs>
        <linearGradient id="brandLogoG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="96" height="96" rx="24" fill="url(#brandLogoG)" />
      <rect x="32" y="24" width="56" height="26" rx="5" stroke="#fff" strokeWidth="5" fill="none" />
      <path
        d="M60 54 L60 66 M53 60 L60 68 L67 60"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="44" y="72" width="32" height="18" rx="4" stroke="#fff" strokeWidth="5" fill="none" />
    </svg>
  )
}
