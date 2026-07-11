'use client'

import Link from 'next/link'
import { ArrowLeft, Heart, Code, Globe, Mail } from 'lucide-react'
import { useT } from '@/lib/i18n/context'
import { useIsCn } from '@/lib/use-is-cn'

export default function AboutPage() {
  const { t, locale } = useT()
  const isZh = locale === 'zh'
  const isCn = useIsCn()

  const techStack = [
    { name: 'Next.js 14', desc: isZh ? 'React 全栈框架，支持服务端渲染和静态生成' : 'React full-stack framework with SSR/SSG' },
    { name: 'Canvas API + Web Worker', desc: isZh ? '浏览器端高性能图片处理，不依赖服务端' : 'High-performance browser-side image processing' },
    { name: 'Tailwind CSS', desc: isZh ? '原子化 CSS 框架，支持暗色模式和响应式设计' : 'Utility-first CSS framework with dark mode & responsive design' },
    { name: 'Zustand', desc: isZh ? '轻量级状态管理，管理压缩配置和文件列表' : 'Lightweight state management for compression config & file list' },
    { name: 'Upstash Redis', desc: isZh ? '激活码验证和统计数据存储' : 'License verification and analytics storage' },
    { name: 'Resend + QQ SMTP', desc: isZh ? '双通道邮件发送，确保激活码及时送达' : 'Dual-channel email delivery for reliable code delivery' },
    { name: 'Creem', desc: isZh ? '安全便捷的国际支付处理' : 'Secure international payment processing' },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
        <ArrowLeft className="w-4 h-4" /> {isZh ? '返回首页' : 'Back to Home'}
      </Link>

      <section className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{t('about.title')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-2xl mx-auto">{t('about.subtitle')}</p>
      </section>

      {/* Story */}
      <section className="bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-200 dark:border-brand-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="w-6 h-6 text-red-500" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('about.story')}</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('about.storyText')}</p>
      </section>

      {/* Philosophy */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">{t('about.mission')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t('about.missionText')}</p>
      </section>

      {/* Tech Stack */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('about.tech')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('about.techText')}</p>
        <div className="space-y-2">
          {techStack.map(tech => (
            <div key={tech.name} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50">
              <Code className="w-4 h-4 text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{tech.name}</span>
                <span className="text-slate-400 dark:text-slate-500 mx-2">—</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{tech.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('about.contact')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{t('about.contactText')}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30">
            <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400 mr-2">{t('about.email')}:</span>
            <a href="mailto:support@compressfast.site" className="text-sm text-brand-600 dark:text-brand-400 hover:underline">support@compressfast.site</a>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30">
            <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {isZh ? '海外版: ' : 'Global: '}
              <a href="https://compressfast.site" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">compressfast.site</a>
            </span>
          </div>
          {isCn && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <Globe className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {isZh ? '国内版: ' : 'China: '}
                <a href="https://jisuyatu.com" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">jisuyatu.com</a>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Legal */}
      {isCn && (
        <section className="border-t border-slate-200 dark:border-slate-700 pt-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">{t('about.legal')}</h2>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <p>{t('about.icp')}: <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:underline">{t('about.icpText')}</a></p>
            <p>{t('about.copyright')}</p>
          </div>
        </section>
      )}

      {/* Bottom nav */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          <Link href={`/${locale}`} className="px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors font-medium">
            🏠 {isZh ? '返回首页' : 'Home'}
          </Link>
          <Link href={`/${locale}/help`} className="px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium">
            📖 {isZh ? '帮助中心' : 'Help Center'}
          </Link>
        </div>
      </div>
    </div>
  )
}
