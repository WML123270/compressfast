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
    <header className="border-white/10 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center gap-2.5 font-bold text-slate-100 hover:text-cyan-400 transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <span>{t('app.name')}</span>
        </Link>
        <nav className="flex items-center gap-1.5">
          {!isCn && (
            <Link
              href={`/${locale}/pro`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
            >
              <Crown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pro</span>
            </Link>
          )}
          <button
            onClick={switchLang}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 bg-white/5 hover:border-slate-500 hover:bg-white/10 hover:text-white transition-all text-xs font-medium"
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
