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
ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Which Image Format Should You Use?', W / 2, 75);

ctx.fillStyle = '#94a3b8';
ctx.font = '22px "Segoe UI", Arial, sans-serif';
ctx.fillText('Real compression test: 1920×1080 screenshot', W / 2, 120);

// Format comparison bars
const formats = [
  { name: 'PNG (original)', size: '2.1 MB', width: 600, color: '#ef4444', barW: 100 },
  { name: 'JPEG 80%', size: '342 KB', width: 380, color: '#f59e0b', barW: 65 },
  { name: 'PNG lossless', size: '1.4 MB', width: 500, color: '#3b82f6', barW: 83 },
  { name: 'WebP 75%', size: '186 KB', width: 260, color: '#10b981', barW: 43 },
  { name: 'AVIF 50%', size: '102 KB', width: 180, color: '#8b5cf6', barW: 30 },
];

const barStartY = 170;
const barHeight = 62;
const barGap = 18;
const barLeftX = 220;

formats.forEach((f, i) => {
  const y = barStartY + i * (barHeight + barGap);

  // Format name
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(f.name, barLeftX - 16, y + barHeight / 2 + 7);

  // Bar background
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  ctx.roundRect(barLeftX, y, 500, barHeight, 10);
  ctx.fill();

  // Bar fill
  const gradient = ctx.createLinearGradient(barLeftX, 0, barLeftX + f.width * 0.7, 0);
  gradient.addColorStop(0, f.color);
  gradient.addColorStop(1, f.color + '88');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(barLeftX, y, f.width * 0.7, barHeight, 10);
  ctx.fill();

  // Size label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(f.size, barLeftX + f.width * 0.7 + 16, y + barHeight / 2 + 7);

  // Savings badge for WebP and AVIF
  if (f.name.includes('WebP') || f.name.includes('AVIF')) {
    const pct = f.name.includes('WebP') ? '-91%' : '-95%';
    ctx.fillStyle = f.color + '30';
    const badgeW = 70;
    ctx.beginPath();
    ctx.roundRect(barLeftX + f.width * 0.7 + f.size.length * 12 + 48, y + (barHeight - 28) / 2, badgeW, 28, 14);
    ctx.fill();
    ctx.fillStyle = f.color;
    ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
    ctx.fillText(pct, barLeftX + f.width * 0.7 + f.size.length * 12 + 48 + badgeW / 2, y + barHeight / 2 + 5);
    ctx.textAlign = 'center';
  }
});

// Bottom CTA
ctx.fillStyle = '#94a3b8';
ctx.font = '18px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Drag, drop, done — compressfast.site — all in your browser', W / 2, H - 40);

// Blue accent line at bottom
ctx.fillStyle = '#3b82f6';
ctx.fillRect(0, H - 4, W, 4);

const outPath = path.join(__dirname, '..', 'public', 'twitter-day17-format-guide.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('✅ Twitter Day 17 image saved to', outPath);
