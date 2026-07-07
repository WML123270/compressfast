import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Analytics } from '@/components/layout/Analytics'
import { LangDetector } from '@/components/layout/LangDetector'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'),
  title: 'CompressFast - Free Online Image Compression | Local Processing',
  description: 'Free online image compression tool. 100% browser-side processing — your files never leave your device.',
  keywords: ['image compression', 'compress images online', 'free image compressor', 'batch image compression', 'lossless compression'],
  robots: { index: true, follow: true },
  alternates: {
    languages: {
      'en': '/en',
      'zh': '/zh',
      'x-default': '/en',
    },
  },
  verification: {
    other: { 'baidu-site-verification': 'codeva-Qzz2bgaqoR' },
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'CompressFast',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
  openGraph: {
    title: 'CompressFast - Free Online Image Compression Tool',
    description: '100% browser-side processing, files never uploaded. Batch compression, always free.',
    type: 'website',
    locale: 'en_US',
    siteName: 'CompressFast',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'CompressFast',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'CompressFast - Free Online Image Compression',
    description: 'Browser-based image compression. No upload, always free.',
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const langCookie = cookieStore.get('lang')?.value
  const htmlLang = langCookie === 'zh' ? 'zh' : 'en'

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#2563eb" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=window.location.pathname;document.documentElement.lang=l.startsWith('/zh')?'zh':'en'})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.location.hostname.includes('localhost')){navigator.serviceWorker.getRegistrations().then(function(regs){regs.forEach(function(r){r.unregister()})})}}catch(e){}})();if('serviceWorker' in navigator && !window.location.hostname.includes('localhost')){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white dark:bg-slate-900 transition-colors">
        <LangDetector />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
