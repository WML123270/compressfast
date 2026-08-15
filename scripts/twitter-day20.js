const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 675;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Dark background matching site theme
ctx.fillStyle = '#0b1420';
ctx.fillRect(0, 0, W, H);

// Subtle grid pattern
ctx.strokeStyle = 'rgba(255,255,255,0.02)';
ctx.lineWidth = 1;
for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

// Header
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Lossless vs Lossy Compression', W / 2, 80);

ctx.fillStyle = '#94a3b8';
ctx.font = '22px "Segoe UI", Arial, sans-serif';
ctx.fillText('Know which one to use for your images', W / 2, 125);

// Two comparison cards
const cardW = 430, cardH = 290;
const gapX = 40;
const startX = (W - cardW * 2 - gapX) / 2;
const startY = 170;

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const cards = [
  { title: 'LOSSLESS', pct: '20–60%', label: 'smaller', sub: 'zero pixel change', use: 'logos · icons · screenshots', color: '#22d3ee' },
  { title: 'LOSSY', pct: '70–90%', label: 'smaller', sub: 'invisible to the eye', use: 'photos · web images', color: '#10b981' },
];

cards.forEach((c, i) => {
  const x = startX + i * (cardW + gapX);
  const y = startY;

  // Card background
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  roundRect(x, y, cardW, cardH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(x, y, cardW, cardH, 18);
  ctx.stroke();

  // Accent top line
  ctx.fillStyle = c.color;
  roundRect(x, y, cardW, 5, 3);
  ctx.fill();

  // Title badge
  ctx.fillStyle = c.color;
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.title, x + cardW / 2, y + 58);

  // Big percent
  ctx.fillStyle = c.color;
  ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.pct, x + cardW / 2, y + 150);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.label, x + cardW / 2, y + 195);

  // Sub
  ctx.fillStyle = '#94a3b8';
  ctx.font = '21px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.sub, x + cardW / 2, y + 235);

  // Use
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '19px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.use, x + cardW / 2, y + 268);
});

// Bottom CTA
ctx.fillStyle = '#94a3b8';
ctx.font = '20px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('CompressFast auto-detects the right one — compressfast.site', W / 2, H - 55);

// Green accent line at bottom
ctx.fillStyle = '#10b981';
ctx.fillRect(0, H - 4, W, 4);

const outPath = path.join(__dirname, '..', 'public', 'twitter-day20-lossless-lossy.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('✅ Twitter Day 20 image saved to', outPath);
