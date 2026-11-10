import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

const UpscaleClient = dynamic(() => import('./UpscaleClient'), { ssr: false })

interface Props { params: { lang: string } }

export function generateMetadata({ params }: Props): Metadata {
  const isZh = params.lang === 'zh'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.site'
  return {
    title: isZh ? 'AI 图片无损放大 - 免费本地超分辨率 2x/4x' : 'AI Image Upscaler - Free Local 2x/4x Super Resolution',
    description: isZh
      ? 'AI 图片放大在线工具，100% 浏览器本地处理，图片不上传服务器。一键将图片无损放大 2 倍或 4 倍，模糊小图变高清，隐私安全。'
      : 'AI image upscaler running 100% in your browser. Images never leave your device. One-click 2x or 4x super-resolution, privacy-first.',
    alternates: {
      canonical: `${siteUrl}/${params.lang}/tools/upscale`,
    },
  }
}

export default function UpscalePage({ params }: Props) {
  const isZh = params.lang === 'zh'
  const benefits = [
    { icon: '🔒', t: isZh ? '隐私安全' : 'Privacy', d: isZh ? '本地 AI 推理，图片不上传服务器' : 'Local AI inference, no upload' },
    { icon: '✨', t: isZh ? '2x / 4x 放大' : '2x / 4x Upscale', d: isZh ? 'AI 脑补细节，比传统插值更清晰' : 'AI detail synthesis, sharper than interpolation' },
    { icon: '⚡', t: isZh ? '一键完成' : 'One-Click', d: isZh ? '拖入图片即自动放大' : 'Drop an image and it auto-upscales' },
  ]
  const howTo = [
    { s: '1', t: isZh ? '上传图片' : 'Upload', d: isZh ? '拖入或点击上传需要放大的图片' : 'Drop or click to upload an image' },
    { s: '2', t: isZh ? '选择倍数并放大' : 'Pick Scale & Upscale', d: isZh ? '选择 2x 或 4x，本地 AI 模型补充细节' : 'Choose 2x or 4x — the local AI model fills in detail' },
    { s: '3', t: isZh ? '下载高清图' : 'Download', d: isZh ? '下载放大后的高清 PNG 图片' : 'Download the high-res PNG' },
  ]
  const faqs = [
    {
      q: isZh ? '图片会上传到服务器吗？' : 'Are images uploaded to a server?',
      a: isZh ? '不会。放大完全在你的浏览器本地完成，图片文件不会离开你的设备。' : 'No. Upscaling runs entirely in your browser — files never leave your device.',
    },
    {
      q: isZh ? 'AI 放大和普通放大有什么区别？' : 'How is AI upscaling different from normal resize?',
      a: isZh ? '普通放大（如 PS 的插值）只是拉伸像素，放大后会模糊。AI 放大使用 Real-ESRGAN 超分辨率模型，会智能重建细节、锐化边缘，让放大后的图片更清晰自然。' : 'Normal resize just stretches pixels and gets blurry. AI upscaling uses the Real-ESRGAN super-resolution model to reconstruct detail and sharpen edges for a clearer result.',
    },
    {
      q: isZh ? '最大能放大多少？' : 'How much can I upscale?',
      a: isZh ? '支持 2 倍和 4 倍放大（例如 512×512 可变成 1024×1024 或 2048×2048）。为保障浏览器流畅运行，输入图片长边超过 512 像素时会自动等比缩小后再放大。' : 'Choose 2x or 4x (e.g. 512×512 becomes 1024×1024 or 2048×2048). To keep it smooth in the browser, inputs with a long edge over 512px are auto-resized down first.',
    },
    {
      q: isZh ? '为什么需要 Pro？' : 'Why do I need Pro?',
      a: isZh ? 'AI 放大依赖本地下载 AI 模型，作为高级功能提供给 Pro 用户，一次性买断永久使用。' : 'AI upscaling downloads an on-device AI model and is offered as a Pro feature with one-time purchase.',
    },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <section className="text-center space-y-3 pb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          {isZh ? 'AI 图片无损放大 · 本地超分辨率' : 'AI Image Upscaler'}
        </h1>
        <p className="text-sm sm:text-lg text-gray-700 max-w-xl mx-auto">
          {isZh
            ? '100% 浏览器本地 AI 放大，图片不上传服务器，2 倍 / 4 倍一键变高清。'
            : 'AI upscaling running 100% in your browser — no upload, one-click 2x / 4x high-res.'}
        </p>
      </section>

      <UpscaleClient />

      <section className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
        <p>
          {isZh
            ? '极速压图的 AI 放大功能，使用 Real-ESRGAN 超分辨率模型（realesr-general-x4v3），在您的浏览器本地完成 2 倍 / 4 倍无损放大。与需要上传图片到云端的工具不同，本工具全程本地处理，既保护隐私，也避免了大文件上传的等待。'
            : 'CompressFast\'s AI upscaler uses the Real-ESRGAN super-resolution model (realesr-general-x4v3) running entirely in your browser. Unlike tools that upload your image to the cloud, everything happens locally — protecting your privacy and avoiding large uploads.'}
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
