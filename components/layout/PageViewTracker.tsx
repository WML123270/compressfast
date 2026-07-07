'use client'

import { useEffect, useRef } from 'react'

/** 页面加载时发送一次 PV 事件 */
export function PageViewTracker() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'pageview' }),
    }).catch(() => {
      // 静默失败，不影响用户体验
    })
  }, [])

  return null
}
