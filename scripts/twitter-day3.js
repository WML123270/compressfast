/**
 * 生成 JPEG 画质对比图 — Day 3 推文配图
 * 四宫格：100% / 85% / 60% / 40%
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function main() {
  const outDir = 'test-results/twitter';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 生成一张 800×600 的测试图（渐变色+文字，有细节可对比）
  const W = 800, H = 600;

  // 先用 sharp 创建一张丰富色彩的图
  // 方法：创建一个 SVG 然后渲染
  const svg = `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ff6b6b"/>
          <stop offset="50%" style="stop-color:#4ecdc4"/>
          <stop offset="100%" style="stop-color:#45b7d1"/>
        </linearGradient>
        <linearGradient id="g2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#f9ca24;stop-opacity:0.8"/>
          <stop offset="100%" style="stop-color:#f0932b;stop-opacity:0.3"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g1)"/>
      <rect x="50" y="50" width="200" height="200" rx="20" fill="url(#g2)"/>
      <circle cx="600" cy="150" r="80" fill="#6c5ce7" opacity="0.7"/>
      <circle cx="650" cy="180" r="30" fill="#a29bfe"/>
      <text x="400" y="400" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">CompressFast</text>
      <text x="400" y="440" font-family="Arial,sans-serif" font-size="20" fill="white" text-anchor="middle" opacity="0.7">JPEG Quality Comparison</text>
      <rect x="100" y="480" width="150" height="4" rx="2" fill="white" opacity="0.5"/>
      <rect x="300" y="300" width="100" height="4" rx="2" fill="white" opacity="0.4"/>
      <rect x="550" y="480" width="120" height="3" rx="2" fill="white" opacity="0.3"/>
      <!-- small details for comparison -->
      <line x1="200" y1="100" x2="700" y2="100" stroke="white" stroke-width="0.5" opacity="0.3"/>
      <line x1="200" y1="550" x2="700" y2="550" stroke="white" stroke-width="0.5" opacity="0.3"/>
    </svg>
  `;

  const original = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();

  const originalSize = original.length;

  // 缩放到 400×300 用于四宫格（2×2）
  const TW = 600, TH = 450; // 每个格子的大小
  const originalResized = await sharp(original).resize(TW, TH).toBuffer();

  // 生成四种画质的 JPEG
  const qualities = [
    { q: 100, label: '100%', desc: 'Original' },
    { q: 85, label: '85%', desc: 'Sweet Spot' },
    { q: 60, label: '60%', desc: 'Blocks appear' },
    { q: 40, label: '40%', desc: 'Visible loss' },
  ];

  const variants = [];
  for (const { q, label, desc } of qualities) {
    const buf = await sharp(originalResized).jpeg({ quality: q }).toBuffer();
    variants.push({ buffer: buf, size: buf.length, label, desc });
  }

  // 最佳品质（100%）作为基准
  const bestSize = variants[0].size;

  // 创建四宫格 HTML
  const cells = variants.map((v, i) => {
    const b64 = v.buffer.toString('base64');
    const savings = i === 0 ? '—' : `${((1 - v.size / bestSize) * 100).toFixed(0)}% smaller`;
    const color = i === 0 ? '#64748b' : i === 1 ? '#22c55e' : i === 2 ? '#f59e0b' : '#ef4444';
    return `
      <div style="
        flex: 1; min-width: 48%; margin-bottom: 20px;
        background: #1e293b; border-radius: 16px; overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      ">
        <img src="data:image/jpeg;base64,${b64}" style="width:100%; display:block;" />
        <div style="padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <span style="color:${color}; font-weight:700; font-size:20px; font-family:system-ui,sans-serif;">${v.label}</span>
            <span style="color:#94a3b8; font-size:14px; margin-left: 8px; font-family:system-ui,sans-serif;">${v.desc}</span>
          </div>
          <div style="text-align:right;">
            <div style="color:#e2e8f0; font-weight:700; font-size:16px; font-family:system-ui,sans-serif;">${(v.size/1024).toFixed(1)} KB</div>
            <div style="color:#22c55e; font-size:12px; font-family:system-ui,sans-serif;">${savings}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const footnote = qualities.map(({ q, label }) =>
    `<span style="color:#64748b; font-family:system-ui,sans-serif;">JPEG ${q} = <b style="color:#e2e8f0;">${label}</b></span>`
  ).join('<span style="color:#334155; margin: 0 12px;">|</span>');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>body{margin:0;background:#0f172a;}</style></head>
<body style="
  width:1280px; height:1280px;
  background: #0f172a;
  padding: 48px 40px;
  box-sizing: border-box;
">
  <div style="text-align:center; margin-bottom: 32px;">
    <h1 style="color:#f1f5f9; font-family:system-ui,sans-serif; font-size:36px; font-weight:800; margin:0 0 8px 0;">
      JPEG Quality: Where's the sweet spot?
    </h1>
    <p style="color:#94a3b8; font-family:system-ui,sans-serif; font-size:18px; margin:0;">
      Same image. Different JPEG quality levels. Can you see the difference?
    </p>
  </div>
  <div style="display:flex; flex-wrap:wrap; gap: 20px; justify-content: center;">
    ${cells}
  </div>
  <div style="text-align:center; margin-top: 24px; font-size: 15px;">
    ${footnote}
  </div>
  <div style="text-align:center; margin-top: 20px;">
    <span style="color:#475569; font-family:system-ui,sans-serif; font-size:14px;">compressfast.site</span>
  </div>
</body>
</html>`;

  const htmlPath = path.join(outDir, 'jpeg-quality-comparison.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`✅ HTML 已生成: ${htmlPath}`);

  // 用 Playwright 截图
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1280 } });
  const page = await ctx.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const pngPath = path.join(outDir, 'day3-jpeg-quality.png');
  await page.screenshot({ path: pngPath, fullPage: false });
  console.log(`✅ 截图已保存: ${pngPath}`);

  await browser.close();
  console.log('\n📐 四宫格对比图完成！1200×1200');
  console.log('   1. 打开 test-results/twitter/day3-jpeg-quality.png');
  console.log('   2. 配上推文文案发 Twitter');
}

main().catch(e => { console.error(e); process.exit(1); });
