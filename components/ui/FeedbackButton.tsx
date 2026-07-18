'use client'

import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: 'bug', label: '🐛 Bug', labelZh: '🐛 问题反馈' },
  { value: 'suggestion', label: '💡 Suggestion', labelZh: '💡 功能建议' },
  { value: 'other', label: '💬 Other', labelZh: '💬 其他' },
]

export function FeedbackButton({ locale }: { locale?: string }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('suggestion')
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    setIsAdmin(window.location.pathname.startsWith('/admin'))
  }, [])

  // 管理后台页面不显示
  if (isAdmin) return null

  // Chinese detection — locale prop from server, no SSR/client guessing needed
  const isZh = locale === 'zh'

  const handleSubmit = async () => {
    if (!content.trim()) { setError(isZh ? '请填写反馈内容' : 'Please enter feedback'); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, content: content.trim(), email: email.trim() }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => { setOpen(false); setDone(false); setContent(''); setEmail(''); setCategory('suggestion') }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || (isZh ? '提交失败' : 'Failed to submit'))
      }
    } catch {
      setError(isZh ? '网络错误' : 'Network error')
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Hint tooltip */}
        <div className="bg-[#0f1a2e] border border-white/10 text-white/90 text-xs px-3 py-1.5 rounded-lg shadow-lg animate-bounce backdrop-blur-sm">
          {isZh ? '💬 有建议？反馈给我们' : '💬 Feedback? Let us know'}
            <div className="absolute -bottom-1 right-5 w-2 h-2 bg-[#0f1a2e] border-r border-b border-white/10 rotate-45" />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <line x1="9" y1="10" x2="15" y2="10"/>
              <line x1="12" y1="7" x2="12" y2="13"/>
            </svg>
            <span className="text-sm font-medium hidden group-hover:inline">{isZh ? '反馈' : 'Feedback'}</span>
          </button>
        </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0f1a2e] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <h3 className="text-lg font-semibold text-white mb-4">
              {isZh ? '发送反馈' : 'Send Feedback'}
            </h3>

            {done ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-white/80">{isZh ? '感谢反馈！' : 'Thanks for your feedback!'}</p>
              </div>
            ) : (
              <>
                {/* Category */}
                <div className="flex gap-2 mb-4">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        category === c.value
                          ? 'bg-white/15 text-white border border-white/20'
                          : 'text-white/50 hover:text-white/80 border border-transparent'
                      }`}
                    >
                      {isZh ? c.labelZh : c.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={isZh ? '请描述你的问题或建议...' : 'Describe your issue or suggestion...'}
                  maxLength={2000}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                  autoFocus
                />

                {/* Email (optional) */}
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={isZh ? '邮箱（选填，方便回复你）' : 'Email (optional, for reply)'}
                  maxLength={120}
                  className="w-full mt-3 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />

                {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-medium text-sm hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all"
                >
                  {submitting ? (isZh ? '提交中...' : 'Submitting...') : (isZh ? '提交反馈' : 'Submit Feedback')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
