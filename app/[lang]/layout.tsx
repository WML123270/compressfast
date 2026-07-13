import { LanguageProvider } from '@/lib/i18n/context'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { JsonLd } from '@/components/layout/JsonLd'
import { PageViewTracker } from '@/components/layout/PageViewTracker'
import { ToastProvider } from '@/components/ui/Toast'
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
      ? '极速压图 - 专业在线图片处理平台'
      : 'CompressFast — Professional Online Image Optimization Platform',
    description: isZh
      ? '极速压图是一款专业的在线图片处理平台，支持PNG、JPEG、WebP、AVIF等8+格式压缩与转换。纯本地处理保障隐私安全，致力于为用户提供高效免费的图片优化服务。'
      : 'CompressFast is a professional image optimization platform. Supports 8+ formats including PNG, JPEG, WebP, AVIF. All processing is local and private — fast, secure, and free.',
    keywords: isZh
      ? ['图片压缩', '在线压缩', '免费压缩', '批量压缩', '无损压缩', 'PNG压缩', 'JPEG压缩']
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
        <div className="relative min-h-screen flex flex-col">
          {/* Top glow orb */}
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-glow-top pointer-events-none" aria-hidden="true" />
          {/* Bottom glow orb */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-glow-bottom pointer-events-none" aria-hidden="true" />

          <Header />
          <JsonLd />
          <PageViewTracker />
          <Analytics />
          <main className="flex-1 relative z-10">{children}</main>
          <Footer />
        </div>
      </ToastProvider>
    </LanguageProvider>
  )
}
