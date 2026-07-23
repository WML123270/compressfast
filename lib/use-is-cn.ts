'use client'

import { useState, useEffect } from 'react'
import { isCnDeploy } from '@/lib/utils'

/**
 * 检测当前是否为国内版部署
 * 条件：NEXT_PUBLIC_DEPLOY_TARGET === 'cn' 或通过 IP 访问，且不在 vercel.app
 *
 * 初始值从构建时环境变量读取（SSR 安全），
 * useEffect 补充运行时 IP 检测（开发/过渡期使用）。
 */
export function useIsCn(): boolean {
  // 构建时已通过 NEXT_PUBLIC_DEPLOY_TARGET=cn 内联，SSR 即可正确渲染
  const [isCn, setIsCn] = useState(isCnDeploy())

  useEffect(() => {
    const hostname = window.location.hostname
    const isIp = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)
    const isVercel = hostname.includes('vercel.app')
    const cn = (isCnDeploy() || isIp) && !isVercel
    if (cn !== isCn) setIsCn(cn)
  }, [isCn])

  return isCn
}
