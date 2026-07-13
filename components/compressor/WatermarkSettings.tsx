'use client'

import { useState, useRef } from 'react'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useT } from '@/lib/i18n/context'
import { Image, Type, X, Upload, ChevronDown, ChevronUp } from 'lucide-react'
import type { WatermarkType, WatermarkPosition } from '@/lib/compression/types'

const POSITIONS: { value: WatermarkPosition; label: string; col: number; row: number }[] = [
  { value: 'tl', label: '↖', col: 0, row: 0 },
  { value: 'tc', label: '↑', col: 1, row: 0 },
  { value: 'tr', label: '↗', col: 2, row: 0 },
  { value: 'ml', label: '←', col: 0, row: 1 },
  { value: 'mc', label: '•', col: 1, row: 1 },
  { value: 'mr', label: '→', col: 2, row: 1 },
  { value: 'bl', label: '↙', col: 0, row: 2 },
  { value: 'bc', label: '↓', col: 1, row: 2 },
  { value: 'br', label: '↘', col: 2, row: 2 },
]

const TYPES: { value: WatermarkType; labelZh: string; labelEn: string }[] = [
  { value: 'text', labelZh: '文字', labelEn: 'Text' },
  { value: 'image', labelZh: '图片', labelEn: 'Image' },
]

export function WatermarkSettings() {
  const { t, locale } = useT()
  const { watermark, setWatermark, files } = useCompressionStore()
  const [expanded, setExpanded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasFiles = files.length > 0
  const isZh = locale === 'zh'

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // 拒绝 SVG 防止 XSS（SVG 可嵌入 <script>）
    if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
      alert(isZh ? '不支持 SVG 格式水印，请使用 PNG/JPG' : 'SVG watermarks are not supported. Use PNG or JPG.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setWatermark({ imageDataUrl: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setWatermark({ imageDataUrl: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!hasFiles) return null

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 font-medium text-neutral-800 hover:bg-gray-50/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Image className="w-4 h-4 text-neutral-700" />
          {isZh ? '水印设置' : 'Watermark'}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-gray-200 pt-3">
          {/* Enable toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={watermark.enabled}
              onChange={(e) => setWatermark({ enabled: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-600"
            />
            <span className="text-neutral-800 font-medium">
              {isZh ? '添加水印' : 'Add Watermark'}
            </span>
          </label>

          {watermark.enabled && (
            <>
              {/* Type selector */}
              <div className="flex gap-1.5">
                {TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setWatermark({ type: t.value })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      watermark.type === t.value
                        ? 'border-blue-500 bg-brand-900/30 text-blue-600'
                        : 'border-gray-300 text-neutral-700 hover:border-gray-300'
                    }`}
                  >
                    {t.value === 'text' ? <Type className="w-3.5 h-3.5" /> : <Image className="w-3.5 h-3.5" />}
                    {isZh ? t.labelZh : t.labelEn}
                  </button>
                ))}
              </div>

              {/* Text watermark settings */}
              {watermark.type === 'text' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={watermark.text}
                    onChange={(e) => setWatermark({ text: e.target.value })}
                    placeholder={isZh ? '水印文字，如 ©2024 YourName' : 'e.g. ©2024 YourName'}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-neutral-700">{isZh ? '字号' : 'Size'}</label>
                      <input
                        type="range" min={12} max={120}
                        value={watermark.fontSize}
                        onChange={(e) => setWatermark({ fontSize: Number(e.target.value) })}
                        className="w-full h-1.5 accent-brand-600"
                      />
                      <span className="text-neutral-700">{watermark.fontSize}px</span>
                    </div>
                    <div>
                      <label className="text-neutral-700">{isZh ? '透明度' : 'Opacity'}</label>
                      <input
                        type="range" min={5} max={100}
                        value={Math.round(watermark.fontOpacity * 100)}
                        onChange={(e) => setWatermark({ fontOpacity: Number(e.target.value) / 100 })}
                        className="w-full h-1.5 accent-brand-600"
                      />
                      <span className="text-neutral-700">{Math.round(watermark.fontOpacity * 100)}%</span>
                    </div>
                    <div>
                      <label className="text-neutral-700">{isZh ? '旋转' : 'Rotate'}</label>
                      <input
                        type="range" min={-90} max={90}
                        value={watermark.rotation}
                        onChange={(e) => setWatermark({ rotation: Number(e.target.value) })}
                        className="w-full h-1.5 accent-brand-600"
                      />
                      <span className="text-neutral-700">{watermark.rotation}°</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-neutral-700 block mb-1">{isZh ? '颜色' : 'Color'}</label>
                    <input
                      type="color"
                      value={watermark.fontColor}
                      onChange={(e) => setWatermark({ fontColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              )}

              {/* Image watermark settings */}
              {watermark.type === 'image' && (
                <div className="space-y-2">
                  {watermark.imageDataUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200">
                      <img src={watermark.imageDataUrl} alt="watermark preview" className="w-12 h-12 object-contain rounded border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-neutral-700 truncate">{isZh ? '水印图片已加载' : 'Watermark loaded'}</p>
                      </div>
                      <button onClick={clearImage} className="p-1 text-neutral-700 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-3 text-neutral-700 border-gray-300 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {isZh ? '上传水印图片（建议 PNG 透明底）' : 'Upload watermark (PNG with transparency recommended)'}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} hidden />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-neutral-700">{isZh ? '透明度' : 'Opacity'}</label>
                      <input
                        type="range" min={5} max={100}
                        value={Math.round(watermark.imageOpacity * 100)}
                        onChange={(e) => setWatermark({ imageOpacity: Number(e.target.value) / 100 })}
                        className="w-full h-1.5 accent-brand-600"
                      />
                      <span className="text-neutral-700">{Math.round(watermark.imageOpacity * 100)}%</span>
                    </div>
                    <div>
                      <label className="text-neutral-700">{isZh ? '大小' : 'Scale'}</label>
                      <input
                        type="range" min={5} max={100}
                        value={Math.round(watermark.imageScale * 100)}
                        onChange={(e) => setWatermark({ imageScale: Number(e.target.value) / 100 })}
                        className="w-full h-1.5 accent-brand-600"
                      />
                      <span className="text-neutral-700">{Math.round(watermark.imageScale * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Position grid */}
              <div>
                <label className="text-neutral-700 block mb-1.5">{isZh ? '位置' : 'Position'}</label>
                <div className="grid grid-cols-3 gap-1 w-24">
                  {POSITIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => setWatermark({ position: p.value })}
                      className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors ${
                        watermark.position === p.value
                          ? 'bg-brand-900/50 text-blue-600 ring-1 ring-brand-300'
                          : 'bg-white text-neutral-700 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-700">{isZh ? '水平边距(px)' : 'Margin X (px)'}</label>
                  <input
                    type="number" min={0} max={200}
                    value={watermark.marginX}
                    onChange={(e) => setWatermark({ marginX: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1 rounded border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-neutral-700">{isZh ? '垂直边距(px)' : 'Margin Y (px)'}</label>
                  <input
                    type="number" min={0} max={200}
                    value={watermark.marginY}
                    onChange={(e) => setWatermark({ marginY: Math.max(0, Number(e.target.value) || 0) })}
                    className="w-full px-2 py-1 rounded border border-gray-300 bg-gray-100 text-neutral-900 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
