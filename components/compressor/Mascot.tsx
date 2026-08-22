/**
 * 吉祥物 —— 原创青蓝机器人（public/mascot.svg）。
 * 无平台水印，可商用；与品牌青蓝渐变同源。
 */
export function Mascot({ width = 190, className = '' }: { width?: number; className?: string }) {
  return (
    <img
      src="/mascot.png"
      width={width}
      alt="极速压图吉祥物"
      className={className}
      loading="lazy"
      draggable={false}
    />
  )
}
