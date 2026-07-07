/**
 * 邮件发送工具
 * 优先级: QQ SMTP (nodemailer) → Resend API → 静默降级
 *
 * QQ 邮箱 SMTP 配置（最简单，推荐）：
 *   1. QQ邮箱 → 设置 → 账户 → POP3/SMTP服务 → 开启 → 获取授权码
 *   2. 设置环境变量：
 *      SMTP_HOST=smtp.qq.com
 *      SMTP_PORT=465
 *      SMTP_USER=756971388@qq.com
 *      SMTP_PASS=授权码（不是QQ密码！）
 *   3. 无需翻墙、无需域名验证、无需DNS
 *
 * Resend（可选，需要翻墙注册）：
 *   RESEND_API_KEY=re_xxx
 *   RESEND_FROM_EMAIL=noreply@yourdomain.com
 */

import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: true, // QQ/163 等国内邮箱都用 SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return transporter
}

interface SendOptions {
  to: string
  code: string
  locale?: 'zh' | 'en'
  subject?: string
}

function buildHtml(options: SendOptions): { subject: string; html: string } {
  const { to: _to, code, locale = 'en' } = options
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jisuyatu.com'
  const proUrl = `${siteUrl}/${locale}/pro`
  const isZh = locale === 'zh'

  const subject = isZh
    ? '🐼 你的 CompressFast Pro 激活码'
    : '🐼 Your CompressFast Pro Activation Code'
  const greeting = isZh
    ? '感谢购买 Pro！你的激活码：'
    : 'Thanks for going Pro! Your activation code:'
  const cta = isZh ? '前往激活' : 'Activate Now'
  const footer = isZh
    ? `在 <a href="${proUrl}">CompressFast Pro 页面</a> 输入激活码即可解锁全部功能。`
    : `Enter it at <a href="${proUrl}">CompressFast Pro</a> to unlock all features.`
  const note = isZh
    ? '激活码绑定你的设备（最多 5 台），请勿分享。'
    : 'This code is linked to your devices (max 5). Please do not share.'

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1e293b;background:#fff">
  <h2 style="margin:0 0 16px;font-size:20px">${subject}</h2>
  <p style="margin:0 0 12px;font-size:15px;color:#475569">${greeting}</p>
  <div style="background:#f1f5f9;padding:24px;border-radius:12px;text-align:center;margin:16px 0">
    <span style="font-size:28px;font-weight:700;font-family:'SF Mono',Monaco,Consolas,monospace;letter-spacing:6px;word-break:break-all">${code}</span>
  </div>
  <a href="${proUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;margin:8px 0 16px">${cta}</a>
  <p style="margin:0 0 8px;font-size:14px;color:#475569;line-height:1.6">${footer}</p>
  <p style="margin:0;font-size:12px;color:#94a3b8">${note}</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0">
  <p style="margin:0;font-size:11px;color:#94a3b8">CompressFast · ${isZh ? '极速压图' : 'Image Compression Tool'}</p>
</body>
</html>`

  return { subject, html }
}

export async function sendLicenseEmail(options: SendOptions): Promise<boolean> {
  const { subject: overrideSubject, to, code, locale = 'en' } = options
  const { subject, html } = buildHtml(options)

  // 方式 1：QQ SMTP（推荐，零配置）
  const transport = getTransporter()
  if (transport) {
    try {
      const from = process.env.SMTP_FROM || process.env.SMTP_USER!
      await transport.sendMail({
        from: `CompressFast <${from}>`,
        to,
        subject: overrideSubject || subject,
        html,
      })
      console.log(`[Email] Sent via SMTP to ${to}`)
      return true
    } catch (err) {
      console.error('[Email] SMTP failed:', err)
      // 不 fallthrough — SMTP 失败就是失败了
      return false
    }
  }

  // 方式 2：Resend API（需翻墙注册，备选）
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (RESEND_API_KEY) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@compressfast.site'
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `CompressFast <${fromEmail}>`,
          to,
          subject: overrideSubject || subject,
          html,
        }),
      })
      if (!res.ok) {
        console.error('[Email] Resend API error:', res.status, await res.text())
        return false
      }
      console.log(`[Email] Sent via Resend to ${to}`)
      return true
    } catch (err) {
      console.error('[Email] Resend failed:', err)
      return false
    }
  }

  // 都没配：静默降级
  console.log(`[Email] Not configured. Code: ${code} → ${to}`)
  return false
}
