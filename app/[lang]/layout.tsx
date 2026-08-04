import { LanguageProvider } from '@/lib/i18n/context'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/layout/JsonLd'
import { PageViewTracker } from '@/components/layout/PageViewTracker'
import { ToastProvider } from '@/components/ui/Toast'
import { FeedbackButton } from '@/components/ui/FeedbackButton'
import { BaiduAutoPush } from '@/components/layout/BaiduAutoPush'
import { Analytics } from '@vercel/analytics/react'
import type { Locale } from '@/lib/i18n/dictionaries'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'

export async function generateMetadata({
  params,
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const locale: Locale = params.lang === 'en' ? 'en' : 'zh'
  const isZh = locale === 'zh'

  const alternates: Record<string, string> = {
    en: `${SITE_URL}/en`,
    zh: `${SITE_URL}/zh`,
    'x-default': `${SITE_URL}/en`,
  }

  return {
    title: isZh
      ? '极速压图 - 免费在线图片压缩，拍照就能压'
      : 'CompressFast — Professional Online Image Optimization Platform',
    description: isZh
      ? '手机拍照太大发不出去？极速压图一键变小！免费在线图片压缩，不上传服务器，支持30张批量处理，手机电脑都能用。'
      : 'CompressFast is a professional image optimization platform. Supports 8+ formats including PNG, JPEG, WebP, AVIF. All processing is local and private — fast, secure, and free.',
    keywords: isZh
      ? ['图片压缩', '手机照片压缩', '免费压缩', '在线压缩', '批量压缩', '缩小图片', '照片变小']
      : ['image compression', 'compress images online', 'free image compressor', 'batch image compression', 'lossless compression'],
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: alternates,
    },
    openGraph: {
      title: isZh
        ? '极速压图 - 在线图片压缩工具'
        : 'CompressFast - Free Online Image Compression Tool',
      description: isZh
        ? '100%浏览器端处理，文件不上传。批量压缩，始终免费。'
        : '100% browser-side processing, files never uploaded. Batch compression, always free.',
      locale: isZh ? 'zh_CN' : 'en_US',
      siteName: isZh ? '极速压图' : 'CompressFast',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/share-card-og.png`,
          width: 1200,
          height: 630,
          alt: isZh ? '极速压图 - 图片压缩工具' : 'CompressFast - Image Compression Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isZh
        ? '极速压图 - 免费在线图片压缩'
        : 'CompressFast - Free Online Image Compression',
      description: isZh
        ? '图片不上传服务器，浏览器本地压缩。批量处理，永久免费。'
        : 'Browser-based image compression. No upload, always free.',
      images: [`${SITE_URL}/share-card-og.png`],
    },
  }
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }]
}

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { lang: string }
}) {
  const locale: Locale = (params.lang === 'en' ? 'en' : 'zh')

  return (
    <LanguageProvider locale={locale}>
      <ToastProvider>
        <div className="relative min-h-screen flex flex-col overflow-x-hidden">
          {/* Top glow orb — hidden on mobile to prevent overflow */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[600px] lg:w-[800px] h-[200px] sm:h-[300px] lg:h-[400px] bg-glow-top pointer-events-none" aria-hidden="true" />
          {/* Bottom glow orb — hidden on mobile */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] lg:w-[600px] h-[150px] sm:h-[250px] lg:h-[300px] bg-glow-bottom pointer-events-none" aria-hidden="true" />

          <Header />
          <JsonLd />
          <PageViewTracker />
          <Analytics />
          <BaiduAutoPush />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
          <FeedbackButton locale={locale} />
        </div>
      </ToastProvider>
    </LanguageProvider>
  )
}
