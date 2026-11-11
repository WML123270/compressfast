/**
 * POST /api/admin/track
 * 记录网站事件（公开 API，前端调用）
 * Body: { event: 'pageview' | 'compression' | 'ai' | 'pdf', ... }
 */

import { NextRequest, NextResponse } from 'next/server'
import { incrementPageView, incrementCompression, trackUniqueVisitor, recordFileSizes, checkCompressionRateLimit, markVisitorActive, isVisitorActive, incrementAiEvent, recordAiDuration, AI_TOOLS, AI_EVENTS, type AiTool, type AiEventName, incrementPdfEvent, recordPdfOutput, PDF_EVENTS, type PdfEventName } from '@/lib/stats'
import { isLikelyBot } from '@/lib/bot-detection'

function getIP(request: NextRequest): string {
  // Vercel 走 Cloudflare：cf-connecting-ip 才是真实客户端 IP
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf.trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (xff) return xff
  return '0.0.0.0'
}

export async function POST(request: NextRequest) {
  try {
    // 过滤爬虫/自动化流量，避免污染统计
    if (isLikelyBot(request.headers.get('user-agent'))) {
      return NextResponse.json({ success: true, skipped: 'bot' })
    }

    const { event, count, visitorId, host, sizes, aiEvent, tool, durationMs, pdfEvent, pages, bytes } = await request.json()

    // 按域名区分：jisuyatu.com=国内 / 其他=海外
    const site = (host === 'jisuyatu.com' || host === 'www.jisuyatu.com') ? 'cn' : 'os'

    switch (event) {
      case 'pageview':
        await Promise.all([
          incrementPageView(site),
          trackUniqueVisitor(visitorId || '', site),
          markVisitorActive(visitorId || ''),
        ])
        break
      case 'compression': {
        const n = Math.max(1, Math.min(Number(count) || 1, 500))
        // 校验：压缩事件必须带 visitorId，且该 visitorId 先有 pageview 前置
        // （防脚本直连 POST /api/admin/track 伪造压缩量，8/25 第 3 次爬虫暴增）
        if (!(await isVisitorActive(visitorId || ''))) {
          return NextResponse.json({ success: true, skipped: 'no_session' })
        }
        // 单 IP 每日限流：爬虫暴增时不污染统计（不阻断实际压缩）
        const allowed = await checkCompressionRateLimit(getIP(request), n)
        if (allowed <= 0) {
          return NextResponse.json({ success: true, skipped: 'rate_limit' })
        }
        await incrementCompression(allowed, site)
        // Track file size distribution
        if (sizes && Array.isArray(sizes)) {
          await recordFileSizes(sizes, site)
        }
        break
      }
      case 'ai': {
        const aiTool = String(tool || '')
        const aiEv = String(aiEvent || '')
        if (!AI_TOOLS.includes(aiTool as AiTool) || !AI_EVENTS.includes(aiEv as AiEventName)) {
          return NextResponse.json({ error: '未知 AI 事件' }, { status: 400 })
        }
        // 运行/结果类事件要求先有 pageview 会话（防脚本直连刷量）；曝光类放行
        if (
          ['start', 'success', 'error', 'download'].includes(aiEv) &&
          !(await isVisitorActive(visitorId || ''))
        ) {
          return NextResponse.json({ success: true, skipped: 'no_session' })
        }
        await incrementAiEvent(aiTool as AiTool, aiEv as AiEventName)
        if (aiEv === 'success') {
          const ms = Number(durationMs)
          if (Number.isFinite(ms) && ms > 0) await recordAiDuration(aiTool as AiTool, ms)
        }
        break
      }
      case 'pdf': {
        const pdfEv = String(pdfEvent || '')
        if (!PDF_EVENTS.includes(pdfEv as PdfEventName)) {
          return NextResponse.json({ error: '未知 PDF 事件' }, { status: 400 })
        }
        // 生成/失败/下载都要求先有 pageview 会话，防脚本直连刷量
        if (!(await isVisitorActive(visitorId || ''))) {
          return NextResponse.json({ success: true, skipped: 'no_session' })
        }
        await incrementPdfEvent(pdfEv as PdfEventName)
        if (pdfEv === 'generate') {
          const p = Number(pages)
          const b = Number(bytes)
          if (Number.isFinite(p) && p > 0 && Number.isFinite(b) && b >= 0) {
            await recordPdfOutput(p, b)
          }
        }
        break
      }
      default:
        return NextResponse.json({ error: '未知事件' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
