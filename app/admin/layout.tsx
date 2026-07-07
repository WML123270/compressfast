'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Key, Shield, LogOut } from 'lucide-react'
import Link from 'next/link'

// ---------- Auth Context ----------
interface AdminContextType {
  authed: boolean
  checking: boolean
  logout: () => void
}
const AdminContext = createContext<AdminContextType>({ authed: false, checking: true, logout: () => {} })
export const useAdmin = () => useContext(AdminContext)

// ---------- Layout ----------
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const [keyInput, setKeyInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  // 检查是否已登录
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (r.ok) setAuthed(true) })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  // 处理登录
  const handleLogin = async () => {
    if (!keyInput.trim()) return
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyInput.trim() }),
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

  const logout = () => {
    document.cookie = 'admin_token=; max-age=0; path=/'
    setAuthed(false)
  }

  // 加载中
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // 未登录 → 显示密钥输入
  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-slate-800">管理后台</h1>
          </div>
          <p className="text-sm text-slate-500">请输入管理密钥</p>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="管理密钥"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          {loginError && <p className="text-xs text-red-500">{loginError}</p>}
          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loggingIn ? '验证中...' : '进入后台'}
          </button>
        </div>
      </div>
    )
  }

  // 已登录 → 管理界面
  return (
    <AdminContext.Provider value={{ authed, checking, logout }}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              极速压图 · 后台
            </h2>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <BarChart3 className="w-4 h-4" />
              数据概览
            </Link>
            <Link
              href="/admin/licenses"
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Key className="w-4 h-4" />
              激活码管理
            </Link>
          </nav>
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 w-full"
            >
              <LogOut className="w-3.5 h-3.5" />
              退出
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </AdminContext.Provider>
  )
}
