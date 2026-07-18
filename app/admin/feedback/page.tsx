'use client'

import { useState, useEffect } from 'react'

interface Feedback {
  id: string
  category: string
  content: string
  email: string
  ua: string
  time: string
  read: boolean
}

const CAT_MAP: Record<string, string> = { bug: '🐛 Bug', suggestion: '💡 建议', other: '💬 其他' }

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [deleteId, setDeleteId] = useState('')

  const fetchList = async () => {
    setLoading(true)
    setError('')
    try {
      const url = filter ? `/api/feedback?category=${filter}&pageSize=100` : '/api/feedback?pageSize=100'
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.list || [])
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  useEffect(() => { fetchList() }, [filter])

  const handleAction = async (id: string, action: 'read' | 'delete') => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
        credentials: 'include',
      })
      if (res.ok) {
        if (action === 'delete') {
          setItems(prev => prev.filter(f => f.id !== id))
        } else {
          setItems(prev => prev.map(f => f.id === id ? { ...f, read: true } : f))
        }
      }
    } catch {}
  }

  const unreadCount = items.filter(f => !f.read).length

  if (loading) {
    return <div className="flex items-center gap-2 text-sm text-neutral-600"><div className="animate-spin w-4 h-4 border-t-transparent rounded-full" /> 加载中...</div>
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-slate-800">用户反馈</h1>
          {unreadCount > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-medium">{unreadCount} 条未读</span>}
        </div>
        <div className="flex gap-2">
          {['', 'bug', 'suggestion', 'other'].map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1 rounded-lg text-sm ${filter === c ? 'bg-blue-100 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-gray-100'}`}
            >
              {c ? CAT_MAP[c] : '全部'}
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📭</p>
          <p>暂无反馈</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(f => (
            <div key={f.id} className={`bg-white rounded-xl border p-4 transition-colors ${f.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{CAT_MAP[f.category] || f.category}</span>
                    {!f.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-neutral-800 whitespace-pre-wrap break-words">{f.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-500 flex-wrap">
                    {f.email && <span>📧 {f.email}</span>}
                    <span>🕐 {new Date(f.time).toLocaleString('zh-CN')}</span>
                    <span className="max-w-xs truncate hidden sm:inline">🖥 {f.ua?.slice(0, 80)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!f.read && (
                    <button onClick={() => handleAction(f.id, 'read')} className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded">标为已读</button>
                  )}
                  {deleteId === f.id ? (
                    <span className="flex gap-1">
                      <button onClick={() => { handleAction(f.id, 'delete'); setDeleteId('') }} className="px-2 py-1 text-xs bg-red-500 text-white rounded">确认删除</button>
                      <button onClick={() => setDeleteId('')} className="px-2 py-1 text-xs text-neutral-500 rounded">取消</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleteId(f.id)} className="px-2 py-1 text-xs text-neutral-400 hover:text-red-500 rounded">删除</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
