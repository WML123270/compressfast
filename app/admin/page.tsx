'use client'

import { useState, useEffect } from 'react'
import { classifyPurchase, displayAmount, type PurchaseKind } from '@/lib/purchase-classification'

export default function AdminDashboardPage() {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    setHtml('')
    try {
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Render as simple HTML table
      const ov = data.overseas || {}
      const cn = data.china || {}
      setHtml(renderStats(data, ov, cn))
    } catch (e: any) {
      setError(e.message || '加载失败')
    }
  }

  useEffect(() => { load() }, [])

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-600 font-semibold mb-2">加载失败</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">重试</button>
      </div>
    )
  }

  if (!html) {
    return (
      <div className="flex items-center gap-3 py-10">
        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        <span className="text-neutral-600 text-sm">加载中...</span>
      </div>
    )
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

// Pure string rendering — no React components, no state, can't crash
function renderStats(data: any, ov: any, cn: any): string {
  const dailyPV = data.dailyPV || []
  const dailyUV = data.dailyUV || []
  const dailyComp = data.dailyCompressions || []

  let rows = ''
  for (let i = 0; i < dailyPV.length; i++) {
    const pv = dailyPV[i]?.value || 0
    const uv = dailyUV[i]?.value || 0
    const comp = dailyComp[i]?.value || 0
    rows += `<tr>
      <td class="date">${(dailyPV[i]?.date || '').slice(5)}</td>
      <td class="num">${pv}</td>
      <td class="num">${uv}</td>
      <td class="num">${comp}</td>
    </tr>`
  }

  function purchaseRow(p: any, kind: PurchaseKind) {
    const devices = p.devices?.length || 0
    const tag = kind === 'external' ? 'REAL' : kind === 'self' ? 'SELF' : 'TEST'
    const tagClass = kind === 'external' ? 'tag-real' : kind === 'self' ? 'tag-self' : 'tag-test'
    return `<tr>
      <td class="mono">${p.code || ''}</td>
      <td>${p.email || ''}</td>
      <td>${new Date(p.created_at).toLocaleDateString('zh-CN')}</td>
      <td>${displayAmount(p.orderAmount)}</td>
      <td>${devices > 0 ? devices + ' dev' : ''}</td>
      <td class="${tagClass}">${tag}</td>
    </tr>`
  }

  let purchaseRows = ''
  const purchases = data.recentPurchases || []
  const counts = { external: 0, self: 0, test: 0 }
  for (const p of purchases) {
    const kind = classifyPurchase(p.email, p.orderId)
    counts[kind]++
    purchaseRows += purchaseRow(p, kind)
  }

  // ---- AI 工具 ----
  const ai = data.ai || {}
  function aiBox(title: string, s: any): string {
    const view = s.view || 0
    const gate = s.gate || 0
    const start = s.start || 0
    const success = s.success || 0
    const error = s.error || 0
    const download = s.download || 0
    const startRate = view > 0 ? Math.round((start / view) * 100) : 0
    const successRate = start > 0 ? Math.round((success / start) * 100) : 0
    const avg = s.averageDurationMs > 0 ? (s.averageDurationMs / 1000).toFixed(1) + 's' : '—'
    const errors: { code: string; count: number }[] = Array.isArray(s.errors) ? s.errors : []
    const errorLine = errors.length
      ? `<div class="s">失败原因：${errors.map((e) => `${e.code}×${e.count}`).join(' · ')}</div>`
      : ''
    return `<div class="box">
      <h3>${title}</h3>
      <div class="s">曝光 ${view} · 门控 ${gate} · 开始 ${start} · 成功 ${success} · 失败 ${error} · 下载 ${download}</div>
      <div class="s">开始/曝光 ${startRate}% · 成功/开始 ${successRate}% · 平均耗时 ${avg}</div>
      ${errorLine}
    </div>`
  }
  const aiDaily = ai.upscale?.daily || ai.removeBg?.daily || []
  let aiRows = ''
  for (let i = 0; i < aiDaily.length; i++) {
    const rm = ai.removeBg?.daily?.[i] || {}
    const up = ai.upscale?.daily?.[i] || {}
    aiRows += `<tr>
      <td class="date">${(aiDaily[i]?.date || '').slice(5)}</td>
      <td class="num">${rm.view || 0} / ${rm.success || 0}</td>
      <td class="num">${up.view || 0} / ${up.success || 0}</td>
    </tr>`
  }

  // ---- Pro 转化漏斗 ----
  const pro = data.proFunnel || {}
  const proView = pro.view || 0
  const proIntent = pro.intent || 0
  const proBuy = pro.buy || 0
  const proClick = pro.click || 0
  const proCheckout = pro.checkout || 0
  const proPay = pro.pay || 0
  const proPurchase = pro.purchase || 0
  const proActivated = pro.activated || 0
  const proFail = pro.fail || 0
  const proPurchases = data.totalPurchases || 0
  const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0)
  const proDaily = pro.daily || []
  let proDailyRows = ''
  for (let i = 0; i < proDaily.length; i++) {
    const d = proDaily[i] || {}
    proDailyRows += `<tr>
      <td class="date">${(d.date || '').slice(5)}</td>
      <td class="num">${d.view || 0}</td>
      <td class="num">${d.click || 0}</td>
      <td class="num">${d.intent || 0}</td>
      <td class="num">${d.buy || 0}</td>
      <td class="num">${d.checkout || 0}</td>
      <td class="num">${d.pay || 0}</td>
      <td class="num">${d.purchase || 0}</td>
      <td class="num">${d.activated || 0}</td>
    </tr>`
  }
  const proSourceNames: Record<string, string> = {
    header: '顶部导航',
    quota_banner: '额度条',
    image_list: '压缩结果卡片',
    format_selector: 'AVIF 格式锁',
    preset_manager: '预设锁',
    watermark: '水印锁',
    scene_presets: '场景预设锁',
    home_cta: '首页按钮',
    hero_cta: 'Pro 页首屏按钮',
    table_cta: 'Pro 页对比表按钮',
    ai_gate: 'AI 工具门控',
    pro_buy: 'Pro 页购买按钮',
    pro_cn_buy: 'Pro 页国内支付',
    mobile_sticky: '移动端吸底',
    dropzone: '文件超限提示',
    creem: 'Creem 渠道',
    hupijiao: '虎皮椒渠道',
  }
  const proSources = (pro.bySource || [])
    .filter((s: any) => (s.click || 0) > 0 || (s.intent || 0) > 0 || (s.buy || 0) > 0 || (s.checkout || 0) > 0)
    .sort((a: any, b: any) =>
      ((b.intent || 0) + (b.buy || 0)) - ((a.intent || 0) + (a.buy || 0)) ||
      (b.click || 0) - (a.click || 0)
    )
  let proSourceRows = ''
  for (const s of proSources) {
    proSourceRows += `<tr>
      <td>${proSourceNames[s.source] || s.source}</td>
      <td class="num">${s.click || 0}</td>
      <td class="num">${s.intent || 0}</td>
      <td class="num">${s.buy || 0}</td>
      <td class="num">${s.checkout || 0}</td>
      <td class="num">${s.buy > 0 ? Math.round(((s.checkout || 0) / s.buy) * 100) + '%' : '—'}</td>
    </tr>`
  }
  if (!proSourceRows) {
    proSourceRows = `<tr><td colspan="6" class="date">暂无数据（新埋点，从今天开始累计）</td></tr>`
  }

  // ---- 图片转 PDF ----
  function fmtBytes(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    let v = n
    let i = 0
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
    return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
  }
  const pdf = data.pdf || {}
  const pdfGen = pdf.generate || 0
  const pdfErr = pdf.error || 0
  const pdfDl = pdf.download || 0
  const pdfPages = pdf.totalPages || 0
  const pdfBytes = pdf.totalBytes || 0
  const pdfAvgPages = pdfGen > 0 ? (pdfPages / pdfGen).toFixed(1) : '—'
  const pdfAvgSize = pdfGen > 0 ? fmtBytes(pdfBytes / pdfGen) : '—'
  const pdfDlRate = pdfGen > 0 ? Math.round((pdfDl / pdfGen) * 100) : 0
  const pdfDaily = pdf.daily || []
  let pdfRows = ''
  for (let i = 0; i < pdfDaily.length; i++) {
    const d = pdfDaily[i] || {}
    pdfRows += `<tr>
      <td class="date">${(d.date || '').slice(5)}</td>
      <td class="num">${d.generate || 0}</td>
      <td class="num">${d.error || 0}</td>
      <td class="num">${d.download || 0}</td>
    </tr>`
  }

  // 按工具拆分（历史数据只有 image-to-pdf 的 pages/bytes，其余为 0 属正常）
  const pdfToolNames: Record<string, string> = {
    'image-to-pdf': '🖼️ 图片转 PDF',
    'merge-pdf': '📎 合并 PDF',
    'split-pdf': '✂️ 拆分 PDF',
    'compress-pdf': '🗜️ 压缩 PDF',
  }
  const pdfByTool = pdf.byTool || []
  let pdfToolRows = ''
  for (const t of pdfByTool) {
    const gen = t.generate || 0
    const err = t.error || 0
    const dl = t.download || 0
    const pages = t.pages || 0
    const bytes = t.bytes || 0
    const dlRate = gen > 0 ? Math.round((dl / gen) * 100) + '%' : '—'
    const avgPages = gen > 0 && pages > 0 ? (pages / gen).toFixed(1) : '—'
    const avgSize = gen > 0 && bytes > 0 ? fmtBytes(bytes / gen) : '—'
    pdfToolRows += `<tr>
      <td>${pdfToolNames[t.tool] || t.tool}</td>
      <td class="num">${gen}</td>
      <td class="num">${err}</td>
      <td class="num">${dl}</td>
      <td class="num">${dlRate}</td>
      <td class="num">${avgPages}</td>
      <td class="num">${avgSize}</td>
    </tr>`
  }

  // ---- 图片拼接 / 证件照 ----
  const buildToolCard = (tool: any) => {
    const gen = tool?.generate || 0
    const err = tool?.error || 0
    const dl = tool?.download || 0
    return {
      gen,
      err,
      dl,
      dlRate: gen > 0 ? Math.round((dl / gen) * 100) : 0,
      daily: tool?.daily || [],
    }
  }
  const stitchCard = buildToolCard(data.stitch)
  const idPhotoCard = buildToolCard(data.idPhoto)
  const splitCard = buildToolCard(data.splitImage)
  const stitchGen = stitchCard.gen
  const stitchErr = stitchCard.err
  const stitchDl = stitchCard.dl
  const stitchDlRate = stitchCard.dlRate
  const stitchDaily = stitchCard.daily
  let stitchRows = ''
  for (let i = 0; i < stitchDaily.length; i++) {
    const d = stitchDaily[i] || {}
    stitchRows += `<tr>
      <td class="date">${(d.date || '').slice(5)}</td>
      <td class="num">${d.generate || 0}</td>
      <td class="num">${d.error || 0}</td>
      <td class="num">${d.download || 0}</td>
    </tr>`
  }
  let idPhotoRows = ''
  for (let i = 0; i < idPhotoCard.daily.length; i++) {
    const d = idPhotoCard.daily[i] || {}
    idPhotoRows += `<tr>
      <td class="date">${(d.date || '').slice(5)}</td>
      <td class="num">${d.generate || 0}</td>
      <td class="num">${d.error || 0}</td>
      <td class="num">${d.download || 0}</td>
    </tr>`
  }
  let splitRows = ''
  for (let i = 0; i < splitCard.daily.length; i++) {
    const d = splitCard.daily[i] || {}
    splitRows += `<tr>
      <td class="date">${(d.date || '').slice(5)}</td>
      <td class="num">${d.generate || 0}</td>
      <td class="num">${d.error || 0}</td>
      <td class="num">${d.download || 0}</td>
    </tr>`
  }

  return `<style>
    .db { font-family: -apple-system, sans-serif; }
    .db h1 { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 16px; }
    .db h2 { font-size: 14px; font-weight: 600; color: #475569; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    .kpis { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .kpi { flex: 1; min-width: 120px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .kpi .val { font-size: 28px; font-weight: 800; color: #1e293b; }
    .kpi .lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; margin-top: 4px; }
    .split { display: flex; gap: 16px; flex-wrap: wrap; }
    .box { flex: 1; min-width: 280px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .box h3 { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
    .box .s { font-size: 13px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #e2e8f0; }
    td { padding: 6px 12px; border-bottom: 1px solid #f1f5f9; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .date { color: #64748b; }
    .mono { font-family: monospace; font-size: 11px; }
    .tag-real { font-size: 10px; font-weight: 600; color: #16a34a; }
    .tag-self { font-size: 10px; font-weight: 600; color: #2563eb; }
    .tag-test { font-size: 10px; font-weight: 600; color: #94a3b8; }
    .note { font-size: 12px; color: #64748b; margin: 6px 0 10px; }
    .warn { font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 8px 12px; margin: 8px 0 12px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; color: #475569; font-size: 13px; cursor: pointer; margin-bottom: 16px; }
    .btn:hover { background: #f8fafc; }
  </style>
  <div class="db">
    <button class="btn" onclick="location.reload()">🔄 刷新</button>
    <h1>📊 数据仪表盘</h1>
    <div class="kpis">
      <div class="kpi"><div class="val">${(data.totalPV || 0).toLocaleString()}</div><div class="lbl">总 PV</div></div>
      <div class="kpi"><div class="val">${(data.totalUV || 0).toLocaleString()}</div><div class="lbl">总 UV</div></div>
      <div class="kpi"><div class="val">${(data.totalCompressions || 0).toLocaleString()}</div><div class="lbl">总压缩</div></div>
      <div class="kpi"><div class="val">${data.totalPurchases || 0}</div><div class="lbl">订单数（含测试）</div></div>
      <div class="kpi"><div class="val">$${(data.totalRevenue || 0).toFixed(2)}</div><div class="lbl">流水（含测试/混币种）</div></div>
      <div class="kpi"><div class="val">${counts.external}</div><div class="lbl">真实外部订单*</div></div>
    </div>
    <div class="warn">* 真实外部订单 = 有支付订单号 + 邮箱非测试/非自购，仅统计下方最近 ${purchases.length} 条记录。TEST 包含支付联调自测单（可能真扣款，但不是外部用户）；没有订单号的历史激活码不计入付费。</div>
    <div class="split">
      <div class="box">
        <h3>🌍 海外版</h3>
        <div class="s">PV ${(ov.totalPV || 0).toLocaleString()} · UV ${(ov.totalUV || 0).toLocaleString()} · 压缩 ${(ov.totalCompressions || 0).toLocaleString()}</div>
      </div>
      <div class="box">
        <h3>🇨🇳 国内版</h3>
        <div class="s">PV ${(cn.totalPV || 0).toLocaleString()} · UV ${(cn.totalUV || 0).toLocaleString()} · 压缩 ${(cn.totalCompressions || 0).toLocaleString()}</div>
      </div>
    </div>
    <h2>💳 Pro 转化漏斗（累计）</h2>
    <p class="note">view=Pro 页曝光 · intent=Pro 页内点「立即升级」 · buy=点支付按钮 · checkout=支付订单创建成功 · pay=已展示支付方式（国内二维码/手机跳转/Creem） · purchase=支付成功（含联调测试单） · activated=激活码在本机激活成功 · fail=创建失败 · click=其他页面升级入口点击（不参与漏斗，单独看来源）。2026-11-23 起拆分 intent/buy，之前的数据归在 click 里；2026-11-27 新增 pay/activated。</p>
    <div class="split">
      <div class="box">
        <h3>漏斗（点击支付后）</h3>
        <div class="s">曝光 ${proView} → 购买意图 ${proIntent}（${pct(proIntent, proView)}%）→ 点支付 ${proBuy}（${pct(proBuy, proIntent)}%）→ 创建订单 ${proCheckout}（${pct(proCheckout, proBuy)}%）→ 支付方式展示 ${proPay}（${pct(proPay, proCheckout)}%）→ 支付成功 ${proPurchase} · 本机激活 ${proActivated}</div>
        <div class="s">站内入口点击 ${proClick} · 创建失败 ${proFail} · 历史订单 ${proPurchases}</div>
      </div>
      <div class="box">
        <h3>怎么读</h3>
        <div class="s">曝光高、意图低：Pro 页首屏说服力/价格问题。</div>
        <div class="s">意图高、点支付低：购买区文案、邮箱填写或信任问题。</div>
        <div class="s">点支付高、创建订单低：邮箱校验/接口错误，查 fail。</div>
        <div class="s">创建订单高、支付成功低：支付渠道体验或用户放弃付款。</div>
      </div>
    </div>
    <h2>📅 Pro 漏斗近 7 天</h2>
    <table>
      <tr><th>日期</th><th class="num">曝光</th><th class="num">入口点击</th><th class="num">购买意图</th><th class="num">点支付</th><th class="num">创建订单</th><th class="num">支付方式</th><th class="num">支付成功</th><th class="num">本机激活</th></tr>
      ${proDailyRows}
    </table>
    <h2>🔎 升级入口来源</h2>
    <table>
      <tr><th>入口</th><th class="num">入口点击</th><th class="num">购买意图</th><th class="num">点支付</th><th class="num">创建订单</th><th class="num">支付→创建率</th></tr>
      ${proSourceRows}
    </table>
    <h2>🤖 AI 工具（累计）</h2>
    <div class="split">
      ${aiBox('✂️ AI 抠图', ai.removeBg || {})}
      ${aiBox('🖼️ AI 放大', ai.upscale || {})}
    </div>
    <h2>📅 AI 近 7 天（曝光 / 成功）</h2>
    <table>
      <tr><th>日期</th><th class="num">AI 抠图</th><th class="num">AI 放大</th></tr>
      ${aiRows}
    </table>
    <h2>📄 图片转 PDF（累计）</h2>
    <div class="split">
      <div class="box">
        <h3>📄 生成 / 下载</h3>
        <div class="s">生成 ${pdfGen} · 失败 ${pdfErr} · 下载 ${pdfDl} · 下载/生成 ${pdfDlRate}%</div>
        <div class="s">平均 ${pdfAvgPages} 页/份 · 平均体积 ${pdfAvgSize}</div>
      </div>
    </div>
    <h2>📅 图片转 PDF 近 7 天（生成 / 失败 / 下载）</h2>
    <table>
      <tr><th>日期</th><th class="num">生成</th><th class="num">失败</th><th class="num">下载</th></tr>
      ${pdfRows}
    </table>
    <h2>🧩 PDF 工具拆分（累计）</h2>
    <p class="note">按工具统计生成 / 失败 / 下载次数、下载率和平均页数/体积。旧数据只记了图片转 PDF 的页数与体积，合并/拆分/压缩的页数体积可能显示 “—”。</p>
    <table>
      <tr><th>工具</th><th class="num">生成</th><th class="num">失败</th><th class="num">下载</th><th class="num">下载率</th><th class="num">平均页数</th><th class="num">平均体积</th></tr>
      ${pdfToolRows}
    </table>
    <h2>🧩 图片拼接（累计）</h2>
    <div class="split">
      <div class="box">
        <h3>🧩 生成 / 下载</h3>
        <div class="s">生成 ${stitchGen} · 失败 ${stitchErr} · 下载 ${stitchDl} · 下载/生成 ${stitchDlRate}%</div>
        <div class="s">generate 仅在每次页面会话首次成功生成时记一次，download 按点击次数累计。</div>
      </div>
    </div>
    <h2>📅 图片拼接近 7 天（生成 / 失败 / 下载）</h2>
    <table>
      <tr><th>日期</th><th class="num">生成</th><th class="num">失败</th><th class="num">下载</th></tr>
      ${stitchRows}
    </table>
    <h2>🪪 证件照（累计）</h2>
    <div class="split">
      <div class="box">
        <h3>🪪 生成 / 下载</h3>
        <div class="s">生成 ${idPhotoCard.gen} · 失败 ${idPhotoCard.err} · 下载 ${idPhotoCard.dl} · 下载/生成 ${idPhotoCard.dlRate}%</div>
        <div class="s">generate 仅在每次页面会话首次成功生成时记一次，download 按点击次数累计。</div>
      </div>
    </div>
    <h2>📅 证件照近 7 天（生成 / 失败 / 下载）</h2>
    <table>
      <tr><th>日期</th><th class="num">生成</th><th class="num">失败</th><th class="num">下载</th></tr>
      ${idPhotoRows}
    </table>
    <h2>🔳 图片切割（累计）</h2>
    <div class="split">
      <div class="box">
        <h3>🔳 生成 / 下载</h3>
        <div class="s">生成 ${splitCard.gen} · 失败 ${splitCard.err} · 下载 ${splitCard.dl} · 下载/生成 ${splitCard.dlRate}%</div>
        <div class="s">generate 仅在每次页面会话首次成功打包时记一次，download 按点击次数累计。</div>
      </div>
    </div>
    <h2>📅 图片切割近 7 天（生成 / 失败 / 下载）</h2>
    <table>
      <tr><th>日期</th><th class="num">生成</th><th class="num">失败</th><th class="num">下载</th></tr>
      ${splitRows}
    </table>
    <h2>📅 近7天明细</h2>
    <table>
      <tr><th>日期</th><th class="num">PV</th><th class="num">UV</th><th class="num">压缩</th></tr>
      ${rows}
    </table>
    <h2>💳 购买记录</h2>
    <p class="note">最近 ${purchases.length} 条：真实外部 ${counts.external} · 自购 ${counts.self} · 测试 ${counts.test}。</p>
    <table>
      <tr><th>激活码</th><th>邮箱</th><th>时间</th><th>金额</th><th>设备</th><th>类型</th></tr>
      ${purchaseRows}
    </table>
  </div>`
}
