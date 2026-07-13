'use client'

import { useState, useEffect } from 'react'
import type { LicenseRecord } from '@/lib/license'

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const fetchLicenses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/licenses', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setLicenses(data.licenses || [])
      setError('')
    } catch {
      setError('加载失败')
    }
    setLoading(false)
  }

  useEffect(() => { fetchLicenses() }, [])

  const handleAction = async (action: 'revoke' | 'reset-devices', code: string, email: string) => {
    const confirmText = action === 'revoke'
      ? `确定撤销 ${code}？用户将失去 Pro 权限。`
      : `确定重置 ${email} 的设备数？`
    if (!confirm(confirmText)) return

    setActionMsg('')
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, code, email }),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        setActionMsg(`${action === 'revoke' ? '已撤销' : '已重置'} — ${code}`)
        if (action === 'revoke') {
          setLicenses(prev => prev.map(l => l.code === code ? { ...l, active: false } : l))
        } else if (action === 'reset-devices') {
          setLicenses(prev => prev.map(l => l.email === email ? { ...l, devices: [] } : l))
        }
      } else {
        setActionMsg(`操作失败 — ${data.error || '未知错误'}`)
      }
    } catch {
      setActionMsg('网络错误')
    }
    setTimeout(() => setActionMsg(''), 3000)
  }

  const filtered = licenses.filter(l => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.code.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
  })

  if (loading) {
    return <div className="flex items-center gap-2 text-sm"><div className="animate-spin w-4 h-4 border-t-transparent rounded-full" /> 加载中...</div>
  }

  if (error) {
    return <div className="text-center py-12"><p className="text-sm mb-3">{error}</p><button onClick={fetchLicenses} className="text-blue-600 hover:underline">重试</button></div>
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-slate-800">激活码管理</h1>
        <p className="text-slate-400">{licenses.length} 个激活码</p>
      </div>

      <input type="text" placeholder="搜索激活码或邮箱..." value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500" />

      {actionMsg && <div className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg">{actionMsg}</div>}

      {filtered.length === 0 ? (
        <p className="text-slate-400">{search ? '无匹配结果' : '暂无激活码'}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-700 bg-gray-50 border-slate-200">
                  <th className="px-4 py-3 font-medium">激活码</th><th className="px-4 py-3 font-medium">邮箱</th>
                  <th className="px-4 py-3 font-medium">购买时间</th><th className="px-4 py-3 font-medium">金额</th>
                  <th className="px-4 py-3 font-medium">设备数</th><th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={i} className="border-slate-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                    <td className="px-4 py-3 text-xs">{l.email}</td>
                    <td className="px-4 py-3 text-xs">{new Date(l.created_at).toLocaleDateString('zh-CN')}</td>
                    <td className="px-4 py-3 text-xs">{l.orderAmount || '$24.99'}</td>
                    <td className="px-4 py-3 text-xs"><span className={l.devices.length >= 5 ? 'text-red-500' : 'text-slate-500'}>{l.devices?.length || 0} / 5</span></td>
                    <td className="px-4 py-3">
                      {l.active
                        ? <span className="text-blue-600">有效</span>
                        : <span className="text-red-500">已撤销</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {l.active && (
                          <button onClick={() => handleAction('revoke', l.code, l.email)}
                            className="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50">撤销</button>
                        )}
                        <button onClick={() => handleAction('reset-devices', l.code, l.email)}
                          className="text-neutral-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50">重置设备</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
