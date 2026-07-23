const { createCanvas } = require('canvas');
const fs = require('fs');

const W = 1200, H = 900;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Dark background
ctx.fillStyle = '#0b1420';
ctx.fillRect(0, 0, W, H);

// Title
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Which Format Should You Use?', W / 2, 80);

// Subtitle
ctx.fillStyle = '#94a3b8';
ctx.font = '24px "Segoe UI", Arial, sans-serif';
ctx.fillText('Quick guide to choosing the right image format', W / 2, 120);

// Format cards
const formats = [
  { name: 'PNG', desc: 'Logo, Icon, Screenshot', color: '#10b981', icon: '🖼️', tag: 'Lossless + Transparency' },
  { name: 'JPEG', desc: 'Photos, Works Everywhere', color: '#f59e0b', icon: '📷', tag: 'Universal + Small' },
  { name: 'WebP', desc: 'Web Images, Modern Sites', color: '#3b82f6', icon: '🌐', tag: '30% Smaller than JPEG' },
  { name: 'AVIF', desc: 'Smallest File, Next-Gen', color: '#8b5cf6', icon: '🧬', tag: '50% Smaller than JPEG' },
];

const cardW = 240, cardH = 280;
const startX = (W - formats.length * cardW - (formats.length - 1) * 30) / 2;
const startY = 180;

formats.forEach((fmt, i) => {
  const x = startX + i * (cardW + 30);
  const y = startY;

  // Card background
  ctx.fillStyle = '#1a2332';
  ctx.beginPath();
  ctx.roundRect(x, y, cardW, cardH, 16);
  ctx.fill();

  // Border accent
  ctx.strokeStyle = fmt.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, cardW, cardH, 16);
  ctx.stroke();

  // Icon circle
  ctx.fillStyle = fmt.color + '20';
  ctx.beginPath();
  ctx.arc(x + cardW / 2, y + 75, 45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = fmt.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + cardW / 2, y + 75, 45, 0, Math.PI * 2);
  ctx.stroke();

  // Emoji icon
  ctx.font = '40px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(fmt.icon, x + cardW / 2, y + 88);

  // Format name
  ctx.fillStyle = fmt.color;
  ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
  ctx.fillText(fmt.name, x + cardW / 2, y + 155);

  // Description
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '15px "Segoe UI", Arial, sans-serif';
  ctx.fillText(fmt.desc, x + cardW / 2, y + 185);

  // Tag
  ctx.fillStyle = fmt.color + '30';
  ctx.beginPath();
  ctx.roundRect(x + 20, y + 210, cardW - 40, 32, 8);
  ctx.fill();
  ctx.fillStyle = fmt.color;
  ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
  ctx.fillText(fmt.tag, x + cardW / 2, y + 232);
});

// Bottom CTA
ctx.fillStyle = '#64748b';
ctx.font = '20px "Segoe UI", Arial, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('Stop overthinking format choice.', W / 2, H - 70);
ctx.fillStyle = '#3b82f6';
ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
ctx.fillText('compressfast.site', W / 2, H - 38);

// Bottom line
ctx.strokeStyle = '#1e293b';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(W / 2 - 200, H - 90);
ctx.lineTo(W / 2 + 200, H - 90);
ctx.stroke();

const buf = canvas.toBuffer('image/png');
fs.writeFileSync('test-results/twitter/day8-format-guide.png', buf);
console.log('✅ Generated: test-results/twitter/day8-format-guide.png');
