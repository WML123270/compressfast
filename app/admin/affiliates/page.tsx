'use client'

import { useState, useEffect } from 'react'

interface AffiliateRecord {
  code: string
  name: string
  email: string
  paypalEmail: string
  created_at: string
  active: boolean
  totalClicks: number
  totalConversions: number
  totalEarnings: number
  paidOut: number
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [conversions, setConversions] = useState<any[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/affiliates', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAffiliates(data.affiliates || [])
    } catch (e: any) {
      setError(e.message || '加载失败')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const doAction = async (code: string, action: string, extra?: any) => {
    setActionLoading(code)
    try {
      await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code, ...extra }),
        credentials: 'include',
      })
      await load()
    } catch {}
    setActionLoading(null)
  }

  const loadConversions = async (code: string) => {
    if (expanded === code) { setExpanded(null); return }
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'conversions', code }),
        credentials: 'include',
      })
      const data = await res.json()
      setConversions(data.conversions || [])
      setExpanded(code)
    } catch {}
  }

  if (loading) {
    return <div className="flex items-center gap-3 py-10">
      <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
      <span className="text-neutral-600 text-sm">加载中...</span>
    </div>
  }

  if (error) {
    return <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
      <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">重试</button>
    </div>
  }

  const totalEarnings = affiliates.reduce((s, a) => s + a.totalEarnings, 0) / 100
  const totalPending = affiliates.reduce((s, a) => s + (a.totalEarnings - a.paidOut), 0) / 100
  const totalClicks = affiliates.reduce((s, a) => s + a.totalClicks, 0)
  const totalConversions = affiliates.reduce((s, a) => s + a.totalConversions, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">联盟分销管理</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50">🔄 刷新</button>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-neutral-500 mb-1">分销商</div>
          <div className="text-2xl font-bold text-slate-800">{affiliates.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-neutral-500 mb-1">总点击</div>
          <div className="text-2xl font-bold text-slate-800">{totalClicks.toLocaleString()}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-neutral-500 mb-1">总转化</div>
          <div className="text-2xl font-bold text-green-600">{totalConversions}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-neutral-500 mb-1">待付佣金</div>
          <div className="text-2xl font-bold text-amber-600">${totalPending.toFixed(2)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-neutral-500 border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 font-medium">推荐码</th>
              <th className="px-4 py-3 font-medium">姓名</th>
              <th className="px-4 py-3 font-medium">邮箱 / PayPal</th>
              <th className="px-4 py-3 font-medium text-right">点击</th>
              <th className="px-4 py-3 font-medium text-right">转化</th>
              <th className="px-4 py-3 font-medium text-right">佣金</th>
              <th className="px-4 py-3 font-medium text-right">已付</th>
              <th className="px-4 py-3 font-medium">状态</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => (
              <>
                <tr key={a.code} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{a.code}</td>
                  <td className="px-4 py-3 text-slate-700">{a.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <div>{a.email}</div>
                    {a.paypalEmail && a.paypalEmail !== a.email && (
                      <div className="text-amber-600">PayPal: {a.paypalEmail}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{a.totalClicks.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold text-green-700">{a.totalConversions}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">${(a.totalEarnings / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">${(a.paidOut / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => doAction(a.code, 'toggle-active')}
                        disabled={actionLoading === a.code}
                        className="px-2.5 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50"
                      >
                        {a.active ? '禁用' : '启用'}
                      </button>
                      <button
                        onClick={() => loadConversions(a.code)}
                        className="px-2.5 py-1 text-xs rounded border border-gray-300 hover:bg-gray-100"
                      >
                        详情
                      </button>
                      {a.totalEarnings > a.paidOut && (
                        <button
                          onClick={() => doAction(a.code, 'mark-paid', { amount: a.totalEarnings - a.paidOut })}
                          disabled={actionLoading === a.code}
                          className="px-2.5 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          标记已付
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Expanded conversions */}
                {expanded === a.code && (
                  <tr key={`${a.code}-conv`}>
                    <td colSpan={9} className="px-4 py-3 bg-gray-50">
                      <h4 className="text-xs font-semibold text-slate-700 mb-2">转化记录</h4>
                      {conversions.length === 0 ? (
                        <p className="text-xs text-slate-500">暂无转化</p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500">
                              <th className="text-left py-1">时间</th>
                              <th className="text-left py-1">订单</th>
                              <th className="text-left py-1">购买者</th>
                              <th className="text-right py-1">金额</th>
                              <th className="text-right py-1">佣金</th>
                            </tr>
                          </thead>
                          <tbody>
                            {conversions.map((c: any, i: number) => (
                              <tr key={i} className="border-t border-gray-200">
                                <td className="py-1.5">{new Date(c.timestamp).toLocaleString('zh-CN')}</td>
                                <td className="py-1.5 font-mono">{c.orderId?.slice(0, 16)}</td>
                                <td className="py-1.5">{c.email}</td>
                                <td className="py-1.5 text-right">{c.amount}</td>
                                <td className="py-1.5 text-right font-semibold text-green-700">${(c.commission / 100).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {affiliates.length === 0 && (
          <div className="p-10 text-center text-slate-500 text-sm">
            暂无分销商。分享 <code className="bg-gray-100 px-1.5 py-0.5 rounded">/affiliates</code> 页面链接即可招募。
          </div>
        )}
      </div>
    </div>
  )
}
