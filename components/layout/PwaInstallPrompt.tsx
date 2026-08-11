'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, X } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/**
 * PwaInstallPrompt — listens for the beforeinstallprompt event and shows
 * a subtle install button. Only appears on supported browsers (Chrome, Edge).
 * Dismissed for 7 days after user closes it.
 */
export function PwaInstallPrompt() {
  const { locale } = useT()
  const isZh = locale === 'zh'
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Check if was dismissed recently (7 days)
  useEffect(() => {
    try {
      const ts = localStorage.getItem('pwa-install-dismissed')
      if (ts && Date.now() - Number(ts) < 7 * 24 * 3600 * 1000) {
        setDismissed(true)
      }
    } catch {}
  }, [])

  // Listen for install prompt
  useEffect(() => {
    if (dismissed) return
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show after 30s of engagement
      const timer = setTimeout(() => {
        setShowPrompt(true)
        clearInterval(interval)
      }, 30_000)
      // Also show after 3 compressions
      const checkStats = () => {
        try {
          const stats = JSON.parse(localStorage.getItem('png-compressor-stats') || '{}')
          if ((stats.total || 0) >= 3) {
            setShowPrompt(true)
            clearTimeout(timer)
            clearInterval(interval)
          }
        } catch {}
      }
      const interval = setInterval(checkStats, 5000)
      // Also run immediately
      checkStats()
      // Cleanup
      const cleanup = () => {
        clearTimeout(timer)
        clearInterval(interval)
      }
      // Store cleanup
      ;(window as any).__pwaCleanup = cleanup
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      ;(window as any).__pwaCleanup?.()
    }
  }, [dismissed])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowPrompt(false)
      }
    } catch {}
    setDeferredPrompt(null)
    setShowPrompt(false)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setShowPrompt(false)
    try {
      localStorage.setItem('pwa-install-dismissed', String(Date.now()))
    } catch {}
    setDismissed(true)
  }, [])

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up max-w-sm">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg">
          📦
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-900">
            {isZh ? '安装极速压图' : 'Install CompressFast'}
          </p>
          <p className="text-xs text-neutral-600 mt-0.5">
            {isZh ? '离线使用 · 快速访问 · 无需浏览器标签页' : 'Use offline, faster access, no browser tabs'}
          </p>
          <button
            onClick={handleInstall}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-semibold transition-all active:scale-[0.97]"
          >
            <Download className="w-4 h-4" />
            {isZh ? '安装应用' : 'Install App'}
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label={isZh ? '关闭' : 'Dismiss'}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
