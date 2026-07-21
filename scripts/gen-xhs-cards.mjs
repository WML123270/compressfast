/**
 * Generate Xiaohongshu post images (cards 2-5)
 * Card 2: Features showcase
 * Card 3: Privacy EXIF removal
 * Card 4: Quality comparison (compression ratio)
 * Card 5: Steps / How to use
 */
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const W = 1080;
const H = 1440;
const BG = '#0b1420';
const CYAN = '#22d3ee';
const WHITE = '#f1f5f9';
const MUTED = '#94a3b8';
const GREEN = '#34d399';
const PURPLE = '#c084fc';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBackground(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 200, 50, W / 2, 500, 700);
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.06)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
}

function drawFooter(ctx, text) {
  ctx.fillStyle = CYAN;
  ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text || 'jisuyatu.com · 完全免费', W / 2, H - 80);
  const barGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  barGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
  barGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.4)');
  barGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(W / 2 - 200, H - 50, 400, 2);
}

// ---- Card 2: Features ----
function card2() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ 为什么选它？', W / 2, 180);

  const features = [
    { icon: '🔒', title: '文件不上传', desc: '所有压缩在浏览器本地完成\n0 字节发往任何服务器', color: GREEN },
    { icon: '📦', title: '批量 20 张', desc: '一次拖入 20 张图片\n打包 ZIP 一键下载', color: CYAN },
    { icon: '🖼️', title: '6 种格式支持', desc: 'PNG / JPEG / WebP / GIF\nBMP / SVG 全兼容', color: PURPLE },
    { icon: '📍', title: '清除 GPS 隐私', desc: '自动删除照片定位信息\n不泄露你的位置', color: '#fb923c' },
    { icon: '📡', title: '断网也能用', desc: '加载一次后离线工作\n飞机上也能压图', color: '#f472b6' },
    { icon: '🎨', title: '深色科技风', desc: '护眼暗色界面\n颜值在线的实用工具', color: '#818cf8' },
  ];

  const startY = 270;
  const rowH = 160;
  const cols = 2;
  const cardW = 420;
  const cardH = 130;
  const gapX = 60;
  const gapY = 40;
  const totalW = cardW * cols + gapX;
  const startX = (W - totalW) / 2;

  features.forEach((f, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    ctx.fillStyle = '#111c2e';
    roundRect(ctx, x, y, cardW, cardH, 16);
    ctx.fill();

    ctx.font = '40px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(f.icon, x + 25, y + 55);

    ctx.fillStyle = f.color;
    ctx.font = 'bold 30px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(f.title, x + 80, y + 42);

    ctx.fillStyle = MUTED;
    ctx.font = '22px "Microsoft YaHei", "PingFang SC", sans-serif';
    const lines = f.desc.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x + 80, y + 72 + li * 28);
    });
  });

  drawFooter(ctx);
  return canvas.toBuffer('image/png');
}

// ---- Card 3: Privacy ----
function card3() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx);

  ctx.font = '70px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📍', W / 2, 200);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('你的照片在泄露隐私', W / 2, 300);

  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 48px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('你知道吗？', W / 2, 370);

  const leaks = [
    ['📷', '照片里藏着 GPS 坐标', '精确到米'],
    ['🕐', '拍摄时间 + 设备型号', 'iPhone 15 Pro Max...'],
    ['🏠', '在家拍的 = 暴露住址', '公司拍 = 暴露公司'],
  ];

  const ly = 480;
  leaks.forEach((l, i) => {
    const y = ly + i * 150;
    ctx.font = '42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l[0], W / 2 - 320, y + 30);

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 32px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(l[1], W / 2 - 250, y + 10);

    ctx.fillStyle = MUTED;
    ctx.font = '26px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(l[2], W / 2 - 250, y + 50);
  });

  // Solution box
  const sy = ly + 450;
  ctx.fillStyle = '#10201a';
  roundRect(ctx, W / 2 - 350, sy, 700, 140, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - 350, sy, 700, 140, 20);
  ctx.stroke();

  ctx.fillStyle = GREEN;
  ctx.font = 'bold 36px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✅ 极速压图帮你一键清除', W / 2, sy + 55);

  ctx.fillStyle = WHITE;
  ctx.font = '26px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('上传前自动抹掉 GPS、时间、设备信息', W / 2, sy + 95);

  drawFooter(ctx, 'jisuyatu.com · 保护你的隐私');
  return canvas.toBuffer('image/png');
}

// ---- Card 4: Quality / Compression stats ----
function card4() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('压缩效果有多强？', W / 2, 180);

  // Big stat
  ctx.fillStyle = CYAN;
  ctx.font = 'bold 160px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('90%', W / 2, 420);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 40px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('平均压缩率', W / 2, 490);

  // Three stat cards
  const stats = [
    { value: '4.2MB→420KB', label: 'PNG 照片', color: CYAN },
    { value: '2.8MB→350KB', label: 'JPEG 图片', color: GREEN },
    { value: '1.5MB→180KB', label: 'WebP 输出', color: PURPLE },
  ];

  const sy = 580;
  const cardW = 280;
  const gap = 40;
  const totalW = cardW * 3 + gap * 2;
  const sx = (W - totalW) / 2;

  stats.forEach((s, i) => {
    const x = sx + i * (cardW + gap);
    ctx.fillStyle = '#111c2e';
    roundRect(ctx, x, sy, cardW, 180, 16);
    ctx.fill();

    ctx.fillStyle = s.color;
    ctx.font = 'bold 38px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.value, x + cardW / 2, sy + 70);

    ctx.fillStyle = MUTED;
    ctx.font = '26px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(s.label, x + cardW / 2, sy + 120);
  });

  // Bottom note
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 32px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👆 肉眼对比，看不出差异', W / 2, sy + 250);

  drawFooter(ctx);
  return canvas.toBuffer('image/png');
}

// ---- Card 5: How to use ----
function card5() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  drawBackground(ctx);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 56px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('📱 三步搞定', W / 2, 160);

  const steps = [
    { num: '1', icon: '📂', title: '打开网站', desc: '浏览器访问 jisuyatu.com\n不用下载 App，不占内存', color: CYAN },
    { num: '2', icon: '📤', title: '拖入图片', desc: '把照片拖进框里\n支持 20 张一起拖', color: GREEN },
    { num: '3', icon: '⬇️', title: '下载压缩包', desc: '点一下"全部压缩"\n自动打包 ZIP 下载', color: PURPLE },
  ];

  const sy = 280;
  steps.forEach((s, i) => {
    const y = sy + i * 280;

    // Circle number
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(W / 2, y + 50, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BG;
    ctx.font = 'bold 42px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.num, W / 2, y + 65);

    // Content box
    const bx = W / 2 - 300;
    ctx.fillStyle = '#111c2e';
    roundRect(ctx, bx, y + 120, 600, 120, 16);
    ctx.fill();

    ctx.font = '48px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.icon, bx + 30, y + 180);

    ctx.fillStyle = WHITE;
    ctx.font = 'bold 36px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(s.title, bx + 100, y + 165);

    ctx.fillStyle = MUTED;
    ctx.font = '24px "Microsoft YaHei", "PingFang SC", sans-serif';
    const lines = s.desc.split('\n');
    lines.forEach((l, li) => {
      ctx.fillText(l, bx + 100, y + 195 + li * 30);
    });
  });

  // Arrow connectors
  ctx.fillStyle = CYAN;
  ctx.font = 'bold 60px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('↓', W / 2, sy + 240);
  ctx.fillText('↓', W / 2, sy + 520);

  drawFooter(ctx, 'jisuyatu.com · 电脑手机都能用');
  return canvas.toBuffer('image/png');
}

// Generate all
async function main() {
  const outDir = 'C:/Users/Administrator/Desktop/';

  const cards = [
    { name: 'xiaohongshu-2-features.png', fn: card2 },
    { name: 'xiaohongshu-3-privacy.png', fn: card3 },
    { name: 'xiaohongshu-4-compress.png', fn: card4 },
    { name: 'xiaohongshu-5-steps.png', fn: card5 },
  ];

  for (const card of cards) {
    const buf = card.fn();
    fs.writeFileSync(outDir + card.name, buf);
    console.log(`✅ ${card.name} (${(buf.length / 1024).toFixed(0)}KB)`);
  }

  console.log(`\n共 5 张图片放在桌面：`);
  console.log('  1. xiaohongshu-cover.png      — 封面 Before/After');
  console.log('  2. xiaohongshu-2-features.png — 功能亮点');
  console.log('  3. xiaohongshu-3-privacy.png  — GPS隐私警告');
  console.log('  4. xiaohongshu-4-compress.png — 压缩效果数据');
  console.log('  5. xiaohongshu-5-steps.png    — 三步使用教程');
}

main().catch(e => { console.error(e); process.exit(1); });
