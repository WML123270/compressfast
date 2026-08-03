'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, ArrowRight, TrendingUp, Users, DollarSign, Link2, LogIn, UserPlus, Loader2 } from 'lucide-react'
import { useT } from '@/lib/i18n/context'

interface AffiliateData {
  code: string
  name: string
  email: string
  totalClicks: number
  totalConversions: number
  totalEarnings: number   // cents
  paidOut: number
  active: boolean
}

type View = 'login' | 'signup' | 'dashboard'

export default function AffiliatesPage() {
  const { t, locale } = useT()

  // ─── State ────────────────────────────────────
  const [view, setView] = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Login
  const [loginEmail, setLoginEmail] = useState('')

  // Signup
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPaypal, setSignupPaypal] = useState('')

  // Dashboard
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // ─── Check for magic link token ───────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      verifyToken(token)
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      // Restore session from sessionStorage
      const saved = sessionStorage.getItem('aff_data')
      const savedToken = sessionStorage.getItem('aff_token')
      if (saved && savedToken) {
        try {
          const data = JSON.parse(saved)
          setAffiliate(data)
          setSessionToken(savedToken)
          setView('dashboard')
          loadStats(savedToken)
        } catch {}
      }
    }
  }, [])

  // ─── Actions ──────────────────────────────────
  const verifyToken = async (token: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.valid && data.affiliate && data.sessionToken) {
        setAffiliate(data.affiliate)
        setSessionToken(data.sessionToken)
        sessionStorage.setItem('aff_data', JSON.stringify(data.affiliate))
        sessionStorage.setItem('aff_token', data.sessionToken)
        loadStats(data.sessionToken)
        setView('dashboard')
      } else {
        setError(locale === 'zh' ? '链接已过期或无效，请重新登录' : 'Link expired or invalid. Please login again.')
      }
    } catch {
      setError(locale === 'zh' ? '网络错误' : 'Network error')
    }
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!loginEmail.includes('@')) return
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/affiliate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, locale }),
      })
      await res.json()
      setMessage(locale === 'zh'
        ? '📧 登录链接已发送到你的邮箱（10分钟内有效）'
        : '📧 Magic link sent to your email (valid 10 min)')
    } catch {
      setError(locale === 'zh' ? '发送失败，请重试' : 'Failed to send. Please retry.')
    }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!signupName.trim() || !signupEmail.includes('@')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/affiliate/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, paypalEmail: signupPaypal }),
      })
      const data = await res.json()
      if (data.success && data.sessionToken) {
        const affData = { code: data.code, name: signupName, email: signupEmail, totalClicks: 0, totalConversions: 0, totalEarnings: 0, paidOut: 0, active: true }
        setAffiliate(affData)
        setSessionToken(data.sessionToken)
        sessionStorage.setItem('aff_data', JSON.stringify(affData))
        sessionStorage.setItem('aff_token', data.sessionToken)
        setView('dashboard')
        loadStats(data.sessionToken)
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch {
      setError(locale === 'zh' ? '注册失败，请重试' : 'Signup failed. Please retry.')
    }
    setLoading(false)
  }

  const loadStats = async (token: string) => {
    try {
      const res = await fetch(`/api/affiliate/stats?token=${encodeURIComponent(token)}`)
      if (res.status === 401) {
        // Session expired — force logout
        logout()
        return
      }
      const data = await res.json()
      if (!data.error) setStats(data)
    } catch {}
  }

  const logout = () => {
    setAffiliate(null)
    setSessionToken(null)
    setStats(null)
    sessionStorage.removeItem('aff_data')
    sessionStorage.removeItem('aff_token')
    setView('login')
  }

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const refLink = stats?.link || (affiliate ? `${window.location.origin}?ref=${affiliate.code}` : '')

  // ─── Loading ───────────────────────────────────
  if (loading && !affiliate) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
        <p className="text-neutral-600">{locale === 'zh' ? '验证中...' : 'Verifying...'}</p>
      </div>
    )
  }

  // ─── Dashboard ─────────────────────────────────
  if (view === 'dashboard' && affiliate) {
    // Use stats API data when available (live), fall back to session data
    const live = stats?.affiliate
    const totalClicks = live?.totalClicks ?? affiliate.totalClicks
    const totalConversions = live?.totalConversions ?? affiliate.totalConversions
    const totalEarnings = live?.totalEarnings ?? affiliate.totalEarnings
    const paid = live?.paidOut ?? affiliate.paidOut ?? 0
    const earnings = (totalEarnings / 100).toFixed(2)
    const paidOut = (paid / 100).toFixed(2)
    const pending = ((totalEarnings - paid) / 100).toFixed(2)

    return (
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {locale === 'zh' ? '分销看板' : 'Affiliate Dashboard'}
            </h1>
            <p className="text-neutral-600 text-sm mt-1">
              {locale === 'zh' ? `欢迎回来，${affiliate.name}` : `Welcome back, ${affiliate.name}`}
            </p>
          </div>
          <button onClick={logout} className="text-sm text-neutral-500 hover:text-red-500 transition-colors">
            {locale === 'zh' ? '退出' : 'Logout'}
          </button>
        </div>

        {/* Referral Link */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-blue-800 mb-2">
            {locale === 'zh' ? '🔗 你的推荐链接' : '🔗 Your Referral Link'}
          </p>
          <div className="flex gap-2">
            <code className="flex-1 px-4 py-2.5 bg-white rounded-lg text-sm font-mono text-blue-700 border border-blue-200 select-all break-all">
              {refLink}
            </code>
            <button
              onClick={() => copyLink(refLink)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? (locale === 'zh' ? '已复制' : 'Copied!') : (locale === 'zh' ? '复制' : 'Copy')}
            </button>
          </div>
          <p className="text-blue-600 text-xs mt-2">
            {locale === 'zh'
              ? `佣金 50% = $12.50/单 · 30天Cookie追踪`
              : `50% commission = $12.50/sale · 30-day cookie`}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-neutral-900">{totalClicks.toLocaleString()}</div>
            <div className="text-xs text-neutral-600">{locale === 'zh' ? '点击' : 'Clicks'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-neutral-900">{totalConversions}</div>
            <div className="text-xs text-neutral-600">{locale === 'zh' ? '转化' : 'Sales'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-neutral-900">${earnings}</div>
            <div className="text-xs text-neutral-600">{locale === 'zh' ? '总佣金' : 'Earned'}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <DollarSign className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-neutral-900">${pending}</div>
            <div className="text-xs text-neutral-600">{locale === 'zh' ? '待付' : 'Pending'}</div>
          </div>
        </div>

        {/* Conversions Table */}
        {stats?.conversions?.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-neutral-900 text-sm">
                {locale === 'zh' ? '转化记录' : 'Conversion History'}
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-neutral-500 border-b border-gray-100">
                  <th className="px-5 py-2 font-medium">{locale === 'zh' ? '时间' : 'Date'}</th>
                  <th className="px-5 py-2 font-medium">{locale === 'zh' ? '订单' : 'Order'}</th>
                  <th className="px-5 py-2 font-medium text-right">{locale === 'zh' ? '佣金' : 'Commission'}</th>
                </tr>
              </thead>
              <tbody>
                {stats.conversions.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-neutral-700">
                      {new Date(c.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-2.5 text-neutral-700 font-mono text-xs">
                      {c.orderId}…
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold text-green-700">
                      ${(c.commission / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* How to Promote */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-neutral-900 mb-3">
            {locale === 'zh' ? '📢 如何推广' : '📢 How to Promote'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-neutral-800 mb-1">🐦 Twitter / X</p>
              <p className="text-neutral-600 text-xs">
                {locale === 'zh'
                  ? '分享你的使用体验 + 推荐链接。技术/设计/摄影类账号效果最好。'
                  : 'Share your experience + your link. Tech/design/photo accounts work best.'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-neutral-800 mb-1">📝 Blog / Dev.to</p>
              <p className="text-neutral-600 text-xs">
                {locale === 'zh'
                  ? '写一篇图片压缩工具对比评测，自然嵌入推荐链接。'
                  : 'Write a comparison article of image compression tools. Naturally embed your link.'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-neutral-800 mb-1">📱 Social Media</p>
              <p className="text-neutral-600 text-xs">
                {locale === 'zh'
                  ? '小红书/Instagram：分享压缩前后对比图，简介区放链接。'
                  : 'Instagram/Reddit: Share before/after comparisons, link in bio/profile.'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-neutral-800 mb-1">💬 Communities</p>
              <p className="text-neutral-600 text-xs">
                {locale === 'zh'
                  ? '设计/前端社区分享工具推荐，回答图片压缩相关问题。'
                  : 'Recommend in design/frontend communities, answer compression questions.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Login / Signup ──────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-medium mb-3">
          <DollarSign className="w-3 h-3" /> {locale === 'zh' ? '赚取 50% 佣金' : 'Earn 50% Commission'}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
          {locale === 'zh' ? 'CompressFast 联盟计划' : 'CompressFast Affiliate Program'}
        </h1>
        <p className="text-neutral-600 mt-2 max-w-sm mx-auto">
          {locale === 'zh'
            ? '推荐用户购买 Pro，你获得 $12.50 (50%) 佣金。30 天 cookie 追踪。'
            : 'Refer users to Pro and earn $12.50 (50%) per sale. 30-day cookie tracking.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => { setView('login'); setError(''); setMessage('') }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${view === 'login' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-800'}`}
        >
          <LogIn className="w-3.5 h-3.5" />
          {locale === 'zh' ? '登录' : 'Login'}
        </button>
        <button
          onClick={() => { setView('signup'); setError(''); setMessage('') }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${view === 'signup' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-600 hover:text-neutral-800'}`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          {locale === 'zh' ? '注册' : 'Sign Up'}
        </button>
      </div>

      {/* Error / Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-green-700 text-sm">{message}</p>
        </div>
      )}

      {/* Login Form */}
      {view === 'login' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-sm text-neutral-700">
            {locale === 'zh'
              ? '输入注册邮箱，我们会发送一个登录链接。'
              : 'Enter your registered email and we\'ll send a magic login link.'}
          </p>
          <input
            type="email"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder={locale === 'zh' ? 'your@email.com' : 'you@example.com'}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
          />
          <button
            onClick={handleLogin}
            disabled={loading || !loginEmail.includes('@')}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {locale === 'zh' ? '发送登录链接' : 'Send Magic Link'}
          </button>
        </div>
      )}

      {/* Signup Form */}
      {view === 'signup' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {locale === 'zh' ? '姓名' : 'Name'} *
            </label>
            <input
              type="text"
              value={signupName}
              onChange={e => setSignupName(e.target.value)}
              placeholder={locale === 'zh' ? '你的名字或昵称' : 'Your name or nickname'}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              {locale === 'zh' ? '邮箱' : 'Email'} *
            </label>
            <input
              type="email"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              PayPal {locale === 'zh' ? '邮箱（收款用）' : '(for payouts)'}
            </label>
            <input
              type="email"
              value={signupPaypal}
              onChange={e => setSignupPaypal(e.target.value)}
              placeholder="paypal@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-neutral-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder:text-neutral-400"
            />
          </div>
          <button
            onClick={handleSignup}
            disabled={loading || !signupName.trim() || !signupEmail.includes('@')}
            className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {locale === 'zh' ? '注册成为分销商' : 'Join Affiliate Program'}
          </button>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-green-600">50%</div>
          <div className="text-xs text-neutral-600 mt-1">{locale === 'zh' ? '佣金率' : 'Commission'}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-blue-600">30{locale === 'zh' ? '天' : 'd'}</div>
          <div className="text-xs text-neutral-600 mt-1">{locale === 'zh' ? 'Cookie有效期' : 'Cookie Window'}</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">$12.50</div>
          <div className="text-xs text-neutral-600 mt-1">{locale === 'zh' ? '每单佣金' : 'Per Sale'}</div>
        </div>
      </div>
    </div>
  )
}
