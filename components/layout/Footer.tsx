'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/context'

export function Footer() {
  const { t, locale } = useT()
  const year = new Date().getFullYear()
  const isZh = locale === 'zh'

  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 mt-20">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="mb-2">
          <strong className="text-slate-700 dark:text-slate-300">{t('app.name')}</strong>
          {' '}{t('footer.tagline')}
        </p>
        <p>{t('footer.tech')}</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-xs">
          <Link href={`/${locale}/privacy`} className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            {isZh ? '隐私政策' : 'Privacy Policy'}
          </Link>
          <Link href={`/${locale}/terms`} className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            {isZh ? '服务条款' : 'Terms of Service'}
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
          {t('footer.copyright', { year })}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          <a href="https://turbo0.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">{t('footer.turbo0')}</a>
        </p>
      </div>
    </footer>
  )
}
