'use client'

import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, Users, Zap, DollarSign, Globe, Flag, RefreshCw } from 'lucide-react'

interface DailyPoint { date: string; value: number }

interface StatsData {
  totalPV: number
  totalUV: number
  totalCompressions: number
  totalPurchases: number
  totalRevenue: number
  dailyPV: DailyPoint[]
  dailyUV: DailyPoint[]
  dailyCompressions: DailyPoint[]
  recentPurchases: Purchase[]
  overseas: {
    totalPV: number; totalUV: number; totalCompressions: number
    dailyPV: DailyPoint[]; dailyUV: DailyPoint[]; dailyCompressions: DailyPoint[]
  }
  china: {
    totalPV: number; totalUV: number; totalCompressions: number
    dailyPV: DailyPoint[]; dailyUV: DailyPoint[]; dailyCompressions: DailyPoint[]
  }
}

interface Purchase {
  code: string
  email: string
  created_at: string
  active: boolean
  devices: string[]
  orderId?: string
  orderAmount?: string
}

// Tiny inline sparkline chart — pure SVG, no dependencies
function Sparkline({ data, height = 40, color = '#3b82f6' }: { data: DailyPoint[]; height?: number; color?: string }) {
  if (!data || data.length === 0) return <div className="text-neutral-500 text-xs">No data</div>
  const values = data.map(d => d.value)
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const w = data.length * 24
  const points = values.map((v, i) => {
    const x = i * 24 + 12
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={height} className="block">
      {/* Area fill */}
      <polygon
        points={`12,${height} ${points} ${w - 12},${height}`}
        fill={color} fillOpacity={0.1}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function MetricCard({ label, value, icon: Icon, color, subtitle }: {
  label: string; value: string; icon: any; color: string; subtitle?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-neutral-900 tabular-nums">{value}</div>
      {subtitle && <div className="text-xs text-neutral-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function BarRow({ date, pv, uv, comp, maxPV, maxUV, maxComp }: {
  date: string; pv: number; uv: number; comp: number
  maxPV: number; maxUV: number; maxComp: number
}) {
  return (
    <div className="flex items-center gap-1.5 py-1 text-xs">
      <span className="w-12 text-neutral-500 flex-shrink-0 tabular-nums">{date.slice(5)}</span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* PV bar */}
        <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden min-w-[30px]" title={`PV: ${pv}`}>
          <div className="absolute inset-y-0 left-0 bg-blue-200 rounded transition-all" style={{ width: `${maxPV > 0 ? (pv / maxPV) * 100 : 0}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-neutral-700 tabular-nums">{pv || 0}</span>
        </div>
        {/* UV bar */}
        <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden min-w-[30px]" title={`UV: ${uv}`}>
          <div className="absolute inset-y-0 left-0 bg-green-200 rounded transition-all" style={{ width: `${maxUV > 0 ? (uv / maxUV) * 100 : 0}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-neutral-700 tabular-nums">{uv || 0}</span>
        </div>
        {/* Compression bar */}
        <div className="flex-1 h-5 bg-gray-100 rounded relative overflow-hidden min-w-[30px]" title={`Compress: ${comp}`}>
          <div className="absolute inset-y-0 left-0 bg-amber-200 rounded transition-all" style={{ width: `${maxComp > 0 ? (comp / maxComp) * 100 : 0}%` }} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-neutral-700 tabular-nums">{comp || 0}</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    if (refreshing) return
    setRefreshing(true)
    setError('')
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setStats(data)
    } catch (e: any) {
      setError(e.message || '加载失败')
    }
    setLoading(false)
    setRefreshing(false)
  }, [refreshing])

  useEffect(() => { fetchStats() }, [])

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) fetchStats()
    }, 60000)
    return () => clearInterval(interval)
  }, [refreshing, fetchStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="ml-3 text-neutral-600">加载中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4">
          <p className="text-red-600 font-semibold mb-2">数据加载失败</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
        <button onClick={fetchStats} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">重试</button>
      </div>
    )
  }

  if (!stats) return null

  const allDailyPV = stats.dailyPV || []
  const allDailyUV = stats.dailyUV || []
  const allDailyComp = stats.dailyCompressions || []
  const maxPV = Math.max(...allDailyPV.map(d => d.value), 1)
  const maxUV = Math.max(...allDailyUV.map(d => d.value), 1)
  const maxComp = Math.max(...allDailyComp.map(d => d.value), 1)

  // Separate real purchases from test
  const purchases = stats.recentPurchases || []
  const testEmails = ['test@test.com', 'test@example.com', 'test2@test.com', 'hacker@test.com', 'hacker2@test.com']
  const realPurchases = purchases.filter(p => !testEmails.includes(p.email))
  const testPurchases = purchases.filter(p => testEmails.includes(p.email))

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">📊 数据仪表盘</h1>
        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm text-neutral-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="总 PV" value={stats.totalPV.toLocaleString()} icon={TrendingUp} color="text-blue-600" />
        <MetricCard label="总 UV" value={stats.totalUV.toLocaleString()} icon={Users} color="text-green-600" />
        <MetricCard label="总压缩" value={stats.totalCompressions.toLocaleString()} icon={Zap} color="text-amber-600" />
        <MetricCard label="Pro 购买" value={String(stats.totalPurchases)} icon={DollarSign} color="text-purple-600" />
        <MetricCard label="总收入" value={`$${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} color="text-pink-600" />
      </div>

      {/* Overseas vs China */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overseas card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-neutral-900">🌍 海外版 compressfast.site</h2>
          </div>
          <div className="flex gap-5 mb-4">
            <div><span className="text-xs text-neutral-500">PV </span><span className="font-bold text-lg text-blue-600 tabular-nums">{stats.overseas?.totalPV ?? 0}</span></div>
            <div><span className="text-xs text-neutral-500">UV </span><span className="font-bold text-lg text-blue-500 tabular-nums">{stats.overseas?.totalUV ?? 0}</span></div>
            <div><span className="text-xs text-neutral-500">压缩 </span><span className="font-bold text-lg text-blue-600 tabular-nums">{stats.overseas?.totalCompressions ?? 0}</span></div>
          </div>
          <Sparkline data={stats.overseas?.dailyPV || []} color="#3b82f6" />
        </div>

        {/* China card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-red-600" />
            <h2 className="font-semibold text-neutral-900">🇨🇳 国内版 jisuyatu.com</h2>
          </div>
          <div className="flex gap-5 mb-4">
            <div><span className="text-xs text-neutral-500">PV </span><span className="font-bold text-lg text-red-600 tabular-nums">{stats.china?.totalPV ?? 0}</span></div>
            <div><span className="text-xs text-neutral-500">UV </span><span className="font-bold text-lg text-red-500 tabular-nums">{stats.china?.totalUV ?? 0}</span></div>
            <div><span className="text-xs text-neutral-500">压缩 </span><span className="font-bold text-lg text-red-600 tabular-nums">{stats.china?.totalCompressions ?? 0}</span></div>
          </div>
          <Sparkline data={stats.china?.dailyPV || []} color="#ef4444" />
        </div>
      </div>

      {/* Daily breakdown table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-neutral-900 mb-3">📅 每日明细</h2>
        {/* Column headers */}
        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-medium text-neutral-500 uppercase tracking-wider">
          <span className="w-12 flex-shrink-0">日期</span>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="flex-1 text-center min-w-[30px]">PV</span>
            <span className="flex-1 text-center min-w-[30px]">UV</span>
            <span className="flex-1 text-center min-w-[30px]">压缩</span>
          </div>
        </div>
        {allDailyPV.map((d, i) => (
          <BarRow
            key={d.date}
            date={d.date}
            pv={d.value}
            uv={allDailyUV[i]?.value ?? 0}
            comp={allDailyComp[i]?.value ?? 0}
            maxPV={maxPV}
            maxUV={maxUV}
            maxComp={maxComp}
          />
        ))}
        {/* Summary row */}
        <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-gray-100 text-xs font-semibold">
          <span className="w-12 flex-shrink-0 text-neutral-600">合计</span>
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="flex-1 text-center min-w-[30px] text-blue-600 tabular-nums">{allDailyPV.reduce((s, d) => s + d.value, 0)}</span>
            <span className="flex-1 text-center min-w-[30px] text-green-600 tabular-nums">{allDailyUV.reduce((s, d) => s + d.value, 0)}</span>
            <span className="flex-1 text-center min-w-[30px] text-amber-600 tabular-nums">{allDailyComp.reduce((s, d) => s + d.value, 0)}</span>
          </div>
        </div>
      </div>

      {/* Purchases */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-neutral-900 mb-3">💳 购买记录</h2>

        {/* Real purchases */}
        {realPurchases.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">
              ✅ 真实购买 ({realPurchases.length})
            </h3>
            <div className="space-y-2">
              {realPurchases.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg text-sm">
                  <div>
                    <span className="font-mono text-xs text-neutral-700 mr-3">{p.code}</span>
                    <span className="text-neutral-600">{p.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    {p.devices?.length > 0 && <span>📱 {p.devices.length} 设备</span>}
                    {p.orderId && <span className="text-blue-500">Creem</span>}
                    <span>{new Date(p.created_at).toLocaleDateString('zh-CN')}</span>
                    <span className="font-semibold text-neutral-800">{p.orderAmount || '$24.99'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test purchases */}
        {testPurchases.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              🧪 测试购买 ({testPurchases.length})
            </h3>
            <div className="space-y-1">
              {testPurchases.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-50 rounded text-xs text-neutral-500">
                  <div>
                    <span className="font-mono mr-3">{p.code}</span>
                    <span>{p.email}</span>
                  </div>
                  <span>{new Date(p.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {purchases.length === 0 && <p className="text-neutral-500 text-sm">暂无购买记录</p>}
      </div>
    </div>
  )
}
