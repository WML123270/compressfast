'use client'

import { useState, useEffect } from 'react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
      }
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStats(data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) {
    return <div className="flex items-center gap-2 text-sm"><div className="animate-spin w-4 h-4 border-t-transparent rounded-full" /> 加载中...</div>
  }

  if (error) {
    return (
      <div className="max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
          <p className="text-red-600 font-semibold mb-2">数据加载失败</p>
          <p className="text-sm whitespace-pre-wrap break-all">{error}</p>
        </div>
        <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 rounded-lg text-sm hover:bg-blue-700">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="font-bold text-slate-800">数据概览</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '总 PV', value: stats?.totalPV ?? 0, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: '总压缩次数', value: stats?.totalCompressions ?? 0, color: 'bg-amber-50 text-amber-600 border-amber-100' },
          { label: 'Pro 购买数', value: stats?.totalPurchases ?? 0, color: 'bg-blue-50 text-blue-600 border-blue-100' },
          { label: '总收入', value: '$' + (stats?.totalRevenue ?? 0).toFixed(2), color: 'bg-purple-50 text-purple-600 border-purple-100' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-gray-200 p-4`}>
            <p className="text-slate-400">{label}</p>
            <p className="font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-slate-700 mt-4">最近购买</h2>
      {(stats?.recentPurchases ?? []).length === 0 ? (
        <p className="text-slate-400">暂无购买记录</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-700 bg-gray-50 border-slate-200">
                <th className="px-4 py-3 font-medium">激活码</th><th className="px-4 py-3 font-medium">邮箱</th>
                <th className="px-4 py-3 font-medium">时间</th><th className="px-4 py-3 font-medium">金额</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentPurchases ?? []).map((p: any, i: number) => (
                <tr key={i} className="border-slate-50">
                  <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                  <td className="px-4 py-3 text-xs">{p.email}</td>
                  <td className="px-4 py-3 text-xs">{new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
                  <td className="px-4 py-3 text-xs">{p.orderAmount || '$24.99'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
