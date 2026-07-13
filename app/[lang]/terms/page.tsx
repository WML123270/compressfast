'use client'

import { useT } from '@/lib/i18n/context'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TermsPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-neutral-700 hover:text-blue-600">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <div className="flex items-center gap-3">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="sm:text-3xl font-bold text-slate-100">
          {isZh ? '服务条款' : 'Terms of Service'}
        </h1>
      </div>

      <p className="text-slate-400">
        {isZh ? '最后更新：2026年7月4日' : 'Last updated: July 4, 2026'}
      </p>

      <div className="prose prose-sm max-w-none text-neutral-700 space-y-6">
        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '1. 服务说明' : '1. Service Description'}
          </h2>
          <p>{isZh ? '极速压图（CompressFast）是一款在线图片压缩工具，提供纯浏览器端的图片压缩、格式转换、尺寸调整、水印添加等功能。' : 'CompressFast is an online image compression tool providing browser-side image compression, format conversion, resizing, watermarking, and more.'}</p>
          <h3 className="font-medium text-neutral-800 mt-3">{isZh ? '1.1 免费版' : '1.1 Free Tier'}</h3>
          <ul className="space-y-1">
            <li>{isZh ? '每次最多 30 张图片' : 'Up to 30 images per batch'}</li>
            <li>{isZh ? '单张不超过 25MB' : 'Max 25MB per file'}</li>
            <li>{isZh ? '支持 PNG / JPEG / WebP 输出格式' : 'PNG / JPEG / WebP output formats'}</li>
            <li>{isZh ? '核心压缩、尺寸调整、格式转换功能免费' : 'Core compression, resizing, and format conversion free'}</li>
          </ul>
          <h3 className="font-medium text-neutral-800 mt-3">{isZh ? '1.2 Pro 专业版' : '1.2 Pro Tier'}</h3>
          <ul className="space-y-1">
            <li>{isZh ? '一次性付费 $24.99，永久有效，无需订阅' : 'One-time $24.99 purchase, lifetime access, no subscription'}</li>
            <li>{isZh ? '每次最多 500 张，单张 50MB' : 'Up to 500/batch, 50MB per file'}</li>
            <li>{isZh ? 'AVIF 输出、水印、自定义预设、场景预设等高级功能' : 'AVIF output, watermark, custom presets, scene presets, and more'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '2. 用户责任' : '2. User Responsibilities'}
          </h2>
          <p>{isZh ? '使用本服务即表示您同意：' : 'By using this service, you agree that:'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '您拥有所处理图片的合法权利，或已获得权利人的授权' : 'You have the legal right to the images you process, or have obtained authorization from the rights holder.'}</li>
            <li>{isZh ? '您不会将本服务用于任何非法目的，包括但不限于处理侵权、违法或违反公序良俗的图片' : 'You will not use the service for illegal purposes, including processing infringing, illegal, or inappropriate images.'}</li>
            <li>{isZh ? '您不会尝试滥用、攻击或逆向工程本服务' : 'You will not attempt to abuse, attack, or reverse-engineer the service.'}</li>
            <li>{isZh ? '您不会使用自动化工具对本服务进行大规模请求，影响其他用户正常使用' : 'You will not use automated tools to make large-scale requests that affect other users.'}</li>
            <li>{isZh ? '您对自己上传和处理的图片内容负全部责任' : 'You are solely responsible for the content of images you upload and process.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '3. Pro 许可证' : '3. Pro License'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? 'Pro 为一次性购买，永久有效，不设订阅或续费' : 'Pro is a one-time purchase, valid for lifetime. No subscription or renewal.'}</li>
            <li>{isZh ? '每个激活码最多可用于 5 台设备。如果更换设备，旧设备的激活状态会自动失效' : 'Each license code can be used on up to 5 devices. When switching devices, old device activations are automatically invalidated.'}</li>
            <li>{isZh ? '激活码为个人使用许可，不可转让、不可转售、不可出租' : 'License codes are for personal use only — non-transferable, non-resellable, and non-rentable.'}</li>
            <li>{isZh ? '我们保留因滥用（包括但不限于：激活码分享给大量用户、转售激活码、恶意使用）而撤销许可证的权利' : 'We reserve the right to revoke licenses for abuse, including but not limited to: sharing codes with many users, reselling codes, or malicious use.'}</li>
            <li>{isZh ? '如许可证被撤销，我们将通过购买邮箱通知您' : 'If a license is revoked, we will notify you via the purchase email.'}</li>
            <li>{isZh ? 'Pro 功能可能随产品迭代更新，我们保留调整功能范围的权利，但不会减少您购买时已有的核心功能' : 'Pro features may evolve with product updates. We reserve the right to adjust feature scope but will not reduce core features available at time of purchase.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '4. 退款政策' : '4. Refund Policy'}
          </h2>
          <p>{isZh ? '我们提供以下退款政策：' : 'We offer the following refund policy:'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '购买后 7 天内，如激活码未被任何设备激活使用，可申请全额退款' : 'Full refund within 7 days of purchase if the license code has not been activated on any device.'}</li>
            <li>{isZh ? '如果激活码已激活使用，原则上不支持退款' : 'Once a license code has been activated, refunds are generally not available.'}</li>
            <li>{isZh ? '如遇技术问题导致无法正常使用 Pro 功能，我们将优先通过邮件支持解决。如无法解决，可以申请退款' : 'If technical issues prevent normal use of Pro features, we will first attempt email support. If unresolved, a refund may be requested.'}</li>
            <li>{isZh ? '退款申请请发送至 support@compressfast.site，请注明购买邮箱和订单号' : 'To request a refund, email support@compressfast.site with your purchase email and order ID.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '5. 知识产权' : '5. Intellectual Property'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '极速压图（CompressFast）的名称、Logo、网站设计、代码和文档均受知识产权保护' : 'The CompressFast name, logo, website design, code, and documentation are protected by intellectual property rights.'}</li>
            <li>{isZh ? '您上传和处理的图片的知识产权始终属于您' : 'The intellectual property of images you upload and process always belongs to you.'}</li>
            <li>{isZh ? '我们不会主张对您图片的任何所有权' : 'We do not claim any ownership over your images.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '6. 免责声明' : '6. Disclaimer'}
          </h2>
          <p>{isZh ? '本服务按"现状"提供，不提供任何明示或暗示的保证，包括但不限于：' : 'The service is provided "as is" without warranties of any kind, including but not limited to:'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '我们不保证服务不中断、及时、安全或零错误' : 'We do not guarantee uninterrupted, timely, secure, or error-free service.'}</li>
            <li>{isZh ? '我们不保证压缩结果一定能满足您的特定需求' : 'We do not guarantee that compression results will meet your specific requirements.'}</li>
            <li>{isZh ? '对于因使用本服务而产生的任何直接或间接损失，我们在法律允许的范围内不承担责任' : 'We are not liable for any direct or indirect damages arising from the use of this service, to the extent permitted by law.'}</li>
            <li>{isZh ? '我们建议用户在压缩重要图片前保留原始备份' : 'We recommend users keep original backups before compressing important images.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '7. 服务变更与终止' : '7. Service Changes & Termination'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '我们保留随时修改或终止服务的权利，但会尽可能提前通知用户' : 'We reserve the right to modify or discontinue the service, but will notify users in advance whenever possible.'}</li>
            <li>{isZh ? '如遇不可抗力或其他我们无法控制的因素导致服务中断，我们不承担责任' : 'We are not liable for service interruptions caused by force majeure or factors beyond our control.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '8. 管辖法律' : '8. Governing Law'}
          </h2>
          <p>{isZh ? '本服务条款受中华人民共和国法律管辖。因本条款引起的争议，双方应友好协商解决；协商不成的，提交有管辖权的人民法院裁决。' : 'These terms are governed by the laws of the People\'s Republic of China. Disputes arising from these terms shall be resolved through friendly negotiation; if negotiation fails, they shall be submitted to the competent people\'s court.'}</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '9. 联系我们' : '9. Contact'}
          </h2>
          <p>{isZh ? '如对服务条款有任何疑问，请通过以下方式联系：' : 'For questions about these terms of service:'}</p>
          <p className="mt-2">{isZh ? '邮箱：' : 'Email: '}<a href="mailto:support@compressfast.site" className="text-blue-600 hover:underline">support@compressfast.site</a></p>
          <p className="text-neutral-700 mt-4">{isZh ? '最后更新：2026年7月9日' : 'Last updated: July 9, 2026'}</p>
        </section>
      </div>
    </div>
  )
}
