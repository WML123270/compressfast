'use client'

import { useState, useEffect } from 'react'
import { Eye, Zap, DollarSign, Users, RefreshCw } from 'lucide-react'

interface DataPoint { label: string; value: number }

function BarChartCard({ title, data, color, unit }: { title: string; data: DataPoint[]; color: string; unit: string }) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  // Nice round ceiling
  const ceiling = Math.ceil(maxVal / (maxVal > 10 ? 5 : 1)) * (maxVal > 10 ? 5 : 1)

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((ceiling / 4) * i))

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      <div className="flex gap-0">
        {/* Y axis */}
        <div className="flex flex-col justify-between pr-2 text-[10px] text-slate-400 pb-5" style={{ minWidth: 32 }}>
          {yTicks.reverse().map(v => (
            <span key={v} className="leading-none text-right">{v}</span>
          ))}
          <span className="leading-none text-right">0</span>
        </div>
        {/* Bars */}
        <div className="flex-1 flex items-end gap-1.5" style={{ height: 140 }}>
          {data.map((d, i) => {
            const heightPct = maxVal > 0 ? (d.value / ceiling) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0" style={{ height: '100%' }}>
                <div className="w-full flex-1 flex items-end justify-center">
                  <div
                    className={`w-full max-w-[32px] rounded-t-md ${color} transition-all duration-500 ease-out`}
                    style={{ height: `${Math.max(heightPct, 1)}%` }}
                    title={`${d.label}: ${d.value} ${unit}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 leading-none whitespace-nowrap">{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-50">
        <div className={`w-3 h-3 rounded-sm ${color}`} />
        <span className="text-xs text-slate-500">{unit}</span>
        <span className="text-xs text-slate-400 ml-auto">
          最高 {maxVal} · 合计 {data.reduce((s, d) => s + d.value, 0)}
        </span>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats')
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
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" /> 加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
          <p className="text-red-600 font-semibold mb-2">数据加载失败</p>
          <p className="text-red-500 text-sm whitespace-pre-wrap break-all">{error}</p>
        </div>
        <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">重试</button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-800">数据概览</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Eye className="w-4 h-4" /></div>
          <p className="text-xs text-slate-400">总 PV</p>
          <p className="text-xl font-bold text-slate-800">{stats.totalPV ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2"><Zap className="w-4 h-4" /></div>
          <p className="text-xs text-slate-400">总压缩次数</p>
          <p className="text-xl font-bold text-slate-800">{stats.totalCompressions ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-2"><Users className="w-4 h-4" /></div>
          <p className="text-xs text-slate-400">Pro 购买数</p>
          <p className="text-xl font-bold text-slate-800">{stats.totalPurchases ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2"><DollarSign className="w-4 h-4" /></div>
          <p className="text-xs text-slate-400">总收入</p>
          <p className="text-xl font-bold text-slate-800">${(stats.totalRevenue ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* CSS 柱状图组件 */}
      <BarChartCard
        title="最近 7 天 PV"
        data={(stats.dailyPV ?? []).map((d: any) => ({ label: d.date.slice(5), value: d.value }))}
        color="bg-blue-500"
        unit="PV"
      />
      <BarChartCard
        title="最近 7 天压缩次数"
        data={(stats.dailyCompressions ?? []).map((d: any) => ({ label: d.date.slice(5), value: d.value }))}
        color="bg-amber-500"
        unit="次"
      />

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">最近购买</h3>
        {(stats.recentPurchases ?? []).length === 0 ? (
          <p className="text-sm text-slate-400">暂无购买记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-medium">激活码</th>
                  <th className="pb-2 font-medium">邮箱</th>
                  <th className="pb-2 font-medium">时间</th>
                  <th className="pb-2 font-medium">金额</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentPurchases ?? []).map((p: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-2 font-mono text-xs">{p.code}</td>
                    <td className="py-2 text-slate-600">{p.email}</td>
                    <td className="py-2 text-slate-400 text-xs">{new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="py-2 text-slate-600">{p.orderAmount || '$24.99'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
