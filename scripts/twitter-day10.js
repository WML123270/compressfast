const sharp = require('sharp');
const fs = require('fs');

const OUT = 'C:/Users/Administrator/png-compressor/test-results/twitter/day10-gif-vs-mp4.png';
const W = 1200, H = 900;

async function main() {
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="topBar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>

  <!-- White background -->
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect width="${W}" height="4" fill="url(#topBar)"/>

  <!-- Title -->
  <text x="${W/2}" y="72" text-anchor="middle" font-size="42" font-weight="bold" font-family="Arial, sans-serif" fill="#0f172a">Stop Using GIFs for Screen Recordings</text>
  <text x="${W/2}" y="112" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748b">GIF is from 1987. 256 colors. No real compression.</text>

  <!-- Two giant comparison boxes -->
  <!-- GIF box (big, ugly) -->
  <rect x="80" y="170" width="480" height="420" rx="16" fill="#fef2f2" stroke="#fecaca" stroke-width="2"/>
  <rect x="80" y="170" width="480" height="50" rx="16" fill="#fee2e2"/>
  <rect x="80" y="196" width="480" height="24" fill="#fee2e2"/>
  <text x="320" y="202" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#dc2626">GIF</text>

  <!-- GIF file icon area -->
  <rect x="200" y="250" width="240" height="160" rx="12" fill="#ffffff" stroke="#fca5a5" stroke-width="1.5"/>
  <text x="320" y="295" text-anchor="middle" font-size="60" font-family="Arial, sans-serif">📼</text>
  <text x="320" y="340" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#64748b">screen-recording.gif</text>
  <text x="320" y="370" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">5 seconds · 480p</text>

  <!-- GIF size -->
  <text x="320" y="460" text-anchor="middle" font-size="56" font-weight="bold" font-family="Arial, sans-serif" fill="#dc2626">~8 MB</text>
  <text x="320" y="495" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#ef4444">256 colors · 1987 tech</text>
  <text x="320" y="525" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">No inter-frame compression</text>

  <!-- VS divider -->
  <rect x="570" y="350" width="60" height="60" rx="30" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="2"/>
  <text x="600" y="387" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial, sans-serif" fill="#64748b">VS</text>

  <!-- MP4 box (small, clean) -->
  <rect x="640" y="170" width="480" height="420" rx="16" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
  <rect x="640" y="170" width="480" height="50" rx="16" fill="#dcfce7"/>
  <rect x="640" y="196" width="480" height="24" fill="#dcfce7"/>
  <text x="880" y="202" text-anchor="middle" font-size="22" font-weight="bold" font-family="Arial, sans-serif" fill="#16a34a">MP4 / WebP</text>

  <!-- MP4 file icon area -->
  <rect x="760" y="250" width="240" height="160" rx="12" fill="#ffffff" stroke="#86efac" stroke-width="1.5"/>
  <text x="880" y="295" text-anchor="middle" font-size="60" font-family="Arial, sans-serif">🎬</text>
  <text x="880" y="340" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#64748b">screen-recording.mp4</text>
  <text x="880" y="370" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">5 seconds · 480p</text>

  <!-- MP4 size -->
  <text x="880" y="460" text-anchor="middle" font-size="56" font-weight="bold" font-family="Arial, sans-serif" fill="#16a34a">~800 KB</text>
  <text x="880" y="495" text-anchor="middle" font-size="16" font-family="Arial, sans-serif" fill="#22c55e">16.7M colors · H.264</text>
  <text x="880" y="525" text-anchor="middle" font-size="14" font-family="Arial, sans-serif" fill="#94a3b8">10x smaller, better quality</text>

  <!-- Bottom: reduction highlight -->
  <rect x="360" y="640" width="480" height="80" rx="14" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1.5"/>
  <text x="600" y="673" text-anchor="middle" font-size="22" font-family="Arial, sans-serif" fill="#64748b">That's a</text>
  <text x="600" y="705" text-anchor="middle" font-size="36" font-weight="bold" font-family="Arial, sans-serif" fill="#2563eb">90% smaller file</text>

  <!-- CTA -->
  <line x1="480" y1="760" x2="720" y2="760" stroke="#e2e8f0" stroke-width="1"/>
  <text x="${W/2}" y="795" text-anchor="middle" font-size="14" font-weight="bold" font-family="Arial, sans-serif" fill="#0891b2">compressfast.site</text>
  <text x="${W/2}" y="825" text-anchor="middle" font-size="12" font-family="Arial, sans-serif" fill="#94a3b8">Convert GIF to WebP/MP4 · 100% browser-side</text>

  <!-- Hash tags -->
  <text x="${W/2}" y="870" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#cbd5e1">#webperf #webdev</text>
</svg>`;

  await sharp({
    create: { width: W, height: H, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
  })
    .composite([
      { input: Buffer.from(svg), top: 0, left: 0 },
    ])
    .png()
    .toFile(OUT);

  console.log(`✅ Generated: ${OUT}`);
}

main().catch(console.error);
