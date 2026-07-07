'use client'

import { useT } from '@/lib/i18n/context'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </h1>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {isZh ? '最后更新：2026年7月4日' : 'Last updated: July 4, 2026'}
      </p>

      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-400 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '1. 我们收集什么信息' : '1. Information We Collect'}
          </h2>
          <p>{isZh ? '我们不收集任何个人信息。极速压图是一个纯浏览器端工具，您的图片和文件永远不会上传到我们的服务器。' : 'We do not collect any personal information. CompressFast is a browser-only tool — your images and files are never uploaded to our servers.'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '图片文件：所有压缩在您的浏览器本地完成' : 'Image files: All compression happens locally in your browser'}</li>
            <li>{isZh ? '激活码：Pro 激活码通过第三方支付平台生成，存储在我们的 Redis 数据库中以验证授权' : 'License codes: Pro activation codes are generated via third-party payment and stored in our Redis database for license verification'}</li>
            <li>{isZh ? '使用统计：我们使用百度统计（中国版）和可选的分析服务收集匿名的页面访问数据' : 'Usage analytics: We use Baidu Analytics (CN) and optional analytics services to collect anonymous page visit data'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '2. 我们如何使用信息' : '2. How We Use Information'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '激活码验证：验证您的 Pro 许可证是否有效' : 'License verification: To verify your Pro license is valid'}</li>
            <li>{isZh ? '邮件发送：当您购买 Pro 后，向您发送激活码（使用 Resend 邮件服务）' : 'Email delivery: To send your activation code after purchase (via Resend)'}</li>
            <li>{isZh ? '服务改进：匿名统计数据帮助我们改进产品' : 'Service improvement: Anonymous analytics help us improve the product'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '3. 数据存储与安全' : '3. Data Storage & Security'}
          </h2>
          <p>{isZh ? '激活码数据存储在 Upstash Redis 中。我们不会存储您的原始图片或压缩后的图片——所有图片处理完全在您的设备上完成。' : 'License data is stored in Upstash Redis. We do not store your original or compressed images — all image processing is done entirely on your device.'}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '4. 第三方服务' : '4. Third-Party Services'}
          </h2>
          <ul className="space-y-1">
            <li>Creem — {isZh ? '支付处理' : 'Payment processing'}</li>
            <li>Resend — {isZh ? '邮件发送' : 'Email delivery'}</li>
            <li>Upstash — {isZh ? '许可证数据存储' : 'License data storage'}</li>
            <li>{isZh ? '百度统计 — 网站分析（仅中国版）' : 'Baidu Analytics — Site analytics (CN version only)'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '5. 联系我们' : '5. Contact Us'}
          </h2>
          <p>{isZh ? '如有隐私相关问题，请邮件联系：' : 'For privacy-related inquiries, email:'} <a href="mailto:support@compressfast.site" className="text-brand-600 hover:underline">support@compressfast.site</a></p>
        </section>
      </div>
    </div>
  )
}
