'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export function FilingBanner() {
  const { t } = useT()
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const hostname = window.location.hostname
    const deployTarget = process.env.NEXT_PUBLIC_DEPLOY_TARGET
    // Only show on Chinese servers (IP access or explicitly cn)
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    const isCn = deployTarget === 'cn' || isIp
    // Don't show on Vercel / English deployment
    const isVercel = hostname.includes('vercel.app')
    setShouldShow(isCn && !isVercel)
  }, [])

  if (!shouldShow) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-700">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm text-amber-700 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>{t('filing.text')}</span>
      </div>
    </div>
  )
}
