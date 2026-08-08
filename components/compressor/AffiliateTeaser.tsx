'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useIsCn } from '@/lib/use-is-cn'
import { useCompressionStore } from '@/lib/store/compression-store'

export function AffiliateTeaser() {
  const isCn = useIsCn()
  const { files } = useCompressionStore()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // CN users don't see affiliate teasers
    if (isCn) return

    // Only show once per day
    const key = 'aff_teaser_date'
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(key) === today) return

    // Check if any file achieved >80% savings
    const doneFiles = files.filter(f => f.status === 'done' && f.compressedSize)
    if (doneFiles.length === 0) return

    const hasBigSavings = doneFiles.some(f => {
      const ratio = 1 - (f.compressedSize! / f.originalSize)
      return ratio > 0.80
    })
    if (!hasBigSavings) return

    localStorage.setItem(key, today)
    setShow(true)
  }, [files, isCn])

  if (!show) return null

  return (
    <div className="max-w-2xl mx-auto mt-3 animate-slide-up">
      <Link
        href="/en/affiliates"
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 transition-all group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">💰</span>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Saved big on compression? Earn $12.50 sharing this tool.
            </p>
            <p className="text-xs text-green-600 mt-0.5">
              Join our affiliate program — 50% commission, 30-day cookies.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-green-600 group-hover:translate-x-0.5 transition-transform">
          Join free →
        </span>
      </Link>
    </div>
  )
}
