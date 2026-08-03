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

/** 页面加载时发送一次 PV + 推荐点击事件 */
export function PageViewTracker() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const visitorId = getVisitorId()
    const host = window.location.hostname

    // PV tracking
    fetch('/api/admin/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'pageview', visitorId, host }),
    }).catch(() => {})

    // Affiliate click tracking (once per session)
    const affRef = getCookie('aff_ref')
    if (affRef && !sessionStorage.getItem('aff_click_tracked')) {
      sessionStorage.setItem('aff_click_tracked', '1')
      fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: affRef }),
      }).catch(() => {})
    }
  }, [])

  return null
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}
