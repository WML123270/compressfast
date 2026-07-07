'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function LangDetector() {
  const pathname = usePathname()

  useEffect(() => {
    // Set html lang attribute based on URL path
    const lang = pathname.startsWith('/en') ? 'en' : 'zh'
    document.documentElement.lang = lang
  }, [pathname])

  return null
}
