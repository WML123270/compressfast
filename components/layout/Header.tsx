'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ImageIcon, Sun, Moon, Globe, Crown } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export function Header() {
  const { t, locale } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const isCn = useIsCn()
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch {}
  }

  const switchLang = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
          <ImageIcon className="w-5 h-5 text-brand-600" />
          <span>{t('app.name')}</span>
        </Link>
        <nav className="flex items-center gap-2">
          {!isCn && (
            <Link
              href={`/${locale}/pro`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pro</span>
            </Link>
          )}
          <button
            onClick={switchLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm transition-all text-xs font-medium"
            title={t('lang.switch')}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('lang.switch')}</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm transition-all text-xs font-medium"
            title={isDark ? t('header.light') : t('header.dark')}
          >
            {isDark ? (
              <><Sun className="w-3.5 h-3.5 text-amber-500" /><span className="hidden sm:inline">{t('header.light')}</span></>
            ) : (
              <><Moon className="w-3.5 h-3.5 text-slate-600" /><span className="hidden sm:inline">{t('header.dark')}</span></>
            )}
          </button>
        </nav>
      </div>
    </header>
  )
}
