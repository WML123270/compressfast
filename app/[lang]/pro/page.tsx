'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Check, Loader2, Crown, X, Minus, Sparkles, ShieldCheck, Mail, RefreshCw } from 'lucide-react'
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

const PENDING_KEY = 'pro_pending_email'
const PENDING_AT_KEY = 'pro_pending_at'
const LAST_EMAIL_KEY = 'pro_last_email'
const PENDING_TTL_MS = 24 * 60 * 60 * 1000

function maskEmail(email: string): string {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}***@${domain}`
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function ProPage() {
  const { t, locale } = useT()
  const isCn = useIsCn()
  const { isPro, checkProStatus } = useCompressionStore()
  const isZh = locale === 'zh'
  const price = isCn ? '¥9.9' : '$24.99'
  const supportEmail = 'support@compressfast.site'

  const [activateCode, setActivateCode] = useState('')
  const [activating, setActivating] = useState(false)
  const [activateResult, setActivateResult] = useState<'success' | 'invalid' | 'limit' | 'error' | null>(null)

  const [forgotEmail, setForgotEmail] = useState('')
  const [resending, setResending] = useState(false)
  const [resendResult, setResendResult] = useState<'success' | 'error' | 'notfound' | 'pending' | null>(null)
  const [foundCode, setFoundCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [pendingRetry, setPendingRetry] = useState(0)
  const [activatingFound, setActivatingFound] = useState(false)
  const lookupInFlight = useRef(false)

  // 购买流程
  const [buyEmail, setBuyEmail] = useState('')
  const [buyEmailTouched, setBuyEmailTouched] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyError, setBuyError] = useState('')

  // 国内购买流程（虎皮椒 API 全自动）
  const [cnEmail, setCnEmail] = useState('')
  const [cnEmailTouched, setCnEmailTouched] = useState(false)
  const [cnLoading, setCnLoading] = useState(false)
  const [cnQrcode, setCnQrcode] = useState('')
  const [cnOrderEmail, setCnOrderEmail] = useState('')
  const [cnError, setCnError] = useState('')
  // 二维码展示后短轮询支付结果（只查状态，不发邮件）
  const [cnPolling, setCnPolling] = useState(false)
  const [cnPollAttempts, setCnPollAttempts] = useState(0)
  const [cnPollExhausted, setCnPollExhausted] = useState(false)

  // 支付返回后的找回激活码提示
  const [paidBannerEmail, setPaidBannerEmail] = useState('')
  const [paidReturnNoEmail, setPaidReturnNoEmail] = useState(false)

  /** 凭邮箱查激活码；pending 时自动重试（支付回调写入有延迟） */
  const lookupCode = useCallback(async (email: string, retriesLeft = 5) => {
    const addr = email.trim()
    if (!addr.includes('@') || lookupInFlight.current) return
    lookupInFlight.current = true
    setResending(true)
    setResendResult(null)
    setFoundCode('')
    try {
      const res = await fetch('/api/resend-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addr }),
      })
      const data = await res.json()
      if (data.code) {
        setFoundCode(data.code)
        setResendResult('success')
        setPendingRetry(0)
      } else if (data.pending) {
        setResendResult('pending')
        setPendingRetry(Math.min(6 - retriesLeft + 1, 5))
        if (retriesLeft > 0) {
          lookupInFlight.current = false
          setTimeout(() => { lookupCode(addr, retriesLeft - 1) }, 3000)
          return
        }
        setPendingRetry(0)
        setResendResult('notfound')
      } else {
        setResendResult('notfound')
        setPendingRetry(0)
      }
    } catch {
      setResendResult('error')
      setPendingRetry(0)
    }
    lookupInFlight.current = false
    setResending(false)
  }, [])

  useEffect(() => {
    checkProStatus()
    // 漏斗：Pro 页曝光（每次挂载记一次）
    trackPro('view')

    let pending = ''
    let pendingAt = 0
    let last = ''
    try {
      pending = localStorage.getItem(PENDING_KEY) || ''
      pendingAt = Number(localStorage.getItem(PENDING_AT_KEY) || 0)
      last = localStorage.getItem(LAST_EMAIL_KEY) || ''
    } catch {}

    const prefill = pending || last
    if (prefill) {
      setForgotEmail((v) => v || prefill)
      setBuyEmail((v) => v || prefill)
      setCnEmail((v) => v || prefill)
    }

    // 只提示最近 24h 内创建过订单的邮箱，避免长期打扰
    const pendingFresh = !!pending && (!pendingAt || Date.now() - pendingAt < PENDING_TTL_MS)
    if (pendingFresh) setPaidBannerEmail(pending)

    // 国内支付返回 /pro?paid=1：自动查码（最多重试 6 次）
    const params = new URLSearchParams(window.location.search)
    if (params.get('paid') === '1') {
      if (pendingFresh) {
        setTimeout(() => { lookupCode(pending, 6) }, 800)
      } else {
        // 换了设备 / 清了浏览器存储：提示手动输入付款邮箱
        setPaidReturnNoEmail(true)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 二维码展示后短轮询支付结果：查不到就继续等，查到后置顶显示激活码。
  // 4 秒一次、最多 3 分钟（15 次/分钟，低于状态接口 20 次/分钟限流）。
  useEffect(() => {
    if (!cnQrcode || !cnOrderEmail || foundCode || isPro) return

    let cancelled = false
    let attempts = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    setCnPolling(true)
    setCnPollExhausted(false)
    setCnPollAttempts(0)

    const tick = async () => {
      if (cancelled) return
      attempts += 1
      setCnPollAttempts(attempts)
      try {
        const res = await fetch('/api/check-license-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cnOrderEmail }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.code) {
          setFoundCode(data.code)
          setResendResult('success')
          setPaidBannerEmail(cnOrderEmail)
          setCnPolling(false)
          return
        }
      } catch {}

      if (cancelled) return
      if (attempts >= 45) {
        setCnPolling(false)
        setCnPollExhausted(true)
        return
      }
      timer = setTimeout(tick, 4000)
    }

    timer = setTimeout(tick, 4000)
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      setCnPolling(false)
    }
  }, [cnQrcode, cnOrderEmail, foundCode, isPro])

  const rememberEmail = (email: string) => {
    try { localStorage.setItem(LAST_EMAIL_KEY, email) } catch {}
  }

  const markPending = (email: string) => {
    try {
      localStorage.setItem(PENDING_KEY, email)
      localStorage.setItem(PENDING_AT_KEY, String(Date.now()))
    } catch {}
    setPaidBannerEmail(email)
  }

  const localizePayError = (message: string): string => {
    if (!isZh) return message
    if (/too many attempts/i.test(message)) return '操作太频繁，请稍后再试'
    if (/invalid email/i.test(message)) return '邮箱格式不正确'
    if (/not configured|未配置/i.test(message)) return '支付通道暂不可用，请稍后重试或邮件联系客服'
    return message
  }

  const handleBuy = async () => {
    trackPro('buy', 'pro_buy')
    const email = buyEmail.trim()
    setBuyEmailTouched(true)
    if (!isValidEmail(email)) {
      setBuyError(isZh ? '请输入完整邮箱，例如 you@example.com' : 'Please enter a complete email, e.g. you@example.com')
      document.getElementById('buy-email')?.focus()
      return
    }
    rememberEmail(email)
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
        trackPro('pay', 'creem')
        markPending(email)
        window.location.href = data.checkoutUrl
      } else {
        trackPro('fail', 'creem')
        setBuyError(localizePayError(data.error || 'Server error'))
        setBuyLoading(false)
      }
    } catch {
      trackPro('fail', 'creem')
      setBuyError(isZh ? '网络错误，请重试' : 'Network error, please retry')
      setBuyLoading(false)
    }
  }

  const handleCnPay = async () => {
    trackPro('buy', 'pro_cn_buy')
    const email = cnEmail.trim()
    setCnEmailTouched(true)
    if (!isValidEmail(email)) {
      setCnError(isZh ? '请输入完整邮箱，例如 you@example.com' : 'Please enter a complete email, e.g. you@example.com')
      document.getElementById('buy-email')?.focus()
      return
    }
    rememberEmail(email)
    setCnLoading(true)
    setCnError('')
    setCnQrcode('')
    setCnPollExhausted(false)
    try {
      const res = await fetch('/api/cn-create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        trackPro('checkout', 'hupijiao')
        markPending(email)
        setCnOrderEmail(email)
        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        if (isMobile && data.url) {
          trackPro('pay', 'hupijiao')
          window.location.href = data.url
        } else if (data.qrcode) {
          setCnQrcode(data.qrcode)
          trackPro('pay', 'hupijiao')
        } else {
          setCnError(isZh ? '支付链接生成失败，请重试' : 'Failed to create payment, please retry')
        }
      } else {
        trackPro('fail', 'hupijiao')
        setCnError(localizePayError(data.error || 'Server error'))
      }
    } catch {
      trackPro('fail', 'hupijiao')
      setCnError(isZh ? '网络错误，请重试' : 'Network error, please retry')
    }
    setCnLoading(false)
  }

  const activateWithCode = async (code: string) => {
    const normalized = code.toUpperCase().trim()
    if (!normalized) return
    setActivating(true)
    setActivateResult(null)
    try {
      const res = await fetch('/api/verify-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized, fingerprint: getDeviceFingerprint() }),
      })
      const data = await res.json()
      if (data.valid) {
        localStorage.setItem('pro_license', normalized)
        try {
          localStorage.removeItem(PENDING_KEY)
          localStorage.removeItem(PENDING_AT_KEY)
        } catch {}
        setPaidBannerEmail('')
        await checkProStatus()
        trackPro('activated')
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

  const handleActivate = async () => {
    await activateWithCode(activateCode)
  }

  const handleLookup = async () => {
    if (!forgotEmail.trim()) return
    await lookupCode(forgotEmail, 5)
  }

  const handlePaidCheck = () => {
    const email = paidBannerEmail || forgotEmail
    if (!email) {
      document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setForgotEmail(email)
    document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    lookupCode(email, 6)
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(foundCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 3000)
    } catch {}
  }

  const features: FeatureRow[] = [
    { feature: t('pro.feature.batch'), free: isCn ? (isZh ? '15 张/次' : '15/batch') : t('pro.free.batch'), pro: t('pro.pro.batch'), proDesc: isZh ? '海量处理，一次搞定' : 'Massive batch in one go' },
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

  const faqs: [string, string][] = isZh
    ? [
        ['这是订阅吗？', `不是。一次付费 ${price}，永久有效，不会自动续费。`],
        ['激活码怎么拿到？', `付款成功后系统会自动把激活码发到你填写的邮箱，通常几秒内到达。收到后在本页「激活 Pro」输入即可；没收到也可以在下方凭邮箱查询并一键激活。`],
        ['可以几台设备用？', '同一个激活码最多 5 台设备，手机、电脑、平板都算，重装系统后重新激活即可。'],
        ['图片会上传到服务器吗？', '不会。压缩、转格式、AI 抠图/放大、加水印全部在你的浏览器本地完成，文件不会离开你的设备。'],
        ['Pro 比免费版多了什么？', '本地 AI 抠图与 AI 放大、AVIF 输出（比 WebP 再小约 30%）、图片/文字水印、场景预设、自定义预设、500 张/次批量、单张 50MB 和邮件支持。'],
        ['免费版够用吗？', `每月可压缩 ${isCn ? 100 : 400} 张、每次 ${isCn ? 15 : 20} 张、单张 10MB。如果经常批量处理或需要 AVIF/水印，Pro 更合适。`],
        ['可以退款吗？', '购买后 7 天内且激活码未在任何设备激活使用，可申请全额退款；已激活原则上不支持退款。退款请邮件联系客服，注明购买邮箱和订单号。'],
        ['支付遇到问题怎么办？', `发邮件到 ${supportEmail}，注明购买邮箱和订单号，我们会在 24 小时内回复（工作日通常 2–4 小时）。`],
      ]
    : [
        ['Is this a subscription?', `No. Pay once (${price}) and own it forever. No auto-renewal.`],
        ['How do I get my activation code?', 'It is emailed automatically after payment, usually within seconds. Paste it into “Activate Pro” below. If it does not arrive, look it up with your email below and activate in one click.'],
        ['How many devices?', 'Up to 5 devices per code — phone, computer and tablet all count. Re-activate after reinstalling your system.'],
        ['Are my images uploaded?', 'No. Compression, conversion, AI background removal/upscaling and watermarking all run locally in your browser. Files never leave your device.'],
        ['What does Pro add?', 'On-device AI background removal and upscaling, AVIF output (~30% smaller than WebP), text/image watermarks, scene presets, custom presets, 500 images per batch, 50MB per file and email support.'],
        ['Is the free plan enough?', `You get ${isCn ? 100 : 400} images per month, ${isCn ? 15 : 20} per batch and 10MB per file. Pro is for frequent batch work or AVIF/watermark needs.`],
        ['Can I get a refund?', 'Full refund within 7 days of purchase if the license code has not been activated on any device. Activated codes are generally non-refundable. Email support with your purchase email and order ID.'],
        ['What if I have a payment problem?', `Email ${supportEmail} with your purchase email and order ID. We reply within 24 hours (usually 2–4 hours on weekdays).`],
      ]

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
          {isZh
            ? '解锁本地 AI 抠图/放大、AVIF 超小体积、水印与 500 张批量处理。'
            : 'Unlock on-device AI background removal, upscaling, AVIF output, watermarks and 500-image batches.'}
        </p>
        {!isPro && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs">
              {(isZh
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
                trackPro('intent', 'hero_cta')
                document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Crown className="w-4 h-4" />
              {isZh ? `立即升级 · ${price}` : `Upgrade now · ${price}`}
            </button>
          </>
        )}
      </section>

      {/* 购买区 — 放在对比表之前，首屏 CTA 一步到位 */}
      {!isPro && (
        <section id="buy" className="max-w-xl mx-auto scroll-mt-24 space-y-3">
          {/* 支付返回后的找回激活码提示 */}
          {paidBannerEmail && !foundCode && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-800">
                    {isZh ? '已经完成支付？' : 'Already paid?'}
                  </p>
                  <p className="text-green-700 mt-0.5 leading-relaxed">
                    {isZh
                      ? `激活码会自动发送到 ${maskEmail(paidBannerEmail)}，通常几秒内到达。没收到可以直接在这里查。`
                      : `Your code is emailed to ${maskEmail(paidBannerEmail)}, usually within seconds. If it has not arrived, look it up here.`}
                  </p>
                  <button
                    onClick={handlePaidCheck}
                    disabled={resending}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium text-xs transition-colors"
                  >
                    {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {isZh ? '查询并激活' : 'Find and activate'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 从支付页返回但本地没有待处理邮箱：提示手动查询 */}
          {paidReturnNoEmail && !paidBannerEmail && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-blue-800">
                {isZh ? '已从支付页返回' : 'Back from payment'}
              </p>
              <p className="text-blue-700 mt-0.5 leading-relaxed">
                {isZh
                  ? '请输入付款时填写的邮箱，再点「查询激活码」。'
                  : 'Enter the email you paid with, then tap “Find code”.'}
              </p>
              <button
                onClick={() => {
                  const email = cnEmail.trim() || buyEmail.trim()
                  if (!isValidEmail(email)) {
                    document.getElementById('buy-email')?.focus()
                    return
                  }
                  setForgotEmail(email)
                  lookupCode(email, 6)
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {isZh ? '查询激活码' : 'Find my code'}
              </button>
            </div>
          )}

          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50/70 to-white p-5 sm:p-6 shadow-sm">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-neutral-900">{price}</span>
                <span className="text-sm text-neutral-600">{isZh ? '一次买断' : 'one-time'}</span>
              </div>
              <p className="text-neutral-700 text-sm mt-1">
                {isZh ? '永久有效 · 一个激活码 5 台设备通用 · 无需订阅' : 'Lifetime access · 5 devices per code · no subscription'}
              </p>
            </div>

            {/* 三个核心价值 */}
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              {(isZh
                ? [
                    ['✂️', 'AI 抠图 / 放大'],
                    ['📦', 'AVIF 再省 30%'],
                    ['⚡', '500 张批量'],
                  ]
                : [
                    ['✂️', 'AI remove BG'],
                    ['📦', 'AVIF −30%'],
                    ['⚡', '500 per batch'],
                  ]
              ).map(([icon, label]) => (
                <div key={label} className="rounded-lg bg-white/80 border border-blue-100 px-2 py-2">
                  <div className="text-base leading-none">{icon}</div>
                  <div className="text-[11px] font-medium text-neutral-700 mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* 支付轮询 / 手动查询找到激活码后，直接显示在购买区顶部 */}
            {foundCode && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-sm font-semibold text-green-800">
                  {isZh ? '已找到你的激活码' : 'Your activation code'}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
                  <code className="px-3 py-1.5 bg-white rounded-lg font-bold tracking-widest text-neutral-900 border border-gray-200 select-all text-sm">
                    {foundCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-neutral-800 border border-gray-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    {codeCopied ? (isZh ? '已复制' : 'Copied!') : (isZh ? '复制' : 'Copy')}
                  </button>
                </div>
                {isPro ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-green-700 font-medium text-sm">
                    <Check className="w-4 h-4" /> {isZh ? '已激活 Pro' : 'Pro activated'}
                  </p>
                ) : (
                  <button
                    onClick={async () => {
                      setActivatingFound(true)
                      await activateWithCode(foundCode)
                      setActivatingFound(false)
                    }}
                    disabled={activating || activatingFound}
                    className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-sm transition-colors"
                  >
                    {activatingFound ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {isZh ? '一键激活' : 'Activate now'}
                  </button>
                )}
              </div>
            )}

            {isCn ? (
              <div className="mt-4 space-y-2.5 text-left">
                <label htmlFor="buy-email" className="block text-xs font-medium text-neutral-700">
                  {isZh ? '接收激活码的邮箱' : 'Email for your activation code'}
                </label>
                <input
                  id="buy-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={cnEmail}
                  onChange={(e) => { setCnEmail(e.target.value); setCnError('') }}
                  onBlur={() => { rememberEmail(cnEmail.trim()); setCnEmailTouched(true) }}
                  placeholder={isZh ? 'you@example.com' : 'you@example.com'}
                  aria-invalid={cnEmailTouched && !!cnEmail.trim() && !isValidEmail(cnEmail)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
                />
                {isValidEmail(cnEmail) ? (
                  <p className="text-[11px] text-green-600 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    {isZh ? '格式正确 · 激活码发到这个邮箱，不发营销邮件' : 'Valid · code goes here, no marketing emails'}
                  </p>
                ) : cnEmailTouched && cnEmail.trim() ? (
                  <p className="text-[11px] text-amber-600 text-center">
                    {isZh ? '邮箱格式不完整，例如 you@example.com' : 'Incomplete email, e.g. you@example.com'}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 text-center">
                    {isZh ? '仅用于接收激活码；没收到请查垃圾箱。' : 'Only for your activation code; check spam if it does not arrive.'}
                  </p>
                )}
                {cnError && <p className="text-red-500 text-sm text-center">{cnError}</p>}

                {foundCode ? (
                  <div className="text-center py-2 space-y-2">
                    <p className="text-sm font-medium text-green-700">
                      {isZh ? '激活码已在上方显示，无需重复支付。' : 'Your code is shown above — no need to pay again.'}
                    </p>
                    <button
                      onClick={() => {
                        setFoundCode('')
                        setCnQrcode('')
                        setCnOrderEmail('')
                        setCnPollExhausted(false)
                        setCnPollAttempts(0)
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {isZh ? '再买一个激活码' : 'Buy another code'}
                    </button>
                  </div>
                ) : cnQrcode ? (
                  <div className="text-center space-y-2 py-2">
                    <p className="text-sm font-medium text-neutral-800">
                      {isZh ? `用微信 / 支付宝扫码支付 ${price}` : `Scan with WeChat / Alipay to pay ${price}`}
                    </p>
                    <img src={cnQrcode} alt="支付二维码" className="w-48 h-48 mx-auto rounded-lg border border-gray-200" />
                    {cnOrderEmail && (
                      <p className="text-xs text-neutral-600">
                        {isZh ? `激活码将发送到 ${maskEmail(cnOrderEmail)}` : `Code goes to ${maskEmail(cnOrderEmail)}`}
                      </p>
                    )}
                    <p className="text-xs text-neutral-600">
                      {isZh
                        ? '支付完成后留在本页，系统会自动检测并显示激活码；也可以查看邮箱（没收到请查垃圾箱）。'
                        : 'Stay on this page — the code is detected automatically. Also emailed (check spam if needed).'}
                    </p>
                    {cnPolling && !foundCode && (
                      <p className="text-xs text-blue-600 inline-flex items-center justify-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {isZh ? `正在等待支付结果…（已查询 ${cnPollAttempts} 次）` : `Waiting for payment… (${cnPollAttempts} checks)`}
                      </p>
                    )}
                    {cnPollExhausted && !foundCode && (
                      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 leading-relaxed">
                        {isZh ? (
                          <>
                            超过 3 分钟仍未检测到支付。若已付款，请
                            <button
                              onClick={() => {
                                const email = cnOrderEmail || cnEmail.trim()
                                if (!isValidEmail(email)) return
                                setForgotEmail(email)
                                lookupCode(email, 6)
                              }}
                              className="mx-1 font-medium underline"
                            >
                              查询激活码
                            </button>
                            ；仍未解决请邮件 {supportEmail}。
                          </>
                        ) : (
                          <>
                            No payment detected after 3 minutes. If you have paid,
                            <button
                              onClick={() => {
                                const email = cnOrderEmail || cnEmail.trim()
                                if (!isValidEmail(email)) return
                                setForgotEmail(email)
                                lookupCode(email, 6)
                              }}
                              className="mx-1 font-medium underline"
                            >
                              look up your code
                            </button>
                            or email {supportEmail}.
                          </>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCnQrcode('')
                        setCnOrderEmail('')
                        setCnPollExhausted(false)
                        setCnPollAttempts(0)
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {isZh ? '重新选择' : 'Start over'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCnPay}
                    disabled={cnLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors text-base flex items-center justify-center gap-2 shadow-sm"
                  >
                    {cnLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isZh ? `去支付 ${price}（微信 / 支付宝）` : `Pay ${price} via WeChat / Alipay`)}
                  </button>
                )}

                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {isZh ? '微信支付' : 'WeChat Pay'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {isZh ? '支付宝' : 'Alipay'}
                  </span>
                  <span className="text-neutral-500">{isZh ? '付款后自动发码' : 'Code sent automatically'}</span>
                </div>

                <p className="text-xs text-neutral-500 text-center leading-relaxed">
                  {isZh
                    ? '通过虎皮椒聚合支付，支持微信/支付宝；支付信息由支付平台处理，我们不存储。'
                    : 'Payments are processed by HupiJiao (WeChat/Alipay). We never store your payment details.'}
                </p>
              </div>
            ) : foundCode ? (
              <div className="mt-4 text-center py-2 space-y-2">
                <p className="text-sm font-medium text-green-700">
                  {isZh ? '激活码已在上方显示，无需重复支付。' : 'Your code is shown above — no need to pay again.'}
                </p>
                <button
                  onClick={() => {
                    setFoundCode('')
                    setPaidBannerEmail('')
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {isZh ? '再买一个激活码' : 'Buy another code'}
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                <label htmlFor="buy-email" className="block text-xs font-medium text-neutral-700 text-left">
                  {isZh ? '接收激活码的邮箱' : 'Email for your activation code'}
                </label>
                <input
                  id="buy-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={buyEmail}
                  onChange={(e) => { setBuyEmail(e.target.value); setBuyError('') }}
                  onBlur={() => { rememberEmail(buyEmail.trim()); setBuyEmailTouched(true) }}
                  placeholder="you@example.com"
                  aria-invalid={buyEmailTouched && !!buyEmail.trim() && !isValidEmail(buyEmail)}
                  className="w-full px-4 py-2.5 text-center rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
                />
                {isValidEmail(buyEmail) ? (
                  <p className="text-[11px] text-green-600 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    {isZh ? '格式正确 · 激活码发到这个邮箱，不发营销邮件' : 'Valid · code goes here, no marketing emails'}
                  </p>
                ) : buyEmailTouched && buyEmail.trim() ? (
                  <p className="text-[11px] text-amber-600 text-center">
                    {isZh ? '邮箱格式不完整，例如 you@example.com' : 'Incomplete email, e.g. you@example.com'}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 text-center">
                    {isZh ? '仅用于接收激活码；没收到请查垃圾箱。' : 'Only for your activation code; check spam if it does not arrive.'}
                  </p>
                )}
                {buyError && <p className="text-red-500 text-sm text-center">{buyError}</p>}
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
                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-neutral-700">
                    <ShieldCheck className="w-3 h-3 text-green-600" /> Visa
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-neutral-700">
                    <ShieldCheck className="w-3 h-3 text-green-600" /> Mastercard
                  </span>
                  <span className="text-neutral-500">{isZh ? '付款后自动发码' : 'Code sent automatically'}</span>
                </div>
                <p className="text-neutral-500 text-xs text-center leading-relaxed">
                  {isZh
                    ? '通过 Creem 安全支付，我们不存储你的支付信息；没收到激活码请查垃圾箱。'
                    : 'Secure checkout via Creem. We never store payment details; check spam if the code does not arrive.'}
                </p>
              </div>
            )}

            {/* 信任与售后 */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-neutral-600">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-green-600" />
                {isZh ? '7 天未激活可申请全额退款' : '7-day refund if unused'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3 h-3 text-blue-600" />
                <a href={`mailto:${supportEmail}`} className="hover:text-blue-600 hover:underline">
                  {isZh ? '支付遇到问题？联系客服' : 'Payment issue? Contact support'}
                </a>
              </span>
            </div>

            {/* 已有码 / 没收到码 的快捷入口 */}
            <div className="mt-3 pt-3 border-t border-blue-100 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <a href="#activate" className="text-blue-600 hover:underline">
                {isZh ? '已有激活码？直接激活 ↓' : 'Have a code? Activate ↓'}
              </a>
              <a href="#lookup" className="text-blue-600 hover:underline">
                {isZh ? '付款后没收到？查询激活码 ↓' : 'Code not received? Look it up ↓'}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Feature Comparison Table */}
      {!isPro && (
        <section className="max-w-2xl mx-auto">
          <h2 className="font-bold text-neutral-900 text-center mb-5">
            {isZh ? '功能对比' : 'Feature Comparison'}
          </h2>

          {/* 表头 */}
          <div className="grid grid-cols-[1fr_100px_100px] gap-px bg-gray-200 rounded-xl overflow-hidden text-sm">
            <div className="bg-white p-3 font-semibold text-neutral-800">
              {isZh ? '功能' : 'Feature'}
            </div>
            <div className="bg-white p-3 font-semibold text-center text-neutral-700">
              {t('pro.freePlan')}
            </div>
            <div className="bg-blue-50 p-3 font-semibold text-center text-blue-700">
              <span className="flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Pro
              </span>
            </div>

            {features.map((row, i) => {
              const bg = row.highlight
                ? 'bg-blue-50'
                : i % 2 === 0
                  ? 'bg-gray-50'
                  : 'bg-white'
              return (
                <div key={i} className="contents text-xs">
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
            })}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                trackPro('intent', 'table_cta')
                document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Crown className="w-4 h-4" />
              {isZh ? `升级 Pro · ${price}` : `Upgrade to Pro · ${price}`}
            </button>
          </div>
        </section>
      )}

      {/* FAQ — 消除购买前的疑问 */}
      {!isPro && (
        <section className="max-w-2xl mx-auto">
          <h2 className="font-bold text-neutral-900 text-center mb-4">
            {isZh ? '购买前常见问题' : 'Before You Buy'}
          </h2>
          <div className="space-y-2">
            {faqs.map(([q, a]) => (
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
                  {isZh ? '赚回你的 Pro 费用' : 'Earn back your Pro cost'}
                </h3>
                <p className="text-green-700 text-xs mt-1 leading-relaxed">
                  {isZh
                    ? '加入联盟分销计划，推荐朋友购买 Pro，每单赚 $12.50（50%佣金）。只需 2 单就回本，上不封顶。'
                    : 'Join our affiliate program. Refer users to Pro and earn $12.50 per sale (50%). Just 2 referrals and Pro pays for itself.'}
                </p>
                <span className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-green-600 group-hover:text-green-700 transition-colors">
                  {isZh ? '了解详情 →' : 'Learn more →'}
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
      <section id="activate" className="max-w-md mx-auto pt-8 scroll-mt-24">
        <h2 className="font-semibold text-neutral-900 mb-4 text-center">
          {isPro ? (isZh ? '管理激活码' : 'Manage License') : t('pro.activate.title')}
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
        {activateResult === 'error' && (
          <p className="mt-2 text-red-500 text-sm">
            {isZh ? '网络错误，请重试' : 'Network error, please retry'}
          </p>
        )}

        {/* Forgot code */}
        <div id="lookup" className="mt-6 pt-4 border-t border-gray-200 scroll-mt-24">
          <p className="text-neutral-700 mb-2 text-sm">
            {isZh ? '忘记激活码？输入购买邮箱直接查' : 'Forgot your code? Look it up with your email'}
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
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isZh ? '查找' : 'Look Up')}
            </button>
          </div>

          {foundCode && (
            <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-700 mb-2 text-sm">
                {isZh ? '🎉 找到你的激活码：' : '🎉 Your activation code:'}
              </p>
              <div className="flex items-center gap-2 justify-center flex-wrap">
                <code className="px-4 py-2 bg-white rounded-lg font-bold tracking-widest text-neutral-900 border border-gray-200 select-all text-sm">
                  {foundCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 bg-white hover:bg-gray-50 text-neutral-800 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  {codeCopied ? (isZh ? '已复制' : 'Copied!') : (isZh ? '复制' : 'Copy')}
                </button>
              </div>
              {isPro ? (
                <p className="mt-3 inline-flex items-center gap-1 text-green-700 font-medium text-sm">
                  <Check className="w-4 h-4" /> {isZh ? '已激活 Pro' : 'Pro activated'}
                </p>
              ) : (
                <button
                  onClick={async () => {
                    setActivatingFound(true)
                    await activateWithCode(foundCode)
                    setActivatingFound(false)
                  }}
                  disabled={activating || activatingFound}
                  className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-sm transition-colors"
                >
                  {activatingFound ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isZh ? '一键激活' : 'Activate now'}
                </button>
              )}
              <p className="text-neutral-600 mt-2 text-xs">
                {isZh ? '也可以复制后回到上方激活框粘贴' : 'Or copy it into the activation box above'}
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
                {isZh
                  ? `付款已收到，正在生成激活码...(${pendingRetry}/5)`
                  : `Payment received, generating your code... (${pendingRetry}/5)`}
              </p>
            </div>
          )}
          {resendResult === 'notfound' && (
            <div className="mt-2 text-amber-700 space-y-1 text-sm">
              <p>
                {isZh ? '该邮箱暂未找到激活码。可能的原因：' : 'No code found. Possible reasons:'}
              </p>
              <ul className="list-disc list-inside text-xs space-y-0.5 text-amber-600">
                <li>{isZh ? '刚付款？激活码生成需要几秒，会自动重试' : 'Just paid? Code generation takes a few seconds'}</li>
                <li>{isZh ? '付款用了不同的邮箱？（PayPal 有自己的邮箱）' : 'Used a different email for payment?'}</li>
                <li>{isZh ? '邮箱有拼写错误？' : 'Typo in the email?'}</li>
              </ul>
              <p className="text-xs text-neutral-600">
                {isZh ? '仍未解决请邮件联系客服，注明订单号。' : 'Still stuck? Email support with your order ID.'}
              </p>
            </div>
          )}
          {resendResult === 'error' && (
            <p className="mt-2 text-red-500 text-sm">
              {isZh ? '查询失败，请稍后重试或邮件联系客服' : 'Lookup failed. Please retry or email support.'}
            </p>
          )}
        </div>
      </section>

      {/* 移动端吸底 CTA — 长页面随时可下单 */}
      {!isPro && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex-1 min-w-0">
            <div className="font-bold text-neutral-900 leading-tight">
              {price}
              <span className="ml-1.5 text-xs font-normal text-neutral-600">
                {isZh ? '一次买断' : 'one-time'}
              </span>
            </div>
            <div className="text-[11px] text-neutral-500">
              {isZh ? '永久有效 · 5 台设备' : 'Lifetime · 5 devices'}
            </div>
          </div>
          <button
            onClick={() => {
              trackPro('intent', 'mobile_sticky')
              document.getElementById('buy')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all"
          >
            {isZh ? '立即升级' : 'Upgrade'}
          </button>
        </div>
      )}
    </div>
  )
}
