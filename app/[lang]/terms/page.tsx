'use client'

import { useT } from '@/lib/i18n/context'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-brand-600" />
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {isZh ? '服务条款' : 'Terms of Service'}
        </h1>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        {isZh ? '最后更新：2026年7月4日' : 'Last updated: July 4, 2026'}
      </p>

      <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-400 space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '1. 服务说明' : '1. Service Description'}
          </h2>
          <p>{isZh ? '极速压图（CompressFast）是一款在线图片压缩工具。免费版提供核心压缩功能，Pro 版提供额外的高级功能和更大的使用限额。' : 'CompressFast is an online image compression tool. The free tier provides core compression features, and the Pro tier offers additional advanced features and higher usage limits.'}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '2. 用户责任' : '2. User Responsibilities'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '您拥有上传图片的合法权利' : 'You have the legal right to the images you upload'}</li>
            <li>{isZh ? '不会用于非法目的' : 'You will not use the service for illegal purposes'}</li>
            <li>{isZh ? '不会尝试滥用、攻击或逆向工程服务' : 'You will not attempt to abuse, attack, or reverse-engineer the service'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '3. Pro 许可证' : '3. Pro License'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? 'Pro 为一次性购买，永久有效' : 'Pro is a one-time purchase, valid for lifetime'}</li>
            <li>{isZh ? '每个激活码最多可用于 5 台设备' : 'Each license code can be used on up to 5 devices'}</li>
            <li>{isZh ? '激活码不可转让、不可转售' : 'License codes are non-transferable and non-resellable'}</li>
            <li>{isZh ? '我们保留因滥用而撤销许可证的权利' : 'We reserve the right to revoke licenses for abuse'}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '4. 退款政策' : '4. Refund Policy'}
          </h2>
          <p>{isZh ? '购买后 7 天内，如激活码未被使用，可申请退款。请联系我们的支持邮箱。' : 'Refunds are available within 7 days of purchase if the license code has not been activated. Contact our support email.'}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '5. 免责声明' : '5. Disclaimer'}
          </h2>
          <p>{isZh ? '本服务按"现状"提供，不提供任何明示或暗示的保证。我们不保证服务不中断或无错误。' : 'The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.'}</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            {isZh ? '6. 联系我们' : '6. Contact'}
          </h2>
          <p>{isZh ? '如有问题，请邮件联系：' : 'For questions, email:'} <a href="mailto:support@compressfast.site" className="text-brand-600 hover:underline">support@compressfast.site</a></p>
        </section>
      </div>
    </div>
  )
}
