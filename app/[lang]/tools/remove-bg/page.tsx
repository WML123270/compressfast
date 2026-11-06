import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const RemoveBgClient = dynamic(() => import('./RemoveBgClient'), { ssr: false })

interface Props { params: { lang: string } }

export function generateMetadata({ params }: Props): Metadata {
  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'
  return {
    title: isZh ? 'AI 在线抠图 - 免费本地去背景' : 'AI Background Remover - Free Local Removal',
    description: isZh
      ? 'AI 抠图在线工具，100% 浏览器本地处理，图片不上传服务器。一键去除图片背景，输出透明 PNG，隐私安全。'
      : 'AI background remover running 100% in your browser. Images never leave your device. One-click transparent PNG, privacy-first.',
    alternates: {
      canonical: `${siteUrl}/${params.lang}/tools/remove-bg`,
    },
  }
}

export default function RemoveBgPage({ params }: Props) {
  const isZh = params.lang === 'zh'
  const benefits = [
    { icon: '🔒', t: isZh ? '隐私安全' : 'Privacy', d: isZh ? '本地 AI 推理，图片不上传服务器' : 'Local AI inference, no upload' },
    { icon: '⚡', t: isZh ? '一键完成' : 'One-Click', d: isZh ? '拖入图片即自动抠图' : 'Drop an image and it auto-removes' },
    { icon: '💎', t: isZh ? '高清透明' : 'High Quality', d: isZh ? '输出透明背景 PNG' : 'Transparent PNG output' },
  ]
  const howTo = [
    { s: '1', t: isZh ? '上传图片' : 'Upload', d: isZh ? '拖入或点击上传需要抠图的图片' : 'Drop or click to upload an image' },
    { s: '2', t: isZh ? 'AI 自动抠图' : 'AI Removal', d: isZh ? '本地 AI 模型自动识别并去除背景' : 'Local AI model detects and removes background' },
    { s: '3', t: isZh ? '下载 PNG' : 'Download', d: isZh ? '下载带透明背景的 PNG 图片' : 'Download the transparent PNG' },
  ]
  const faqs = [
    {
      q: isZh ? '图片会上传到服务器吗？' : 'Are images uploaded to a server?',
      a: isZh ? '不会。抠图完全在你的浏览器本地完成，图片文件不会离开你的设备。' : 'No. Background removal runs entirely in your browser — files never leave your device.',
    },
    {
      q: isZh ? '支持哪些图片格式？' : 'Which formats are supported?',
      a: isZh ? '支持 JPG、PNG、WebP 等浏览器能解码的常见图片格式，输出为透明背景 PNG。' : 'JPG, PNG, WebP and other browser-decodable formats; output is transparent PNG.',
    },
    {
      q: isZh ? '为什么需要 Pro？' : 'Why do I need Pro?',
      a: isZh ? 'AI 抠图依赖本地下载 AI 模型（约 44MB），作为高级功能提供给 Pro 用户，一次性买断永久使用。' : 'AI removal downloads an on-device model (~44MB) and is offered as a Pro feature with one-time purchase.',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <section className="text-center space-y-3 pb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          {isZh ? 'AI 在线抠图 · 本地去背景' : 'AI Background Remover'}
        </h1>
        <p className="text-sm sm:text-lg text-gray-700 max-w-xl mx-auto">
          {isZh
            ? '100% 浏览器本地 AI 抠图，图片不上传服务器，一键输出透明 PNG。'
            : 'AI background removal running 100% in your browser — no upload, one-click transparent PNG.'}
        </p>
      </section>

      <RemoveBgClient />

      <section className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
        <p>
          {isZh
            ? '极速压图的 AI 抠图功能，使用先进的图像分割模型（isnet），在您的浏览器本地完成背景去除。与需要上传图片到云端的传统工具不同，本工具全程本地处理，既保护隐私，也避免了大文件上传的等待。'
            : 'CompressFast\'s AI background remover uses an advanced segmentation model (isnet) running entirely in your browser. Unlike tools that upload your image to the cloud, everything happens locally — protecting your privacy and avoiding large uploads.'}
        </p>
      </section>

      <section className="pt-4">
        <h2 className="font-bold text-gray-900 text-lg mb-4">{isZh ? '为什么选择我们？' : 'Why Choose Us?'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {benefits.map((b, i) => (
            <div key={i} className="p-5 rounded-xl bg-white border border-gray-200">
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-semibold text-sm mt-3 mb-1 text-gray-900">{b.t}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-4">
        <h2 className="font-bold text-gray-900 text-lg mb-4">{isZh ? '三步完成' : 'How It Works'}</h2>
        <div className="space-y-3">
          {howTo.map((step) => (
            <div key={step.s} className="flex gap-4 p-4 rounded-xl bg-white border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {step.s}
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">{step.t}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-4">
        <h2 className="font-bold text-gray-900 text-lg mb-4">{isZh ? '常见问题' : 'FAQ'}</h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <details key={i} className="group rounded-xl border border-gray-200 bg-white overflow-hidden">
              <summary className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 cursor-pointer list-none">
                <span className="font-semibold text-sm text-gray-900">{f.q}</span>
                <ChevronDown className="w-4 h-4 text-gray-600 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <p className="px-4 sm:px-5 pb-4 text-sm text-gray-700 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="text-center pt-2 pb-4">
        <Link href={`/${params.lang}`} className="text-gray-700 hover:text-blue-600 text-sm transition-colors">
          {isZh ? '← 返回首页，压缩更多图片' : '← Back to homepage — compress more images'}
        </Link>
      </div>
    </div>
  )
}
