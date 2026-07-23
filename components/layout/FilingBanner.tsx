'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { isCnDeploy } from '@/lib/utils'

export function FilingBanner() {
  const { t } = useT()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const hostname = window.location.hostname
    // Only show on Chinese servers (IP access or explicitly cn)
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    const isCn = isCnDeploy() || isIp
    // Don't show on Vercel / English deployment
    const isVercel = hostname.includes('vercel.app')
    setShouldShow(isCn && !isVercel)
  }, [])

  if (!shouldShow) return null

  return (
    <div className="bg-amber-900/20 border-amber-700">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{t('filing.text')}</span>
      </div>
    </div>
  )
}
