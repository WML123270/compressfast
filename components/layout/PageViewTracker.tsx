'use client'

import { useEffect, useRef } from 'react'

function getVisitorId(): string {
  const key = 'cf_vid'
  let vid = localStorage.getItem(key)
  if (!vid) {
    vid = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(key, vid)
  }
  return vid
}

/** 页面加载时发送一次 PV 事件（含 visitorId 用于 UV 去重） */
export function PageViewTracker() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const visitorId = getVisitorId()
    const host = window.location.hostname

    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'pageview', visitorId, host }),
    }).catch(() => {
      // 静默失败，不影响用户体验
    })
  }, [])

  return null
}
