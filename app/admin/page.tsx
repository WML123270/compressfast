'use client'

import { useState, useEffect } from 'react'

export default function AdminDashboardPage() {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setHtml('')
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Render as simple HTML table
      const ov = data.overseas || {}
      const cn = data.china || {}
      setHtml(renderStats(data, ov, cn))
    } catch (e: any) {
      setError(e.message || '加载失败')
    }
  }

  useEffect(() => { load() }, [])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-semibold mb-2">加载失败</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">重试</button>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center gap-3 py-10">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-neutral-600 text-sm">加载中...</span>
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

// Pure string rendering — no React components, no state, can't crash
function renderStats(data: any, ov: any, cn: any): string {
  const dailyPV = data.dailyPV || []
  const dailyUV = data.dailyUV || []
  const dailyComp = data.dailyCompressions || []

  let rows = ''
  for (let i = 0; i < dailyPV.length; i++) {
    const pv = dailyPV[i]?.value || 0
    const uv = dailyUV[i]?.value || 0
    const comp = dailyComp[i]?.value || 0
    rows += `<tr>
      <td class="date">${(dailyPV[i]?.date || '').slice(5)}</td>
      <td class="num">${pv}</td>
      <td class="num">${uv}</td>
      <td class="num">${comp}</td>
    </tr>`
  }

  function purchaseRow(p: any, tag: string) {
    const devices = p.devices?.length || 0
    return `<tr>
      <td class="mono">${p.code || ''}</td>
      <td>${p.email || ''}</td>
      <td>${new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
      <td>${p.orderAmount || '$24.99'}</td>
      <td>${devices > 0 ? devices + ' dev' : ''}</td>
      <td class="tag">${tag}</td>
    </tr>`
  }

  let purchaseRows = ''
  const purchases = data.recentPurchases || []
  const testEmails = ['test@test.com', 'test@example.com', 'test2@test.com', 'hacker@test.com', 'hacker2@test.com']
  for (const p of purchases) {
    purchaseRows += purchaseRow(p, testEmails.includes(p.email) ? 'TEST' : 'REAL')
  }

  return `<style>
    .db { font-family: -apple-system, sans-serif; }
    .db h1 { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
    .db h2 { font-size: 14px; font-weight: 600; color: #475569; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .kpi { flex: 1; min-width: 120px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .kpi .val { font-size: 28px; font-weight: 800; color: #1e293b; }
    .kpi .lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
    .split { display: flex; gap: 16px; flex-wrap: wrap; }
    .box { flex: 1; min-width: 280px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .box h3 { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
    .box .s { font-size: 13px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 6px 12px; border-bottom: 1px solid #f1f5f9; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .date { color: #64748b; }
    .mono { font-family: monospace; font-size: 11px; }
    .tag { font-size: 10px; font-weight: 600; }
    .tag:contains('REAL') { color: #16a34a; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #475569; font-size: 13px; cursor: pointer; margin-bottom: 16px; }
    .btn:hover { background: #f8fafc; }
  </style>
  <div class="db">
    <button class="btn" onclick="location.reload()">🔄 刷新</button>
    <h1>📊 数据仪表盘</h1>
    <div class="kpis">
      <div class="kpi"><div class="val">${(data.totalPV || 0).toLocaleString()}</div><div class="lbl">总 PV</div></div>
      <div class="kpi"><div class="val">${(data.totalUV || 0).toLocaleString()}</div><div class="lbl">总 UV</div></div>
      <div class="kpi"><div class="val">${(data.totalCompressions || 0).toLocaleString()}</div><div class="lbl">总压缩</div></div>
      <div class="kpi"><div class="val">${data.totalPurchases || 0}</div><div class="lbl">Pro 购买</div></div>
      <div class="kpi"><div class="val">$${(data.totalRevenue || 0).toFixed(2)}</div><div class="lbl">总收入</div></div>
    </div>
    <div class="split">
      <div class="box">
        <h3>🌍 海外版</h3>
        <div class="s">PV ${(ov.totalPV || 0).toLocaleString()} · UV ${(ov.totalUV || 0).toLocaleString()} · 压缩 ${(ov.totalCompressions || 0).toLocaleString()}</div>
      </div>
      <div class="box">
        <h3>🇨🇳 国内版</h3>
        <div class="s">PV ${(cn.totalPV || 0).toLocaleString()} · UV ${(cn.totalUV || 0).toLocaleString()} · 压缩 ${(cn.totalCompressions || 0).toLocaleString()}</div>
      </div>
    </div>
    <h2>📅 近7天明细</h2>
    <table>
      <tr><th>日期</th><th class="num">PV</th><th class="num">UV</th><th class="num">压缩</th></tr>
      ${rows}
    </table>
    <h2>💳 购买记录</h2>
    <table>
      <tr><th>激活码</th><th>邮箱</th><th>时间</th><th>金额</th><th>设备</th><th>类型</th></tr>
      ${purchaseRows}
    </table>
  </div>`
}
