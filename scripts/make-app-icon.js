const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const S = 512;
const canvas = createCanvas(S, S);
const ctx = canvas.getContext('2d');

// Transparent background (canvas default) — corners stay transparent.

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- Tile: rounded square, dark brand background ---
const radius = 100;
ctx.fillStyle = '#0b1420';
roundRect(0, 0, S, S, radius);
ctx.fill();

// Subtle cyan top-left glow accent
const glow = ctx.createLinearGradient(0, 0, S, S);
glow.addColorStop(0, 'rgba(34,211,238,0.18)');
glow.addColorStop(0.5, 'rgba(34,211,238,0)');
glow.addColorStop(1, 'rgba(16,185,129,0.14)');
ctx.fillStyle = glow;
roundRect(0, 0, S, S, radius);
ctx.fill();

// Thin cyan border
ctx.strokeStyle = 'rgba(34,211,238,0.35)';
ctx.lineWidth = 6;
roundRect(4, 4, S - 8, S - 8, radius - 4);
ctx.stroke();

// --- Compress glyph: two inward arrows (→ ←) ---
const y = 256;
const cyan = '#22d3ee';
const green = '#10b981';

ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// Left arrow (cyan, points right)
ctx.strokeStyle = cyan;
ctx.fillStyle = cyan;
ctx.lineWidth = 44;
ctx.beginPath(); ctx.moveTo(96, y); ctx.lineTo(210, y); ctx.stroke(); // shaft
ctx.beginPath(); ctx.moveTo(250, y); ctx.lineTo(194, y - 58); ctx.lineTo(194, y + 58); ctx.closePath(); ctx.fill(); // head

// Right arrow (green, points left)
ctx.strokeStyle = green;
ctx.fillStyle = green;
ctx.beginPath(); ctx.moveTo(416, y); ctx.lineTo(302, y); ctx.stroke(); // shaft
ctx.beginPath(); ctx.moveTo(262, y); ctx.lineTo(318, y - 58); ctx.lineTo(318, y + 58); ctx.closePath(); ctx.fill(); // head

const outPath = path.join(__dirname, '..', 'public', 'app-icon-512.png');
fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
console.log('✅ App icon saved to', outPath);
