import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { Analytics } from '@/components/layout/Analytics'
import { LangDetector } from '@/components/layout/LangDetector'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'),
  title: 'CompressFast — Professional Online Image Optimization Platform',
  description: 'CompressFast is a professional image optimization platform. Supports 8+ formats including PNG, JPEG, WebP, AVIF. All processing is local and private — fast, secure, and free.',
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
    other: {
      'baidu-site-verification': 'codeva-0i0J3e3ChT',
      'baidu_union_verify': '88a78eaf1ef0ec38f4c7e7d4ca595e55',
    },
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
        url: '/share-card-og.png',
        width: 1200,
        height: 630,
        alt: 'CompressFast - Image Compression Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CompressFast - Free Online Image Compression',
    description: 'Browser-based image compression. No upload, always free.',
    images: ['/share-card-og.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const langCookie = cookieStore.get('lang')?.value
  const htmlLang = langCookie === 'zh' ? 'zh' : 'en'

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <head>
        <meta name="baidu_union_verify" content="88a78eaf1ef0ec38f4c7e7d4ca595e55" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=window.location.pathname;document.documentElement.lang=l.startsWith('/zh')?'zh':'en'})()`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if('serviceWorker' in navigator&&!window.location.hostname.includes('localhost')){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col text-neutral-800 antialiased overflow-x-hidden">
        <LangDetector />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
