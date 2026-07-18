/**
 * POST /api/feedback — 提交反馈
 * GET  /api/feedback — 管理后台查看反馈（需 admin cookie）
 * PUT  /api/feedback — 标记已读/删除
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { isAdmin } from '@/lib/admin-auth'
import nodemailer from 'nodemailer'

const FEEDBACK_KEY = 'feedback:list'

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    return new Redis({ url: process.env.UPSTASH_REDIS_URL, token: process.env.UPSTASH_REDIS_TOKEN })
  }
  return null
}

async function sendNotifyEmail(feedback: { category: string; content: string; email?: string; ua: string; time: string }) {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })

    const emoji = feedback.category === 'bug' ? '🐛' : feedback.category === 'suggestion' ? '💡' : '💬'
    await transporter.sendMail({
      from: SMTP_USER,
      to: '756971388@qq.com',
      subject: `${emoji} 新反馈: ${feedback.content.slice(0, 40)}`,
      html: `<div style="font-family:sans-serif">
        <h3>${emoji} 新用户反馈</h3>
        <p><strong>分类:</strong> ${feedback.category}</p>
        <p><strong>内容:</strong> ${feedback.content}</p>
        <p><strong>邮箱:</strong> ${feedback.email || '未填写'}</p>
        <p><strong>UA:</strong> ${feedback.ua}</p>
        <p><strong>时间:</strong> ${feedback.time}</p>
      </div>`,
    })
  } catch {}
}

// POST — 用户提交反馈
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, content, email } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }
    if (!['bug', 'suggestion', 'other'].includes(category)) {
      return NextResponse.json({ error: '分类无效' }, { status: 400 })
    }

    const feedback = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      category,
      content: content.trim().slice(0, 2000),
      email: email?.trim()?.slice(0, 120) || '',
      ua: request.headers.get('user-agent')?.slice(0, 200) || '',
      time: new Date().toISOString(),
      read: false,
    }

    const redis = getRedis()
    if (redis) {
      await redis.lpush(FEEDBACK_KEY, JSON.stringify(feedback))
    }

    // 异步发邮件通知，不阻塞响应
    sendNotifyEmail(feedback).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '提交失败' }, { status: 500 })
  }
}

// GET — 管理后台查看列表
export async function GET(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const filter = searchParams.get('category') || ''

  const redis = getRedis()
  if (!redis) return NextResponse.json({ list: [], total: 0 })

  const raw = await redis.lrange(FEEDBACK_KEY, 0, -1)
  let items = raw.map((r: string) => {
    try { return JSON.parse(r) } catch { return null }
  }).filter(Boolean)

  if (filter) items = items.filter((f: any) => f.category === filter)

  const total = items.length
  const start = (page - 1) * pageSize
  const list = items.slice(start, start + pageSize)

  return NextResponse.json({ list, total })
}

// PUT — 标记已读 / 删除
export async function PUT(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, action } = body // action: 'read' | 'delete'

    const redis = getRedis()
    if (!redis) return NextResponse.json({ error: 'Redis 不可用' }, { status: 500 })

    const raw = await redis.lrange(FEEDBACK_KEY, 0, -1)

    if (action === 'delete') {
      // 重建列表，跳过要删除的
      const filtered = raw.filter((r: string) => {
        try { return JSON.parse(r).id !== id } catch { return true }
      })
      await redis.del(FEEDBACK_KEY)
      if (filtered.length > 0) {
        // 倒序 push 保持顺序
        for (let i = filtered.length - 1; i >= 0; i--) {
          await redis.rpush(FEEDBACK_KEY, filtered[i])
        }
      }
    } else if (action === 'read') {
      // 遍历更新
      for (let i = 0; i < raw.length; i++) {
        try {
          const f = JSON.parse(raw[i])
          if (f.id === id) {
            f.read = true
            await redis.lset(FEEDBACK_KEY, i, JSON.stringify(f))
            break
          }
        } catch {}
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: '操作失败' }, { status: 500 })
  }
}
