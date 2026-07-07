'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Check, Loader2, Crown } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/i18n/context'
import { useCompressionStore } from '@/lib/store/compression-store'

export default function ProPage() {
  const { t, locale } = useT()
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
      <Link href={`/${locale}`} className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400">
        <ArrowLeft className="w-4 h-4" /> {t('vs.back')}
      </Link>

      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium mb-3">
          <Crown className="w-3 h-3" /> {t('pro.heading')}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{t('pro.heading')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">{t('pro.subtitle')}</p>
      </section>

      {/* Pricing table — 已激活则隐藏 */}
      {!isPro && (
      <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center">
          <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('pro.freePlan')}</h3>
          <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400 text-left">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.batch')}: {t('pro.free.batch')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('controls.mode.quality')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('trust.formats')}</li>
          </ul>
        </div>

        <div className="border-2 border-brand-500 bg-brand-50/30 dark:bg-brand-900/10 rounded-xl p-5 text-center relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-xs font-medium rounded-full">
            Pro
          </div>
          <h3 className="font-bold text-brand-700 dark:text-brand-300 mb-1">{t('pro.proPlan')}</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{t('pro.price')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{t('pro.priceLabel')}</p>
          <ul className="text-sm space-y-2 text-slate-600 dark:text-slate-400 text-left">
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.batch')}: {t('pro.pro.batch')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.presets')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.ads')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.support')}</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.devices')}: 5</li>
            <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" /> {t('pro.feature.updates')}</li>
          </ul>
          <div className="mt-4 space-y-2">
            <input
              type="email"
              value={buyEmail}
              onChange={(e) => { setBuyEmail(e.target.value); setBuyError('') }}
              placeholder={locale === 'zh' ? '输入邮箱接收激活码' : 'Your email for activation code'}
              className="w-full px-3 py-2 text-sm text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            {buyError && (
              <p className="text-xs text-red-500">{buyError}</p>
            )}
            <button
              onClick={handleBuy}
              disabled={buyLoading}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {buyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                t('pro.buyButton')
              )}
            </button>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 text-left space-y-1">
              <p className="font-medium">👉 {locale === 'zh' ? '付款完成后：' : 'After payment:'}</p>
              <p>{locale === 'zh' ? '1. 完成 Creem 付款' : '1. Complete payment on Creem'}</p>
              <p>{locale === 'zh' ? '2. 回到此页面，在下方「忘记激活码？」输入同一个邮箱' : '2. Come back and enter the same email in "Forgot code?"'}</p>
              <p>{locale === 'zh' ? '3. 点击「查找」获取激活码' : '3. Click "Look Up" to get your code'}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Pro Active Banner */}
      {isPro && (
        <section className="max-w-md mx-auto pt-8 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center">
            <Crown className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h2 className="text-lg font-bold text-green-700 dark:text-green-300">{t('pro.active')}</h2>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">{t('pro.activeDesc')}</p>
          </div>
        </section>
      )}

      {/* Activate */}
      <section className="max-w-md mx-auto pt-8 border-t border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 text-center">
          {isPro ? (locale === 'zh' ? '管理激活码' : 'Manage License') : t('pro.activate.title')}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={activateCode}
            onChange={(e) => setActivateCode(e.target.value)}
            placeholder={t('pro.activate.input')}
            className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
          />
          <button
            onClick={handleActivate}
            disabled={activating || activateCode.length < 8}
            className="px-4 py-2.5 bg-slate-800 dark:bg-slate-600 text-white rounded-lg font-medium text-sm hover:bg-slate-700 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors"
          >
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pro.activate.button')}
          </button>
        </div>
        {activateResult === 'success' && (
          <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t('pro.activate.success')}</p>
        )}
        {activateResult === 'invalid' && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t('pro.activate.invalid')}</p>
        )}
        {activateResult === 'limit' && (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{t('pro.activate.limit')}</p>
        )}

        {/* Forgot code */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {locale === 'zh' ? '忘记激活码？输入购买邮箱直接查' : 'Forgot your code? Look it up with your email'}
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => { setForgotEmail(e.target.value); setFoundCode(''); setResendResult(null) }}
              placeholder={t('pro.forgot.email')}
              className="flex-1 px-4 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
            <button
              onClick={handleLookup}
              disabled={resending || !forgotEmail.includes('@')}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'zh' ? '查找' : 'Look Up')}
            </button>
          </div>

          {foundCode && (
            <div className="mt-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-center">
              <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                {locale === 'zh' ? '🎉 找到你的激活码：' : '🎉 Your activation code:'}
              </p>
              <div className="flex items-center gap-2 justify-center">
                <code className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg text-xl font-bold tracking-widest text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 select-all">
                  {foundCode}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 text-xs font-medium bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                >
                  {codeCopied ? (locale === 'zh' ? '已复制' : 'Copied!') : (locale === 'zh' ? '复制' : 'Copy')}
                </button>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                {locale === 'zh' ? '复制后回到上方激活框粘贴即可' : 'Copy and paste it in the activation box above'}
              </p>
            </div>
          )}

          {!foundCode && resendResult === 'success' && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t('pro.forgot.success')}</p>
          )}
          {resendResult === 'pending' && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
              <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-500" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {locale === 'zh'
                  ? `付款已收到，正在生成激活码...(${pendingRetry}/5)`
                  : `Payment received, generating your code... (${pendingRetry}/5)`}
              </p>
            </div>
          )}
          {resendResult === 'notfound' && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 space-y-1">
              <p>
                {locale === 'zh'
                  ? '该邮箱暂未找到激活码。可能的原因：'
                  : 'No code found. Possible reasons:'}
              </p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
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
