'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { dictionaries, type Locale } from './dictionaries'

interface I18nContextValue {
  locale: Locale
  t: (key: keyof typeof dictionaries.en, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const dict = dictionaries[locale] || dictionaries.en

  const t = (key: keyof typeof dictionaries.en, params?: Record<string, string | number>): string => {
    let text = (dict as Record<string, string>)[key] ?? dictionaries.en[key] ?? key
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v))
      }
    }
    return text
  }

  return (
    <I18nContext.Provider value={{ locale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useT must be used within LanguageProvider')
  return ctx
}
