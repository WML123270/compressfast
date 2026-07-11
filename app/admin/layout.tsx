'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [keyInput, setKeyInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => { if (r.ok) setAuthed(true) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  const handleLogin = async () => {
    if (!keyInput.trim()) return
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput.trim() }),
        credentials: 'include',
      })
      if (res.ok) {
        setAuthed(true)
      } else {
        setLoginError('密钥错误')
      }
    } catch {
      setLoginError('网络错误')
    }
    setLoggingIn(false)
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    setAuthed(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h1 className="font-semibold text-slate-800">管理后台</h1>
          <p className="text-slate-500">请输入管理密钥</p>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="管理密钥"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500"
            autoFocus
          />
          {loginError && <p className="text-red-500">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loggingIn ? '验证中...' : '进入后台'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-48 bg-white border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-slate-100">
          <h2 className="font-semibold text-slate-700">极速压图 · 后台</h2>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            数据概览
          </Link>
          <Link href="/admin/licenses" className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            激活码管理
          </Link>
        </nav>
        <div className="p-3 border-slate-100">
          <button onClick={logout} className="text-slate-400 hover:text-red-500 w-full text-left">
            退出
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
