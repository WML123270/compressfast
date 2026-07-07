'use client'

import { useState, useRef, useCallback } from 'react'
import { MoveHorizontal } from 'lucide-react'

interface ImageCompareProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel: string
  afterLabel: string
}

export function ImageCompare({ beforeSrc, afterSrc, beforeLabel, afterLabel }: ImageCompareProps) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(Number(e.target.value))
  }, [])

  // Support drag on the container (mouse + touch)
  const trackingRef = useRef(false)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current) return
    trackingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100))
    setPosition(pct)
  }, [])
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || !trackingRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100))
    setPosition(pct)
  }, [])
  const handlePointerUp = useCallback(() => {
    trackingRef.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-900 select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* After image (compressed) — full width behind */}
      <img
        src={afterSrc}
        alt={afterLabel}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      {/* Before image (original) — clipped to slider position */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(0,0,0,0.3)] pointer-events-none"
        style={{ left: `${position}%` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-slate-300 flex items-center justify-center pointer-events-none"
        style={{ left: `${position}%` }}
      >
        <MoveHorizontal className="w-3.5 h-3.5 text-slate-500" />
      </div>

      {/* Labels */}
      <div className="absolute bottom-2 left-2 pointer-events-none">
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-black/50 text-white backdrop-blur-sm">
          {beforeLabel}
        </span>
      </div>
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-black/50 text-white backdrop-blur-sm">
          {afterLabel}
        </span>
      </div>

      {/* Range input overlaid (invisible, captures drag) */}
      <input
        type="range"
        min={2}
        max={98}
        value={position}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
        aria-label="Comparison slider"
      />
    </div>
  )
}
