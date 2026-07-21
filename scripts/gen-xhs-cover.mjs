/**
 * Generate Xiaohongshu cover image: Before/After compression
 * 3:4 ratio, 1080x1440
 */
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';

const OUTPUT = 'C:/Users/Administrator/Desktop/xiaohongshu-cover.png';
const W = 1080;
const H = 1440;

const BG = '#0b1420';
const CYAN = '#22d3ee';
const WHITE = '#f1f5f9';
const MUTED = '#94a3b8';
const GREEN = '#34d399';
const RED = '#ef4444';

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

async function main() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Radial glow
  const glow = ctx.createRadialGradient(W / 2, 300, 50, W / 2, 600, 800);
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i < W; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
  for (let i = 0; i < H; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

  // Title at top
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 72px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('照片太大发不出去？', W / 2, 200);

  ctx.fillStyle = CYAN;
  ctx.font = 'bold 48px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('压到 1/10，画质一点没变', W / 2, 270);

  // Divider
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 200, 310);
  ctx.lineTo(W / 2 + 200, 310);
  ctx.stroke();

  // --- BEFORE card ---
  const cardW = 380;
  const cardH = 460;
  const leftX = 100;
  const cardY = 370;

  // Before card background
  ctx.fillStyle = '#1a1020';
  roundRect(ctx, leftX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
  ctx.lineWidth = 2;
  roundRect(ctx, leftX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // Before label
  ctx.fillStyle = RED;
  ctx.font = 'bold 32px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('压缩前', leftX + cardW / 2, cardY + 60);

  // Before file icon (simulated with emoji)
  ctx.font = '120px sans-serif';
  ctx.fillText('🖼️', leftX + cardW / 2, cardY + 220);

  // Before size
  ctx.fillStyle = RED;
  ctx.font = 'bold 64px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('4.2 MB', leftX + cardW / 2, cardY + 320);

  ctx.fillStyle = MUTED;
  ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('发不出去...', leftX + cardW / 2, cardY + 370);

  // Arrow between
  ctx.fillStyle = CYAN;
  ctx.font = 'bold 80px sans-serif';
  ctx.fillText('→', W / 2, cardY + cardH / 2 + 10);

  // --- AFTER card ---
  const rightX = W - 100 - cardW;

  // After card background
  ctx.fillStyle = '#10201a';
  roundRect(ctx, rightX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, rightX, cardY, cardW, cardH, 24);
  ctx.stroke();

  // After label
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 32px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('压缩后', rightX + cardW / 2, cardY + 60);

  // After file icon
  ctx.font = '120px sans-serif';
  ctx.fillText('✨', rightX + cardW / 2, cardY + 220);

  // After size
  ctx.fillStyle = GREEN;
  ctx.font = 'bold 64px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('420 KB', rightX + cardW / 2, cardY + 320);

  ctx.fillStyle = MUTED;
  ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('肉眼无差异！', rightX + cardW / 2, cardY + 370);

  // --- Bottom features ---
  const features = [
    ['🔒', '文件不上传'],
    ['📡', '断网也能用'],
    ['📍', '清除GPS隐私'],
    ['📦', '20张批量压缩'],
  ];

  const featY = cardY + cardH + 100;
  const featGap = W / features.length;

  features.forEach((f, i) => {
    const fx = featGap * i + featGap / 2;
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f[0], fx, featY);

    ctx.fillStyle = WHITE;
    ctx.font = '24px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillText(f[1], fx, featY + 50);
  });

  // Bottom CTA
  const ctaY = featY + 130;
  ctx.fillStyle = CYAN;
  ctx.font = 'bold 40px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('jisuyatu.com', W / 2, ctaY);

  ctx.fillStyle = MUTED;
  ctx.font = '28px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText('完全免费 · 不用下载 App', W / 2, ctaY + 50);

  // Bottom glow bar
  const barGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  barGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
  barGrad.addColorStop(0.5, 'rgba(34, 211, 238, 0.5)');
  barGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = barGrad;
  ctx.fillRect(W / 2 - 200, H - 60, 400, 2);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT, buf);
  console.log(`✅ Cover saved to Desktop: xiaohongshu-cover.png (${(buf.length / 1024).toFixed(0)}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
