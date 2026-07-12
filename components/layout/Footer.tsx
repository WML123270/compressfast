'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function Footer() {
  const { t, locale } = useT()
  const year = new Date().getFullYear()
  const isZh = locale === 'zh'
  const [mounted, setMounted] = useState(false)
  const [isCn, setIsCn] = useState(
    process.env.NEXT_PUBLIC_DEPLOY_TARGET === 'cn',
  )

  useEffect(() => {
    setMounted(true)
    const hostname = window.location.hostname
    const deployTarget = process.env.NEXT_PUBLIC_DEPLOY_TARGET
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    const isVercel = hostname.includes('vercel.app')
    const cn = (deployTarget === 'cn' || isIp) && !isVercel
    if (cn !== isCn) setIsCn(cn)
  }, [isCn])

  const icpNumber = process.env.NEXT_PUBLIC_ICP_NUMBER || ''

  return (
    <footer className="border-t border-white/10 bg-slate-900/50 backdrop-blur-sm mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center text-slate-400">

        {/* ICP 备案号 — 百度联盟审核要求显眼展示 */}
        {isCn && icpNumber && (
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <span className="text-xs text-slate-500">ICP备案</span>
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              {icpNumber}
            </a>
          </div>
        )}

        <p className="mb-2">
          <strong className="text-slate-200">{t('app.name')}</strong>
          {' '}{t('footer.tagline')}
        </p>
        <p className="text-slate-500 text-sm">{t('footer.tech')}</p>

        <div className="mt-5 flex items-center justify-center gap-5 text-xs flex-wrap">
          <Link href={`/${locale}/help`} className="hover:text-cyan-400 transition-colors">
            {isZh ? '帮助中心' : 'Help'}
          </Link>
          <Link href={`/${locale}/about`} className="hover:text-cyan-400 transition-colors">
            {isZh ? '关于' : 'About'}
          </Link>
          <Link href={`/${locale}/contact`} className="hover:text-cyan-400 transition-colors">
            {isZh ? '联系我们' : 'Contact'}
          </Link>
          <Link href={`/${locale}/privacy`} className="hover:text-cyan-400 transition-colors">
            {isZh ? '隐私政策' : 'Privacy Policy'}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-cyan-400 transition-colors">
            {isZh ? '服务条款' : 'Terms'}
          </Link>
        </div>

        {/* Support / Sponsor — overseas only, render after mount to avoid SSR CN env override */}
        {mounted && !isCn && (
          <div className="mt-5 flex items-center justify-center gap-4 text-xs">
            <a
              href={process.env.NEXT_PUBLIC_CREEM_TIP_URL || 'https://www.creem.io/payment/prod_PxY4p0dRqz6lyrngUmBjU'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 transition-all"
            >
              <span>☕</span> Buy Me a Coffee · $5
            </a>
          </div>
        )}

        <p className="mt-4 text-slate-500 text-sm">
          {t('footer.copyright', { year })}
        </p>

        <p className="mt-2 text-slate-600 text-xs">
          <a href="https://turbo0.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">{t('footer.turbo0')}</a>
        </p>
      </div>
    </footer>
  )
}
