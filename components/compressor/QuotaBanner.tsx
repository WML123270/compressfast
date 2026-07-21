'use client'

import Link from 'next/link'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useT } from '@/lib/i18n/context'

const IS_CN = process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'cn'

export function QuotaBanner() {
  const { t, locale } = useT()
  const { isPro, monthlyUsed, monthlyQuota, serverQuotaExceeded } = useCompressionStore()

  if (isPro || IS_CN) return null

  if (monthlyUsed >= monthlyQuota || serverQuotaExceeded) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
        <p className="font-semibold text-amber-800">{t('pro.quotaExceeded')}</p>
        <p className="text-amber-700 text-sm mt-1">{t('pro.quotaExceededDesc')}</p>
        <Link href={`/${locale}/pro`} className="inline-block mt-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors">
          {locale === 'zh' ? '升级 Pro · $24.99 永久' : 'Upgrade to Pro · $24.99 Lifetime'}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center gap-3">
      <span className="text-lg">📊</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-blue-800">
            {locale === 'zh' ? '本月免费额度' : 'Free this month'}
          </span>
          <span className="text-sm font-bold text-blue-700 tabular-nums">
            {Math.max(0, monthlyUsed)} <span className="text-blue-400 font-normal">/ {monthlyQuota}</span>
          </span>
        </div>
        <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min((monthlyUsed / monthlyQuota) * 100, 100))}%` }}
          />
        </div>
      </div>
      <Link href={`/${locale}/pro`} className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors whitespace-nowrap">
        {locale === 'zh' ? '升级 Pro' : 'Go Pro'}
      </Link>
    </div>
  )
}
