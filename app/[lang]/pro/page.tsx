'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Loader2, Crown, X, Minus, Star, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'
import { useIsCn } from '@/lib/use-is-cn'
import { getDeviceFingerprint } from '@/lib/device-fingerprint'
import { trackPro } from '@/lib/pro-funnel'

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

  // 国内购买流程（虎皮椒 API 全自动）
  const [cnEmail, setCnEmail] = useState('')
  const [cnLoading, setCnLoading] = useState(false)
  const [cnQrcode, setCnQrcode] = useState('')
  const [cnError, setCnError] = useState('')

  useEffect(() => {
    checkProStatus()
    // 漏斗：Pro 页曝光（每次挂载记一次）
    trackPro('view')
    const pendingEmail = localStorage.getItem('pro_pending_email')
    if (pendingEmail) {
      if (!forgotEmail) setForgotEmail(pendingEmail)
      if (!buyEmail) setBuyEmail(pendingEmail)
    }
  }, [])

  const handleBuy = async () => {
    trackPro('click', 'pro_buy')
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
        trackPro('checkout', 'creem')
        localStorage.setItem('pro_pending_email', email)
        window.location.href = data.checkoutUrl
      } else {
        trackPro('fail', 'creem')
        setBuyError(data.error || 'Server error')
        setBuyLoading(false)
      }
    } catch {
      trackPro('fail', 'creem')
      setBuyError(locale === 'zh' ? '网络错误，请重试' : 'Network error, please retry')
      setBuyLoading(false)
    }
  }

  const handleCnPay = async () => {
    trackPro('click', 'pro_cn_buy')
    const email = cnEmail.trim()
    if (!email || !email.includes('@')) {
      setCnError(locale === 'zh' ? '请输入有效邮箱' : 'Please enter a valid email')
      return
    }
    setCnLoading(true)
    setCnError('')
    setCnQrcode('')
    try {
      const res = await fetch('/api/cn-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        trackPro('checkout', 'hupijiao')
        localStorage.setItem('pro_pending_email', email)
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        if (isMobile && data.url) {
          window.location.href = data.url
        } else if (data.qrcode) {
          setCnQrcode(data.qrcode)
        } else {
          setCnError(locale === 'zh' ? '支付链接生成失败，请重试' : 'Failed to create payment, please retry')
        }
      } else {
        trackPro('fail', 'hupijiao')
        setCnError(data.error || 'Server error')
      }
    } catch {
      trackPro('fail', 'hupijiao')
      setCnError(locale === 'zh' ? '网络错误，请重试' : 'Network error, please retry')
    }
    setCnLoading(false)
  }

  const handleActivate = async () => {
    setActivating(true)
    setActivateResult(null)
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: activateCode, fingerprint: getDeviceFingerprint() }),
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

  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-24 sm:py-12 space-y-8">
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
        <p className="text-neutral-700 mt-1 text-sm">
          {locale === 'zh'
            ? '解锁本地 AI 抠图/放大、AVIF 超小体积、水印与 500 张批量处理。'
            : 'Unlock on-device AI background removal, upscaling, AVIF output, watermarks and 500-image batches.'}
        </p>
        {!isPro && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
              {(isCn
                ? ['一次付费 · 无订阅', '5 台设备通用', '本地处理 · 不上传']
                : ['One-time payment', '5 devices', 'Local · no upload']
              ).map((item) => (
                <span key={item} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-neutral-700">
                  <Check className="w-3 h-3 text-green-600" /> {item}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                trackPro('click', 'hero_cta')
                document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Crown className="w-4 h-4" />
              {locale === 'zh' ? `立即升级 · ${isCn ? '¥9.9' : '$24.99'}` : 'Upgrade now · $24.99'}
            </button>
          </>
        )}
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
              { feature: t('pro.feature.batch'), free: isCn ? '15 张/次' : t('pro.free.batch'), pro: t('pro.pro.batch'), proDesc: isZh ? '海量处理，一次搞定' : 'Massive batch in one go' },
              { feature: t('pro.feature.sizePerFile'), free: t('pro.free.sizePerFile'), pro: t('pro.pro.sizePerFile'), proDesc: isZh ? '大图不受限' : 'Handle larger files' },
              { feature: isZh ? 'AI 抠图 / AI 放大' : 'AI remove BG / upscale', free: false, pro: true, proDesc: isZh ? '本地 AI 模型，图片不上传' : 'On-device AI, no upload' },
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
                ? 'bg-blue-50'
                : i % 2 === 0
                  ? 'bg-gray-50'
                  : 'bg-white'
              return (
                <div key={i} className={`contents text-xs`}>
                  <div className={`${bg} p-3 flex items-center gap-2 font-medium text-neutral-800`}>
                    {row.highlight && <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                    {row.feature}
                    {row.highlight && (
                      <span className="px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">NEW</span>
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
        <div id="buy" className="mt-6 text-center space-y-3 scroll-mt-24">
          <div>
            <span className="text-3xl font-bold text-neutral-900">{isCn ? '¥9.9' : t('pro.price')}</span>
            <span className="text-neutral-700 ml-2">{t('pro.priceLabel')}</span>
          </div>
          <p className="text-neutral-700">
            {locale === 'zh'
              ? '一次付费，永久有效。无需订阅，无需登录。'
              : 'Pay once, own forever. No subscription. No login.'}
          </p>

          {isCn ? (
            <div className="max-w-sm mx-auto space-y-3 text-left">
              <input
                type="email"
                value={cnEmail}
                onChange={(e) => { setCnEmail(e.target.value); setCnError('') }}
                placeholder={locale === 'zh' ? '输入邮箱接收激活码' : 'Your email for activation code'}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
              />
              {cnError && <p className="text-red-500 text-sm text-center">{cnError}</p>}

              {cnQrcode ? (
                <div className="text-center space-y-2 py-2">
                  <p className="text-sm font-medium text-neutral-800">
                    {locale === 'zh' ? '用微信/支付宝扫码支付 ¥9.9' : 'Scan with WeChat/Alipay to pay ¥9.9'}
                  </p>
                  <img src={cnQrcode} alt="支付二维码" className="w-48 h-48 mx-auto rounded-lg border border-gray-200" />
                  <button
                    onClick={() => setCnQrcode('')}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {locale === 'zh' ? '重新选择' : 'Start over'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCnPay}
                  disabled={cnLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
                >
                  {cnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (locale === 'zh' ? '去支付 ¥9.9（跳转虎皮椒）' : 'Pay ¥9.9 via HupiJiao')}
                </button>
              )}

              <p className="text-xs text-neutral-600 text-center">
                {locale === 'zh'
                  ? '支付在虎皮椒（第三方平台）完成，付款成功后激活码自动发到你的邮箱。'
                  : 'Payment happens on HupiJiao (third-party). Your code is emailed automatically after payment.'}
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </section>
      )}

      {/* FAQ — 消除购买前的疑问 */}
      {!isPro && (
        <section className="max-w-2xl mx-auto">
          <h2 className="font-bold text-neutral-900 text-center mb-4">
            {locale === 'zh' ? '购买前常见问题' : 'Before You Buy'}
          </h2>
          <div className="space-y-2">
            {(isCn
              ? [
                  ['这是订阅吗？', '不是。一次付费 ¥9.9，永久有效，不会自动续费。'],
                  ['激活码怎么拿到？', '付款成功后系统会自动把激活码发到你填写的邮箱。收到后在本页下方「激活 Pro」输入即可；忘记也可以凭邮箱随时查回。'],
                  ['可以几台设备用？', '同一个激活码最多 5 台设备，手机、电脑、平板都算，重装系统后重新激活即可。'],
                  ['图片会上传到服务器吗？', '不会。压缩、转格式、加水印全部在你的浏览器本地完成，文件不会离开你的设备。'],
                  ['Pro 比免费版多了什么？', '本地 AI 抠图与 AI 放大、AVIF 输出（比 WebP 再小约 30%）、图片/文字水印、场景预设、自定义预设、500 张/次批量、单张 50MB 和邮件支持。'],
                  ['免费版够用吗？', '每月可压缩 100 张、每次 15 张、单张 10MB。如果经常批量处理或需要 AVIF/水印，Pro 更合适。'],
                ]
              : [
                  ['Is this a subscription?', 'No. Pay once ($24.99) and own it forever. No auto-renewal.'],
                  ['How do I get my activation code?', 'It is emailed automatically after payment. Paste it into “Activate Pro” below. You can also look it up anytime with your email.'],
                  ['How many devices?', 'Up to 5 devices per code — phone, computer and tablet all count. Re-activate after reinstalling your system.'],
                  ['Are my images uploaded?', 'No. Compression, conversion and watermarking all run locally in your browser. Files never leave your device.'],
                  ['What does Pro add?', 'On-device AI background removal and upscaling, AVIF output (~30% smaller than WebP), text/image watermarks, scene presets, custom presets, 500 images per batch, 50MB per file and email support.'],
                  ['Is the free plan enough?', 'You get 400 images per month, 20 per batch and 10MB per file. Pro is for frequent batch work or AVIF/watermark needs.'],
                ]
            ).map(([q, a]) => (
              <details key={q} className="group bg-white border border-gray-200 rounded-xl px-4 py-3 open:border-blue-200 open:bg-blue-50/40">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-medium text-neutral-800 text-sm">
                  <span>{q}</span>
                  <span className="text-neutral-400 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
                </summary>
                <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{a}</p>
              </details>
            ))}
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

      {/* 移动端吸底 CTA — 长页面随时可下单 */}
      {!isPro && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-neutral-900 leading-tight">
              {isCn ? '¥9.9' : '$24.99'}
              <span className="ml-1.5 text-xs font-normal text-neutral-600">
                {locale === 'zh' ? '一次买断' : 'one-time'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {locale === 'zh' ? '永久有效 · 5 台设备' : 'Lifetime · 5 devices'}
            </div>
          </div>
          <button
            onClick={() => {
              trackPro('click', 'mobile_sticky')
              document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all"
          >
            {locale === 'zh' ? '立即升级' : 'Upgrade'}
          </button>
        </div>
      )}
    </div>
  )
}
