'use client'

import { useT } from '@/lib/i18n/context'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'

export default function PrivacyPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-600">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-brand-600" />
        <h1 className="sm:text-3xl font-bold text-slate-100">
          {isZh ? '隐私政策' : 'Privacy Policy'}
        </h1>
      </div>

      <p className="text-slate-400">
        {isZh ? '最后更新：2026年7月4日' : 'Last updated: July 4, 2026'}
      </p>

      <div className="prose prose-sm max-w-none text-slate-400 space-y-6">
        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '1. 我们收集什么信息' : '1. Information We Collect'}
          </h2>
          <p>{isZh ? '极速压图致力于保护您的隐私。我们的核心原则是：最小化数据收集，最大化本地处理。' : 'CompressFast is committed to protecting your privacy. Our core principle: minimize data collection, maximize local processing.'}</p>
          <h3 className="font-medium text-slate-300 mt-4">{isZh ? '1.1 我们不收集的信息' : '1.1 What We DO NOT Collect'}</h3>
          <ul className="space-y-1">
            <li>{isZh ? '图片文件：所有图片压缩在您的浏览器本地完成，原始文件和压缩后的文件永远不会上传到我们的服务器' : 'Image files: All compression happens locally. Original and compressed files are never uploaded to our servers.'}</li>
            <li>{isZh ? '个人信息：我们不要求注册账号，不收集姓名、手机号、地址等个人身份信息' : 'Personal info: No account required. We do not collect names, phone numbers, or addresses.'}</li>
            <li>{isZh ? '位置信息：除非在 EXIF 中，我们不收集 GPS 定位数据。建议开启「清除照片信息」移除敏感数据' : 'Location: We do not collect GPS data. Enable "Strip Photo Info" to remove EXIF location.'}</li>
            <li>{isZh ? '设备指纹：我们不追踪或识别您的设备' : 'Device fingerprinting: We do not track or fingerprint your device.'}</li>
          </ul>
          <h3 className="font-medium text-slate-300 mt-4">{isZh ? '1.2 我们收集的有限信息' : '1.2 What We DO Collect'}</h3>
          <ul className="space-y-1">
            <li>{isZh ? '激活码信息：购买 Pro 时，我们会存储您的激活码、购买邮箱和设备数量（最多 5 台）以验证授权' : 'License info: When purchasing Pro, we store your license code, purchase email, and device count (max 5) for verification.'}</li>
            <li>{isZh ? '匿名统计：我们使用分析工具收集匿名的页面访问数据（如 PV、UV），不包含个人身份信息' : 'Anonymous analytics: We collect anonymous page visit data (PV, UV) without personal identifiers.'}</li>
            <li>{isZh ? '邮件地址：仅当您主动联系或购买 Pro 时，我们才会获取您的邮箱地址用于发送激活码和服务支持' : 'Email: Only when you contact us or purchase Pro, we use your email to send license codes and support.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '2. 我们如何使用信息' : '2. How We Use Information'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '激活码验证：验证您的 Pro 许可证是否有效，管理设备数量限制' : 'License verification: Validate Pro licenses and manage device limits.'}</li>
            <li>{isZh ? '邮件发送：购买 Pro 后发送激活码到您的邮箱。我们也可能发送重要的服务更新通知' : 'Email delivery: Send activation codes after purchase, and important service updates.'}</li>
            <li>{isZh ? '服务改进：匿名统计数据帮助我们了解功能使用情况、优化性能和用户体验' : 'Service improvement: Anonymous analytics help us understand feature usage and optimize performance.'}</li>
            <li>{isZh ? '安全防护：我们使用必要的技术手段防止滥用、欺诈和恶意攻击' : 'Security: We employ necessary technical measures to prevent abuse, fraud, and malicious attacks.'}</li>
            <li>{isZh ? '我们不会出售、出租或与第三方分享您的个人信息用于营销目的' : 'We do NOT sell, rent, or share your personal information with third parties for marketing.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '3. 数据存储与安全' : '3. Data Storage & Security'}
          </h2>
          <p>{isZh ? '我们认真对待您的数据安全：' : 'We take data security seriously:'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '激活码数据存储在 Upstash Redis 中，使用加密传输和访问控制' : 'License data is stored in Upstash Redis with encrypted transport and access control.'}</li>
            <li>{isZh ? '图片数据从不离开您的设备——所有压缩处理完全在浏览器本地完成' : 'Image data NEVER leaves your device — all compression is entirely local.'}</li>
            <li>{isZh ? '我们使用 HTTPS 加密所有网络通信，保护您的浏览安全' : 'We use HTTPS to encrypt all network communications.'}</li>
            <li>{isZh ? '我们不会存储您的原始图片或压缩后的图片' : 'We do NOT store your original or compressed images.'}</li>
            <li>{isZh ? '付款信息由第三方支付平台（Creem）直接处理，我们不接触您的银行卡信息' : 'Payment info is processed directly by Creem — we never see your card details.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '4. 第三方服务' : '4. Third-Party Services'}
          </h2>
          <p>{isZh ? '我们使用以下第三方服务，它们各自有独立的隐私政策：' : 'We use the following third-party services, each with their own privacy policies:'}</p>
          <ul className="space-y-2">
            <li><strong>Creem</strong> — {isZh ? '支付处理。当您购买 Pro 时，支付信息直接由 Creem 安全处理。' : 'Payment processing. Your payment details are handled securely by Creem.'} <a href="https://creem.io/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">{isZh ? '隐私政策' : 'Privacy Policy'} →</a></li>
            <li><strong>Resend</strong> — {isZh ? '邮件发送。用于发送激活码和服务通知。' : 'Email delivery for activation codes and service notifications.'} <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">{isZh ? '隐私政策' : 'Privacy Policy'} →</a></li>
            <li><strong>Upstash</strong> — {isZh ? '数据库。存储激活码和许可证验证数据。' : 'Database for license codes and verification data.'} <a href="https://upstash.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">{isZh ? '隐私政策' : 'Privacy Policy'} →</a></li>
            <li><strong>{isZh ? '百度统计' : 'Baidu Analytics'}</strong> — {isZh ? '网站分析。仅中国版使用，收集匿名访问数据。' : 'Site analytics for CN version. Anonymous visit data only.'}</li>
            <li><strong>Vercel</strong> — {isZh ? '托管平台。海外版部署在 Vercel，可能收集访问日志。' : 'Hosting. Global version is deployed on Vercel, which may collect access logs.'} <a href="https://vercel.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline text-xs">{isZh ? '隐私政策' : 'Privacy Policy'} →</a></li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '5. Cookie 使用' : '5. Cookie Usage'}
          </h2>
          <p>{isZh ? '我们使用最小化的 Cookie：' : 'We use minimal cookies:'}</p>
          <ul className="space-y-1">
            <li>{isZh ? '语言偏好（lang）：记住您选择的语言（中文/英文），有效期一年' : 'Language preference (lang): Remembers your language choice, valid for 1 year.'}</li>
            <li>{isZh ? 'Pro 激活状态：本地存储 Pro 许可证信息，不发送到服务器' : 'Pro activation: Locally stored license info, never sent to servers.'}</li>
            <li>{isZh ? '我们不使用追踪型 Cookie 或广告定向 Cookie' : 'We do NOT use tracking cookies or ad-targeting cookies.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '6. 您的权利' : '6. Your Rights'}
          </h2>
          <ul className="space-y-1">
            <li>{isZh ? '知情权：您可以随时了解我们收集了哪些数据' : 'Right to know: You can always check what data we have about you.'}</li>
            <li>{isZh ? '删除权：您可以要求删除存储的激活码信息和相关邮件地址' : 'Right to delete: You can request deletion of your license info and email.'}</li>
            <li>{isZh ? '数据可携带：您可以导出预设配置 JSON 文件，随时迁移到其他设备' : 'Data portability: You can export preset configs as JSON for cross-device use.'}</li>
            <li>{isZh ? '由于图片从不离开您的设备，您拥有对图片数据的完全控制权' : 'Since images never leave your device, you have full control over your image data.'}</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '7. 儿童隐私' : '7. Children\'s Privacy'}
          </h2>
          <p>{isZh ? '我们的服务不面向 13 岁以下的儿童。我们不会故意收集儿童的个人信息。如果您是家长或监护人，发现您的孩子在未经您同意的情况下向我们提供了个人信息，请联系我们，我们将尽快删除相关数据。' : 'Our service is not directed to children under 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us and we will promptly delete such data.'}</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '8. 政策更新' : '8. Policy Updates'}
          </h2>
          <p>{isZh ? '我们可能会不时更新本隐私政策。重大变更时我们会通过网站公告或邮件通知。建议您定期查看本页面以了解最新版本。' : 'We may update this privacy policy from time to time. Significant changes will be announced on the website or via email. We recommend checking this page periodically for the latest version.'}</p>
        </section>

        <section>
          <h2 className="font-semibold text-slate-200">
            {isZh ? '9. 联系我们' : '9. Contact Us'}
          </h2>
          <p>{isZh ? '如果您对隐私政策有任何疑问、或希望行使您的数据权利，请通过以下方式联系：' : 'For questions about this privacy policy or to exercise your data rights:'}</p>
          <p className="mt-2">{isZh ? '邮箱：' : 'Email: '}<a href="mailto:support@compressfast.site" className="text-brand-600 hover:underline">support@compressfast.site</a></p>
          <p className="text-slate-400 mt-4">{isZh ? '最后更新：2026年7月9日' : 'Last updated: July 9, 2026'}</p>
        </section>
      </div>
    </div>
  )
}
