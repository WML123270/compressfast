/**
 * Generate Week 1 recap stats card for Twitter (16:9)
 * Usage: node scripts/gen-week1-card.mjs
 */
import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';

const OUTPUT = 'test-results/week1-recap.png';
const W = 1200;
const H = 675;

// Colors
const BG = '#0b1420';
const CARD_BG = '#101d30';
const CYAN = '#22d3ee';
const WHITE = '#f1f5f9';
const MUTED = '#64748b';
const GREEN = '#34d399';
const ORANGE = '#fb923c';

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

  // --- Background ---
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Radial glow at top-center
  const glow = ctx.createRadialGradient(W / 2, 80, 20, W / 2, 300, 600);
  glow.addColorStop(0, 'rgba(34, 211, 238, 0.10)');
  glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // --- Header ---
  ctx.fillStyle = CYAN;
  ctx.font = 'bold 32px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ CompressFast', 70, 80);

  ctx.fillStyle = WHITE;
  ctx.font = 'bold 44px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText('Week 1 Recap', 70, 135);

  // Cyan accent line under header
  const lineGrad = ctx.createLinearGradient(70, 0, 400, 0);
  lineGrad.addColorStop(0, CYAN);
  lineGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(70, 155, 330, 3);

  // --- 4 Stat Cards ---
  const cardW = 242;
  const cardH = 280;
  const cardY = 210;
  const gap = 24;
  const totalW = cardW * 4 + gap * 3;
  const startX = Math.floor((W - totalW) / 2);

  const stats = [
    { label: 'Visitors', value: '81', sub: '↑ 7/18 peak 30 UV', color: CYAN },
    { label: 'Compressed', value: '982', sub: 'all in-browser', color: GREEN },
    { label: 'Tweets', value: '6', sub: '1 per day · 7 days', color: ORANGE },
    { label: 'Revenue', value: '$24.99', sub: '1 Pro sale (real)', color: '#c084fc' },
  ];

  for (let i = 0; i < stats.length; i++) {
    const s = stats[i];
    const cx = startX + i * (cardW + gap);

    // Card border glow (subtle)
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = CARD_BG;
    roundRect(ctx, cx, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.restore();

    // Card fill
    ctx.fillStyle = CARD_BG;
    roundRect(ctx, cx, cardY, cardW, cardH, 18);
    ctx.fill();

    // Top colored stripe
    const stripeGrad = ctx.createLinearGradient(cx, 0, cx + cardW, 0);
    stripeGrad.addColorStop(0, s.color);
    stripeGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = stripeGrad;
    roundRect(ctx, cx + 20, cardY, cardW - 40, 4, 2);
    ctx.fill();

    // Value — big number
    ctx.fillStyle = WHITE;
    ctx.font = 'bold 72px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.value, cx + cardW / 2, cardY + 100);

    // Label
    ctx.fillStyle = s.color;
    ctx.font = 'bold 22px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(s.label, cx + cardW / 2, cardY + 170);

    // Subtitle
    ctx.fillStyle = MUTED;
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(s.sub, cx + cardW / 2, cardY + 210);
  }

  // --- Bottom ---
  ctx.fillStyle = MUTED;
  ctx.font = '22px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Week 2 → visual content only, no more bug hunts', W / 2, H - 75);

  ctx.fillStyle = CYAN;
  ctx.font = '18px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.fillText('compressfast.site', W / 2, H - 42);

  // --- Corner decorations ---
  // Top-right small dots
  ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(W - 60 - i * 24, 40, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom-left small dots
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(60 + i * 24, H - 40, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Save
  const buf = canvas.toBuffer('image/png');
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, buf);
  console.log(`✅ Card saved: ${OUTPUT} (${(buf.length / 1024).toFixed(0)}KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
