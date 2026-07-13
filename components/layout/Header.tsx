'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ImageIcon, Globe, Crown } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export function Header() {
  const { t, locale } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const isCn = useIsCn()

  const switchLang = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <header className="border-b border-gray-200/50 bg-white/70 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 font-bold text-neutral-900 hover:text-blue-600 transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <span>{t('app.name')}</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          {!isCn && (
            <Link
              href={`/${locale}/pro`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-amber-600 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pro</span>
            </Link>
          )}
          <button
            onClick={switchLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 text-neutral-700 hover:border-gray-400 hover:bg-gray-50 transition-all text-xs font-medium"
            title={t('lang.switch')}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('lang.switch')}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
