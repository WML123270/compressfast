'use client'

import { useEffect } from 'react'
import { DropZone } from '@/components/compressor/DropZone'
import { ImageList } from '@/components/compressor/ImageList'
import { CompressionControls } from '@/components/compressor/CompressionControls'
import { useCompressionStore } from '@/lib/store/compression-store'

interface Props {
  defaultSettings?: {
    quality?: number
    outputFormat?: string
    speed?: number
    resizeWidth?: number
    lossless?: boolean
    stripMetadata?: boolean
  }
}

export default function ToolClient({ defaultSettings }: Props) {
  const { setOptions, options } = useCompressionStore()

  // Apply default settings for this tool page (only once)
  useEffect(() => {
    if (defaultSettings) {
      const updates: Record<string, unknown> = {}
      if (defaultSettings.quality !== undefined) updates.quality = defaultSettings.quality
      if (defaultSettings.outputFormat !== undefined) updates.outputFormat = defaultSettings.outputFormat
      if (defaultSettings.speed !== undefined) updates.speed = defaultSettings.speed
      if (defaultSettings.lossless !== undefined) updates.lossless = defaultSettings.lossless
      if (defaultSettings.stripMetadata !== undefined) updates.stripMetadata = defaultSettings.stripMetadata
      if (Object.keys(updates).length > 0) {
        setOptions(updates as Parameters<typeof setOptions>[0])
      }
    }
    // Only apply default settings once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <DropZone />
      <CompressionControls />
      <ImageList />
    </>
  )
}
