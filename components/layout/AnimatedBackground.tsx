/**
 * 科技感动画背景（完整版）—— 网格点阵 + 漂浮光斑 + 节点连线。
 * 纯装饰，pointer-events-none + 负 z-index，不影响内容交互与布局。
 * 尊重 prefers-reduced-motion（光斑动画降级为静态）。
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* 网格点阵（径向淡化） */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgba(31,35,41,0.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(70% 60% at 50% 30%, #000 30%, transparent 80%)',
        }}
      />

      {/* 漂浮光斑 ×3 */}
      <div
        className="absolute rounded-full blur-[70px] opacity-40 animate-float [animation-duration:9s] motion-reduce:animate-none"
        style={{ width: 460, height: 460, top: -120, left: '8%', background: 'radial-gradient(circle, #3b82f6, transparent 70%)' }}
      />
      <div
        className="absolute rounded-full blur-[70px] opacity-40 animate-float [animation-duration:9s] [animation-delay:-3s] motion-reduce:animate-none"
        style={{ width: 380, height: 380, top: 40, right: '4%', background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }}
      />
      <div
        className="absolute rounded-full blur-[70px] opacity-25 animate-float [animation-duration:9s] [animation-delay:-5s] motion-reduce:animate-none"
        style={{ width: 320, height: 320, top: 420, left: '38%', background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }}
      />

      {/* 节点连线（抽象几何装饰） */}
      <svg className="absolute top-[300px] -left-[30px] w-[180px] opacity-50" viewBox="0 0 180 160" fill="none">
        <g stroke="#3b82f6" strokeWidth="1.2" opacity="0.7">
          <path d="M20 40 L70 20 L120 60 L150 30" />
          <path d="M70 20 L60 90 L120 60" />
          <path d="M60 90 L30 130 L110 120 L150 30" />
        </g>
        <g fill="#22d3ee">
          <circle cx="20" cy="40" r="4" /><circle cx="70" cy="20" r="5" /><circle cx="120" cy="60" r="4" />
          <circle cx="150" cy="30" r="4" /><circle cx="60" cy="90" r="5" /><circle cx="30" cy="130" r="4" /><circle cx="110" cy="120" r="4" />
        </g>
      </svg>
      <svg className="absolute top-[520px] -right-[20px] w-[200px] opacity-50 -scale-x-100" viewBox="0 0 180 160" fill="none">
        <g stroke="#3b82f6" strokeWidth="1.2" opacity="0.7">
          <path d="M20 40 L70 20 L120 60 L150 30" />
          <path d="M70 20 L60 90 L120 60" />
          <path d="M60 90 L30 130 L110 120 L150 30" />
        </g>
        <g fill="#22d3ee">
          <circle cx="20" cy="40" r="4" /><circle cx="70" cy="20" r="5" /><circle cx="120" cy="60" r="4" />
          <circle cx="150" cy="30" r="4" /><circle cx="60" cy="90" r="5" /><circle cx="30" cy="130" r="4" /><circle cx="110" cy="120" r="4" />
        </g>
      </svg>
    </div>
  )
}
