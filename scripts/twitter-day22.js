const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 675;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Dark background
ctx.fillStyle = '#0b1420';
ctx.fillRect(0, 0, W, H);

// Grid
ctx.strokeStyle = 'rgba(255,255,255,0.02)';
ctx.lineWidth = 1;
for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

// Header
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Compress 30 Images at Once', W / 2, 80);

ctx.fillStyle = '#94a3b8';
ctx.font = '22px "Segoe UI", Arial, sans-serif';
ctx.fillText('Bulk, local, one ZIP — no 20/month cap', W / 2, 125);

// Three feature cards
const cardW = 300, cardH = 250;
const gapX = 20;
const startX = (W - cardW * 3 - gapX * 2) / 2;
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
  { big: '30', label: 'per batch', sub: 'free, no monthly cap', color: '#22d3ee' },
  { big: '1', label: 'drag & drop', sub: 'a whole folder at once', color: '#10b981' },
  { big: 'ZIP', label: 'bulk download', sub: 'all results in one file', color: '#a78bfa' },
];

cards.forEach((c, i) => {
  const x = startX + i * (cardW + gapX);
  const y = startY;

  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  roundRect(x, y, cardW, cardH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(x, y, cardW, cardH, 18);
  ctx.stroke();

  ctx.fillStyle = c.color;
  roundRect(x, y, cardW, 5, 3);
  ctx.fill();

  ctx.fillStyle = c.color;
  ctx.font = 'bold 66px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.big, x + cardW / 2, y + 120);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.label, x + cardW / 2, y + 168);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '19px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.sub, x + cardW / 2, y + 205);
});

// Bottom CTA
ctx.fillStyle = '#94a3b8';
ctx.font = '20px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Stop compressing one-by-one — compressfast.site', W / 2, H - 55);

ctx.fillStyle = '#10b981';
ctx.fillRect(0, H - 4, W, 4);

const outPath = path.join(__dirname, '..', 'public', 'twitter-day22-batch.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('✅ Twitter Day 22 image saved to', outPath);
