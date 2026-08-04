'use client'

import { useEffect } from 'react'
import { isCnDeploy } from '@/lib/utils'

/**
 * Baidu Auto-Push — 国内站用户访问时自动推送 URL 给百度抓取
 * Only active on jisuyatu.com (domestic deploy)
 */
export function BaiduAutoPush() {
  useEffect(() => {
    if (!isCnDeploy()) return

    const bp = document.createElement('script')
    const protocol = window.location.protocol.split(':')[0]
    bp.src = protocol === 'https'
      ? 'https://zz.bdstatic.com/linksubmit/push.js'
      : 'http://push.zhanzhang.baidu.com/push.js'
    const s = document.getElementsByTagName('script')[0]
    if (s) s.parentNode?.insertBefore(bp, s)
  }, [])

  return null
}
