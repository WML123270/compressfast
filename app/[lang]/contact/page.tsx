'use client'

import Link from 'next/link'
import { Mail, Globe, Shield, Clock, MessageCircle, ArrowLeft } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

export default function ContactPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-neutral-700 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <section>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">
          {isZh ? '联系我们' : 'Contact Us'}
        </h1>
        <p className="text-neutral-700 mt-3 leading-relaxed">
          {isZh
            ? '感谢您使用极速压图。无论您遇到问题、有改进建议，还是想进行商务合作，我们都非常欢迎您的来信。我们会在 24 小时内回复您的邮件。'
            : 'Thank you for using CompressFast. Whether you have questions, suggestions, or business inquiries, we are happy to hear from you. We reply within 24 hours.'}
        </p>
      </section>

      {/* Contact methods */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Mail, title: isZh ? '电子邮箱' : 'Email',
            value: 'support@compressfast.site',
            desc: isZh ? '技术支持 · 问题反馈 · Pro帮助' : 'Support · Feedback · Pro Help',
            href: 'mailto:support@compressfast.site',
          },
          {
            icon: MessageCircle, title: isZh ? '在线反馈' : 'Online Feedback',
            value: isZh ? '站内使用即反馈' : 'Use the tool and reach out',
            desc: isZh ? '直接使用工具，遇到问题随时联系我们' : 'Try the tool, contact us anytime',
            href: null,
          },
          {
            icon: Clock, title: isZh ? '响应时间' : 'Response Time',
            value: isZh ? '24 小时内回复' : 'Within 24 hours',
            desc: isZh ? '工作日通常 2-4 小时内回复' : 'Usually within 2-4 hours on weekdays',
            href: null,
          },
        ].map(({ icon: Icon, title, value, desc, href }) => (
          <div key={title} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-200 transition-all">
            <Icon className="w-6 h-6 text-blue-600 mb-3" />
            <h3 className="font-semibold text-neutral-900 text-sm mb-1">{title}</h3>
            {href ? (
              <a href={href} className="text-blue-600 hover:underline text-sm break-all">{value}</a>
            ) : (
              <span className="text-neutral-800 text-sm">{value}</span>
            )}
            <p className="text-xs text-neutral-700 mt-2">{desc}</p>
          </div>
        ))}
      </section>

      {/* Common inquiry types */}
      <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-100">
            {isZh ? '常见咨询类型' : 'Common Inquiries'}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { q: isZh ? '技术问题' : 'Tech Support', a: isZh ? '压缩失败、格式不支持、批量下载异常等使用问题' : 'Compression failures, unsupported formats, batch download issues' },
            { q: isZh ? 'Pro 购买咨询' : 'Pro Purchase', a: isZh ? '购买流程、激活方式、设备管理、发票需求' : 'Purchase process, activation, device management, invoicing' },
            { q: isZh ? '商务合作' : 'Partnership', a: isZh ? '友情链接交换、技术集成、媒体评测' : 'Link exchange, tech integration, media reviews' },
            { q: isZh ? '内容举报' : 'Report Abuse', a: isZh ? '如发现侵权或违规内容，请提供具体链接和说明' : 'For infringement or abuse reports, include details & URLs' },
            { q: isZh ? 'BUG 反馈' : 'Bug Report', a: isZh ? '附带截图、浏览器版本、操作步骤可帮助我们更快定位问题' : 'Include screenshots, browser version & steps to reproduce' },
            { q: isZh ? '功能建议' : 'Feature Request', a: isZh ? '希望新增的格式支持、批量功能、集成方案等' : 'New format support, batch features, integration ideas, etc.' },
          ].map(({ q, a }) => (
            <div key={q} className="flex items-start gap-2 p-3 rounded-lg bg-white/5">
              <span className="text-blue-600 font-semibold shrink-0">{q}：</span>
              <span className="text-neutral-700 leading-relaxed">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Site info */}
      <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-100">
            {isZh ? '站点信息' : 'Site Information'}
          </h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <span className="text-slate-500">{isZh ? '站点名称：' : 'Site: '}</span>
              <span className="text-slate-300">{isZh ? '极速压图' : 'CompressFast'}</span>
            </div>
            <div>
              <span className="text-slate-500">{isZh ? '域名：' : 'Domain: '}</span>
              <span className="text-slate-300">jisuyatu.com</span>
            </div>
            <div>
              <span className="text-slate-500">{isZh ? '运营主体：' : 'Operator: '}</span>
              <span className="text-slate-300">{isZh ? '个人开发者' : 'Independent Developer'}</span>
            </div>
          </div>
          <div>
            <span className="text-slate-500">ICP{isZh ? '备案' : ' Filing'}：</span>
            <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              湘ICP备2026026910号
            </a>
          </div>
          <div>
            <span className="text-slate-500">{isZh ? '服务宗旨：' : 'Mission: '}</span>
            <span className="text-slate-300">
              {isZh ? '纯浏览器端图片压缩，文件绝不上传服务器，保护用户隐私安全' : '100% browser-side image compression. Files never uploaded. Privacy protected.'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">{isZh ? '网站特点：' : 'Features: '}</span>
            <span className="text-slate-400">
              {isZh ? '免费在线使用 · 支持批量压缩 · 多种输出格式 · 水印添加 · 尺寸调整 · 旋转翻转' : 'Free online · Batch compression · Multiple formats · Watermark · Resize · Rotate & Flip'}
            </span>
          </div>
        </div>
      </section>

      {/* Bottom nav */}
      <div className="border-t border-gray-200 pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href={`/${locale}`} className="px-4 py-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
            🏠 {isZh ? '返回首页' : 'Home'}
          </Link>
          <Link href={`/${locale}/help`} className="px-4 py-2 rounded-full bg-gray-50 text-neutral-700 hover:bg-gray-100 transition-colors font-medium">
            📖 {isZh ? '帮助中心' : 'Help Center'}
          </Link>
          <Link href={`/${locale}/about`} className="px-4 py-2 rounded-full bg-gray-50 text-neutral-700 hover:bg-gray-100 transition-colors font-medium">
            ℹ️ {isZh ? '关于我们' : 'About Us'}
          </Link>
        </div>
      </div>
    </div>
  )
}
