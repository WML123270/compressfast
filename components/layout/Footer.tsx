'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { isCnDeploy } from '@/lib/utils'

export function Footer() {
  const { t, locale } = useT()
  const year = new Date().getFullYear()
  const isZh = locale === 'zh'
  const [mounted, setMounted] = useState(false)
  const [isCn, setIsCn] = useState(isCnDeploy())

  useEffect(() => {
    setMounted(true)
    const hostname = window.location.hostname
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    const isVercel = hostname.includes('vercel.app')
    const cn = (isCnDeploy() || isIp) && !isVercel
    if (cn !== isCn) setIsCn(cn)
  }, [isCn])

  const icpNumber = process.env.NEXT_PUBLIC_ICP_NUMBER || ''
  const psbNumber = process.env.NEXT_PUBLIC_PSB_NUMBER || ''
  // 公安备案 recordcode：提取数字部分（去掉"湘公网安备"和"号"）
  const psbRecordCode = psbNumber.replace(/[^\d]/g, '')

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">

        {/* ICP + 公安 备案号 */}
        {isCn && (icpNumber || psbNumber) && (
          <div className="mb-6 flex items-center justify-center gap-3 flex-wrap">
            {psbNumber && (
              <a
                href={`http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=${psbRecordCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <img
                  src="https://www.beian.gov.cn/img/ghs.png"
                  alt="公安备案"
                  className="w-4 h-4"
                  loading="lazy"
                />
                <span className="text-sm text-blue-600 font-medium">{psbNumber}</span>
              </a>
            )}
            {icpNumber && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200">
                <span className="text-xs text-neutral-600">ICP备案</span>
                <a
                  href="https://beian.miit.gov.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-600 font-medium transition-colors"
                >
                  {icpNumber}
                </a>
              </div>
            )}
          </div>
        )}

        <p className="mb-2 text-neutral-800">
          <strong className="text-neutral-900">{t('app.name')}</strong>
          {' '}{t('footer.tagline')}
        </p>
        <p className="text-neutral-700 text-sm">{t('footer.tech')}</p>

        <div className="mt-5 flex items-center justify-center gap-5 text-sm flex-wrap">
          <Link href={`/${locale}/help`} className="text-neutral-700 hover:text-blue-600 transition-colors">
            {isZh ? '帮助中心' : 'Help'}
          </Link>
          <Link href={`/${locale}/about`} className="text-neutral-700 hover:text-blue-600 transition-colors">
            {isZh ? '关于' : 'About'}
          </Link>
          <Link href={`/${locale}/contact`} className="text-neutral-700 hover:text-blue-600 transition-colors">
            {isZh ? '联系我们' : 'Contact'}
          </Link>
          <Link href={`/${locale}/privacy`} className="text-neutral-700 hover:text-blue-600 transition-colors">
            {isZh ? '隐私政策' : 'Privacy Policy'}
          </Link>
          <Link href={`/${locale}/terms`} className="text-neutral-700 hover:text-blue-600 transition-colors">
            {isZh ? '服务条款' : 'Terms'}
          </Link>
          {!isCn && (
            <Link href={`/${locale}/affiliates`} className="text-green-600 hover:text-green-700 transition-colors font-medium">
              {isZh ? '联盟分销 · 赚50%' : 'Affiliates · Earn 50%'}
            </Link>
          )}
        </div>

        {/* Social + Support — overseas only */}
        {mounted && !isCn && (
          <div className="mt-5 flex items-center justify-center gap-4 text-xs">
            <a
              href="https://x.com/CompressFastApp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-600 hover:bg-sky-100 transition-all"
            >
              <span>𝕏</span> @CompressFastApp
            </a>
            <a
              href="https://jisuyatu.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all"
            >
              <span>🇨🇳</span> 极速压图 · jisuyatu.com
            </a>
            <a
              href={process.env.NEXT_PUBLIC_CREEM_TIP_URL || 'https://www.creem.io/payment/prod_PxY4p0dRqz6lyrngUmBjU'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all"
            >
              <span>☕</span> Buy Me a Coffee · $5
            </a>
          </div>
        )}

        <p className="mt-4 text-neutral-700 text-sm">
          {t('footer.copyright', { year })}
        </p>

        {/* Directory badges */}
        {mounted && !isCn && (
          <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
            <a href="https://turbo0.com" target="_blank" rel="noopener noreferrer" className="text-neutral-600 text-xs hover:text-neutral-800 transition-colors">{t('footer.turbo0')}</a>
            <a target="_blank" href="https://tooljourney.com/tool/compressfast" rel="noopener noreferrer">
              <img src="https://tooljourney.com/assets/images/badge.png" alt="Tool Journey" height="54" loading="lazy" />
            </a>
            <a href="https://fazier.com/launches/compressfast.site" target="_blank" rel="noopener noreferrer">
              <img src="https://fazier.com/api/v1/public/badges/launch_badges.svg?badge_type=launched&theme=light" width="120" alt="Fazier badge" loading="lazy" />
            </a>
          </div>
        )}
      </div>
    </footer>
  )
}
