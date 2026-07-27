'use client'

import { useState, useRef, useCallback } from 'react'
import { MoveHorizontal, Columns2, Eye, Columns3 } from 'lucide-react'

type CompareMode = 'slider' | 'side-by-side' | 'toggle'

interface ImageCompareProps {
  beforeSrc: string
  afterSrc: string
  beforeLabel: string
  afterLabel: string
}

export function ImageCompare({ beforeSrc, afterSrc, beforeLabel, afterLabel }: ImageCompareProps) {
  const [mode, setMode] = useState<CompareMode>('slider')
  const [position, setPosition] = useState(50)
  const [showingBefore, setShowingBefore] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Slider handlers
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(Number(e.target.value))
  }, [])

  const trackingRef = useRef(false)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || mode !== 'slider') return
    trackingRef.current = true
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100))
    setPosition(pct)
  }, [mode])
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!containerRef.current || !trackingRef.current || mode !== 'slider') return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100))
    setPosition(pct)
  }, [mode])
  const handlePointerUp = useCallback(() => {
    trackingRef.current = false
  }, [])

  // Click toggle handler
  const handleToggleClick = useCallback(() => {
    if (mode === 'toggle') setShowingBefore(prev => !prev)
  }, [mode])

  const MODES: { key: CompareMode; label: string; icon: any }[] = [
    { key: 'slider', label: 'Slider', icon: MoveHorizontal },
    { key: 'side-by-side', label: 'Side by side', icon: Columns2 },
    { key: 'toggle', label: 'Click toggle', icon: Eye },
  ]

  return (
    <div className="space-y-2">
      {/* Mode switcher */}
      <div className="flex items-center gap-1">
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              mode === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-neutral-700 hover:bg-gray-200'
            }`}
            title={label}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Comparison area */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden rounded-lg bg-white select-none ${
          mode === 'toggle' ? 'cursor-pointer' : mode === 'slider' ? 'cursor-ew-resize touch-none' : ''
        }`}
        style={{ aspectRatio: mode === 'side-by-side' ? 'auto' : '16/9' }}
        onPointerDown={mode === 'slider' ? handlePointerDown : undefined}
        onPointerMove={mode === 'slider' ? handlePointerMove : undefined}
        onPointerUp={mode === 'slider' ? handlePointerUp : undefined}
        onPointerLeave={mode === 'slider' ? handlePointerUp : undefined}
        onClick={mode === 'toggle' ? handleToggleClick : undefined}
      >
        {mode === 'slider' && (
          <>
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
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-gray-300 flex items-center justify-center pointer-events-none"
              style={{ left: `${position}%` }}
            >
              <MoveHorizontal className="w-3.5 h-3.5 text-neutral-600" />
            </div>
            {/* Range input overlaid */}
            <input
              type="range"
              min={2}
              max={98}
              value={position}
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              aria-label="Comparison slider"
            />
          </>
        )}

        {mode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-0.5">
            <div className="relative">
              <img
                src={beforeSrc}
                alt={beforeLabel}
                loading="lazy"
                className="w-full h-auto object-contain"
                draggable={false}
              />
              <div className="absolute bottom-2 left-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-black/50 text-white">
                  {beforeLabel}
                </span>
              </div>
            </div>
            <div className="relative">
              <img
                src={afterSrc}
                alt={afterLabel}
                loading="lazy"
                className="w-full h-auto object-contain"
                draggable={false}
              />
              <div className="absolute bottom-2 right-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-600/70 text-white">
                  {afterLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {mode === 'toggle' && (
          <div className="relative" style={{ aspectRatio: '16/9' }}>
            <img
              src={showingBefore ? beforeSrc : afterSrc}
              alt={showingBefore ? beforeLabel : afterLabel}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                showingBefore ? 'bg-black/50 text-white' : 'bg-blue-600/70 text-white'
              }`}>
                {showingBefore ? beforeLabel : afterLabel}
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium">
                {showingBefore ? 'Click to see compressed →' : '← Click to see original'}
              </span>
            </div>
          </div>
        )}

        {/* Labels for slider mode */}
        {mode === 'slider' && (
          <>
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-black/50 text-white">
                {beforeLabel}
              </span>
            </div>
            <div className="absolute bottom-2 right-2 pointer-events-none">
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-600/70 text-white">
                {afterLabel}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
