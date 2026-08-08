const { createCanvas } = require('canvas');
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
ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('5 New Format Conversion Tools', W / 2, 80);

ctx.fillStyle = '#94a3b8';
ctx.font = '22px "Segoe UI", Arial, sans-serif';
ctx.fillText('All local. No upload. Free to use.', W / 2, 125);

// Conversion pairs — visual arrows
const conversions = [
  { from: 'WebP', to: 'JPG', color: '#3b82f6', desc: 'Open downloaded web images anywhere' },
  { from: 'WebP', to: 'PNG', color: '#8b5cf6', desc: 'Keep transparency, universal format' },
  { from: 'PNG',  to: 'JPG', color: '#10b981', desc: '5MB screenshots → 300KB photos' },
  { from: 'PNG',  to: 'WebP', color: '#f59e0b', desc: '25% smaller, perfect for websites' },
  { from: 'JPG',  to: 'WebP', color: '#ef4444', desc: 'Shrink photos without quality loss' },
  { from: 'SVG',  to: 'PNG', color: '#06b6d4', desc: 'Vector to raster at any resolution' },
];

const cardW = 310, cardH = 100;
const cardsPerRow = 3;
const gapX = 24, gapY = 18;
const totalRowW = cardsPerRow * cardW + (cardsPerRow - 1) * gapX;
const startX = (W - totalRowW) / 2;
const startY = 170;

conversions.forEach((c, i) => {
  const col = i % cardsPerRow;
  const row = Math.floor(i / cardsPerRow);
  const x = startX + col * (cardW + gapX);
  const y = startY + row * (cardH + gapY);

  // Card bg
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.roundRect(x, y, cardW, cardH, 14);
  ctx.fill();

  // Left accent line
  ctx.fillStyle = c.color;
  ctx.beginPath();
  ctx.roundRect(x, y + 12, 4, cardH - 24, 2);
  ctx.fill();

  // FROM label
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FROM', x + 22, y + 34);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.from, x + 22, y + 60);

  // Arrow
  ctx.fillStyle = c.color;
  ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('→', x + cardW / 2 + 4, y + 54);

  // TO label
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('TO', x + cardW - 22, y + 34);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
  ctx.fillText(c.to, x + cardW - 22, y + 60);

  // Description
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.desc, x + cardW / 2, y + 84);
});

// Bottom CTA
const bottomY = H - 55;
ctx.strokeStyle = 'rgba(255,255,255,0.08)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W / 2 - 300, bottomY - 10);
ctx.lineTo(W / 2 + 300, bottomY - 10);
ctx.stroke();

ctx.fillStyle = '#94a3b8';
ctx.font = '18px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('100% browser-based · No files ever uploaded', W / 2, bottomY + 12);

ctx.fillStyle = '#3b82f6';
ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
ctx.fillText('compressfast.site', W / 2, bottomY + 40);

// Ensure output dir
const outDir = path.join(__dirname, '..', 'test-results', 'twitter');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outPath = path.join(outDir, 'day16-5-new-tools.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('✅ Generated:', outPath);
