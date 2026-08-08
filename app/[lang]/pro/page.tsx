'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Loader2, Crown, X, Minus, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useIsCn } from '@/lib/use-is-cn'

/** 功能对比行数据 */
interface FeatureRow {
  feature: string
  free: string | boolean
  pro: string | boolean
  proDesc?: string
  highlight?: boolean
}

export default function ProPage() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { isPro, checkProStatus } = useCompressionStore()
  const [activateCode, setActivateCode] = useState('')
  const [activating, setActivating] = useState(false)
  const [activateResult, setActivateResult] = useState<'success' | 'invalid' | 'limit' | 'error' | null>(null)

  const [forgotEmail, setForgotEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<'success' | 'error' | 'notfound' | 'pending' | null>(null)

  // 购买流程
  const [buyEmail, setBuyEmail] = useState('')
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState('')

  useEffect(() => {
    checkProStatus()
    const pendingEmail = localStorage.getItem('pro_pending_email')
    if (pendingEmail) {
      if (!forgotEmail) setForgotEmail(pendingEmail)
      if (!buyEmail) setBuyEmail(pendingEmail)
    }
  }, [])

  const handleBuy = async () => {
    const email = buyEmail.trim()
    if (!email || !email.includes('@')) {
      setBuyError(locale === 'zh' ? '请输入有效邮箱' : 'Please enter a valid email')
      return
    }
    setBuyLoading(true)
    setBuyError('')
    try {
      const res = await fetch('/api/create-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      const data = await res.json()
      if (data.checkoutUrl) {
        localStorage.setItem('pro_pending_email', email)
        window.location.href = data.checkoutUrl
      } else {
        setBuyError(data.error || 'Server error')
        setBuyLoading(false)
      }
    } catch {
      setBuyError(locale === 'zh' ? '网络错误，请重试' : 'Network error, please retry')
      setBuyLoading(false)
    }
  }

  const handleActivate = async () => {
    setActivating(true)
    setActivateResult(null)
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activateCode }),
      })
      const data = await res.json()
      if (data.valid) {
        localStorage.setItem('pro_license', activateCode.toUpperCase().trim())
        await checkProStatus()
        setActivateResult('success')
      } else if (data.reason === 'device_limit') {
        setActivateResult('limit')
      } else {
        setActivateResult('invalid')
      }
    } catch {
      setActivateResult('error')
    }
    setActivating(false)
  }

  // Forgot code → lookup in Redis
  const [foundCode, setFoundCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [pendingRetry, setPendingRetry] = useState(0)

  const handleLookup = async () => {
    setResending(true)
    setResendResult(null)
    setFoundCode('')
    try {
      const res = await fetch('/api/resend-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (data.code) {
        setFoundCode(data.code)
        setResendResult('success')
        setPendingRetry(0)
      } else if (data.pending) {
        setResendResult('pending')
        const retries = pendingRetry + 1
        setPendingRetry(retries)
        if (retries <= 5) {
          setTimeout(() => handleLookup(), 3000)
        }
      } else {
        setResendResult('notfound')
        setPendingRetry(0)
      }
    } catch {
      setResendResult('error')
      setPendingRetry(0)
    }
    setResending(false)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(foundCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 3000)
    } catch {}
  }

  if (isCn) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="text-5xl">🆓</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          {locale === 'zh' ? '国内版完全免费' : 'Free in China Region'}
        </h1>
        <p className="text-neutral-800 max-w-md mx-auto">
          {locale === 'zh'
            ? '极速压图国内版永久免费，无需付费解锁。批量压缩、格式转换、尺寸调整等全部功能免费使用。'
            : 'CompressFast domestic version is permanently free. All features including batch compression, format conversion, and resizing are free to use.'}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === 'zh' ? '开始压缩' : 'Start Compressing'}
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-neutral-600 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {t('vs.back')}
      </Link>

      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium mb-3">
          <Crown className="w-3 h-3" /> {t('pro.heading')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('pro.heading')}</h1>
        <p className="text-neutral-800 mt-2">{t('pro.subtitle')}</p>
      </section>

      {/* Feature Comparison Table */}
      {!isPro && (
      <section className="max-w-2xl mx-auto">
        <h2 className="font-bold text-neutral-900 text-center mb-5">
          {locale === 'zh' ? '功能对比' : 'Feature Comparison'}
        </h2>

        {/* 表头 */}
        <div className="grid grid-cols-[1fr_100px_100px] gap-px bg-gray-200 rounded-xl overflow-hidden text-sm">
          <div className="bg-white p-3 font-semibold text-neutral-800">
            {locale === 'zh' ? '功能' : 'Feature'}
          </div>
          <div className="bg-white p-3 font-semibold text-center text-neutral-700">
            {t('pro.freePlan')}
          </div>
          <div className="bg-blue-50 p-3 font-semibold text-center text-blue-700">
            <span className="flex items-center justify-center gap-1">
              <Crown className="w-3.5 h-3.5" /> Pro
            </span>
          </div>

          {(() => {
            const isZh = locale === 'zh'
            const features: FeatureRow[] = [
              { feature: t('pro.feature.batch'), free: t('pro.free.batch'), pro: t('pro.pro.batch'), proDesc: isZh ? '海量处理，一次搞定' : 'Massive batch in one go' },
              { feature: t('pro.feature.sizePerFile'), free: t('pro.free.sizePerFile'), pro: t('pro.pro.sizePerFile'), proDesc: isZh ? '大图不受限' : 'Handle larger files' },
              { feature: t('pro.feature.formats'), free: t('pro.free.formats'), pro: t('pro.pro.formats'), proDesc: t('pro.proDesc.formats'), highlight: true },
              { feature: t('pro.feature.watermark'), free: false, pro: true, proDesc: t('pro.proDesc.watermark') },
              { feature: t('pro.feature.presets'), free: false, pro: true, proDesc: t('pro.proDesc.presets') },
              { feature: t('pro.feature.scenes'), free: false, pro: true, proDesc: t('pro.proDesc.scenes') },
              { feature: t('pro.feature.presetExport'), free: false, pro: true, proDesc: t('pro.proDesc.export') },
              { feature: t('pro.feature.ads'), free: false, pro: true, proDesc: isZh ? '纯净体验' : 'Clean experience' },
              { feature: t('pro.feature.support'), free: false, pro: true, proDesc: t('pro.proDesc.support') },
              { feature: t('pro.feature.devices'), free: '1', pro: '5', proDesc: isZh ? '手机+电脑+平板全支持' : 'Phone + PC + tablet' },
              { feature: t('pro.feature.updates'), free: true, pro: true, proDesc: isZh ? '持续免费更新' : 'Free updates forever' },
            ]
            return features.map((row, i) => {
              const bg = row.highlight
                ? 'bg-purple-50'
                : i % 2 === 0
                  ? 'bg-gray-50'
                  : 'bg-white'
              return (
                <div key={i} className={`contents text-xs`}>
                  <div className={`${bg} p-3 flex items-center gap-2 font-medium text-neutral-800`}>
                    {row.highlight && <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />}
                    {row.feature}
                    {row.highlight && (
                      <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">NEW</span>
                    )}
                  </div>
                  <div className={`${bg} p-3 text-center text-neutral-700`}>
                    {row.free === true ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : typeof row.free === 'string' ? <span className="text-neutral-700">{row.free}</span> : <X className="w-4 h-4 text-neutral-400 mx-auto" />}
                  </div>
                  <div className={`${bg} p-3 text-center`}>
                    {row.pro === true ? <Check className="w-4 h-4 text-blue-600 mx-auto" /> : typeof row.pro === 'string' ? <span className="font-semibold text-blue-600">{row.pro}</span> : <Minus className="w-4 h-4 text-neutral-400 mx-auto" />}
                  </div>
                </div>
              )
            })
          })()}
        </div>

        {/* 价格 CTA */}
        <div className="mt-6 text-center space-y-3">
          <div>
            <span className="text-3xl font-bold text-neutral-900">{t('pro.price')}</span>
            <span className="text-neutral-700 ml-2">{t('pro.priceLabel')}</span>
          </div>
          <p className="text-neutral-700">
            {locale === 'zh'
              ? '一次付费，永久有效。无需订阅，无需登录。'
              : 'Pay once, own forever. No subscription. No login.'}
          </p>
          <div className="max-w-sm mx-auto space-y-2">
            <input
              type="email"
              value={buyEmail}
              onChange={(e) => { setBuyEmail(e.target.value); setBuyError('') }}
              placeholder={locale === 'zh' ? '输入邮箱接收激活码' : 'Your email for activation code'}
              className="w-full px-4 py-2.5 text-center rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
            />
            {buyError && <p className="text-red-500 text-sm">{buyError}</p>}
            <button
              onClick={handleBuy}
              disabled={buyLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
            >
              {buyLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Crown className="w-4 h-4" /> {t('pro.buyButton')}
                </>
              )}
            </button>
            <p className="text-neutral-600 text-xs">
              {locale === 'zh'
                ? '🔒 安全支付由 Creem 处理 · 支持 Visa/Mastercard'
                : '🔒 Secure payment via Creem · Visa/Mastercard'}
            </p>
          </div>
        </div>
      </section>
      )}

      {/* Affiliate teaser — non-Pro users only */}
      {!isCn && !isPro && (
        <section className="max-w-md mx-auto pt-6">
          <Link href={`/${locale}/affiliates`} className="block bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 hover:border-green-300 transition-all group">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="font-semibold text-green-800 text-sm">
                  {locale === 'zh' ? '赚回你的 Pro 费用' : 'Earn back your Pro cost'}
                </h3>
                <p className="text-green-700 text-xs mt-1 leading-relaxed">
                  {locale === 'zh'
                    ? '加入联盟分销计划，推荐朋友购买 Pro，每单赚 $12.50（50%佣金）。只需 2 单就回本，上不封顶。'
                    : 'Join our affiliate program. Refer users to Pro and earn $12.50 per sale (50%). Just 2 referrals and Pro pays for itself.'}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-green-600 group-hover:text-green-700 transition-colors">
                  {locale === 'zh' ? '了解详情 →' : 'Learn more →'}
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Pro Active Banner */}
      {isPro && (
        <section className="max-w-md mx-auto pt-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <Crown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-green-700">{t('pro.active')}</h2>
            <p className="text-green-600 mt-1">{t('pro.activeDesc')}</p>
          </div>
        </section>
      )}

      {/* Activate */}
      <section className="max-w-md mx-auto pt-8">
        <h2 className="font-semibold text-neutral-900 mb-4 text-center">
          {isPro ? (locale === 'zh' ? '管理激活码' : 'Manage License') : t('pro.activate.title')}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={activateCode}
            onChange={(e) => setActivateCode(e.target.value)}
            placeholder={t('pro.activate.input')}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 font-mono placeholder:text-neutral-400"
          />
          <button
            onClick={handleActivate}
            disabled={activating || activateCode.length < 8}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-neutral-800 rounded-lg font-medium text-sm disabled:opacity-50 transition-colors border border-gray-200"
          >
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pro.activate.button')}
          </button>
        </div>
        {activateResult === 'success' && (
          <p className="mt-2 text-green-600 text-sm">{t('pro.activate.success')}</p>
        )}
        {activateResult === 'invalid' && (
          <p className="mt-2 text-red-500 text-sm">{t('pro.activate.invalid')}</p>
        )}
        {activateResult === 'limit' && (
          <p className="mt-2 text-amber-600 text-sm">{t('pro.activate.limit')}</p>
        )}

        {/* Forgot code */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-neutral-700 mb-2 text-sm">
            {locale === 'zh' ? '忘记激活码？输入购买邮箱直接查' : 'Forgot your code? Look it up with your email'}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setFoundCode(''); setResendResult(null) }}
              placeholder={t('pro.forgot.email')}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
            />
            <button
              onClick={handleLookup}
              disabled={resending || !forgotEmail.includes('@')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'zh' ? '查找' : 'Look Up')}
            </button>
          </div>

          {foundCode && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-700 mb-2 text-sm">
                {locale === 'zh' ? '🎉 找到你的激活码：' : '🎉 Your activation code:'}
              </p>
              <div className="flex items-center gap-2 justify-center">
                <code className="px-4 py-2 bg-white rounded-lg font-bold tracking-widest text-neutral-900 border border-gray-200 select-all text-sm">
                  {foundCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {codeCopied ? (locale === 'zh' ? '已复制' : 'Copied!') : (locale === 'zh' ? '复制' : 'Copy')}
                </button>
              </div>
              <p className="text-neutral-600 mt-2 text-xs">
                {locale === 'zh' ? '复制后回到上方激活框粘贴即可' : 'Copy and paste it in the activation box above'}
              </p>
            </div>
          )}

          {!foundCode && resendResult === 'success' && (
            <p className="mt-2 text-green-600 text-sm">{t('pro.forgot.success')}</p>
          )}
          {resendResult === 'pending' && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
              <p className="text-blue-700 text-sm">
                {locale === 'zh'
                  ? `付款已收到，正在生成激活码...(${pendingRetry}/5)`
                  : `Payment received, generating your code... (${pendingRetry}/5)`}
              </p>
            </div>
          )}
          {resendResult === 'notfound' && (
            <div className="mt-2 text-amber-700 space-y-1 text-sm">
              <p>
                {locale === 'zh'
                  ? '该邮箱暂未找到激活码。可能的原因：'
                  : 'No code found. Possible reasons:'}
              </p>
              <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-600">
                <li>{locale === 'zh' ? '刚付款？激活码生成需要几秒，会自动重试' : 'Just paid? Code generation takes a few seconds'}</li>
                <li>{locale === 'zh' ? '付款用了不同的邮箱？（PayPal 有自己的邮箱）' : 'Used a different email for payment?'}</li>
                <li>{locale === 'zh' ? '邮箱有拼写错误？' : 'Typo in the email?'}</li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
