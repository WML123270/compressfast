import { LanguageProvider } from '@/lib/i18n/context'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FilingBanner } from '@/components/layout/FilingBanner'
import { JsonLd } from '@/components/layout/JsonLd'
import { PageViewTracker } from '@/components/layout/PageViewTracker'
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
      ? '极速压图 - 在线图片压缩 | 100%本地处理，文件不上传'
      : 'CompressFast - Free Online Image Compression | Local Processing',
    description: isZh
      ? '免费在线图片压缩工具。100%浏览器端处理，文件绝不上传。支持批量压缩，始终免费。'
      : 'Free online image compression tool. 100% browser-side processing — your files never leave your device.',
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
      <Header />
      <FilingBanner />
      <JsonLd />
      <PageViewTracker />
      <Analytics />
      <main className="flex-1">{children}</main>
      <Footer />
    </LanguageProvider>
  )
}
